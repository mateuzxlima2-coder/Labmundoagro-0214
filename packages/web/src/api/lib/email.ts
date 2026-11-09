import { Resend } from "resend";
import { LAB_ADDRESS, LAB_CONTACT } from "../catalog";

const STATUS_COPY: Record<string, { subject: string; title: string; body: string }> = {
  agendado: {
    subject: "Agendamento confirmado",
    title: "Seu agendamento foi confirmado",
    body: "Recebemos seu pedido. Identifique cada amostra com o código abaixo e siga as instruções da página de acompanhamento.",
  },
  pago: {
    subject: "Pagamento confirmado",
    title: "Pagamento confirmado",
    body: "Recebemos o pagamento do seu pedido. Agora é só entregar a amostra conforme o agendamento.",
  },
  recebida: {
    subject: "Amostra recebida",
    title: "Sua amostra chegou ao laboratório",
    body: "A amostra foi recebida e registrada. Em breve ela entra na fila de análise.",
  },
  em_analise: {
    subject: "Amostra em análise",
    title: "Sua amostra está em análise",
    body: "Nossa equipe técnica já está processando a sua amostra.",
  },
  laudo_pronto: {
    subject: "Análise concluída — seu laudo está disponível",
    title: "Laudo disponível para download",
    body: "O laudo da sua análise foi emitido. Acesse a página do pedido para visualizar e baixar o PDF.",
  },
  cancelado: {
    subject: "Pedido cancelado",
    title: "Seu pedido foi cancelado",
    body: "Se tiver dúvidas, responda este e-mail ou fale conosco pelo WhatsApp.",
  },
};

function siteUrl() {
  return (process.env.WEBSITE_URL ?? "").replace(/\/$/, "");
}

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

function template(name: string, code: string, title: string, body: string, note?: string | null) {
  const link = `${siteUrl()}/acompanhar/${code}`;
  return `<!doctype html><html><body style="margin:0;background:#f5f2ea;font-family:Arial,Helvetica,sans-serif;color:#0e1f22">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
  <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffdf8;border-radius:20px;overflow:hidden">
    <tr><td style="background:#062a2f;padding:28px 32px;color:#fff;font-size:18px;font-weight:bold">Laboratório Mundo Agro</td></tr>
    <tr><td style="height:4px;background:linear-gradient(90deg,#11a04b,#2ba89a,#1673c4)"></td></tr>
    <tr><td style="padding:32px">
      <p style="margin:0 0 6px;color:#5b6b6d;font-size:14px">Olá, ${esc(name)}</p>
      <h1 style="margin:0 0 16px;font-size:24px">${esc(title)}</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6">${esc(body)}</p>
      ${note ? `<p style="margin:0 0 16px;padding:12px 16px;background:#f5f2ea;border-radius:12px;font-size:14px">${esc(note)}</p>` : ""}
      <p style="margin:0 0 24px;font-size:14px">Código do pedido: <b style="font-family:monospace;font-size:16px">${esc(code)}</b></p>
      <a href="${link}" style="display:inline-block;background:#062a2f;color:#fff;text-decoration:none;padding:14px 26px;border-radius:999px;font-weight:bold">Ver pedido${title.includes("Laudo") ? " e baixar laudo" : ""}</a>
    </td></tr>
    <tr><td style="padding:20px 32px;border-top:1px solid #eee;color:#5b6b6d;font-size:12px;line-height:1.6">
      ${esc(LAB_ADDRESS.street)} — ${esc(LAB_ADDRESS.city)} · CEP ${LAB_ADDRESS.zip}<br>
      WhatsApp ${esc(LAB_CONTACT.phone)} · ${esc(LAB_CONTACT.email)}<br>
      Você recebe este e-mail porque agendou uma análise conosco. Seus dados são tratados conforme a LGPD.
    </td></tr>
  </table></td></tr></table></body></html>`;
}

/** Envia notificação de status. Nunca lança erro: falha de e-mail não pode quebrar o fluxo do pedido. */
export async function notifyStatus(o: { email: string; customerName: string; code: string }, status: string, note?: string | null) {
  const copy = STATUS_COPY[status];
  if (!copy) return { sent: false, reason: "status sem e-mail" };
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn(`[email] RESEND_API_KEY não configurada — e-mail "${copy.subject}" para ${o.email} não enviado.`);
    return { sent: false, reason: "RESEND_API_KEY ausente" };
  }
  try {
    const resend = new Resend(key);
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "Laboratório Mundo Agro <onboarding@resend.dev>",
      to: [o.email],
      replyTo: LAB_CONTACT.email,
      subject: `${copy.subject} — ${o.code}`,
      html: template(o.customerName, o.code, copy.title, copy.body, note),
    });
    if (error) throw new Error(error.message);
    return { sent: true };
  } catch (e) {
    console.error("[email] falha ao enviar:", e);
    return { sent: false, reason: (e as Error).message };
  }
}
