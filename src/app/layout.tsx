import type { Metadata } from "next";
import type { Viewport } from "next";
import "./globals.css";
import ParticlesBackground from "@/components/ParticlesBackground";

export const metadata: Metadata = {
  title: "Teste de QI Profissional",
  description:
    "Avalie seu QI profissional com um teste moderno, resultado detalhado e certificado em PDF enviado por e-mail."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="relative min-h-screen max-w-[100vw] overflow-x-hidden bg-background text-foreground antialiased">
        <ParticlesBackground />
        <div className="relative z-10">{children}</div>
        <script
          src="https://sdk.mercadopago.com/js/v2"
          async
        />
        {/* Google Analytics GA4 */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-43LCE3E2M5"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-43LCE3E2M5');
            `,
          }}
        />
      </body>
    </html>
  );
}
