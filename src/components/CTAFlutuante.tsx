"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus_Jakarta_Sans } from "next/font/google";

const ctaFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

type Props = {
  targetId?: string;
  delay?: number;
  texto?: string;
};

export default function CTAFlutuante({
  targetId = "relatorio-premium",
  delay = 2000,
  texto = "Ver análise completa",
}: Props) {
  const [visivel, setVisivel] = useState(false);
  const [proximoDoAlvo, setProximoDoAlvo] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisivel(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    const alvo = document.getElementById(targetId);
    if (!alvo) return;

    const observer = new IntersectionObserver(
      ([entry]) => setProximoDoAlvo(entry.isIntersecting),
      { rootMargin: "0px 0px -100px 0px", threshold: 0.1 },
    );

    observer.observe(alvo);
    return () => observer.disconnect();
  }, [targetId]);

  const deveAparecer = visivel && !proximoDoAlvo;

  const scrollParaAlvo = () => {
    const alvo = document.getElementById(targetId);
    if (alvo) {
      alvo.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <AnimatePresence>
      {deveAparecer && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{
            position: "fixed",
            bottom: 20,
            left: 0,
            right: 0,
            marginLeft: "auto",
            marginRight: "auto",
            zIndex: 9999,
            width: "calc(100% - 32px)",
            maxWidth: 420,
          }}
        >
          <motion.button
            type="button"
            onClick={scrollParaAlvo}
            aria-label={texto}
            animate={{
              scale: [1, 1.03, 1],
              boxShadow: [
                "0 4px 24px rgba(239, 68, 68, 0.5)",
                "0 4px 36px rgba(239, 68, 68, 0.95)",
                "0 4px 24px rgba(239, 68, 68, 0.5)",
              ],
              backgroundPosition: ["0% 50%", "200% 50%"],
            }}
            transition={{
              scale: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
              boxShadow: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
              backgroundPosition: {
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              },
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className={ctaFont.className}
            style={{
              width: "100%",
              padding: "16px 20px",
              background:
                "linear-gradient(90deg, #f59e0b 0%, #ef4444 50%, #f59e0b 100%)",
              backgroundSize: "200% 100%",
              border: "none",
              borderRadius: 999,
              color: "#ffffff",
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: "-0.01em",
              textShadow: "0 1px 2px rgba(0,0,0,0.25)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <span>{texto}</span>
            <motion.span
              animate={{ y: [0, 5, 0] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ display: "inline-block", fontSize: 14 }}
              aria-hidden="true"
            >
              ▼
            </motion.span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
