import { NextResponse } from "next/server";
import { trackEvent, type EventAction } from "@/lib/db";

const VALID_ACTIONS: EventAction[] = [
  "test_completed",
  "certificate_downloaded",
  "premium_purchased",
];

function clamp(v: unknown, min: number, max: number): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : null;
}

function sanitizeStr(v: unknown, maxLen: number): string | null {
  if (typeof v !== "string") return null;
  return v.slice(0, maxLen).trim() || null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await trackEvent({
      action,
      name: sanitizeStr(body.name, 200),
      email: sanitizeStr(body.email, 320),
      qi: clamp(body.qi, 0, 250),
      percentile: clamp(body.percentile, 0, 100),
      score: sanitizeStr(body.score, 20),
      payment_status: sanitizeStr(body.payment_status, 50),
      amount: clamp(body.amount, 0, 10000),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/track] Error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 });
  }
}
