"use client";

import Link from "next/link";
import { playDeepUiPulseSound } from "@/lib/purpleButtonSounds";

export function VoltarInicioButton() {
  return (
    <Link
      href="/"
      className="button-ghost mx-auto inline-flex w-fit items-center justify-center gap-2 transition-all duration-200 md:hover:-translate-y-0.5 md:hover:shadow-lg"
      onMouseEnter={() => playDeepUiPulseSound(0.25)}
      onClick={() => playDeepUiPulseSound(0.25)}
    >
      <svg
        className="h-4 w-4 shrink-0 opacity-90"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
      Voltar para o início
    </Link>
  );
}
