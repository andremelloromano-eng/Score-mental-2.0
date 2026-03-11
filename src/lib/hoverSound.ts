/**
 * Som de imersão ao passar o rato (hover).
 * Usa Web Audio para um tom suave.
 * Compatível com Safari: no primeiro clique/toque tocamos um som mínimo (no mesmo gesto) para desbloquear o áudio.
 */

let audioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioContext = new Ctx();
  }
  return audioContext;
}

/** Tom quase inaudível no primeiro clique — necessário no Safari para desbloquear áudio no mesmo gesto. Exportado para purpleButtonSounds. */
export function playUnlockTone(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(200, now);
  gain.gain.setValueAtTime(0.01, now);
  osc.start(now);
  osc.stop(now + 0.01);
}

/** Desbloqueia o áudio no primeiro clique/toque (obrigatório em Chrome, Safari e iOS) */
function unlockOnFirstUserGesture(): void {
  if (typeof window === "undefined") return;
  const unlock = (): void => {
    const ctx = getAudioContext();
    if (ctx) {
      ctx.resume().catch(() => {});
      // Safari/iOS: o primeiro som tem de começar neste mesmo gesto (síncrono)
      playUnlockTone(ctx);
    }
    document.removeEventListener("click", unlock, true);
    document.removeEventListener("touchstart", unlock, true);
  };
  document.addEventListener("click", unlock, true);
  document.addEventListener("touchstart", unlock, { passive: true, capture: true });
}

unlockOnFirstUserGesture();

/** Tom curto e suave (sine) para hover — som de imersão agradável, tom médio/grave */
export function playHoverSound(): void {
  if (typeof window === "undefined") return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
    playUnlockTone(ctx);
  }
  playTone(ctx);
}

function playTone(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  // Tom médio/grave (360–420 Hz) — audível e não agudo
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(360, now);
  oscillator.frequency.linearRampToValueAtTime(420, now + 0.07);

  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.22, now + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  oscillator.start(now);
  oscillator.stop(now + 0.22);
}
