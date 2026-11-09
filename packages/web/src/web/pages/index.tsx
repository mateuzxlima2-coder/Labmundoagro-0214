import { useState } from "react";
import { Link } from "wouter";
import { motion } from "motion/react";
import {
  ArrowRight,
  CalendarCheck,
  CreditCard,
  PackageCheck,
  FileText,
  Building2,
  Truck,
  Tractor,
  QrCode,
  Barcode,
  Wallet,
  Plus,
  Minus,
  ShieldCheck,
  Clock,
  Microscope,
  CheckCircle2,
} from "lucide-react";
import { Footer, Navbar } from "../components/layout";
import { useCatalog } from "../queries/lab";
import { brl } from "../lib/format";

const fade = (i = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] as const },
});

const AREAS = [
  {
    c: "solo",
    title: "Solo",
    img: "/images/solo.jpg",
    text: "Fertilidade, micronutrientes e granulometria para recomendar calagem e adubação com precisão.",
    tags: ["Química básica", "Micronutrientes", "Física"],
  },
  {
    c: "agua",
    title: "Água",
    img: "/images/agua.jpg",
    text: "Irrigação, potabilidade e microbiologia para proteger a lavoura, o rebanho e as pessoas.",
    tags: ["Irrigação", "Potabilidade", "Microbiológica"],
  },
  {
    c: "nematoides",
    title: "Nematoides",
    img: "/images/nematoides.jpg",
    text: "Extração, contagem e identificação de espécies em solo e raízes para decidir o manejo.",
    tags: ["Solo", "Raízes", "Espécie"],
  },
];

const STEPS = [
  { icon: CalendarCheck, t: "Agende", d: "Escolha as análises, a quantidade de amostras e como vai entregar." },
  { icon: CreditCard, t: "Pague", d: "Cartão, Pix, boleto ou pague na hora da entrega da amostra." },
  { icon: PackageCheck, t: "Entregue", d: "Leve ao laboratório, envie pelo correio ou peça a coleta na fazenda." },
  { icon: FileText, t: "Receba o laudo", d: "Cada etapa e o laudo em PDF chegam automaticamente no seu WhatsApp e e-mail." },
];

const DELIVERY = [
  { icon: Building2, t: "No laboratório", d: "Agende dia e horário e deixe a amostra no balcão, sem fila.", tag: "Sem custo" },
  { icon: Truck, t: "Correio ou transportadora", d: "Envie para nosso endereço e informe o código de rastreio no site.", tag: "Todo o Brasil" },
  { icon: Tractor, t: "Coleta na propriedade", d: "Nossa equipe busca a amostra na sua fazenda no período escolhido.", tag: "R$ 80,00 por visita" },
];

const FAQ = [
  {
    q: "Como devo identificar as amostras?",
    a: "Escreva no saco ou frasco a referência do pedido (ex.: MA-7K3F9Q), o nome do talhão/ponto e a profundidade. A referência e as instruções completas aparecem na tela de confirmação e também chegam no seu WhatsApp e e-mail.",
  },
  {
    q: "Qual o prazo para receber o laudo?",
    a: "Depende da análise: de 3 dias úteis (microbiológica) a 12 dias úteis (identificação de espécie de nematoide), contados a partir do recebimento da amostra.",
  },
  {
    q: "Posso pagar depois?",
    a: "Sim. Escolha “Pagar na entrega” no agendamento ou volte depois na página de acompanhamento e pague por cartão, Pix ou boleto.",
  },
  {
    q: "Preciso criar conta?",
    a: "Não. Você não precisa de login nem de código: as atualizações (amostra recebida, em análise, concluído) e o laudo em PDF são enviados automaticamente para o WhatsApp e o e-mail informados no agendamento.",
  },
];

function useFromPrices() {
  const catalog = useCatalog();
  return (c: string) => {
    const list = catalog.data?.analyses.filter((a) => a.category === c) ?? [];
    return list.length ? brl(Math.min(...list.map((a) => a.price))).replace(",00", "") : "…";
  };
}

