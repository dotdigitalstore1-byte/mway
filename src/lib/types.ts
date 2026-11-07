export type ProductKind = "panel" | "inverter" | "battery" | "cable" | "electrical" | "structure";

export interface Product {
  id: number;
  kind: ProductKind;
  brand: string;
  model: string;
  /** Legacy columns — kept for DB compatibility, not shown in the app. */
  size: number;
  price: number;
  warranty: string;
}

/** brandKey (lowercase trimmed brand) -> data URL */
export type LogoMap = Record<string, string>;

export type SystemType = "ongrid" | "hybrid";

export interface QuoteData {
  /** On-grid (net metering) or hybrid (grid + battery backup). */
  systemType: SystemType;
  /** System size in kW — 3, 4, 5 ... 12 (drives capacity & generation). */
  capacity: number;
  /**
   * When true the system capacity is optional to enter: it is calculated from
   * panel count × panel wattage instead of being typed in.
   */
  capacityAuto: boolean;
  /** Panel count. */
  qty: number;

  /** Three or more acceptable panel brands may be quoted. */
  panels: number[];
  /** Three or more acceptable inverter brands may be quoted. */
  inverters: number[];
  /** Battery brands — only used (and printed) for hybrid systems. */
  batteries: number[];
  /** Total battery storage capacity in kWh — hybrid systems only. */
  batteryKwh: number;
  batteryWarranty: string;
  /** Balance-of-system component brands (optional per quotation). */
  cables: number[];
  electricals: number[];
  structures: number[];

  /* ---- panel specification (printed on page 6) ---- */
  panelType: string;
  /** Wattage is quoted as an acceptable range — exact value known after supply. */
  panelWattsMin: number;
  panelWattsMax: number;
  panelWarranty: string;

  /* ---- inverter specification (printed on page 6) ---- */
  inverterType: string;
  inverterKw: number;
  inverterWarranty: string;
  /** Number of inverters — printed as a multiplier, e.g. 2 × 5 kW. */
  inverterQty: number;

  /** One total system cost for the whole installation (₹). */
  systemCost: number;
  /** Subsidy amount shown for information only (₹). */
  subsidy: number;
  /** Mounting structure: included in the total or extra. */
  withStructure: boolean;
  structureCost: number;
  /** KSEB charges: included in the total or extra. */
  withKseb: boolean;
  ksebCost: number;
  /** Whether the system cost already includes GST. */
  gstIncluded: boolean;

  unitsPerKw: number;
  tariff: number;
  validity: number;
  paymentTerms: string;
  terms: string;
  verified: boolean;
}

export interface QuoteMeta {
  id?: number;
  ref: string;
  customer: string;
  address: string;
  phone: string;
  date: string; // yyyy-mm-dd
}

export interface ActiveQuote extends QuoteMeta {
  data: QuoteData;
}

export interface ProposalContent {
  mission: string;
  vision: string;
  panelType: string;
  panelWarranty: string;
  inverterWarranty: string;
  cableBrand: string;
  cableSpec: string;
  electricalBrand: string;
  electricalSpec: string;
  structureBrand: string;
  structureSpec: string;
  batteryBrand: string;
  batterySpec: string;
  /** Fallback inverter type shown in the components table. */
  inverterType: string;
  installationNote: string;
  financingNote: string;
  thankYouNote: string;
}

export interface CompanySettings extends ProposalContent {
  name: string;
  phone: string;
  email: string;
  address: string;
  about: string;
  logo: string; // data URL or ""
  bankName: string;
  bankBranch: string;
  bankAccount: string;
  bankIfsc: string;
}

export interface QuotationRow {
  id: number;
  ref: string;
  customer: string;
  phone: string;
  date: string;
  status: string;
  capacity: number;
  total: number;
  createdAt: string;
}

export interface Bootstrap {
  products: Product[];
  logos: LogoMap;
  settings: CompanySettings;
  quotations: QuotationRow[];
  nextRef: string;
}
