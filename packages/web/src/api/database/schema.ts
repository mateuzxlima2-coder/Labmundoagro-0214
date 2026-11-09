import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  customerName: text("customer_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  document: text("document"),
  propertyName: text("property_name"),
  city: text("city"),
  state: text("state"),
  deliveryMethod: text("delivery_method").notNull(), // lab | correio | coleta
  deliveryDate: text("delivery_date"),
  deliverySlot: text("delivery_slot"),
  pickupAddress: text("pickup_address"),
  trackingCode: text("tracking_code"),
  paymentMethod: text("payment_method").notNull(), // cartao | pix | boleto | entrega
  paymentStatus: text("payment_status").notNull().default("pendente"), // pendente | pago
  status: text("status").notNull().default("agendado"), // agendado | recebida | em_analise | laudo_pronto | cancelado
  subtotal: integer("subtotal").notNull(),
  deliveryFee: integer("delivery_fee").notNull().default(0),
  total: integer("total").notNull(),
  notes: text("notes"),
  stripeSessionId: text("stripe_session_id"),
  reportKey: text("report_key"),
  reportName: text("report_name"),
  reportUploadedAt: integer("report_uploaded_at", { mode: "timestamp" }),
  consentAt: integer("consent_at", { mode: "timestamp" }),
  consentVersion: text("consent_version"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  analysisId: text("analysis_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
});

export const statusEvents = sqliteTable("status_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  status: text("status").notNull(),
  note: text("note"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Preços editáveis pelo admin. Sem registro = preço padrão do catálogo. */
export const analysisPrices = sqliteTable("analysis_prices", {
  analysisId: text("analysis_id").primaryKey(),
  price: integer("price").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Registro de notificações enviadas ao cliente (e-mail real via Resend, WhatsApp simulado). */
export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  channel: text("channel").notNull(), // whatsapp | email
  status: text("status").notNull(), // status do pedido que gerou o aviso
  result: text("result").notNull(), // enviado | simulado | falhou
  detail: text("detail"),
  message: text("message"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
