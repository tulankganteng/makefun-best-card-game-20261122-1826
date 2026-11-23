// Ember Court — tiny WebAudio bleeps, synthesized, no audio files.
// A soft pluck on play, a thud on attack, a low bell on defeat and a
// rising arpeggio on victory. Silent until the first user gesture.

let ctx = null;

function ac() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return ctx;
}

export function blip(freq, dur = 0.09, type = 'sine', gain = 0.08) {
  const a = ac();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(gain, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  o.connect(g).connect(a.destination);
  o.start();
  o.stop(a.currentTime + dur);
}

export const sfx = {
  play: () => blip(520, 0.1, 'triangle', 0.07),
  attack: () => { blip(180, 0.12, 'square', 0.06); blip(120, 0.14, 'sawtooth', 0.04); },
  endTurn: () => blip(330, 0.08, 'sine', 0.05),
  win: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.22, 'triangle', 0.07), i * 110)),
  lose: () => [392, 330, 262, 196].forEach((f, i) => setTimeout(() => blip(f, 0.3, 'sine', 0.06), i * 140)),
};
