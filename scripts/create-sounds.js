/**
 * Gera public/sounds/click.wav e public/sounds/success.wav (sons mínimos para use-sound).
 * Executar: node scripts/create-sounds.js
 */

const fs = require("fs");
const path = require("path");

function createWav(samples, sampleRate = 8000) {
  const numChannels = 1;
  const bitsPerSample = 8;
  const dataSize = samples.length;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const headerSize = 44;
  const fileSize = headerSize + dataSize;

  const buf = Buffer.alloc(headerSize + dataSize);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(fileSize - 8, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(numChannels, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(byteRate, 28);
  buf.writeUInt16LE(blockAlign, 32);
  buf.writeUInt16LE(bitsPerSample, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) buf[44 + i] = samples[i];
  return buf;
}

function sineWave(freq, durationSec, sampleRate, volume = 0.3) {
  const numSamples = Math.floor(sampleRate * durationSec);
  const samples = [];
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 15);
    const sample = 128 + Math.round(127 * volume * envelope * Math.sin(2 * Math.PI * freq * t));
    samples.push(Math.max(0, Math.min(255, sample)));
  }
  return samples;
}

/** Sweep de frequência (shimmer / wind) — curto e agudo */
function freqSweep(freqStart, freqEnd, durationSec, sampleRate, volume = 0.2) {
  const numSamples = Math.floor(sampleRate * durationSec);
  const samples = [];
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const progress = i / numSamples;
    const freq = freqStart + (freqEnd - freqStart) * progress;
    const envelope = Math.exp(-t * 25);
    const sample = 128 + Math.round(127 * volume * envelope * Math.sin(2 * Math.PI * freq * t));
    samples.push(Math.max(0, Math.min(255, sample)));
  }
  return samples;
}

/** Pulso grave (soft deep click / pulsar) */
function pulseWave(freq, durationSec, sampleRate, volume = 0.35) {
  const numSamples = Math.floor(sampleRate * durationSec);
  const samples = [];
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 40);
    const sample = 128 + Math.round(127 * volume * envelope * Math.sin(2 * Math.PI * freq * t));
    samples.push(Math.max(0, Math.min(255, sample)));
  }
  return samples;
}

/** Ambient Swell / Deep Whoosh — ascendente suave e atmosférico (entrada em espaço de foco) */
function ambientSwell(durationSec, sampleRate, volume = 0.5) {
  const numSamples = Math.floor(sampleRate * durationSec);
  const samples = [];
  const freqStart = 80;
  const freqEnd = 320;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const progress = i / numSamples;
    const freq = freqStart + (freqEnd - freqStart) * progress * progress;
    const envelope = Math.sin(progress * Math.PI) * 0.85 + 0.15;
    const sample = 128 + Math.round(127 * volume * envelope * Math.sin(2 * Math.PI * freq * t));
    samples.push(Math.max(0, Math.min(255, sample)));
  }
  return samples;
}

/** Haptic Soft Tap — quase inaudível, feedback de toque premium (volume no app: 0.05) */
function hapticTap(sampleRate, volume = 0.4) {
  const durationSec = 0.04;
  const numSamples = Math.floor(sampleRate * durationSec);
  const samples = [];
  const freq = 120;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 120);
    const sample = 128 + Math.round(127 * volume * envelope * Math.sin(2 * Math.PI * freq * t));
    samples.push(Math.max(0, Math.min(255, sample)));
  }
  return samples;
}

/** Digital Slide — deslize abafado (low-pass feel), papel/vidro */
function digitalSlide(durationSec, sampleRate, volume = 0.35) {
  const numSamples = Math.floor(sampleRate * durationSec);
  const samples = [];
  const freqStart = 60;
  const freqEnd = 280;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const progress = i / numSamples;
    const freq = freqStart + (freqEnd - freqStart) * progress;
    const envelope = Math.sin(progress * Math.PI);
    const sample = 128 + Math.round(127 * volume * envelope * Math.sin(2 * Math.PI * freq * t));
    samples.push(Math.max(0, Math.min(255, sample)));
  }
  return samples;
}

/** Deep UI Pulse — grave e macio, confirmar ação importante (botões de ação) */
function deepUiPulse(sampleRate, volume = 0.5) {
  const durationSec = 0.18;
  const numSamples = Math.floor(sampleRate * durationSec);
  const samples = [];
  const freq = 90;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 18) * (1 - 0.3 * (i / numSamples));
    const sample = 128 + Math.round(127 * volume * envelope * Math.sin(2 * Math.PI * freq * t));
    samples.push(Math.max(0, Math.min(255, sample)));
  }
  return samples;
}

/** Ambient Airy Notification — sopro / vidro tocado levemente (modais) */
function ambientAiryNotification(sampleRate, volume = 0.4) {
  const durationSec = 0.35;
  const numSamples = Math.floor(sampleRate * durationSec);
  const samples = [];
  const freqStart = 400;
  const freqEnd = 1200;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const progress = i / numSamples;
    const freq = freqStart + (freqEnd - freqStart) * progress * 0.5;
    const envelope = Math.sin(progress * Math.PI) * 0.6;
    const sample = 128 + Math.round(127 * volume * envelope * Math.sin(2 * Math.PI * freq * t));
    samples.push(Math.max(0, Math.min(255, sample)));
  }
  return samples;
}

