import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

function getNotificationPaymentId(url: URL, body: unknown): string | null {
  const idFromQuery = url.searchParams.get("id") || url.searchParams.get("data.id");
  if (idFromQuery) return idFromQuery;

  const mpId = url.searchParams.get("payment_id") || url.searchParams.get("collection_id");
  if (mpId) return mpId;

  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  const directId = b.id;
  if (typeof directId === "string" || typeof directId === "number") return String(directId);

  const data = b.data;
  if (data && typeof data === "object") {
    const dataId = (data as Record<string, unknown>).id;
    if (typeof dataId === "string" || typeof dataId === "number") return String(dataId);
  }

  return null;
}

function getWebhookDataIdForSignature(url: URL, body: unknown): string | null {
  const fromQuery = url.searchParams.get("data.id");
  if (fromQuery) return fromQuery;
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const data = b.data;
  if (data && typeof data === "object") {
    const dataId = (data as Record<string, unknown>).id;
    if (typeof dataId === "string" || typeof dataId === "number") return String(dataId);
  }
  return null;
}

function parseMercadoPagoSignature(signature: string): { ts: string; v1: string } | null {
  const parts = signature.split(",");
  let ts = "";
  let v1 = "";
  for (const part of parts) {
    const [k, v] = part.split("=", 2);
    if (!k || !v) continue;
    const key = k.trim();
    const value = v.trim();
    if (key === "ts") ts = value;
    if (key === "v1") v1 = value;
  }
  if (!ts || !v1) return null;
  return { ts, v1 };
}

function verifyMercadoPagoWebhookSignature(params: {
  signatureHeader: string;
  requestId: string;
  dataId: string;
  secret: string;
}): boolean {
  const parsed = parseMercadoPagoSignature(params.signatureHeader);
  if (!parsed) return false;
  const manifest = `id:${params.dataId};request-id:${params.requestId};ts:${parsed.ts};`;
  const expected = crypto.createHmac("sha256", params.secret).update(manifest).digest("hex");
  return expected.toLowerCase() === parsed.v1.toLowerCase();
}

async function handleWebhook(request: Request, body: unknown) {
  const url = new URL(request.url);
  console.log("[mercadopago/webhook] notificação recebida", {
    method: request.method,
    path: url.pathname,
    query: url.search,
    topic: url.searchParams.get("topic") || url.searchParams.get("type"),
    contentType: request.headers.get("content-type"),
    userAgent: request.headers.get("user-agent")
  });

  const signatureHeader = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");
  const secret = process.env.MP_WEBHOOK_SECRET?.trim();
  if (secret && signatureHeader && requestId) {
    const dataId = getWebhookDataIdForSignature(url, body);
    if (dataId) {
      const ok = verifyMercadoPagoWebhookSignature({
        signatureHeader,
        requestId,
        dataId,
        secret
      });
      if (!ok) {
        console.error("[mercadopago/webhook] assinatura inválida", {
          requestId,
          hasDataId: true
        });
        return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
      }
    }
  }

  const paymentId = getNotificationPaymentId(url, body);

  if (!paymentId) {
    console.error("[mercadopago/webhook] paymentId ausente", {
      method: request.method,
      query: url.search,
      topic: url.searchParams.get("topic") || url.searchParams.get("type"),
      bodyType: typeof body
    });
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as unknown;
    return await handleWebhook(request, body);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro no webhook.";
    console.error("[mercadopago/webhook] erro:", msg, err instanceof Error ? err.stack : "");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    return await handleWebhook(request, null);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro no webhook.";
    console.error("[mercadopago/webhook] erro:", msg, err instanceof Error ? err.stack : "");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
