import type { Metadata } from "next";
import { SucessoCard } from "./SucessoCard";

export const metadata: Metadata = {
  title: "Pagamento aprovado • Teste de QI Profissional"
};

type Props = {
  searchParams: {
    email?: string;
    celebrated?: string;
    // Query params do redirect do Mercado Pago (Checkout Pro / cartão)
    payment_id?: string;
    collection_id?: string;
    external_reference?: string;
    status?: string;
  };
};

export default function SucessoPage({ searchParams }: Props) {
  const email = searchParams.email;
  const celebrated = searchParams.celebrated === "1";

  // Mercado Pago envia payment_id ou collection_id no redirect
  const paymentId = searchParams.payment_id || searchParams.collection_id || undefined;

  return (
    <main className="flex min-h-screen items-center justify-center overflow-x-hidden px-4 py-10">
      <div className="relative w-full max-w-xl min-w-0">
        <div className="pointer-events-none absolute inset-0 -z-10 blur-3xl">
          <div className="mx-auto h-full max-w-md bg-gradient-to-br from-emerald-400/15 via-transparent to-accent/25 opacity-80" />
        </div>
        <SucessoCard email={email} celebrated={celebrated} paymentId={paymentId} />
      </div>
    </main>
  );
}
