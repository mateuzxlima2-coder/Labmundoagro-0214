import { db } from "../database";
import * as schema from "../database/schema";
import { CATALOG, type Analysis } from "../catalog";

/** Catálogo com os preços atuais (overrides do admin sobre o padrão). */
export async function getCatalog(): Promise<(Analysis & { defaultPrice: number })[]> {
  const rows = await db.select().from(schema.analysisPrices);
  const map = new Map(rows.map((r) => [r.analysisId, r.price]));
  return CATALOG.map((a) => ({ ...a, defaultPrice: a.price, price: map.get(a.id) ?? a.price }));
}
