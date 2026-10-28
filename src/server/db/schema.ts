import { relations, sql } from "drizzle-orm";
import { boolean, check, index, integer, jsonb, pgEnum, pgTable, smallint, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

/** Store settings (single row). Money is stored in minor units (cents). */
export const store = pgTable("store", {
  id: smallint("id").primaryKey().default(1),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  currency: text("currency").notNull(),
  shippingCents: integer("shipping_cents").notNull(),
  expressCents: integer("express_cents").notNull(),
  freeShippingOverCents: integer("free_shipping_over_cents").notNull(),
  lowStockAt: smallint("low_stock_at").notNull().default(3),
}, t => [check("store_single_row", sql`${t.id} = 1`)]);

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  collection: text("collection").notNull(), // Women | Men | Unisex
  category: text("category").notNull(),     // Tops, Shirts, Knitwear, Outerwear, Bottoms, Dresses
  description: text("description").notNull(),
  fabric: text("fabric").notNull(),
  fit: text("fit").notNull(),
  priceCents: integer("price_cents").notNull(),
  compareAtCents: integer("compare_at_cents"),
  active: boolean("active").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  check("price_positive", sql`${t.priceCents} > 0`),
  check("compare_above_price", sql`${t.compareAtCents} is null or ${t.compareAtCents} > ${t.priceCents}`),
]);

/** A colourway of a product, with its own photos. */
export const colors = pgTable("colors", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  hex: text("hex").notNull(),
  images: jsonb("images").$type<string[]>().notNull(),
  position: smallint("position").notNull().default(0),
});

/** Sellable unit: one colour + one size. Stock can never go negative (check constraint). */
export const variants = pgTable("variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  colorId: uuid("color_id").notNull().references(() => colors.id, { onDelete: "cascade" }),
  size: text("size").notNull(),
  sku: text("sku").notNull().unique(),
  stock: integer("stock").notNull().default(0),
  position: smallint("position").notNull().default(0),
}, t => [
  check("stock_non_negative", sql`${t.stock} >= 0`),
  uniqueIndex("variant_color_size").on(t.colorId, t.size),
  index("variants_product_idx").on(t.productId),
]);

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [check("customer_email_lower", sql`${t.email} = lower(${t.email})`)]);

export const discountKind = pgEnum("discount_kind", ["percent", "fixed"]);

export const discounts = pgTable("discounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(), // stored upper-case
  kind: discountKind("kind").notNull(),
  value: integer("value").notNull(), // percent (1–90) or cents
  minSpendCents: integer("min_spend_cents").notNull().default(0),
  usageLimit: integer("usage_limit"),
  used: integer("used").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  check("discount_code_upper", sql`${t.code} = upper(${t.code})`),
  check("discount_value", sql`(${t.kind} = 'percent' and ${t.value} between 1 and 90) or (${t.kind} = 'fixed' and ${t.value} > 0)`),
  check("discount_usage", sql`${t.usageLimit} is null or ${t.used} <= ${t.usageLimit}`),
]);

export const orderStatus = pgEnum("order_status", ["placed", "paid", "packed", "shipped", "delivered", "cancelled"]);
export const deliveryMethod = pgEnum("delivery_method", ["standard", "express", "pickup"]);
export const paymentMethod = pgEnum("payment_method", ["cod", "card"]);

export type Address = { line1: string; line2: string; city: string; postcode: string; country: string };

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  number: text("number").notNull().unique(),
  token: text("token").notNull().unique(),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  status: orderStatus("status").notNull().default("placed"),
  delivery: deliveryMethod("delivery").notNull(),
  payment: paymentMethod("payment").notNull(),
  address: jsonb("address").$type<Address | null>(),
  subtotalCents: integer("subtotal_cents").notNull(),
  discountCents: integer("discount_cents").notNull().default(0),
  shippingCents: integer("shipping_cents").notNull(),
  totalCents: integer("total_cents").notNull(),
  discountCode: text("discount_code"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  index("orders_created_idx").on(t.createdAt),
  check("order_totals", sql`${t.totalCents} = ${t.subtotalCents} - ${t.discountCents} + ${t.shippingCents} and ${t.totalCents} >= 0`),
]);

/** Line items snapshot name/colour/size/price, so later product edits never rewrite past orders. */
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  variantId: uuid("variant_id").notNull().references(() => variants.id),
  productId: uuid("product_id").notNull().references(() => products.id),
  name: text("name").notNull(),
  color: text("color").notNull(),
  size: text("size").notNull(),
  image: text("image").notNull(),
  unitCents: integer("unit_cents").notNull(),
  qty: integer("qty").notNull(),
}, t => [check("item_qty", sql`${t.qty} between 1 and 20`), index("order_items_order_idx").on(t.orderId)]);

export const orderEvents = pgTable("order_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  status: orderStatus("status").notNull(),
  note: text("note").notNull().default(""),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
});

export const productRelations = relations(products, ({ many }) => ({ colors: many(colors), variants: many(variants) }));
export const colorRelations = relations(colors, ({ one, many }) => ({ product: one(products, { fields: [colors.productId], references: [products.id] }), variants: many(variants) }));
export const variantRelations = relations(variants, ({ one }) => ({
  product: one(products, { fields: [variants.productId], references: [products.id] }),
  color: one(colors, { fields: [variants.colorId], references: [colors.id] }),
}));
export const orderRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  items: many(orderItems), events: many(orderEvents),
}));
export const orderItemRelations = relations(orderItems, ({ one }) => ({ order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }) }));
export const orderEventRelations = relations(orderEvents, ({ one }) => ({ order: one(orders, { fields: [orderEvents.orderId], references: [orders.id] }) }));
export const customerRelations = relations(customers, ({ many }) => ({ orders: many(orders) }));
