import { z } from "zod";
import { and, eq, ne } from "drizzle-orm";
import { base } from "../__core/app";
import { db } from "../database";
import * as schema from "../database/schema";
import { getCatalog } from "../lib/pricing";
import {
  LAB_CONTACT,
  LAB_ADDRESS,
  LAB_SLOTS,
  LAB_SLOT_CAPACITY,
  PICKUP_FEE,
  PICKUP_SLOTS,
  PICKUP_SLOT_CAPACITY,
} from "../catalog";

export const catalog = {
  list: base.handler(async () => ({
    analyses: await getCatalog(),
    pickupFee: PICKUP_FEE,
    labAddress: LAB_ADDRESS,
    contact: LAB_CONTACT,
  })),
  slots: base
    .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), method: z.enum(["lab", "coleta"]) }))
    .handler(async ({ input }) => {
      const rows = await db
        .select({ slot: schema.orders.deliverySlot })
        .from(schema.orders)
        .where(
          and(
            eq(schema.orders.deliveryDate, input.date),
            eq(schema.orders.deliveryMethod, input.method),
            ne(schema.orders.status, "cancelado"),
          ),
        );
      const slots = input.method === "lab" ? LAB_SLOTS : PICKUP_SLOTS;
      const cap = input.method === "lab" ? LAB_SLOT_CAPACITY : PICKUP_SLOT_CAPACITY;
      return slots.map((s) => {
        const used = rows.filter((r) => r.slot === s).length;
        return { slot: s, available: Math.max(0, cap - used) };
      });
    }),
};
