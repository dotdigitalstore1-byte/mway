"use client";

import {
  BadgeCheck,
  BatteryCharging,
  IndianRupee,
  Layers,
  Plug,
  Plus,
  TriangleAlert,
  User,
  X,
} from "lucide-react";
import type { Product, ProductKind, QuoteData, QuoteMeta, SystemType } from "@/lib/types";
import { arrayCapacityOf } from "@/lib/calc";
import { capacityFmt, money, wattRange } from "@/lib/format";
import { Field, NumberInput, Select, SectionCard, SwitchRow, TextArea, TextInput } from "./ui";

function productLabel(p: Product): string {
  return `${p.brand} — ${p.model}`;
}

/** System sizes M Way Solar actually sells. */
const CAPACITIES = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/** Possible DC array size for the quoted panel count and wattage range. */
function arrayKw(qty: number, min: number, max: number): string {
  const q = Math.max(0, Math.floor(Number(qty) || 0));
  const lo = Math.max(0, Number(min) || 0);
  const hi = Math.max(0, Number(max) || 0);
  if (!q || (!lo && !hi)) return "—";
  const low = (q * Math.min(lo || hi, hi || lo)) / 1000;
  const high = (q * Math.max(lo || hi, hi || lo)) / 1000;
  if (low === high) return `${capacityFmt(low)} kW`;
  return `${capacityFmt(low)}–${capacityFmt(high)} kW`;
}

/** Typical hybrid battery sizes (kWh) for the quick buttons. */
const BATTERY_KWH = [2.5, 5, 5.12, 7.5, 10, 10.24, 15, 20];

/** Keep the inverter "type" text in step with the chosen system type. */
function inverterTypeFor(current: string, type: SystemType): string {
  const label = type === "hybrid" ? "Hybrid" : "On-Grid";
  if (!current.trim() || /^(on[- ]?grid|hybrid)$/i.test(current.trim())) return label;
  return current;
}

/** Common module wattage ranges — exact wattage is often known only after supply. */
const WATT_RANGES: [number, number][] = [
  [540, 580],
  [550, 600],
  [570, 610],
  [580, 630],
  [600, 650],
  [600, 700],
];

