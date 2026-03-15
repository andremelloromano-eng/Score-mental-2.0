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
      <head>
        {/* TikTok Pixel Code Start */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};


  ttq.load('D6RGG0JC77UC2AGO1FMG');
  ttq.page();
}(window, document, 'ttq');
            `,
          }}
        />
        {/* TikTok Pixel Code End */}
      </head>
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
