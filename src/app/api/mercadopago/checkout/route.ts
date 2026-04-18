import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";

type Payload = {
  email?: string;
  nome?: string;
  respostas?: Record<number, string>;
  acertos?: number;
  totalPerguntas?: number;
  qiEstimado?: number;
  metodo?: "pix" | "cartao";
  resultadoTs?: number | null;
};

// Oferta de lançamento: R$4,90 dentro da janela de 24h desde a conclusão do teste,
// R$9,90 caso contrário. O timestamp é validado no servidor para evitar tampering.
const PRICE_PROMO = 4.9;
const PRICE_REGULAR = 9.9;
const OFFER_WINDOW_SECONDS = 24 * 60 * 60;

function resolveTransactionAmount(resultadoTs: unknown): number {
  if (typeof resultadoTs !== "number" || !Number.isFinite(resultadoTs)) {
    return PRICE_REGULAR;
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  // Timestamp no futuro ou absurdamente antigo => inválido, cobra preço regular.
  if (resultadoTs > nowSeconds || resultadoTs <= 0) return PRICE_REGULAR;
  const elapsed = nowSeconds - resultadoTs;
  return elapsed < OFFER_WINDOW_SECONDS ? PRICE_PROMO : PRICE_REGULAR;
}

type PendingCheckoutPayload = Required<Pick<Payload, "email" | "nome">> &
  Pick<Payload, "respostas" | "acertos" | "totalPerguntas" | "qiEstimado"> & {
    createdAt: number;
  };

export const runtime = "nodejs";

function getPublicBaseUrl(): string {
  const baseUrlRaw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (!baseUrlRaw) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL/NEXT_PUBLIC_BASE_URL não configurado. Use a URL https pública do seu domínio."
    );
  }
  const baseUrl = baseUrlRaw.replace(/\.$/, "").replace(/\/$/, "");
  if (!baseUrl.startsWith("https://")) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL/NEXT_PUBLIC_BASE_URL precisa começar com https:// (Mercado Pago exige notification_url pública HTTPS)."
    );
  }
  return baseUrl;
}

function getPendingStore(): Map<string, PendingCheckoutPayload> {
  const g = globalThis as unknown as { __pendingMercadoPagoCheckouts?: Map<string, PendingCheckoutPayload> };
  if (!g.__pendingMercadoPagoCheckouts) {
    g.__pendingMercadoPagoCheckouts = new Map();
  }
  return g.__pendingMercadoPagoCheckouts;
}

function cleanupPendingStore(store: Map<string, PendingCheckoutPayload>) {
  const now = Date.now();
  const ttlMs = 2 * 60 * 60 * 1000;
  for (const [key, value] of store.entries()) {
    if (now - value.createdAt > ttlMs) {
      store.delete(key);
    }
  }
}

function getMpClient() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado.");
  }
  return new MercadoPagoConfig({ accessToken });
}

function getMercadoPagoPayerEmail(customerEmail: string): string {
  const useTestPayer = String(process.env.MERCADO_PAGO_USE_TEST_PAYER ?? "")
    .trim()
    .toLowerCase();
  const enabled = useTestPayer === "1" || useTestPayer === "true" || useTestPayer === "yes";

  if (enabled) {
    const payerEmail = process.env.MERCADO_PAGO_PAYER_EMAIL?.trim();
    if (payerEmail) return payerEmail;
  }
  return customerEmail;
}

