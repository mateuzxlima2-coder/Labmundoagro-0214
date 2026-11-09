import { z } from "zod";
import { and, asc, eq, ne } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { base } from "../__core/app";
import { db } from "../database";
import * as schema from "../database/schema";
import {
  LAB_SLOTS,
  LAB_SLOT_CAPACITY,
  PICKUP_FEE,
  PICKUP_SLOTS,
  PICKUP_SLOT_CAPACITY,
  TERMS_VERSION,
} from "../catalog";
import { getCatalog } from "../lib/pricing";
import { notifyClient } from "../lib/notify";
import { presignGet } from "../lib/s3";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function makeCode() {
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `MA-${s}`;
}

const digits = (s: string) => s.replace(/\D/g, "");

async function findOrder(code: string) {
  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.code, code.trim().toUpperCase()));
  if (!order) throw new ORPCError("NOT_FOUND", { message: "Código não encontrado." });
  return order;
}

export async function getOrderByCode(code: string) {
  const order = await findOrder(code);
  const items = await db.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, order.id));
  const events = await db
    .select()
    .from(schema.statusEvents)
    .where(eq(schema.statusEvents.orderId, order.id))
    .orderBy(asc(schema.statusEvents.createdAt));
  const { stripeSessionId: _s, reportKey, ...safe } = order;
  return { ...safe, hasReport: Boolean(reportKey) && order.status === "laudo_pronto", items, events };
}

export async function addEvent(orderId: number, status: string, note?: string) {
  await db.insert(schema.statusEvents).values({ orderId, status, note });
}

const trimmed = (min: number, max: number, msg: string) => z.string().trim().min(min, msg).max(max, "Texto muito longo.");
const optional = (max: number) => z.string().trim().max(max, "Texto muito longo.").optional();

const createInput = z
  .object({
    items: z
      .array(z.object({ analysisId: z.string(), quantity: z.number().int().min(1).max(200) }))
      .min(1, "Selecione pelo menos uma análise."),
    customerName: trimmed(2, 120, "Informe o nome."),
    email: z.string().trim().toLowerCase().email("E-mail inválido.").max(160),
    phone: z.string().refine((v) => digits(v).length >= 10 && digits(v).length <= 13, "Telefone inválido."),
    document: z
      .string()
      .optional()
      .refine((v) => !v || [11, 14].includes(digits(v).length), "CPF (11 dígitos) ou CNPJ (14 dígitos) inválido."),
    propertyName: optional(120),
    city: optional(80),
    state: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || /^[A-Za-z]{2}$/.test(v), "UF deve ter 2 letras."),
    deliveryMethod: z.enum(["lab", "correio", "coleta"]),
    deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    deliverySlot: z.string().optional(),
    pickupAddress: optional(500),
    paymentMethod: z.enum(["cartao", "pix", "boleto", "entrega"]),
    notes: optional(1000),
    acceptTerms: z.literal(true, { message: "É necessário aceitar os Termos de Uso e a Política de Privacidade." }),
  })
  .superRefine((v, ctx) => {
    if (v.deliveryMethod === "coleta" && (!v.pickupAddress || v.pickupAddress.length < 6))
      ctx.addIssue({ code: "custom", path: ["pickupAddress"], message: "Informe o endereço da coleta." });
    if (v.deliveryMethod !== "correio" && (!v.deliveryDate || !v.deliverySlot))
      ctx.addIssue({ code: "custom", path: ["deliveryDate"], message: "Escolha data e horário." });
  });

