import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Mail, Phone, MapPin } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

export const WHATSAPP_URL = "https://wa.me/5527998488848?text=" + encodeURIComponent("Olá! Gostaria de informações sobre análises.");

const NAV = [
  { to: "/", label: "Início" },
  { to: "/analises", label: "Análises" },
  { to: "/#como-funciona", label: "Como funciona" },
  { to: "/acompanhar", label: "Acompanhar pedido" },
];

export function Logo({ light = true }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-full bg-white">
        <img src="/images/logo.png" alt="" className="size-7 object-contain" />
      </span>
      <span className={`text-[17px] font-bold leading-none tracking-tight ${light ? "text-white" : "text-ink"}`}>
        Mundo Agro
        <span className={`block text-[10px] font-semibold uppercase tracking-[0.2em] ${light ? "text-white/55" : "text-muted-ink"}`}>
          Laboratório
        </span>
      </span>
    </Link>
  );
}

export function Navbar({ dark = true }: { dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const [loc] = useLocation();
  const linkCls = dark ? "text-white/80 hover:text-white" : "text-ink/70 hover:text-ink";
  return (
    <header className={`relative z-30 ${dark ? "" : "border-b border-ink/10 bg-cream"}`}>
      <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between px-5">
        <Logo light={dark} />
        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`text-[14px] font-medium transition ${linkCls} ${loc === n.to ? (dark ? "!text-white" : "!text-ink") : ""}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/agendar"
            className={`hidden rounded-full px-5 py-2.5 text-[14px] font-semibold transition sm:inline-flex ${
              dark ? "bg-white text-ink hover:bg-mint" : "bg-ink text-white hover:bg-ink-2"
            }`}
          >
            Agendar análise
          </Link>
          <button
            aria-label="Menu"
            onClick={() => setOpen(!open)}
            className={`md:hidden ${dark ? "text-white" : "text-ink"}`}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <div className="absolute inset-x-3 top-20 rounded-2xl bg-white p-4 card-shadow md:hidden">
          {[...NAV, { to: "/agendar", label: "Agendar análise" }].map((n) => (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 font-medium text-ink hover:bg-cream">
              {n.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[700px] -translate-x-1/2 rounded-full bg-brand-teal/20 blur-3xl" />
      <div className="relative mx-auto grid max-w-[1200px] gap-12 px-5 py-16 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-xs text-sm text-white/60">
            Análises de solo, água e nematoides com laudo técnico, agendamento online e acompanhamento em tempo real.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Análises</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-white/60">
            <li><Link to="/analises?c=solo" className="hover:text-white">Solo</Link></li>
            <li><Link to="/analises?c=agua" className="hover:text-white">Água</Link></li>
            <li><Link to="/analises?c=nematoides" className="hover:text-white">Nematoides</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Cliente</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-white/60">
            <li><Link to="/agendar" className="hover:text-white">Agendar</Link></li>
            <li><Link to="/acompanhar" className="hover:text-white">Acompanhar pedido</Link></li>
            <li><Link to="/admin" className="hover:text-white">Área do laboratório</Link></li>
          </ul>
        </div>
        <div className="space-y-3 text-sm text-white/60">
          <h4 className="text-sm font-semibold text-white">Contato</h4>
          <p className="flex gap-2"><MapPin className="size-4 shrink-0 text-mint" /> Av. Setembrino Pelissari, 275 — Pinheiros, ES · CEP 29980-000</p>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="flex gap-2 hover:text-white"><Phone className="size-4 shrink-0 text-mint" /> +55 (27) 99848-8848</a>
          <a href="mailto:mundoagrolaboratorio@gmail.com" className="flex gap-2 break-all hover:text-white"><Mail className="size-4 shrink-0 text-mint" /> mundoagrolaboratorio@gmail.com</a>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-white/40 md:flex-row">
          <span>© {new Date().getFullYear()} Laboratório Mundo Agro. Todos os direitos reservados.</span>
          <span className="flex gap-5">
            <Link to="/termos" className="hover:text-white">Termos de Uso</Link>
            <Link to="/privacidade" className="hover:text-white">Política de Privacidade (LGPD)</Link>
          </span>
        </div>
      </div>
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Falar no WhatsApp"
        className="fixed bottom-5 left-5 z-40 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-xl shadow-black/20 transition hover:scale-105"
      >
        <FaWhatsapp className="size-7" />
      </a>
    </footer>
  );
}

/** Dark compact header block used on inner pages. */
export function PageHero({ eyebrow, title, subtitle }: { eyebrow: string; title: React.ReactNode; subtitle?: string }) {
  return (
    <section className="hero-glow grain relative overflow-hidden pb-24">
      <Navbar />
      <div className="relative z-10 mx-auto max-w-[900px] px-5 pt-10 text-center text-white">
        <span className="eyebrow text-mint">{eyebrow}</span>
        <h1 className="mt-5 text-4xl font-semibold md:text-[56px]">{title}</h1>
        {subtitle && <p className="mx-auto mt-5 max-w-xl text-white/65">{subtitle}</p>}
      </div>
    </section>
  );
}
