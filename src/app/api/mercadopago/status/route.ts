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

export async function GET(request: Request) {
  console.log("[mercadopago/status] Iniciando consulta de status");
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      console.log("[mercadopago/status] Erro: id não fornecido");
      return NextResponse.json({ error: "id é obrigatório." }, { status: 400 });
    }

    const alreadyDelivered = await isPaymentProcessed(id);
    if (alreadyDelivered) {
      return NextResponse.json({ id, status: "approved", delivered: true, fastTrack: true });
    }

    // Se não foi processado localmente, consulta Mercado Pago
    console.log("[mercadopago/status] Consultando Mercado Pago", { id });
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

    if (status === "approved" && typeof externalReference === "string" && externalReference) {
      const deliveredNow = await isPaymentProcessed(id);
      if (deliveredNow) {
        return NextResponse.json({ id, status: "approved", externalReference, delivered: true, fastTrack: true });
      }

      const store = getPendingStore();
      let pending = store.get(externalReference);

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
          console.log("[mercadopago/status] usando metadata como fallback", { externalReference, paymentId: id });
        }
      }

      if (!pending) {
        console.error("[mercadopago/status] payload não encontrado/expirado", { externalReference, paymentId: id });
        return NextResponse.json({ id, status, externalReference, delivered: false, error: "Payload ausente." });
      }

      console.log("[mercadopago/status] approved com payload pendente; tentando enviar e-mail", {
        externalReference,
        paymentId: id
      });

      const STALE_LOCK_MS = 5 * 60 * 1000;
      let lockAcquired = await acquirePaymentEmailSendLock(id);
      if (!lockAcquired) {
        const age = await getPaymentEmailSendLockAgeMs(id);
        if (typeof age === "number" && age > STALE_LOCK_MS) {
          await releasePaymentEmailSendLock(id);
          lockAcquired = await acquirePaymentEmailSendLock(id);
        }
      }

      if (!lockAcquired) {
        return NextResponse.json({ id, status, externalReference, delivered: false, sending: true });
      }

      const resendKey = process.env.RESEND_API_KEY?.trim();
      if (!resendKey) {
        console.error("[mercadopago/status] RESEND_API_KEY não configurada.");
        await releasePaymentEmailSendLock(id);
        return NextResponse.json({ id, status, externalReference, delivered: false, error: "Resend não configurado." }, { status: 500 });
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
        relatorioId: `mp-${id}`,
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

      const payload = {
        from: fromAddress,
        to: pending.email,
        subject: "Seu Relatório Detalhado + Certificado do Teste de QI Profissional",
        html: `
          <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #020617; color: #e5e7eb; padding: 32px;">
            <div style="max-width: 640px; margin: 0 auto; background: #020617; border-radius: 24px; border: 1px solid #1f2937; padding: 28px;">
              <p style="font-size: 12px; text-transform: uppercase; letter-spacing: .2em; color: #9ca3af; margin: 0 0 12px;">Teste de QI Profissional</p>
              <h1 style="font-size: 22px; color: #f9fafb; margin: 0 0 12px;">Pagamento confirmado! Seu relatório está pronto.</h1>
              <p style="font-size: 14px; color: #d1d5db; margin: 0 0 16px;">O seu <strong>certificado em PDF</strong> vai anexado neste e-mail.</p>
              <p style="font-size: 12px; color: #6b7280; margin: 0;">ID do pagamento: ${id}</p>
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
      };

      const { data, error } = await resendClient.emails.send(payload, {
        idempotencyKey: `mp-approved/${id}`
      });

      if (error) {
        const statusCode = (error as unknown as { statusCode?: unknown }).statusCode;
        const statusCodeNumber = typeof statusCode === "number" ? statusCode : null;
        const msg = (error.message ?? "").toLowerCase();

        console.error("[mercadopago/status] Resend API error:", {
          message: error.message,
          name: (error as unknown as { name?: string }).name,
          statusCode
        });
        await releasePaymentEmailSendLock(id);

        if (statusCodeNumber === 409 || msg.includes("concurrent_idempotent_requests")) {
          return NextResponse.json({ id, status, externalReference, delivered: false, sending: true });
        }

        if (statusCodeNumber === 429 || msg.includes("rate_limit_exceeded")) {
          return NextResponse.json({ id, status, externalReference, delivered: false, retryAfterSeconds: 20 });
        }

        return NextResponse.json({ id, status, externalReference, delivered: false, error: error.message ?? "Erro ao enviar e-mail." }, { status: 500 });
      }

      store.delete(externalReference);

      try {
        await acquirePaymentDeliveryOnce(id);
      } catch (err) {
        console.error("[mercadopago/status] erro ao marcar idempotência:", err);
      }

      await releasePaymentEmailSendLock(id);

      console.log("[mercadopago/status] E-mail enviado. Resend id:", data?.id, "payment:", id);
      return NextResponse.json({ id, status, externalReference, delivered: true });
    }

    return NextResponse.json({ id, status, externalReference });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao consultar pagamento.";
    console.error("[mercadopago/status] erro:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
