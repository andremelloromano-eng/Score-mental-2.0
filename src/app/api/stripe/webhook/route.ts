import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      error: "Integração Stripe removida. Use /api/mercadopago/webhook."
    },
    { status: 410 }
  );
}
