import type { Product, ProductKind, QuoteData } from "./types";
import { num } from "./format";

export interface MonthPoint {
  label: string;
  potential: number;
  expected: number;
}

export interface Totals {
  qty: number;
  capacity: number;
  systemCost: number;
  structure: number;
  kseb: number;
  subsidy: number;
  totalPayable: number;
  annualUnits: number;
  annualSaving: number;
  paybackYears: number;
  lifetimeSaving: number;
  cumulative: number[];
  monthly: MonthPoint[];
  co2Tons: number;
  forestAcres: number;
  coalTons: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** Seasonal shape for Kerala — fraction of the yearly total. */
const SHAPE = [9.8, 9.4, 9.9, 9.2, 8.2, 6.4, 6.6, 7.2, 8.1, 8.4, 8.2, 8.6];
const PR = 0.75;
const ESCALATION = 0.03;

/** Average panel wattage — the midpoint when a range (e.g. 580–630 W) is quoted. */
export function panelWattsAvg(data: QuoteData): number {
  const lo = num(data.panelWattsMin);
  const hi = num(data.panelWattsMax);
  if (lo > 0 && hi > 0) return (lo + hi) / 2;
  return lo > 0 ? lo : hi > 0 ? hi : 0;
}

/** DC array size from panel count × panel wattage (kW), 2 decimals. */
export function arrayCapacityOf(data: QuoteData): number {
  const qty = Math.floor(num(data.qty));
  return Math.round(((qty * panelWattsAvg(data)) / 1000) * 100) / 100;
}

/**
 * System size: typed in by the user (3 kW, 4 kW, 5 kW ...) or — when
 * "calculate from panels" is on — worked out from panel count × wattage.
 */
export function capacityOf(data: QuoteData): number {
  if (data.capacityAuto) {
    const auto = arrayCapacityOf(data);
    if (auto > 0) return auto;
  }
  return Math.round(num(data.capacity) * 1000) / 1000;
}

export const isHybrid = (data: QuoteData): boolean => data.systemType === "hybrid";

/** "On-Grid" / "Hybrid" label for the proposal. */
export function systemLabel(data: QuoteData): string {
  return isHybrid(data) ? "Hybrid" : "On-Grid";
}

export function calcTotals(data: QuoteData): Totals {
  const qty = Math.floor(num(data.qty));
  const capacity = capacityOf(data);
  const systemCost = num(data.systemCost);
  const structure = data.withStructure ? num(data.structureCost) : 0;
  const kseb = data.withKseb ? num(data.ksebCost) : 0;
  const totalPayable = Math.round((systemCost + structure + kseb) * 100) / 100;
  const subsidy = num(data.subsidy);

  const annualUnits = Math.round(capacity * num(data.unitsPerKw) * 365);
  const annualSaving = Math.round(annualUnits * num(data.tariff));

  const cumulative: number[] = [];
  let running = 0;
  let firstYear = annualSaving;
  for (let year = 1; year <= 25; year++) {
    const saving = annualSaving * Math.pow(1 + ESCALATION, year - 1);
    if (year === 1) firstYear = saving;
    running += saving;
    cumulative.push(Math.round(running));
  }
  const paybackYears = firstYear > 0 ? Math.round((totalPayable / firstYear) * 10) / 10 : 0;

  const yearUnits = capacity * num(data.unitsPerKw) * 365;
  const monthly: MonthPoint[] = SHAPE.map((share, i) => {
    const potential = Math.round((yearUnits * share) / 100);
    return {
      label: MONTHS[i],
      potential,
      expected: Math.round(potential * PR),
    };
  });

  const co2Tons = Math.round(yearUnits * 0.82) / 1000;
  return {
    qty,
    capacity,
    systemCost,
    structure,
    kseb,
    subsidy,
    totalPayable,
    annualUnits,
    annualSaving,
    paybackYears,
    lifetimeSaving: cumulative[cumulative.length - 1] ?? 0,
    cumulative,
    monthly,
    co2Tons,
    forestAcres: Math.round(co2Tons * 22 * 10) / 10,
    coalTons: Math.round(co2Tons * 0.48 * 100) / 100,
  };
}

/** Resolve selected products for a kind, tolerating deleted catalog entries. */
export function selectedFor(products: Product[], kind: ProductKind, ids: number[]): Product[] {
  const list = products.filter((p) => p.kind === kind);
  if (list.length === 0) return [];
  const chosen = ids
    .map((id) => list.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));
  if (chosen.length === 0) return [list[0]];
  return chosen.filter((p, i) => chosen.findIndex((x) => x.id === p.id) === i);
}

/** Keep the first brand as the headline product. */
export function primaryOf(list: Product[]): Product | undefined {
  return list[0];
}

export function defaultQuoteData(): QuoteData {
  return {
    systemType: "ongrid",
    capacity: 5,
    capacityAuto: false,
    qty: 9,
    panels: [],
    inverters: [],
    batteries: [],
    batteryKwh: 5,
    batteryWarranty: "10 years",
    cables: [],
    electricals: [],
    structures: [],
    panelType: "TOPCon Bifacial",
    panelWattsMin: 580,
    panelWattsMax: 630,
    panelWarranty: "12/30 yrs (prod/perf)",
    inverterType: "On-Grid",
    inverterKw: 5,
    inverterWarranty: "10 years",
    inverterQty: 1,
    systemCost: 250000,
    subsidy: 78000,
    withStructure: true,
    structureCost: 0,
    withKseb: false,
    ksebCost: 6500,
    gstIncluded: true,
    unitsPerKw: 3.86,
    tariff: 8,
    validity: 15,
    paymentTerms:
      "60% on procurement; 30% upon installation; 10% after net metering.",
    terms:
      "Final component selection and system design are subject to site survey and availability. Grid approval and net-metering timelines depend on KSEB.",
    verified: false,
  };
}

