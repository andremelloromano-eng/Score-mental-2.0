"use client";

import { useState, useEffect, useCallback } from "react";

type EventRow = {
  id: number;
  created_at: string;
  action: string;
  name: string | null;
  email: string | null;
  qi: number | null;
  percentile: number | null;
  score: string | null;
  payment_status: string | null;
  amount: number | null;
};

type Stats = {
  total_tests: number;
  total_certificates: number;
  total_premium: number;
  total_revenue: number;
};

const ACTION_LABELS: Record<string, string> = {
  test_completed: "Finalizou teste",
  certificate_downloaded: "Baixou certificado",
  premium_purchased: "Comprou Premium",
};

const ACTION_COLORS: Record<string, string> = {
  test_completed: "text-blue-400",
  certificate_downloaded: "text-emerald-400",
  premium_purchased: "text-amber-400",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("");
  const limit = 20;

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (actionFilter) params.set("action", actionFilter);
      if (periodFilter) params.set("period", periodFilter);

      const [statsRes, eventsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch(`/api/admin/events?${params}`),
      ]);

      if (statsRes.status === 401 || eventsRes.status === 401) {
        setAuthed(false);
        return;
      }

      const statsData = await statsRes.json();
      const eventsData = await eventsRes.json();

      setStats(statsData);
      setEvents(eventsData.events ?? []);
      setTotal(eventsData.total ?? 0);
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
    }
  }, [page, actionFilter, periodFilter]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!authed) return;
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [authed, fetchData]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setLoginError(data.error || "Erro ao fazer login");
        return;
      }
      setAuthed(true);
      setPassword("");
    } catch {
      setLoginError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  // Try fetching stats on mount to check if already authed
  useEffect(() => {
    fetch("/api/admin/stats").then((r) => {
      if (r.ok) setAuthed(true);
    });
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm space-y-4 rounded-2xl border border-[#1F2937] bg-[#020617] p-8"
        >
          <h1 className="text-xl font-bold text-white text-center">Admin Dashboard</h1>
          <p className="text-sm text-[#6B7280] text-center">ScoreMental</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha de administrador"
            className="w-full rounded-xl border border-[#1F2937] bg-[#050816] px-4 py-3 text-sm text-white placeholder-[#6B7280] outline-none focus:border-[#4F46E5]"
            autoFocus
          />
          {loginError && <p className="text-sm text-red-400 text-center">{loginError}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-50 px-4 py-3 text-sm font-semibold text-white transition-colors"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050816] text-[#E5E7EB]">
      {/* Header */}
      <header className="border-b border-[#1F2937] px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-lg font-bold text-white">ScoreMental Admin</h1>
          <a
            href="/api/admin/export"
            className="rounded-lg border border-[#1F2937] px-3 py-1.5 text-xs font-medium text-[#E5E7EB] hover:bg-[#1F2937]/50 transition-colors"
          >
            Exportar CSV
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Testes finalizados" value={stats?.total_tests ?? 0} />
          <StatCard label="Certificados baixados" value={stats?.total_certificates ?? 0} />
          <StatCard label="Vendas premium" value={stats?.total_premium ?? 0} />
          <StatCard
            label="Receita total"
            value={`R$ ${(stats?.total_revenue ?? 0).toFixed(2).replace(".", ",")}`}
            highlight
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={periodFilter}
            onChange={(e) => { setPeriodFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-[#1F2937] bg-[#020617] px-3 py-2 text-sm text-white outline-none focus:border-[#4F46E5]"
          >
            <option value="">Todos os períodos</option>
            <option value="today">Hoje</option>
            <option value="week">Última semana</option>
            <option value="month">Último mês</option>
          </select>
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-[#1F2937] bg-[#020617] px-3 py-2 text-sm text-white outline-none focus:border-[#4F46E5]"
          >
            <option value="">Todas as ações</option>
            <option value="test_completed">Finalizou teste</option>
            <option value="certificate_downloaded">Baixou certificado</option>
            <option value="premium_purchased">Comprou Premium</option>
          </select>
          <span className="ml-auto self-center text-xs text-[#6B7280]">
            Atualiza a cada 30s &bull; {total} evento{total !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-[#1F2937]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1F2937] bg-[#020617] text-left text-xs uppercase tracking-wider text-[#6B7280]">
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">QI</th>
                <th className="px-4 py-3">Percentil</th>
                <th className="px-4 py-3">Acertos</th>
                <th className="px-4 py-3">Ação</th>
                <th className="px-4 py-3">Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[#6B7280]">
                    Nenhum evento encontrado
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr key={ev.id} className="border-b border-[#1F2937]/50 hover:bg-[#1F2937]/20">
                    <td className="whitespace-nowrap px-4 py-3 text-xs">{formatDate(ev.created_at)}</td>
                    <td className="px-4 py-3">{ev.name || <span className="text-[#6B7280]">—</span>}</td>
                    <td className="px-4 py-3 text-xs">{ev.email || <span className="text-[#6B7280]">—</span>}</td>
                    <td className="px-4 py-3 font-mono">{ev.qi ?? "—"}</td>
                    <td className="px-4 py-3 font-mono">{ev.percentile != null ? `${ev.percentile}%` : "—"}</td>
                    <td className="px-4 py-3 font-mono">{ev.score || "—"}</td>
                    <td className={`px-4 py-3 text-xs font-medium ${ACTION_COLORS[ev.action] ?? ""}`}>
                      {ACTION_LABELS[ev.action] ?? ev.action}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {ev.payment_status ? (
                        <span className={ev.payment_status === "approved" ? "text-emerald-400" : "text-[#6B7280]"}>
                          {ev.payment_status}
                        </span>
                      ) : (
                        <span className="text-[#6B7280]">—</span>
                      )}
                      {ev.amount ? ` R$${ev.amount.toFixed(2).replace(".", ",")}` : ""}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-[#1F2937] px-3 py-1.5 text-xs text-white disabled:opacity-30 hover:bg-[#1F2937]/50"
            >
              Anterior
            </button>
            <span className="text-xs text-[#6B7280]">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-[#1F2937] px-3 py-1.5 text-xs text-white disabled:opacity-30 hover:bg-[#1F2937]/50"
            >
              Próxima
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-[#1F2937] bg-[#020617] p-4">
      <p className="text-xs text-[#6B7280]">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${highlight ? "text-emerald-400" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}
