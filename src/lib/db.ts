import { sql } from "@vercel/postgres";

let initialized = false;

export async function ensureTable() {
  if (initialized) return;
  await sql`
    CREATE TABLE IF NOT EXISTS admin_events (
      id         SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      action     TEXT NOT NULL,
      name       TEXT,
      email      TEXT,
      qi         INTEGER,
      percentile INTEGER,
      score      TEXT,
      payment_status TEXT,
      amount     REAL
    )
  `;
  initialized = true;
}

export type EventAction =
  | "test_completed"
  | "certificate_downloaded"
  | "premium_purchased";

export async function trackEvent(params: {
  action: EventAction;
  name?: string | null;
  email?: string | null;
  qi?: number | null;
  percentile?: number | null;
  score?: string | null;
  payment_status?: string | null;
  amount?: number | null;
}) {
  await ensureTable();
  await sql`
    INSERT INTO admin_events (action, name, email, qi, percentile, score, payment_status, amount)
    VALUES (
      ${params.action},
      ${params.name ?? null},
      ${params.email ?? null},
      ${params.qi ?? null},
      ${params.percentile ?? null},
      ${params.score ?? null},
      ${params.payment_status ?? null},
      ${params.amount ?? null}
    )
  `;
}
