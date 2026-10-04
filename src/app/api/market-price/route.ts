import { NextRequest, NextResponse } from "next/server";
import { analyzeMarketPrice } from "@/lib/market-pricing";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const brand = searchParams.get("brand") || "";
    const category = searchParams.get("category") || "Abbigliamento";
    const condition = searchParams.get("condition") || "OTTIMO";

    const analysis = analyzeMarketPrice({
      query,
      brand,
      category,
      condition,
    });

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Errore durante l'analisi prezzi di mercato" },
      { status: 500 }
    );
  }
}
