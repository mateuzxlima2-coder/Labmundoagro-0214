export const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
};

export const fmtDateTime = (d: Date | string) =>
  new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Próximos N dias úteis a partir de amanhã. */
export function nextBusinessDays(n: number) {
  const out: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (out.length < n) {
    d.setDate(d.getDate() + 1);
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) out.push(new Date(d));
  }
  return out;
}

export const CATEGORY_LABEL = { solo: "Solo", agua: "Água", nematoides: "Nematoides" } as const;

export const DELIVERY_LABEL: Record<string, string> = {
  lab: "Entrega no laboratório",
  correio: "Envio por correio / transportadora",
  coleta: "Coleta na propriedade",
};

export const PAYMENT_LABEL: Record<string, string> = {
  cartao: "Cartão de crédito",
  pix: "Pix",
  boleto: "Boleto",
  entrega: "Pagar na entrega",
};

export const STATUS_LABEL: Record<string, string> = {
  agendado: "Agendado",
  pago: "Pagamento confirmado",
  rastreio: "Rastreio informado",
  recebida: "Amostra recebida",
  em_analise: "Em análise",
  laudo_pronto: "Concluído",
  cancelado: "Cancelado",
};
