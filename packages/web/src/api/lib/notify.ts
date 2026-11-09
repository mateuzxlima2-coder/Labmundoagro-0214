import { db } from "../database";
import * as schema from "../database/schema";
import { notifyStatus } from "./email";

type OrderLike = { id: number; code: string; customerName: string; email: string; phone: string };

const WA_COPY: Record<string, string> = {
  agendado: "seu agendamento foi confirmado. Assim que a amostra chegar ao laboratório, avisaremos por aqui.",
  pago: "confirmamos o pagamento do seu pedido.",
  recebida: "sua amostra chegou ao laboratório e foi registrada.",
  em_analise: "sua amostra já está em análise pela nossa equipe técnica.",
  laudo_pronto: "sua análise foi concluída! O laudo em PDF está disponível no link abaixo e também foi enviado para o seu e-mail.",
  cancelado: "seu pedido foi cancelado. Se tiver dúvidas, responda esta mensagem.",
};

/** Normaliza para o formato internacional usado pelo wa.me (assume Brasil se vier sem DDI). */
export function waPhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  return d.length <= 11 ? `55${d}` : d;
}

function siteUrl() {
  return (process.env.WEBSITE_URL ?? "").replace(/\/$/, "");
}

export function whatsappMessage(o: OrderLike, status: string, note?: string | null) {
  const first = o.customerName.trim().split(/\s+/)[0];
  const body = WA_COPY[status];
  if (!body) return null;
  const lines = [
    `Olá, ${first}! Aqui é o Laboratório Mundo Agro.`,
    `Pedido ${o.code}: ${body}`,
    note ? `Obs.: ${note}` : "",
    `Acompanhe: ${siteUrl()}/acompanhar/${o.code}`,
  ].filter(Boolean);
  return lines.join("\n\n");
}

/**
 * Notifica o cliente por e-mail (Resend, real quando configurado) e WhatsApp (SIMULADO —
 * não há API do WhatsApp conectada; gera um link wa.me como alternativa manual).
 * Nunca lança erro.
 */
export async function notifyClient(o: OrderLike, status: string, note?: string | null) {
  const email = await notifyStatus(o, status, note);
  const message = whatsappMessage(o, status, note);
  const phone = waPhone(o.phone);
  const link = message ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : null;

  if (message) console.info(`[whatsapp:simulado] para +${phone} — ${status}`);

  try {
    const rows: (typeof schema.notifications.$inferInsert)[] = [
      {
        orderId: o.id,
        channel: "email",
        status,
        result: email.sent ? "enviado" : "falhou",
        detail: email.sent ? o.email : `${o.email} — ${email.reason ?? "erro"}`,
      },
    ];
    if (message) rows.push({ orderId: o.id, channel: "whatsapp", status, result: "simulado", detail: `+${phone}`, message });
    await db.insert(schema.notifications).values(rows);
  } catch (e) {
    console.error("[notify] falha ao registrar notificação:", e);
  }

  return {
    emailSent: email.sent,
    emailReason: email.reason,
    whatsapp: message ? { simulated: true as const, phone: `+${phone}`, link: link!, message } : null,
  };
}
