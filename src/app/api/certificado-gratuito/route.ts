import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createFreeCertificateDocument } from "@/lib/PremiumCertificate";
import { percentilFromQi } from "@/lib/percentil";

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
