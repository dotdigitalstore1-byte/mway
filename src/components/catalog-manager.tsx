"use client";

import { useRef } from "react";
import { BatteryCharging, Cable, ImagePlus, Info, Package, PlugZap, Plus, ShieldCheck, Trash2, Zap } from "lucide-react";
import type { LogoMap, Product, ProductKind } from "@/lib/types";
import { BrandMark } from "./proposal";
import { Field, TextInput } from "./ui";

const KIND_META: Record<
  ProductKind,
  { label: string; title: string; modelLabel: string; placeholder: string }
> = {
  panel: { label: "Panel", title: "Solar panels", modelLabel: "Model / variant", placeholder: "e.g. TOPCon Bifacial" },
  inverter: { label: "Inverter", title: "Inverters", modelLabel: "Model / variant", placeholder: "e.g. On-grid inverter" },
  battery: { label: "Battery", title: "Batteries", modelLabel: "Model / capacity", placeholder: "e.g. Li-ion 51.2V 100Ah" },
  cable: { label: "Cable", title: "Cable", modelLabel: "Model / spec", placeholder: "e.g. DC 4 sq.mm solar cable" },
  electrical: { label: "Electrical", title: "Electrical", modelLabel: "Model / spec", placeholder: "e.g. ACDB / DCDB with MCB" },
  structure: { label: "Structure", title: "Structure", modelLabel: "Model / spec", placeholder: "e.g. HDGI elevated structure" },
};

function ProductCard({
  product,
  logos,
  onLocalPatch,
  onCommit,
  onRemove,
  onUploadLogo,
}: {
  product: Product;
  logos: LogoMap;
  onLocalPatch: (id: number, patch: Partial<Product>) => void;
  onCommit: (id: number) => void;
  onRemove: (id: number) => void;
  onUploadLogo: (product: Product, file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const commit = () => onCommit(product.id);

  return (
    <div className="rounded-xl border border-emerald-950/10 bg-emerald-50/40 p-3.5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <BrandMark brand={product.brand || "New brand"} logos={logos} />
        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-800/70">
          {KIND_META[product.kind]?.label ?? "Product"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Brand">
          <TextInput value={product.brand} onChange={(v) => onLocalPatch(product.id, { brand: v })} onBlur={commit} />
        </Field>
        <Field label={KIND_META[product.kind]?.modelLabel ?? "Model"}>
          <TextInput
            value={product.model}
            placeholder={KIND_META[product.kind]?.placeholder ?? ""}
            onChange={(v) => onLocalPatch(product.id, { model: v })}
            onBlur={commit}
          />
        </Field>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-800/20 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-emerald-900 transition hover:border-emerald-700/50"
        >
          <ImagePlus size={13} /> Upload brand logo
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUploadLogo(product, file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => onRemove(product.id)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-red-900/15 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-red-800 transition hover:border-red-700/40"
        >
          <Trash2 size={13} /> Remove
        </button>
      </div>
    </div>
  );
}

export function CatalogManager({
  products,
  logos,
  onLocalPatch,
  onCommit,
  onAdd,
  onRemove,
  onUploadLogo,
}: {
  products: Product[];
  logos: LogoMap;
  onLocalPatch: (id: number, patch: Partial<Product>) => void;
  onCommit: (id: number) => void;
  onAdd: (kind: ProductKind) => void;
  onRemove: (id: number) => void;
  onUploadLogo: (product: Product, file: File) => void;
}) {
  const panels = products.filter((p) => p.kind === "panel");
  const inverters = products.filter((p) => p.kind === "inverter");
  const batteries = products.filter((p) => p.kind === "battery");
  const cables = products.filter((p) => p.kind === "cable");
  const electricals = products.filter((p) => p.kind === "electrical");
  const structures = products.filter((p) => p.kind === "structure");

  const renderGroup = (kind: ProductKind, title: string, icon: typeof Zap, list: Product[]) => {
    const Icon = icon;
    return (
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display flex items-center gap-2 text-[14px] font-semibold text-emerald-950">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-800 text-white">
              <Icon size={14} />
            </span>
            {title}
            <span className="rounded-full bg-emerald-950/5 px-2 py-0.5 text-[10px] font-bold text-emerald-900/60">
              {list.length}
            </span>
          </h3>
          <button
            type="button"
            onClick={() => onAdd(kind)}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-800 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-emerald-700"
          >
            <Plus size={13} /> Add {kind}
          </button>
        </div>
        <div className="space-y-3">
          {list.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              logos={logos}
              onLocalPatch={onLocalPatch}
              onCommit={onCommit}
              onRemove={onRemove}
              onUploadLogo={onUploadLogo}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2.5 rounded-xl border border-amber-500/30 bg-amber-50 px-3.5 py-3 text-[12px] leading-snug text-amber-900">
        <Info size={16} className="mt-0.5 flex-none text-amber-600" />
        <p>
          <b>Only brand and model are stored here.</b> No rate is kept on any product — each
          quotation carries one total system cost and a system size (3 kW, 4 kW, 5 kW …), set on the
          Quotation tab. Upload a logo once per brand and it appears automatically wherever that
          brand is used in the proposal (page 6, Solar Components).
        </p>
      </div>
      {renderGroup("panel", "Solar panels", Package, panels)}
      {renderGroup("inverter", "Inverters", Zap, inverters)}
      {renderGroup("battery", "Batteries", BatteryCharging, batteries)}
      {renderGroup("cable", "Cable", Cable, cables)}
      {renderGroup("electrical", "Electrical", PlugZap, electricals)}
      {renderGroup("structure", "Structure", ShieldCheck, structures)}
    </div>
  );
}
