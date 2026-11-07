/** Compute the next quotation reference like MWQ-2026-0007. */
export function nextRefFrom(refs: string[]): string {
  const year = new Date().getFullYear();
  const prefix = `MWQ-${year}-`;
  let max = 0;
  for (const ref of refs) {
    if (ref.startsWith(prefix)) {
      const n = parseInt(ref.slice(prefix.length), 10);
      if (Number.isFinite(n) && n > max) max = n;
    }
  }
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}
