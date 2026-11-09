import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  Loader2,
  Lock,
  LogOut,
  Search,
  CheckCircle2,
  ExternalLink,
  FileUp,
  FileText,
  Download,
  X,
  Mail,
  AlertTriangle,
  RotateCcw,
  Save,
  ClipboardList,
  Tags,
} from "lucide-react";
import { Logo } from "../components/layout";
import {
  MAX_REPORT_MB,
  useAdminLogin,
  useAdminMarkPaid,
  useAdminOrders,
  useAdminPrices,
  useAdminReportUrl,
  useAdminResetPrices,
  useAdminUpdatePrices,
  useAdminUpdateStatus,
  useUploadReport,
} from "../queries/admin";
import { brl, CATEGORY_LABEL, DELIVERY_LABEL, fmtDate, fmtDateTime, PAYMENT_LABEL, STATUS_LABEL } from "../lib/format";

const STATUSES = ["agendado", "recebida", "em_analise", "laudo_pronto", "cancelado"] as const;
type Status = (typeof STATUSES)[number];
const STATUS_COLOR: Record<string, string> = {
  agendado: "bg-slate-100 text-slate-700",
  recebida: "bg-sky-100 text-sky-800",
  em_analise: "bg-amber-100 text-amber-800",
  laudo_pronto: "bg-emerald-100 text-emerald-800",
  cancelado: "bg-red-100 text-red-700",
};

type Toast = { kind: "ok" | "warn" | "err"; text: string } | null;

export default function AdminPage() {
  const [key, setKey] = useState<string | null>(() => sessionStorage.getItem("ma-admin"));
  if (!key) return <Login onOk={(k) => { sessionStorage.setItem("ma-admin", k); setKey(k); }} />;
  return <Dashboard adminKey={key} onLogout={() => { sessionStorage.removeItem("ma-admin"); setKey(null); }} />;
}

function Login({ onOk }: { onOk: (k: string) => void }) {
  const [v, setV] = useState("");
  const login = useAdminLogin();
  return (
    <div className="hero-glow grain relative grid min-h-screen place-items-center px-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          login.mutate({ key: v }, { onSuccess: () => onOk(v) });
        }}
        className="relative z-10 w-full max-w-sm rounded-[28px] bg-paper p-8 card-shadow"
      >
        <Logo light={false} />
        <h1 className="mt-8 text-2xl font-semibold">Área do laboratório</h1>
        <p className="mt-1 text-sm text-muted-ink">Acesso restrito à equipe.</p>
        <input aria-label="Senha" type="password" className="field mt-6" placeholder="Senha" value={v} onChange={(e) => setV(e.target.value)} />
        {login.error && <p className="mt-2 text-sm text-red-600">{login.error.message}</p>}
        <button disabled={login.isPending || !v} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3 font-semibold text-white disabled:opacity-50">
          {login.isPending ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />} Entrar
        </button>
      </form>
    </div>
  );
}

