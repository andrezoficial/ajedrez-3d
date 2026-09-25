let enabled = true;
let ctx: AudioContext | null = null;

function ensure() {
  if (!enabled) return null;
  const C =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!C) return null;
  if (!ctx) ctx = new C();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, duration: number, type: OscillatorType = "sine", gain = 0.035, delay = 0) {
  const c = ensure();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime + delay);
  g.gain.setValueAtTime(0.0001, c.currentTime + delay);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + delay + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + delay + duration);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + delay);
  o.stop(c.currentTime + delay + duration + 0.02);
}

export function setAudioEnabled(value: boolean) {
  enabled = !!value;
  if (enabled) ensure();
}

export function unlockAudio() {
  ensure();
}

export function playMoveSound() {
  tone(440, 0.09, "triangle", 0.025);
  tone(660, 0.12, "sine", 0.018, 0.045);
}
export function playCaptureSound() {
  tone(180, 0.16, "sawtooth", 0.035);
  tone(90, 0.22, "sine", 0.025, 0.03);
}
export function playCheckSound() {
  tone(880, 0.13, "triangle", 0.03);
  tone(1046, 0.16, "triangle", 0.025, 0.08);
}
export function playVictorySound() {
  tone(523, 0.18, "sine", 0.03);
  tone(659, 0.18, "sine", 0.03, 0.13);
  tone(784, 0.28, "sine", 0.035, 0.26);
}
export function playSelectSound() {
  tone(520, 0.06, "sine", 0.012);
}
