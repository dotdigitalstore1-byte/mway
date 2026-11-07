"use client";

import { useRef } from "react";
import { BatteryCharging, Building2, ImagePlus, Landmark, LayoutTemplate, Save, Trash2 } from "lucide-react";
import type { CompanySettings, LogoMap } from "@/lib/types";
import { BrandMark } from "./proposal";
import { Field, TextArea, TextInput } from "./ui";

function LogoUpload({
  brand,
  logos,
  onUpload,
}: {
  brand: string;
  logos: LogoMap;
  onUpload: (brandName: string, file: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-emerald-950/10 bg-white p-2.5">
      <BrandMark brand={brand || "Brand"} logos={logos} />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-800/20 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-emerald-900 transition hover:border-emerald-700/50"
      >
        <ImagePlus size={13} /> {logos[brand.trim().toLowerCase()] ? "Replace" : "Upload"}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(brand, f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function CompanySettingsForm({
  settings,
  logos,
  busy,
  onSettings,
  onSave,
  onUploadCompanyLogo,
  onUploadBrandLogo,
}: {
  settings: CompanySettings;
  logos: LogoMap;
  busy: boolean;
  onSettings: (patch: Partial<CompanySettings>) => void;
  onSave: () => void;
  onUploadCompanyLogo: (file: File) => void;
  onUploadBrandLogo: (brandName: string, file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6">
      {/* identity */}
      <section className="rounded-2xl border border-emerald-950/10 bg-white p-5">
        <h3 className="font-display mb-4 flex items-center gap-2 text-[14px] font-semibold text-emerald-950">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-800 text-white">
            <Building2 size={14} />
          </span>
          M Way Solar identity
        </h3>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <BrandMark brand={settings.name || "M Way Solar"} logos={logos} overrideLogo={settings.logo} large />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-800/20 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-emerald-900 transition hover:border-emerald-700/50"
            >
              <ImagePlus size={13} /> Company logo
            </button>
            {settings.logo ? (
              <button
                type="button"
                onClick={() => onSettings({ logo: "" })}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-900/15 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-red-800"
              >
                <Trash2 size={13} /> Remove
              </button>
            ) : null}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUploadCompanyLogo(f);
              e.target.value = "";
            }}
          />
        </div>
        <div className="space-y-3">
          <Field label="Company name">
            <TextInput value={settings.name} onChange={(v) => onSettings({ name: v })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Company phone">
              <TextInput type="tel" value={settings.phone} onChange={(v) => onSettings({ phone: v })} />
            </Field>
            <Field label="Company email">
              <TextInput type="email" value={settings.email} onChange={(v) => onSettings({ email: v })} />
            </Field>
          </div>
          <Field label="Company address">
            <TextArea value={settings.address} onChange={(v) => onSettings({ address: v })} rows={2} />
          </Field>
        </div>
      </section>

      {/* bank */}
      <section className="rounded-2xl border border-emerald-950/10 bg-white p-5">
        <h3 className="font-display mb-1 flex items-center gap-2 text-[14px] font-semibold text-emerald-950">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-800 text-white">
            <Landmark size={14} />
          </span>
          Bank details (page 10)
        </h3>
        <p className="mb-4 text-[11px] text-emerald-950/50">
          Printed on the last page of every proposal.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Bank">
            <TextInput value={settings.bankName} onChange={(v) => onSettings({ bankName: v })} />
          </Field>
          <Field label="Branch">
            <TextInput value={settings.bankBranch} onChange={(v) => onSettings({ bankBranch: v })} />
          </Field>
          <Field label="Account number">
            <TextInput value={settings.bankAccount} onChange={(v) => onSettings({ bankAccount: v })} />
          </Field>
          <Field label="IFSC">
            <TextInput value={settings.bankIfsc} onChange={(v) => onSettings({ bankIfsc: v })} />
          </Field>
        </div>
      </section>

      {/* proposal content */}
      <section className="rounded-2xl border border-emerald-950/10 bg-white p-5">
        <h3 className="font-display mb-1 flex items-center gap-2 text-[14px] font-semibold text-emerald-950">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-800 text-white">
            <LayoutTemplate size={14} />
          </span>
          Proposal content
        </h3>
        <p className="mb-4 text-[11px] text-emerald-950/50">
          Text and component brands used across pages 2, 5, 6 and 9.
        </p>
        <div className="space-y-3">
          <Field label="Mission (About page)">
            <TextArea value={settings.mission} onChange={(v) => onSettings({ mission: v })} rows={2} />
          </Field>
          <Field label="Vision (About page)">
            <TextArea value={settings.vision} onChange={(v) => onSettings({ vision: v })} rows={2} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Default panel type">
              <TextInput value={settings.panelType} onChange={(v) => onSettings({ panelType: v })} />
            </Field>
            <Field label="Default panel warranty">
              <TextInput value={settings.panelWarranty} onChange={(v) => onSettings({ panelWarranty: v })} />
            </Field>
            <Field label="Default inverter type">
              <TextInput value={settings.inverterType} onChange={(v) => onSettings({ inverterType: v })} />
            </Field>
            <Field label="Default inverter warranty">
              <TextInput value={settings.inverterWarranty} onChange={(v) => onSettings({ inverterWarranty: v })} />
            </Field>
          </div>
          <Field label="Installation note">
            <TextArea value={settings.installationNote} onChange={(v) => onSettings({ installationNote: v })} rows={2} />
          </Field>
          <Field label="Financing line (ROI page)">
            <TextInput value={settings.financingNote} onChange={(v) => onSettings({ financingNote: v })} />
          </Field>
          <Field label="Important note (Thank you page)">
            <TextArea value={settings.thankYouNote} onChange={(v) => onSettings({ thankYouNote: v })} rows={3} />
          </Field>
        </div>
      </section>

      {/* component brand logos */}
      <section className="rounded-2xl border border-emerald-950/10 bg-white p-5">
        <h3 className="font-display mb-1 text-[14px] font-semibold text-emerald-950">
          Component brands &amp; logos
        </h3>
        <p className="mb-4 text-[11px] text-emerald-950/50">
          These brands are printed in the Solar Components table (page 6). Upload a logo for each —
          if none is uploaded the brand name is printed instead.
        </p>
        <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] leading-snug text-emerald-900/70">
          Separate multiple brands with a slash — e.g. <b>Havells / L&amp;T</b> — and a logo chip is
          printed for each. Panel and inverter brands are chosen per quotation.
        </p>
        <div className="space-y-4">
          {[
            { label: "Cable", brandKey: "cableBrand" as const, specKey: "cableSpec" as const },
            { label: "Electrical", brandKey: "electricalBrand" as const, specKey: "electricalSpec" as const },
            { label: "Structure", brandKey: "structureBrand" as const, specKey: "structureSpec" as const },
            { label: "Battery", brandKey: "batteryBrand" as const, specKey: "batterySpec" as const },
          ].map((row) => (
            <div key={row.label} className="rounded-xl border border-emerald-950/10 bg-emerald-50/40 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-emerald-900/70">
                {row.label === "Battery" ? <BatteryCharging size={13} /> : null}
                {row.label}
              </p>
              <div className="space-y-2.5">
                <Field label={`${row.label} brand`}>
                  <TextInput
                    value={settings[row.brandKey]}
                    onChange={(v) => onSettings({ [row.brandKey]: v } as Partial<CompanySettings>)}
                  />
                </Field>
                <LogoUpload
                  brand={settings[row.brandKey].split("/")[0]?.trim() ?? ""}
                  logos={logos}
                  onUpload={onUploadBrandLogo}
                />
                <Field label={`${row.label} specification`}>
                  <TextArea
                    value={settings[row.specKey]}
                    onChange={(v) => onSettings({ [row.specKey]: v } as Partial<CompanySettings>)}
                    rows={2}
                  />
                </Field>
              </div>
            </div>
          ))}
          <Field label="Company brand row">
            <LogoUpload brand={settings.name} logos={logos} onUpload={onUploadBrandLogo} />
          </Field>
        </div>
      </section>

      <button
        type="button"
        onClick={onSave}
        disabled={busy}
        className="sticky bottom-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-800 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/25 transition hover:brightness-110 disabled:opacity-60"
      >
        <Save size={16} /> {busy ? "Saving…" : "Save company settings"}
      </button>
    </div>
  );
}
