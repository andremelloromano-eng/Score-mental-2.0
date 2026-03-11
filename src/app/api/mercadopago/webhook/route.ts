import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { Resend } from "resend";
import { renderToBuffer } from "@react-pdf/renderer";
import perguntas from "@/data/perguntas.json";
import { createPremiumCertificateDocument } from "@/lib/PremiumCertificate";
import { acquirePaymentDeliveryOnce } from "@/lib/mercadoPagoIdempotency";

export const runtime = "nodejs";

type Pergunta = {
  id: number;
  pergunta: string;
  correctAnswer: "A" | "B" | "C" | "D";
};

type PendingCheckoutPayload = {
  email: string;
  nome: string;
  respostas?: Record<number, string>;
  createdAt: number;
};

type PaymentMetadata = {
  report_email?: unknown;
  report_nome?: unknown;
  report_respostas?: unknown;
  report_created_at?: unknown;
};

function getPendingStore(): Map<string, PendingCheckoutPayload> {
  const g = globalThis as unknown as { __pendingMercadoPagoCheckouts?: Map<string, PendingCheckoutPayload> };
  if (!g.__pendingMercadoPagoCheckouts) {
    g.__pendingMercadoPagoCheckouts = new Map();
  }
  return g.__pendingMercadoPagoCheckouts;
}

function getMpClient() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado.");
  }
  return new MercadoPagoConfig({ accessToken });
}

function correctAnswerToOptionId(answer: Pergunta["correctAnswer"]): string {
  return answer.toLowerCase();
}

function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const absX = Math.abs(x);
  const t = 1 / (1 + p * absX);
  const y =
    1 -
    (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) *
      Math.exp(-absX * absX);
  return sign * y;
}

function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

function percentilFromQi(qi: number): number {
  const z = (qi - 100) / 15;
  return Math.round(normalCdf(z) * 100);
}

