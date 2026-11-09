import { useState } from "react";
import { Link, useSearch } from "wouter";
import { motion } from "motion/react";
import { Clock, FlaskConical, Loader2, Sparkles, ArrowRight, Info } from "lucide-react";
import { Footer, PageHero } from "../components/layout";
import { useCatalog } from "../queries/lab";
import { brl, CATEGORY_LABEL } from "../lib/format";

type Cat = "todas" | "solo" | "agua" | "nematoides";

export default function AnalisesPage() {
  const search = new URLSearchParams(useSearch());
  const initial = (search.get("c") as Cat) || "todas";
  const [cat, setCat] = useState<Cat>(initial);
  const catalog = useCatalog();
  const list = (catalog.data?.analyses ?? []).filter((a) => cat === "todas" || a.category === cat);

  return (
    <div className="bg-cream">
      <PageHero
        eyebrow="Catálogo"
        title={<>Análises e <span className="brand-text">preços</span></>}
        subtitle="Escolha a análise, veja o prazo e como coletar a amostra. Valores por amostra."
      />
      <section className="relative z-10 mx-auto -mt-10 max-w-[1200px] px-5 pb-28">
        <div className="mx-auto flex w-fit flex-wrap justify-center gap-1.5 rounded-full bg-paper p-1.5 card-shadow">
          {(["todas", "solo", "agua", "nematoides"] as Cat[]).map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                cat === c ? "bg-ink text-white" : "text-muted-ink hover:text-ink"
              }`}
            >
              {c === "todas" ? "Todas" : CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>

        {catalog.isLoading ? (
          <div className="grid place-items-center py-24"><Loader2 className="size-6 animate-spin text-brand-teal" /></div>
        ) : (
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {list.map((a, i) => (
              <motion.article
                key={a.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                className="flex flex-col rounded-[26px] bg-paper p-6 card-shadow"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-cream px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-teal">
                    {CATEGORY_LABEL[a.category]}
                  </span>
                  {a.popular && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-brand-green">
                      <Sparkles className="size-3.5" /> Mais pedida
                    </span>
                  )}
                </div>
                <h3 className="mt-5 text-[22px] font-semibold">{a.name}</h3>
                <p className="mt-2 text-sm text-muted-ink">{a.description}</p>
                <ul className="mt-5 flex flex-wrap gap-1.5">
                  {a.parameters.map((p) => (
                    <li key={p} className="rounded-lg border border-ink/10 px-2 py-1 text-xs text-ink/75">{p}</li>
                  ))}
                </ul>
                <div className="mt-5 flex gap-2 rounded-2xl bg-cream p-3.5 text-xs text-muted-ink">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-brand-teal" />
                  <span>{a.sampleInfo}</span>
                </div>
                <div className="mt-auto flex items-end justify-between pt-6">
                  <div>
                    <p className="text-[28px] font-bold leading-none">{brl(a.price)}</p>
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-ink">
                      <Clock className="size-3.5" /> {a.turnaroundDays} dias úteis
                    </p>
                  </div>
                  <Link
                    to={`/agendar?a=${a.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-2"
                  >
                    Agendar <ArrowRight className="size-4" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        <div className="mt-14 flex flex-col items-center gap-3 text-center text-sm text-muted-ink">
          <FlaskConical className="size-5 text-brand-teal" />
          Precisa de uma análise que não está na lista? Fale com a gente: <a href="mailto:mundoagrolaboratorio@gmail.com" className="font-semibold text-brand-teal">mundoagrolaboratorio@gmail.com</a> ou WhatsApp +55 (27) 99848-8848
        </div>
      </section>
      <Footer />
    </div>
  );
}