export default function Index() {
  const fromPrice = useFromPrices();
  return (
    <div className="bg-cream text-text">
      {/* HERO */}
      <section className="hero-glow grain relative overflow-hidden">
        <Navbar />
        <div className="relative z-10 mx-auto max-w-[920px] px-5 pb-40 pt-14 text-center text-white md:pt-20">
          <motion.span {...fade(0)} className="eyebrow text-mint">
            <span className="size-1.5 rounded-full bg-mint" /> Agendamento 100% online
          </motion.span>
          <motion.h1 {...fade(1)} className="mt-6 text-[42px] font-semibold md:text-[68px]">
            Análises de solo, água e nematoides <span className="brand-text">sem sair da fazenda</span>
          </motion.h1>
          <motion.p {...fade(2)} className="mx-auto mt-6 max-w-xl text-[17px] text-white/70">
            Agende, pague e escolha como entregar sua amostra em poucos minutos. Acompanhe cada etapa até o laudo
            chegar no seu e-mail.
          </motion.p>
          <motion.div {...fade(3)} className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              to="/agendar"
              className="inline-flex items-center gap-2 rounded-full bg-mint px-7 py-3.5 font-semibold text-ink transition hover:brightness-105"
            >
              Agendar análise <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/analises"
              className="rounded-full bg-white px-7 py-3.5 font-semibold text-ink transition hover:bg-white/90"
            >
              Ver análises e preços
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FLOATING CARDS */}
      <section className="relative z-20 -mt-28 px-5">
        <div className="mx-auto grid max-w-[1200px] gap-5 md:grid-cols-3">
          {AREAS.map((a, i) => (
            <motion.div
              key={a.c}
              initial={{ opacity: 0, y: 40, rotate: i === 1 ? 0 : i === 0 ? -2 : 2 }}
              animate={{ opacity: 1, y: i === 1 ? -16 : 0, rotate: i === 1 ? 0 : i === 0 ? -1.5 : 1.5 }}
              transition={{ duration: 0.9, delay: 0.35 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: i === 1 ? -24 : -8, rotate: 0 }}
            >
              <Link to={`/analises?c=${a.c}`} className="group block overflow-hidden rounded-[26px] bg-paper p-2.5 card-shadow">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[20px]">
                  <img src={a.img} alt={a.title} className="size-full object-cover transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-mint">Análise de</p>
                      <h3 className="text-2xl font-semibold">{a.title}</h3>
                    </div>
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">a partir de {fromPrice(a.c)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between px-3 py-3.5">
                  <div className="flex flex-wrap gap-1.5">
                    {a.tags.map((t) => (
                      <span key={t} className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-medium text-muted-ink">{t}</span>
                    ))}
                  </div>
                  <ArrowRight className="size-4 text-brand-teal transition group-hover:translate-x-1" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="mx-auto max-w-[1200px] px-5 py-20">
        <div className="grid grid-cols-2 gap-y-10 md:grid-cols-4">
          {[
            ["9", "tipos de análise"],
            ["3", "formas de entrega"],
            ["4", "formas de pagamento"],
            ["24h", "para começar a análise"],
          ].map(([n, l]) => (
            <div key={l} className="text-center">
              <p className="bg-gradient-to-br from-brand-green to-brand-blue bg-clip-text text-5xl font-bold text-transparent">{n}</p>
              <p className="mt-2 text-sm text-muted-ink">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AREAS DETAIL */}
      <section className="mx-auto max-w-[1200px] px-5 pb-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow text-brand-teal">O que analisamos</span>
          <h2 className="mt-5 text-4xl font-semibold md:text-5xl">Três frentes, um laudo que orienta a decisão</h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-[1.2fr_1fr]">
          <div className="relative overflow-hidden rounded-[28px] bg-ink p-8 text-white md:row-span-2 md:p-10">
            <img src="/images/campo.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/20" />
            <div className="relative flex h-full min-h-[420px] flex-col justify-end">
              <Microscope className="size-10 text-mint" />
              <h3 className="mt-5 text-3xl font-semibold">Metodologia validada, resultado que você entende</h3>
              <p className="mt-4 max-w-md text-white/70">
                Cada laudo traz os valores medidos, a faixa de interpretação para a cultura e observações técnicas
                para o agrônomo responsável.
              </p>
              <div className="mt-7 flex flex-wrap gap-3 text-sm">
                {["Controle de qualidade interlaboratorial", "Laudo digital em PDF", "Suporte agronômico"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-white/85">
                    <CheckCircle2 className="size-3.5 text-mint" /> {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {AREAS.slice(0, 2).map((a) => (
            <AreaRow key={a.c} {...a} from={fromPrice(a.c)} />
          ))}
          <div className="md:col-span-2">
            <AreaRow {...AREAS[2]} from={fromPrice(AREAS[2].c)} wide />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" className="scroll-mt-10 px-5 pb-28">
        <div className="mx-auto max-w-[1200px] rounded-[36px] bg-paper px-6 py-16 card-shadow md:px-14">
          <div className="text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-full bg-cream">
              <img src="/images/logo.png" alt="" className="size-10" />
            </span>
            <h2 className="mt-6 text-4xl font-semibold md:text-5xl">Como funciona</h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-ink">
              Do agendamento ao laudo em quatro passos. Sem cadastro, sem ligação, sem papelada.
            </p>
          </div>
          <div className="relative mt-14 grid gap-8 md:grid-cols-4">
            <div className="absolute left-[12%] right-[12%] top-7 hidden h-px bg-gradient-to-r from-brand-green via-brand-teal to-brand-blue md:block" />
            {STEPS.map((s, i) => (
              <div key={s.t} className="relative text-center">
                <span className="relative mx-auto grid size-14 place-items-center rounded-2xl brand-gradient text-white shadow-lg shadow-brand-teal/30">
                  <s.icon className="size-6" />
                </span>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-brand-teal">Passo {i + 1}</p>
                <h3 className="mt-1.5 text-xl font-semibold">{s.t}</h3>
                <p className="mx-auto mt-2 max-w-[230px] text-sm text-muted-ink">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-14 flex justify-center">
            <Link to="/agendar" className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 font-semibold text-white hover:bg-ink-2">
              Começar agendamento <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* DELIVERY + PAYMENT (dark) */}
      <section className="relative overflow-hidden bg-ink py-28 text-white">
        <div className="pointer-events-none absolute -left-40 top-20 size-[500px] rounded-full bg-brand-green/20 blur-[120px]" />
        <div className="pointer-events-none absolute -right-40 bottom-0 size-[500px] rounded-full bg-brand-blue/25 blur-[120px]" />
        <div className="relative mx-auto max-w-[1200px] px-5">
          <div className="text-center">
            <h2 className="text-4xl font-semibold md:text-5xl">Entregue do jeito que for melhor para você</h2>
            <p className="mt-4 text-white/60">Escolha no agendamento. Dá para mudar falando com a gente.</p>
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {DELIVERY.map((d) => (
              <div key={d.t} className="rounded-[26px] bg-paper p-2.5 text-text">
                <div className="rounded-[20px] bg-gradient-to-br from-ink-2 to-ink p-7 text-white">
                  <d.icon className="size-9 text-mint" />
                  <span className="mt-6 inline-block rounded-full bg-white/10 px-3 py-1 text-xs">{d.tag}</span>
                </div>
                <div className="px-4 pb-4 pt-5">
                  <h3 className="text-xl font-semibold">{d.t}</h3>
                  <p className="mt-2 text-sm text-muted-ink">{d.d}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-20 grid items-center gap-10 rounded-[28px] border border-white/10 bg-white/[0.03] p-8 md:grid-cols-[1fr_1.4fr] md:p-12">
            <div>
              <span className="eyebrow text-mint">Pagamento</span>
              <h3 className="mt-5 text-3xl font-semibold">Pague na hora ou depois</h3>
              <p className="mt-3 text-white/60">Pagamento com cartão é processado com segurança pela Stripe.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { i: CreditCard, t: "Cartão de crédito" },
                { i: QrCode, t: "Pix" },
                { i: Barcode, t: "Boleto" },
                { i: Wallet, t: "Na entrega" },
              ].map((p) => (
                <div key={p.t} className="flex items-center gap-3 rounded-2xl bg-white/[0.06] px-5 py-4">
                  <p.i className="size-5 text-mint" />
                  <span className="text-sm font-medium">{p.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto grid max-w-[1200px] gap-12 px-5 py-28 md:grid-cols-[0.8fr_1.2fr]">
        <div>
          <span className="eyebrow text-brand-teal">Dúvidas</span>
          <h2 className="mt-5 text-4xl font-semibold">Perguntas frequentes</h2>
          <div className="mt-8 space-y-3 text-sm text-muted-ink">
            <p className="flex items-center gap-2"><ShieldCheck className="size-4 text-brand-green" /> Dados usados só para o laudo</p>
            <p className="flex items-center gap-2"><Clock className="size-4 text-brand-green" /> Atendimento seg–sex, 8h às 17h</p>
          </div>
        </div>
        <div className="space-y-3">
          {FAQ.map((f, i) => (
            <FaqItem key={f.q} {...f} defaultOpen={i === 0} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-24">
        <div className="hero-glow grain relative mx-auto max-w-[1200px] overflow-hidden rounded-[36px] px-8 py-16 text-center text-white md:py-20">
          <h2 className="relative text-4xl font-semibold md:text-5xl">Sua próxima safra começa no laudo</h2>
          <p className="relative mx-auto mt-4 max-w-md text-white/65">Agende agora e receba cada atualização direto no seu WhatsApp e e-mail.</p>
          <Link
            to="/agendar"
            className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-mint px-7 py-3.5 font-semibold text-ink"
          >
            Agendar análise <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}

function AreaRow({ c, title, img, text, from, wide }: (typeof AREAS)[number] & { from: string; wide?: boolean }) {
  return (
    <Link
      to={`/analises?c=${c}`}
      className={`group flex gap-5 rounded-[28px] bg-paper p-3 card-shadow transition hover:-translate-y-1 ${wide ? "md:items-center" : ""}`}
    >
      <img src={img} alt="" className={`shrink-0 rounded-[20px] object-cover ${wide ? "h-40 w-56 md:w-80" : "h-auto w-36"}`} />
      <div className="py-3 pr-3">
        <h3 className="text-2xl font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-ink">{text}</p>
        <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-teal">
          A partir de {from} <ArrowRight className="size-4 transition group-hover:translate-x-1" />
        </p>
      </div>
    </Link>
  );
}

function FaqItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  return (
    <div className="rounded-2xl bg-paper px-6 py-5 card-shadow">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-4 text-left font-semibold">
        {q}
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-cream">
          {open ? <Minus className="size-4" /> : <Plus className="size-4" />}
        </span>
      </button>
      {open && <p className="mt-3 text-sm text-muted-ink">{a}</p>}
    </div>
  );
}
