import {
  pgTable,
  serial,
  text,
  numeric,
  timestamp,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";

/**
 * A catalog product — either a solar panel or an inverter.
 * `size` means panel wattage (W) for panels and capacity (kW) for inverters.
 */
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  kind: text("kind").notNull(), // 'panel' | 'inverter'
  brand: text("brand").notNull().default(""),
  model: text("model").notNull().default(""),
  size: numeric("size", { precision: 10, scale: 2 }).notNull().default("0"),
  price: numeric("price", { precision: 12, scale: 2 }).notNull().default("0"),
  warranty: text("warranty").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: false })
    .notNull()
    .defaultNow(),
});

/**
 * Brand logos uploaded once per brand and reused automatically
 * whenever that brand appears in a quotation.
 */
export const brandLogos = pgTable("brand_logos", {
  id: serial("id").primaryKey(),
  brandKey: text("brand_key").notNull().unique(), // normalized lowercase brand
  brandName: text("brand_name").notNull().default(""),
  imageData: text("image_data").notNull(), // data:image/...;base64,...
  createdAt: timestamp("created_at", { withTimezone: false })
    .notNull()
    .defaultNow(),
});

/**
 * Saved quotations. The full editable payload lives in `data`.
 */
export const quotations = pgTable("quotations", {
  id: serial("id").primaryKey(),
  ref: text("ref").notNull().unique(), // e.g. MWQ-2026-0001
  customer: text("customer").notNull().default(""),
  address: text("address").notNull().default(""),
  phone: text("phone").notNull().default(""),
  date: text("date").notNull().default(""), // ISO yyyy-mm-dd
  status: text("status").notNull().default("draft"), // draft | ready
  capacity: numeric("capacity", { precision: 10, scale: 3 })
    .notNull()
    .default("0"),
  total: numeric("total", { precision: 14, scale: 2 }).notNull().default("0"),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: false })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: false })
    .notNull()
    .defaultNow(),
});

/**
 * Single-row company settings (M Way Solar identity, bank details, defaults).
 */
export const settings = pgTable("settings", {
  id: integer("id").primaryKey(), // always 1
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: false })
    .notNull()
    .defaultNow(),
});
