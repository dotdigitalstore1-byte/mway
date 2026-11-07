import { NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const data = body?.data ?? {};
    await db
      .insert(settings)
      .values({ id: 1, data, updatedAt: new Date() })
      .onConflictDoUpdate({ target: settings.id, set: { data, updatedAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("save settings failed", error);
    return NextResponse.json({ ok: false, error: "Could not save settings." }, { status: 500 });
  }
}
