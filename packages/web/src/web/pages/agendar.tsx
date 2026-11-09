import { useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { AnimatePresence, motion } from "motion/react";
import {
  Building2,
  Truck,
  Tractor,
  CreditCard,
  QrCode,
  Barcode,
  Wallet,
  Minus,
  Plus,
  Check,
  ArrowLeft,
  ArrowRight,
  Loader2,
  MapPin,
} from "lucide-react";
import { Footer, PageHero } from "../components/layout";
import { useCatalog, useCreateOrder, useSlots } from "../queries/lab";
import { brl, CATEGORY_LABEL, fmtDate, nextBusinessDays, toISO } from "../lib/format";

type Delivery = "lab" | "correio" | "coleta";
type Pay = "cartao" | "pix" | "boleto" | "entrega";

const STEPS = ["Análises", "Seus dados", "Entrega", "Pagamento"];

export default function AgendarPage() {
  const search = new URLSearchParams(useSearch());
  const pre = search.get("a");
  const [, navigate] = useLocation();
  const catalog = useCatalog();
  const create = useCreateOrder();

  const [step, setStep] = useState(0);
  const [qty, setQty] = useState<Record<string, number>>(pre ? { [pre]: 1 } : {});
  const [cat, setCat] = useState<"solo" | "agua" | "nematoides">(
    pre?.startsWith("agua") ? "agua" : pre?.startsWith("nema") ? "nematoides" : "solo",
  );
  const [form, setForm] = useState({
    customerName: "",
    email: "",
    phone: "",
    document: "",
    propertyName: "",
    city: "",
    state: "",
    notes: "",
  });
  const [delivery, setDelivery] = useState<Delivery>("lab");
  const [date, setDate] = useState<string | undefined>();
  const [slot, setSlot] = useState<string | undefined>();
  const [pickupAddress, setPickupAddress] = useState("");
  const [pay, setPay] = useState<Pay>("pix");
  const [error, setError] = useState<string | null>(null);
  const [accept, setAccept] = useState(false);
  const [touched, setTouched] = useState(false);

  const onlyDigits = (v: string) => v.replace(/\D/g, "");
  const errors: Partial<Record<keyof typeof form, string>> = {};
  if (form.customerName.trim().length < 2) errors.customerName = "Informe o nome ou razão social.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errors.email = "Informe um e-mail válido.";
  const ph = onlyDigits(form.phone).length;
  if (ph < 10 || ph > 13) errors.phone = "Informe DDD + número (ex.: 27 99999-0000).";
  if (form.document && ![11, 14].includes(onlyDigits(form.document).length)) errors.document = "CPF deve ter 11 dígitos e CNPJ 14.";
  if (form.state && !/^[A-Za-z]{2}$/.test(form.state)) errors.state = "UF com 2 letras.";

  const analyses = catalog.data?.analyses ?? [];
  const pickupFee = catalog.data?.pickupFee ?? 0;
  const selected = analyses.filter((a) => qty[a.id]);
  const subtotal = selected.reduce((s, a) => s + a.price * qty[a.id], 0);
  const fee = delivery === "coleta" ? pickupFee : 0;
  const days = useMemo(() => nextBusinessDays(10), []);
  const slots = useSlots(delivery === "correio" ? undefined : date, delivery === "coleta" ? "coleta" : "lab");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const canNext = [
    selected.length > 0,
    Object.keys(errors).length === 0,
    delivery === "correio" || (Boolean(date && slot) && (delivery !== "coleta" || pickupAddress.trim().length > 5)),
    accept,
  ][step];

  function change(id: string, d: number) {
    setQty((q) => {
      const n = Math.max(0, Math.min(200, (q[id] ?? 0) + d));
      const next = { ...q };
      if (n === 0) delete next[id];
      else next[id] = n;
      return next;
    });
  }

  function submit() {
    setError(null);
    create.mutate(
      {
        ...form,
        items: selected.map((a) => ({ analysisId: a.id, quantity: qty[a.id] })),
        deliveryMethod: delivery,
        deliveryDate: date,
        deliverySlot: slot,
        pickupAddress,
        paymentMethod: pay,
        acceptTerms: true as const,
      },
      {
        onSuccess: (r) => navigate(`/acompanhar/${r.code}?novo=1`),
        onError: (e) => {
          const issues = (e as { data?: { issues?: { message: string }[] } }).data?.issues;
          setError(issues?.length ? issues.map((i) => i.message).join(" ") : e.message || "Não foi possível concluir. Tente novamente.");
        },
      },
    );
  }

  return (
    <div className="bg-cream">
      <PageHero eyebrow="Agendamento" title={<>Agende sua <span className="brand-text">análise</span></>} />
      <section className="relative z-10 mx-auto -mt-14 grid max-w-[1200px] gap-6 px-5 pb-28 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[30px] bg-paper p-5 card-shadow md:p-9">
          {/* stepper */}
          <ol className="mb-9 flex items-center gap-2">
            {STEPS.map((s, i) => (
              <li key={s} className="flex flex-1 items-center gap-2">
                <button
                  disabled={i > step}
                  onClick={() => setStep(i)}
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold transition ${
                    i < step ? "brand-gradient text-white" : i === step ? "bg-ink text-white" : "bg-cream text-muted-ink"
                  }`}
                >
                  {i < step ? <Check className="size-4" /> : i + 1}
                </button>
                <span className={`hidden text-sm font-semibold sm:block ${i === step ? "text-ink" : "text-muted-ink"}`}>{s}</span>
                {i < STEPS.length - 1 && <span className={`h-px flex-1 ${i < step ? "bg-brand-teal" : "bg-ink/10"}`} />}
              </li>
            ))}
          </ol>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && (
                <div>
                  <h2 className="text-2xl font-semibold">Quais análises você precisa?</h2>
                  <p className="mt-1 text-sm text-muted-ink">Informe a quantidade de amostras de cada uma.</p>
                  <div className="mt-6 flex gap-1.5">
                    {(["solo", "agua", "nematoides"] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => setCat(c)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${cat === c ? "bg-ink text-white" : "bg-cream text-muted-ink"}`}
                      >
                        {CATEGORY_LABEL[c]}
                        {analyses.filter((a) => a.category === c && qty[a.id]).length > 0 && (
                          <span className="ml-1.5 inline-block size-1.5 rounded-full bg-mint align-middle" />
                        )}
                      </button>
                    ))}
                  </div>
                  {catalog.isLoading ? (
                    <Loader2 className="mx-auto mt-10 size-6 animate-spin text-brand-teal" />
                  ) : (
                    <div className="mt-5 space-y-3">
                      {analyses
                        .filter((a) => a.category === cat)
                        .map((a) => {
                          const n = qty[a.id] ?? 0;
                          return (
                            <div
                              key={a.id}
                              className={`flex flex-col gap-4 rounded-2xl border p-4 transition sm:flex-row sm:items-center ${
                                n ? "border-brand-teal bg-brand-teal/[0.05]" : "border-ink/10"
                              }`}
                            >
                              <div className="flex-1">
                                <p className="font-semibold">{a.name}</p>
                                <p className="mt-0.5 text-sm text-muted-ink">
                                  {brl(a.price)} / amostra · {a.turnaroundDays} dias úteis
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => change(a.id, -1)} disabled={!n} className="grid size-9 place-items-center rounded-full bg-cream disabled:opacity-40">
                                  <Minus className="size-4" />
                                </button>
                                <input
                                  aria-label="Quantidade"
                                  value={n}
                                  onChange={(e) => change(a.id, (parseInt(e.target.value) || 0) - n)}
                                  className="w-12 rounded-lg bg-transparent text-center font-semibold outline-none"
                                />
                                <button onClick={() => change(a.id, 1)} className="grid size-9 place-items-center rounded-full bg-ink text-white">
                                  <Plus className="size-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {step === 1 && (
                <div>
                  <h2 className="text-2xl font-semibold">Seus dados</h2>
                  <p className="mt-1 text-sm text-muted-ink">Usamos para emitir o laudo e falar com você.</p>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <L label="Nome / Razão social *"><input aria-label="Nome / Razão social" className="field" value={form.customerName} onChange={set("customerName")} />{touched && errors.customerName && <Err>{errors.customerName}</Err>}</L>
                    <L label="CPF / CNPJ"><input aria-label="CPF / CNPJ" className="field" value={form.document} onChange={set("document")} />{touched && errors.document && <Err>{errors.document}</Err>}</L>
                    <L label="E-mail *"><input aria-label="E-mail" type="email" className="field" value={form.email} onChange={set("email")} />{touched && errors.email && <Err>{errors.email}</Err>}</L>
                    <L label="WhatsApp / telefone *"><input aria-label="(00) 00000-0000" className="field" placeholder="(00) 00000-0000" value={form.phone} onChange={set("phone")} />{touched && errors.phone && <Err>{errors.phone}</Err>}</L>
                    <L label="Propriedade / fazenda"><input aria-label="Propriedade / fazenda" className="field" value={form.propertyName} onChange={set("propertyName")} /></L>
                    <div className="grid grid-cols-[1fr_90px] gap-3">
                      <L label="Cidade"><input aria-label="Cidade" className="field" value={form.city} onChange={set("city")} /></L>
                      <L label="UF"><input aria-label="UF" maxLength={2} className="field uppercase" value={form.state} onChange={set("state")} />{touched && errors.state && <Err>{errors.state}</Err>}</L>
                    </div>
                    <div className="sm:col-span-2">
                      <L label="Observações (cultura, talhões, histórico)">
                        <textarea aria-label="Observações (cultura, talhões, histórico)" rows={3} className="field" value={form.notes} onChange={set("notes")} />
                      </L>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="text-2xl font-semibold">Como vai entregar a amostra?</h2>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {[
                      { v: "lab" as const, i: Building2, t: "No laboratório", d: "Escolha dia e horário" },
                      { v: "correio" as const, i: Truck, t: "Correio / transportadora", d: "Envie e informe o rastreio" },
                      { v: "coleta" as const, i: Tractor, t: "Coleta na propriedade", d: `+ ${brl(pickupFee)}` },
                    ].map((o) => (
                      <Choice key={o.v} active={delivery === o.v} onClick={() => { setDelivery(o.v); setSlot(undefined); }} icon={o.i} title={o.t} desc={o.d} />
                    ))}
                  </div>

                  {delivery === "correio" ? (
                    <div className="mt-7 rounded-2xl bg-cream p-5 text-sm">
                      <p className="flex items-center gap-2 font-semibold"><MapPin className="size-4 text-brand-teal" /> Endereço para envio</p>
                      <p className="mt-2 text-muted-ink">
                        {catalog.data?.labAddress.name}<br />
                        {catalog.data?.labAddress.street}<br />
                        {catalog.data?.labAddress.city} · CEP {catalog.data?.labAddress.zip}
                      </p>
                      <p className="mt-3 text-muted-ink">Depois de postar, você pode informar o código de rastreio pelo link enviado no seu WhatsApp e e-mail.</p>
                    </div>
                  ) : (
                    <div className="mt-7">
                      <p className="text-sm font-semibold">{delivery === "lab" ? "Dia da entrega" : "Dia da coleta"}</p>
                      <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                        {days.map((d) => {
                          const iso = toISO(d);
                          return (
                            <button
                              key={iso}
                              onClick={() => { setDate(iso); setSlot(undefined); }}
                              className={`flex w-[72px] shrink-0 flex-col items-center rounded-2xl border py-3 transition ${
                                date === iso ? "border-ink bg-ink text-white" : "border-ink/10 hover:border-ink/30"
                              }`}
                            >
                              <span className="text-[11px] uppercase opacity-70">{d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</span>
                              <span className="text-xl font-bold">{d.getDate()}</span>
                              <span className="text-[11px] opacity-70">{d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span>
                            </button>
                          );
                        })}
                      </div>
                      {date && (
                        <>
                          <p className="mt-5 text-sm font-semibold">{delivery === "lab" ? "Horário" : "Período"}</p>
                          {slots.isLoading ? (
                            <Loader2 className="mt-4 size-5 animate-spin text-brand-teal" />
                          ) : (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {slots.data?.map((s) => (
                                <button
                                  key={s.slot}
                                  disabled={!s.available}
                                  onClick={() => setSlot(s.slot)}
                                  className={`rounded-full border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:line-through disabled:opacity-40 ${
                                    slot === s.slot ? "border-brand-teal bg-brand-teal text-white" : "border-ink/15 hover:border-ink/40"
                                  }`}
                                >
                                  {s.slot}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                      {delivery === "coleta" && (
                        <div className="mt-6">
                          <L label="Endereço / localização da propriedade *">
                            <textarea aria-label="Rodovia, km, ponto de referência ou link do Google Maps"
                              rows={3}
                              className="field"
                              placeholder="Rodovia, km, ponto de referência ou link do Google Maps"
                              value={pickupAddress}
                              onChange={(e) => setPickupAddress(e.target.value)}
                            />
                          </L>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="text-2xl font-semibold">Forma de pagamento</h2>
                  <p className="mt-1 text-sm text-muted-ink">Você conclui o pagamento na próxima tela.</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {[
                      { v: "pix" as const, i: QrCode, t: "Pix", d: "Aprovação imediata" },
                      { v: "cartao" as const, i: CreditCard, t: "Cartão de crédito", d: "Checkout seguro Stripe" },
                      { v: "boleto" as const, i: Barcode, t: "Boleto", d: "Compensa em até 2 dias úteis" },
                      { v: "entrega" as const, i: Wallet, t: "Pagar na entrega", d: "No balcão ou na coleta" },
                    ].map((o) => (
                      <Choice key={o.v} active={pay === o.v} onClick={() => setPay(o.v)} icon={o.i} title={o.t} desc={o.d} row />
                    ))}
                  </div>
                  <label className="mt-7 flex cursor-pointer items-start gap-3 rounded-2xl border border-ink/10 bg-cream/60 p-4 text-sm">
                    <input
                      type="checkbox"
                      checked={accept}
                      onChange={(e) => setAccept(e.target.checked)}
                      className="mt-0.5 size-4 shrink-0 accent-[#2ba89a]"
                    />
                    <span className="text-ink/80">
                      Li e aceito os{" "}
                      <Link to="/termos" target="_blank" className="font-semibold text-brand-teal underline">Termos de Uso</Link> e a{" "}
                      <Link to="/privacidade" target="_blank" className="font-semibold text-brand-teal underline">Política de Privacidade</Link>.
                      Autorizo o tratamento dos meus dados pessoais e dos dados da propriedade para execução das análises,
                      emissão do laudo, cobrança e comunicação sobre este pedido, conforme a LGPD (Lei 13.709/2018).
                    </span>
                  </label>
                  {error && <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 flex items-center justify-between border-t border-ink/10 pt-6">
            <button
              onClick={() => setStep((s) => s - 1)}
              className={`inline-flex items-center gap-1.5 text-sm font-semibold text-muted-ink hover:text-ink ${step === 0 ? "invisible" : ""}`}
            >
              <ArrowLeft className="size-4" /> Voltar
            </button>
            {step < 3 ? (
              <button
                disabled={step !== 1 && !canNext}
                onClick={() => {
                  if (step === 1 && !canNext) return setTouched(true);
                  setStep((s) => s + 1);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-semibold text-white transition hover:bg-ink-2 disabled:opacity-40"
              >
                Continuar <ArrowRight className="size-4" />
              </button>
            ) : (
              <button
                disabled={create.isPending || !accept}
                onClick={submit}
                className="inline-flex items-center gap-2 rounded-full brand-gradient px-7 py-3 font-semibold text-white shadow-lg shadow-brand-teal/30 disabled:opacity-60"
              >
                {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                Confirmar agendamento
              </button>
            )}
          </div>
        </div>

        {/* summary */}
        <aside className="h-fit rounded-[30px] bg-ink p-7 text-white lg:sticky lg:top-6">
          <h3 className="text-lg font-semibold">Resumo</h3>
          {selected.length === 0 ? (
            <p className="mt-4 text-sm text-white/50">Nenhuma análise selecionada.</p>
          ) : (
            <ul className="mt-5 space-y-3 text-sm">
              {selected.map((a) => (
                <li key={a.id} className="flex justify-between gap-3">
                  <span className="text-white/75">
                    {qty[a.id]}× {a.name}
                    <span className="block text-xs text-white/40">{CATEGORY_LABEL[a.category]}</span>
                  </span>
                  <span className="font-medium">{brl(a.price * qty[a.id])}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 space-y-2 border-t border-white/10 pt-5 text-sm">
            <Row k="Subtotal" v={brl(subtotal)} />
            {delivery === "coleta" && <Row k="Taxa de coleta na propriedade" v={brl(fee)} />}
            {step >= 2 && (
              <p className="pt-1 text-xs text-white/50">
                {delivery === "correio" ? "Envio por correio" : date ? `${fmtDate(date)}${slot ? ` · ${slot}` : ""}` : "Escolha a data"}
              </p>
            )}
          </div>
          <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-5">
            <span className="text-sm text-white/60">Total</span>
            <span className="text-3xl font-bold">{brl(subtotal + fee)}</span>
          </div>
        </aside>
      </section>
      <Footer />
    </div>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-ink/80">{label}</span>
      {children}
    </label>
  );
}

function Err({ children }: { children: React.ReactNode }) {
  return <span className="mt-1 block text-xs font-medium text-red-600">{children}</span>;
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/60">{k}</span>
      <span>{v}</span>
    </div>
  );
}

function Choice({
  active,
  onClick,
  icon: Icon,
  title,
  desc,
  row,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  row?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex rounded-2xl border p-4 text-left transition ${row ? "items-center gap-4" : "flex-col gap-3"} ${
        active ? "border-brand-teal bg-brand-teal/[0.06] ring-4 ring-brand-teal/10" : "border-ink/10 hover:border-ink/30"
      }`}
    >
      <span className={`grid size-11 place-items-center rounded-xl ${active ? "brand-gradient text-white" : "bg-cream text-ink"}`}>
        <Icon className="size-5" />
      </span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-xs text-muted-ink">{desc}</span>
      </span>
      {active && <Check className="absolute right-3 top-3 size-4 text-brand-teal" />}
    </button>
  );
}
