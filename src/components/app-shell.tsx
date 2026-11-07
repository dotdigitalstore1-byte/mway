"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Building2,
  CheckCircle2,
  FilePlus2,
  FileText,
  History,
  Loader2,
  Package,
  Printer,
  RefreshCw,
  Download,
  FileJson,
  Save,
  Sun,
  XCircle,
} from "lucide-react";
import type {
  ActiveQuote,
  Bootstrap,
  CompanySettings,
  LogoMap,
  Product,
  ProductKind,
  QuotationRow,
  QuoteData,
  QuoteMeta,
} from "@/lib/types";
import { defaultQuoteData, normalizeQuoteData, calcTotals, selectedFor, validateForPrint } from "@/lib/calc";
import { nextRefFrom } from "@/lib/ref";
import { brandKey } from "@/lib/format";
import { QuoteForm } from "./quote-form";
import { CatalogManager } from "./catalog-manager";
import { QuotationHistory } from "./history";
import { CompanySettingsForm } from "./company-settings";
import { Proposal, ScaledPreview } from "./proposal";

type Tab = "quote" | "catalog" | "history" | "settings";

interface Toast {
  id: number;
  kind: "ok" | "err";
  text: string;
}

const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];
const LOGO_MAX = 250 * 1024;

export default function AppShell() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [logos, setLogos] = useState<LogoMap>({});
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [history, setHistory] = useState<QuotationRow[]>([]);
  const [quote, setQuote] = useState<ActiveQuote | null>(null);
  const [tab, setTab] = useState<Tab>("quote");
  const [dirty, setDirty] = useState(false);
  const [savingQuote, setSavingQuote] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [bootDate, setBootDate] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);

  const productsRef = useRef<Product[]>([]);
  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  const toast = useCallback((text: string, kind: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, kind, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  /* ---------------- bootstrap ---------------- */

  const freshQuote = useCallback(
    (prods: Product[], refs: string[], date: string): ActiveQuote => {
      const data = defaultQuoteData();
      const panel = prods.find((p) => p.kind === "panel");
      const inv = prods.find((p) => p.kind === "inverter");
      data.panels = panel ? [panel.id] : [];
      data.inverters = inv ? [inv.id] : [];
      return { ref: nextRefFrom(refs), date, customer: "", address: "", phone: "", data };
    },
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/bootstrap", { cache: "no-store" });
      const json = (await res.json()) as Bootstrap & { ok: boolean; date: string; error?: string };
      if (!json.ok) throw new Error(json.error || "load failed");
      setProducts(json.products);
      setLogos(json.logos);
      setSettings(json.settings);
      setHistory(json.quotations);
      setBootDate(json.date);
      setQuote((q) => q ?? freshQuote(json.products, json.quotations.map((r) => r.ref), json.date));
      setLoading(false);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load workspace.");
      setLoading(false);
    }
  }, [freshQuote]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- quote editing ---------------- */

  const updateMeta = (patch: Partial<QuoteMeta>) => {
    setQuote((q) => (q ? { ...q, ...patch } : q));
    setDirty(true);
  };

  const updateData = (patch: Partial<QuoteData>) => {
    setQuote((q) => {
      if (!q) return q;
      const data = { ...q.data, ...patch };
      if (!("verified" in patch)) data.verified = false;
      return { ...q, data };
    });
    setDirty(true);
  };

  const ensureSelections = useCallback((prods: Product[], q: ActiveQuote | null): ActiveQuote | null => {
    if (!q) return q;
    const panelIds = prods.filter((p) => p.kind === "panel").map((p) => p.id);
    const inverterIds = prods.filter((p) => p.kind === "inverter").map((p) => p.id);
    const data = { ...q.data };
    const keepPanels = (data.panels ?? []).filter((id) => panelIds.includes(id));
    data.panels = keepPanels.length ? keepPanels : panelIds.slice(0, 1);
    const keepInverters = (data.inverters ?? []).filter((id) => inverterIds.includes(id));
    data.inverters = keepInverters.length ? keepInverters : inverterIds.slice(0, 1);
    const idsOf = (kind: Product["kind"]) => prods.filter((p) => p.kind === kind).map((p) => p.id);
    data.batteries = (data.batteries ?? []).filter((id) => idsOf("battery").includes(id));
    data.cables = (data.cables ?? []).filter((id) => idsOf("cable").includes(id));
    data.electricals = (data.electricals ?? []).filter((id) => idsOf("electrical").includes(id));
    data.structures = (data.structures ?? []).filter((id) => idsOf("structure").includes(id));
    return { ...q, data };
  }, []);

  /* ---------------- catalog ---------------- */

  const patchProductLocal = (id: number, patch: Partial<Product>) => {
    setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    if (quote) {
      setQuote((q) => (q ? { ...q, data: { ...q.data, verified: false } } : q));
      setDirty(true);
    }
  };

  const commitProduct = async (id: number) => {
    const p = productsRef.current.find((x) => x.id === id);
    if (!p) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: p.brand, model: p.model, size: p.size, price: p.price, warranty: p.warranty }),
      });
      const json = await res.json();
      if (!json.ok) toast(json.error || "Could not update product.", "err");
    } catch {
      toast("Could not update product.", "err");
    }
  };

  const addProduct = async (kind: ProductKind) => {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, brand: "New brand" }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setProducts((ps) => {
        const next = [...ps, json.product as Product];
        setQuote((q) => ensureSelections(next, q));
        return next;
      });
      toast(`${kind === "panel" ? "Panel" : "Inverter"} added — set its brand, size and rate.`);
    } catch {
      toast("Could not add product.", "err");
    }
  };

  const removeProduct = async (id: number) => {
    const p = productsRef.current.find((x) => x.id === id);
    if (!p) return;
    const siblings = productsRef.current.filter((x) => x.kind === p.kind);
    if (siblings.length <= 1) {
      toast(`Keep at least one ${p.kind} in the catalog.`, "err");
      return;
    }
    if (!window.confirm(`Remove ${p.brand} ${p.model}?`)) return;
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
      setProducts((ps) => {
        const next = ps.filter((x) => x.id !== id);
        setQuote((q) => ensureSelections(next, q));
        return next;
      });
      toast("Product removed.");
    } catch {
      toast("Could not remove product.", "err");
    }
  };

  const readLogoFile = (file: File, done: (dataUrl: string) => void) => {
    if (!LOGO_TYPES.includes(file.type) || file.size > LOGO_MAX) {
      toast("Please use a PNG, JPG or WebP logo under 250 KB.", "err");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") done(reader.result);
    };
    reader.onerror = () => toast("Could not read this logo file.", "err");
    reader.readAsDataURL(file);
  };

  const uploadLogoForBrand = (brandName: string, file: File) => {
    const name = brandName.trim();
    if (!name) {
      toast("Enter the brand name before uploading its logo.", "err");
      return;
    }
    readLogoFile(file, async (imageData) => {
      try {
        const res = await fetch("/api/logos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brandName: name, imageData }),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error);
        setLogos((m) => ({ ...m, [brandKey(name)]: imageData }));
        toast(`${name} logo saved — it now appears on its proposal pages.`);
      } catch (e) {
        toast(e instanceof Error ? e.message : "Could not save logo.", "err");
      }
    });
  };

  const uploadBrandLogo = (product: Product, file: File) => uploadLogoForBrand(product.brand, file);

  const uploadCompanyLogo = (file: File) => {
    readLogoFile(file, (imageData) => {
      setSettings((s) => (s ? { ...s, logo: imageData } : s));
      toast("Logo set — press “Save company settings” to keep it.");
    });
  };

  /* ---------------- settings ---------------- */

  const patchSettings = (patch: Partial<CompanySettings>) => {
    setSettings((s) => (s ? { ...s, ...patch } : s));
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: settings }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast("Company settings saved.");
    } catch {
      toast("Could not save settings.", "err");
    }
    setSavingSettings(false);
  };

  /* ---------------- quotations ---------------- */

  const upsertHistory = (row: QuotationRow) =>
    setHistory((h) => [row, ...h.filter((r) => r.id !== row.id)]);

  const primaryTotals = () => {
    if (!quote) return null;
    return calcTotals(quote.data);
  };

  const saveQuote = async () => {
    if (!quote) return;
    setSavingQuote(true);
    const totals = primaryTotals();
    const payload = {
      meta: {
        ref: quote.ref,
        customer: quote.customer,
        address: quote.address,
        phone: quote.phone,
        date: quote.date,
        capacity: totals?.capacity ?? 0,
        total: totals?.totalPayable ?? 0,
      },
      data: quote.data,
    };
    try {
      const res = quote.id
        ? await fetch(`/api/quotations/${quote.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/quotations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      const row = json.quotation as QuotationRow;
      setQuote((q) => (q ? { ...q, id: row.id, ref: row.ref } : q));
      upsertHistory(row);
      setDirty(false);
      toast(`Quotation ${row.ref} saved.`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save quotation.", "err");
    }
    setSavingQuote(false);
  };

  const openQuote = async (id: number) => {
    try {
      const res = await fetch(`/api/quotations/${id}`, { cache: "no-store" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      const row = json.quotation as QuotationRow & { address: string; data: unknown };
      const data: QuoteData = normalizeQuoteData(row.data);
      const q = ensureSelections(productsRef.current, {
        id: row.id,
        ref: row.ref,
        customer: row.customer,
        address: row.address,
        phone: row.phone,
        date: row.date,
        data,
      });
      setQuote(q);
      setDirty(false);
      setTab("quote");
      toast(`Opened ${row.ref}.`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not open quotation.", "err");
    }
  };

  const duplicateQuote = async (row: QuotationRow) => {
    try {
      const res = await fetch(`/api/quotations/${row.id}`, { cache: "no-store" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      const full = json.quotation as QuotationRow & { address: string; data: QuoteData };
      const save = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meta: {
            ref: "",
            customer: full.customer,
            address: full.address,
            phone: full.phone,
            date: bootDate || full.date,
            capacity: full.capacity,
            total: full.total,
          },
          data: { ...full.data, verified: false },
        }),
      });
      const saved = await save.json();
      if (!saved.ok) throw new Error(saved.error);
      upsertHistory(saved.quotation as QuotationRow);
      toast(`Duplicated as ${(saved.quotation as QuotationRow).ref}.`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not duplicate quotation.", "err");
    }
  };

  const deleteQuote = async (id: number) => {
    if (!window.confirm("Delete this quotation permanently?")) return;
    try {
      await fetch(`/api/quotations/${id}`, { method: "DELETE" });
      setHistory((h) => h.filter((r) => r.id !== id));
      if (quote?.id === id) {
        setQuote(freshQuote(productsRef.current, history.filter((r) => r.id !== id).map((r) => r.ref), bootDate));
        setDirty(false);
      }
      toast("Quotation deleted.");
    } catch {
      toast("Could not delete quotation.", "err");
    }
  };

  const newQuote = () => {
    if (dirty && !window.confirm("Start a new quotation? Save or print the current one first.")) return;
    setQuote((q) => {
      const prev = q?.data;
      const data = defaultQuoteData();
      // carry over commercial defaults for faster repeat quoting
      if (prev) {
        data.panels = prev.panels;
        data.inverters = prev.inverters;
        data.batteries = prev.batteries;
        data.cables = prev.cables;
        data.electricals = prev.electricals;
        data.structures = prev.structures;
        data.panelType = prev.panelType;
        data.panelWattsMin = prev.panelWattsMin;
        data.panelWattsMax = prev.panelWattsMax;
        data.panelWarranty = prev.panelWarranty;
        data.inverterType = prev.inverterType;
        data.inverterKw = prev.inverterKw;
        data.inverterWarranty = prev.inverterWarranty;
        data.inverterQty = prev.inverterQty;
        data.withStructure = prev.withStructure;
        data.structureCost = prev.structureCost;
        data.withKseb = prev.withKseb;
        data.ksebCost = prev.ksebCost;
        data.gstIncluded = prev.gstIncluded;
        data.unitsPerKw = prev.unitsPerKw;
        data.tariff = prev.tariff;
        data.validity = prev.validity;
        data.paymentTerms = prev.paymentTerms;
        data.terms = prev.terms;
        data.capacity = prev.capacity;
        data.capacityAuto = prev.capacityAuto;
        data.systemType = prev.systemType;
        data.batteryKwh = prev.batteryKwh;
        data.batteryWarranty = prev.batteryWarranty;
        data.qty = prev.qty;
      }
      const draft: ActiveQuote = {
        ref: nextRefFrom(history.map((r) => r.ref)),
        date: bootDate,
        customer: "",
        address: "",
        phone: "",
        data,
      };
      return ensureSelections(productsRef.current, draft);
    });
    setDirty(false);
    setTab("quote");
  };

  /* ---------------- print ---------------- */

  const printQuote = () => {
    if (!quote || !settings) return;
    const panels = selectedFor(products, "panel", quote.data.panels);
    const inverters = selectedFor(products, "inverter", quote.data.inverters);
    const issues = validateForPrint(
      quote.data,
      { customer: quote.customer, address: quote.address, phone: quote.phone },
      panels,
      inverters,
      settings.name,
      settings.phone || settings.email,
      { name: settings.bankName, branch: settings.bankBranch, account: settings.bankAccount, ifsc: settings.bankIfsc },
    );
    if (issues.length) {
      toast(issues[0], "err");
      return;
    }
    window.print();
  };

  const downloadJson = () => {
    if (!quote) return;
    const totals = primaryTotals();
    const payload = {
      app: "Mway Quot",
      version: 2,
      exportedAt: new Date().toISOString(),
      company: settings ? { name: settings.name, phone: settings.phone, email: settings.email } : null,
      quotation: {
        ref: quote.ref,
        date: quote.date,
        customer: quote.customer,
        address: quote.address,
        phone: quote.phone,
        capacityKw: totals?.capacity ?? 0,
        totalPayable: totals?.totalPayable ?? 0,
        subsidy: totals?.subsidy ?? 0,
        data: quote.data,
      },
      products: {
        panels: selectedFor(products, "panel", quote.data.panels),
        inverters: selectedFor(products, "inverter", quote.data.inverters),
        batteries: selectedFor(products, "battery", quote.data.batteries ?? []),
        cables: selectedFor(products, "cable", quote.data.cables ?? []),
        electricals: selectedFor(products, "electrical", quote.data.electricals ?? []),
        structures: selectedFor(products, "structure", quote.data.structures ?? []),
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${String(quote.ref || "mway-quot").replace(/[^a-z0-9_-]/gi, "-")}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Quotation data downloaded as JSON.");
  };

  /* ---------------- derived ---------------- */

  const panelsNow = quote ? selectedFor(products, "panel", quote.data.panels) : [];
  const totalsNow = quote ? calcTotals(quote.data) : null;

  /* ---------------- screens ---------------- */

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800">
        <div className="text-center text-white">
          <span className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-2xl shadow-amber-500/30">
            <Sun size={30} className="animate-pulse" />
          </span>
          <p className="font-display text-xl font-bold">Mway Quot</p>
          <p className="mt-1 flex items-center justify-center gap-2 text-sm text-emerald-100/70">
            <Loader2 size={14} className="animate-spin" /> Loading your quotation studio…
          </p>
        </div>
      </div>
    );
  }

  if (loadError || !quote || !settings) {
    return (
      <div className="grid min-h-screen place-items-center bg-emerald-950 px-6">
        <div className="max-w-sm rounded-2xl bg-white p-8 text-center">
          <XCircle className="mx-auto mb-3 text-red-600" size={32} />
          <p className="font-display text-lg font-bold text-emerald-950">Could not start Mway Quot</p>
          <p className="mt-1 text-sm text-emerald-950/60">{loadError || "Unexpected state."}</p>
          <button
            onClick={() => void load()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-600"
          >
            <RefreshCw size={15} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof FileText; badge?: number }[] = [
    { id: "quote", label: "Quotation", icon: FileText },
    { id: "catalog", label: "Products & logos", icon: Package },
    { id: "history", label: "History", icon: History, badge: history.length },
    { id: "settings", label: "Company", icon: Building2 },
  ];

  return (
    <div className="app-bg flex min-h-screen flex-col lg:h-screen">
      {/* -------- header -------- */}
      <header className="print-hidden relative z-20 flex flex-none flex-wrap items-center gap-3 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 px-4 py-3 shadow-lg shadow-emerald-950/20 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-lg shadow-amber-500/25">
            <Sun size={22} strokeWidth={2.2} />
          </span>
          <div className="min-w-0">
            <h1 className="font-display truncate text-lg font-extrabold leading-tight text-white">
              Mway Quot
            </h1>
            <p className="truncate text-[11px] text-emerald-100/70">
              Solar quotation studio · {settings.name || "M Way Solar"}
            </p>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span
            className={`hidden rounded-full px-3 py-1.5 text-[11px] font-semibold sm:inline-block ${
              dirty
                ? "bg-amber-400/15 text-amber-200"
                : quote.id
                  ? "bg-emerald-400/15 text-emerald-200"
                  : "bg-white/10 text-emerald-100/80"
            }`}
          >
            {dirty ? "Unsaved changes" : quote.id ? `${quote.ref} saved` : "Unsaved draft"}
          </span>
          <button
            type="button"
            onClick={newQuote}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 px-3 py-2 text-[12.5px] font-semibold text-white transition hover:bg-white/10"
          >
            <FilePlus2 size={15} /> New
          </button>
          <button
            type="button"
            onClick={() => void saveQuote()}
            disabled={savingQuote}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-3.5 py-2 text-[12.5px] font-bold text-emerald-950 shadow-lg shadow-amber-500/20 transition hover:brightness-105 disabled:opacity-60"
          >
            {savingQuote ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {savingQuote ? "Saving…" : "Save quotation"}
          </button>
          <button
            type="button"
            onClick={printQuote}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-[12.5px] font-bold text-emerald-900 shadow transition hover:bg-emerald-50"
          >
            <Printer size={15} /> Print / PDF
          </button>
        </div>
      </header>

      {/* -------- body -------- */}
      <main className="layout-grid grid flex-1 gap-5 p-4 sm:p-5 lg:min-h-0 lg:grid-cols-[minmax(370px,470px)_minmax(0,1fr)]">
        {/* editor */}
        <aside className="print-hidden flex flex-col gap-4 pb-24 lg:min-h-0 lg:overflow-y-auto scroll-slim lg:pr-1">
          <nav className="flex-none rounded-2xl border border-emerald-950/10 bg-white/80 p-1.5 backdrop-blur">
            <div className="grid grid-cols-4 gap-1">
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`relative flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[10.5px] font-semibold transition sm:text-[11px] ${
                      active
                        ? "bg-emerald-800 text-white shadow-md shadow-emerald-900/20"
                        : "text-emerald-950/60 hover:bg-emerald-950/5"
                    }`}
                  >
                    <Icon size={16} />
                    <span className="truncate">{t.label}</span>
                    {t.badge ? (
                      <span
                        className={`absolute right-1.5 top-1 rounded-full px-1.5 text-[9px] font-bold ${
                          active ? "bg-amber-400 text-emerald-950" : "bg-emerald-800/10 text-emerald-900"
                        }`}
                      >
                        {t.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </nav>

          {tab === "quote" ? (
            <QuoteForm
              meta={quote}
              data={quote.data}
              products={products}
              totals={totalsNow ?? calcTotals(quote.data)}
              onMeta={updateMeta}
              onData={updateData}
            />
          ) : null}

          {tab === "catalog" ? (
            <CatalogManager
              products={products}
              logos={logos}
              onLocalPatch={patchProductLocal}
              onCommit={(id) => void commitProduct(id)}
              onAdd={(kind) => void addProduct(kind)}
              onRemove={(id) => void removeProduct(id)}
              onUploadLogo={uploadBrandLogo}
            />
          ) : null}

          {tab === "history" ? (
            <QuotationHistory
              rows={history}
              activeId={quote.id}
              onOpen={(id) => void openQuote(id)}
              onDuplicate={(row) => void duplicateQuote(row)}
              onDelete={(id) => void deleteQuote(id)}
            />
          ) : null}

          {tab === "settings" ? (
            <CompanySettingsForm
              settings={settings}
              logos={logos}
              busy={savingSettings}
              onSettings={patchSettings}
              onSave={() => void saveSettings()}
              onUploadCompanyLogo={uploadCompanyLogo}
              onUploadBrandLogo={uploadLogoForBrand}
            />
          ) : null}

          <p className="flex-none pb-2 text-center text-[10.5px] text-emerald-950/40">
            Quotations, catalog and settings are stored in your Mway Quot database — reopen them on
            any device that can reach this app.
          </p>
        </aside>

        {/* preview */}
        <section className="preview-stage stage-bg scroll-slim rounded-2xl border border-emerald-950/10 lg:min-h-0 lg:overflow-y-auto">
          <div className="print-hidden sticky top-0 z-10 mb-4 flex items-center justify-between gap-3 rounded-b-xl bg-emerald-950/90 px-4 py-2.5 text-white backdrop-blur">
            <span className="flex items-center gap-2 text-[11.5px] font-semibold">
              <FileText size={14} className="text-amber-300" />
              Live proposal preview
              <span
                className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em] ${
                  quote.data.verified ? "bg-emerald-400/20 text-emerald-200" : "bg-amber-400/20 text-amber-200"
                }`}
              >
                {quote.data.verified ? "Quotation" : "Draft — verify rates"}
              </span>
            </span>
            <span className="hidden text-[10.5px] text-emerald-100/60 sm:block">
              10 pages · A4 · use Print / PDF to save
            </span>
          </div>

          <ScaledPreview>
            <Proposal meta={quote} data={quote.data} products={products} logos={logos} settings={settings} />
          </ScaledPreview>
        </section>
      </main>

      {/* -------- bottom-right download -------- */}
      <div className="print-hidden fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={downloadJson}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/40 bg-white/95 px-3 py-2 text-[11.5px] font-semibold text-emerald-900 shadow-lg shadow-emerald-950/20 backdrop-blur transition hover:bg-white"
        >
          <FileJson size={14} /> Data (.json)
        </button>
        <button
          type="button"
          onClick={printQuote}
          className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-3 text-[13px] font-bold text-emerald-950 shadow-xl shadow-orange-900/30 ring-1 ring-black/10 transition hover:brightness-105 active:scale-[0.98]"
          aria-label="Download quotation as PDF"
        >
          <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-950/10">
            <Download size={15} strokeWidth={2.4} />
          </span>
          Download PDF
        </button>
      </div>

      {/* -------- toasts -------- */}
      <div className="print-hidden pointer-events-none fixed bottom-28 right-4 z-50 flex w-80 flex-col gap-2 sm:bottom-24">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`mq-toast pointer-events-auto flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-[12.5px] font-medium shadow-xl ${
              t.kind === "ok" ? "bg-emerald-900 text-emerald-50" : "bg-red-800 text-red-50"
            }`}
          >
            {t.kind === "ok" ? (
              <CheckCircle2 size={16} className="mt-0.5 flex-none text-emerald-300" />
            ) : (
              <XCircle size={16} className="mt-0.5 flex-none text-red-200" />
            )}
            {t.text}
          </div>
        ))}
      </div>
    </div>
  );
}
