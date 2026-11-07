"use client";

import type { ChangeEvent, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/* ---------- field wrappers ---------- */

export function Field({
  label,
  children,
  className = "",
  hint,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.07em] text-emerald-950/60">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-emerald-950/45">{hint}</span> : null}
    </label>
  );
}

export function TextInput(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  onBlur?: () => void;
}) {
  return (
    <input
      className="field-input"
      type={props.type ?? "text"}
      value={props.value}
      placeholder={props.placeholder}
      onChange={(e: ChangeEvent<HTMLInputElement>) => props.onChange(e.target.value)}
      onBlur={props.onBlur}
    />
  );
}

export function NumberInput(props: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onBlur?: () => void;
}) {
  return (
    <input
      className="field-input"
      type="number"
      inputMode="decimal"
      min={props.min ?? 0}
      max={props.max}
      step={props.step ?? 1}
      disabled={props.disabled}
      value={Number.isFinite(props.value) ? props.value : 0}
      onChange={(e) => props.onChange(Number(e.target.value) || 0)}
      onBlur={props.onBlur}
    />
  );
}

export function TextArea(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  onBlur?: () => void;
}) {
  return (
    <textarea
      className="field-input min-h-[68px] resize-y"
      rows={props.rows ?? 3}
      value={props.value}
      placeholder={props.placeholder}
      onChange={(e) => props.onChange(e.target.value)}
      onBlur={props.onBlur}
    />
  );
}

export function Select(props: {
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <select className="field-input" value={props.value} onChange={(e) => props.onChange(e.target.value)}>
      {props.children}
    </select>
  );
}

/* ---------- switch row ---------- */

export function SwitchRow(props: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => props.onChange(!props.checked)}
      className="flex w-full items-start gap-3 rounded-xl border border-emerald-950/10 bg-white px-3 py-2.5 text-left transition hover:border-emerald-700/30"
    >
      <span className="mq-switch mt-0.5" data-on={props.checked} aria-hidden />
      <span>
        <span className="block text-[13px] font-semibold text-emerald-950">{props.title}</span>
        {props.hint ? (
          <span className="block text-[11px] leading-snug text-emerald-950/50">{props.hint}</span>
        ) : null}
      </span>
    </button>
  );
}

/* ---------- section card ---------- */

export function SectionCard(props: {
  step: string;
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children: ReactNode;
  tone?: "green" | "amber";
}) {
  const Icon = props.icon;
  return (
    <section className="mq-rise rounded-2xl border border-emerald-950/10 bg-white p-4 shadow-[0_1px_2px_rgba(6,44,26,0.05),0_10px_30px_-18px_rgba(6,44,26,0.25)] sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <span
          className={`flex h-9 w-9 flex-none items-center justify-center rounded-xl text-white ${
            props.tone === "amber"
              ? "bg-gradient-to-br from-amber-400 to-orange-600"
              : "bg-gradient-to-br from-emerald-500 to-emerald-800"
          }`}
        >
          <Icon size={17} strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700/70">
            {props.step}
          </p>
          <h2 className="font-display truncate text-[15px] font-semibold text-emerald-950">
            {props.title}
          </h2>
          {props.subtitle ? (
            <p className="truncate text-[11px] text-emerald-950/50">{props.subtitle}</p>
          ) : null}
        </div>
      </div>
      {props.children}
    </section>
  );
}
