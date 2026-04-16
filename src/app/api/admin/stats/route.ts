import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { verifySession } from "@/lib/adminAuth";
import { ensureTable } from "@/lib/db";

export async function GET() {
  if (!verifySession()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await ensureTable();

  const { rows } = await sql`
    SELECT
      count(*) FILTER (WHERE action = 'test_completed')::int        AS total_tests,
      count(*) FILTER (WHERE action = 'certificate_downloaded')::int AS total_certificates,
      count(*) FILTER (WHERE action = 'premium_purchased')::int      AS total_premium,
      coalesce(sum(amount) FILTER (WHERE action = 'premium_purchased'), 0)::real AS total_revenue
    FROM admin_events
  `;

  return NextResponse.json(rows[0] ?? {
    total_tests: 0,
    total_certificates: 0,
    total_premium: 0,
    total_revenue: 0,
  });
}