/** Secure Confirmation — clique duplo rápido e sutil (botão de pagamento) */
function secureConfirmation(sampleRate, volume = 0.35) {
  const singleTap = (freq, startSample, len) => {
    const out = [];
    for (let i = 0; i < len; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 80);
      const sample = 128 + Math.round(127 * volume * envelope * Math.sin(2 * Math.PI * freq * t));
      out.push(Math.max(0, Math.min(255, sample)));
    }
    return out;
  };
  const sr = sampleRate;
  const tapLen = Math.floor(sr * 0.03);
  const gap = Math.floor(sr * 0.04);
  const samples = [];
  const tap1 = singleTap(280, 0, tapLen);
  for (let i = 0; i < tap1.length; i++) samples.push(tap1[i]);
  for (let i = 0; i < gap; i++) samples.push(128);
  const tap2 = singleTap(320, 0, tapLen);
  for (let i = 0; i < tap2.length; i++) samples.push(tap2[i]);
  return samples;
}

// Click (legado): mantido para compat; opções usam haptic-tap
const clickSamples = sineWave(1200, 0.06, 8000, 0.4);
const clickWav = createWav(clickSamples);

// Success: dois tons ascendentes suaves
const successSamples = [];
const sr = 8000;
const tone1 = sineWave(523, 0.12, sr, 0.35);
const tone2 = sineWave(659, 0.15, sr, 0.3);
const tone3 = sineWave(784, 0.18, sr, 0.25);
for (let i = 0; i < tone1.length; i++) successSamples.push(tone1[i]);
for (let i = 0; i < tone2.length; i++) successSamples.push(tone2[i]);
for (let i = 0; i < tone3.length; i++) successSamples.push(tone3[i]);
const successWav = createWav(successSamples);

const outDir = path.join(__dirname, "..", "public", "sounds");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Shimmer: UI hover no título — curto, agudo, volume baixo
const shimmerSamples = freqSweep(2800, 4200, 0.07, 22050, 0.35);
const shimmerWav = createWav(shimmerSamples, 22050);

// Card pulsar: soft deep click ao entrar no card
const pulsarSamples = pulseWave(180, 0.1, 22050, 0.4);
const pulsarWav = createWav(pulsarSamples, 22050);

// Ambient Swell: botão "Iniciar teste" — entrada em espaço de foco
const ambientSwellSamples = ambientSwell(0.7, 22050, 0.5);
const ambientSwellWav = createWav(ambientSwellSamples, 22050);

// Haptic Soft Tap: opções ABCD (volume 0.05 no app)
const hapticTapSamples = hapticTap(22050);
const hapticTapWav = createWav(hapticTapSamples, 22050);

// Digital Slide: transição entre perguntas (abafado)
const transitionSlideSamples = digitalSlide(0.25, 22050);
const transitionSlideWav = createWav(transitionSlideSamples, 22050);

// Deep UI Pulse: botões de ação (Iniciar, Receber relatório, Continuar) — volume 0.08
const deepUiPulseSamples = deepUiPulse(22050);
const deepUiPulseWav = createWav(deepUiPulseSamples, 22050);

// Ambient Airy Notification: modais (ex. 50% concluído) — volume 0.05/0.08
const ambientAirySamples = ambientAiryNotification(22050);
const ambientAiryWav = createWav(ambientAirySamples, 22050);

// Secure Confirmation: botão Pagar US$ 1 — clique duplo sutil — volume 0.05/0.08
const secureConfirmationSamples = secureConfirmation(22050);
const secureConfirmationWav = createWav(secureConfirmationSamples, 22050);

fs.writeFileSync(path.join(outDir, "click.wav"), clickWav);
fs.writeFileSync(path.join(outDir, "success.wav"), successWav);
fs.writeFileSync(path.join(outDir, "shimmer.wav"), shimmerWav);
fs.writeFileSync(path.join(outDir, "card-pulsar.wav"), pulsarWav);
fs.writeFileSync(path.join(outDir, "ambient-swell.wav"), ambientSwellWav);
fs.writeFileSync(path.join(outDir, "haptic-tap.wav"), hapticTapWav);
fs.writeFileSync(path.join(outDir, "transition-slide.wav"), transitionSlideWav);
fs.writeFileSync(path.join(outDir, "deep-ui-pulse.wav"), deepUiPulseWav);
fs.writeFileSync(path.join(outDir, "ambient-airy-notification.wav"), ambientAiryWav);
fs.writeFileSync(path.join(outDir, "secure-confirmation.wav"), secureConfirmationWav);
console.log("Criados: click, success, shimmer, card-pulsar, ambient-swell, haptic-tap, transition-slide, deep-ui-pulse, ambient-airy-notification, secure-confirmation em public/sounds/");