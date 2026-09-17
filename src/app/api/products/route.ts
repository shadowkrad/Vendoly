import { NextRequest, NextResponse } from "next/server";
import { getStoreProducts } from "@/lib/store-actions";
import { validatePosAuthorization } from "@/lib/auth-pos";

export async function GET(req: NextRequest) {
  // Controllo autorizzazione
  const auth = validatePosAuthorization(req);
  if (!auth.authorized && auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const products = await getStoreProducts();
    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Impossibile recuperare il catalogo" },
      { status: 500 }
    );
  }
}
