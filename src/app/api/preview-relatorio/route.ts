import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import perguntas from "@/data/perguntas.json";
import { createPremiumCertificateDocument } from "@/lib/PremiumCertificate";

type Payload = {
  nome?: string;
  respostas?: Record<number, string>;
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

function isoDatePtBr(date = new Date()): string {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function makeReportId(): string {
  return `preview-${Date.now().toString(36)}`;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const nomeParam = url.searchParams.get("nome");
    const qiParam = url.searchParams.get("qi");
    const acertosParam = url.searchParams.get("acertos");

    const perguntasTyped = perguntas as Pergunta[];
    const totalPerguntas = perguntasTyped.length;

    const nome = nomeParam?.trim() ? nomeParam.trim() : "Preview";
    const respostas: Record<number, string> = {};

    const qiOverride = qiParam != null && qiParam !== "" ? Number(qiParam) : null;
    const acertosOverride = acertosParam != null && acertosParam !== "" ? Number(acertosParam) : null;

    const qiFinal = qiOverride != null && Number.isFinite(qiOverride) ? Math.round(qiOverride) : null;
    const acertosEstimado =
      acertosOverride != null && Number.isFinite(acertosOverride)
        ? Math.round(acertosOverride)
        : qiFinal != null
          ? Math.round(((qiFinal - 85) / 35) * Math.max(totalPerguntas, 1))
          : 0;

    const acertos = clamp(acertosEstimado, 0, totalPerguntas);
    const qiCalc = Math.round(85 + (acertos / Math.max(totalPerguntas, 1)) * 35);
    const qiFinalResolved = qiFinal ?? qiCalc;
    const percentil = percentilFromQi(qiFinalResolved);

    const doc = createPremiumCertificateDocument({
      nome,
      qiFinal: qiFinalResolved,
      percentil,
      dataEmissao: isoDatePtBr(new Date()),
      relatorioId: makeReportId(),
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
    const pdfBytes = new Uint8Array(pdfBuffer);

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=relatorio-preview.pdf"
      }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao gerar PDF";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    const perguntasTyped = perguntas as Pergunta[];
    const totalPerguntas = perguntasTyped.length;

    const nome = body.nome?.trim() ? body.nome.trim() : "Preview";
    const respostas = body.respostas ?? {};

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
      relatorioId: makeReportId(),
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
    const pdfBytes = new Uint8Array(pdfBuffer);

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=relatorio-${nome.replace(/\s+/g, "-").toLowerCase()}.pdf`
      }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao gerar PDF";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
