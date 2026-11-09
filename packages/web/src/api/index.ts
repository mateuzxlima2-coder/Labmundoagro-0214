import type { RouterClient } from "@orpc/server";
import { createApp } from "./__core/app";
import { ping } from "./routes/ping";
import { catalog } from "./routes/catalog";
import { orders } from "./routes/orders";
import { getStripe, markPaid, payments } from "./routes/payments";
import { db } from "./database";
import * as schema from "./database/schema";
import { eq } from "drizzle-orm";
import { admin } from "./routes/admin";

export const router = {
  ping,
  catalog,
  orders,
  payments,
  admin,
};

export type AppRouter = typeof router;
/** Typed client for the router — used by the web and mobile api clients. */
export type AppRouterClient = RouterClient<AppRouter>;

const app = createApp(router);

// Webhook Stripe (opcional, recomendado em produção): confirma pagamentos mesmo
// se o cliente fechar a aba antes de voltar ao site. Requer STRIPE_WEBHOOK_SECRET.
app.post("/api/webhooks/stripe", async (c) => {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return c.json({ error: "Stripe não configurada" }, 400);
  const sig = c.req.header("stripe-signature");
  if (!sig) return c.json({ error: "Assinatura ausente" }, 400);
  const raw = await c.req.text();
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, secret);
  } catch {
    return c.json({ error: "Assinatura inválida" }, 400);
  }
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    const code = session.metadata?.code;
    if (code && session.payment_status === "paid") {
      const [order] = await db.select().from(schema.orders).where(eq(schema.orders.code, code));
      if (order) await markPaid(order.id, "cartão de crédito");
    }
  }
  return c.json({ received: true }, 200);
});

export default app;
