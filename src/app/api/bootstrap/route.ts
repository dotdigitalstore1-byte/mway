import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, brandLogos, quotations, settings } from "@/db/schema";
import { desc } from "drizzle-orm";
import type { Bootstrap, CompanySettings, LogoMap, Product, QuotationRow } from "@/lib/types";
import { todayISO } from "@/lib/format";
import { nextRefFrom } from "@/lib/ref";

export const dynamic = "force-dynamic";

const DEFAULT_SETTINGS: CompanySettings = {
  name: "M Way Solar",
  phone: "+91-8606697313",
  email: "Mwaysolar1@gmail.com",
  address:
    "Ground Floor 19/540-B\nNear Pallichirangara Tridevi Temple\nPallichirangara, Pezhakkappilly\nErnakulam. Pincode: 686673",
  about:
    "Solar system design, installation and commissioning for homes and businesses.",
  logo: "",
  bankName: "UCO",
  bankBranch: "Muvattupuzha",
  bankAccount: "23900210003923",
  bankIfsc: "UCBA0002390",
  mission:
    "We are on a mission to deliver 10,000 world-class solar installations ensuring maximum performance, durability, and ROI for every project.",
  vision:
    "To lead the transition towards a cleaner, smarter, and more sustainable future by making reliable solar energy accessible to every home and business.",
  panelType: "TOPCon Bifacial",
  panelWarranty: "12/30 yrs (prod/perf)",
  inverterWarranty: "10 years",
  cableBrand: "Havells",
  cableSpec: "DC/AC solar cables — UV-resistant, double insulated",
  electricalBrand: "Havells / L&T",
  electricalSpec: "MC4 connectors, ACDB, DCDB, lightning arrestor, earthing kit",
  structureBrand: "Apollo Steel",
  structureSpec: "25 years warranty · HDGI structure",
  batteryBrand: "Luminous",
  batterySpec: "Li-ion 51.2V · 100Ah · 5 kWh storage (optional add-on)",
  inverterType: "On-Grid",
  installationNote:
    "Professional installation with comprehensive after-sales support.",
  financingNote: "Residential starts at 6% only",
  thankYouNote:
    "KSEB charges, feasibility charges, application fees, meter charges, and any other statutory charges related to the solar system installation/connection shall be borne and paid directly by the customer to KSEB/concerned authority. These charges are not included in the quoted solar system price.",
};

// DEMONSTRATION RATES — replace with your actual prices before issuing quotes.
const SEED_PRODUCTS = [
  { kind: "panel", brand: "Adani", model: "TOPCon Bifacial", size: "600", price: "12000", warranty: "Confirm manufacturer's warranty" },
  { kind: "panel", brand: "Waaree", model: "TOPCon Bifacial", size: "630", price: "12500", warranty: "Confirm manufacturer's warranty" },
  { kind: "panel", brand: "Tata Power Solar", model: "Mono PERC", size: "550", price: "11200", warranty: "Confirm manufacturer's warranty" },
  { kind: "inverter", brand: "Deye", model: "On-grid inverter", size: "3", price: "38000", warranty: "Confirm manufacturer's warranty" },
  { kind: "inverter", brand: "Livguard", model: "On-grid inverter", size: "3", price: "36000", warranty: "Confirm manufacturer's warranty" },
  { kind: "inverter", brand: "Growatt", model: "On-grid inverter", size: "5", price: "44000", warranty: "Confirm manufacturer's warranty" },
  { kind: "battery", brand: "Luminous", model: "Li-ion 51.2V 100Ah", size: "5", price: "0", warranty: "Confirm manufacturer's warranty" },
  { kind: "battery", brand: "Exide", model: "Tubular 150Ah", size: "0", price: "0", warranty: "Confirm manufacturer's warranty" },
  { kind: "cable", brand: "Havells", model: "DC 4 sq.mm solar cable", size: "0", price: "0", warranty: "UV-resistant, double insulated" },
  { kind: "cable", brand: "Polycab", model: "AC 10 sq.mm cable", size: "0", price: "0", warranty: "UV-resistant, double insulated" },
  { kind: "electrical", brand: "Havells", model: "ACDB / DCDB with MCB", size: "0", price: "0", warranty: "IS/IEC standard, surge protected" },
  { kind: "electrical", brand: "L&T", model: "MC4 connectors + earthing kit", size: "0", price: "0", warranty: "IS/IEC standard, surge protected" },
  { kind: "structure", brand: "Apollo Steel", model: "HDGI elevated structure", size: "0", price: "0", warranty: "Corrosion-free, mid & end clamps" },
  { kind: "structure", brand: "Tata Structura", model: "GI roof-mount rails", size: "0", price: "0", warranty: "Corrosion-free, mid & end clamps" },
] as const;

function toProduct(row: typeof products.$inferSelect): Product {
  return {
    id: row.id,
    kind: (["panel", "inverter", "battery", "cable", "electrical", "structure"].includes(row.kind)
      ? row.kind
      : "panel") as Product["kind"],
    brand: row.brand,
    model: row.model,
    size: Number(row.size),
    price: Number(row.price),
    warranty: row.warranty,
  };
}

async function ensureSeed() {
  const existing = await db.select({ kind: products.kind }).from(products);
  const kinds = new Set(existing.map((r) => r.kind));
  for (const kind of ["panel", "inverter", "battery", "cable", "electrical", "structure"] as const) {
    if (kinds.has(kind)) continue;
    const seed = SEED_PRODUCTS.filter((p) => p.kind === kind);
    if (seed.length) await db.insert(products).values(seed.map((p) => ({ ...p })));
  }
  const existingSettings = await db.select({ id: settings.id }).from(settings).limit(1);
  if (existingSettings.length === 0) {
    await db.insert(settings).values({ id: 1, data: DEFAULT_SETTINGS });
  }
}

export async function GET() {
  try {
    await ensureSeed();

    const [productRows, logoRows, quotationRows, settingRows] = await Promise.all([
      db.select().from(products).orderBy(products.id),
      db.select().from(brandLogos).orderBy(brandLogos.id),
      db.select().from(quotations).orderBy(desc(quotations.updatedAt)),
      db.select().from(settings),
    ]);

    const logos: LogoMap = {};
    for (const row of logoRows) logos[row.brandKey] = row.imageData;

    const settingsData: CompanySettings = {
      ...DEFAULT_SETTINGS,
      ...((settingRows[0]?.data as Partial<CompanySettings>) ?? {}),
    };

    const quotationList: QuotationRow[] = quotationRows.map((row) => ({
      id: row.id,
      ref: row.ref,
      customer: row.customer,
      phone: row.phone,
      date: row.date,
      status: row.status,
      capacity: Number(row.capacity),
      total: Number(row.total),
      createdAt: row.createdAt.toISOString(),
    }));

    const payload: Bootstrap = {
      products: productRows.map(toProduct),
      logos,
      settings: settingsData,
      quotations: quotationList,
      nextRef: nextRefFrom(quotationRows.map((r) => r.ref)),
    };

    return NextResponse.json({ ok: true, date: todayISO(), ...payload });
  } catch (error) {
    console.error("bootstrap failed", error);
    return NextResponse.json(
      { ok: false, error: "Failed to load workspace data." },
      { status: 500 },
    );
  }
}
