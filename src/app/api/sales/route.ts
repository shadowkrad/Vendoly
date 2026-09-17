import { NextRequest, NextResponse } from "next/server";
import { getStoreOrders, createOrder } from "@/lib/store-actions";
import { validatePosAuthorization } from "@/lib/auth-pos";

export async function GET(req: NextRequest) {
  const auth = validatePosAuthorization(req);
  if (!auth.authorized && auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const orders = await getStoreOrders();
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalRevenue,
        totalSalesCount: orders.length,
        averageTicket: orders.length > 0 ? totalRevenue / orders.length : 0,
      },
      sales: orders,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = validatePosAuthorization(req);
  if (!auth.authorized && auth.errorResponse) {
    return auth.errorResponse;
  }

  try {
    const body = await req.json();
    const { items, customerName = "Cliente Cassa", customerPhone = "N/D", paymentMethod = "CONTANTI" } = body;

    const result = await createOrder({
      customerName,
      customerPhone,
      fulfillmentType: "RITIRO_IN_NEGOZIO",
      channel: paymentMethod === "CONTANTI" ? "CASSA_CONTANTI" : "CASSA_POS",
      items: (items || []).map((it: any) => ({
        productId: it.id || it.productId,
        quantity: it.quantity || 1,
        unitPrice: it.price || it.unitPrice || 0,
      })),
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 400 });
  }
}
