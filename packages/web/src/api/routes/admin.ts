import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { timingSafeEqual } from "node:crypto";
import { base } from "../__core/app";
import { db } from "../database";
import * as schema from "../database/schema";
import { CATALOG } from "../catalog";
import { getCatalog } from "../lib/pricing";
import { notifyClient } from "../lib/notify";
import { headObject, MAX_REPORT_BYTES, presignGet, presignPut } from "../lib/s3";
import { addEvent } from "./orders";
import { markPaid } from "./payments";

const keyed = z.object({ key: z.string().min(1) });

/** A senha vem obrigatoriamente de ADMIN_PASSWORD no .env — sem fallback. */
function check(key: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || expected.length < 8)
    throw new ORPCError("PRECONDITION_FAILED", {
      message: "ADMIN_PASSWORD não configurada no servidor (mínimo 8 caracteres).",
    });
  const a = Buffer.from(key);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new ORPCError("UNAUTHORIZED", { message: "Senha incorreta." });
}

async function getOrder(id: number) {
  const [o] = await db.select().from(schema.orders).where(eq(schema.orders.id, id));
  if (!o) throw new ORPCError("NOT_FOUND", { message: "Pedido não encontrado." });
  return o;
}

export const admin = {
  login: base.input(keyed).handler(({ input }) => {
    check(input.key);
    return { ok: true };
  }),

  list: base.input(keyed).handler(async ({ input }) => {
    check(input.key);
    const orders = await db.select().from(schema.orders).orderBy(desc(schema.orders.createdAt));
    const items = await db.select().from(schema.orderItems);
    const notes = await db.select().from(schema.notifications).orderBy(desc(schema.notifications.createdAt));
    return orders.map(({ stripeSessionId: _s, reportKey, ...o }) => ({
      ...o,
      hasReport: Boolean(reportKey),
      items: items.filter((i) => i.orderId === o.id),
      notifications: notes.filter((n) => n.orderId === o.id).slice(0, 12),
    }));
  }),

  /** Gera URL de upload direto para o storage. Valida tipo e tamanho antes. */
  presignReport: base
    .input(
      keyed.extend({
        id: z.number(),
        filename: z.string().min(1).max(200),
        contentType: z.string(),
        size: z.number().int().positive(),
      }),
    )
    .handler(async ({ input }) => {
      check(input.key);
      const order = await getOrder(input.id);
      if (input.contentType !== "application/pdf" || !/\.pdf$/i.test(input.filename))
        throw new ORPCError("BAD_REQUEST", { message: "Envie apenas arquivos PDF." });
      if (input.size > MAX_REPORT_BYTES) throw new ORPCError("BAD_REQUEST", { message: "O PDF deve ter no máximo 20 MB." });
      const objectKey = `laudos/${order.code}/${Date.now()}.pdf`;
      const url = await presignPut(objectKey, "application/pdf");
      return { url, objectKey };
    }),

  reportUrl: base.input(keyed.extend({ id: z.number() })).handler(async ({ input }) => {
    check(input.key);
    const o = await getOrder(input.id);
    if (!o.reportKey) throw new ORPCError("NOT_FOUND", { message: "Sem laudo anexado." });
    return { url: await presignGet(o.reportKey, o.reportName ?? `Laudo-${o.code}.pdf`) };
  }),

  updateStatus: base
    .input(
      keyed.extend({
        id: z.number(),
        status: z.enum(["agendado", "recebida", "em_analise", "laudo_pronto", "cancelado"]),
        note: z.string().trim().max(500).optional(),
        reportKey: z.string().optional(),
        reportName: z.string().max(200).optional(),
      }),
    )
    .handler(async ({ input }) => {
      check(input.key);
      const order = await getOrder(input.id);
      const patch: Partial<typeof schema.orders.$inferInsert> = { status: input.status };

      if (input.reportKey) {
        if (!input.reportKey.startsWith(`laudos/${order.code}/`))
          throw new ORPCError("BAD_REQUEST", { message: "Arquivo de laudo inválido para este pedido." });
        const head = await headObject(input.reportKey);
        if (!head) throw new ORPCError("BAD_REQUEST", { message: "O upload do PDF não foi concluído. Tente novamente." });
        if (head.size > MAX_REPORT_BYTES) throw new ORPCError("BAD_REQUEST", { message: "O PDF deve ter no máximo 20 MB." });
        patch.reportKey = input.reportKey;
        patch.reportName = input.reportName ?? `Laudo-${order.code}.pdf`;
        patch.reportUploadedAt = new Date();
      }
      if (input.status === "laudo_pronto" && !order.reportKey && !input.reportKey)
        throw new ORPCError("BAD_REQUEST", { message: "Anexe o PDF do laudo para marcar como “Concluído”." });

      const statusChanged = order.status !== input.status;
      await db.update(schema.orders).set(patch).where(eq(schema.orders.id, order.id));
      if (statusChanged) await addEvent(order.id, input.status, input.note || undefined);
      // Notifica quando o status muda, ou quando o laudo de um pedido já concluído é substituído.
      if (statusChanged || (input.reportKey && input.status === "laudo_pronto")) {
        const n = await notifyClient(order, input.status, input.note);
        return { ok: true, notified: true, ...n };
      }
      return { ok: true, notified: false, emailSent: false, emailReason: undefined, whatsapp: null };
    }),

  markPaid: base.input(keyed.extend({ id: z.number() })).handler(async ({ input }) => {
    check(input.key);
    await markPaid(input.id, "confirmado pelo laboratório");
    return { ok: true };
  }),

  prices: base.input(keyed).handler(async ({ input }) => {
    check(input.key);
    return getCatalog();
  }),

  updatePrices: base
    .input(
      keyed.extend({
        prices: z
          .array(
            z.object({
              analysisId: z.string(),
              price: z.number().int().min(100, "Preço mínimo R$ 1,00.").max(10_000_000, "Preço acima do limite."),
            }),
          )
          .min(1),
      }),
    )
    .handler(async ({ input }) => {
      check(input.key);
      for (const p of input.prices) {
        if (!CATALOG.some((c) => c.id === p.analysisId))
          throw new ORPCError("BAD_REQUEST", { message: `Análise inválida: ${p.analysisId}` });
      }
      for (const p of input.prices) {
        await db
          .insert(schema.analysisPrices)
          .values({ analysisId: p.analysisId, price: p.price, updatedAt: new Date() })
          .onConflictDoUpdate({ target: schema.analysisPrices.analysisId, set: { price: p.price, updatedAt: new Date() } });
      }
      return getCatalog();
    }),

  resetPrices: base.input(keyed).handler(async ({ input }) => {
    check(input.key);
    await db.delete(schema.analysisPrices);
    return getCatalog();
  }),
};
