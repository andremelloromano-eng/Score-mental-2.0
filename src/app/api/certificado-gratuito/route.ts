import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createFreeCertificateDocument } from "@/lib/PremiumCertificate";
import { trackEvent } from "@/lib/db";

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

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const nome = url.searchParams.get("nome")?.trim() || "Candidato";
    const qiParam = Number(url.searchParams.get("qi"));
    const acertosParam = Number(url.searchParams.get("acertos"));
    const totalPerguntas = 23;

    const qi = Number.isFinite(qiParam) ? clamp(qiParam, 70, 145) : 100;
    const acertos = Number.isFinite(acertosParam) ? clamp(acertosParam, 0, totalPerguntas) : 0;
    const percentil = percentilFromQi(qi);

    const certificadoId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const dataEmissao = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "long",
    }).format(new Date());

    const doc = createFreeCertificateDocument({
      nome,
      qiFinal: qi,
      percentil,
      dataEmissao,
      relatorioId: certificadoId,
      totalPerguntas,
    });

    const pdfBuffer = await renderToBuffer(doc);
    const pdfBytes = new Uint8Array(pdfBuffer);

    // Registra evento no admin dashboard
    trackEvent({
      action: "certificate_downloaded",
      name: nome !== "Candidato" ? nome : null,
      qi,
      percentile: percentil,
      score: `${acertos}/${totalPerguntas}`,
    }).catch(() => {});

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=certificado-qi-${nome.replace(/\s+/g, "-").toLowerCase()}.pdf`,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao gerar certificado";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