function Dashboard({ adminKey, onLogout }: { adminKey: string; onLogout: () => void }) {
  const [tab, setTab] = useState<"pedidos" | "precos">("pedidos");
  const [toast, setToast] = useState<Toast>(null);
  const orders = useAdminOrders(adminKey);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const code = (orders.error as { code?: string } | null)?.code;
    if (code === "UNAUTHORIZED") onLogout();
  }, [orders.error, onLogout]);

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-ink">
        <div className="mx-auto flex h-20 max-w-[1300px] items-center justify-between px-5">
          <Logo />
          <button onClick={onLogout} className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white">
            <LogOut className="size-4" /> Sair
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-[1300px] px-5 py-10">
        <div className="flex w-fit gap-1.5 rounded-full bg-paper p-1.5 card-shadow">
          {[
            { v: "pedidos" as const, t: "Pedidos", i: ClipboardList },
            { v: "precos" as const, t: "Gerenciar tabela de preços", i: Tags },
          ].map((t) => (
            <button
              key={t.v}
              onClick={() => setTab(t.v)}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                tab === t.v ? "bg-ink text-white" : "text-muted-ink hover:text-ink"
              }`}
            >
              <t.i className="size-4" /> {t.t}
            </button>
          ))}
        </div>
        {tab === "pedidos" ? <Orders adminKey={adminKey} onToast={setToast} /> : <Prices adminKey={adminKey} onToast={setToast} />}
      </main>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-2xl px-5 py-4 text-sm text-white shadow-2xl ${
            toast.kind === "ok" ? "bg-ink" : toast.kind === "warn" ? "bg-amber-600" : "bg-red-600"
          }`}
        >
          {toast.kind === "ok" ? <CheckCircle2 className="size-5 shrink-0 text-mint" /> : <AlertTriangle className="size-5 shrink-0" />}
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ PEDIDOS ------------------------------ */

type AdminOrder = NonNullable<ReturnType<typeof useAdminOrders>["data"]>[number];

function Orders({ adminKey, onToast }: { adminKey: string; onToast: (t: Toast) => void }) {
  const orders = useAdminOrders(adminKey);
  const update = useAdminUpdateStatus();
  const markPaid = useAdminMarkPaid();
  const reportUrl = useAdminReportUrl();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("ativos");
  const [modal, setModal] = useState<{ order: AdminOrder; status: Status } | null>(null);

  const list = useMemo(() => {
    const all = orders.data ?? [];
    return all.filter((o) => {
      if (filter === "ativos" && (o.status === "laudo_pronto" || o.status === "cancelado")) return false;
      if (filter !== "ativos" && filter !== "todos" && o.status !== filter) return false;
      const s = q.trim().toLowerCase();
      return !s || o.code.toLowerCase().includes(s) || o.customerName.toLowerCase().includes(s) || o.email.toLowerCase().includes(s);
    });
  }, [orders.data, q, filter]);

  const stats = useMemo(() => {
    const all = orders.data ?? [];
    return {
      total: all.length,
      pendPay: all.filter((o) => o.paymentStatus !== "pago" && o.status !== "cancelado").length,
      inLab: all.filter((o) => o.status === "recebida" || o.status === "em_analise").length,
      revenue: all.filter((o) => o.paymentStatus === "pago").reduce((s, o) => s + o.total, 0),
    };
  }, [orders.data]);

  function changeStatus(o: AdminOrder, status: Status) {
    if (status === o.status) return;
    if (status === "laudo_pronto" || status === "cancelado") return setModal({ order: o, status });
    update.mutate(
      { key: adminKey, id: o.id, status },
      {
        onSuccess: (r) => onToast(emailToast(r, STATUS_LABEL[status])),
        onError: (e) => onToast({ kind: "err", text: e.message }),
      },
    );
  }

  return (
    <>
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ["Pedidos", stats.total],
          ["Aguardando pagamento", stats.pendPay],
          ["No laboratório", stats.inLab],
          ["Recebido", brl(stats.revenue)],
        ].map(([k, v]) => (
          <div key={k as string} className="rounded-2xl bg-paper p-5 card-shadow">
            <p className="text-xs text-muted-ink">{k}</p>
            <p className="mt-1 text-2xl font-bold">{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {["ativos", "todos", ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${filter === s ? "bg-ink text-white" : "bg-paper text-muted-ink"}`}
            >
              {s === "ativos" ? "Ativos" : s === "todos" ? "Todos" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="relative md:w-72">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-ink" />
          <input aria-label="Buscar pedidos" className="field pl-10" placeholder="Código, nome ou e-mail" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {orders.isLoading ? (
        <div className="grid place-items-center py-20"><Loader2 className="size-6 animate-spin text-brand-teal" /></div>
      ) : orders.error ? (
        <p className="mt-10 text-red-600">{orders.error.message}</p>
      ) : list.length === 0 ? (
        <p className="mt-16 text-center text-muted-ink">Nenhum pedido encontrado.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {list.map((o) => (
            <div key={o.id} className="grid gap-4 rounded-2xl bg-paper p-5 card-shadow lg:grid-cols-[170px_1.3fr_1.1fr_1fr_230px] lg:items-center">
              <div>
                <Link to={`/acompanhar/${o.code}`} className="inline-flex items-center gap-1 font-mono font-bold hover:text-brand-teal">
                  {o.code} <ExternalLink className="size-3" />
                </Link>
                <p className="text-xs text-muted-ink">{fmtDateTime(o.createdAt)}</p>
              </div>
              <div className="text-sm">
                <p className="font-semibold">{o.customerName}</p>
                <p className="text-xs text-muted-ink">{o.email} · {o.phone}</p>
                {o.document && <p className="text-xs text-muted-ink">Doc.: {o.document}</p>}
                <p className="mt-1 text-xs text-muted-ink">{o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}</p>
              </div>
              <div className="text-sm">
                <p className="font-medium">{DELIVERY_LABEL[o.deliveryMethod]}</p>
                <p className="text-xs text-muted-ink">
                  {o.deliveryMethod === "correio"
                    ? o.trackingCode ? `Rastreio: ${o.trackingCode}` : "Sem rastreio ainda"
                    : `${fmtDate(o.deliveryDate)} · ${o.deliverySlot}`}
                </p>
                {o.pickupAddress && <p className="text-xs text-muted-ink">{o.pickupAddress}</p>}
              </div>
              <div className="text-sm">
                <p className="font-bold">{brl(o.total)}</p>
                {o.deliveryFee > 0 && <p className="text-[11px] text-muted-ink">inclui coleta {brl(o.deliveryFee)}</p>}
                {o.paymentStatus === "pago" ? (
                  <p className="flex items-center gap-1 text-xs font-semibold text-brand-green"><CheckCircle2 className="size-3.5" /> Pago · {PAYMENT_LABEL[o.paymentMethod]}</p>
                ) : (
                  <button
                    disabled={markPaid.isPending}
                    onClick={() =>
                      markPaid.mutate(
                        { key: adminKey, id: o.id },
                        { onSuccess: () => onToast({ kind: "ok", text: `Pagamento de ${o.code} confirmado.` }), onError: (e) => onToast({ kind: "err", text: e.message }) },
                      )
                    }
                    className="mt-1 rounded-full border border-ink/15 px-3 py-1 text-xs font-semibold hover:bg-cream"
                  >
                    Pendente ({PAYMENT_LABEL[o.paymentMethod]}) · marcar pago
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <select
                  aria-label="Status do pedido"
                  value={o.status}
                  disabled={update.isPending}
                  onChange={(e) => changeStatus(o, e.target.value as Status)}
                  className={`w-full rounded-full px-4 py-2 text-sm font-semibold outline-none ${STATUS_COLOR[o.status]}`}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() => setModal({ order: o, status: "laudo_pronto" })}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold hover:bg-cream"
                  >
                    <FileUp className="size-3.5" /> {o.hasReport ? "Substituir laudo" : "Anexar laudo"}
                  </button>
                  {o.hasReport && (
                    <button
                      aria-label="Baixar laudo"
                      onClick={() => reportUrl.mutate({ key: adminKey, id: o.id }, { onSuccess: (r) => window.open(r.url, "_blank") })}
                      className="grid size-8 place-items-center rounded-full bg-emerald-100 text-emerald-800"
                    >
                      <Download className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <StatusModal
          adminKey={adminKey}
          order={modal.order}
          status={modal.status}
          onClose={() => setModal(null)}
          onDone={(t) => {
            onToast(t);
            setModal(null);
          }}
        />
      )}
    </>
  );
}

function emailToast(r: { emailSent: boolean; emailReason?: string }, label: string): Toast {
  return r.emailSent
    ? { kind: "ok", text: `Status “${label}” salvo. E-mail enviado ao cliente.` }
    : { kind: "warn", text: `Status “${label}” salvo, mas o e-mail não foi enviado (${r.emailReason ?? "erro"}).` };
}

function StatusModal({
  adminKey,
  order,
  status,
  onClose,
  onDone,
}: {
  adminKey: string;
  order: AdminOrder;
  status: Status;
  onClose: () => void;
  onDone: (t: Toast) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadReport();
  const update = useAdminUpdateStatus();
  const isReport = status === "laudo_pronto";
  const needsFile = isReport && !order.hasReport;
  const busy = upload.isPending || update.isPending;

  function pick(f: File | undefined) {
    setErr(null);
    if (!f) return;
    if (f.type !== "application/pdf" || !/\.pdf$/i.test(f.name)) return setErr("Selecione um arquivo PDF.");
    if (f.size > MAX_REPORT_MB * 1024 * 1024) return setErr(`O PDF deve ter no máximo ${MAX_REPORT_MB} MB.`);
    setFile(f);
  }

  async function submit() {
    setErr(null);
    if (needsFile && !file) return setErr("Anexe o PDF do laudo.");
    try {
      let reportKey: string | undefined;
      let reportName: string | undefined;
      if (file) {
        const up = await upload.mutateAsync({ key: adminKey, id: order.id, file });
        reportKey = up.objectKey;
        reportName = up.name;
      }
      const r = await update.mutateAsync({ key: adminKey, id: order.id, status, note: note || undefined, reportKey, reportName });
      onDone(emailToast(r, STATUS_LABEL[status]));
    } catch (e) {
      setErr((e as Error).message || "Falha ao salvar. Tente novamente.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[28px] bg-paper p-7 card-shadow">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-xs font-bold text-brand-teal">{order.code}</p>
            <h2 className="mt-1 text-2xl font-semibold">{isReport ? "Laudo pronto" : `Marcar como ${STATUS_LABEL[status]}`}</h2>
            <p className="mt-1 text-sm text-muted-ink">{order.customerName} · {order.email}</p>
          </div>
          <button aria-label="Fechar" onClick={onClose} className="grid size-9 place-items-center rounded-full bg-cream"><X className="size-4" /></button>
        </div>

        {isReport && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
            className={`mt-6 cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition ${
              drag ? "border-brand-teal bg-brand-teal/5" : "border-ink/15 hover:border-ink/30"
            }`}
          >
            <input
              ref={inputRef}
              aria-label="Arquivo PDF do laudo"
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => pick(e.target.files?.[0])}
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="size-8 text-brand-teal" />
                <div className="text-left">
                  <p className="text-sm font-semibold">{file.name}</p>
                  <p className="text-xs text-muted-ink">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            ) : (
              <>
                <FileUp className="mx-auto size-8 text-brand-teal" />
                <p className="mt-2 text-sm font-semibold">
                  {order.hasReport ? "Enviar novo PDF (opcional, substitui o atual)" : "Arraste o PDF do laudo ou clique para escolher"}
                </p>
                <p className="text-xs text-muted-ink">Somente PDF, até {MAX_REPORT_MB} MB</p>
              </>
            )}
          </div>
        )}

        <label className="mt-5 block">
          <span className="mb-1.5 block text-[13px] font-semibold">Mensagem ao cliente (opcional)</span>
          <textarea rows={3} maxLength={500} className="field" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>

        <p className="mt-4 flex items-center gap-2 text-xs text-muted-ink">
          <Mail className="size-3.5" /> O cliente recebe um e-mail automático{isReport ? " com o link para baixar o laudo" : ""}.
        </p>

        {err && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-full px-5 py-2.5 text-sm font-semibold text-muted-ink">Cancelar</button>
          <button
            disabled={busy || (needsFile && !file)}
            onClick={submit}
            className={`inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
              status === "cancelado" ? "bg-red-600" : "bg-ink"
            }`}
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {upload.isPending ? "Enviando PDF…" : update.isPending ? "Salvando…" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ PREÇOS ------------------------------ */

const toCents = (v: string) => {
  const n = Number(v.replace(/\./g, "").replace(",", ".").trim());
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
};
const toInput = (c: number) => (c / 100).toFixed(2).replace(".", ",");

function Prices({ adminKey, onToast }: { adminKey: string; onToast: (t: Toast) => void }) {
  const prices = useAdminPrices(adminKey);
  const save = useAdminUpdatePrices();
  const reset = useAdminResetPrices();
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    if (prices.data) setDraft(Object.fromEntries(prices.data.map((a) => [a.id, toInput(a.price)])));
  }, [prices.data]);

  if (prices.isLoading) return <div className="grid place-items-center py-20"><Loader2 className="size-6 animate-spin text-brand-teal" /></div>;
  if (prices.error) return <p className="mt-10 text-red-600">{prices.error.message}</p>;
  const list = prices.data ?? [];

  const errors: Record<string, string> = {};
  for (const a of list) {
    const c = toCents(draft[a.id] ?? "");
    if (!Number.isFinite(c)) errors[a.id] = "Valor inválido";
    else if (c < 100) errors[a.id] = "Mínimo R$ 1,00";
    else if (c > 10_000_000) errors[a.id] = "Valor muito alto";
  }
  const changed = list.filter((a) => !errors[a.id] && toCents(draft[a.id] ?? "") !== a.price);
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="mt-8 rounded-[28px] bg-paper p-6 card-shadow md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Tabela de preços</h2>
          <p className="mt-1 text-sm text-muted-ink">
            Valor unitário por amostra. Novos agendamentos usam o preço atualizado; pedidos já feitos mantêm o valor original.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            disabled={reset.isPending}
            onClick={() => {
              if (!confirm("Restaurar todos os preços para o padrão?")) return;
              reset.mutate({ key: adminKey }, { onSuccess: () => onToast({ kind: "ok", text: "Preços restaurados para o padrão." }) });
            }}
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2.5 text-sm font-semibold"
          >
            <RotateCcw className="size-4" /> Restaurar padrão
          </button>
          <button
            disabled={save.isPending || hasErrors || changed.length === 0}
            onClick={() =>
              save.mutate(
                { key: adminKey, prices: changed.map((a) => ({ analysisId: a.id, price: toCents(draft[a.id]) })) },
                {
                  onSuccess: () => onToast({ kind: "ok", text: `${changed.length} preço(s) atualizado(s).` }),
                  onError: (e) => onToast({ kind: "err", text: e.message }),
                },
              )
            }
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Salvar{changed.length ? ` (${changed.length})` : ""}
          </button>
        </div>
      </div>

      <div className="mt-6 divide-y divide-ink/10">
        {list.map((a) => (
          <div key={a.id} className="grid items-center gap-3 py-4 md:grid-cols-[120px_1fr_150px_200px]">
            <span className="w-fit rounded-full bg-cream px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-teal">
              {CATEGORY_LABEL[a.category]}
            </span>
            <div>
              <p className="font-semibold">{a.name}</p>
              <p className="text-xs text-muted-ink">{a.turnaroundDays} dias úteis</p>
            </div>
            <p className="text-xs text-muted-ink">
              Padrão: {brl(a.defaultPrice)}
              {a.price !== a.defaultPrice && <span className="ml-1 font-semibold text-brand-green">· personalizado</span>}
            </p>
            <div>
              <div className={`flex items-center rounded-xl border bg-white pl-3 ${errors[a.id] ? "border-red-400" : "border-ink/15"}`}>
                <span className="text-sm text-muted-ink">R$</span>
                <input
                  aria-label={`Preço de ${a.name}`}
                  inputMode="decimal"
                  value={draft[a.id] ?? ""}
                  onChange={(e) => setDraft({ ...draft, [a.id]: e.target.value.replace(/[^\d.,]/g, "") })}
                  className="w-full bg-transparent px-2 py-2.5 text-right font-semibold outline-none"
                />
              </div>
              {errors[a.id] && <p className="mt-1 text-xs text-red-600">{errors[a.id]}</p>}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-ink">Taxa de coleta na propriedade: R$ 80,00 por pedido (fixa).</p>
    </div>
  );
}
