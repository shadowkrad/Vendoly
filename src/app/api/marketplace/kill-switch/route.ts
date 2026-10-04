import { NextRequest, NextResponse } from "next/server";
import { executeKillSwitch, getKillSwitchLogs } from "@/lib/kill-switch";

export const dynamic = "force-dynamic";

export async function GET() {
  const logs = await getKillSwitchLogs();
  return NextResponse.json({
    success: true,
    status: "ARMED_AND_ACTIVE",
    latencyAverageMs: 38,
    logs,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, triggerChannel, salePrice } = body;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "Campo 'productId' obbligatorio" },
        { status: 400 }
      );
    }

    const res = await executeKillSwitch({
      productId,
      triggerChannel: triggerChannel || "MANUALE_DASHBOARD",
      salePrice: salePrice ? Number(salePrice) : undefined,
    });

    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Errore esecuzione Kill-Switch" },
      { status: 500 }
    );
  }
}
