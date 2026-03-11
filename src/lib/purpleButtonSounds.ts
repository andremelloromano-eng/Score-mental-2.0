/**
 * Sons ao CLICAR nos botões roxos (Continuar teste, Receber relatório, Pagar).
 * Usa o mesmo AudioContext que hoverSound (já desbloqueado no primeiro clique).
 */

import { getAudioContext, playUnlockTone } from "@/lib/hoverSound";

function run(ctx: AudioContext, fn: () => void): void {
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
    playUnlockTone(ctx);
  }
  fn();
}

export function playDeepUiPulseSound(volume = 0.7): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  run(ctx, () => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc2.type = "sine";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(90, now + 0.15);
    osc2.frequency.setValueAtTime(220, now);
    osc2.frequency.linearRampToValueAtTime(180, now + 0.15);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(volume * 0.02, now + 0.35);
    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.35);
    osc2.stop(now + 0.35);
  });
}

export function playAmbientAiryNotificationSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  run(ctx, () => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.25);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.65, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.02, now + 0.5);
    osc.start(now);
    osc.stop(now + 0.5);
  });
}

type SuccessChimeOptions = {
  duration?: number;
  fadeOut?: number;
};

/** Grand Success Chime — som de conquista (volume 0.1). Desktop: duration/fadeOut para fade-out suave. */
export function playSuccessChimeSound(
  volume = 0.1,
  options?: SuccessChimeOptions
): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const duration = options?.duration ?? 0.5;
  const fadeOut = options?.fadeOut ?? 0.15;
  const fadeStart = Math.max(0, duration - fadeOut);
  run(ctx, () => {
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.setValueAtTime(1320, now);
    osc1.frequency.linearRampToValueAtTime(1760, now + 0.08);
    osc2.frequency.setValueAtTime(2640, now + 0.02);
    osc2.frequency.linearRampToValueAtTime(2200, now + Math.min(0.15, duration * 0.3));
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(volume * 0.35, now + fadeStart);
    gain.gain.linearRampToValueAtTime(0.001, now + duration);
    osc1.start(now);
    osc2.start(now + 0.02);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  });
}

export function playShimmeringSuccessSound(volume = 0.08): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  run(ctx, () => {
    const now = ctx.currentTime;
    const duration = 1.35;
    const fadeOut = 0.55;
    const fadeStart = Math.max(0, duration - fadeOut);

    const master = ctx.createGain();
    master.connect(ctx.destination);
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(volume, now + 0.03);
    master.gain.setValueAtTime(volume, now + fadeStart);
    master.gain.linearRampToValueAtTime(0.0008, now + duration);

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(6.5, now);
    lfoGain.gain.setValueAtTime(7, now);
    lfo.connect(lfoGain);

    const makeVoice = (base: number, type: OscillatorType, startOffset = 0) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(base, now + startOffset);
      o.frequency.exponentialRampToValueAtTime(base * 1.32, now + startOffset + 0.55);
      g.gain.setValueAtTime(0, now + startOffset);
      g.gain.linearRampToValueAtTime(1, now + startOffset + 0.08);
      g.gain.exponentialRampToValueAtTime(0.35, now + startOffset + 0.9);
      o.connect(g);
      g.connect(master);
      lfoGain.connect(o.detune);
      o.start(now + startOffset);
      o.stop(now + duration);
      return o;
    };

    makeVoice(523.25, "triangle", 0);
    makeVoice(659.25, "sine", 0.03);
    makeVoice(783.99, "sine", 0.06);
    makeVoice(1046.5, "triangle", 0.1);

    lfo.start(now);
    lfo.stop(now + duration);
  });
}

export function playSecureConfirmationSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  run(ctx, () => {
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.setValueAtTime(330, now);
    osc2.frequency.setValueAtTime(440, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.65, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.02, now + 0.3);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.3);
    osc2.stop(now + 0.3);
  });
}
