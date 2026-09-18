import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminPin, ADMIN_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { pin } = await req.json();

    if (!pin || !verifyAdminPin(pin)) {
      return NextResponse.json(
        { error: "PIN non valido o errato" },
        { status: 401 }
      );
    }

    // Imposta cookie di sessione HTTP-only
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, "authenticated_admin", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 giorni
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/admin/auth error:", error);
    return NextResponse.json(
      { error: "Errore durante l'autenticazione" },
      { status: 500 }
    );
  }
}
