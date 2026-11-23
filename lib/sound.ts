/**
 * Every sound is synthesized with the Web Audio API (brief 7.7): gentle and
 * warm, never shrill. The AudioContext is created on the first user gesture
 * and kept warm so the ding lands within 30 ms of a tap. Nothing plays on load.
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
let volume = 0.7;

export function configureSound(opts: { enabled: boolean; volume: number }) {
  enabled = opts.enabled;
  volume = opts.volume;
  if (master) master.gain.value = volume * 0.6;
}

/** Create or resume the context. Call from a user gesture. */
export function unlockAudio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    master.gain.value = volume * 0.6;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 3;
    master.connect(comp).connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Install once: the first pointer or key press anywhere unlocks audio. */
export function installAudioUnlock() {
  if (typeof window === "undefined") return;
  const once = () => {
    unlockAudio();
    window.removeEventListener("pointerdown", once, true);
    window.removeEventListener("keydown", once, true);
  };
  window.addEventListener("pointerdown", once, true);
  window.addEventListener("keydown", once, true);
}

function ready() {
  if (!enabled || !ctx || !master) return null;
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(c: AudioContext, freq: number, start: number, opts: { type?: OscillatorType; gain?: number; attack?: number; decay?: number; detune?: number; dest?: AudioNode } = {}) {
  const { type = "sine", gain = 0.3, attack = 0.005, decay = 0.6, detune = 0 } = opts;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  o.detune.value = detune;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, start + attack + decay);
  o.connect(g).connect(opts.dest ?? master!);
  o.start(start);
  o.stop(start + attack + decay + 0.05);
}

const semitone = (n: number) => 2 ** (n / 12);

/**
 * The aura ding: C6 and G6 sine partials over a soft triangle an octave
 * below, 5 ms attack, 600 ms exponential decay, light shimmer on top.
 * `step` pitches it up a semitone per stacked completion (max 5).
 */
export function playDing(step = 0) {
  const c = ready();
  if (!c) return;
  const t = c.currentTime + 0.001;
  const k = semitone(Math.min(5, Math.max(0, step)));
  tone(c, 1046.5 * k, t, { gain: 0.32, decay: 0.6 });
  tone(c, 1568 * k, t, { gain: 0.18, decay: 0.55 });
  tone(c, 523.25 * k, t, { type: "triangle", gain: 0.12, decay: 0.5 });
  // shimmer
  tone(c, 3136 * k, t + 0.012, { gain: 0.035, decay: 0.35, detune: 7 });
  tone(c, 4186 * k, t + 0.02, { gain: 0.02, decay: 0.25, detune: -6 });
}

const ARP = [523.25, 659.25, 783.99, 1046.5]; // C E G C

/** Unlock: a rising four-note arpeggio 90 ms apart, with a sparkle tail. */
export function playUnlock() {
  const c = ready();
  if (!c) return;
  const t = c.currentTime + 0.01;
  ARP.forEach((f, i) => {
    tone(c, f * 2, t + i * 0.09, { gain: 0.22, decay: 0.5 });
    tone(c, f, t + i * 0.09, { type: "triangle", gain: 0.08, decay: 0.4 });
  });
  sparkle(c, t + 0.36, 7);
}

/** Level up: the arpeggio, then a major chord that swells over 1.5 s. */
export function playLevelUp() {
  const c = ready();
  if (!c) return;
  playUnlock();
  const t = c.currentTime + 0.42;
  for (const f of [523.25, 659.25, 783.99, 1046.5]) swell(c, f, t, 1.5, 0.09);
}

/** Daily goal: a fuller chime. */
export function playChime() {
  const c = ready();
  if (!c) return;
  const t = c.currentTime + 0.005;
  [1046.5, 1318.5, 1568].forEach((f, i) => tone(c, f, t + i * 0.06, { gain: 0.22, decay: 1.1 }));
  tone(c, 523.25, t, { type: "triangle", gain: 0.12, decay: 1.2 });
  sparkle(c, t + 0.2, 5);
}

/** New realm: a slow, layered pad that swells, with the arpeggio on top. */
export function playRealm() {
  const c = ready();
  if (!c) return;
  const t = c.currentTime + 0.01;
  for (const [f, d] of [[130.81, 0], [196, 4], [261.63, -3], [329.63, 5], [392, -4]] as [number, number][]) swell(c, f, t, 5, 0.07, "sawtooth", d, 900);
  setTimeout(() => playUnlock(), 1600);
  setTimeout(() => playChime(), 3200);
}

/** Unwrap: paper rustle, a ribbon whoosh, then the ding. */
export function playRustle() {
  const c = ready();
  if (!c) return;
  const t = c.currentTime;
  for (let i = 0; i < 5; i++) noiseBurst(c, t + i * 0.06 + Math.random() * 0.03, 0.07, 2200 + Math.random() * 1800, 0.14);
}

export function playWhoosh() {
  const c = ready();
  if (!c) return;
  const t = c.currentTime;
  const src = noiseSource(c, 0.7);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 1.2;
  bp.frequency.setValueAtTime(500, t);
  bp.frequency.exponentialRampToValueAtTime(3800, t + 0.55);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.22, t + 0.15);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
  src.connect(bp).connect(g).connect(master!);
  src.start(t);
  src.stop(t + 0.7);
}

function swell(c: AudioContext, f: number, t: number, dur: number, gain: number, type: OscillatorType = "sine", detune = 0, lp = 0) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = f;
  o.detune.value = detune;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.45);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node: AudioNode = o;
  if (lp) {
    const f2 = c.createBiquadFilter();
    f2.type = "lowpass";
    f2.frequency.value = lp;
    o.connect(f2);
    node = f2;
  }
  node.connect(g).connect(master!);
  o.start(t);
  o.stop(t + dur + 0.1);
}

function sparkle(c: AudioContext, t: number, n: number) {
  for (let i = 0; i < n; i++) tone(c, 2093 * semitone([0, 4, 7, 12, 16, 19, 24][i % 7]), t + i * 0.045, { gain: 0.03, decay: 0.25 });
}

function noiseSource(c: AudioContext, seconds: number) {
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * seconds), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource();
  s.buffer = buf;
  return s;
}

function noiseBurst(c: AudioContext, t: number, dur: number, freq: number, gain: number) {
  const src = noiseSource(c, dur + 0.02);
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = freq;
  bp.Q.value = 0.9;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp).connect(g).connect(master!);
  src.start(t);
  src.stop(t + dur + 0.02);
}

let hapticsOn = true;
export function configureHaptics(on: boolean) {
  hapticsOn = on;
}
/** A 15 ms tap where supported. */
export function haptic(ms = 15) {
  if (!hapticsOn || typeof navigator === "undefined" || !navigator.vibrate) return;
  try {
    navigator.vibrate(ms);
  } catch {
    /* unsupported */
  }
}

export function soundEnabled() {
  return enabled;
}
