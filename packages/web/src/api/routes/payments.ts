import { z } from "zod";
import { eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import Stripe from "stripe";
import { base } from "../__core/app";
import { db } from "../database";
import * as schema from "../database/schema";
import { addEvent } from "./orders";
import { notifyClient } from "../lib/notify";

function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key) : null;
}

async function loadOrder(code: string) {
  const [order] = await db.select().from(schema.orders).where(eq(schema.orders.code, code.trim().toUpperCase()));
  if (!order) throw new ORPCError("NOT_FOUND", { message: "Pedido não encontrado." });
  return order;
}

export async function markPaid(orderId: number, via: string) {
  const [o] = await db.select().from(schema.orders).where(eq(schema.orders.id, orderId));
  if (!o || o.paymentStatus === "pago") return;
  await db.update(schema.orders).set({ paymentStatus: "pago" }).where(eq(schema.orders.id, orderId));
  await addEvent(orderId, "pago", `Pagamento confirmado (${via})`);
  await notifyClient(o, "pago", `Forma de pagamento: ${via}.`);
}

export function getStripe() {
  return stripe();
}

export const payments = {
  config: base.handler(() => ({ stripeEnabled: Boolean(process.env.STRIPE_SECRET_KEY) })),

  createCheckout: base.input(z.object({ code: z.string() })).handler(async ({ input, context }) => {
    const order = await loadOrder(input.code);
    if (order.paymentStatus === "pago") return { url: null, demo: false, alreadyPaid: true };
    const s = stripe();
    if (!s) return { url: null, demo: true, alreadyPaid: false };
    const origin = context.headers.get("origin") ?? process.env.WEBSITE_URL ?? "";
    const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((i) => ({
      quantity: i.quantity,
      price_data: { currency: "brl", unit_amount: i.unitPrice, product_data: { name: `Análise — ${i.name}` } },
    }));
    if (order.deliveryFee > 0)
      line_items.push({
        quantity: 1,
        price_data: { currency: "brl", unit_amount: order.deliveryFee, product_data: { name: "Coleta na propriedade" } },
      });
    const session = await s.checkout.sessions.create({
      mode: "payment",
      line_items,
      customer_email: order.email,
      metadata: { code: order.code },
      success_url: `${origin.replace(/\/$/, "")}/acompanhar/${order.code}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin.replace(/\/$/, "")}/acompanhar/${order.code}`,
    });
    await db.update(schema.orders).set({ stripeSessionId: session.id }).where(eq(schema.orders.id, order.id));
    return { url: session.url, demo: false, alreadyPaid: false };
  }),

  verifyStripe: base.input(z.object({ code: z.string(), sessionId: z.string() })).handler(async ({ input }) => {
    const order = await loadOrder(input.code);
    const s = stripe();
    if (!s || order.stripeSessionId !== input.sessionId) return { paid: order.paymentStatus === "pago" };
    const session = await s.checkout.sessions.retrieve(input.sessionId);
    if (session.payment_status === "paid") {
      await markPaid(order.id, "cartão de crédito");
      return { paid: true };
    }
    return { paid: false };
  }),

  /** Pix / boleto / cartão de demonstração — simulados até a integração real. */
  confirmSimulated: base
    .input(z.object({ code: z.string(), method: z.enum(["pix", "boleto", "cartao"]) }))
    .handler(async ({ input }) => {
      const order = await loadOrder(input.code);
      if (input.method === "cartao" && process.env.STRIPE_SECRET_KEY)
        throw new ORPCError("BAD_REQUEST", { message: "Use o checkout do cartão." });
      const label = { pix: "Pix (simulado)", boleto: "boleto (simulado)", cartao: "cartão (demonstração)" }[input.method];
      await markPaid(order.id, label);
      return { paid: true };
    }),

  setMethod: base
    .input(z.object({ code: z.string(), method: z.enum(["cartao", "pix", "boleto", "entrega"]) }))
    .handler(async ({ input }) => {
      const order = await loadOrder(input.code);
      if (order.paymentStatus === "pago") throw new ORPCError("BAD_REQUEST", { message: "Pedido já pago." });
      await db.update(schema.orders).set({ paymentMethod: input.method }).where(eq(schema.orders.id, order.id));
      return { ok: true };
    }),
};
