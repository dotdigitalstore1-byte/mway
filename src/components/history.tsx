"use client";

import { Archive, Copy, FolderOpen, Trash2 } from "lucide-react";
import type { QuotationRow } from "@/lib/types";
import { displayDate, money } from "@/lib/format";

export function QuotationHistory({
  rows,
  activeId,
  onOpen,
  onDuplicate,
  onDelete,
}: {
  rows: QuotationRow[];
  activeId?: number;
  onOpen: (id: number) => void;
  onDuplicate: (row: QuotationRow) => void;
  onDelete: (id: number) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-emerald-950/20 bg-white/60 px-6 py-14 text-center">
        <Archive className="mb-3 text-emerald-900/30" size={30} />
        <p className="font-display text-sm font-semibold text-emerald-950">No saved quotations yet</p>
        <p className="mt-1 max-w-56 text-[12px] text-emerald-950/50">
          Fill in the quotation tab and press “Save quotation” — it will appear here for reopening,
          duplicating or printing later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {rows.map((row) => (
        <div
          key={row.id}
          className={`rounded-xl border bg-white p-3.5 transition ${
            row.id === activeId
              ? "border-emerald-600/50 ring-2 ring-emerald-600/15"
              : "border-emerald-950/10 hover:border-emerald-800/30"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-[13px] font-bold text-emerald-950">{row.ref}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em] ${
                    row.status === "ready"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {row.status === "ready" ? "Ready" : "Draft"}
                </span>
                {row.id === activeId ? (
                  <span className="rounded-full bg-emerald-800 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em] text-white">
                    Open
                  </span>
                ) : null}
              </div>
              <p className="mt-1 truncate text-[13px] font-semibold text-emerald-950/80">
                {row.customer || "Unnamed customer"}
              </p>
              <p className="text-[11px] text-emerald-950/50">
                {displayDate(row.date)} · {row.capacity.toLocaleString("en-IN", { maximumFractionDigits: 2 })} kWp
              </p>
            </div>
            <div className="text-right">
              <p className="font-display text-[15px] font-bold text-emerald-900">{money(row.total)}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-1.5">
            <button
              type="button"
              onClick={() => onOpen(row.id)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-800 px-2 py-1.5 text-[11px] font-semibold text-white transition hover:bg-emerald-700"
            >
              <FolderOpen size={13} /> Open
            </button>
            <button
              type="button"
              onClick={() => onDuplicate(row)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-800/20 bg-white px-2 py-1.5 text-[11px] font-semibold text-emerald-900 transition hover:border-emerald-700/50"
            >
              <Copy size={13} /> Duplicate
            </button>
            <button
              type="button"
              onClick={() => onDelete(row.id)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-900/15 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-red-800 transition hover:border-red-700/40"
              aria-label="Delete quotation"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
