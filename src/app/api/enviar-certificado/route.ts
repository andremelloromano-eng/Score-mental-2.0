import { NextResponse } from "next/server";
import { Resend } from "resend";
import { renderToBuffer } from "@react-pdf/renderer";
import perguntas from "@/data/perguntas.json";
import { createPremiumCertificateDocument } from "@/lib/PremiumCertificate";

type Payload = {
  email?: string;
  nome?: string;
  respostas?: Record<number, string>;
  acertos?: number;
  totalPerguntas?: number;
  qiEstimado?: number;
};

type Pergunta = {
  id: number;
  pergunta: string;
  correctAnswer: "A" | "B" | "C" | "D";
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

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function isRetryableSendError(err: unknown): boolean {
  if (!err) return false;
  if (typeof err === "string") return false;
  if (!(err instanceof Error)) return false;

  const msg = err.message.toLowerCase();
  return (
    msg.includes("fetch failed") ||
    msg.includes("network") ||
    msg.includes("econnreset") ||
    msg.includes("etimedout") ||
    msg.includes("timeout") ||
    msg.includes("enotfound")
  );
}

function shouldRetryResendApiError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { message?: unknown; statusCode?: unknown };
  const msg = String(maybe.message ?? "").toLowerCase();
  const statusCode = typeof maybe.statusCode === "number" ? maybe.statusCode : undefined;

  if (msg.includes("rate limit") || statusCode === 429) return false;
  if (msg.includes("api key") || msg.includes("unauthorized") || msg.includes("invalid") || statusCode === 401 || statusCode === 403)
    return false;

  if (typeof statusCode === "number") return statusCode >= 500;
  return false;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    const email = body.email;
    const nome = body.nome;

    if (!email) {
      return NextResponse.json(
        { error: "E-mail é obrigatório." },
        { status: 400 }
      );
    }

    if (!nome) {
      return NextResponse.json(
        { error: "Nome é obrigatório." },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      console.error("[enviar-certificado] RESEND_API_KEY não configurada. E-mail não será enviado.");
      return NextResponse.json(
        { error: "Falha ao enviar e-mail: RESEND_API_KEY não configurada no servidor." },
        { status: 500 }
      );
    }
    // Diagnóstico: confirma que a chave foi carregada (sem expor o valor)
    const keyPreview = apiKey.startsWith("re_") ? "re_***" : "chave presente";
    console.log("[enviar-certificado] RESEND_API_KEY:", keyPreview, "(", apiKey.length, "caracteres)");

    const acertos = Number.isFinite(body.acertos) ? Number(body.acertos) : 0;
    const totalPerguntas = Number.isFinite(body.totalPerguntas)
      ? Number(body.totalPerguntas)
      : 0;
    const qiEstimado = Number.isFinite(body.qiEstimado)
      ? Number(body.qiEstimado)
      : 0;

    const certificadoId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const dataEmissao = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "long"
    }).format(new Date());

    const resendClient = new Resend(apiKey);
    let pdfBuffer: Buffer;
    try {
      console.log("[enviar-certificado] Gerando PDF...");

      const perguntasTyped = perguntas as Pergunta[];
      const respostas = body.respostas;
      const totalPerguntas = perguntasTyped.length;
      const acertos = respostas
        ? perguntasTyped.reduce((acc, p) => {
            const resp = respostas[p.id];
            if (!resp) return acc;
            const correta = correctAnswerToOptionId(p.correctAnswer);
            return resp === correta ? acc + 1 : acc;
          }, 0)
        : Number.isFinite(body.acertos)
          ? Number(body.acertos)
          : 0;

      const qiEstimado = Math.round(85 + (acertos / Math.max(totalPerguntas, 1)) * 35);

      const percentil = percentilFromQi(qiEstimado);
      const relatorioId = certificadoId;

      const doc = createPremiumCertificateDocument({
        nome,
        qiFinal: qiEstimado,
        percentil,
        dataEmissao,
        relatorioId,
        totalPerguntas,
        acertos,
        respostas: respostas ?? {},
        perguntas: perguntasTyped.map((p) => ({
          id: p.id,
          pergunta: p.pergunta,
          correctAnswer: p.correctAnswer
        }))
      });

      pdfBuffer = await renderToBuffer(doc);
      console.log("[enviar-certificado] PDF gerado, tamanho:", pdfBuffer.length, "bytes");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar PDF";
      console.error("[enviar-certificado] Erro ao gerar PDF:", msg, err instanceof Error ? err.stack : "");
      return NextResponse.json(
        { error: `Falha ao gerar o certificado: ${msg}` },
        { status: 500 }
      );
    }

    const fromAddress = process.env.RESEND_FROM_EMAIL?.trim() || "relatorio@send.scoremental.com.br";
    console.log("[enviar-certificado] Enviando e-mail para:", email);

    const sendPayload = {
      from: fromAddress,
      to: email,
      subject: "Seu Relatório Detalhado + Certificado do Teste de QI Profissional",
      html: `
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #020617; color: #e5e7eb; padding: 32px;">
          <div style="max-width: 640px; margin: 0 auto; background: #020617; border-radius: 24px; border: 1px solid #1f2937; padding: 28px;">
            <p style="font-size: 12px; text-transform: uppercase; letter-spacing: .2em; color: #9ca3af; margin: 0 0 12px;">Teste de QI Profissional</p>
            <h1 style="font-size: 22px; color: #f9fafb; margin: 0 0 12px;">Seu relatório detalhado está pronto</h1>
            <p style="font-size: 14px; color: #d1d5db; margin: 0 0 16px;">
              Obrigado por concluir o Teste de QI Profissional. O seu <strong>certificado em PDF</strong> vai anexado neste e-mail.
            </p>
            <ul style="font-size: 14px; color: #d1d5db; padding-left: 20px; margin: 0 0 18px;">
              <li>Nome no certificado: <strong>${String(nome).replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</strong></li>
              <li>Pontuação simulada: <strong>${acertos}/${totalPerguntas}</strong></li>
              <li>QI estimado (simulado): <strong>${qiEstimado}</strong></li>
            </ul>
            <p style="font-size: 13px; color: #9ca3af; margin: 0 0 8px;">
              Este ambiente é um protótipo, portanto os dados são simulados para demonstração.
            </p>
            <p style="font-size: 12px; color: #6b7280; margin: 0;">
              ID do certificado: ${certificadoId}
            </p>
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

    const MAX_ATTEMPTS = 2;
    let lastErrorMessage = "Erro ao enviar e-mail.";

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const { data, error } = await resendClient.emails.send(sendPayload);

        if (error) {
          const msg = error.message || "Erro ao enviar e-mail.";
          lastErrorMessage = msg;

          console.error("[enviar-certificado] Resend API error:", {
            attempt,
            message: error.message,
            name: (error as unknown as { name?: string }).name,
            statusCode: (error as unknown as { statusCode?: unknown }).statusCode
          });

          if (attempt < MAX_ATTEMPTS && shouldRetryResendApiError(error)) {
            await sleep(350 * attempt);
            continue;
          }

          const hint =
            msg.toLowerCase().includes("api key") ||
            msg.toLowerCase().includes("unauthorized") ||
            msg.toLowerCase().includes("invalid")
              ? " Verifique se a RESEND_API_KEY em .env.local está correta e se não expirou (gere uma nova em resend.com/api-keys)."
              : "";

          return NextResponse.json({ error: msg + hint }, { status: 500 });
        }

        console.log("[enviar-certificado] E-mail enviado com sucesso. Resend id:", data?.id, "para:", email);
        return NextResponse.json({ ok: true, id: data?.id });
      } catch (err) {
        lastErrorMessage = err instanceof Error ? err.message : "Falha inesperada ao enviar e-mail.";
        console.error("[enviar-certificado] Falha ao enviar e-mail (exceção):", {
          attempt,
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined
        });

        if (attempt < MAX_ATTEMPTS && isRetryableSendError(err)) {
          await sleep(350 * attempt);
          continue;
        }

        return NextResponse.json(
          { error: "Falha técnica ao enviar o e-mail. Tente novamente em instantes." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: `Falha técnica ao enviar o e-mail: ${lastErrorMessage}` },
      { status: 500 }
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Erro ao enviar e-mail.");
    console.error("Erro ao enviar e-mail:", err.message, err.stack);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
