"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { VoltarInicioButton } from "./VoltarInicioButton";
import { playShimmeringSuccessSound } from "@/lib/purpleButtonSounds";

type Props = {
  email?: string;
  celebrated?: boolean;
};

const MOBILE_BREAKPOINT = 768;

export function SucessoCard({ email, celebrated = false }: Props) {
  const confettiFired = useRef(false);
  const [isMobile, setIsMobile] = useState(false);

  useLayoutEffect(() => {
    setIsMobile(typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT);
  }, []);

  const totalDuration = isMobile ? 0.6 : 1.2;
  const shakeDuration = totalDuration * 0.72;
  const popDelay = shakeDuration;
  const popDuration = Math.max(0.01, totalDuration - shakeDuration);

  useEffect(() => {
    let vibrationTimeout: ReturnType<typeof setTimeout> | undefined;
    let confettiTimeout: ReturnType<typeof setTimeout> | undefined;

    if (!celebrated) {
      playShimmeringSuccessSound(0.08);
    }

    if (isMobile && typeof navigator !== "undefined" && navigator.vibrate) {
      vibrationTimeout = setTimeout(() => {
        navigator.vibrate([100, 50, 200]);
      }, 110);
    }

    if (confettiFired.current) {
      return () => {
        if (vibrationTimeout) clearTimeout(vibrationTimeout);
      };
    }
    confettiFired.current = true;

    const fire = () => {
      import("canvas-confetti").then(({ default: confetti }) => {
        const colors = ["#8b5cf6", "#a78bfa", "#6366f1", "#818cf8", "#3b82f6"];
        if (isMobile) {
          const interval = setInterval(() => {
            confetti({
              particleCount: 45,
              spread: 110,
              origin: { x: 0.5, y: 0.5 },
              colors,
            });
          }, 400);
          setTimeout(() => clearInterval(interval), 2000);
        } else {
          const start = performance.now();
          const durationMs = 4000;
          const interval = setInterval(() => {
            const elapsed = performance.now() - start;
            if (elapsed >= durationMs) {
              clearInterval(interval);
              return;
            }
            confetti({
              particleCount: 90,
              spread: 80,
              origin: { y: 0.3 + Math.random() * 0.2, x: 0.3 + Math.random() * 0.4 },
              colors,
            });
          }, 500);
        }
      });
    };

    confettiTimeout = setTimeout(fire, 100);
    return () => {
      if (vibrationTimeout) clearTimeout(vibrationTimeout);
      if (confettiTimeout) clearTimeout(confettiTimeout);
    };
  }, [celebrated, isMobile]);

  return (
    <motion.section
      className="glass-card sucesso-card-celebrate relative max-w-full overflow-x-hidden p-8"
      style={{ willChange: "transform" }}
      initial={{ scale: 0.95, x: 0 }}
      animate={{
        scale: 1,
        x: [0, -6, 5, -4, 3, -2, 1, 0],
      }}
      transition={{
        x: {
          duration: shakeDuration,
          times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1],
        },
        scale: {
          delay: popDelay,
          duration: popDuration,
          type: "spring",
          stiffness: isMobile ? 500 : 350,
          damping: isMobile ? 25 : 22,
        },
      }}
    >
      <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />

      <header className="mb-5 space-y-2">
        <p className="pill">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Pagamento aprovado
        </p>
        <h1 className="text-2xl font-semibold text-white">
          Pagamento confirmado! Seu certificado de 12 páginas foi enviado.
        </h1>
        <p className="max-w-lg text-sm text-muted">
          Pagamento confirmado! Seu certificado de 12 páginas foi enviado para o e-mail:{" "}
          <span className="font-medium text-foreground/90">{email || "(e-mail não informado)"}</span>
        </p>
      </header>

      <div className="space-y-4 text-sm text-muted">
        {email && (
          <div className="flex min-w-0 flex-col items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 px-4 py-3 text-center text-xs text-emerald-100 md:flex-row md:items-center md:justify-between md:text-left">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-300">
                E-mail de envio
              </p>
              <p className="mt-0.5 break-words font-mono text-sm text-emerald-100">
                {email}
              </p>
            </div>
            <span className="badge-glow-pulse shrink-0 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-medium">
              Resultado a caminho
            </span>
          </div>
        )}

        <ul className="space-y-2 text-xs text-muted">
          <li>• Verifique também a pasta de spam ou promoções.</li>
          <li>
            • O certificado em PDF poderá ser baixado e anexado ao seu currículo
            ou perfil profissional.
          </li>
          <li>
            • Caso não receba em alguns minutos, você poderá reenviar o relatório
            a partir da área do candidato (neste protótipo, ação ilustrativa).
          </li>
        </ul>
      </div>

      <div className="mt-6 flex flex-col items-center justify-center">
        <VoltarInicioButton />
        <p className="mx-auto mt-8 max-w-prose text-center text-[11px] text-muted opacity-80">
          Obrigado por confiar em um processo de avaliação profissional moderno,
          transparente e centrado em você.
        </p>
      </div>
    </motion.section>
  );
}
