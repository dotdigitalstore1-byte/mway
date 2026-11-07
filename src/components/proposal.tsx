"use client";

import { Fragment, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  ClipboardCheck,
  Flame,
  Gauge,
  Handshake,
  Leaf,
  Package,
  PlugZap,
  Search,
  ShieldCheck,
  Sun,
  Trees,
  Truck,
  Wrench,
  Zap,
  Cable,
  BatteryCharging,
} from "lucide-react";
import type { CompanySettings, LogoMap, Product, QuoteData, QuoteMeta } from "@/lib/types";
import { brandKey, capacityFmt, displayDate, has, num, rs, inrShort, wattRange } from "@/lib/format";
import { calcTotals, isHybrid, selectedFor, systemLabel } from "@/lib/calc";

/* ---------------- proposal photo ---------------- */

/**
 * Photo used on the proposal pages (files live in /public/images).
 * Loads eagerly so the photos are always ready when printing / saving to PDF,
 * and falls back to a tidy placeholder instead of a broken-image icon if a
 * file is ever missing.
 */
function Photo({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span
        className={`photo-fallback ${className ?? ""}`}
        role="img"
        aria-label={alt}
      >
        <Sun size={28} strokeWidth={1.6} />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={src}
      alt={alt}
      loading="eager"
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}

/* ---------------- brand mark ---------------- */

export function BrandMark({
  brand,
  logos,
  large = false,
  overrideLogo,
}: {
  brand: string;
  logos: LogoMap;
  large?: boolean;
  overrideLogo?: string;
}) {
  const img = overrideLogo || logos[brandKey(brand)] || "";
  const initials = brand
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <span className={`brand-mark ${large ? "bm-lg" : ""}`}>
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt={`${brand} logo`} />
      ) : (
        <span className="bm-fallback">
          <span className="bm-tile">{initials || "S"}</span>
          <span>{brand}</span>
        </span>
      )}
    </span>
  );
}

/* ---------------- M Way wordmark fallback ---------------- */

export function MwayLogo({ width = 140 }: { width?: number }) {
  return (
    <svg width={width} height={width * 0.36} viewBox="0 0 240 86" role="img" aria-label="M Way Solar">
      <g>
        <circle cx="58" cy="26" r="11" fill="#f4b323" />
        {Array.from({ length: 9 }).map((_, i) => {
          const a = (Math.PI * 2 * i) / 9 - Math.PI / 2;
          return (
            <line
              key={i}
              x1={58 + Math.cos(a) * 15}
              y1={26 + Math.sin(a) * 15}
              x2={58 + Math.cos(a) * 20}
              y2={26 + Math.sin(a) * 20}
              stroke="#f4b323"
              strokeWidth="3"
              strokeLinecap="round"
            />
          );
        })}
        <path d="M18 44 L58 30 L98 44 L58 58 Z" fill="#1f7d3f" />
        <path d="M18 44 L58 58 L58 64 L18 50 Z" fill="#146c3a" />
        <path d="M98 44 L58 58 L58 64 L98 50 Z" fill="#0f5b31" />
        {[30, 44, 58, 72, 86].map((x) => (
          <line key={x} x1={x} y1={x === 58 ? 44 : 44} x2={x} y2={58} stroke="#bfe6cf" strokeWidth="1" />
        ))}
      </g>
      <text x="112" y="55" fontFamily="Inter, sans-serif" fontSize="38" fontWeight="800" fill="#1f7d3f">
        M<tspan fill="#0d5c8a">Way</tspan>
      </text>
      <text x="114" y="74" fontFamily="Inter, sans-serif" fontSize="15" fontWeight="700" fill="#1f7d3f" letterSpacing="6">
        SOLAR
      </text>
    </svg>
  );
}

function DocLogo({
  settings,
  logos,
  variant = "tile",
}: {
  settings: CompanySettings;
  logos: LogoMap;
  variant?: "tile" | "cover";
}) {
  const logo = settings.logo || logos[brandKey(settings.name)];
  const cls = variant === "cover" ? "cover-logo" : "doc-logo";
  return (
    <div className={cls}>
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt={`${settings.name} logo`} />
      ) : (
        <MwayLogo width={variant === "cover" ? 140 : 144} />
      )}
    </div>
  );
}

