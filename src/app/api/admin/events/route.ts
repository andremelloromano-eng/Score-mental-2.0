import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { verifySession } from "@/lib/adminAuth";
import { ensureTable } from "@/lib/db";

export async function GET(request: Request) {
  if (!verifySession()) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  await ensureTable();

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;
  const action = url.searchParams.get("action");
  const period = url.searchParams.get("period");

  let dateFilter = "";
  if (period === "today") dateFilter = "AND created_at >= now() - interval '1 day'";
  else if (period === "week") dateFilter = "AND created_at >= now() - interval '7 days'";
  else if (period === "month") dateFilter = "AND created_at >= now() - interval '30 days'";

  // Build query with conditional filters
  if (action) {
    const { rows } = await sql.query(
      `SELECT * FROM admin_events WHERE 1=1 ${dateFilter} AND action = $3 ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset, action]
    );
    const { rows: countRows } = await sql.query(
      `SELECT count(*)::int as total FROM admin_events WHERE 1=1 ${dateFilter} AND action = $3`,
      [action]
    );
    return NextResponse.json({
      events: rows,
      total: countRows[0]?.total ?? 0,
      page,
      limit,
    });
  }

  const { rows } = await sql.query(
    `SELECT * FROM admin_events WHERE 1=1 ${dateFilter} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  const { rows: countRows } = await sql.query(
    `SELECT count(*)::int as total FROM admin_events WHERE 1=1 ${dateFilter}`,
    []
  );

  return NextResponse.json({
    events: rows,
    total: countRows[0]?.total ?? 0,
    page,
    limit,
  });
}
