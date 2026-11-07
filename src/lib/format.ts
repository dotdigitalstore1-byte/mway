const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function money(value: number): string {
  return inr.format(Number.isFinite(value) ? value : 0);
}

/** Reference-style amount: "Rs 2,50,000" */
export function rs(value: number): string {
  return `Rs ${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

/** Compact Indian amount: ₹4.3Cr / ₹78.0L / ₹45K */
export function inrShort(value: number): string {
  const v = Number(value) || 0;
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(1)}Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(1)}L`;
  if (v >= 1e3) return `₹${Math.round(v / 1e3)}K`;
  return `₹${Math.round(v)}`;
}

export function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function has(value: unknown): boolean {
  return String(value ?? "").trim().length > 0;
}

/** "580–630 W", or "615 W" when the range is a single value. */
export function wattRange(min: number, max: number): string {
  const lo = Number(min) || 0;
  const hi = Number(max) || 0;
  if (lo > 0 && hi > 0 && lo !== hi) {
    return `${Math.min(lo, hi)}–${Math.max(lo, hi)} W`;
  }
  const single = hi || lo;
  return single > 0 ? `${single} W` : "—";
}

export function capacityFmt(value: number): string {
  return Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function displayDate(value: string): string {
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${d.getFullYear()}`;
}

export function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function brandKey(brand: string): string {
  return brand.trim().toLowerCase();
}