function MultiBrand({
  label,
  hint,
  kind,
  ids,
  products,
  onChange,
}: {
  label: string;
  hint: string;
  kind: "panel" | "inverter";
  ids: number[];
  products: Product[];
  onChange: (ids: number[]) => void;
}) {
  const options = products.filter((p) => p.kind === kind);
  const rows = ids.length ? ids : [options[0]?.id ?? 0];
  const used = new Set(ids);

  const update = (index: number, value: number) => {
    const next = [...rows];
    next[index] = value;
    onChange(next.filter((v, i) => v && next.indexOf(v) === i));
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-emerald-950/60">
          {label}
        </span>
        <span className="text-[10px] font-semibold text-emerald-800/60">{rows.length} option{rows.length > 1 ? "s" : ""}</span>
      </div>
      <div className="space-y-2">
        {rows.map((id, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="grid h-6 w-6 flex-none place-items-center rounded-md bg-emerald-100 text-[10px] font-bold text-emerald-800">
              {index + 1}
            </span>
            <Select value={String(id ?? "")} onChange={(v) => update(index, Number(v))}>
              {options.map((p) => (
                <option key={p.id} value={p.id} disabled={index !== rows.indexOf(p.id) && used.has(p.id)}>
                  {productLabel(p)}
                </option>
              ))}
            </Select>
            {rows.length > 1 ? (
              <button
                type="button"
                onClick={() => onChange(rows.filter((_, i) => i !== index))}
                className="grid h-8 w-8 flex-none place-items-center rounded-lg border border-red-900/15 bg-white text-red-700 transition hover:border-red-700/40"
                aria-label="Remove brand option"
              >
                <X size={13} />
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            const spare = options.find((o) => !used.has(o.id));
            if (!spare) return;
            onChange([...rows, spare.id]);
          }}
          disabled={options.every((o) => used.has(o.id))}
          className="inline-flex items-center gap-1 rounded-lg border border-emerald-800/20 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-emerald-900 transition hover:border-emerald-700/50 disabled:opacity-40"
        >
          <Plus size={12} /> Add another brand
        </button>
      </div>
      <p className="mt-1 text-[11px] leading-snug text-emerald-950/45">{hint}</p>
    </div>
  );
}

function OptionalPicker({
  label,
  hint,
  kind,
  ids,
  products,
  onChange,
  emptyLabel,
}: {
  label: string;
  hint: string;
  kind: ProductKind;
  ids: number[];
  products: Product[];
  onChange: (ids: number[]) => void;
  emptyLabel: string;
}) {
  const options = products.filter((p) => p.kind === kind);
  const slots = Math.max(1, ids.length);

  const setSlot = (index: number, value: string) => {
    const next = [...ids];
    while (next.length < slots) next.push(0);
    next[index] = value ? Number(value) : 0;
    onChange(next.filter((n, i) => n && next.indexOf(n) === i));
  };

  return (
    <div className="rounded-xl border border-emerald-950/10 bg-white p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-emerald-950/60">
          {label}
        </span>
        <span className="text-[10px] font-semibold text-emerald-800/60">
          {options.length} in catalog
        </span>
      </div>
      <div className="space-y-2">
        {Array.from({ length: slots }).map((_, index) => (
          <div key={index} className="flex items-center gap-2">
            <Select value={String(ids[index] ?? "")} onChange={(v) => setSlot(index, v)}>
              <option value="">{index === 0 ? emptyLabel : "No second brand"}</option>
              {options.map((b) => (
                <option
                  key={b.id}
                  value={b.id}
                  disabled={ids.includes(b.id) && ids[index] !== b.id}
                >
                  {b.brand} — {b.model}
                </option>
              ))}
            </Select>
            {ids[index] ? (
              <button
                type="button"
                onClick={() => onChange(ids.filter((_, i) => i !== index))}
                className="grid h-8 w-8 flex-none place-items-center rounded-lg border border-red-900/15 bg-white text-red-700 transition hover:border-red-700/40"
                aria-label="Clear selection"
              >
                <X size={13} />
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            const spare = options.find((o) => !ids.includes(o.id));
            if (!spare) return;
            onChange([...ids.filter(Boolean), spare.id]);
          }}
          disabled={options.length === 0 || options.every((o) => ids.includes(o.id))}
          className="inline-flex items-center gap-1 rounded-lg border border-emerald-800/20 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-emerald-900 transition hover:border-emerald-700/50 disabled:opacity-40"
        >
          <Plus size={12} /> Add brand
        </button>
        <span className="text-[10.5px] text-emerald-950/45">Optional</span>
      </div>
      <p className="mt-1 text-[11px] leading-snug text-emerald-950/45">{hint}</p>
    </div>
  );
}

export function QuoteForm({
  meta,
  data,
  products,
  totals,
  onMeta,
  onData,
}: {
  meta: QuoteMeta;
  data: QuoteData;
  products: Product[];
  totals: {
    capacity: number;
    systemCost: number;
    structure: number;
    kseb: number;
    subsidy: number;
    totalPayable: number;
    annualUnits: number;
    annualSaving: number;
  };
  onMeta: (patch: Partial<QuoteMeta>) => void;
  onData: (patch: Partial<QuoteData>) => void;
}) {
  const panels = products.filter((p) => p.kind === "panel");
  const inverters = products.filter((p) => p.kind === "inverter");

  return (
    <div className="space-y-4">
      {/* 1 · customer */}
      <SectionCard step="Step 1" icon={User} title="Customer" subtitle="Shown on the proposal cover">
        <div className="space-y-3">
          <Field label="Customer name">
            <TextInput value={meta.customer} onChange={(v) => onMeta({ customer: v })} placeholder="e.g. Ameer N B" />
          </Field>
          <Field label="Address">
            <TextArea value={meta.address} onChange={(v) => onMeta({ address: v })} placeholder="House, place, district, PIN" rows={2} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone">
              <TextInput type="tel" value={meta.phone} onChange={(v) => onMeta({ phone: v })} placeholder="Customer phone" />
            </Field>
            <Field label="Quotation date">
              <TextInput type="date" value={meta.date} onChange={(v) => onMeta({ date: v })} />
            </Field>
          </div>
          <Field label="Quotation number" hint="Auto-suggested — locked when you save the quotation.">
            <TextInput value={meta.ref} onChange={(v) => onMeta({ ref: v })} />
          </Field>
        </div>
      </SectionCard>

      {/* 2 · system */}
      <SectionCard
        step="Step 2"
        icon={Layers}
        title="System & brands"
        subtitle="Drives capacity, the component brands and their logos"
      >
        <div className="space-y-3">
          {/* system type */}
          <div>
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.07em] text-emerald-950/60">
              System type
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { value: "ongrid", label: "On-Grid", sub: "Grid-tied · net metering", Icon: Plug },
                  { value: "hybrid", label: "Hybrid", sub: "Grid + battery backup", Icon: BatteryCharging },
                ] as const
              ).map(({ value, label, sub, Icon }) => {
                const active = data.systemType === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      onData({
                        systemType: value,
                        inverterType: inverterTypeFor(data.inverterType, value),
                      })
                    }
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
                      active
                        ? "border-emerald-700 bg-emerald-800 text-white shadow"
                        : "border-emerald-950/15 bg-white text-emerald-900 hover:border-emerald-700/50"
                    }`}
                  >
                    <Icon size={18} />
                    <span>
                      <span className="block text-[13px] font-bold leading-tight">{label}</span>
                      <span className={`block text-[11px] leading-tight ${active ? "text-white/75" : "text-emerald-950/50"}`}>
                        {sub}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-emerald-950/10 bg-emerald-50/50 p-3">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-emerald-950/60">
                System capacity (kW){data.capacityAuto ? " · auto" : ""}
              </span>
              <span className="font-display text-sm font-bold text-emerald-800">
                {capacityFmt(totals.capacity)} kW
              </span>
            </div>
            <div className={`grid grid-cols-5 gap-1.5 ${data.capacityAuto ? "pointer-events-none opacity-40" : ""}`}>
              {CAPACITIES.map((kw) => {
                const active = Number(data.capacity) === kw;
                return (
                  <button
                    key={kw}
                    type="button"
                    disabled={data.capacityAuto}
                    onClick={() => onData({ capacity: kw })}
                    className={`rounded-lg border py-2 text-[12.5px] font-bold transition ${
                      active
                        ? "border-emerald-700 bg-emerald-800 text-white shadow"
                        : "border-emerald-950/15 bg-white text-emerald-900 hover:border-emerald-700/50"
                    }`}
                  >
                    {kw} kW
                  </button>
                );
              })}
            </div>
            <div className="mt-2">
              <Field label="Other size (kW)" hint={data.capacityAuto ? "Switched off — capacity is calculated from the panels below." : undefined}>
                <NumberInput
                  value={data.capacity}
                  min={1}
                  step={0.5}
                  disabled={data.capacityAuto}
                  onChange={(v) => onData({ capacity: v })}
                />
              </Field>
            </div>

            {/* panels — count */}
            <div className="mt-3 border-t border-emerald-950/10 pt-3">
              <Field label="Panel count">
                <NumberInput value={data.qty} min={0} step={1} onChange={(v) => onData({ qty: v })} />
              </Field>
              <p className="mt-1.5 text-[11px] leading-snug text-emerald-950/45">
                Panel wattage (single value or range) is set in Step 2b.
              </p>
              <div className="mt-2">
                <SwitchRow
                  checked={data.capacityAuto}
                  onChange={(v) =>
                    onData(v ? { capacityAuto: true, capacity: arrayCapacityOf(data) || data.capacity } : { capacityAuto: false })
                  }
                  title="Calculate system capacity from panels"
                  hint="Optional — skips choosing a kW size: capacity = panel count × panel watts."
                />
              </div>
            </div>
          </div>
          <MultiBrand
            label="Solar panel brands — any one may be installed"
            hint="Add three or more acceptable brands. All of their logos are printed together on the components page."
            kind="panel"
            ids={data.panels}
            products={products}
            onChange={(ids) => onData({ panels: ids })}
          />
          <MultiBrand
            label="Inverter brands — any one may be installed"
            hint="The first inverter brand is the primary option; the total system cost covers one inverter."
            kind="inverter"
            ids={data.inverters}
            products={products}
            onChange={(ids) => onData({ inverters: ids })}
          />
          <div className="space-y-2.5">
            {data.systemType === "hybrid" ? (
              <div className="space-y-2.5 rounded-xl border border-emerald-700/25 bg-emerald-50/60 p-3">
                <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.07em] text-emerald-800">
                  <BatteryCharging size={15} /> Hybrid battery storage
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Battery capacity (kWh)">
                    <NumberInput
                      value={data.batteryKwh}
                      min={0}
                      step={0.5}
                      onChange={(v) => onData({ batteryKwh: v })}
                    />
                  </Field>
                  <Field label="Battery warranty">
                    <TextInput
                      value={data.batteryWarranty}
                      onChange={(v) => onData({ batteryWarranty: v })}
                      placeholder="10 years"
                    />
                  </Field>
                </div>
                <div className="flex flex-wrap gap-1">
                  {BATTERY_KWH.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => onData({ batteryKwh: k })}
                      className={`rounded-md border px-2 py-1 text-[11px] font-bold transition ${
                        Number(data.batteryKwh) === k
                          ? "border-emerald-700 bg-emerald-800 text-white"
                          : "border-emerald-950/15 bg-white text-emerald-900 hover:border-emerald-700/50"
                      }`}
                    >
                      {k} kWh
                    </button>
                  ))}
                </div>
                <OptionalPicker
                  label="Battery brand"
                  kind="battery"
                  ids={data.batteries}
                  products={products}
                  emptyLabel="Brand to be confirmed"
                  hint="Optional. Selected brands and logos print on the components page. Manage brands in Products & logos → Battery."
                  onChange={(ids) => onData({ batteries: ids })}
                />
              </div>
            ) : null}
            <OptionalPicker
              label="Cable"
              kind="cable"
              ids={data.cables}
              products={products}
              emptyLabel="Use default catalog cable"
              hint="Pick the cable brands supplied for this site. Managed in Products & logos → Cable."
              onChange={(ids) => onData({ cables: ids })}
            />
            <OptionalPicker
              label="Electrical"
              kind="electrical"
              ids={data.electricals}
              products={products}
              emptyLabel="Use default electrical"
              hint="ACDB/DCDB, MC4, earthing and protection brands for this installation."
              onChange={(ids) => onData({ electricals: ids })}
            />
            <OptionalPicker
              label="Structure"
              kind="structure"
              ids={data.structures}
              products={products}
              emptyLabel="Use default structure"
              hint="Mounting structure brand. The include/extra charge is set in Step 3."
              onChange={(ids) => onData({ structures: ids })}
            />
          </div>
        </div>
      </SectionCard>

      {/* 2b · specification */}
      <SectionCard
        step="Step 2b"
        icon={Layers}
        tone="amber"
        title="Panel & inverter specification"
        subtitle="Exact values printed on the Solar Components page"
      >
        <div className="space-y-3">
          <Field label="Panel type">
            <TextInput value={data.panelType} onChange={(v) => onData({ panelType: v })} />
          </Field>

          <div className="rounded-xl border border-emerald-950/10 bg-emerald-50/50 p-3">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-emerald-950/60">
                Panel watts each (range)
              </span>
              <span className="font-display text-[12.5px] font-bold text-emerald-800">
                {wattRange(data.panelWattsMin, data.panelWattsMax)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {WATT_RANGES.map((r) => {
                const active =
                  Number(data.panelWattsMin) === r[0] && Number(data.panelWattsMax) === r[1];
                return (
                  <button
                    key={`${r[0]}-${r[1]}`}
                    type="button"
                    onClick={() => onData({ panelWattsMin: r[0], panelWattsMax: r[1] })}
                    className={`rounded-lg border py-1.5 text-[11.5px] font-bold transition ${
                      active
                        ? "border-emerald-700 bg-emerald-800 text-white shadow"
                        : "border-emerald-950/15 bg-white text-emerald-900 hover:border-emerald-700/50"
                    }`}
                  >
                    {r[0]}–{r[1]} W
                  </button>
                );
              })}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Field label="From (W)">
                <NumberInput
                  value={data.panelWattsMin}
                  step={5}
                  onChange={(v) => onData({ panelWattsMin: v })}
                />
              </Field>
              <Field label="To (W)">
                <NumberInput
                  value={data.panelWattsMax}
                  step={5}
                  onChange={(v) => onData({ panelWattsMax: v })}
                />
              </Field>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-emerald-950/45">
              Use a range when the exact wattage is confirmed only after material arrives. It prints
              as “580–630 W per panel” on the components page.
            </p>
          </div>
          <Field label="Panel warranty">
            <TextInput value={data.panelWarranty} onChange={(v) => onData({ panelWarranty: v })} placeholder="12/30 yrs (prod/perf)" />
          </Field>
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11.5px] font-semibold text-amber-900">
            Array check: {data.qty || 0} × {wattRange(data.panelWattsMin, data.panelWattsMax)} ={" "}
            {arrayKw(data.qty, data.panelWattsMin, data.panelWattsMax)} · quoted{" "}
            {capacityFmt(totals.capacity)} kW
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Inverter type">
              <TextInput value={data.inverterType} onChange={(v) => onData({ inverterType: v })} placeholder={data.systemType === "hybrid" ? "Hybrid" : "On-Grid"} />
            </Field>
            <Field label="Inverter capacity (kW)">
              <NumberInput value={data.inverterKw} step={0.5} onChange={(v) => onData({ inverterKw: v })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Inverter warranty">
              <TextInput value={data.inverterWarranty} onChange={(v) => onData({ inverterWarranty: v })} placeholder="10 years" />
            </Field>
            <Field label="Number of inverters" hint={`Prints as ${data.inverterQty || 1} × ${data.inverterKw || 0} kW`}>
              <NumberInput value={data.inverterQty} min={1} step={1} onChange={(v) => onData({ inverterQty: v })} />
            </Field>
          </div>
        </div>
      </SectionCard>

      {/* 3 · commercial */}
      <SectionCard
        step="Step 3"
        icon={IndianRupee}
        title="Total, subsidy & charges"
        subtitle="One amount for the whole system — no per-panel rates"
      >
        <div className="space-y-3">
          <Field label="System cost — total amount (₹)" hint="The all-inclusive price quoted to the customer.">
            <NumberInput value={data.systemCost} step={1000} onChange={(v) => onData({ systemCost: v })} />
          </Field>

          <Field label="Subsidy shown (₹)" hint="Displayed on the offer page for information only — never deducted.">
            <NumberInput value={data.subsidy} step={1000} onChange={(v) => onData({ subsidy: v })} />
          </Field>

          <div className="rounded-xl border border-emerald-950/10 bg-emerald-50/50 p-3">
            <SwitchRow
              checked={data.withStructure}
              onChange={(v) => onData({ withStructure: v })}
              title="Structure charge included"
              hint={data.withStructure ? "Added to the total payable amount." : "Shown as STRUCTURE EXTRA on the offer page."}
            />
            <div className="mt-2.5">
              <Field label="Structure charge (₹)">
                <NumberInput
                  value={data.structureCost}
                  step={500}
                  disabled={!data.withStructure}
                  onChange={(v) => onData({ structureCost: v })}
                />
              </Field>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-950/10 bg-emerald-50/50 p-3">
            <SwitchRow
              checked={data.withKseb}
              onChange={(v) => onData({ withKseb: v })}
              title="KSEB charges included"
              hint={data.withKseb ? "Added to the total payable amount." : "Shown as KSEB CHARGE EXTRA and disclaimed on page 9."}
            />
            <div className="mt-2.5">
              <Field label="KSEB charge (₹)">
                <NumberInput
                  value={data.ksebCost}
                  step={500}
                  disabled={!data.withKseb}
                  onChange={(v) => onData({ ksebCost: v })}
                />
              </Field>
            </div>
          </div>

          <SwitchRow
            checked={data.gstIncluded}
            onChange={(v) => onData({ gstIncluded: v })}
            title="System cost includes GST"
            hint={data.gstIncluded ? "Offer page notes (INCLUDED GST)." : "Offer page notes (GST EXTRA)."}
          />

          <div className="space-y-1.5 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-900 px-4 py-3 text-white">
            <div className="flex items-center justify-between text-[11.5px] text-emerald-100/85">
              <span>System cost</span>
              <span>{money(totals.systemCost)}</span>
            </div>
            <div className="flex items-center justify-between text-[11.5px] text-emerald-100/85">
              <span>Structure {data.withStructure ? "included" : "extra"}</span>
              <span>{money(totals.structure)}</span>
            </div>
            <div className="flex items-center justify-between text-[11.5px] text-emerald-100/85">
              <span>KSEB {data.withKseb ? "included" : "extra"}</span>
              <span>{money(totals.kseb)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-white/20 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200">
                Total payable
              </span>
              <span className="font-display text-xl font-bold">{money(totals.totalPayable)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Units per kW per day">
              <NumberInput value={data.unitsPerKw} step={0.01} onChange={(v) => onData({ unitsPerKw: v })} />
            </Field>
            <Field label="Electricity tariff (₹/unit)">
              <NumberInput value={data.tariff} step={0.5} onChange={(v) => onData({ tariff: v })} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-emerald-50 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-900/50">Yearly units</p>
              <p className="font-display text-sm font-bold text-emerald-900">
                {totals.annualUnits.toLocaleString("en-IN")} kWh
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-900/50">Yearly saving</p>
              <p className="font-display text-sm font-bold text-emerald-900">{money(totals.annualSaving)}</p>
            </div>
          </div>

          <Field label="Quotation validity (days)">
            <NumberInput value={data.validity} step={1} onChange={(v) => onData({ validity: v })} />
          </Field>

          <Field label="Payment terms (summary)">
            <TextArea value={data.paymentTerms} onChange={(v) => onData({ paymentTerms: v })} rows={2} />
          </Field>

          <button
            type="button"
            onClick={() => onData({ verified: !data.verified })}
            className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${
              data.verified ? "border-emerald-600/40 bg-emerald-50" : "border-amber-500/40 bg-amber-50"
            }`}
          >
            {data.verified ? (
              <BadgeCheck className="mt-0.5 flex-none text-emerald-700" size={18} />
            ) : (
              <TriangleAlert className="mt-0.5 flex-none text-amber-600" size={18} />
            )}
            <span>
              <span className={`block text-[13px] font-semibold ${data.verified ? "text-emerald-900" : "text-amber-900"}`}>
                {data.verified ? "Verified — ready to print" : "Verification required before printing"}
              </span>
              <span className={`block text-[11px] leading-snug ${data.verified ? "text-emerald-900/60" : "text-amber-900/70"}`}>
                I have checked the total amount, subsidy, KSEB and structure options. Tap to{" "}
                {data.verified ? "un-mark" : "confirm"}.
              </span>
            </span>
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
