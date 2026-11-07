import { NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const allowed = ["panel", "inverter", "battery", "cable", "electrical", "structure"];
    const requested = String(body?.kind ?? "panel");
    const kind = allowed.includes(requested) ? requested : "panel";
    const [row] = await db
      .insert(products)
      .values({
        kind,
        brand: String(body?.brand ?? `New ${kind}`),
        model: String(body?.model ?? ""),
        size: String(Number(body?.size) || 0),
        price: String(Number(body?.price) || 0),
        warranty: String(body?.warranty ?? "Confirm manufacturer's warranty"),
      })
      .returning();
    return NextResponse.json({
      ok: true,
      product: {
        id: row.id,
        kind: row.kind,
        brand: row.brand,
        model: row.model,
        size: Number(row.size),
        price: Number(row.price),
        warranty: row.warranty,
      },
    });
  } catch (error) {
    console.error("create product failed", error);
    return NextResponse.json({ ok: false, error: "Could not add product." }, { status: 500 });
  }
}
