"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import * as Progress from "@radix-ui/react-progress";
import perguntas from "@/data/perguntas.json";
import useSound from "use-sound";
import { ParticlesOverlay } from "@/components/ParticlesBackground";
import { playHoverSound } from "@/lib/hoverSound";
import {
  playDeepUiPulseSound,
  playAmbientAiryNotificationSound,
  playSecureConfirmationSound,
  playSuccessChimeSound,
} from "@/lib/purpleButtonSounds";

const HERO_TITLE = "Descubra seu potencial cognitivo profissional";

const TILT_MAX = 12;
const TILT_PERSPECTIVE = 1200;

type TiltCardVariant = "default" | "neon-blue" | "neon-green";

function TiltCard({
  children,
  className = "",
  variant = "default",
  onMouseEnterSound,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: TiltCardVariant;
  onMouseEnterSound?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const x = (e.clientX - centerX) / (rect.width / 2);
      const y = (e.clientY - centerY) / (rect.height / 2);
      setRotate({
        x: Math.max(-1, Math.min(1, -y)) * TILT_MAX,
        y: Math.max(-1, Math.min(1, x)) * TILT_MAX,
      });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setRotate({ x: 0, y: 0 });
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (onMouseEnterSound) onMouseEnterSound();
    else playHoverSound();
  }, [onMouseEnterSound]);

  const hasTilt = rotate.x !== 0 || rotate.y !== 0;
  const shineX = 50 + (rotate.y / TILT_MAX) * 35;
  const shineY = 50 + (rotate.x / TILT_MAX) * 35;

  const variantStyles = {
    default: {
      bg: "rgba(15, 23, 42, 0.6)",
      ring: "ring-white/5 hover:ring-white/10",
      shine: `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255,255,255,0.12) 0%, transparent 50%)`,
    },
    "neon-blue": {
      bg: "rgba(6, 182, 212, 0.22)",
      ring: "ring-cyan-400/50 hover:ring-cyan-300/60",
      shine: `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(34, 211, 238, 0.35) 0%, rgba(6, 182, 212, 0.15) 40%, transparent 70%)`,
    },
    "neon-green": {
      bg: "rgba(52, 211, 153, 0.18)",
      ring: "ring-emerald-400/45 hover:ring-emerald-300/55",
      shine: `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(110, 231, 183, 0.3) 0%, rgba(52, 211, 153, 0.12) 40%, transparent 70%)`,
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      ref={ref}
      className={className}
      style={{ perspective: TILT_PERSPECTIVE }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
    >
      <motion.div
        className={`relative h-full overflow-hidden rounded-2xl p-3 ring-1 transition-shadow duration-300 ${style.ring}`}
        style={{
          transformStyle: "preserve-3d",
          backgroundColor: style.bg,
        }}
        animate={{
          rotateX: rotate.x,
          rotateY: rotate.y,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-200"
          style={{
            opacity: hasTilt ? 1 : 0,
            background: style.shine,
          }}
        />
        <div className="relative" style={{ transform: "translateZ(0)" }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}

function HeroTitleAnimated({ onWordHover }: { onWordHover?: () => void }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const words = HERO_TITLE.split(/\s+/);

  const getDistance = (i: number) =>
    hoveredIndex === null ? 0 : Math.abs(i - hoveredIndex);

  return (
    <h1 className="overflow-visible pl-px text-2xl font-semibold tracking-tight text-white md:text-3xl">
      {words.map((word, i) => {
        const isHovered = hoveredIndex === i;
        const distance = getDistance(i);
        const isNeighbor = distance === 1;
        const isSecondRing = distance === 2;

        const scale = isHovered ? 1.2 : isNeighbor ? 0.9 : isSecondRing ? 0.96 : 1;
        const opacity = isHovered ? 1 : isNeighbor ? 0.8 : isSecondRing ? 0.9 : 1;
        const y = isHovered ? -4 : isNeighbor ? 2 : isSecondRing ? 0.5 : 0;

        return (
          <span key={i} className="inline-block">
            <motion.span
              className="inline-block origin-center whitespace-nowrap"
              onMouseEnter={() => {
                setHoveredIndex(i);
                onWordHover?.();
              }}
              onMouseLeave={() => setHoveredIndex(null)}
              animate={{ scale, opacity, y }}
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 24,
              }}
              style={{
                touchAction: "manipulation",
                textShadow: isHovered
                  ? "0 0 20px rgba(255,255,255,0.45), 0 0 40px rgba(255,255,255,0.15)"
                  : "none",
              }}
            >
              {word}
            </motion.span>
            {i < words.length - 1 ? "\u00A0" : null}
          </span>
        );
      })}
    </h1>
  );
}

const SEGUNDOS_POR_QUESTAO = 60;
const METADE_DO_TESTE = 50; // percentual para exibir a mensagem motivacional

type Opcao = {
  id: string;
  texto: string;
};

type Pergunta = {
  id: number;
  categoria: string;
  imagem?: string;
  pergunta: string;
  correctAnswer: "A" | "B" | "C" | "D";
  opcoes: Opcao[];
};

type Fase = "intro" | "quiz" | "resultado-pronto" | "aguardando-pagamento" | "sucesso";

const perguntasTyped = perguntas as Pergunta[];

function correctAnswerToOptionId(answer: Pergunta["correctAnswer"]): string {
  return answer.toLowerCase();
}

export default function HomePage() {
  const router = useRouter();
  const [fase, setFase] = useState<Fase>("intro");
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  const [animando, setAnimando] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [pagando, setPagando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutAprovado, setCheckoutAprovado] = useState(false);
  const [pixAberto, setPixAberto] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(SEGUNDOS_POR_QUESTAO);
  const [mostrarMensagemMetade, setMostrarMensagemMetade] = useState(false);
  const [proximaIndexPendente, setProximaIndexPendente] = useState<number | null>(null);
  const [imagemFalhou, setImagemFalhou] = useState(false);
  const [opcaoSelecionadaAtual, setOpcaoSelecionadaAtual] = useState<string | null>(null);
  const [pagamentoUrl, setPagamentoUrl] = useState<string | null>(null);
  const [tempoExpiracao, setTempoExpiracao] = useState(600); // 10 minutos em segundos
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const successSoundPlayedRef = useRef(false);
  const soundsUnlockedRef = useRef(false);

  // Detecção de mobile
  const [isMobile, setIsMobile] = useState(false);

  // Detectar se é mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                            window.innerWidth < 768;
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // use-sound — experiência imersiva e moderna; volumes 0.05/0.08 para elegância.
  const [playHapticTap, { stop: stopHapticTap }] = useSound("/sounds/haptic-tap.wav", { volume: 0.05 });
  const [playSuccess] = useSound("/sounds/success.wav", { volume: 0.5 });
  const [playShimmer] = useSound("/sounds/shimmer.wav", { volume: 0.1 });
  const [playCardPulsar] = useSound("/sounds/card-pulsar.wav", { volume: 0.5 });
  const [playDeepUiPulse, { stop: stopDeepUiPulse }] = useSound(
    "/sounds/deep-ui-pulse.wav",
    { volume: 0.08 }
  );
  const [playAmbientSwell] = useSound("/sounds/ambient-swell.wav", { volume: 0.08 });
  const [playAmbientAiryNotification] = useSound("/sounds/ambient-airy-notification.wav", { volume: 0.05 });
  const [playSecureConfirmation] = useSound("/sounds/secure-confirmation.wav", { volume: 0.08 });
  const [playTransitionSlide] = useSound("/sounds/transition-slide.wav", { volume: 0.4 });

  // Safari: desbloquear áudio no primeiro gesto (volume 0, sem confundir com sons da página).
  useEffect(() => {
    const unlock = (): void => {
      if (soundsUnlockedRef.current) return;
      soundsUnlockedRef.current = true;
      playDeepUiPulse();
      setTimeout(() => stopDeepUiPulse(), 0);
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
    };
    document.addEventListener("click", unlock);
    document.addEventListener("touchstart", unlock, { passive: true });
    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
    };
  }, [playDeepUiPulse, stopDeepUiPulse]);

  const totalPerguntas = perguntasTyped.length;
  const respondidas = Object.keys(respostas).length;
  const progresso = (respondidas / totalPerguntas) * 100;

  const acertos = perguntasTyped.reduce((acc, p) => {
    const resp = respostas[p.id];
    if (!resp) return acc;
    const correta = correctAnswerToOptionId(p.correctAnswer);
    return resp === correta ? acc + 1 : acc;
  }, 0);

  const qiEstimado = Math.round(85 + (acertos / Math.max(totalPerguntas, 1)) * 35);

  useEffect(() => {
    if (!animando) return;
    const timeout = setTimeout(() => setAnimando(false), 260);
    return () => clearTimeout(timeout);
  }, [animando]);

  useEffect(() => {
    setImagemFalhou(false);
  }, [indiceAtual]);

  useEffect(() => {
    if (fase === "resultado-pronto" && !successSoundPlayedRef.current) {
      successSoundPlayedRef.current = true;
      playSuccess();
    }
    if (fase !== "resultado-pronto") successSoundPlayedRef.current = false;
  }, [fase, playSuccess]);

  const perguntaAtual = perguntasTyped[indiceAtual];

  useEffect(() => {
    setOpcaoSelecionadaAtual(null);
  }, [indiceAtual]);

  const avancarParaPergunta = useCallback(
    (proximaIndex: number) => {
      setTempoRestante(SEGUNDOS_POR_QUESTAO);
      if (proximaIndex >= totalPerguntas) {
        setFase("resultado-pronto");
        return;
      }
      setIndiceAtual(proximaIndex);
    },
    [totalPerguntas]
  );

  function irParaProximaPergunta(proximaIndex: number) {
    playTransitionSlide();
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }
    setAnimando(true);
    if (proximaIndex >= totalPerguntas) {
      setTimeout(() => setFase("resultado-pronto"), 260);
      return;
    }
    const naMetade = proximaIndex === Math.ceil(totalPerguntas / 2);
    if (naMetade) {
      setProximaIndexPendente(proximaIndex);
      setMostrarMensagemMetade(true);
      playAmbientAiryNotificationSound();
      setTimeout(() => setAnimando(false), 260);
      return;
    }
    setTimeout(() => avancarParaPergunta(proximaIndex), 260);
  }

  function handleFecharMensagemMetade() {
    setMostrarMensagemMetade(false);
    if (proximaIndexPendente !== null) {
      avancarParaPergunta(proximaIndexPendente);
      setProximaIndexPendente(null);
    }
  }

  function handleSelecionarOpcao(opcaoId: string) {
    stopHapticTap();
    playHapticTap();
    setOpcaoSelecionadaAtual(opcaoId);
  }

  function handleContinuar() {
    if (!opcaoSelecionadaAtual) return;
    setRespostas((prev) => ({
      ...prev,
      [perguntaAtual.id]: opcaoSelecionadaAtual
    }));
    playDeepUiPulseSound();
    setOpcaoSelecionadaAtual(null);
    irParaProximaPergunta(indiceAtual + 1);
  }

  const handleTempoEsgotado = useCallback(() => {
    setOpcaoSelecionadaAtual(null);
    irParaProximaPergunta(indiceAtual + 1);
  }, [indiceAtual]);

  useEffect(() => {
    if (fase !== "quiz" || mostrarMensagemMetade || animando) return;
    setTempoRestante(SEGUNDOS_POR_QUESTAO);
  }, [fase, indiceAtual, mostrarMensagemMetade, animando]);

  useEffect(() => {
    if (fase !== "quiz" || mostrarMensagemMetade || animando) return;
    intervaloRef.current = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          if (intervaloRef.current) {
            clearInterval(intervaloRef.current);
            intervaloRef.current = null;
          }
          handleTempoEsgotado();
          return SEGUNDOS_POR_QUESTAO;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);
        intervaloRef.current = null;
      }
    };
  }, [fase, indiceAtual, mostrarMensagemMetade, animando, handleTempoEsgotado]);

  function handleIniciar() {
    setFase("quiz");
  }

  async function handlePagamentoSimulado(e: React.FormEvent) {
    e.preventDefault();
    playSecureConfirmationSound();
    if (!nome || nome.trim().length < 2) {
      return;
    }
    if (!email || !email.includes("@")) {
      return;
    }
    setPagando(true);
    setErroEnvio(null);
    setPaymentId(null);
    setCheckoutAprovado(false);
    setPixAberto(false);
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
      console.log("🔍 Polling limpo ao iniciar novo pagamento");
    }
    console.log("🚀 Iniciando checkout Mercado Pago...");
    try {
      const res = await fetch("/api/mercadopago/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          nome: nome.trim(),
          respostas,
          acertos,
          totalPerguntas,
          qiEstimado
        })
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; url?: string; paymentId?: string | number };
      console.log("📦 Resposta API checkout:", { ok: res.ok, status: res.status, data });
      if (!res.ok) {
        setErroEnvio(data.error || "Falha ao iniciar o checkout. Tente novamente.");
        setPagando(false);
        return;
      }

      const pid = data.paymentId != null ? String(data.paymentId) : null;
      setPaymentId(pid);

      if (data.url) {
        console.log("🔗 URL de pagamento gerada:", data.url);
        
        // FLUXO DE CLIQUE ÚNICO: Salva a URL mas NÃO abre automaticamente para evitar bloqueio do Safari
        setPagamentoUrl(data.url);
        setPixAberto(true);
        // O botão no formulário mudará para "ABRIR PAGAMENTO PIX"
      }

      if (!pid) {
        setErroEnvio("Falha ao iniciar o checkout. paymentId ausente.");
        setPagando(false);
        return;
      }

      setPagando(false);
      return;
    } catch {
      setErroEnvio("Erro de conexão. Verifique a rede e tente novamente.");
      setPagando(false);
    }
  }

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);

  // POLLING E MONITORAMENTO: Para todos quando estiver em aguardando-pagamento
  useEffect(() => {
    if (fase !== "aguardando-pagamento" || !paymentId || checkoutAprovado) return;

    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    const pid = paymentId;
    console.log("🔍 Iniciando monitoramento para paymentId:", pid);
    pollingRef.current = setInterval(async () => {
      try {
        const statusRes = await fetch(`/api/mercadopago/status?id=${encodeURIComponent(pid)}`);
        const statusData = (await statusRes.json().catch(() => ({}))) as { status?: string; error?: string };
        console.log("🔍 Status polling:", { pid, status: statusData?.status });
        if (statusData?.status === "approved") {
          console.log("✅ Pagamento aprovado! Limpando estado e mostrando sucesso");
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          // Limpar estado e mudar para fase de sucesso
          setCheckoutAprovado(true);
          setFase("sucesso");
          setPaymentId(null);
          setErroEnvio(null);
          setPixAberto(false);
          setPagamentoUrl(null);
          setTempoExpiracao(600); // Reset timer
          return;
        }
      } catch (err) {
        console.error("🔍 Erro no polling:", err);
        return;
      }
    }, 1500); // Polling a cada 1.5 segundos conforme especificação

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        console.log("🔍 Polling limpo");
      }
    };
  }, [fase, paymentId, checkoutAprovado]);

  useEffect(() => {
    if (!checkoutOpen && pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
      console.log("🔍 Polling parado pelo fechamento do modal");
    }
  }, [checkoutOpen]);

  // CRONÔMETRO DE EXPIRAÇÃO: Para todos quando estiver em aguardando-pagamento
  useEffect(() => {
    if (fase !== "aguardando-pagamento" || !pixAberto || checkoutAprovado) return;

    const intervalo = setInterval(() => {
      setTempoExpiracao((prev) => {
        if (prev <= 1) {
          console.log("⏰ Tempo de pagamento expirado");
          setPixAberto(false);
          setPagamentoUrl(null);
          setErroEnvio("Tempo de pagamento expirado. Tente novamente.");
          setFase("resultado-pronto"); // Volta para a tela de resultado
          return 600; // Reset para 10 minutos
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, [fase, pixAberto, checkoutAprovado]);

  // Formatar tempo para MM:SS
  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // MONITORAMENTO EM SEGUNDO PLANO: Para todos - verifica quando usuário volta da aba
  useEffect(() => {
    if (fase !== "aguardando-pagamento" || !paymentId || checkoutAprovado) return;

    // VERIFICAÇÃO IMEDIATA quando usuário volta para nossa aba
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && paymentId) {
        console.log("📱 VISIBILIDADE alterada - Verificação imediata disparada");
        
        try {
          // Usar caminho relativo para garantir que funcione em qualquer domínio (dev ou prod)
          const statusRes = await fetch(`/api/mercadopago/status?id=${encodeURIComponent(paymentId)}`);
          const statusData = (await statusRes.json().catch(() => ({}))) as { status?: string; error?: string };
          console.log("📱 Status na verificação imediata:", { paymentId, status: statusData?.status });
          
          if (statusData?.status === "approved") {
            console.log("✅ Pagamento aprovado na verificação imediata!");
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
              pollingRef.current = null;
            }
            setCheckoutAprovado(true);
            setFase("sucesso");
            setPaymentId(null);
            setErroEnvio(null);
            setPixAberto(false);
            setPagamentoUrl(null);
            setTempoExpiracao(600);
          }
        } catch (err) {
          console.error("📱 Erro na verificação imediata:", err);
        }
      }
    };

    // Adicionar listeners para garantir captura em todos os navegadores (especialmente Safari Mobile)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    window.addEventListener('pageshow', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('pageshow', handleVisibilityChange);
    };
  }, [fase, paymentId, checkoutAprovado]);

  // Função de verificação manual (botão)
  const handleManualCheck = async () => {
    if (!paymentId) return;
    
    console.log("🔘 Verificação manual disparada pelo usuário");
    try {
      const statusRes = await fetch(`/api/mercadopago/status?id=${encodeURIComponent(paymentId)}`);
      const statusData = (await statusRes.json().catch(() => ({}))) as { status?: string; error?: string };
      console.log("🔘 Status manual:", { paymentId, status: statusData?.status });
      
      if (statusData?.status === "approved") {
          console.log("✅ Pagamento aprovado na verificação manual! Exibindo sucesso");
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
          setCheckoutAprovado(true);
          setFase("sucesso");
          setPaymentId(null);
          setErroEnvio(null);
          setPixAberto(false);
          setPagamentoUrl(null);
          setTempoExpiracao(600);
        } else {
        // Feedback visual de que ainda não foi aprovado
        console.log("⏳ Ainda não aprovado na verificação manual");
      }
    } catch (err) {
      console.error("🔘 Erro na verificação manual:", err);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-8 md:flex-row">
        <div className="pointer-events-none absolute inset-0 -z-10 blur-3xl">
          <div className="mx-auto h-full max-w-3xl bg-gradient-to-br from-accent/20 via-transparent to-indigo-900/10 opacity-70" />
        </div>

        <section className="glass-card flex-1 p-6 md:p-8">
          {fase !== "aguardando-pagamento" && fase !== "sucesso" && (
          <header className="mb-6 flex items-start justify-between gap-4">
            <div className="space-y-3">
              <span className="pill">Teste de QI Profissional</span>
              <div className="overflow-visible min-w-0">
                <HeroTitleAnimated onWordHover={playShimmer} />
                <p className="mt-2 max-w-lg text-xs text-muted md:text-sm">
                  Um teste moderno, rápido e orientado para o mercado, com
                  relatório detalhado e certificado em PDF enviado diretamente
                  para o seu e-mail.
                </p>
              </div>
            </div>
            <div className="hidden text-right text-[11px] text-muted md:block">
              <p className="font-medium text-foreground/80">Avaliação segura</p>
              <p>Resultados confidenciais e criptografados</p>
            </div>
          </header>
          )}

          {fase !== "intro" && fase !== "aguardando-pagamento" && fase !== "sucesso" && (
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-muted">
                <span>
                  Pergunta {respondidas === totalPerguntas ? totalPerguntas : respondidas + 1}{" "}
                  de {totalPerguntas}
                </span>
                <span>
                  Progresso: {Math.round(progresso)}%
                </span>
              </div>
              <Progress.Root
                className="relative h-2 w-full overflow-hidden rounded-full bg-slate-900/80"
                value={progresso}
              >
                <Progress.Indicator
                  className="h-full w-full origin-left bg-gradient-to-r from-accent via-indigo-500 to-sky-400 transition-transform duration-300"
                  style={{ transform: `translateX(-${100 - progresso}%)` }}
                />
                {/* Camada de brilho (glow) separada, só sobre a parte preenchida */}
                <div
                  className="absolute inset-y-0 left-0 overflow-hidden rounded-full pointer-events-none"
                  style={{ width: `${Math.max(progresso, 2)}%` }}
                >
                  <motion.div
                    aria-hidden
                    className="absolute inset-y-0 w-[100px] rounded-full"
                    style={{
                      left: 0,
                      background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 20%, rgba(96,165,250,0.95) 50%, rgba(255,255,255,0.6) 80%, transparent 100%)",
                    }}
                    animate={{ x: [-100, 500] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "loop",
                      ease: "easeInOut",
                    }}
                  />
                </div>
              </Progress.Root>
            </div>
          )}

          {fase === "intro" && (
            <div className="mt-4 space-y-6">
              <div className="relative grid gap-3 text-xs md:grid-cols-3 md:text-sm">
                <TiltCard className="min-h-[120px]" variant="neon-blue" onMouseEnterSound={playCardPulsar}>
                  <p className="font-medium text-white">
                    Foco em contexto profissional
                  </p>
                  <p className="mt-1 text-slate-200">
                    Questões pensadas para simular tomada de decisão, lógica e
                    precisão em ambiente corporativo.
                  </p>
                </TiltCard>
                <TiltCard className="min-h-[120px]" variant="neon-blue" onMouseEnterSound={playCardPulsar}>
                  <p className="font-medium text-white">
                    Relatório detalhado
                  </p>
                  <p className="mt-1 text-slate-200">
                    Perfil cognitivo, pontos fortes e oportunidades de
                    desenvolvimento enviados em PDF.
                  </p>
                </TiltCard>
                <TiltCard className="min-h-[120px]" variant="neon-blue" onMouseEnterSound={playCardPulsar}>
                  <p className="font-medium text-white">
                    Certificado exclusivo
                  </p>
                  <p className="mt-1 text-slate-200">
                    Certificado digital com seu resultado para anexar ao
                    currículo ou LinkedIn.
                  </p>
                </TiltCard>
                <ParticlesOverlay />
              </div>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 text-center md:mt-0 md:flex-row md:flex-wrap md:items-start md:justify-start md:text-left">
                <button
                  type="button"
                  onClick={() => {
                    playAmbientSwell();
                    handleIniciar();
                  }}
                  className="button-primary accent-ring"
                >
                  Iniciar teste agora
                </button>
                <button className="button-ghost text-xs">
                  Aproximadamente 12 minutos • {totalPerguntas} questões
                </button>
              </div>
            </div>
          )}

          {fase === "quiz" && (
            <div
              className={`mt-2 space-y-5 transition-all duration-250 ${
                animando ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-muted">
                <span className="badge-soft">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {perguntaAtual.categoria}
                </span>
                <div className="flex items-center gap-3">
                  <motion.span
                    key={tempoRestante}
                    initial={{ scale: 0.96, opacity: 0.9 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs ${
                      tempoRestante > 30
                        ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
                        : tempoRestante > 15
                        ? "border-amber-500/50 bg-amber-500/10 text-amber-300/95"
                        : "border-red-400/40 bg-red-500/10 text-red-300/90"
                    }`}
                    aria-label="Tempo restante para esta questão"
                  >
                    <motion.span
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-80"
                      animate={{ opacity: tempoRestante <= 15 ? [0.7, 1, 0.7] : 0.8 }}
                      transition={{ duration: 1.5, repeat: tempoRestante <= 15 ? Infinity : 0 }}
                    />
                    {Math.floor(tempoRestante / 60)}:{(tempoRestante % 60).toString().padStart(2, "0")}
                  </motion.span>
                  <span>
                    ID da questão:{" "}
                    <span className="font-mono text-xs text-foreground/70">
                      #{String(perguntaAtual.id).padStart(2, "0")}
                    </span>
                  </span>
                </div>
              </div>

              {(perguntaAtual.imagem != null && perguntaAtual.imagem !== "") && (
                <div className="overflow-hidden rounded-2xl border border-border/60 bg-slate-950/60">
                  <div className="relative flex min-h-[200px] w-full items-center justify-center bg-slate-950/80">
                    {imagemFalhou ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                        <svg className="h-24 w-24 text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-muted">Imagem da questão não disponível</p>
                        <p className="text-xs text-muted/80">Adicione o arquivo em public/test-qi-imagens</p>
                      </div>
                    ) : (
                      <img
                        src={perguntaAtual.imagem}
                        alt="Imagem referente à questão — analise e escolha a opção correta."
                        className="max-h-[420px] w-full object-contain object-center"
                        style={{ clipPath: "inset(0 0 5% 0)" }}
                        onError={() => setImagemFalhou(true)}
                      />
                    )}
                  </div>
                  <p className="border-t border-border/50 bg-slate-950/40 px-3 py-2 text-center text-[11px] text-muted">
                    Analise a imagem acima e escolha a opção que considera correta.
                  </p>
                </div>
              )}

              <h2 className="text-base font-medium text-white md:text-lg">
                {perguntaAtual.pergunta}
              </h2>

              <div className="relative grid gap-3">
                {perguntaAtual.opcoes.map((opcao) => {
                  const selecionada =
                    respostas[perguntaAtual.id] === opcao.id || opcaoSelecionadaAtual === opcao.id;
                  return (
                    <button
                      key={opcao.id}
                      type="button"
                      onClick={() => handleSelecionarOpcao(opcao.id)}
                      className={`group relative flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                        selecionada
                          ? "border-accent bg-accent-soft/40 text-foreground shadow-soft shadow-accent/20"
                          : "border-border/70 bg-slate-950/60 text-foreground/90 hover:border-accent/60 hover:bg-slate-900/80"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${
                            selecionada
                              ? "border-transparent bg-accent text-white"
                              : "border-border/70 bg-slate-950/60 text-muted"
                          }`}
                        >
                          {opcao.id.toUpperCase()}
                        </span>
                        <span>{opcao.texto}</span>
                      </div>
                      <span className="hidden text-[11px] text-muted/80 md:inline">
                        Clique para selecionar
                      </span>
                    </button>
                  );
                })}
                <ParticlesOverlay />
              </div>

              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={handleContinuar}
                  disabled={!opcaoSelecionadaAtual}
                  className="button-primary accent-ring w-full max-w-sm justify-center rounded-2xl py-3 shadow-lg shadow-accent/25 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                >
                  Continuar para a próxima questão
                </button>
              </div>
            </div>
          )}

          <Dialog.Root open={mostrarMensagemMetade} onOpenChange={(open) => !open && handleFecharMensagemMetade()}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border/70 bg-slate-950/95 p-6 shadow-2xl shadow-black/80 outline-none">
                <div className="space-y-4 text-center">
                  <span className="badge-soft">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    50% do teste concluído
                  </span>
                  <h3 className="text-lg font-semibold text-white">
                    Você já atingiu 50% do teste
                  </h3>
                  <p className="text-sm text-muted">
                    Você já está na média de aproximadamente 80% das pessoas que fizeram este teste. Continue assim para ver seu resultado completo e receber o certificado.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      playDeepUiPulseSound();
                      handleFecharMensagemMetade();
                    }}
                    className="button-primary w-full justify-center"
                  >
                    Continuar teste
                  </button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          {fase === "resultado-pronto" && (
            <Dialog.Root open={checkoutOpen} onOpenChange={setCheckoutOpen}>
              <div
                className={`mt-4 space-y-6 transition-all duration-250 ${
                  animando ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"
                }`}
              >
                <div className="space-y-3">
                  <span className="badge-soft">
                    Resultado pronto • Análise concluída
                  </span>
                  <h2 className="text-xl font-semibold text-white md:text-2xl">
                    Seu relatório de QI profissional está pronto para envio
                  </h2>
                  <p className="max-w-xl text-xs text-muted md:text-sm">
                    Com base nas suas respostas, geramos um{" "}
                    <span className="font-medium text-foreground/90">
                      relatório detalhado + certificado em PDF
                    </span>{" "}
                    com seu QI estimado, comparativos de desempenho e insights
                    práticos para sua carreira.
                  </p>
                </div>

                <div className="relative grid gap-4 text-xs md:grid-cols-3 md:text-sm">
                  <TiltCard className="min-h-[120px]" variant="neon-blue">
                    <p className="font-medium text-white">
                      O que você recebe
                    </p>
                    <ul className="mt-1 space-y-1.5 text-slate-200">
                      <li>• QI estimado com explicação clara</li>
                      <li>• Perfil cognitivo profissional</li>
                      <li>• Pontos fortes e recomendações</li>
                    </ul>
                  </TiltCard>
                  <TiltCard className="min-h-[120px]" variant="neon-blue">
                    <p className="font-medium text-white">
                      Certificado em PDF
                    </p>
                    <ul className="mt-1 space-y-1.5 text-slate-200">
                      <li>• Assinatura digital verificada</li>
                      <li>• Ideal para currículo e LinkedIn</li>
                      <li>• Envio automático por e-mail</li>
                    </ul>
                  </TiltCard>
                  <TiltCard className="min-h-[120px]" variant="neon-blue">
                    <p className="font-medium text-white">
                      Pagamento seguro
                    </p>
                    <ul className="mt-1 space-y-1.5 text-slate-200">
                      <li>• Pagamento via Pix (prioritário) ou cartão</li>
                      <li>• Checkout Mercado Pago com confirmação automática</li>
                      <li>• Envio do PDF após pagamento confirmado</li>
                    </ul>
                  </TiltCard>
                  <ParticlesOverlay />
                </div>

                <div className="flex flex-col items-center gap-3 text-center md:flex-row md:flex-wrap md:items-center md:justify-between md:text-left">
                  <Dialog.Trigger asChild>
                    <button
                      type="button"
                      onClick={() => playDeepUiPulseSound()}
                      className="button-primary accent-ring md:mx-auto md:block md:max-w-md"
                    >
                      Obter Relatório Completo + Certificado por apenas R$ 6,00
                    </button>
                  </Dialog.Trigger>
                  <p className="text-[11px] text-muted">
                    O relatório completo e o certificado em PDF serão enviados ao
                    e-mail informado após a confirmação do pagamento.
                  </p>
                </div>
              </div>

              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
                <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-border/70 bg-slate-950/95 p-6 shadow-2xl shadow-black/80 outline-none">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-white flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        Checkout seguro • R$ 6,00
                      </Dialog.Title>
                      <Dialog.Description className="mt-1 text-xs text-muted">
                        Informe seu melhor e-mail para receber o{" "}
                        <span className="font-medium text-foreground/90">
                          Relatório Detalhado + Certificado PDF
                        </span>{" "}
                        do seu Teste de QI Profissional.
                      </Dialog.Description>
                    </div>
                    <Dialog.Close className="button-ghost h-8 px-3 text-[11px]">
                      Fechar
                    </Dialog.Close>
                  </div>

                  <form onSubmit={handlePagamentoSimulado} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-foreground/80">
                        Nome para o certificado
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Seu nome completo"
                        className="input"
                        value={nome}
                        onChange={(e) => { setNome(e.target.value); setErroEnvio(null); }}
                      />
                      <p className="text-[11px] text-muted">
                        O nome informado será usado no certificado em PDF anexado ao e-mail.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-foreground/80">
                        E-mail para envio do relatório
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="seuemail@exemplo.com"
                        className="input"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setErroEnvio(null); }}
                      />
                      <p className="text-[11px] text-muted">
                        Usaremos este e-mail exclusivamente para enviar o relatório,
                        o certificado em PDF e instruções de leitura do resultado.
                      </p>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-[11px] text-emerald-300">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        <span>Pagamento via Pix (Mercado Pago).</span>
                      </div>
                      <span className="font-mono text-xs">R$ 6,00</span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-slate-950/60 px-3 py-2 text-[11px] text-muted">
                      <span>
                        Pontuação simulada:{" "}
                        <span className="font-medium text-foreground/90">
                          {acertos}/{totalPerguntas}
                        </span>
                      </span>
                      <span>
                        QI estimado:{" "}
                        <span className="font-mono text-xs text-foreground/80">
                          {qiEstimado}
                        </span>
                      </span>
                    </div>

                    {erroEnvio && (
                      <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-xs text-red-200">
                        {erroEnvio}
                      </div>
                    )}

                    {pixAberto && pagamentoUrl ? (
                      <div className="space-y-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            playSecureConfirmationSound();
                            setFase("aguardando-pagamento");
                            setCheckoutOpen(false);
                            window.open(pagamentoUrl, '_blank');
                          }}
                          className="button-primary w-full justify-center bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 text-sm py-4 animate-pulse"
                        >
                          ABRIR PAGAMENTO PIX
                        </button>
                        <p className="text-[10px] text-center text-emerald-400 font-medium">
                          Link gerado! Clique acima para abrir o Mercado Pago e pagar.
                        </p>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        disabled={pagando || !email || !nome}
                        className="button-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {pagando ? "Processando pagamento..." : "Pagar R$ 6,00 e receber por e-mail"}
                      </button>
                    )}

                    <div className="mt-1 flex items-center justify-between text-[10px] text-muted">
                      <span>Transação segura e confidencial.</span>
                      <span>Dados tratados com criptografia.</span>
                    </div>
                  </form>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          )}

          {fase === "aguardando-pagamento" && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-accent animate-pulse">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-white">Aguardando Pagamento</h2>
                <p className="text-muted text-sm max-w-xs mx-auto">
                  Por favor, finalize o pagamento na aba do Mercado Pago que foi aberta.
                </p>
              </div>

              <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                <div className="w-full rounded-2xl border border-blue-500/40 bg-blue-500/10 px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-blue-200">Tempo restante</span>
                    <span className="font-mono text-sm text-blue-100 font-bold">
                      {formatarTempo(tempoExpiracao)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-blue-900/50 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-blue-400"
                      initial={{ width: "100%" }}
                      animate={{ width: `${(tempoExpiracao / 600) * 100}%` }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleManualCheck}
                  className="button-secondary w-full justify-center text-sm py-3"
                >
                  Já paguei? Verificar agora
                </button>

                {pagamentoUrl && (
                  <button
                    type="button"
                    onClick={() => window.open(pagamentoUrl, '_blank')}
                    className="text-xs text-muted hover:text-accent transition-colors"
                  >
                    Não abriu a aba? Clique aqui para abrir novamente
                  </button>
                )}
              </div>
            </div>
          )}

          {fase === "sucesso" && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white">Pagamento Confirmado!</h2>
                <p className="text-muted text-sm max-w-md mx-auto leading-relaxed">
                  Seu Relatório Detalhado + Certificado PDF foram enviados para o e-mail: <br/>
                  <span className="font-semibold text-foreground">{email}</span>
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => window.location.href = "/"}
                  className="button-primary px-8"
                >
                  Voltar ao início
                </button>
              </div>
            </div>
          )}
        </section>

        {fase !== "aguardando-pagamento" && fase !== "sucesso" && (
        <aside className="glass-card relative hidden w-full max-w-xs flex-col justify-between p-5 md:flex">
          <div className="space-y-4 text-xs text-muted">
            <p className="badge-soft">
              Teste visual • Interface em dark mode profissional
            </p>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
                Painel em tempo real
              </p>
              <p className="mt-1 text-sm font-medium text-foreground/90">
                Simulação da jornada de um candidato em um teste de QI
                profissional.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl bg-slate-950/70 px-3 py-2">
                <span className="text-[11px] text-muted">Status da sessão</span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  Ativo
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span>Perguntas respondidas</span>
                  <span className="font-mono text-xs text-foreground/80">
                    {respondidas}/{totalPerguntas}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-900">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-accent to-indigo-500 transition-all duration-300"
                    style={{ width: `${Math.max(progresso, 4)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <p className="text-muted/80">Próximo passo</p>
                <p className="text-foreground/90">
                  {fase === "intro"
                    ? "Inicie o teste para desbloquear seu relatório profissional."
                    : fase === "quiz"
                    ? "Responda às questões com calma e atenção aos detalhes."
                    : "Finalize o checkout para receber o relatório completo por e-mail."}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-border/50 pt-4 text-[11px] text-muted">
            <p>Protótipo de interface para teste de QI profissional com paywall elegante.</p>
            <p className="mt-1 text-xs text-foreground/70">
              Ideal para validar jornada de usuário, experiênia de pagamento e
              percepção de valor em produtos de avaliação.
            </p>
          </div>
        </aside>
        )}
      </div>
    </main>
  );
}

