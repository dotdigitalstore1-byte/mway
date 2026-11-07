import { NextResponse } from "next/server";
import { db } from "@/db";
import { brandLogos } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const VALID_DATA_URL = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/i;
const MAX_BYTES = 400_000; // ~250 KB image -> ~333 KB base64, allow headroom

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const brandName = String(body?.brandName ?? "").trim();
    const imageData = String(body?.imageData ?? "");
    if (!brandName) {
      return NextResponse.json({ ok: false, error: "Brand name is required." }, { status: 400 });
    }
    if (!VALID_DATA_URL.test(imageData) || imageData.length > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: "Logo must be a PNG, JPG or WebP image under 250 KB." },
        { status: 400 },
      );
    }
    const key = brandName.toLowerCase();
    await db
      .insert(brandLogos)
      .values({ brandKey: key, brandName, imageData })
      .onConflictDoUpdate({
        target: brandLogos.brandKey,
        set: { brandName, imageData },
      });
    return NextResponse.json({ ok: true, brandKey: key, imageData });
  } catch (error) {
    console.error("logo upload failed", error);
    return NextResponse.json({ ok: false, error: "Could not save logo." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { brandKey } = await request.json();
    const key = String(brandKey ?? "").trim().toLowerCase();
    if (!key) {
      return NextResponse.json({ ok: false, error: "Missing brand key." }, { status: 400 });
    }
    await db.delete(brandLogos).where(eq(brandLogos.brandKey, key));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("logo delete failed", error);
    return NextResponse.json({ ok: false, error: "Could not remove logo." }, { status: 500 });
  }
}
