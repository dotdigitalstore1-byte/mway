import { NextResponse } from "next/server";
import { db } from "@/db";
import { quotations } from "@/db/schema";
import { desc } from "drizzle-orm";
import { nextRefFrom } from "@/lib/ref";
import type { QuotationRow } from "@/lib/types";

export const dynamic = "force-dynamic";

function toRow(row: typeof quotations.$inferSelect): QuotationRow {
  return {
    id: row.id,
    ref: row.ref,
    customer: row.customer,
    phone: row.phone,
    date: row.date,
    status: row.status,
    capacity: Number(row.capacity),
    total: Number(row.total),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET() {
  try {
    const rows = await db.select().from(quotations).orderBy(desc(quotations.updatedAt));
    return NextResponse.json({ ok: true, quotations: rows.map(toRow) });
  } catch (error) {
    console.error("list quotations failed", error);
    return NextResponse.json({ ok: false, error: "Could not load quotations." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = body?.data ?? {};
    const meta = body?.meta ?? {};

    // Guarantee a unique reference: retry with the next sequence on conflict.
    let ref = String(meta.ref ?? "").trim();
    let row: typeof quotations.$inferSelect | undefined;
    for (let attempt = 0; attempt < 25 && !row; attempt++) {
      if (!ref) {
        const existing = await db.select({ ref: quotations.ref }).from(quotations);
        ref = nextRefFrom(existing.map((r) => r.ref));
      }
      try {
        const [inserted] = await db
          .insert(quotations)
          .values({
            ref,
            customer: String(meta.customer ?? ""),
            address: String(meta.address ?? ""),
            phone: String(meta.phone ?? ""),
            date: String(meta.date ?? ""),
            status: data.verified ? "ready" : "draft",
            capacity: String(Number(meta.capacity) || 0),
            total: String(Number(meta.total) || 0),
            data,
          })
          .returning();
        row = inserted;
      } catch (insertError) {
        const message = String((insertError as Error)?.message ?? "");
        if (message.includes("quotations_ref_unique") || message.includes("duplicate key")) {
          const all = await db.select({ ref: quotations.ref }).from(quotations);
          ref = nextRefFrom([...all.map((r) => r.ref), ref]);
          continue;
        }
        throw insertError;
      }
    }
    if (!row) {
      return NextResponse.json({ ok: false, error: "Could not allocate a quotation number." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, quotation: toRow(row) });
  } catch (error) {
    console.error("create quotation failed", error);
    return NextResponse.json({ ok: false, error: "Could not save quotation." }, { status: 500 });
  }
}
