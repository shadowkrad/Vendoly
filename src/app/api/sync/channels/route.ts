import { NextRequest, NextResponse } from "next/server";
import {
  syncOmnichannelChannels,
  fetchOmnichannelStatus,
  OmnichannelDayHours,
  OmnichannelSpecialClosure,
} from "@/lib/omnichannel-client";

export async function GET() {
  try {
    const status = await fetchOmnichannelStatus();
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Errore recupero stato canali" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { weeklyHours, specialClosures } = body as {
      weeklyHours: OmnichannelDayHours[];
      specialClosures?: OmnichannelSpecialClosure[];
    };

    if (!Array.isArray(weeklyHours)) {
      return NextResponse.json(
        { ok: false, error: "Formato weeklyHours non valido" },
        { status: 400 }
      );
    }

    const result = await syncOmnichannelChannels({
      weeklyHours,
      specialClosures,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Errore sincronizzazione canali" },
      { status: 500 }
    );
  }
}
