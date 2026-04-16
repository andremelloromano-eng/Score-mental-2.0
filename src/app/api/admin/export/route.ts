import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { verifySession } from "@/lib/adminAuth";
import { ensureTable } from "@/lib/db";

const ACTION_LABELS: Record<string, string> = {
  test_completed: "Finalizou teste",
  certificate_downloaded: "Baixou certificado",
  premium_purchased: "Comprou Relatório Premium",
};

export async function GET() {
  if (!verifySession()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await ensureTable();

  const { rows } = await sql`
    SELECT * FROM admin_events ORDER BY created_at DESC
  `;

  const header = "Data,Nome,Email,QI,Percentil,Acertos,Ação,Status Pagamento,Valor";
  const lines = rows.map((r) => {
    const date = new Date(r.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return [
      date,
      escape(r.name),
      escape(r.email),
      r.qi ?? "",
      r.percentile ?? "",
      r.score ?? "",
      ACTION_LABELS[r.action] ?? r.action,
      r.payment_status ?? "",
      r.amount ?? "",
    ].join(",");
  });

  const csv = "\uFEFF" + [header, ...lines].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=scoremental-eventos-${new Date().toISOString().slice(0, 10)}.csv`,
    },
  });
}
