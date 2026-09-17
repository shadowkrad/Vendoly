import { NextRequest, NextResponse } from "next/server";
import { getStoreProducts } from "@/lib/store-actions";
import { validatePosAuthorization } from "@/lib/auth-pos";

export async function GET(req: NextRequest) {
  const auth = validatePosAuthorization(req);
  if (!auth.authorized && auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const products = await getStoreProducts();
    const listings = products.flatMap((p) => {
      const list = [];
      if (p.syncFacebook) list.push({ productId: p.id, channel: "FACEBOOK", status: "ACTIVE", product: p });
      if (p.syncSubito) list.push({ productId: p.id, channel: "SUBITO", status: "ACTIVE", product: p });
      if (p.syncEbay) list.push({ productId: p.id, channel: "EBAY", status: "ACTIVE", product: p });
      if (p.syncVinted) list.push({ productId: p.id, channel: "VINTED", status: "ACTIVE", product: p });
      return list;
    });

    return NextResponse.json({ success: true, listings });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
