import { useEffect, useRef, useState } from "react";
import { useLocation, useParams, useSearch } from "wouter";
import { motion } from "motion/react";
import {
  Search,
  Loader2,
  PartyPopper,
  Copy,
  Check,
  CalendarCheck,
  CreditCard,
  PackageCheck,
  Microscope,
  FileText,
  Truck,
  Building2,
  Tractor,
  MapPin,
  Tag,
  Printer,
  Download,
} from "lucide-react";
import { Footer, PageHero } from "../components/layout";
import { PaymentPanel } from "../components/payment-panel";
import { useAddTracking, useCatalog, useReportUrl, useTrack, useVerifyStripe } from "../queries/lab";
import { brl, DELIVERY_LABEL, fmtDate, fmtDateTime, PAYMENT_LABEL, STATUS_LABEL } from "../lib/format";

export default function AcompanharPage() {
  const params = useParams<{ code?: string }>();
  const code = params.code?.toUpperCase();
  return (
    <div className="bg-cream">
      <PageHero
        eyebrow="Acompanhamento"
        title={code ? <>Pedido <span className="brand-text">{code}</span></> : <>Acompanhe sua <span className="brand-text">amostra</span></>}
        subtitle={code ? undefined : "Digite o código recebido no agendamento (ex.: MA-7K3F9Q)."}
      />
      <section className="relative z-10 mx-auto -mt-14 max-w-[1100px] px-5 pb-28">
        <SearchBox initial={code} />
        {code && <OrderView code={code} />}
      </section>
      <Footer />
    </div>
  );
}

function SearchBox({ initial }: { initial?: string }) {
  const [v, setV] = useState(initial ?? "");
  const [, navigate] = useLocation();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (v.trim()) navigate(`/acompanhar/${v.trim().toUpperCase()}`);
      }}
      className="mx-auto flex max-w-xl gap-2 rounded-full bg-paper p-2 card-shadow"
    >
      <input aria-label="Campo"
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="MA-XXXXXX"
        className="flex-1 bg-transparent px-5 font-semibold uppercase tracking-wider outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-ink/60"
      />
      <button className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">
        <Search className="size-4" /> Buscar
      </button>
    </form>
  );
}

const TIMELINE = [
  { key: "agendado", label: "Agendado", icon: CalendarCheck },
  { key: "pago", label: "Pagamento", icon: CreditCard },
  { key: "recebida", label: "Amostra recebida", icon: PackageCheck },
  { key: "em_analise", label: "Em análise", icon: Microscope },
  { key: "laudo_pronto", label: "Laudo pronto", icon: FileText },
];
const ORDER = ["agendado", "recebida", "em_analise", "laudo_pronto"];