function isoDatePtBr(date = new Date()): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

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

  if (body && typeof body === "object") {
    const keys = Object.keys(body as Record<string, unknown>).slice(0, 30);
    console.log("[mercadopago/webhook] body keys", { keys });
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

  const mpClient = getMpClient();
  const payment = new Payment(mpClient);
  const mpPayment = await payment.get({ id: paymentId });

  const status = (mpPayment as unknown as { status?: unknown }).status;
  const externalReference = (mpPayment as unknown as { external_reference?: unknown }).external_reference;

  console.log("[mercadopago/webhook] pagamento consultado", {
    paymentId,
    status,
    externalReference
  });

  if (status !== "approved") {
    console.log("[mercadopago/webhook] pagamento ainda não aprovado", { paymentId, status });
    return NextResponse.json({ received: true });
  }

  // WEBHOOK DE ALTA VELOCIDADE: Registrar aprovação imediatamente
  console.log("[mercadopago/webhook] ✅ Pagamento APROVADO - registrando em alta velocidade", { paymentId, externalReference });
  
  const first = await acquirePaymentDeliveryOnce(paymentId);
  if (!first) {
    console.log("[mercadopago/webhook] idempotência: pagamento já processado", { paymentId });
    return NextResponse.json({ received: true });
  }

  // Aprovação registrada - agora prossegue com envio de e-mail (segundo plano)
  console.log("[mercadopago/webhook] 🚀 Iniciando envio de e-mail em segundo plano", { paymentId });

  if (typeof externalReference !== "string" || !externalReference) {
    console.error("[mercadopago/webhook] external_reference ausente", { paymentId });
    return NextResponse.json({ received: true });
  }

  const store = getPendingStore();
  let pending = store.get(externalReference);
  if (!pending) {
    const metadata = (mpPayment as unknown as { metadata?: PaymentMetadata }).metadata;
    const mEmail = metadata?.report_email;
    const mNome = metadata?.report_nome;
    const mRespostas = metadata?.report_respostas;
    const mCreatedAt = metadata?.report_created_at;
    if (typeof mEmail === "string" && typeof mNome === "string") {
      pending = {
        email: mEmail,
        nome: mNome,
        respostas: mRespostas && typeof mRespostas === "object" ? (mRespostas as Record<number, string>) : {},
        createdAt: typeof mCreatedAt === "number" ? mCreatedAt : Date.now()
      };
      console.log("[mercadopago/webhook] usando metadata como fallback", { paymentId, externalReference });
    }
  }

  if (!pending) {
    console.error("[mercadopago/webhook] payload não encontrado/expirado", { externalReference, paymentId });
    return NextResponse.json({ received: true });
  }

  store.delete(externalReference);

  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (!resendKey) {
    console.error("[mercadopago/webhook] RESEND_API_KEY não configurada.");
    return NextResponse.json({ error: "Resend não configurado." }, { status: 500 });
  }

  const resendClient = new Resend(resendKey);

  const perguntasTyped = perguntas as Pergunta[];
  const respostas = pending.respostas ?? {};
  const totalPerguntas = perguntasTyped.length;
  const acertos = perguntasTyped.reduce((acc, p) => {
    const resp = respostas[p.id];
    if (!resp) return acc;
    const correta = correctAnswerToOptionId(p.correctAnswer);
    return resp === correta ? acc + 1 : acc;
  }, 0);

  const qiEstimado = Math.round(85 + (acertos / Math.max(totalPerguntas, 1)) * 35);
  const percentil = percentilFromQi(qiEstimado);

  const doc = createPremiumCertificateDocument({
    nome: pending.nome,
    qiFinal: qiEstimado,
    percentil,
    dataEmissao: isoDatePtBr(new Date()),
    relatorioId: `mp-${paymentId}`,
    totalPerguntas,
    acertos,
    respostas,
    perguntas: perguntasTyped.map((p) => ({
      id: p.id,
      pergunta: p.pergunta,
      correctAnswer: p.correctAnswer
    }))
  });

  const pdfBuffer = await renderToBuffer(doc);

  const fromAddress = process.env.RESEND_FROM_EMAIL || "Teste de QI <onboarding@resend.dev>";
  const { data, error } = await resendClient.emails.send({
    from: fromAddress,
    to: pending.email,
    subject: "Seu Relatório Detalhado + Certificado do Teste de QI Profissional",
    html: `
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #020617; color: #e5e7eb; padding: 32px;">
          <div style="max-width: 640px; margin: 0 auto; background: #020617; border-radius: 24px; border: 1px solid #1f2937; padding: 28px;">
            <p style="font-size: 12px; text-transform: uppercase; letter-spacing: .2em; color: #9ca3af; margin: 0 0 12px;">Teste de QI Profissional</p>
            <h1 style="font-size: 22px; color: #f9fafb; margin: 0 0 12px;">Pagamento confirmado! Seu relatório está pronto.</h1>
            <p style="font-size: 14px; color: #d1d5db; margin: 0 0 16px;">O seu <strong>certificado em PDF</strong> vai anexado neste e-mail.</p>
            <p style="font-size: 12px; color: #6b7280; margin: 0;">ID do pagamento: ${paymentId}</p>
          </div>
        </div>
      `,
    attachments: [
      {
        filename: "certificado-teste-qi-profissional.pdf",
        content: pdfBuffer.toString("base64"),
        contentType: "application/pdf"
      }
    ]
  });

  if (error) {
    console.error("[mercadopago/webhook] Resend API error:", {
      message: error.message,
      name: (error as unknown as { name?: string }).name,
      statusCode: (error as unknown as { statusCode?: unknown }).statusCode
    });
    return NextResponse.json({ error: error.message ?? "Erro ao enviar e-mail." }, { status: 500 });
  }

  console.log("[mercadopago/webhook] E-mail enviado após pagamento. Resend id:", data?.id, "payment:", paymentId);
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
