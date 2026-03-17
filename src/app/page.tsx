"use client";

import "@/app/globals.css";
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

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
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
  }, []);

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
        className={`relative h-full overflow-hidden rounded-2xl p-2 md:p-3 ring-1 transition-shadow duration-300 ${style.ring}`}
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
  return (
    <h1
      className="hero-title-shine overflow-visible pl-px text-2xl font-semibold tracking-tight md:text-3xl"
      onMouseEnter={() => onWordHover?.()}
    >
      {HERO_TITLE}
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

type Fase =
  | "intro"
  | "quiz"
  | "resultado-pronto"
  | "aguardando-pagamento"
  | "sucesso";

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
  const [proximaIndexPendente, setProximaIndexPendente] = useState<
    number | null
  >(null);
  const [imagemFalhou, setImagemFalhou] = useState(false);
  const [opcaoSelecionadaAtual, setOpcaoSelecionadaAtual] = useState<
    string | null
  >(null);
  const [pagamentoUrl, setPagamentoUrl] = useState<string | null>(null);
  const [tempoExpiracao, setTempoExpiracao] = useState(600); // 10 minutos em segundos
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const successSoundPlayedRef = useRef(false);
  const soundsUnlockedRef = useRef(false);
  const paymentSuccessSoundPlayedRef = useRef(false);
  const voltarInicioRef = useRef(false);
  const [successMuted, setSuccessMuted] = useState(false);

  // Estado para controle do fluxo de checkout
  const [clicouNoLink, setClicouNoLink] = useState(false);

  // Detecção de mobile
  const [isMobile, setIsMobile] = useState(false);

  // Detectar se é mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        ) || window.innerWidth < 768;
      setIsMobile(isMobileDevice);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // use-sound — experiência imersiva e moderna; volumes 0.05/0.08 para elegância.
  const [playHapticTap, { stop: stopHapticTap }] = useSound(
    "/sounds/haptic-tap.wav",
    { volume: 0.05 },
  );
  const [playSuccess] = useSound("/sounds/success.wav", { volume: 0.5 });
  const [playShimmer] = useSound("/sounds/shimmer.wav", { volume: 0.1 });
  const [playCardPulsar] = useSound("/sounds/card-pulsar.wav", { volume: 0.5 });
  const [playDeepUiPulse, { stop: stopDeepUiPulse }] = useSound(
    "/sounds/deep-ui-pulse.wav",
    { volume: 0.08 },
  );
  const [playAmbientSwell] = useSound("/sounds/ambient-swell.wav", {
    volume: 0.08,
  });
  const [playAmbientAiryNotification] = useSound(
    "/sounds/ambient-airy-notification.wav",
    { volume: 0.05 },
  );
  const [playSecureConfirmation] = useSound("/sounds/secure-confirmation.wav", {
    volume: 0.08,
  });
  const [playTransitionSlide] = useSound("/sounds/transition-slide.wav", {
    volume: 0.4,
  });

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

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem("successMuted")
        : null;
    if (stored === "1") setSuccessMuted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("successMuted", successMuted ? "1" : "0");
  }, [successMuted]);

  const totalPerguntas = perguntasTyped.length;
  const perguntaAtual = perguntasTyped[indiceAtual];
  const respondidas = Object.keys(respostas).length;
  const respondidasParaUi =
    fase === "resultado-pronto" ||
    fase === "aguardando-pagamento" ||
    fase === "sucesso"
      ? totalPerguntas
      : Math.min(
          totalPerguntas,
          respondidas +
            (fase === "quiz" &&
            opcaoSelecionadaAtual &&
            perguntaAtual &&
            !respostas[perguntaAtual.id]
              ? 1
              : 0),
        );
  const progresso =
    totalPerguntas > 0 ? (respondidasParaUi / totalPerguntas) * 100 : 0;
  const perguntaNumeroParaUi =
    fase === "quiz"
      ? Math.min(totalPerguntas, indiceAtual + 1)
      : totalPerguntas;

  const acertos = perguntasTyped.reduce((acc, p) => {
    const resp = respostas[p.id];
    if (!resp) return acc;
    const correta = correctAnswerToOptionId(p.correctAnswer);
    return resp === correta ? acc + 1 : acc;
  }, 0);

  const qiEstimado = Math.round(
    85 + (acertos / Math.max(totalPerguntas, 1)) * 35,
  );

  const CertificatesCounter = () => {
  // Função para calcular certificados com base no horário (Brasília)
  const calculateCertificates = () => {
    // Pega o timestamp atual e ajusta manualmente para o fuso de Brasília (UTC-3)
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const brasiliaTime = new Date(utcTime - (3 * 3600000)); 
    
    const hours = brasiliaTime.getHours();
    const minutes = brasiliaTime.getMinutes();
    
    // Base de 120 + 1 certificado a cada 4 minutos (0.25)
    const baseValue = 120;
    const dayProgress = (hours * 60) + minutes;
    
    // Se for antes das 6h da manhã, mantém o mínimo de 120
    const calculated = Math.floor(baseValue + (dayProgress * 0.25));
    return calculated > 120 ? calculated : 120;
  };

  // Estado inicial já começa com o cálculo certo (evita o pulo no F5)
  const [count, setCount] = useState(calculateCertificates());

  useEffect(() => {
    // Atualiza a cada 45 segundos para dar a sensação de vendas reais
    const timer = setInterval(() => {
      setCount(prev => prev + 1);
    }, 45000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full flex items-center justify-center gap-2 mt-4 max-w-[90%] mx-auto">
      <span className="text-lg md:text-xl font-bold text-cyan-400">🔥</span>
      <motion.span
        key={count}
        initial={{ scale: 1.2, opacity: 0.8, color: '#22d3ee' }}
        animate={{ scale: 1, opacity: 1, color: '#22d3ee' }}
        transition={{ duration: 0.5 }}
        className="text-lg md:text-xl font-bold text-cyan-400"
      >
        {count}
      </motion.span>
      <span className="text-xs md:text-sm font-normal text-gray-300 text-center">
        certificados gerados hoje
      </span>
    </div>
  );
};

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

  useEffect(() => {
    if (fase !== "sucesso") {
      paymentSuccessSoundPlayedRef.current = false;
      return;
    }
    if (paymentSuccessSoundPlayedRef.current) return;
    if (successMuted) {
      paymentSuccessSoundPlayedRef.current = true;
      return;
    }
    if (soundsUnlockedRef.current) {
      paymentSuccessSoundPlayedRef.current = true;
      playAmbientAiryNotification();
      return;
    }
    const handler = () => {
      if (paymentSuccessSoundPlayedRef.current) return;
      paymentSuccessSoundPlayedRef.current = true;
      playAmbientAiryNotification();
    };
    window.addEventListener("pointerdown", handler, { once: true });
    return () => window.removeEventListener("pointerdown", handler);
  }, [fase, playAmbientAiryNotification, successMuted]);

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
    [totalPerguntas],
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
      [perguntaAtual.id]: opcaoSelecionadaAtual,
    }));
    playDeepUiPulseSound();
    setOpcaoSelecionadaAtual(null);
    irParaProximaPergunta(indiceAtual + 1);
  }

  const handleVoltarAoInicio = useCallback(() => {
    if (voltarInicioRef.current) return;
    voltarInicioRef.current = true;
    if (!successMuted) {
      playSuccessChimeSound(0.12, { duration: 0.35, fadeOut: 0.12 });
    }
    setTimeout(() => {
      window.location.href = "/";
    }, 220);
  }, [successMuted]);

  const handleTempoEsgotado = useCallback(() => {
    if (
      fase === "quiz" &&
      perguntaAtual &&
      opcaoSelecionadaAtual &&
      !respostas[perguntaAtual.id]
    ) {
      setRespostas((prev) => ({
        ...prev,
        [perguntaAtual.id]: opcaoSelecionadaAtual,
      }));
    }
    setOpcaoSelecionadaAtual(null);
    irParaProximaPergunta(indiceAtual + 1);
  }, [fase, indiceAtual, opcaoSelecionadaAtual, perguntaAtual, respostas]);

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
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          nome: nome.trim(),
          respostas,
          acertos,
          totalPerguntas,
          qiEstimado,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        url?: string;
        paymentId?: string | number;
      };
      console.log("📦 Resposta API checkout:", {
        ok: res.ok,
        status: res.status,
        data,
      });
      if (!res.ok) {
        setErroEnvio(
          data.error || "Falha ao iniciar o checkout. Tente novamente.",
        );
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
    if (fase !== "aguardando-pagamento" || !paymentId || checkoutAprovado)
      return;

    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    const pid = paymentId;
    console.log("🔍 Iniciando monitoramento para paymentId:", pid);
    pollingRef.current = setInterval(async () => {
      try {
        const statusRes = await fetch(
          `/api/mercadopago/status?id=${encodeURIComponent(pid)}`,
        );
        const statusData = (await statusRes.json().catch(() => ({}))) as {
          status?: string;
          error?: string;
        };
        console.log("🔍 Status polling:", { pid, status: statusData?.status });
        if (statusData?.status === "approved") {
          console.log(
            "✅ Pagamento aprovado! Limpando estado e mostrando sucesso",
          );
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
    if (fase !== "aguardando-pagamento" || !pixAberto || checkoutAprovado)
      return;

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
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // MONITORAMENTO EM SEGUNDO PLANO: Para todos - verifica quando usuário volta da aba
  useEffect(() => {
    if (fase !== "aguardando-pagamento" || !paymentId || checkoutAprovado)
      return;

    // VERIFICAÇÃO IMEDIATA quando usuário volta para nossa aba
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && paymentId) {
        console.log(
          "📱 VISIBILIDADE alterada - Verificação imediata disparada",
        );

        try {
          // Usar caminho relativo para garantir que funcione em qualquer domínio (dev ou prod)
          const statusRes = await fetch(
            `/api/mercadopago/status?id=${encodeURIComponent(paymentId)}`,
          );
          const statusData = (await statusRes.json().catch(() => ({}))) as {
            status?: string;
            error?: string;
          };
          console.log("📱 Status na verificação imediata:", {
            paymentId,
            status: statusData?.status,
          });

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
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);
    window.addEventListener("pageshow", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
      window.removeEventListener("pageshow", handleVisibilityChange);
    };
  }, [fase, paymentId, checkoutAprovado]);

  // Função de verificação manual (botão)
  const handleManualCheck = async () => {
    if (!paymentId) return;

    console.log("🔘 Verificação manual disparada pelo usuário");
    try {
      const statusRes = await fetch(
        `/api/mercadopago/status?id=${encodeURIComponent(paymentId)}`,
      );
      const statusData = (await statusRes.json().catch(() => ({}))) as {
        status?: string;
        error?: string;
      };
      console.log("🔘 Status manual:", {
        paymentId,
        status: statusData?.status,
      });

      if (statusData?.status === "approved") {
        console.log(
          "✅ Pagamento aprovado na verificação manual! Exibindo sucesso",
        );
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
    <main className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-10 text-white">
      <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-8 md:flex-row">
        <div className="pointer-events-none absolute inset-0 -z-10 blur-3xl">
          <div className="mx-auto h-full max-w-3xl bg-gradient-to-br from-accent/20 via-transparent to-indigo-900/10 opacity-70" />
        </div>

        <section className="glass-card flex-1 p-6 md:p-8 border border-white/10 bg-slate-900/50 backdrop-blur-xl">
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
                <p className="font-medium text-foreground/80">
                  Avaliação segura
                </p>
                <p>Resultados confidenciais e criptografados</p>
              </div>
            </header>
          )}

          {fase !== "intro" &&
            fase !== "aguardando-pagamento" &&
            fase !== "sucesso" && (
              <div className="mb-6 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-muted">
                  <span>
                    Pergunta {perguntaNumeroParaUi} de {totalPerguntas}
                  </span>
                  <span>Progresso: {Math.round(progresso)}%</span>
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
                        background:
                          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 20%, rgba(96,165,250,0.95) 50%, rgba(255,255,255,0.6) 80%, transparent 100%)",
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
              <div className="relative grid grid-cols-3 gap-1.5 text-[11px] md:gap-3 md:text-sm">
                <TiltCard
                  className="min-h-[60px] md:min-h-[120px]"
                  variant="neon-blue"
                  onMouseEnterSound={playCardPulsar}
                >
                  <p className="card-title-shine">
                    Foco em contexto profissional
                  </p>
                  <p className="mt-0.5 md:mt-1 text-gray-400">
                    Questões pensadas para simular tomada de decisão, lógica e
                    precisão em ambiente corporativo.
                  </p>
                </TiltCard>
                <TiltCard
                  className="min-h-[60px] md:min-h-[120px]"
                  variant="neon-blue"
                  onMouseEnterSound={playCardPulsar}
                >
                  <p className="card-title-shine">Relatório detalhado</p>
                  <p className="mt-0.5 md:mt-1 text-gray-400">
                    Perfil cognitivo, pontos fortes e oportunidades de
                    desenvolvimento enviados em PDF.
                  </p>
                </TiltCard>
                <TiltCard
                  className="min-h-[60px] md:min-h-[120px]"
                  variant="neon-blue"
                  onMouseEnterSound={playCardPulsar}
                >
                  <p className="card-title-shine">Certificado exclusivo</p>
                  <p className="mt-0.5 md:mt-1 text-gray-400">
                    Certificado digital com seu resultado para anexar ao
                    currículo ou LinkedIn.
                  </p>
                </TiltCard>
                <ParticlesOverlay />
              </div>

              <div className="mt-8 flex flex-col items-center justify-center w-full gap-4 text-center">
                <CertificatesCounter />
                <button
                  type="button"
                  onClick={() => {
                    playAmbientSwell();
                    handleIniciar();
                  }}
                  className="button-cta accent-ring w-full max-w-sm"
                >
                  Iniciar teste agora
                </button>
                <button className="button-ghost text-xs">
                  Aproximadamente 12 minutos • {totalPerguntas} questões
                </button>
              </div>
              <div
                style={{
                  display: "flex !important",
                  flexWrap: "nowrap" as any,
                  justifyContent: "center !important",
                  alignItems: "center !important",
                  whiteSpace: "nowrap !important",
                  fontSize: "9px !important",
                  gap: "4px !important",
                  marginTop: "10px !important",
                  width: "100% !important",
                }}
              >
                🔒 Ambiente Seguro | ✅ Entrega Garantida | ⚡ Pix R$ 6,00
              </div>
            </div>
          )}

          {fase === "quiz" && (
            <div
              className={`mt-2 space-y-5 transition-all duration-250 ${
                animando
                  ? "translate-y-2 opacity-0"
                  : "translate-y-0 opacity-100"
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
                      animate={{
                        opacity: tempoRestante <= 15 ? [0.7, 1, 0.7] : 0.8,
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: tempoRestante <= 15 ? Infinity : 0,
                      }}
                    />
                    {Math.floor(tempoRestante / 60)}:
                    {(tempoRestante % 60).toString().padStart(2, "0")}
                  </motion.span>
                  <span>
                    ID da questão:{" "}
                    <span className="font-mono text-xs text-foreground/70">
                      #{String(perguntaAtual.id).padStart(2, "0")}
                    </span>
                  </span>
                </div>
              </div>

              {perguntaAtual.imagem != null && perguntaAtual.imagem !== "" && (
                <div className="overflow-hidden rounded-2xl border border-border/60 bg-slate-950/60">
                  <div className="relative flex min-h-[200px] w-full items-center justify-center bg-slate-950/80">
                    {imagemFalhou ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                        <svg
                          className="h-24 w-24 text-muted/50"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <p className="text-sm text-muted">
                          Imagem da questão não disponível
                        </p>
                        <p className="text-xs text-muted/80">
                          Adicione o arquivo em public/test-qi-imagens
                        </p>
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
                    Analise a imagem acima e escolha a opção que considera
                    correta.
                  </p>
                </div>
              )}

              <h2 className="text-base font-medium text-white md:text-lg">
                {perguntaAtual.pergunta}
              </h2>

              <div className="relative grid gap-3">
                {perguntaAtual.opcoes.map((opcao) => {
                  const selecionada =
                    respostas[perguntaAtual.id] === opcao.id ||
                    opcaoSelecionadaAtual === opcao.id;
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

          <Dialog.Root
            open={mostrarMensagemMetade}
            onOpenChange={(open) => !open && handleFecharMensagemMetade()}
          >
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
                    Você já está na média de aproximadamente 80% das pessoas que
                    fizeram este teste. Continue assim para ver seu resultado
                    completo e receber o certificado.
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
                  animando
                    ? "translate-y-2 opacity-0"
                    : "translate-y-0 opacity-100"
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

                <div className="relative grid grid-cols-3 gap-1.5 text-[11px] md:gap-4 md:text-sm">
                  <TiltCard
                    className="min-h-[60px] md:min-h-[120px]"
                    variant="neon-blue"
                  >
                    <p className="card-title-shine">O que você recebe</p>
                    <ul className="mt-1 space-y-1 md:space-y-1.5 text-gray-400">
                      <li>• QI estimado com explicação clara</li>
                      <li>• Perfil cognitivo profissional</li>
                      <li>• Pontos fortes e recomendações</li>
                    </ul>
                  </TiltCard>
                  <TiltCard
                    className="min-h-[60px] md:min-h-[120px]"
                    variant="neon-blue"
                  >
                    <p className="card-title-shine">Certificado em PDF</p>
                    <ul className="mt-1 space-y-1 md:space-y-1.5 text-gray-400">
                      <li>• Assinatura digital verificada</li>
                      <li>• Ideal para currículo e LinkedIn</li>
                      <li>• Envio automático por e-mail</li>
                    </ul>
                  </TiltCard>
                  <TiltCard
                    className="min-h-[60px] md:min-h-[120px]"
                    variant="neon-blue"
                  >
                    <p className="card-title-shine">Pagamento seguro</p>
                    <ul className="mt-1 space-y-1 md:space-y-1.5 text-gray-400">
                      <li>• Pagamento via Pix (prioritário) ou cartão</li>
                      <li>
                        • Checkout Mercado Pago com confirmação automática
                      </li>
                      <li>• Envio do PDF após pagamento confirmado</li>
                    </ul>
                  </TiltCard>
                  <ParticlesOverlay />
                </div>

                <div className="flex flex-col items-center gap-4 text-center w-full max-w-2xl mx-auto mb-6">
  <CertificatesCounter />
  
  <Dialog.Trigger asChild>
    <button
      type="button"
      onClick={() => {
        playDeepUiPulseSound();
        if (typeof window !== "undefined" && (window as any).ttq) {
          (window as any).ttq.track("InitiateCheckout", {
            content_id: "teste_qi_01",
            content_type: "product",
            value: 6.00,
            currency: "BRL"
          });
        }
      }}
      className="button-cta accent-ring w-full md:mx-auto md:block md:max-w-md text-base py-4"
    >
      Obter Relatório Completo + Certificado por apenas R$ 6,00
    </button>
  </Dialog.Trigger>

  <div className="flex flex-col items-center gap-2 w-full mt-2">
    <p className="text-[11px] text-muted text-center max-w-[420px] mx-auto leading-relaxed">
      O relatório completo e o certificado em PDF serão enviados
      ao e-mail informado após a confirmação do pagamento.
    </p>

    {/* Selos usando apenas Tailwind puro, forçando o tamanho reduzido */}
    <div className="flex items-center justify-center text-[10px] text-gray-400 opacity-90 whitespace-nowrap gap-1.5 mt-1">
      🔒 Ambiente Seguro | ✅ Entrega Garantida | ⚡ Pix R$ 6,00
    </div>
  </div>
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
          Preencha seus dados para receber o relatório completo e certificado
        </Dialog.Description>
      </div>
      <Dialog.Close className="text-gray-400 hover:text-white transition-colors">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </Dialog.Close>
    </div>

    <form onSubmit={handlePagamentoSimulado} className="space-y-5">
  {/* Campo Nome com Visual Premium */}
  <div className="space-y-1.5 group">
    <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/30 ml-1 transition-colors group-focus-within:text-blue-400/60">
      Nome para o certificado
    </label>
    <input
      type="text"
      placeholder="Seu nome completo"
      value={nome}
      onChange={(e) => setNome(e.target.value)}
      className="w-full rounded-xl border border-white/5 bg-white/[0.03] p-3.5 text-sm text-white outline-none transition-all duration-300 placeholder:text-white/20 focus:border-blue-500/30 focus:bg-white/[0.06] focus:ring-4 focus:ring-blue-500/10"
      required
    />
  </div>

  {/* Campo E-mail com Visual Premium */}
  <div className="space-y-1.5 group">
    <label className="text-[10px] uppercase tracking-[0.15em] font-semibold text-white/30 ml-1 transition-colors group-focus-within:text-blue-400/60">
      E-mail para envio do relatório
    </label>
    <input
      type="email"
      placeholder="seuemail@exemplo.com"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      className="w-full rounded-xl border border-white/5 bg-white/[0.03] p-3.5 text-sm text-white outline-none transition-all duration-300 placeholder:text-white/20 focus:border-blue-500/30 focus:bg-white/[0.06] focus:ring-4 focus:ring-blue-500/10"
      required
    />
  </div>

  {/* ÁREA DOS BOTÕES (Muda dependendo se o link foi gerado ou não) */}
  {!pagamentoUrl ? (
    <button
      type="submit"
      disabled={pagando || !email || !nome}
      className="button-cta w-full justify-center disabled:cursor-not-allowed disabled:opacity-60 mt-2 shadow-lg shadow-blue-500/10"
    >
      {pagando ? "Processando..." : "Pagar R$ 6,00 e receber por e-mail"}
    </button>
  ) : !clicouNoLink ? (
    <div className="flex flex-col items-center gap-3 mt-2">
      <div className="text-center text-green-400 font-medium py-1 animate-pulse">
        ✓ Link de pagamento gerado!
      </div>
      <a
        href={pagamentoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="button-cta w-full flex justify-center items-center text-center shadow-lg shadow-green-500/20"
        style={{ textDecoration: 'none' }}
        onClick={() => {
          setClicouNoLink(true);
          setFase("aguardando-pagamento");
        }}
      >
        Abrir QR Code para Pagamento
      </a>
    </div>
  ) : (
    <div className="flex flex-col items-center gap-3 mt-2">
      <div className="text-center text-green-400 font-medium py-1 animate-pulse">
        ✓ Link de pagamento gerado!
      </div>
      <div className="text-center text-white py-2">
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Aguardando pagamento...</span>
        </div>
      </div>
    </div>
  )}

  {/* SELO DO MERCADO PAGO (Agora fixo, nunca some!) */}
  <div className="text-center mt-4">
    <div className="inline-block bg-[#009EE3] text-white px-3 py-1 rounded font-bold text-[11px] tracking-[0.05em] uppercase shadow-sm">
      Mercado Pago
    </div>
  </div>

  {/* SEUS SELOS MANTIDOS EXATAMENTE IGUAIS */}
  <div className="mt-4 flex flex-col items-center gap-1.5">
    <div className="text-center text-[9px] text-muted/50 uppercase tracking-tighter">
      Transação segura e confidencial • Dados tratados com criptografia
    </div>
    <div className="flex items-center justify-center text-[9px] text-gray-500 opacity-80 whitespace-nowrap gap-1.5">
      🔒 Ambiente Seguro | ✅ Entrega Garantida | ⚡ Pix R$ 6,00
    </div>
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
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-white">
                  Aguardando Pagamento
                </h2>
                <p className="text-muted text-sm max-w-xs mx-auto">
                  Por favor, finalize o pagamento na aba do Mercado Pago que foi
                  aberta.
                </p>
              </div>

              <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                <div className="w-full rounded-2xl border border-blue-500/40 bg-blue-500/10 px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-blue-200">
                      Tempo restante
                    </span>
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
                    onClick={() => window.open(pagamentoUrl, "_blank")}
                    className="text-xs text-muted hover:text-accent transition-colors"
                  >
                    Não abriu a aba? Clique aqui para abrir novamente
                  </button>
                )}
              </div>
            </div>
          )}

          {fase === "sucesso" && (
            <div className="relative flex w-full max-w-[100vw] flex-col items-center justify-center overflow-x-hidden px-1 py-6 text-center sm:py-10">
              <div className="sucesso-card-celebrate relative w-full max-w-xl overflow-hidden rounded-3xl border border-border/60 bg-card/50 p-6 shadow-soft backdrop-blur-xl sm:p-8">
                <button
                  type="button"
                  onClick={() => setSuccessMuted((v) => !v)}
                  className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card/60 text-xs text-muted transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label={successMuted ? "Ativar som" : "Silenciar som"}
                >
                  {successMuted ? (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="M11 5L6 9H2v6h4l5 4V5z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M23 9l-6 6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M17 9l6 6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="M11 5L6 9H2v6h4l5 4V5z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M15.5 8.5a4.5 4.5 0 010 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M18.5 5.5a8 8 0 010 13"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>

                <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" />

                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/30">
                  <svg
                    className="h-10 w-10 text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      className="sucesso-check-path"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                <div className="mt-5 space-y-3">
                  <h2 className="text-balance text-2xl font-semibold text-white sm:text-3xl">
                    Parabéns! Seu Certificado de QI Oficial foi Gerado com
                    Sucesso!
                  </h2>
                  <p
                    className="sucesso-text-reveal mx-auto max-w-md text-sm leading-relaxed text-muted"
                    style={{ animationDelay: "180ms" }}
                  >
                    O seu relatório detalhado e o certificado em PDF foram
                    enviados para{" "}
                    <span className="inline-block max-w-full break-all font-semibold text-foreground">
                      {" "}
                      {email || "(e-mail não informado)"}
                    </span>
                    .
                  </p>
                </div>

                <div
                  className="sucesso-text-reveal mt-6 w-full"
                  style={{ animationDelay: "320ms" }}
                >
                  <div className="sucesso-diploma w-full rounded-3xl px-4 py-4 sm:px-6 sm:py-6">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="w-full min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-emerald-300/90">
                          Certificado Digital
                        </p>
                        <p className="mt-2 w-full max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-white text-[clamp(1.05rem,4.6vw,1.4rem)]">
                          {nome || "Candidato"}
                        </p>
                      </div>

                      <div
                        className="mt-2 flex items-baseline justify-center gap-2 text-center"
                        style={{
                          textShadow: "0 0 16px rgba(52, 211, 153, 0.35)",
                        }}
                      >
                        <span className="font-bold uppercase tracking-[0.22em] text-white text-[1.1rem]">
                          QI estimado:
                        </span>
                        <span className="font-bold text-white text-[1.8rem]">
                          {qiEstimado}
                        </span>
                      </div>
                    </div>
                    <div className="mt-6 grid gap-2 text-left text-xs text-muted sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/5 bg-black/10 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-muted/80">
                          Status
                        </p>
                        <p className="mt-1 text-emerald-200">
                          Pagamento aprovado
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-black/10 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-muted/80">
                          Entrega
                        </p>
                        <p className="mt-1 text-foreground/80">
                          PDF enviado por e-mail
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="sucesso-text-reveal mt-7 flex flex-col items-center justify-center gap-3"
                  style={{ animationDelay: "460ms" }}
                >
                  <button
                    onClick={handleVoltarAoInicio}
                    className="sucesso-cta inline-flex w-full max-w-xs items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-transform active:scale-[0.98] sm:w-auto"
                  >
                    Voltar ao início
                  </button>
                  <p className="max-w-prose text-center text-[11px] text-muted/80">
                    Obrigado por investir no seu potencial. Seu certificado já
                    pode ser anexado ao currículo e ao LinkedIn.
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* Seção de Dúvidas Frequentes (FAQ) */}
          {(fase === "intro" || fase === "resultado-pronto") && (
            <div className="mt-12 pt-8 border-t border-border/50 w-full max-w-[90%] mx-auto">
              <h2 className="text-lg md:text-xl font-semibold text-white mb-6 text-center">
                Dúvidas Frequentes
              </h2>
              <div className="space-y-6">
                <div className="glass-card p-4 md:p-6 w-full">
                  <h3 className="text-base md:text-lg font-medium text-foreground">
                    Entrega rápida
                  </h3>
                  <p className="mt-2 text-muted text-sm md:text-base">
                    Após a confirmação do pagamento, seu relatório detalhado e
                    certificado em PDF serão enviados imediatamente para o
                    e-mail cadastrado. Garantimos agilidade e segurança na
                    entrega.
                  </p>
                </div>
                <div className="glass-card p-4 md:p-6 w-full">
                  <h3 className="text-base md:text-lg font-medium text-foreground">
                    Segurança dos dados
                  </h3>
                  <p className="mt-2 text-muted text-sm md:text-base">
                    Valorizamos sua privacidade. Todos os seus dados, incluindo
                    respostas e informações de pagamento, são tratados com
                    criptografia e confidencialidade. Não compartilhamos suas
                    informações com terceiros.
                  </p>
                </div>
                <div className="glass-card p-4 md:p-6 w-full">
                  <h3 className="text-base md:text-lg font-medium text-foreground">
                    Suporte
                  </h3>
                  <p className="mt-2 text-muted text-sm md:text-base">
                    Se tiver qualquer dúvida ou precisar de assistência, nossa
                    equipe de suporte está à disposição para ajudar. Entre em
                    contato através do e-mail de confirmação ou pelos canais
                    indicados em nosso site.
                  </p>
                </div>
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
                  <span className="text-[11px] text-muted">
                    Status da sessão
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-300">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    Ativo
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span>Perguntas respondidas</span>
                    <span className="font-mono text-xs text-foreground/80">
                      {respondidasParaUi}/{totalPerguntas}
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
              <p>
                Protótipo de interface para teste de QI profissional com paywall
                elegante.
              </p>
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