function OrderView({ code }: { code: string }) {
  const search = new URLSearchParams(useSearch());
  const isNew = search.get("novo") === "1";
  const sessionId = search.get("session_id");
  const track = useTrack(code);
  const catalog = useCatalog();
  const verify = useVerifyStripe();
  const verified = useRef(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (sessionId && !verified.current) {
      verified.current = true;
      verify.mutate({ code, sessionId });
    }
  }, [sessionId, code, verify]);

  if (track.isLoading)
    return <div className="grid place-items-center py-24"><Loader2 className="size-6 animate-spin text-brand-teal" /></div>;
  if (track.error || !track.data)
    return (
      <div className="mx-auto mt-10 max-w-xl rounded-[24px] bg-paper p-8 text-center card-shadow">
        <p className="text-lg font-semibold">Código não encontrado</p>
        <p className="mt-2 text-sm text-muted-ink">Confira se digitou certo. O código começa com “MA-”.</p>
      </div>
    );

  const o = track.data;
  const paid = o.paymentStatus === "pago";
  const idx = ORDER.indexOf(o.status);
  const done = (k: string) => (k === "pago" ? paid : ORDER.indexOf(k) <= idx && idx >= 0);
  const eventFor = (k: string) => [...o.events].reverse().find((e) => e.status === k);
  const DIcon = o.deliveryMethod === "lab" ? Building2 : o.deliveryMethod === "correio" ? Truck : Tractor;

  return (
    <div className="mt-10 space-y-6">
      {isNew && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-start gap-5 rounded-[28px] brand-gradient p-7 text-white sm:flex-row sm:items-center"
        >
          <PartyPopper className="size-10 shrink-0" />
          <div className="flex-1">
            <p className="text-xl font-semibold">Agendamento confirmado!</p>
            <p className="text-sm text-white/85">
              Guarde seu código. Ele identifica as amostras e serve para acompanhar o pedido.
            </p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(o.code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 font-mono text-lg font-bold tracking-wider text-ink"
          >
            {o.code} {copied ? <Check className="size-4 text-brand-green" /> : <Copy className="size-4" />}
          </button>
        </motion.div>
      )}

      {o.status === "cancelado" && (
        <div className="rounded-2xl bg-red-50 px-5 py-4 text-sm font-medium text-red-700">Este pedido foi cancelado.</div>
      )}

      {/* timeline */}
      <div className="rounded-[28px] bg-paper p-6 card-shadow md:p-8">
        <div className="grid gap-6 md:grid-cols-5">
          {TIMELINE.map((t, i) => {
            const ok = done(t.key);
            const ev = eventFor(t.key);
            return (
              <div key={t.key} className="relative flex gap-4 md:flex-col md:items-center md:text-center">
                {i < TIMELINE.length - 1 && (
                  <span
                    className={`absolute left-5 top-12 h-[calc(100%-8px)] w-px md:left-[calc(50%+28px)] md:top-5 md:h-px md:w-[calc(100%-32px)] ${
                      ok && done(TIMELINE[i + 1].key) ? "bg-brand-teal" : "bg-ink/10"
                    }`}
                  />
                )}
                <span
                  className={`relative grid size-10 shrink-0 place-items-center rounded-full ${
                    ok ? "brand-gradient text-white shadow-lg shadow-brand-teal/30" : "bg-cream text-muted-ink"
                  }`}
                >
                  <t.icon className="size-[18px]" />
                </span>
                <div>
                  <p className={`text-sm font-semibold ${ok ? "text-ink" : "text-muted-ink"}`}>{t.label}</p>
                  <p className="text-xs text-muted-ink">
                    {ev ? fmtDateTime(ev.createdAt) : t.key === "pago" && !paid ? PAYMENT_LABEL[o.paymentMethod] : "—"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {o.hasReport && <ReportCard code={o.code} name={o.reportName} at={o.reportUploadedAt} />}

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-6">
          <PaymentPanel code={o.code} total={o.total} method={o.paymentMethod} paid={paid} />

          {/* instructions */}
          <div className="rounded-[24px] bg-paper p-6 card-shadow md:p-7">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Como preparar a amostra</h3>
              <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-teal">
                <Printer className="size-4" /> Imprimir
              </button>
            </div>
            <div className="mt-4 flex gap-3 rounded-2xl bg-ink p-4 text-white">
              <Tag className="mt-0.5 size-5 shrink-0 text-mint" />
              <p className="text-sm text-white/80">
                Escreva <b className="font-mono text-white">{o.code}</b> em cada saco ou frasco, junto com o nome do talhão/ponto
                e a profundidade (ex.: <span className="font-mono">{o.code} · T3 · 0–20</span>).
              </p>
            </div>
            <ul className="mt-4 space-y-3">
              {o.items.map((it) => {
                const a = catalog.data?.analyses.find((x) => x.id === it.analysisId);
                return (
                  <li key={it.id} className="rounded-2xl border border-ink/10 p-4">
                    <p className="text-sm font-semibold">{it.quantity}× {it.name}</p>
                    {a && <p className="mt-1 text-sm text-muted-ink">{a.sampleInfo}</p>}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[24px] bg-paper p-6 card-shadow md:p-7">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl brand-gradient text-white"><DIcon className="size-5" /></span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-ink">Entrega</p>
                <p className="font-semibold">{DELIVERY_LABEL[o.deliveryMethod]}</p>
              </div>
            </div>
            {o.deliveryMethod !== "correio" && (
              <p className="mt-5 rounded-2xl bg-cream px-4 py-3 text-sm">
                <b>{fmtDate(o.deliveryDate)}</b> · {o.deliverySlot}
              </p>
            )}
            {o.deliveryMethod === "lab" && catalog.data && (
              <p className="mt-3 flex gap-2 text-sm text-muted-ink">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand-teal" />
                {catalog.data.labAddress.street}, {catalog.data.labAddress.city}
              </p>
            )}
            {o.deliveryMethod === "coleta" && (
              <p className="mt-3 flex gap-2 text-sm text-muted-ink">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand-teal" /> {o.pickupAddress}
              </p>
            )}
            {o.deliveryMethod === "correio" && <TrackingForm code={o.code} current={o.trackingCode} address={catalog.data?.labAddress} />}
          </div>

          <div className="rounded-[24px] bg-ink p-6 text-white md:p-7">
            <h3 className="font-semibold">Resumo do pedido</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {o.items.map((it) => (
                <li key={it.id} className="flex justify-between gap-3">
                  <span className="text-white/70">{it.quantity}× {it.name}</span>
                  <span>{brl(it.unitPrice * it.quantity)}</span>
                </li>
              ))}
              {o.deliveryFee > 0 && (
                <li className="flex justify-between"><span className="text-white/70">Coleta</span><span>{brl(o.deliveryFee)}</span></li>
              )}
            </ul>
            <div className="mt-4 flex justify-between border-t border-white/10 pt-4">
              <span className="text-white/60">Total</span>
              <span className="text-xl font-bold">{brl(o.total)}</span>
            </div>
            <div className="mt-5 space-y-1 text-xs text-white/50">
              <p>{o.customerName} · {o.email}</p>
              {o.propertyName && <p>{o.propertyName}{o.city ? ` — ${o.city}/${o.state ?? ""}` : ""}</p>}
            </div>
          </div>

          <div className="rounded-[24px] bg-paper p-6 card-shadow">
            <h3 className="text-sm font-semibold">Histórico</h3>
            <ul className="mt-3 space-y-2.5">
              {[...o.events].reverse().map((e) => (
                <li key={e.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-teal" />
                  <span>
                    <b className="font-semibold">{STATUS_LABEL[e.status] ?? e.status}</b>
                    {e.note && <span className="text-muted-ink"> — {e.note}</span>}
                    <span className="block text-xs text-muted-ink">{fmtDateTime(e.createdAt)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackingForm({
  code,
  current,
  address,
}: {
  code: string;
  current: string | null;
  address?: { name: string; street: string; city: string; zip: string };
}) {
  const [v, setV] = useState(current ?? "");
  const add = useAddTracking();
  return (
    <div className="mt-5 space-y-4">
      {address && (
        <div className="rounded-2xl bg-cream p-4 text-sm text-muted-ink">
          <p className="font-semibold text-ink">Envie para</p>
          {address.name}<br />{address.street}<br />{address.city} · CEP {address.zip}
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          add.mutate({ code, trackingCode: v });
        }}
        className="space-y-2"
      >
        <p className="text-[13px] font-semibold">Código de rastreio</p>
        <div className="flex gap-2">
          <input aria-label="AA123456789BR" className="field uppercase" placeholder="AA123456789BR" value={v} onChange={(e) => setV(e.target.value)} />
          <button
            disabled={add.isPending || v.trim().length < 5}
            className="shrink-0 rounded-xl bg-ink px-4 text-sm font-semibold text-white disabled:opacity-40"
          >
            {add.isPending ? <Loader2 className="size-4 animate-spin" /> : current ? "Atualizar" : "Salvar"}
          </button>
        </div>
        {current && <p className="text-xs text-brand-green">Rastreio registrado: {current}</p>}
        {add.error && <p className="text-xs text-red-600">{add.error.message}</p>}
      </form>
    </div>
  );
}

function ReportCard({ code, name, at }: { code: string; name: string | null; at: Date | null }) {
  const get = useReportUrl();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5 rounded-[28px] bg-ink p-7 text-white sm:flex-row sm:items-center"
    >
      <span className="grid size-14 shrink-0 place-items-center rounded-2xl brand-gradient">
        <FileText className="size-7" />
      </span>
      <div className="flex-1">
        <p className="text-xl font-semibold">Seu laudo está pronto</p>
        <p className="text-sm text-white/65">
          {name ?? "Laudo.pdf"}
          {at ? ` · emitido em ${fmtDateTime(at)}` : ""}
        </p>
        {get.error && <p className="mt-2 text-sm text-red-300">{get.error.message}</p>}
      </div>
      <button
        disabled={get.isPending}
        onClick={() => get.mutate({ code }, { onSuccess: (r) => { window.location.href = r.url; } })}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-mint px-6 py-3.5 font-semibold text-ink disabled:opacity-60"
      >
        {get.isPending ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Baixar laudo (PDF)
      </button>
    </motion.div>
  );
}
