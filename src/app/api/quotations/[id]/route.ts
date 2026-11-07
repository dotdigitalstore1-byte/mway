import { NextResponse } from "next/server";
import { db } from "@/db";
import { quotations } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { QuotationRow, QuoteData } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

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

export async function GET(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const qid = Number(id);
    const [row] = await db.select().from(quotations).where(eq(quotations.id, qid));
    if (!row) {
      return NextResponse.json({ ok: false, error: "Quotation not found." }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      quotation: {
        ...toRow(row),
        address: row.address,
        data: row.data as QuoteData,
      },
    });
  } catch (error) {
    console.error("get quotation failed", error);
    return NextResponse.json({ ok: false, error: "Could not open quotation." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const qid = Number(id);
    const body = await request.json();
    const data = body?.data ?? {};
    const meta = body?.meta ?? {};
    const [row] = await db
      .update(quotations)
      .set({
        customer: String(meta.customer ?? ""),
        address: String(meta.address ?? ""),
        phone: String(meta.phone ?? ""),
        date: String(meta.date ?? ""),
        status: data.verified ? "ready" : "draft",
        capacity: String(Number(meta.capacity) || 0),
        total: String(Number(meta.total) || 0),
        data,
        updatedAt: new Date(),
      })
      .where(eq(quotations.id, qid))
      .returning();
    if (!row) {
      return NextResponse.json({ ok: false, error: "Quotation not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, quotation: toRow(row) });
  } catch (error) {
    console.error("update quotation failed", error);
    return NextResponse.json({ ok: false, error: "Could not update quotation." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const qid = Number(id);
    await db.delete(quotations).where(eq(quotations.id, qid));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("delete quotation failed", error);
    return NextResponse.json({ ok: false, error: "Could not delete quotation." }, { status: 500 });
  }
}