export const orders = {
  create: base.input(createInput).handler(async ({ input }) => {
    const catalog = await getCatalog();
    const merged = new Map<string, number>();
    for (const it of input.items) merged.set(it.analysisId, (merged.get(it.analysisId) ?? 0) + it.quantity);
    const items = [...merged].map(([analysisId, quantity]) => {
      const a = catalog.find((c) => c.id === analysisId);
      if (!a) throw new ORPCError("BAD_REQUEST", { message: `Análise inválida: ${analysisId}` });
      return { a, quantity };
    });

    if (input.deliveryMethod !== "correio") {
      const date = input.deliveryDate!;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [y, m, d] = date.split("-").map(Number);
      const day = new Date(y, m - 1, d);
      if (day <= today || day.getDay() === 0 || day.getDay() === 6)
        throw new ORPCError("BAD_REQUEST", { message: "Escolha um dia útil a partir de amanhã." });
      const slots = input.deliveryMethod === "lab" ? LAB_SLOTS : PICKUP_SLOTS;
      if (!slots.includes(input.deliverySlot!)) throw new ORPCError("BAD_REQUEST", { message: "Horário inválido." });
      const cap = input.deliveryMethod === "lab" ? LAB_SLOT_CAPACITY : PICKUP_SLOT_CAPACITY;
      const taken = await db
        .select({ id: schema.orders.id })
        .from(schema.orders)
        .where(
          and(
            eq(schema.orders.deliveryDate, date),
            eq(schema.orders.deliverySlot, input.deliverySlot!),
            eq(schema.orders.deliveryMethod, input.deliveryMethod),
            ne(schema.orders.status, "cancelado"),
          ),
        );
      if (taken.length >= cap) throw new ORPCError("CONFLICT", { message: "Esse horário acabou de lotar. Escolha outro." });
    }

    const subtotal = items.reduce((s, i) => s + i.a.price * i.quantity, 0);
    const deliveryFee = input.deliveryMethod === "coleta" ? PICKUP_FEE : 0;

    let code = makeCode();
    for (let i = 0; i < 5; i++) {
      const [exists] = await db.select({ id: schema.orders.id }).from(schema.orders).where(eq(schema.orders.code, code));
      if (!exists) break;
      code = makeCode();
    }

    const [order] = await db
      .insert(schema.orders)
      .values({
        code,
        customerName: input.customerName,
        email: input.email,
        phone: input.phone.trim(),
        document: input.document?.trim() || null,
        propertyName: input.propertyName || null,
        city: input.city || null,
        state: input.state?.toUpperCase() || null,
        deliveryMethod: input.deliveryMethod,
        deliveryDate: input.deliveryMethod === "correio" ? null : input.deliveryDate,
        deliverySlot: input.deliveryMethod === "correio" ? null : input.deliverySlot,
        pickupAddress: input.deliveryMethod === "coleta" ? input.pickupAddress : null,
        paymentMethod: input.paymentMethod,
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee,
        notes: input.notes || null,
        consentAt: new Date(),
        consentVersion: TERMS_VERSION,
      })
      .returning();

    await db.insert(schema.orderItems).values(
      items.map((i) => ({
        orderId: order.id,
        analysisId: i.a.id,
        name: i.a.name,
        category: i.a.category,
        unitPrice: i.a.price,
        quantity: i.quantity,
      })),
    );
    await addEvent(order.id, "agendado", "Agendamento realizado pelo site");
    await notifyClient(order, "agendado");
    return { code: order.code, subtotal, deliveryFee, total: order.total, email: order.email, phone: order.phone, customerName: order.customerName };
  }),

  track: base.input(z.object({ code: z.string().min(3) })).handler(({ input }) => getOrderByCode(input.code)),

  /** Link temporário (5 min) para baixar o laudo. Exige o código do pedido. */
  reportUrl: base.input(z.object({ code: z.string().min(3) })).handler(async ({ input }) => {
    const order = await findOrder(input.code);
    if (order.status !== "laudo_pronto" || !order.reportKey)
      throw new ORPCError("NOT_FOUND", { message: "O laudo ainda não está disponível." });
    const url = await presignGet(order.reportKey, order.reportName ?? `Laudo-${order.code}.pdf`);
    return { url };
  }),

  addTracking: base
    .input(
      z.object({
        code: z.string(),
        trackingCode: z
          .string()
          .trim()
          .min(5, "Código de rastreio muito curto.")
          .max(40)
          .regex(/^[A-Za-z0-9-]+$/, "Use apenas letras e números."),
      }),
    )
    .handler(async ({ input }) => {
      const order = await findOrder(input.code);
      if (order.deliveryMethod !== "correio") throw new ORPCError("BAD_REQUEST", { message: "Este pedido não é por envio." });
      const t = input.trackingCode.toUpperCase();
      await db.update(schema.orders).set({ trackingCode: t }).where(eq(schema.orders.id, order.id));
      await addEvent(order.id, "rastreio", `Rastreio informado: ${t}`);
      return { ok: true };
    }),
};
