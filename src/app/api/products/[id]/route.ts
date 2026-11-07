import { NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const productId = Number(id);
    if (!Number.isInteger(productId)) {
      return NextResponse.json({ ok: false, error: "Invalid id." }, { status: 400 });
    }
    const body = await request.json();
    const patch: Record<string, string> = {};
    if (typeof body.brand === "string") patch.brand = body.brand;
    if (typeof body.model === "string") patch.model = body.model;
    if (typeof body.warranty === "string") patch.warranty = body.warranty;
    if (body.size !== undefined) patch.size = String(Number(body.size) || 0);
    if (body.price !== undefined) patch.price = String(Number(body.price) || 0);

    const [row] = await db
      .update(products)
      .set(patch)
      .where(eq(products.id, productId))
      .returning();
    if (!row) {
      return NextResponse.json({ ok: false, error: "Product not found." }, { status: 404 });
    }
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
    console.error("update product failed", error);
    return NextResponse.json({ ok: false, error: "Could not update product." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const productId = Number(id);
    if (!Number.isInteger(productId)) {
      return NextResponse.json({ ok: false, error: "Invalid id." }, { status: 400 });
    }
    await db.delete(products).where(eq(products.id, productId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("delete product failed", error);
    return NextResponse.json({ ok: false, error: "Could not delete product." }, { status: 500 });
  }
}