function getMercadoPagoErrorMessage(err: unknown): string {
  if (!err) return "Erro ao criar pagamento.";
  if (err instanceof Error) return err.message || "Erro ao criar pagamento.";
  if (typeof err === "string") return err;
  if (typeof err !== "object") return "Erro ao criar pagamento.";

  const e = err as Record<string, unknown>;
  const message = typeof e.message === "string" ? e.message : "";
  const status = typeof e.status === "number" ? ` (status ${e.status})` : "";

  // O SDK costuma retornar detalhes em campos como: error, cause, response
  const error = typeof e.error === "string" ? e.error : "";
  const cause = Array.isArray(e.cause) ? e.cause : undefined;
  const causeMsg = cause
    ? cause
        .map((c) => {
          if (!c || typeof c !== "object") return "";
          const cc = c as Record<string, unknown>;
          const desc = typeof cc.description === "string" ? cc.description : "";
          const code = typeof cc.code === "string" ? cc.code : "";
          return [code, desc].filter(Boolean).join(": ");
        })
        .filter(Boolean)
        .join(" | ")
    : "";

  const response = e.response;
  const responseText =
    response && typeof response === "object" && "data" in response
      ? (() => {
          const data = (response as { data?: unknown }).data;
          try {
            return typeof data === "string" ? data : JSON.stringify(data);
          } catch {
            return "";
          }
        })()
      : "";

  return (
    (message || error || causeMsg || responseText || "Erro ao criar pagamento.") +
    status
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    const email = body.email?.trim();
    const nome = body.nome?.trim();

    if (!email) {
      return NextResponse.json({ error: "E-mail é obrigatório." }, { status: 400 });
    }

    if (!nome) {
      return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
    }

    const origin = getPublicBaseUrl();

    const token =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const store = getPendingStore();
    cleanupPendingStore(store);
    store.set(token, {
      email,
      nome,
      respostas: body.respostas ?? {},
      acertos: body.acertos,
      totalPerguntas: body.totalPerguntas,
      qiEstimado: body.qiEstimado,
      createdAt: Date.now()
    });

    const notificationUrl = `${origin}/api/mercadopago/webhook`;
    const description = `Relatório de QI - ${nome}`.slice(0, 120);
    const payerEmail = getMercadoPagoPayerEmail(email);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const mpClient = getMpClient();
    const transactionAmount = resolveTransactionAmount(body.resultadoTs);
    const metodo = body.metodo === "cartao" ? "cartao" : "pix";

    if (metodo === "cartao") {
      // Checkout Pro (Preference) — suporta cartão de crédito, débito e outros meios
      const preference = new Preference(mpClient);
      const prefBody = {
        items: [
          {
            id: "relatorio_premium",
            title: description,
            quantity: 1,
            unit_price: transactionAmount,
            currency_id: "BRL"
          }
        ],
        payer: {
          email: payerEmail,
          name: nome
        },
        metadata: {
          report_email: email,
          report_nome: nome,
          report_respostas: body.respostas ?? {},
          report_created_at: Date.now()
        },
        external_reference: token,
        notification_url: notificationUrl,
        back_urls: {
          success: `${origin}/sucesso`,
          failure: `${origin}`,
          pending: `${origin}`
        },
        auto_return: "approved" as const,
        expires: true,
        expiration_date_to: expiresAt
      } as unknown as Record<string, unknown>;

      const prefResult = await preference.create({
        body: prefBody as never
      });

      const initPoint = (prefResult as unknown as { init_point?: string }).init_point;

      if (!initPoint) {
        console.error("[mercadopago/checkout] init_point ausente (cartão)");
        return NextResponse.json({ error: "Falha ao iniciar checkout por cartão." }, { status: 500 });
      }

      return NextResponse.json({
        url: initPoint,
        paymentId: null,
        externalReference: token,
        metodo: "cartao"
      });
    }

    // Fluxo Pix direto (existente)
    const payment = new Payment(mpClient);

    const paymentBody = {
      transaction_amount: transactionAmount,
      description,
      payment_method_id: "pix",
      date_of_expiration: expiresAt,
      payer: {
        email: payerEmail,
        first_name: nome
      },
      metadata: {
        report_email: email,
        report_nome: nome,
        report_respostas: body.respostas ?? {},
        report_created_at: Date.now()
      },
      external_reference: token,
      notification_url: notificationUrl
    } as unknown as Record<string, unknown>;

    const result = await payment.create({
      body: paymentBody as never
    });

    const ticketUrl = (result as unknown as { point_of_interaction?: { transaction_data?: { ticket_url?: string } } })
      .point_of_interaction?.transaction_data?.ticket_url;

    if (!ticketUrl) {
      console.error("[mercadopago/checkout] ticket_url ausente", {
        id: (result as unknown as { id?: unknown }).id
      });
      return NextResponse.json({ error: "Falha ao iniciar o Pix (ticket_url ausente)." }, { status: 500 });
    }

    return NextResponse.json({
      url: ticketUrl,
      paymentId: (result as unknown as { id?: unknown }).id,
      externalReference: token,
      metodo: "pix"
    });
  } catch (err) {
    let msg = getMercadoPagoErrorMessage(err);
    if (msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("live credentials")) {
      msg =
        msg +
        " — Em modo de TESTE, você pode precisar usar um comprador de teste. Configure MERCADO_PAGO_PAYER_EMAIL com o e-mail do test user (comprador) no .env.local.";
    }
    console.error("[mercadopago/checkout] erro:", msg);
    if (err && typeof err === "object") {
      const e = err as Record<string, unknown>;
      console.error("[mercadopago/checkout] detalhes:", {
        hasMessage: typeof e.message === "string",
        status: typeof e.status === "number" ? e.status : undefined,
        name: typeof e.name === "string" ? e.name : undefined,
        error: typeof e.error === "string" ? e.error : undefined,
        causeCount: Array.isArray(e.cause) ? e.cause.length : undefined
      });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