/** Normalise stored data — supports quotations saved with the old panel1/panel2 keys. */
export function normalizeQuoteData(raw: unknown): QuoteData {
  const base = defaultQuoteData();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;
  const data: QuoteData = { ...base };

  const numberKeys: (keyof QuoteData)[] = [
    "capacity", "qty", "panelWattsMin", "panelWattsMax", "inverterKw", "inverterQty", "batteryKwh",
    "systemCost", "subsidy", "structureCost", "ksebCost",
    "unitsPerKw", "tariff", "validity",
  ];
  for (const key of numberKeys) {
    const v = r[key];
    if (typeof v === "number" && Number.isFinite(v)) {
      (data[key] as number) = v;
    } else if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) {
      (data[key] as number) = Number(v);
    }
  }
  // migrate the old single-wattage field into a range
  const legacyWatts = Number(r.panelWatts);
  if (!Number.isFinite(Number(r.panelWattsMin)) && Number.isFinite(legacyWatts) && legacyWatts > 0) {
    data.panelWattsMin = legacyWatts;
    data.panelWattsMax = legacyWatts;
  }

  const stringKeys: (keyof QuoteData)[] = [
    "panelType", "panelWarranty", "inverterType", "inverterWarranty", "batteryWarranty", "paymentTerms", "terms",
  ];
  for (const key of stringKeys) {
    const v = r[key];
    if (typeof v === "string") (data[key] as string) = v;
  }
  const boolKeys: (keyof QuoteData)[] = ["withStructure", "withKseb", "gstIncluded", "verified", "capacityAuto"];
  for (const key of boolKeys) {
    if (typeof r[key] === "boolean") (data[key] as boolean) = r[key] as boolean;
  }

  const asIds = (value: unknown): number[] =>
    Array.isArray(value) ? value.map(Number).filter((n) => Number.isFinite(n)) : [];

  let panels = asIds(r.panels);
  if (panels.length === 0) {
    panels = asIds([r.panel1, r.panel2, r.panel3, r.panel4]);
  }
  data.panels = panels;

  let inverters = asIds(r.inverters);
  if (inverters.length === 0) {
    inverters = asIds([r.inverter1, r.inverter2, r.inverter3, r.inverter4]);
  }
  data.inverters = inverters;
  data.batteries = asIds(r.batteries);
  // quotations saved before the On-Grid / Hybrid option: a battery meant hybrid
  data.systemType =
    r.systemType === "hybrid" || r.systemType === "ongrid"
      ? r.systemType
      : data.batteries.length > 0
        ? "hybrid"
        : "ongrid";
  data.cables = asIds(r.cables);
  data.electricals = asIds(r.electricals);
  data.structures = asIds(r.structures);

  return data;
}

/** Validation performed before printing / issuing a quotation. */
export function validateForPrint(
  data: QuoteData,
  meta: { customer: string; address: string; phone: string },
  panels: Product[],
  inverters: Product[],
  companyName: string,
  companyContact: string,
  bankFields: { name: string; branch: string; account: string; ifsc: string },
): string[] {
  const issues: string[] = [];
  const hasText = (v: string) => v.trim().length > 0;

  if (!hasText(meta.customer) || (!hasText(meta.address) && !hasText(meta.phone))) {
    issues.push("Enter the customer's name and address or phone number.");
  }
  if (!hasText(companyName) || !hasText(companyContact)) {
    issues.push("Enter the company name and at least a phone number or email in Company settings.");
  }
  if (capacityOf(data) <= 0) {
    issues.push(
      data.capacityAuto
        ? "Enter the panel count and panel wattage so the system capacity can be calculated."
        : "Choose the system capacity (3 kW, 4 kW, 5 kW …).",
    );
  }
  if (isHybrid(data) && num(data.batteryKwh) <= 0) {
    issues.push("Enter the battery capacity (kWh) for the hybrid system.");
  }
  if (panels.length === 0 || inverters.length === 0) {
    issues.push("Choose at least one panel and one inverter in the catalog.");
  }
  if (num(data.systemCost) <= 0) {
    issues.push("Enter the total system cost for this quotation.");
  }
  if (
    num(data.panelWattsMin) > 0 &&
    num(data.panelWattsMax) > 0 &&
    num(data.panelWattsMin) > num(data.panelWattsMax)
  ) {
    issues.push("The panel wattage range must run from the lower value to the higher value (e.g. 580–630 W).");
  }
  const anyBank = [bankFields.name, bankFields.branch, bankFields.account, bankFields.ifsc].some(hasText);
  if (anyBank && (!hasText(bankFields.name) || !hasText(bankFields.account) || !hasText(bankFields.ifsc))) {
    issues.push("Complete the bank name, account number and IFSC, or clear all bank fields.");
  }
  if (!data.verified) {
    issues.push("Verify the total amount, subsidy, KSEB and structure options, then tick the confirmation checkbox.");
  }
  return issues;
}