function Page({
  children,
  num,
  frameClass = "",
  corner = true,
  showNum = true,
}: {
  children: ReactNode;
  num: number;
  frameClass?: string;
  corner?: boolean;
  showNum?: boolean;
}) {
  return (
    <section className="doc-page">
      <div className={`doc-frame ${frameClass}`}>
        {corner ? <div className="doc-corner" /> : null}
        {children}
        {showNum ? <span className="doc-num">{num}</span> : null}
      </div>
    </section>
  );
}

/* ---------------- charts ---------------- */

function niceMax(value: number): number {
  if (value <= 0) return 100;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  const step = pow / 4;
  return Math.ceil(value / step) * step;
}

const AXIS_STEPS = 4;

function GenerationChart({ data }: { data: { label: string; potential: number; expected: number }[] }) {
  const max = niceMax(Math.max(...data.map((d) => d.potential), 1));
  const ticks = Array.from({ length: AXIS_STEPS + 1 }, (_, i) =>
    Math.round(max - (max / AXIS_STEPS) * i),
  );
  return (
    <div className="gen-axis">
      <div className="gen-axis-labels">
        {ticks.map((t) => (
          <span key={t}>{t >= 1000 ? `${Math.round(t / 1000)}K` : t}</span>
        ))}
      </div>
      <div className="gen-chart flex-1">
        <div className="relative" style={{ height: 322 }}>
          {ticks.map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: `${(i / AXIS_STEPS) * 100}%`,
                borderTop: "1px solid #e6e8e7",
              }}
            />
          ))}
          <div style={{ position: "absolute", inset: "0 0 0 0", display: "flex", alignItems: "flex-end", gap: 4 }}>
            {data.map((d) => (
              <div key={d.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: "100%", width: "100%", justifyContent: "center" }}>
                  <div
                    style={{
                      width: "34%",
                      height: `${(d.potential / max) * 100}%`,
                      background: "#0d0d0d",
                      borderRadius: "3px 3px 0 0",
                    }}
                    title={`${d.potential} kWh`}
                  />
                  <div
                    style={{
                      width: "34%",
                      height: `${(d.expected / max) * 100}%`,
                      background: "#17d2a3",
                      borderRadius: "3px 3px 0 0",
                    }}
                    title={`${d.expected} kWh`}
                  />
                </div>
                <div style={{ height: 20, display: "flex", alignItems: "flex-end", fontSize: 9.5, color: "#3c4642", whiteSpace: "nowrap" }}>
                  {d.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="gen-axis-title">Units produced per month</div>
    </div>
  );
}

/** Fixed, non-editable ROI series used on page 4 (reference deck figures). */
const ROI_LIFETIME_CR = 139.4;
const ROI_YEARLY_CR = 4.3;
const ROI_PAYBACK_YEARS = 1;
const ROI_CUMULATIVE = Array.from({ length: 25 }, (_, i) =>
  Math.round(ROI_LIFETIME_CR * Math.pow((i + 1) / 25, 1.62) * 10) / 10,
);

function RoiChart() {
  const max = 140;
  const ticks = [140, 120, 100, 80, 60, 40, 20, 0];
  return (
    <div className="roi-chart">
      <div className="roi-grid">
        {ticks.map((t) => (
          <div key={t}>
            <span>₹{t.toFixed(1)}Cr</span>
          </div>
        ))}
      </div>
      <div style={{ height: 316, display: "flex", alignItems: "flex-end", gap: 4, paddingRight: 52 }}>
        {ROI_CUMULATIVE.map((v, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}>
            <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%", justifyContent: "center" }}>
              <div
                style={{
                  width: "62%",
                  height: `${Math.max((v / max) * 100, 0.8)}%`,
                  background: "#d9e2df",
                  borderRadius: "4px 4px 0 0",
                }}
                title={`Year ${i + 1}: ₹${v.toFixed(1)}Cr`}
              />
            </div>
            <div
              style={{
                height: 56,
                marginTop: 4,
                fontSize: 8.5,
                color: "#d9ece7",
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                whiteSpace: "nowrap",
              }}
            >
              Year {i + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** e.g. "9 × 580–630 W = 5.22–5.67 kW array (5 kW quoted)." */
function panelArrayLine(qty: number, min: number, max: number, quoted: number): string {
  const q = Math.floor(num(qty));
  const lo = num(min);
  const hi = num(max);
  if (q <= 0 || (lo <= 0 && hi <= 0)) {
    return `${capacityFmt(quoted)} kW array.`;
  }
  const low = (q * Math.min(lo || hi, hi || lo)) / 1000;
  const high = (q * Math.max(lo || hi, hi || lo)) / 1000;
  const arrayPart =
    low === high
      ? `${capacityFmt(low)} kW array`
      : `${capacityFmt(low)}–${capacityFmt(high)} kW array`;
  return `${q} × ${wattRange(min, max)} = ${arrayPart} (${capacityFmt(quoted)} kW quoted).`;
}

/* ---------------- proposal ---------------- */

export function Proposal({
  meta,
  data,
  products,
  logos,
  settings,
}: {
  meta: QuoteMeta;
  data: QuoteData;
  products: Product[];
  logos: LogoMap;
  settings: CompanySettings;
}) {
  const panels = selectedFor(products, "panel", data.panels);
  const inverters = selectedFor(products, "inverter", data.inverters);
  const hybrid = isHybrid(data);
  const sysLabel = systemLabel(data); // "On-Grid" | "Hybrid"
  const batteryKwh = num(data.batteryKwh);
  // battery only exists on hybrid quotes; no brand picked = brand confirmed later
  const batteries = hybrid && (data.batteries ?? []).length > 0
    ? selectedFor(products, "battery", data.batteries ?? [])
    : [];
  const cables = selectedFor(products, "cable", data.cables ?? []);
  const electricals = selectedFor(products, "electrical", data.electricals ?? []);
  const structures = selectedFor(products, "structure", data.structures ?? []);
  const t = calcTotals(data);
  const panel = panels[0];
  const inverter = inverters[0];
  const panelBrands = panels.map((p) => p.brand).join(" / ");
  const inverterBrands = inverters.map((i) => i.brand).join(" / ");
  const invQty = Math.max(1, Math.floor(num(data.inverterQty) || 1));
  const invKw = num(data.inverterKw) || num(inverter?.size) || 0;
  const splitBrands = (value: string): string[] =>
    value
      .split(/[/,]/)
      .map((b) => b.trim())
      .filter(Boolean);
  const coName = settings.name || "M Way Solar";
  const noteBits = [
    data.gstIncluded ? "INCLUDED GST" : "GST EXTRA",
    data.withKseb ? `KSEB INCLUDED ${rs(t.kseb)}` : "KSEB CHARGE EXTRA",
    data.withStructure ? `STRUCTURE INCLUDED${t.structure ? ` ${rs(t.structure)}` : ""}` : "STRUCTURE EXTRA",
  ];

  const panelLogos = panels.map((p) => p.brand);
  const inverterLogos = inverters.map((i) => i.brand);

  const componentLogo = (name: string) => {
    const key = brandKey(name);
    const img = logos[key];
    const label = name.split("/")[0]?.trim() || "Brand";
    return (
      <div className="comp-logo">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={`${name} logo`} />
        ) : (
          <span className="cl-txt">{label}</span>
        )}
      </div>
    );
  };

  const compRow = (
    spec: ReactNode,
    brands: ReactNode,
    desc: ReactNode,
    brandName?: string,
  ) => (
    <tr className="comp-row">
      <td className="c-spec">{spec}</td>
      <td className="c-brand">
        <div className="comp-logos">{brands}</div>
        {brandName ? <div className="comp-brandname">{brandName}</div> : null}
      </td>
      <td className="c-desc">{desc}</td>
    </tr>
  );

  const catRow = (icon: ReactNode, label: string) => (
    <tr className="comp-cat">
      <td colSpan={3}>
        {icon}
        {label}
      </td>
    </tr>
  );

  return (
    <>
      {/* ================= 1 · COVER ================= */}
      <Page num={1} showNum={false}>
        <div className="cover-band">
          <h1>{coName.toUpperCase()}</h1>
          <DocLogo settings={settings} logos={logos} variant="cover" />
        </div>

        <table className="cover-table">
          <tbody>
            <tr>
              <th>Name Of The Customer</th>
              <td>{meta.customer || "—"}</td>
            </tr>
            <tr className="tall">
              <th>Address</th>
              <td>{meta.address || "—"}</td>
            </tr>
            <tr>
              <th>Phone Number</th>
              <td>{meta.phone || "—"}</td>
            </tr>
            <tr className="tall">
              <th>Date</th>
              <td>{displayDate(meta.date)}</td>
            </tr>
          </tbody>
        </table>

        <div className="cover-hero">
          <Photo src="/images/cover-house.jpg" alt="Rooftop solar installation" />
        </div>
        <div className="cover-title">SOLAR PROPOSAL</div>
        <div className="cover-cap">
          CAPACITY: {capacityFmt(t.capacity)}KW {sysLabel} System
          {hybrid && batteryKwh > 0 ? (
            <small>with {capacityFmt(batteryKwh)} kWh battery storage</small>
          ) : null}
        </div>
        <div className="cover-ref">{coName.toUpperCase()} QUOTATION NUMBER: {meta.ref}</div>
      </Page>

      {/* ================= 2 · ABOUT ================= */}
      <Page num={2}>
        <DocLogo settings={settings} logos={logos} />
        <h2 className="doc-title">ABOUT {coName.toUpperCase()}</h2>
        <p className="doc-p" style={{ fontSize: 14, lineHeight: 1.5, paddingLeft: 10 }}>
          {settings.mission}
        </p>

        <div className="about-collage">
          <div className="about-col col-left">
            <Photo className="grow-a" src="/images/about-install.jpg" alt="Technicians installing solar panels" />
            <Photo className="grow-b" src="/images/about-detail.jpg" alt="Installer fixing panel clamps" />
          </div>
          <div className="about-col col-right">
            <Photo className="grow-a" src="/images/about-clean.jpg" alt="Solar panel cleaning and maintenance" />
            <Photo className="grow-b" src="/images/about-team.jpg" alt="M Way Solar installation team" />
          </div>
        </div>
        <p className="about-caption">Each site is installed end to end with Free AMC &amp; monitoring</p>

        <div className="about-vision-title">VISION</div>
        <p className="about-vision-text">{settings.vision}</p>
      </Page>

      {/* ================= 3 · GENERATION ================= */}
      <Page num={3}>
        <DocLogo settings={settings} logos={logos} />
        <h2 className="doc-title">GENERATION</h2>
        <p className="gen-kicker">
          {new Date(`${meta.date}T00:00:00`).toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
          })}
        </p>
        <div className="doc-h3" style={{ marginTop: 10 }}>
          ROUND THE YEAR GENERATION — {capacityFmt(t.capacity)} KW SYSTEM
        </div>
        <GenerationChart data={t.monthly} />
        <div className="gen-stats">
          <div>
            <b>75%</b>
            <span>PR: Performance Ratio</span>
          </div>
          <div>
            <b>29%</b>
            <span>Monsoon Dip</span>
          </div>
          <div>
            <b>{num(data.unitsPerKw) || 0}</b>
            <span>Average units per kW/Day</span>
          </div>
        </div>
        <p className="doc-p doc-small doc-muted" style={{ textAlign: "center", marginTop: 22 }}>
          Generation figures are indicative and may vary with site conditions, weather patterns.
        </p>
      </Page>

      {/* ================= 4 · ROI (fixed, non-editable) ================= */}
      <Page num={4} frameClass="roi-frame" corner={false} showNum={false}>
        <h2 className="roi-title">
          {capacityFmt(t.capacity)}KW {sysLabel.replace("-", "").toUpperCase()} ROI
        </h2>
        <p className="roi-sub">SOLAR IS ONE OF THE BEST INVESTMENTS YOU WILL EVER MAKE</p>
        <RoiChart />
        <div className="roi-boxes">
          <div className="roi-box">
            <b>₹4.3Cr</b>
            <span>Yearly Savings</span>
          </div>
          <div className="roi-box">
            <b>{ROI_PAYBACK_YEARS} Years</b>
            <span>Payback Period</span>
          </div>
          <div className="roi-box">
            <b>₹139.4Cr</b>
            <span>Total Lifetime Saving</span>
          </div>
        </div>
        <p className="roi-finance">Easy Financing Options Available</p>
        <div className="roi-pill">{settings.financingNote}</div>
        <p className="doc-small" style={{ marginTop: 16, color: "#bfe0d8", textAlign: "center" }}>
          Fixed reference illustration — not derived from this quotation. Yearly saving
          ₹{ROI_YEARLY_CR}Cr, payback {ROI_PAYBACK_YEARS} year and 25-year lifetime saving
          ₹{ROI_LIFETIME_CR}Cr.
        </p>
      </Page>

      {/* ================= 5 · TIMELINE & SPEC ================= */}
      <Page num={5}>
        <DocLogo settings={settings} logos={logos} />
        <h2 className="doc-title">TIMELINE</h2>
        <div className="doc-h3" style={{ marginTop: 8 }}>
          TIMELINE AND MILESTONES
        </div>
        <div className="timeline-panel">
          <div className="tl-steps">
            {[
              { icon: <ClipboardCheck size={16} />, title: "Permitting", text: "Approvals and documentation in 1 week" },
              { icon: <Truck size={16} />, title: "Procurement", text: "Material sourcing and delivery in 1-2 weeks" },
              { icon: <Wrench size={16} />, title: "Installation", text: "Panel mounting, wiring and inverter in 2-4 weeks" },
              { icon: <Search size={16} />, title: "Site Assessment", text: "Final inspection and quality checks in 1-2 weeks" },
              { icon: <Gauge size={16} />, title: "Commissioning", text: "Testing and grid synchronization by week 6" },
              { icon: <Handshake size={16} />, title: "Support", text: "Channel partner and service assistance" },
            ].map((s) => (
              <div className="tl-step" key={s.title}>
                <div className="tl-ico">{s.icon}</div>
                <b>{s.title}</b>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
          <div className="tl-band">
            {["STEP 01", "STEP 02", "STEP 03", "STEP 04", "STEP 05", "STEP 06"].map((s) => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </div>

        <div className="doc-h3" style={{ marginTop: 18 }}>
          SYSTEM SPECIFICATION
        </div>
        <div className="spec-row">
          <div className="spec-side">
            <div className="spec-node">
              <Sun size={20} />
              SOLAR PANELS
            </div>
            <div className="spec-node">
              <ShieldCheck size={20} />
              QUALITY
              <br />
              STRUCTURE
            </div>
          </div>
          <div className="spec-link" />
          <div className="spec-core">
            SYSTEM
            <br />
            SPECIFICATION
          </div>
          <div className="spec-link" />
          <div className="spec-side">
            <div className="spec-node">
              <Zap size={20} />
              {hybrid ? "HYBRID" : "GRID TIED"}
              <br />
              INVERTER
            </div>
            {hybrid ? (
              <div className="spec-node">
                <BatteryCharging size={20} />
                BATTERY
                <br />
                {batteryKwh > 0 ? `${capacityFmt(batteryKwh)} kWh` : "STORAGE"}
              </div>
            ) : (
              <div className="spec-node">
                <PlugZap size={20} />
                ONGRID
                <br />
                SYSTEM
              </div>
            )}
          </div>
        </div>
        <p className="spec-note">
          Net metering is entirely dependent on DISCOM, we don&apos;t control that process.
        </p>
      </Page>

      {/* ================= 6 · COMPONENTS ================= */}
      <Page num={6}>
        <DocLogo settings={settings} logos={logos} />
        <h2 className="doc-title">SOLAR COMPONENTS</h2>
        <p className="doc-p" style={{ fontSize: 12.5, marginTop: 2 }}>
          High-quality components from trusted Tier-1 OEMs, selected for performance, safety and
          long-term ROI.
        </p>
        <table className="comp-table">
          <thead>
            <tr>
              <th>Specifications</th>
              <th>Brand</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {catRow(<Package size={14} />, "PANEL")}
            {compRow(
              <>
                <b>Type:</b> {data.panelType || settings.panelType}
                <br />
                <b>Quantity:</b> {t.qty || "—"} panels
                <br />
                <b>Capacity:</b> {wattRange(data.panelWattsMin, data.panelWattsMax)} per panel
                <br />
                <b>Warranty:</b> {data.panelWarranty || settings.panelWarranty}
              </>,
              panelLogos.map((b) => <Fragment key={b}>{componentLogo(b)}</Fragment>),
              `${panelArrayLine(t.qty, data.panelWattsMin, data.panelWattsMax, t.capacity)} High-efficiency modules with reliable long-term generation.`,
              panelBrands,
            )}
            {catRow(<Zap size={14} />, "INVERTER")}
            {compRow(
              <>
                <b>Type:</b> {data.inverterType || (hybrid ? "Hybrid" : settings.inverterType || "On-Grid")}
                <br />
                <b>Capacity:</b> {invQty} × {invKw} kW
                <br />
                <b>Warranty:</b> {data.inverterWarranty || settings.inverterWarranty}
              </>,
              inverterLogos.map((b) => <Fragment key={b}>{componentLogo(b)}</Fragment>),
              `${invQty > 1 ? `${invQty} units — ` : ""}high conversion efficiency with monitoring and advanced protection.`,
              inverterBrands,
            )}
            {catRow(<Cable size={14} />, "CABLE")}
            {compRow(
              cables.length > 0 ? (
                <>
                  {cables.map((c) => (
                    <Fragment key={c.id}>
                      <b>{c.brand}:</b> {c.model}
                      <br />
                    </Fragment>
                  ))}
                  {settings.cableSpec}
                </>
              ) : (
                <>
                  DC/AC solar cables
                  <br />
                  {settings.cableSpec}
                </>
              ),
              (cables.length > 0 ? cables.map((c) => c.brand) : splitBrands(settings.cableBrand)).map(
                (b) => <Fragment key={b}>{componentLogo(b)}</Fragment>,
              ),
              "Premium DC 4/6 sq.mm and AC 10 sq.mm solar-grade cables ensuring low-loss power transmission and UV resistance.",
              cables.length > 0
                ? cables.map((c) => c.brand).join(" / ")
                : settings.cableBrand,
            )}
            {catRow(<PlugZap size={14} />, "ELECTRICAL")}
            {compRow(
              electricals.length > 0 ? (
                <>
                  {electricals.map((e) => (
                    <Fragment key={e.id}>
                      <b>{e.brand}:</b> {e.model}
                      <br />
                    </Fragment>
                  ))}
                  {settings.electricalSpec}
                </>
              ) : (
                <>
                  {settings.electricalSpec}
                  <br />
                  IS/IEC standard
                </>
              ),
              (electricals.length > 0
                ? electricals.map((e) => e.brand)
                : splitBrands(settings.electricalBrand)
              ).map((b) => <Fragment key={b}>{componentLogo(b)}</Fragment>),
              "Connectors, ACDB/DCDB with MCBs for surge protection on both the DC and AC side.",
              electricals.length > 0
                ? electricals.map((e) => e.brand).join(" / ")
                : settings.electricalBrand,
            )}
            {catRow(<ShieldCheck size={14} />, "STRUCTURE")}
            {compRow(
              <>
                {structures.length > 0 ? (
                  <>
                    {structures.map((st) => (
                      <Fragment key={st.id}>
                        <b>{st.brand}:</b> {st.model}
                        <br />
                      </Fragment>
                    ))}
                    {settings.structureSpec}
                  </>
                ) : (
                  settings.structureSpec
                )}
                <br />
                <b>{data.withStructure ? "Included in this quote" : "Extra — not included"}</b>
              </>,
              (structures.length > 0
                ? structures.map((st) => st.brand)
                : splitBrands(settings.structureBrand)
              ).map((b) => <Fragment key={b}>{componentLogo(b)}</Fragment>),
              "Corrosion-free, durable structure with mid clamps, end clamps and HDGI screws.",
              structures.length > 0
                ? structures.map((st) => st.brand).join(" / ")
                : settings.structureBrand,
            )}
            {hybrid ? (
              <>
                {catRow(<BatteryCharging size={14} />, "BATTERY")}
                {compRow(
                  <>
                    <b>Type:</b>{" "}
                    {batteries.map((b) => b.model).filter(Boolean).join(" / ") || "Lithium battery storage"}
                    <br />
                    <b>Capacity:</b> {batteryKwh > 0 ? `${capacityFmt(batteryKwh)} kWh` : "—"}
                    <br />
                    <b>Warranty:</b> {data.batteryWarranty || "As per manufacturer"}
                  </>,
                  (batteries.length > 0
                    ? batteries.map((b) => b.brand)
                    : splitBrands(settings.batteryBrand)
                  ).map((b) => <Fragment key={b}>{componentLogo(b)}</Fragment>),
                  `${batteryKwh > 0 ? `${capacityFmt(batteryKwh)} kWh ` : ""}battery storage for backup and night-time use, with the specification confirmed at site survey.`,
                  batteries.length > 0
                    ? batteries.map((b) => b.brand).join(" / ")
                    : settings.batteryBrand,
                )}
              </>
            ) : null}
            {compRow(
              <>
                End-to-end installation
                <br />
                <b>Support:</b> Free AMC
                <br />
                Ongoing monitoring
              </>,
              componentLogo(coName),
              settings.installationNote,
              coName.toUpperCase(),
            )}
          </tbody>
        </table>
      </Page>

      {/* ================= 7 · OFFER & TERMS ================= */}
      <Page num={7}>
        <DocLogo settings={settings} logos={logos} />
        <h2 className="doc-title">OFFER &amp; TERMS</h2>
        <div className="doc-h3" style={{ marginTop: 10 }}>
          COST
        </div>
        <table className="offer-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>System Cost</td>
              <td className="o-amount">{rs(t.systemCost)}</td>
              <td className="o-total">
                {rs(t.systemCost)}
                <span className="offer-note">
                  {noteBits.map((b) => (
                    <span key={b} style={{ display: "block" }}>
                      ({b})
                    </span>
                  ))}
                </span>
              </td>
            </tr>
            <tr>
              <td>Subsidy</td>
              <td className="o-amount" />
              <td className="o-total">{rs(t.subsidy)}</td>
            </tr>
            <tr>
              <td>Total Payable Cost</td>
              <td className="o-amount" />
              <td className="o-total" style={{ fontSize: 15 }}>
                {rs(t.totalPayable)}
              </td>
            </tr>
          </tbody>
        </table>
        <p className="doc-small doc-muted" style={{ marginTop: 6 }}>
          Subsidy is shown for information only and is not deducted from the payable amount. Offer
          valid for {num(data.validity)} days.
        </p>

        <div className="doc-h3" style={{ marginTop: 34 }}>
          SCOPE
        </div>
        <div className="scope-box">
          <b>What we cover under our services</b>
          <div className="scope-grid">
            {["SYSTEM DESIGN", "FREE AMC & MONITORING", "INSTALLATION", "COMMISSIONING"].map((s) => (
              <div className="scope-chip" key={s}>
                {s}
              </div>
            ))}
          </div>
          <p className="doc-small" style={{ margin: "8px 0 0", fontStyle: "italic" }}>
            Delay in net metering is entirely on DISCOM, we don&apos;t control their operations.
          </p>
        </div>

        <div className="doc-h3" style={{ marginTop: 26 }}>
          PAYMENT TERMS
        </div>
        <div className="pay-rail">
          <div className="pay-item">
            <div className="pay-dot">1</div>
            <div className="pay-stem" />
            <b>60%</b>
            <span>Procurement</span>
          </div>
          <div className="pay-item alt">
            <b>30%</b>
            <span>Installation</span>
            <div className="pay-stem" style={{ marginTop: 6 }} />
            <div className="pay-dot">2</div>
          </div>
          <div className="pay-item">
            <div className="pay-dot">3</div>
            <div className="pay-stem" />
            <b>10%</b>
            <span>Net metering</span>
          </div>
        </div>
      </Page>

      {/* ================= 8 · ENVIRONMENT ================= */}
      <Page num={8}>
        <DocLogo settings={settings} logos={logos} />
        <h2 className="doc-title">ENVIRONMENT IMPACT</h2>
        <p className="doc-p" style={{ fontSize: 15, marginTop: 6 }}>
          You are contributing to solve earth&apos;s biggest problem —
          <br />
          <b>Climate Change</b>
        </p>
        <div className="env-list">
          <div className="env-item">
            <div className="env-icon">
              <Leaf strokeWidth={1.2} />
            </div>
            <div className="env-text">
              <h3>CARBON DIOXIDE OFFSET</h3>
              <p>{t.co2Tons.toLocaleString("en-IN")} Metric Tons</p>
            </div>
          </div>
          <div className="env-item">
            <div className="env-icon">
              <Trees strokeWidth={1.2} />
            </div>
            <div className="env-text">
              <h3>EQUIVALENT ACRES OF FOREST</h3>
              <p>{t.forestAcres.toLocaleString("en-IN")} Acres/Year</p>
            </div>
          </div>
          <div className="env-item">
            <div className="env-icon">
              <Flame strokeWidth={1.2} />
            </div>
            <div className="env-text">
              <h3>COAL BURN AVOIDED</h3>
              <p>{t.coalTons.toLocaleString("en-IN")} Metric Tons</p>
            </div>
          </div>
        </div>
        <p className="doc-small doc-muted" style={{ marginTop: "auto", textAlign: "center" }}>
          Calculated from an estimated {t.annualUnits.toLocaleString("en-IN")} units of clean
          generation per year for the {capacityFmt(t.capacity)} kW system.
        </p>
      </Page>

      {/* ================= 9 · THANK YOU ================= */}
      <Page num={9}>
        <div className="thanks-photo">
          <Photo src="/images/aerial-solar.jpg" alt="Aerial view of a solar plant" />
        </div>
        <p className="thanks-note">
          <b>Important Note:</b>
          <br />
          {settings.thankYouNote}
        </p>
        <h2 className="thanks-title">THANK YOU</h2>
        <div className="thanks-sign">
          <span>Looking forward to work and add value</span>
          <span className="thanks-box" />
        </div>
      </Page>

      {/* ================= 10 · BANK DETAILS ================= */}
      <Page num={10}>
        <DocLogo settings={settings} logos={logos} />
        <h2 className="doc-title">BANK DETAILS</h2>
        <div className="bank-rows">
          <div>
            <b>Account No.</b>: {settings.bankAccount || "—"}
          </div>
          <div>
            <b>IFSC</b>: {settings.bankIfsc || "—"}
          </div>
          <div>
            <b>Bank</b>: {settings.bankName || "—"}
          </div>
          <div>
            <b>Branch</b>: {settings.bankBranch || "—"}
          </div>
        </div>
        <p className="bank-note">
          Note: Tax rates and statutory charges should be verified and updated as applicable at the
          time of billing.
        </p>
        <div className="bank-strip">
          <div className="bank-left">
            <b>Phone:</b>
            <p>{settings.phone || "—"}</p>
            <b>Email:</b>
            <p>{settings.email || "—"}</p>
          </div>
          <div className="bank-right">
            <b>Address:</b>
            <p>{settings.address || "—"}</p>
          </div>
        </div>
        <div className="doc-spacer" />
        <p className="doc-small doc-muted" style={{ textAlign: "center" }}>
          {coName} · Quotation {meta.ref} · {displayDate(meta.date)}
        </p>
      </Page>
    </>
  );
}

/* ---------------- scaling wrapper ---------------- */

export function ScaledPreview({ children }: { children: ReactNode }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(11420);

  useLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const update = () => {
      const stage = outer.parentElement;
      const w = stage ? stage.clientWidth : outer.clientWidth;
      const s = Math.min(1, Math.max(0.3, (w - 40) / 794));
      setScale(s);
      setHeight(inner.scrollHeight);
    };

    update();
    const ro = new ResizeObserver(update);
    if (outer.parentElement) ro.observe(outer.parentElement);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={outerRef}
      className="doc-scale-outer mx-auto"
      style={{ width: 794 * scale, height: height * scale }}
    >
      <div
        ref={innerRef}
        className="doc-scaler"
        style={{ width: 794, transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        {children}
      </div>
    </div>
  );
}
