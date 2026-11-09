import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { CreditCard, QrCode, Barcode, Wallet, Copy, Check, Loader2, Lock, CheckCircle2 } from "lucide-react";
import { useConfirmSimulated, useCreateCheckout, usePaymentConfig, useSetPaymentMethod } from "../queries/lab";
import { brl } from "../lib/format";

type Method = "cartao" | "pix" | "boleto" | "entrega";

interface Props {
  code: string;
  total: number;
  method: string;
  paid: boolean;
}

function pixPayload(code: string, total: number) {
  // Payload ilustrativo no formato EMV (simulação)
  const amount = (total / 100).toFixed(2);
  return `00020126520014BR.GOV.BCB.PIX0130mundoagrolaboratorio@gmail.com52040000530398654${String(amount.length).padStart(2, "0")}${amount}5802BR5916MUNDO AGRO LAB6009PINHEIROS62${String(code.length + 4).padStart(2, "0")}05${String(code.length).padStart(2, "0")}${code}6304ABCD`;
}

export function PaymentPanel({ code, total, method, paid }: Props) {
  const [tab, setTab] = useState<Method>((method as Method) ?? "pix");
  const setMethod = useSetPaymentMethod();
  const confirm = useConfirmSimulated();
  const checkout = useCreateCheckout();
  const config = usePaymentConfig();
  const [qr, setQr] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [card, setCard] = useState({ n: "", exp: "", cvc: "", name: "" });
  const pix = pixPayload(code, total);
  const boleto = `23793.38128 60${code.slice(3, 6).replace(/\D/g, "7")}0.000003 ${String(total).padStart(5, "0")}1.234567 8 ${String(10000 + total).slice(-4)}${String(total).padStart(10, "0")}`;

  useEffect(() => {
    QRCode.toDataURL(pix, { margin: 1, width: 220, color: { dark: "#062a2f", light: "#ffffff" } }).then(setQr);
  }, [pix]);

  if (paid) {
    return (
      <div className="flex items-center gap-4 rounded-[24px] bg-brand-green/10 p-6">
        <CheckCircle2 className="size-10 shrink-0 text-brand-green" />
        <div>
          <p className="text-lg font-semibold">Pagamento confirmado</p>
          <p className="text-sm text-muted-ink">{brl(total)} recebido. Agora é só entregar a amostra.</p>
        </div>
      </div>
    );
  }

  function choose(m: Method) {
    setTab(m);
    setMethod.mutate({ code, method: m });
  }

  function copy(text: string) {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const tabs = [
    { v: "pix" as const, i: QrCode, t: "Pix" },
    { v: "cartao" as const, i: CreditCard, t: "Cartão" },
    { v: "boleto" as const, i: Barcode, t: "Boleto" },
    { v: "entrega" as const, i: Wallet, t: "Na entrega" },
  ];

  return (
    <div className="rounded-[24px] border border-ink/10 bg-white p-5 md:p-7">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Pagamento</h3>
        <span className="text-2xl font-bold">{brl(total)}</span>
      </div>
      <div className="mt-5 grid grid-cols-4 gap-1.5 rounded-2xl bg-cream p-1.5">
        {tabs.map((t) => (
          <button
            key={t.v}
            onClick={() => choose(t.v)}
            className={`flex flex-col items-center gap-1 rounded-xl py-2.5 text-xs font-semibold transition sm:flex-row sm:justify-center sm:gap-2 sm:text-sm ${
              tab === t.v ? "bg-ink text-white" : "text-muted-ink hover:text-ink"
            }`}
          >
            <t.i className="size-4" /> {t.t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "pix" && (
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="rounded-2xl border border-ink/10 p-3">
              {qr ? <img src={qr} alt="QR Code Pix" className="size-44" /> : <div className="size-44 animate-pulse rounded-xl bg-cream" />}
            </div>
            <div className="w-full flex-1 space-y-3">
              <p className="text-sm text-muted-ink">Escaneie o QR Code no app do seu banco ou use o Pix copia e cola.</p>
              <div className="flex gap-2">
                <input aria-label="Código para pagamento" readOnly value={pix} className="field truncate text-xs" />
                <button onClick={() => copy(pix)} className="grid size-12 shrink-0 place-items-center rounded-xl bg-cream">
                  {copied ? <Check className="size-4 text-brand-green" /> : <Copy className="size-4" />}
                </button>
              </div>
              <SimButton loading={confirm.isPending} onClick={() => confirm.mutate({ code, method: "pix" })} label="Já paguei — simular confirmação" />
              <p className="text-[11px] text-muted-ink">Pix em modo de simulação: nenhum valor é cobrado.</p>
            </div>
          </div>
        )}

        {tab === "boleto" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-ink">Vencimento em 3 dias. A compensação pode levar até 2 dias úteis.</p>
            <div className="rounded-2xl bg-cream p-4 font-mono text-[13px] tracking-wide">{boleto}</div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => copy(boleto.replace(/\D/g, ""))} className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2.5 text-sm font-semibold">
                {copied ? <Check className="size-4 text-brand-green" /> : <Copy className="size-4" />} Copiar linha digitável
              </button>
              <SimButton loading={confirm.isPending} onClick={() => confirm.mutate({ code, method: "boleto" })} label="Simular compensação" />
            </div>
            <p className="text-[11px] text-muted-ink">Boleto em modo de simulação: nenhum valor é cobrado.</p>
          </div>
        )}

        {tab === "cartao" &&
          (config.isLoading ? (
            <Loader2 className="size-5 animate-spin text-brand-teal" />
          ) : config.data?.stripeEnabled ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-ink">Você será direcionado ao checkout seguro da Stripe e voltará para esta página.</p>
              <button
                disabled={checkout.isPending}
                onClick={() =>
                  checkout.mutate(
                    { code },
                    { onSuccess: (r) => { if (r.url) window.location.href = r.url; } },
                  )
                }
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-semibold text-white disabled:opacity-60"
              >
                {checkout.isPending ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />} Pagar {brl(total)} com cartão
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
                Modo demonstração: a integração Stripe ainda não foi ativada. Nenhum valor é cobrado.
              </div>
              <input aria-label="Número do cartão" className="field" placeholder="Número do cartão" value={card.n} onChange={(e) => setCard({ ...card, n: e.target.value })} />
              <input aria-label="Nome impresso" className="field" placeholder="Nome impresso" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input aria-label="MM/AA" className="field" placeholder="MM/AA" value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} />
                <input aria-label="CVC" className="field" placeholder="CVC" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} />
              </div>
              <SimButton
                loading={confirm.isPending}
                disabled={card.n.replace(/\D/g, "").length < 12}
                onClick={() => confirm.mutate({ code, method: "cartao" })}
                label={`Pagar ${brl(total)}`}
              />
            </div>
          ))}

        {tab === "entrega" && (
          <div className="rounded-2xl bg-cream p-5 text-sm text-muted-ink">
            Você paga <b className="text-ink">{brl(total)}</b> no momento da entrega da amostra no laboratório ou para o técnico na
            coleta, com Pix, cartão ou dinheiro. Para envio por correio, a cobrança é enviada por e-mail quando a amostra chegar.
          </div>
        )}
      </div>
      {confirm.error && <p className="mt-3 text-sm text-red-600">{confirm.error.message}</p>}
    </div>
  );
}

function SimButton({ loading, onClick, label, disabled }: { loading: boolean; onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      disabled={loading || disabled}
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full brand-gradient px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} {label}
    </button>
  );
}
