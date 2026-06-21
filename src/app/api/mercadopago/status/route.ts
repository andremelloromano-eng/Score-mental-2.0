import { NextResponse } from "next/server";
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
import { trackEvent } from "@/lib/db";

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

function getMpClient() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado.");
  }
  return new MercadoPagoConfig({ accessToken });
}

function getPendingStore(): Map<string, PendingCheckoutPayload> {
  const g = globalThis as unknown as { __pendingMercadoPagoCheckouts?: Map<string, PendingCheckoutPayload> };
  if (!g.__pendingMercadoPagoCheckouts) {
    g.__pendingMercadoPagoCheckouts = new Map();
  }
  return g.__pendingMercadoPagoCheckouts;
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

/**
 * Lógica unificada para pagamento aprovado: busca dados, gera PDF, envia e-mail.
 * Usada tanto pela rota ?id= quanto pela rota ?ref=.
 */
async function handleApprovedPayment(
  paymentId: string,
  metadata: PaymentMetadata | undefined,
  extRef?: string,
  transactionAmount?: number | null
): Promise<NextResponse> {
  const alreadyDone = await isPaymentProcessed(paymentId);
  if (alreadyDone) {
    return NextResponse.json({ id: paymentId, status: "approved", externalReference: extRef, delivered: true, fastTrack: true });
  }

  // Resolver dados do comprador: pending store → metadata
  const store = getPendingStore();
  let pending: PendingCheckoutPayload | undefined;

  if (extRef) {
    pending = store.get(extRef);
  }

  if (!pending) {
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
      console.log("[status/handleApproved] usando metadata", { paymentId, extRef });
    }
  }

  if (!pending) {
    console.error("[status/handleApproved] payload ausente", { paymentId, extRef });
    return NextResponse.json({ id: paymentId, status: "approved", externalReference: extRef, delivered: false, error: "Payload ausente." });
  }

  // Lock de envio (evita duplicatas em chamadas concorrentes)
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
    return NextResponse.json({ id: paymentId, status: "approved", externalReference: extRef, delivered: false, sending: true });
  }

  try {
    const resendKey = process.env.RESEND_API_KEY?.trim();
    if (!resendKey) {
      console.error("[status/handleApproved] RESEND_API_KEY não configurada");
      return NextResponse.json({ id: paymentId, status: "approved", externalReference: extRef, delivered: false, error: "Resend não configurado." }, { status: 500 });
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
    const fromAddress = process.env.RESEND_FROM_EMAIL?.trim() || "relatorio@scoremental.com.br";

    console.log(`[status/handleApproved] Enviando relatório para ${pending.email} (payment ${paymentId})`);

    const { data, error } = await resendClient.emails.send({
      from: fromAddress,
      to: pending.email,
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
      const statusCode = (error as unknown as { statusCode?: unknown }).statusCode;
      const statusCodeNumber = typeof statusCode === "number" ? statusCode : null;
      const msg = (error.message ?? "").toLowerCase();
      console.error("[status/handleApproved] Resend error:", { message: error.message, statusCode });

      if (statusCodeNumber === 409 || msg.includes("concurrent_idempotent_requests")) {
        return NextResponse.json({ id: paymentId, status: "approved", externalReference: extRef, delivered: false, sending: true });
      }
      if (statusCodeNumber === 429 || msg.includes("rate_limit_exceeded")) {
        return NextResponse.json({ id: paymentId, status: "approved", externalReference: extRef, delivered: false, retryAfterSeconds: 20 });
      }
      return NextResponse.json({ id: paymentId, status: "approved", externalReference: extRef, delivered: false, error: error.message ?? "Erro ao enviar e-mail." }, { status: 500 });
    }

    // Sucesso — limpar pending store e marcar idempotência
    if (extRef) store.delete(extRef);
    try { await acquirePaymentDeliveryOnce(paymentId); } catch {}

    trackEvent({
      action: "premium_purchased",
      name: pending.nome,
      email: pending.email,
      qi: qiEstimado,
      percentile: percentil,
      score: `${acertos}/${totalPerguntas}`,
      payment_status: "approved",
      amount: typeof transactionAmount === "number" ? transactionAmount : null,
    }).catch((err) => console.error("[status/handleApproved] Erro ao registrar evento admin:", err));

    console.log(`[status/handleApproved] ✅ E-mail enviado. Resend id: ${data?.id}, payment: ${paymentId}`);
    return NextResponse.json({ id: paymentId, status: "approved", externalReference: extRef, delivered: true });
  } finally {
    await releasePaymentEmailSendLock(paymentId);
  }
}

/**
 * Busca um pagamento aprovado por external_reference usando Payment.search.
 * Retorna o primeiro pagamento approved encontrado, ou null.
 */
async function findApprovedPaymentByRef(ref: string): Promise<{
  id: string;
  status: string;
  metadata: PaymentMetadata | undefined;
  externalReference: string;
  transactionAmount: number | null;
} | null> {
  const mpClient = getMpClient();
  const payment = new Payment(mpClient);

  try {
    const searchResult = await payment.search({
      options: {
        criteria: "desc",
        sort: "date_created",
        external_reference: ref,
      } as never,
    });

    const results = (searchResult as unknown as { results?: unknown[] }).results;
    if (!Array.isArray(results) || results.length === 0) return null;

    // Procura o primeiro pagamento approved
    for (const r of results) {
      const p = r as Record<string, unknown>;
      if (p.status === "approved") {
        return {
          id: String(p.id),
          status: "approved",
          metadata: p.metadata as PaymentMetadata | undefined,
          externalReference: ref,
          transactionAmount: typeof p.transaction_amount === "number" ? p.transaction_amount : null,
        };
      }
    }

    // Se nenhum approved, retorna o mais recente com seu status
    const latest = results[0] as Record<string, unknown>;
    return {
      id: String(latest.id),
      status: String(latest.status ?? "pending"),
      metadata: latest.metadata as PaymentMetadata | undefined,
      externalReference: ref,
      transactionAmount: typeof latest.transaction_amount === "number" ? latest.transaction_amount : null,
    };
  } catch (err) {
    console.error("[mercadopago/status] erro no search por ref:", err);
    return null;
  }
}

export async function GET(request: Request) {
  console.log("[mercadopago/status] Iniciando consulta de status");
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    const refParam = searchParams.get("ref");

    if (!idParam && !refParam) {
      return NextResponse.json({ error: "id ou ref é obrigatório." }, { status: 400 });
    }

    // ── ROTA 1: Busca por external_reference (cobre Pix e cartão dentro do Checkout Pro) ──
    if (refParam) {
      console.log("[mercadopago/status] Buscando por external_reference:", refParam);

      const found = await findApprovedPaymentByRef(refParam);
      if (!found) {
        return NextResponse.json({ ref: refParam, status: "pending", delivered: false });
      }

      // Se não approved, retorna o status atual
      if (found.status !== "approved") {
        return NextResponse.json({ id: found.id, ref: refParam, status: found.status, delivered: false });
      }

      // Approved — verificar se já processado
      const alreadyDone = await isPaymentProcessed(found.id);
      if (alreadyDone) {
        return NextResponse.json({ id: found.id, ref: refParam, status: "approved", delivered: true, fastTrack: true });
      }

      // Delegar para a lógica de envio com o paymentId real encontrado
      return await handleApprovedPayment(found.id, found.metadata, refParam, found.transactionAmount);
    }

    // ── ROTA 2: Busca por paymentId direto (fluxo Pix direto) ──
    const id = idParam!;

    const alreadyDelivered = await isPaymentProcessed(id);
    if (alreadyDelivered) {
      return NextResponse.json({ id, status: "approved", delivered: true, fastTrack: true });
    }

    console.log("[mercadopago/status] Consultando Mercado Pago por id:", id);
    const mpClient = getMpClient();
    const payment = new Payment(mpClient);
    let mpPayment: unknown;
    try {
      mpPayment = await payment.get({ id });
    } catch (err) {
      console.error("[mercadopago/status] erro ao consultar Mercado Pago", err);
      return NextResponse.json({ id, status: "pending", delivered: false, error: "Falha ao consultar Mercado Pago." });
    }

    const status = (mpPayment as unknown as { status?: unknown }).status;
    const externalReference = (mpPayment as unknown as { external_reference?: unknown }).external_reference;
    const metadata = (mpPayment as unknown as { metadata?: PaymentMetadata }).metadata;

    console.log("[mercadopago/status] consultado", { id, status, externalReference });

    if (status === "approved") {
      const transactionAmount = (mpPayment as unknown as { transaction_amount?: number }).transaction_amount;
      return await handleApprovedPayment(
        id,
        metadata,
        typeof externalReference === "string" ? externalReference : undefined,
        typeof transactionAmount === "number" ? transactionAmount : null
      );
    }

    return NextResponse.json({ id, status, externalReference });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao consultar pagamento.";
    console.error("[mercadopago/status] erro:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
