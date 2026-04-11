import { NextResponse } from "next/server";
import crypto from "crypto";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { Resend } from "resend";
import { renderToBuffer } from "@react-pdf/renderer";
import perguntas from "@/data/perguntas.json";
import { createPremiumCertificateDocument } from "@/lib/PremiumCertificate";
import {
  acquirePaymentDeliveryOnce,
  acquirePaymentEmailSendLock,
  getPaymentEmailSendLockAgeMs,
  isPaymentProcessed,
  releasePaymentEmailSendLock
} from "@/lib/mercadoPagoIdempotency";

export const runtime = "nodejs";

type Pergunta = {
  id: number;
  pergunta: string;
  correctAnswer: "A" | "B" | "C" | "D";
};

type PaymentMetadata = {
  report_email?: unknown;
  report_nome?: unknown;
  report_respostas?: unknown;
  report_created_at?: unknown;
};

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

function getMpClient() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado.");
  }
  return new MercadoPagoConfig({ accessToken });
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

/**
 * Busca o pagamento no Mercado Pago e, se aprovado, envia o relatório premium por e-mail.
 * Usa idempotência baseada em arquivo para não enviar duplicatas.
 */
async function processApprovedPayment(paymentId: string): Promise<{ sent: boolean; error?: string }> {
  // Já foi processado?
  if (await isPaymentProcessed(paymentId)) {
    console.log(`[webhook] Pagamento ${paymentId} já processado anteriormente`);
    return { sent: false };
  }

  // Buscar pagamento no Mercado Pago
  const mpClient = getMpClient();
  const paymentApi = new Payment(mpClient);
  let mpPayment: unknown;
  try {
    mpPayment = await paymentApi.get({ id: paymentId });
  } catch (err) {
    console.error("[webhook] Erro ao buscar pagamento:", err);
    return { sent: false, error: "Falha ao consultar Mercado Pago." };
  }

  const status = (mpPayment as unknown as { status?: unknown }).status;
  if (status !== "approved") {
    console.log(`[webhook] Pagamento ${paymentId} status=${status}, ignorando`);
    return { sent: false };
  }

  const metadata = (mpPayment as unknown as { metadata?: PaymentMetadata }).metadata;
  const email = metadata?.report_email;
  const nome = metadata?.report_nome;
  const respostasRaw = metadata?.report_respostas;

  if (typeof email !== "string" || typeof nome !== "string") {
    console.error("[webhook] metadata incompleta — email ou nome ausente", { paymentId, metadata });
    return { sent: false, error: "Metadata do pagamento incompleta." };
  }

  // Lock de envio
  const STALE_LOCK_MS = 5 * 60 * 1000;
  let lockAcquired = await acquirePaymentEmailSendLock(paymentId);
  if (!lockAcquired) {
    const age = await getPaymentEmailSendLockAgeMs(paymentId);
    if (typeof age === "number" && age > STALE_LOCK_MS) {
      await releasePaymentEmailSendLock(paymentId);
      lockAcquired = await acquirePaymentEmailSendLock(paymentId);
    }
  }
  if (!lockAcquired) {
    console.log(`[webhook] Lock de envio ativo para ${paymentId}, outro processo está enviando`);
    return { sent: false };
  }

  try {
    const resendKey = process.env.RESEND_API_KEY?.trim();
    if (!resendKey) {
      console.error("[webhook] RESEND_API_KEY não configurada");
      return { sent: false, error: "Resend não configurado." };
    }

    const resendClient = new Resend(resendKey);
    const perguntasTyped = perguntas as Pergunta[];
    const respostas = (respostasRaw && typeof respostasRaw === "object" ? respostasRaw : {}) as Record<number, string>;
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
      nome,
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
    const fromAddress = process.env.RESEND_FROM_EMAIL?.trim() || "relatorio@scoremental.com.br";

    console.log(`[webhook] Enviando relatório premium para ${email} (pagamento ${paymentId})`);

    const { data, error } = await resendClient.emails.send({
      from: fromAddress,
      to: email,
      subject: "Seu Relatório Premium do Teste de QI Profissional — 12 páginas",
      html: `
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #020617; color: #e5e7eb; padding: 32px;">
          <div style="max-width: 640px; margin: 0 auto; background: #020617; border-radius: 24px; border: 1px solid #1f2937; padding: 28px;">
            <p style="font-size: 12px; text-transform: uppercase; letter-spacing: .2em; color: #9ca3af; margin: 0 0 12px;">Teste de QI Profissional</p>
            <h1 style="font-size: 22px; color: #f9fafb; margin: 0 0 12px;">Pagamento confirmado! Seu Relatório Premium está pronto.</h1>
            <p style="font-size: 14px; color: #d1d5db; margin: 0 0 16px;">O seu <strong>Relatório Premium de 12 páginas</strong> com análise detalhada de 5 áreas cognitivas, comparação populacional, guia de carreira e certificado vai anexado neste e-mail.</p>
            <p style="font-size: 12px; color: #6b7280; margin: 0;">ID do pagamento: ${paymentId}</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: "relatorio-premium-teste-qi-profissional.pdf",
          content: pdfBuffer.toString("base64"),
          contentType: "application/pdf"
        }
      ]
    }, {
      idempotencyKey: `mp-approved/${paymentId}`
    });

    if (error) {
      console.error("[webhook] Erro Resend:", error);
      return { sent: false, error: error.message ?? "Erro ao enviar e-mail." };
    }

    // Marca como processado (idempotência)
    try {
      await acquirePaymentDeliveryOnce(paymentId);
    } catch (err) {
      console.error("[webhook] Erro ao marcar idempotência:", err);
    }

    console.log(`[webhook] ✅ Relatório enviado com sucesso. Resend id: ${data?.id}, pagamento: ${paymentId}`);
    return { sent: true };
  } finally {
    await releasePaymentEmailSendLock(paymentId);
  }
}

async function handleWebhook(request: Request, body: unknown) {
  const url = new URL(request.url);
  console.log("[webhook] notificação recebida", {
    method: request.method,
    path: url.pathname,
    query: url.search,
    topic: url.searchParams.get("topic") || url.searchParams.get("type"),
    contentType: request.headers.get("content-type"),
  });

  // Verificar assinatura (se configurada)
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
        console.error("[webhook] assinatura inválida", { requestId });
        return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
      }
    }
  }

  const paymentId = getNotificationPaymentId(url, body);

  if (!paymentId) {
    console.log("[webhook] paymentId ausente, ignorando");
    return NextResponse.json({ received: true });
  }

  // Verificar tipo de notificação — só processar pagamentos
  const topic = url.searchParams.get("topic") || url.searchParams.get("type");
  const bodyType = body && typeof body === "object" ? (body as Record<string, unknown>).type : null;
  const notificationType = topic || bodyType;

  // Aceitar: "payment", "merchant_order", null (processar por segurança)
  if (notificationType && notificationType !== "payment" && notificationType !== "merchant_order") {
    console.log(`[webhook] tipo ${notificationType} ignorado`);
    return NextResponse.json({ received: true });
  }

  // Processar pagamento aprovado e enviar e-mail
  console.log(`[webhook] Processando pagamento ${paymentId}`);
  const result = await processApprovedPayment(paymentId);

  if (result.error) {
    console.error(`[webhook] Erro ao processar pagamento ${paymentId}:`, result.error);
  }

  // Sempre retorna 200 para o Mercado Pago não reenviar
  return NextResponse.json({ received: true, processed: result.sent });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as unknown;
    return await handleWebhook(request, body);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro no webhook.";
    console.error("[webhook] erro:", msg, err instanceof Error ? err.stack : "");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    return await handleWebhook(request, null);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro no webhook.";
    console.error("[webhook] erro:", msg, err instanceof Error ? err.stack : "");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
