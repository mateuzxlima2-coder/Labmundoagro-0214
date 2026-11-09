import { useState } from "react";
import { Link } from "wouter";
import { motion } from "motion/react";
import { FaWhatsapp } from "react-icons/fa";
import {
  CheckCircle2,
  Mail,
  PackageCheck,
  Microscope,
  FileText,
  CalendarCheck,
  Building2,
  Truck,
  Tractor,
  Tag,
  Copy,
  Check,
  ArrowRight,
  CreditCard,
} from "lucide-react";
import { brl, DELIVERY_LABEL, fmtDate, PAYMENT_LABEL } from "../lib/format";
import { WHATSAPP_URL } from "./layout";

export interface BookingResult {
  code: string;
  total: number;
  deliveryFee: number;
  customerName: string;
  email: string;
  phone: string;
  delivery: "lab" | "correio" | "coleta";
  date?: string;
  slot?: string;
  pickupAddress?: string;
  payment: "cartao" | "pix" | "boleto" | "entrega";
  items: { name: string; quantity: number }[];
  labAddress?: { street: string; city: string; zip: string };
}

const STEPS = [
  { icon: CalendarCheck, t: "Agendado", d: "Confirmação enviada agora" },
  { icon: PackageCheck, t: "Amostra recebida", d: "Quando chegar ao laboratório" },
  { icon: Microscope, t: "Em análise", d: "Quando entrar na bancada" },
  { icon: FileText, t: "Concluído", d: "Com o laudo em PDF anexado" },
];

function fmtPhone(p: string) {
  const d = p.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return p;
}

export function BookingSuccess({ r }: { r: BookingResult }) {
  const [copied, setCopied] = useState(false);
  const first = r.customerName.trim().split(/\s+/)[0];
  const DIcon = r.delivery === "lab" ? Building2 : r.delivery === "correio" ? Truck : Tractor;
  const needsPayment = r.payment !== "entrega";

  return (
    <div className="space-y-6">
      {/* header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[30px] bg-ink p-7 text-white card-shadow md:p-10"
      >
        <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full brand-gradient opacity-25 blur-3xl" />
        <motion.span
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
          className="relative grid size-16 place-items-center rounded-full brand-gradient shadow-lg shadow-brand-teal/40"
        >
          <CheckCircle2 className="size-8" />
        </motion.span>
        <h2 className="relative mt-6 text-3xl font-semibold tracking-tight md:text-4xl">
          Agendamento confirmado, {first}!
        </h2>
        <p className="relative mt-3 max-w-2xl text-white/75">
          Você não precisa guardar código nem acessar o site para acompanhar. Todas as atualizações e o{" "}
          <b className="text-white">laudo em PDF</b> serão enviados <b className="text-white">automaticamente</b> para o seu
          WhatsApp e e-mail cadastrados.
        </p>

        <div className="relative mt-7 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#25D366] text-white">
              <FaWhatsapp className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.14em] text-white/50">WhatsApp</p>
              <p className="truncate font-semibold">{fmtPhone(r.phone)}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-ink">
              <Mail className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.14em] text-white/50">E-mail</p>
              <p className="truncate font-semibold">{r.email}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* what you'll receive */}
      <div className="rounded-[28px] bg-paper p-6 card-shadow md:p-8">
        <h3 className="text-lg font-semibold">O que você vai receber</h3>
        <p className="mt-1 text-sm text-muted-ink">Uma mensagem em cada etapa, no WhatsApp e no e-mail.</p>
        <ol className="mt-6 grid gap-4 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.t} className="flex gap-3 md:flex-col">
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-full ${
                  i === 0 ? "brand-gradient text-white" : "bg-cream text-ink"
                }`}
              >
                <s.icon className="size-[18px]" />
              </span>
              <div>
                <p className="text-sm font-semibold">{s.t}</p>
                <p className="text-xs text-muted-ink">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* next step: sample */}
        <div className="rounded-[28px] bg-paper p-6 card-shadow md:p-7">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-cream"><DIcon className="size-5 text-brand-teal" /></span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-ink">Próximo passo</p>
              <p className="font-semibold">{DELIVERY_LABEL[r.delivery]}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-ink/80">
            {r.delivery === "lab" && (
              <>
                Traga as amostras em <b>{fmtDate(r.date)}</b>, às <b>{r.slot}</b>, no endereço{" "}
                {r.labAddress ? `${r.labAddress.street} — ${r.labAddress.city}` : "do laboratório"}.
              </>
            )}
            {r.delivery === "coleta" && (
              <>
                Nossa equipe vai até <b>{r.pickupAddress}</b> em <b>{fmtDate(r.date)}</b>, período <b>{r.slot}</b>. Taxa de
                coleta de {brl(r.deliveryFee)} incluída no total.
              </>
            )}
            {r.delivery === "correio" && (
              <>
                Envie para{" "}
                {r.labAddress ? `${r.labAddress.street} — ${r.labAddress.city}, CEP ${r.labAddress.zip}` : "o laboratório"}.
                Avisaremos no WhatsApp quando a amostra chegar.
              </>
            )}
          </p>
          <div className="mt-5 flex items-start gap-3 rounded-2xl bg-ink p-4 text-white">
            <Tag className="mt-0.5 size-5 shrink-0 text-mint" />
            <div className="text-sm text-white/80">
              Identifique cada saco ou frasco com a referência do pedido:
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(r.code);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1800);
                }}
                className="mt-2 flex items-center gap-2 rounded-full bg-white px-4 py-1.5 font-mono text-base font-bold tracking-wider text-ink"
              >
                {r.code} {copied ? <Check className="size-4 text-brand-green" /> : <Copy className="size-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* order summary */}
        <div className="flex flex-col rounded-[28px] bg-paper p-6 card-shadow md:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-ink">Resumo do pedido</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {r.items.map((i) => (
              <li key={i.name} className="flex justify-between gap-3">
                <span className="text-ink/80">{i.quantity}× {i.name}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-end justify-between border-t border-ink/10 pt-4">
            <span className="text-sm text-muted-ink">Total · {PAYMENT_LABEL[r.payment]}</span>
            <span className="text-2xl font-bold">{brl(r.total)}</span>
          </div>
          <div className="mt-auto flex flex-col gap-2 pt-6 sm:flex-row">
            <Link
              to={`/acompanhar/${r.code}`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-ink-2"
            >
              {needsPayment ? <><CreditCard className="size-4" /> Pagar agora</> : <>Ver detalhes <ArrowRight className="size-4" /></>}
            </Link>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-ink/15 px-5 py-3 text-sm font-semibold hover:bg-cream"
            >
              <FaWhatsapp className="size-4 text-[#25D366]" /> Falar com o laboratório
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
