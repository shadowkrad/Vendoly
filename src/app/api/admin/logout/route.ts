import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(ADMIN_COOKIE_NAME);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/admin/logout error:", error);
    return NextResponse.json(
      { error: "Errore durante il logout" },
      { status: 500 }
    );
  }
}
