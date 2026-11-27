// Renders every sound in audio/ except the voice: the area music, the ambience beds and the sound effects.
//
//   node scripts/render_audio.mjs            (everything)
//   node scripts/render_audio.mjs hoof street (only the named files)
//
// No dependencies. Deterministic: the same script gives the same files. (It replaced scripts/render_score.py, which needed NumPy.)
//
// THE SOUND OF THE GAME. Saint John, 1910, a museum after dark under gas light. The music is what a 1910 museum
// could have heard: a parlour upright, a reed organ (harmonium), a string quartet, a clarinet, a flute, a music
// box, a celesta, a harp, and Franklin's glass armonica for the deep-time room. Slow, quiet, made to read over.
// Every loop is rendered twice and the second pass is kept, so reverb tails from the end ring into the start and
// the loop has no seam.
import { seeded, writeWav } from '../tools/game_sound_kit/render.mjs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'audio');
const ONLY = new Set(process.argv.slice(2));
const want = name => !ONLY.size || ONLY.has(name);
const SR = 24000;
const TAU = Math.PI * 2;

/* ------------------------------------------------------------------ basics */
let R = seeded(1910);
const reseed = n => { R = seeded(n); };
const rand = (a = 0, b = 1) => a + (b - a) * R();
const white = () => R() * 2 - 1;
const mtof = m => 440 * 2 ** ((m - 69) / 12);
const secs = n => Math.round(n * SR);

// noise that repeats every n samples, twice over: filter it, keep the second half, and the loop has no seam
function loopNoise(n) { const a = noise(n), b = new Float32Array(2 * n); b.set(a); b.set(a, n); return b; }
function noise(n) { const a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = white(); return a; }
// add src into dst at sample offset; wrap = place around a loop
function add(dst, at, src, gain = 1, wrap = false) {
  const L = dst.length;
  for (let i = 0; i < src.length; i++) {
    let j = at + i;
    if (wrap) j = ((j % L) + L) % L; else if (j < 0 || j >= L) continue;
    dst[j] += src[i] * gain;
  }
}
// RBJ biquads. type: lp, hp, bp (0 dB peak), peak, lowshelf, highshelf
function biquad(x, type, f, q = 0.707, db = 0) {
  const w = TAU * Math.min(f, SR * 0.49) / SR, c = Math.cos(w), s = Math.sin(w), al = s / (2 * q), A = 10 ** (db / 40);
  let b0, b1, b2, a0, a1, a2;
  if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; a0 = 1 + al; a1 = -2 * c; a2 = 1 - al; }
  else if (type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; a0 = 1 + al; a1 = -2 * c; a2 = 1 - al; }
  else if (type === 'bp') { b0 = al; b1 = 0; b2 = -al; a0 = 1 + al; a1 = -2 * c; a2 = 1 - al; }
  else if (type === 'peak') { b0 = 1 + al * A; b1 = -2 * c; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * c; a2 = 1 - al / A; }
  else if (type === 'lowshelf' || type === 'highshelf') {
    const sq = 2 * Math.sqrt(A) * al, sg = type === 'lowshelf' ? 1 : -1;
    b0 = A * ((A + 1) - sg * (A - 1) * c + sq); b1 = sg * 2 * A * ((A - 1) - sg * (A + 1) * c); b2 = A * ((A + 1) - sg * (A - 1) * c - sq);
    a0 = (A + 1) + sg * (A - 1) * c + sq; a1 = -sg * 2 * ((A - 1) + sg * (A + 1) * c); a2 = (A + 1) + sg * (A - 1) * c - sq;
  }
  b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0;
  const y = new Float32Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) { const v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v; }
  return y;
}
// a resonance that rings for about tau seconds (Q from the decay time), scaled to a peak of 1 so mix levels read
// as loudness (a raw high-Q band-pass of a short burst comes out ~100 times quieter than the burst)
function ring(x, f, tau) {
  const y = biquad(x, 'bp', f, Math.max(0.5, Math.PI * f * tau)); let p = 0;
  for (const v of y) p = Math.max(p, Math.abs(v));
  return p ? scale(y, 1 / p) : y;
}
function onepoleLP(x, f) { const a = 1 - Math.exp(-TAU * f / SR); const y = new Float32Array(x.length); let s = 0; for (let i = 0; i < x.length; i++) { s += a * (x[i] - s); y[i] = s; } return y; }
function scale(x, g) { for (let i = 0; i < x.length; i++) x[i] *= g; return x; }
function mixInto(dst, src, g = 1) { for (let i = 0; i < Math.min(dst.length, src.length); i++) dst[i] += src[i] * g; return dst; }
// a burst: noise shaped by attack/decay, as the excitation for knocks
function burst(len, attack, decay) {
  const n = secs(len), a = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; a[i] = white() * Math.min(1, t / Math.max(attack, 1e-5)) * Math.exp(-t / decay); }
  return a;
}
// a short decaying partial (cheap recursive sine)
function partial(out, at, f, amp, tau, phase = 0) {
  if (f >= SR * 0.47) return;
  const w = TAU * f / SR, k = 2 * Math.cos(w), d = Math.exp(-1 / (tau * SR));
  let y1 = Math.sin(phase - w), y2 = Math.sin(phase - 2 * w), e = amp;
  for (let i = at; i < out.length && e > 1e-5 * Math.abs(amp) + 1e-9; i++) {
    const y = k * y1 - y2; y2 = y1; y1 = y;
    out[i] += y * e * Math.min(1, (i - at) / 8); e *= d;
  }
}

/* ------------------------------------------------------------------ the room: an 8-line feedback delay network */
function reverb(x, { rt = 1.8, size = 1, tone = 5200, pre = 0.018 } = {}) {
  const N = 8, base = [1031, 1327, 1523, 1871, 2053, 2381, 2713, 3049];
  const len = base.map(d => Math.round(d * size * SR / 32000));
  const buf = len.map(l => new Float32Array(l)), idx = new Array(N).fill(0), lp = new Array(N).fill(0);
  const g = len.map(l => 10 ** (-3 * l / (rt * SR))), a = 1 - Math.exp(-TAU * tone / SR), P = secs(pre);
  const y = new Float32Array(x.length), v = new Array(N);
  for (let n = 0; n < x.length; n++) {
    const inp = n >= P ? x[n - P] : 0; let sum = 0, out = 0;
    for (let i = 0; i < N; i++) { const r = buf[i][idx[i]]; lp[i] += a * (r - lp[i]); v[i] = lp[i]; sum += v[i]; out += (i & 1 ? -v[i] : v[i]); }
    sum *= 2 / N;
    for (let i = 0; i < N; i++) { buf[i][idx[i]] = (v[i] - sum) * g[i] + inp * (i & 1 ? 0.3 : -0.3); if (++idx[i] >= len[i]) idx[i] = 0; }
    y[n] = out / Math.sqrt(N);
  }
  // early reflections from a panelled room
  const er = new Float32Array(x.length);
  for (const [d, gg] of [[0.011, 0.32], [0.019, 0.24], [0.027, -0.18], [0.041, 0.14], [0.057, 0.1]]) add(er, secs(d * size), x, gg);
  return mixInto(y, er);
}

/* ------------------------------------------------------------------ instruments */
// Sustained voices read a single-cycle table built for the note, so the harmonic weights can follow absolute
// frequency (a violin's body, a clarinet's bore) while vibrato stays cheap.
const TL = 4096;
function table(weights) {
  const t = new Float32Array(TL + 1);
  weights.forEach((w, k) => { if (!w) return; const n = k + 1; for (let i = 0; i <= TL; i++) t[i] += w * Math.sin(TAU * n * i / TL); });
  let p = 0; for (const v of t) p = Math.max(p, Math.abs(v)); for (let i = 0; i <= TL; i++) t[i] /= p || 1;
  return t;
}
const bell = (f, peaks) => peaks.reduce((s, [pk, w, a]) => s + a * Math.exp(-(Math.log2(f / pk) ** 2) / (2 * w * w)), 0);
const VOICES = {
  // a bowed string: a sawtooth shaped by the wooden body (resonances), rolled off at the top
  violin: f0 => harm(f0, 28, (n, f) => (1 / n) * (0.25 + bell(f, [[290, 0.35, 0.8], [470, 0.3, 0.6], [1050, 0.5, 0.5], [2700, 0.45, 1.0]])) * Math.exp(-f / 7000)),
  viola: f0 => harm(f0, 28, (n, f) => (1 / n) * (0.3 + bell(f, [[230, 0.35, 0.8], [400, 0.3, 0.6], [900, 0.5, 0.4], [2200, 0.45, 0.7]])) * Math.exp(-f / 5500)),
  cello: f0 => harm(f0, 30, (n, f) => (1 / n) * (0.3 + bell(f, [[110, 0.35, 0.7], [220, 0.35, 0.8], [600, 0.5, 0.4], [1500, 0.5, 0.5]])) * Math.exp(-f / 4200)),
  clarinet: f0 => harm(f0, 24, (n, f) => (n % 2 ? 1 : (f > 1700 ? 0.5 : 0.07)) / n ** 1.05 * (0.4 + bell(f, [[1500, 0.6, 0.6]])) * Math.exp(-f / 4500)),
  flute: f0 => [1, 0.42, 0.16, 0.08, 0.035, 0.015],
  harmonium: f0 => harm(f0, 22, (n, f) => n ** -0.8 * (0.5 + bell(f, [[1200, 0.5, 1.1], [2600, 0.4, 0.4]])) * Math.exp(-f / 4800)),
  glass: f0 => [1, 0.07, 0.035],
};
function harm(f0, N, w) { const a = []; for (let n = 1; n <= N; n++) { const f = n * f0; a.push(f < SR * 0.45 ? w(n, f) : 0); } return a; }
const SUSTAIN = {
  violin: { attack: 0.16, release: 0.32, vib: [5.4, 0.0042, 0.3], noise: 0.01 },
  viola: { attack: 0.18, release: 0.35, vib: [5.0, 0.004, 0.32], noise: 0.009 },
  cello: { attack: 0.2, release: 0.4, vib: [4.8, 0.0035, 0.35], noise: 0.008 },
  section: { attack: 0.35, release: 0.6, vib: [5.0, 0.003, 0.4], noise: 0.006, chorus: [-7, 0, 6] },
  clarinet: { attack: 0.05, release: 0.12, vib: [4.5, 0.0006, 0.5], noise: 0.012 },
  flute: { attack: 0.06, release: 0.12, vib: [5.1, 0.0045, 0.18], noise: 0.06 },
  harmonium: { attack: 0.09, release: 0.18, vib: [0, 0, 0], noise: 0.004, chorus: [-3.5, 3.5], trem: [0.23, 0.04] },
  glass: { attack: 0.45, release: 0.9, vib: [6.2, 0.0012, 0.2], noise: 0, trem: [6.2, 0.06] },
};
function sustained(kind, m, d, v) {
  const f0 = mtof(m), voice = kind === 'section' ? 'cello' : kind, spec = SUSTAIN[kind];
  // softer notes are darker: tilt the harmonics
  const tilt = (1 - v) * 0.7, w = VOICES[voice](f0).map((a, k) => a * (k + 1) ** -tilt);
  const tab = table(w), n = secs(d + spec.release * 1.6), out = new Float32Array(n);
  const chorus = spec.chorus || [0], [vr, vd, vdel] = spec.vib;
  for (const c of chorus) {
    const fc = f0 * 2 ** ((c + rand(-1.5, 1.5)) / 1200), ph0 = rand(0, TL), vph = rand(0, TAU), vrate = vr * rand(0.94, 1.06);
    let ph = ph0;
    for (let i = 0; i < n; i++) {
      const t = i / SR, vib = vd ? vd * Math.min(1, Math.max(0, (t - vdel) / 0.4)) * Math.sin(TAU * vrate * t + vph) : 0;
      ph += fc * (1 + vib) * TL / SR; if (ph >= TL) ph -= TL * Math.floor(ph / TL);
      const k = ph | 0, fr = ph - k;
      out[i] += (tab[k] + (tab[k + 1] - tab[k]) * fr) / chorus.length;
    }
  }
  if (spec.noise) { // bow hair, breath or reed wind, tuned near the note
    const nz = biquad(noise(n), 'bp', Math.min(SR * 0.4, kind === 'flute' ? f0 * 2 : 2600), kind === 'flute' ? 2.5 : 0.9);
    mixInto(out, nz, spec.noise * 6);
  }
  const [tr, td] = spec.trem || [0, 0], tph = rand(0, TAU);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let e = 1 - Math.exp(-t / (spec.attack / 3));
    if (t > d) e *= Math.exp(-(t - d) / (spec.release / 3));
    e *= 1 + 0.06 * Math.sin(Math.PI * Math.min(1, t / Math.max(d, 0.01))) * (kind === 'clarinet' || kind === 'flute' ? 1 : 0.5);
    if (td) e *= 1 - td + td * Math.sin(TAU * tr * t + tph);
    out[i] *= e * (0.35 + 0.65 * v);
  }
  return out;
}

// The upright piano: partials stretched by string stiffness, two strings a touch out of tune with each other,
// a fast and a slow decay, a felt hammer thump, and dampers that stop the note when the key is let go.
function piano(m, d, v, { felt = false } = {}) {
  const f0 = mtof(m), B = 0.00012 * 2 ** ((m - 60) / 18), T0 = Math.min(11, Math.max(0.7, 6.5 * 2 ** (-(m - 45) / 20)));
  const damped = m < 89, len = damped ? d + 0.5 : Math.min(d + 2, T0 * 1.2);
  const n = secs(len + 0.05), out = new Float32Array(n), detune = rand(0.6, 1.6) * (R() < 0.5 ? -1 : 1);
  const bright = felt ? 0.55 + 0.35 * v : 0.75 + 0.5 * v;
  for (let k = 1; k <= 30; k++) {
    const f = k * f0 * Math.sqrt(1 + B * k * k); if (f > SR * 0.45) break;
    let a = Math.abs(Math.sin(Math.PI * k * 0.122)) / k ** (2.1 - bright) * Math.exp(-f / (felt ? 2600 : 4200));
    const tau = T0 / (1 + 0.32 * (k - 1) ** 1.15), ph = rand(0, TAU);
    // prompt sound and aftersound (two strings drifting apart in phase)
    partial(out, 0, f, a * 0.55, tau * 0.28, ph);
    partial(out, 0, f, a * 0.25, tau, ph);
    partial(out, 0, f * 2 ** (detune / 1200), a * 0.25, tau, ph + 0.3);
  }
  const th = biquad(burst(0.02, 0.0008, felt ? 0.006 : 0.004), 'lp', felt ? 900 : 2200);
  mixInto(out, th, (felt ? 0.05 : 0.08) * v);
  const knock = ring(burst(0.03, 0.0005, 0.003), 95 + rand(-8, 8), 0.04);
  mixInto(out, knock, 0.035 * v);
  for (let i = 0; i < n; i++) { const t = i / SR; out[i] *= (0.25 + 0.75 * v) * (damped && t > d ? Math.exp(-(t - d) / 0.09) : 1) * Math.min(1, (len + 0.05 - t) / 0.04); }
  return out;
}
// Plucked and struck things built from decaying partials: [ratio, amplitude, decay seconds at middle C]
const STRUCK = {
  musicbox: { p: [[1, 1, 1.4], [2, 0.06, 0.5], [5.93, 0.32, 0.14], [9.8, 0.1, 0.05]], click: 0.12, clickF: 6000 },
  celesta: { p: [[1, 1, 1.9], [2, 0.12, 0.6], [3.01, 0.05, 0.3], [4.12, 0.09, 0.14]], click: 0.06, clickF: 3000 },
  harp: { pluck: 0.3, tau: 2.4, slope: 1.35, click: 0.04, clickF: 2500 },
  pizz: { pluck: 0.22, tau: 0.55, slope: 1.5, click: 0.08, clickF: 1200, body: true },
};
function struck(kind, m, v) {
  const s = STRUCK[kind], f0 = mtof(m), pitchScale = 2 ** (-(m - 60) / 24);
  const parts = s.p || Array.from({ length: 16 }, (_, k) => [k + 1, Math.abs(Math.sin(Math.PI * (k + 1) * s.pluck)) / (k + 1) ** s.slope, s.tau / (1 + 0.55 * k)]);
  const longest = Math.max(...parts.map(p => p[2])) * pitchScale * 5;
  const n = secs(Math.min(6, longest + 0.05)), out = new Float32Array(n);
  for (const [r, a, tau] of parts) {
    const f = f0 * r * (s.p ? 1 : (1 + 0.0004 * r * r));
    partial(out, 0, f, a * (r > 1.5 ? 0.6 + 0.6 * v : 1), tau * pitchScale * (s.body && f > 700 ? 0.5 : 1), rand(0, TAU));
  }
  if (s.click) mixInto(out, biquad(burst(0.012, 0.0002, 0.0018), 'bp', s.clickF, 1.2), s.click * v);
  if (s.body) { const b = ring(burst(0.03, 0.0005, 0.004), 180, 0.05); mixInto(out, b, 0.05 * v); }
  for (let i = 0; i < n; i++) out[i] *= (0.3 + 0.7 * v) * Math.min(1, (n - i) / (0.02 * SR));
  return out;
}
function instrument(inst, m, d, v) {
  if (inst === 'piano') return piano(m, d, v);
  if (inst === 'felt') return piano(m, d, v, { felt: true });
  if (STRUCK[inst]) return struck(inst, m, v);
  return sustained(inst, m, d, v);
}

/* ------------------------------------------------------------------ notation */
const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const acc = a => a === '#' ? 1 : a === 'b' ? -1 : 0;
function midiOf(name) { const m = /^([A-G])([#b]?)(-?\d)$/.exec(name); if (!m) throw Error('bad note ' + name); return 12 * (+m[3] + 1) + PC[m[1]] + acc(m[2]); }
// "A4:2 D5:1 | E5:3" -> [{beat, m, d}], checking that every bar adds up
function melody(text, meter, cue) {
  const notes = []; let beat = 0;
  text.split('|').forEach((bar, b) => {
    let sum = 0;
    for (const tok of bar.trim().split(/\s+/).filter(Boolean)) {
      const [name, len] = tok.split(':'); const d = +len;
      if (!(d > 0)) throw Error(`${cue} bar ${b + 1}: bad length in ${tok}`);
      if (name !== 'r') notes.push({ beat: beat + sum, m: midiOf(name), d });
      sum += d;
    }
    if (Math.abs(sum - meter) > 1e-6) throw Error(`${cue} bar ${b + 1} has ${sum} beats, not ${meter}`);
    beat += meter;
  });
  return { notes, beats: beat };
}
const QUAL = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], m6: [0, 3, 7, 9], 6: [0, 4, 7, 9],
  dim: [0, 3, 6], dim7: [0, 3, 6, 9], m7b5: [0, 3, 6, 10], sus4: [0, 5, 7], '7sus4': [0, 5, 7, 10], aug: [0, 4, 8], add9: [0, 4, 7, 14] };
function chord(sym) {
  const m = /^([A-G])([#b]?)([a-z0-9]*?)(?:\/([A-G])([#b]?))?$/.exec(sym);
  if (!m || !QUAL[m[3]]) throw Error('bad chord ' + sym);
  const root = (PC[m[1]] + acc(m[2]) + 12) % 12;
  return { root, iv: QUAL[m[3]], bass: m[4] ? (PC[m[4]] + acc(m[5]) + 12) % 12 : root, sym };
}
const inRange = (pc, lo) => lo + (((pc - lo) % 12) + 12) % 12;
// close voicing between lo and lo+12, optionally dropping the fifth when there are four tones
function voicing(c, lo, { drop5 = false } = {}) {
  let iv = c.iv; if (drop5 && iv.length > 3) iv = iv.filter(i => i !== 7);
  return iv.map(i => inRange((c.root + i) % 12, lo)).sort((a, b) => a - b);
}
const bassNote = (c, lo) => inRange(c.bass, lo);
const tone = (c, i, lo) => inRange((c.root + c.iv[i % c.iv.length]) % 12, lo);

/* ------------------------------------------------------------------ the score */
// Each cue: tempo, beats a bar, a chord a bar ("Dm,A7" splits a bar), melody lines, and an accompaniment
// written as a function of the bar. put(beat, midi, beats, instrument, level).
const CUES = {
  // Your desk: reading music. A slow parlour piano in D, two chords rocking like a Satie piece, the tune high and
  // sparse so it never talks over the words.
  bench_keys: {
    bpm: 64, meter: 3, room: { rt: 2.2, size: 0.8, mix: 0.3 },
    chords: 'Gmaj7 Dmaj7 Gmaj7 Dmaj7 Em7 A7sus4 Dmaj7 Bm7 Gmaj7 F#m7 Em7 Bm7 Gmaj7 Em7 A7sus4 A7',
    lines: [['felt', 0.5, 'r:3 | A4:2 D5:1 | E5:3 | r:1 F#5:1 E5:1 | B4:3 | r:1 A4:1 D5:1 | C#5:2 A4:1 | B4:3 | r:1 D5:1 F#5:1 | E5:2 C#5:1 | D5:1 B4:1 G4:1 | A4:3 | r:1 B4:1 D5:1 | F#5:2 E5:1 | D5:2 E5:1 | C#5:3']],
    accomp(c, bar, put) {
      put(0, bassNote(c, 38), 3, 'felt', 0.42);
      for (const m of voicing(c, 57, { drop5: true })) put(1, m, 2, 'felt', 0.3);
    },
  },
  // Union Street at dusk: a slow waltz in G minor, piano and a clarinet, the town's evening.
  street: {
    bpm: 80, meter: 3, room: { rt: 1.6, size: 1.2, mix: 0.24, tone: 4200 },
    chords: 'Gm Gm Cm7 D7 Gm Eb Am7b5 D7 Bb F7 Gm Eb Cm D7 Gm D7',
    lines: [['clarinet', 0.46, 'D5:2 Bb4:1 | G4:2 A4:1 | Bb4:1 C5:1 Eb5:1 | D5:2 r:1 | G5:1.5 F#5:0.5 G5:1 | Bb5:2 G5:1 | A5:1 G5:1 Eb5:1 | F#5:3 | F5:2 D5:1 | C5:1 Eb5:1 A4:1 | Bb4:2 G4:1 | Bb4:1 Eb5:1 G5:1 | G5:1.5 F5:0.5 Eb5:1 | D5:1 C5:1 A4:1 | G4:3 | r:2 D5:1']],
    accomp(c, bar, put) {
      put(0, bassNote(c, 36), 1, 'piano', 0.5);
      for (const b of [1, 2]) for (const m of voicing(c, 55, { drop5: true })) put(b, m, 0.7, 'piano', b === 1 ? 0.27 : 0.22);
      if (bar % 4 === 3) put(2, bassNote(c, 36) + 7, 1, 'pizz', 0.25);
    },
  },
  // The evening train: a rocking 6/8 in D (counted in quavers), arpeggiated piano and a clarinet, pizzicato
  // under it. The wheels on the rail joints are the ambience bed, not the music.
  train: {
    bpm: 176, meter: 6, room: { rt: 1.1, size: 0.6, mix: 0.18, tone: 4000 },
    chords: 'D Bm G A7 D F#m Em7 A7 Bm Bm/A G D/F# Em7 A7 D A7',
    lines: [['clarinet', 0.44, 'F#5:3 E5:1 D5:2 | D5:3 B4:3 | G4:2 B4:1 D5:2 E5:1 | E5:3 C#5:3 | A5:3 F#5:1 A5:2 | F#5:3 C#5:3 | D5:2 E5:1 G5:3 | E5:6 | D5:3 C#5:1 B4:2 | F#5:3 D5:3 | B5:3 A5:1 G5:2 | F#5:4 E5:2 | G5:3 E5:3 | C#5:3 E5:1 G5:2 | F#5:3 D5:3 | A4:3 r:3']],
    accomp(c, bar, put) {
      const b = bassNote(c, 38), v = voicing(c, 54, { drop5: true });
      put(0, b, 2.6, 'piano', 0.4); put(3, inRange((c.root + 7) % 12, 40), 2.6, 'piano', 0.3);
      for (const [beat, i] of [[1, 0], [2, 1], [4, 2], [5, 1]]) put(beat, v[i % v.length] + (beat === 2 ? 0 : 0), 0.9, 'piano', 0.2);
      put(0, b - 12, 2, 'pizz', 0.3);
    },
  },
  // The Entrance Hall: hushed and a little grand. A reed organ holds the chords, low strings walk under it,
  // a celesta carries the tune. F major, a hymn-like turn for a Victorian society.
  entrance: {
    bpm: 58, meter: 4, room: { rt: 3.0, size: 1.4, mix: 0.34 },
    chords: 'F C/E Dm Am Bb F/A Gm7 C7 Dm Bbmaj7 Gm7 C7',
    lines: [['celesta', 0.5, 'C6:2 A5:2 | G5:3 E5:1 | F5:2 D5:1 E5:1 | C5:4 | D5:2 F5:2 | A5:2 C6:1 A5:1 | Bb5:2 G5:1 F5:1 | E5:3 r:1 | A5:2 F5:1 D5:1 | A5:3 r:1 | G5:1 F5:1 D5:1 Bb4:1 | C5:2 E5:1 G5:1']],
    accomp(c, bar, put) {
      for (const m of voicing(c, 53)) put(0, m, 4, 'harmonium', 0.2);
      put(0, bassNote(c, 36), 4, 'section', 0.3);
    },
  },
  // Gesner's cabinet of curiosities: a music-box waltz in A minor, plucked strings, a little odd.
  gesner: {
    bpm: 86, meter: 3, room: { rt: 1.9, size: 1.0, mix: 0.27 },
    chords: 'Am E7/G# Am Dm/F E7 Am B7 E7 Am Am/G F E7 Dm Am/E E7 Am',
    lines: [['musicbox', 0.5, 'E5:1 A5:1 C6:1 | B5:1.5 G#5:0.5 E5:1 | A5:1 C6:0.5 B5:0.5 A5:1 | F5:2 D5:1 | E5:0.5 F5:0.5 G#5:1 B5:1 | C6:1 B5:1 A5:1 | D#5:1 F#5:1 A5:1 | G#5:2 r:1 | E6:1 C6:1 A5:1 | B5:1 C6:0.5 B5:0.5 A5:1 | A5:1.5 G5:0.5 F5:1 | E5:1 G#5:1 B5:1 | D6:1 A5:1 F5:1 | E5:1 A5:1 C6:1 | B5:1 D6:0.5 B5:0.5 G#5:1 | A5:2 r:1']],
    accomp(c, bar, put) {
      put(0, bassNote(c, 40), 1, 'pizz', 0.5);
      for (const b of [1, 2]) for (const m of voicing(c, 57, { drop5: true })) put(b, m, 0.5, 'pizz', 0.2);
      if (bar % 2 === 1) put(0, bassNote(c, 40), 3, 'clarinet', 0.12);
    },
  },
  // The fossils of Saint John, 300 million years old: slow, deep and strange. Low strings hold an E pedal, a
  // reed organ breathes under them, and a glass armonica (Franklin's, 1761) sings.
  fossils: {
    bpm: 50, meter: 4, room: { rt: 4.2, size: 1.6, mix: 0.4, tone: 4200 },
    chords: 'Em Em Cmaj7/E Cmaj7/E Am/E F/E Em B7/D# Em/D Cmaj7 Am6 B7',
    lines: [['glass', 0.5, 'B4:4 | r:2 E5:2 | D5:4 | B4:4 | C5:3 E5:1 | F5:4 | E5:2 D5:1 B4:1 | D#5:4 | E5:2 G5:2 | B5:3 G5:1 | F#5:4 | D#5:2 F#5:2']],
    accomp(c, bar, put) {
      put(0, bassNote(c, 28), 4, 'section', 0.34);
      for (const m of voicing(c, 52, { drop5: true })) put(0, m, 4, 'harmonium', 0.11);
      if (bar % 4 === 1) put(2.5, tone(c, 0, 76), 1, 'celesta', 0.14);
    },
  },
  // Birds and mammals: lighter, a pastoral G major. Flute, harp and pizzicato.
  birds: {
    bpm: 92, meter: 4, room: { rt: 2.0, size: 1.1, mix: 0.27 },
    chords: 'G Em C D7 G Bm C D Em C G/B Am7 G/D D7 G D7',
    lines: [['flute', 0.44, 'D5:1 G5:0.5 A5:0.5 B5:2 | G5:1 E5:1 B4:2 | C5:0.5 E5:0.5 G5:1 C6:1 B5:1 | A5:3 r:1 | B5:1 D6:0.5 B5:0.5 G5:2 | F#5:1 D5:1 B4:2 | E5:1 G5:1 E5:1 C5:1 | D5:3 r:1 | E5:0.5 F#5:0.5 G5:1 B5:2 | A5:1 G5:1 E5:2 | D5:1 G5:1 B5:1 D6:1 | C6:1.5 B5:0.5 A5:2 | B5:2 G5:1 D5:1 | F#5:1 A5:1 C6:2 | B5:3 r:1 | r:2 A5:0.5 F#5:0.5 D5:1']],
    accomp(c, bar, put) {
      const v = voicing(c, 55), up = [...v, v[0] + 12, v[1] + 12];
      [0, 1, 2, 3, 4, 3, 2, 1].forEach((k, i) => put(i * 0.5, up[k], 1.5, 'harp', i === 0 ? 0.3 : 0.2));
      put(0, bassNote(c, 36), 1, 'pizz', 0.42); put(2, inRange((c.root + 7) % 12, 36), 1, 'pizz', 0.3);
    },
  },
  // The offices: warm and working. A string quartet in B flat.
  office: {
    bpm: 70, meter: 4, room: { rt: 1.3, size: 0.7, mix: 0.22 },
    chords: 'Bb Gm Eb F7 Bb/D Cm7 F7 Bb Ebmaj7 Dm7 Cm7 F7',
    lines: [['violin', 0.42, 'F5:2 D5:1 Bb4:1 | D5:3 C5:1 | Bb4:2 G5:2 | F5:2 Eb5:2 | D5:1 F5:1 Bb5:2 | G5:2 Eb5:2 | F5:1 Eb5:1 C5:1 A4:1 | Bb4:3 r:1 | G5:2 Bb5:2 | A5:3 F5:1 | Eb5:2 C5:2 | D5:2 C5:1 A4:1']],
    accomp(c, bar, put) {
      const v = voicing(c, 55, { drop5: true });
      put(0, v[v.length - 1], 4, 'violin', 0.16); put(0, v[0], 4, 'viola', 0.2);
      put(0, bassNote(c, 36), 2, 'cello', 0.3); put(2, bassNote(c, 36), 2, 'cello', 0.24);
    },
  },
  // The stacks in the basement: dim, curious, a bit of a mystery. A pizzicato bass walks, a low clarinet
  // wonders, a celesta drips now and then.
  stacks: {
    bpm: 64, meter: 4, room: { rt: 2.6, size: 1.3, mix: 0.36, tone: 3600 },
    chords: 'Dm Dm/C Bbmaj7 A7 Dm Gm/Bb E7 A7 F C7/E Dm A7',
    lines: [['clarinet', 0.44, 'A4:2 F4:1 D4:1 | E4:2 F4:2 | D4:3 r:1 | C#4:2 E4:1 G4:1 | F4:2 A4:2 | Bb4:3 G4:1 | G#4:2 B4:1 D5:1 | C#5:3 r:1 | C5:2 A4:1 F4:1 | G4:2 Bb4:2 | A4:1 F4:1 E4:1 D4:1 | E4:2 C#4:2']],
    accomp(c, bar, put, next) {
      const b = bassNote(c, 33), five = inRange((c.root + 7) % 12, 33), nb = bassNote(next, 33);
      const approach = nb + (b > nb ? 1 : -1);
      [b, five, tone(c, 1, 33), approach].forEach((m, i) => put(i, m, 0.9, 'pizz', i ? 0.34 : 0.42));
      for (const m of voicing(c, 50, { drop5: true })) put(0, m, 4, 'viola', 0.09);
      if (bar % 3 === 2) put(2.5, tone(c, 2, 79), 1, 'celesta', 0.16);
    },
  },
};

function renderCue(name, cue) {
  reseed([...name].reduce((s, ch) => s * 31 + ch.charCodeAt(0), 7));
  const beat = 60 / cue.bpm, chords = cue.chords.split(/\s+/), notes = [];
  const put = (at, m, d, inst, v) => notes.push({ at, m, d, inst, v });
  for (const [inst, v, text] of cue.lines) {
    const mel = melody(text, cue.meter, name);
    if (mel.beats !== chords.length * cue.meter) throw Error(`${name}: melody has ${mel.beats / cue.meter} bars, chords ${chords.length}`);
    for (const n of mel.notes) put(n.beat, n.m, n.d, inst, v * (0.9 + 0.12 * Math.sin(n.beat * 0.7)));
  }
  chords.forEach((sym, bar) => {
    const halves = sym.split(','), nextSym = chords[(bar + 1) % chords.length].split(',')[0];
    halves.forEach((s, h) => {
      const len = cue.meter / halves.length, start = bar * cue.meter + h * len;
      const p = (at, m, d, inst, v) => { if (at < len) put(start + at, m, Math.min(d, len * 4), inst, v); };
      cue.accomp(chord(s), bar, p, chord(nextSym));
    });
  });
  const L = secs(chords.length * cue.meter * beat), dry = new Float32Array(L * 2 + secs(8));
  const cache = new Map();
  for (const n of notes) {
    const humanT = STRUCK[n.inst] || n.inst === 'piano' || n.inst === 'felt' ? rand(-0.008, 0.012) : rand(0, 0.02);
    const vel = Math.min(1, Math.max(0.05, n.v * 1.6 * rand(0.9, 1.08)));
    const key = n.inst + n.m + n.d + vel.toFixed(2);
    const s = cache.get(key) || instrument(n.inst, n.m, n.d * beat, vel); cache.set(key, s);
    const at = secs(Math.max(0, n.at * beat + humanT));
    add(dry, at, s, n.v); add(dry, at + L, s, n.v);
  }
  const { rt, size, mix, tone: tn } = cue.room;
  const wet = reverb(dry, { rt, size, tone: tn || 5200 });
  let mixd = mixInto(dry.slice(), wet, mix * 1.4);
  // a warm old room: no rumble, a softened top, a little body
  mixd = biquad(mixd, 'hp', 45, 0.7); mixd = biquad(mixd, 'highshelf', 6500, 0.7, -4); mixd = biquad(mixd, 'peak', 250, 0.8, 1.5);
  write(name, mixd.slice(L, 2 * L), { rms: 0.13 });
}

/* ------------------------------------------------------------------ sound effects */
// Horse hooves on the packed-earth road of Union Street. A shod hoof makes a hollow knock (the hoof wall rings
// like a coconut shell: two resonances around 450 and 1000 Hz), a dull thud from the ground, a tick of iron on
// grit, then a scatter of gravel. Four takes, so the four-beat walk never repeats itself.
function hoof(k) {
  reseed(500 + k);
  const n = secs(0.32), out = new Float32Array(n);
  const ex = burst(0.012, 0.0003, 0.0022 + 0.0008 * (k % 3));
  mixInto(out, ring(ex, rand(400, 520), 0.028), 1.0);
  mixInto(out, ring(ex, rand(880, 1150), 0.018), 0.55);
  mixInto(out, ring(ex, rand(1700, 2100), 0.008), 0.25);
  mixInto(out, ring(burst(0.03, 0.001, 0.006), rand(130, 180), 0.045), 0.9);     // the ground
  mixInto(out, biquad(burst(0.004, 0.0001, 0.0006), 'hp', 3000), 0.5);           // iron tick
  mixInto(out, ring(ex, rand(2900, 3400), 0.012), 0.12);                         // the shoe rings, just
  const grit = new Float32Array(n);                                              // gravel scattering
  for (let g = 0; g < 18; g++) { const at = secs(0.004 + rand(0, 0.09) ** 1.6); add(grit, at, burst(0.003, 0.0001, 0.0005), rand(0.1, 0.5) * Math.exp(-at / SR / 0.05)); }
  mixInto(out, biquad(grit, 'hp', 1800), 0.5);
  if (k % 2) { const scuff = biquad(burst(0.09, 0.02, 0.03), 'bp', 1400, 0.8); add(out, secs(0.05), scuff, 0.08); } // a slight drag
  return out;
}
// The cab rolling: iron tyres on packed earth and gravel, the body creaking on its springs, the harness
// jingling. A loop; the game turns it up with the cab's speed.
function cabRoll() {
  reseed(600);
  const L = secs(6), out = new Float32Array(L);
  // rumble: two passes so the filters wrap round the loop
  const nz = loopNoise(L), rum = biquad(biquad(nz, 'lp', 160, 0.7), 'lp', 160, 0.7);
  for (let i = 0; i < L; i++) { const t = i / SR; out[i] += rum[i + L] * 1.6 * (0.75 + 0.25 * Math.sin(TAU * t / 1.5)); }
  const grit = new Float32Array(L);
  for (let g = 0; g < 360; g++) add(grit, secs(rand(0, 6)), burst(0.004, 0.0001, 0.0007), rand(0.05, 0.45), true);
  mixInto(out, biquad(grit, 'hp', 1500), 0.5);
  const crunch = biquad(loopNoise(L), 'bp', 900, 0.6);
  for (let i = 0; i < L; i++) out[i] += crunch[i + L] * 0.12 * (0.6 + 0.4 * Math.sin(TAU * i / SR / 0.75) ** 2);
  for (const at of [0.7, 2.9, 4.6]) { // the body creaks on its leather braces
    const len = rand(0.25, 0.4), c = creakPulse(len, rand(140, 190), rand(-60, 40));
    add(out, secs(at), biquad(biquad(c, 'bp', 700, 3), 'peak', 1500, 4, 6), 0.18, true);
  }
  for (let j = 0; j < 7; j++) add(out, secs(rand(0, 6)), jingle(), rand(0.08, 0.16), true);
  return out;
}
// a stick-slip creak: a train of tiny clicks whose rate wanders
function creakPulse(len, f, sweep) {
  const n = secs(len), out = new Float32Array(n); let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n, rate = f + sweep * t + 25 * Math.sin(TAU * 7 * t) + rand(-20, 20);
    ph += rate / SR; if (ph >= 1) { ph -= 1; out[i] += rand(0.6, 1); }
  }
  for (let i = 0; i < n; i++) out[i] *= Math.sin(Math.PI * i / n) ** 0.6;
  return out;
}
function jingle() { // a buckle or a harness ring tapping
  const n = secs(0.08), out = new Float32Array(n), f = rand(2900, 3600);
  for (const [r, a, tau] of [[1, 1, 0.03], [1.48, 0.6, 0.02], [2.3, 0.4, 0.012]]) partial(out, 0, f * r, a, tau, rand(0, TAU));
  return out;
}
// Footsteps in 1910 leather-soled shoes: heel, then the sole a beat later. Museum boards ring low; stone (the
// flagstone sidewalk, the basement) is all click and grit.
function step(floor, k) {
  reseed(700 + k + (floor === 'stone' ? 50 : 0));
  const n = secs(0.3), out = new Float32Array(n), toe = secs(rand(0.045, 0.07));
  if (floor === 'wood') {
    const ex = burst(0.01, 0.0002, 0.0015);
    mixInto(out, ring(ex, rand(170, 210), 0.07), 1.3);   // the floorboards
    mixInto(out, ring(ex, rand(480, 620), 0.025), 0.7);
    mixInto(out, ring(ex, rand(1300, 1700), 0.01), 0.35);
    mixInto(out, biquad(burst(0.004, 0.0001, 0.0005), 'hp', 2500), 0.3);
    const sole = burst(0.03, 0.002, 0.006);
    add(out, toe, ring(sole, rand(500, 700), 0.015), 0.35); add(out, toe, biquad(sole, 'bp', 2600, 0.8), 0.12);
    if (k === 3) add(out, secs(0.06), biquad(creakPulse(0.18, 220, -40), 'bp', 900, 4), 0.05); // a board gives a little
  } else {
    const ex = burst(0.008, 0.0001, 0.0009);
    mixInto(out, ring(ex, rand(1900, 2400), 0.008), 0.9);
    mixInto(out, ring(ex, rand(3200, 3900), 0.005), 0.5);
    mixInto(out, ring(burst(0.02, 0.0005, 0.003), rand(260, 340), 0.02), 0.5);
    mixInto(out, biquad(burst(0.003, 0.0001, 0.0004), 'hp', 3500), 0.5);
    const sole = biquad(burst(0.05, 0.004, 0.012), 'bp', 3000, 0.7);       // the sole scuffs the grit
    add(out, toe, sole, 0.25);
    for (let g = 0; g < 6; g++) add(out, toe + secs(rand(0, 0.03)), biquad(burst(0.002, 0.0001, 0.0003), 'hp', 2500), rand(0.05, 0.2));
  }
  return out;
}
// A heavy panelled door: the latch, the hinge, the door swinging to, the latch again.
function door() {
  reseed(800);
  const out = new Float32Array(secs(1.5));
  const latch = () => { const o = new Float32Array(secs(0.1)); for (const [f, a, t] of [[2700, 1, 0.012], [4100, 0.6, 0.008], [1350, 0.5, 0.02]]) partial(o, 0, f * rand(0.97, 1.03), a, t, rand(0, TAU)); mixInto(o, biquad(burst(0.005, 0.0001, 0.001), 'hp', 2000), 0.6); return o; };
  add(out, 0, latch(), 0.5);
  const cr = creakPulse(0.62, 150, -55);
  let hinge = mixInto(mixInto(biquad(cr, 'bp', 820, 7), biquad(cr, 'bp', 1650, 9), 0.7), biquad(cr, 'bp', 2700, 10), 0.4);
  add(out, secs(0.08), hinge, 2.2);
  const thud = mixInto(ring(burst(0.03, 0.001, 0.006), 85, 0.09), ring(burst(0.03, 0.001, 0.004), 290, 0.035), 0.6);
  add(out, secs(0.95), thud, 1.0); add(out, secs(0.97), latch(), 0.4);
  return mixInto(out, reverb(out, { rt: 0.9, size: 0.6 }), 0.25);
}
// Paper: a card slid out and turned over. A soft swish and a crackle of stiff paper.
function paper() {
  reseed(900);
  const n = secs(0.36), out = new Float32Array(n), sw = biquad(noise(n), 'bp', 2200, 0.6);
  for (let i = 0; i < n; i++) { const t = i / n; out[i] = sw[i] * Math.sin(Math.PI * Math.min(1, t * 1.15)) ** 1.5 * 0.35; }
  for (let g = 0; g < 22; g++) { const at = secs(rand(0.03, 0.3)); add(out, at, biquad(burst(0.006, 0.0002, 0.0012), 'bp', rand(3000, 6000), 1.2), rand(0.1, 0.45)); }
  return out;
}
// The rubber stamp: a firm thunk into the desk's oak, the rubber squashing, a tiny lift.
function stamp() {
  reseed(950);
  const out = new Float32Array(secs(0.45));
  mixInto(out, ring(burst(0.03, 0.001, 0.006), 95, 0.07), 1.0);
  mixInto(out, ring(burst(0.02, 0.0005, 0.003), 240, 0.04), 0.7);
  mixInto(out, ring(burst(0.02, 0.0005, 0.002), 520, 0.02), 0.4);
  mixInto(out, biquad(burst(0.04, 0.001, 0.01), 'lp', 700), 0.5);
  add(out, secs(0.2), biquad(burst(0.02, 0.001, 0.004), 'bp', 1800, 1.5), 0.12);
  return out;
}
// A record box lifted from the shelf: a slide of cardboard on wood and a soft set-down.
function box() {
  reseed(960);
  const out = new Float32Array(secs(0.55)), n = secs(0.3), sl = biquad(noise(n), 'bp', 1100, 0.7);
  for (let i = 0; i < n; i++) out[i] += sl[i] * Math.sin(Math.PI * i / n) * 0.3;
  add(out, secs(0.3), ring(burst(0.03, 0.001, 0.006), 160, 0.06), 0.8);
  add(out, secs(0.3), ring(burst(0.02, 0.001, 0.004), 420, 0.03), 0.4);
  return out;
}
// Rail joints under a wooden coach: a steady rumble, and each wheel pair knocks over a joint, clickety-clack.
function rail() {
  reseed(1000);
  const L = secs(6.4), out = new Float32Array(L), nz = loopNoise(L);
  const rum = biquad(biquad(nz, 'lp', 140), 'lp', 140), body = biquad(nz, 'bp', 320, 1.5);
  for (let i = 0; i < L; i++) { const t = i / SR; out[i] = rum[i + L] * 2.2 * (0.85 + 0.15 * Math.sin(TAU * t / 3.2)) + body[i + L] * 0.12; }
  const knock = () => { const ex = burst(0.03, 0.0005, 0.004), o = ring(ex, rand(160, 200), 0.06); mixInto(o, ring(ex, rand(650, 760), 0.02), 0.5); mixInto(o, ring(ex, rand(1800, 2100), 0.008), 0.25); return o; };
  for (let j = 0; j < 8; j++) {
    const at = j * 0.8; // this coach's rear truck, then the next coach's front truck
    for (const [d, g] of [[0, 0.36], [0.13, 0.28], [0.42, 0.22], [0.55, 0.18]]) add(out, secs(at + d + rand(-0.004, 0.004)), knock(), g * rand(0.85, 1.1), true);
  }
  for (let r = 0; r < 40; r++) add(out, secs(rand(0, 6.4)), biquad(burst(0.006, 0.0002, 0.0012), 'bp', rand(2500, 4000), 3), rand(0.02, 0.06), true); // a window rattles
  return out;
}
// The street at night. A light wind, the harbour's bell buoy rolling, and far off the fog horn on Partridge
// Island (Robert Foulis's steam fog horn, the first in the world, 1859; true). One blast a loop.
function street() {
  reseed(1100);
  const L = secs(40), out = new Float32Array(L), nz = loopNoise(L);
  const wind = biquad(biquad(nz, 'lp', 380), 'lp', 600), hiss = biquad(nz, 'bp', 2400, 0.5);
  for (let i = 0; i < L; i++) {
    const t = i / SR, gust = 0.6 + 0.25 * Math.sin(TAU * t / 40 * 3) + 0.15 * Math.sin(TAU * t / 40 * 7 + 1);
    out[i] = wind[i + L] * 1.6 * gust + hiss[i + L] * 0.025 * gust * gust;
  }
  const far = x => reverb(biquad(biquad(x, 'lp', 1800), 'hp', 90), { rt: 3.6, size: 2, tone: 2500, pre: 0.08 });
  const buoy = () => { const o = new Float32Array(secs(4)), f = 392; for (const [r, a, t] of [[0.5, 0.5, 2.5], [1, 1, 1.8], [1.19, 0.5, 1.2], [1.5, 0.35, 0.9], [2, 0.4, 0.7], [2.52, 0.2, 0.5], [3, 0.15, 0.35]]) partial(o, 0, f * r, a, t, rand(0, TAU)); return o; };
  for (const [at, g] of [[9, 0.12], [10.7, 0.08], [27, 0.1]]) { const b = buoy(); add(out, secs(at), mixInto(scale(b.slice(), 0.25), far(b), 1), g, true); }
  // the horn: a low reed-like tone, a slight rise as the steam comes up
  const hn = secs(3.6), horn = new Float32Array(hn);
  for (const [r, a] of [[1, 1], [2, 0.5], [3, 0.35], [4, 0.2], [5, 0.12]]) {
    let ph = 0;
    for (let i = 0; i < hn; i++) { const t = i / SR, f = 146 * r * (0.97 + 0.03 * Math.min(1, t / 0.5)); ph += TAU * f / SR; horn[i] += a * Math.sin(ph); }
  }
  for (let i = 0; i < hn; i++) { const t = i / SR; horn[i] *= Math.min(1, t / 0.45) * Math.min(1, (3.6 - t) / 1.0); }
  add(out, secs(17), far(horn), 0.16, true);
  return out;
}
// The title: a piano phrase answering the street waltz, rising to the tonic as the facade appears.
function titlePhrase() {
  reseed(1200);
  const out = new Float32Array(secs(4.2));
  for (const [at, notes, v, d] of [[0, ['G2', 'D3', 'Bb3'], 0.32, 3.6], [0.22, ['D5'], 0.38, 0.5], [0.62, ['G5'], 0.44, 0.5], [1.12, ['F#5'], 0.36, 0.42], [1.55, ['G5', 'D5', 'Bb4'], 0.42, 2.4]]) {
    for (const nm of notes) add(out, secs(at), piano(midiOf(nm), d, v), 0.5);
  }
  return mixInto(out, reverb(out, { rt: 2.2, size: 1.2 }), 0.35);
}

/* ------------------------------------------------------------------ output */
function write(name, data, { rms = 0.14, peak = 0.89, win = 0 } = {}) {
  let s = 0, p = 0; for (const v of data) { s += v * v; p = Math.max(p, Math.abs(v)); }
  let g = Math.min(rms / Math.sqrt(s / data.length), peak / p);
  if (win) { // a one-shot: set by its loudest 50 ms (what the ear hears), and round off any spike past the peak
    const w = secs(0.05); let best = 0;
    for (let a = 0; a < data.length; a += w >> 2) { let e = 0; for (let i = a; i < Math.min(data.length, a + w); i++) e += data[i] * data[i]; best = Math.max(best, Math.sqrt(e / w)); }
    g = win / best;
    for (let i = 0; i < data.length; i++) { const v = data[i] * g; data[i] = Math.abs(v) < 0.6 ? v : Math.sign(v) * (0.6 + 0.3 * Math.tanh((Math.abs(v) - 0.6) / 0.3)); }
    g = 1; p = 0.9;
  }
  writeWav(path.join(OUT, name + '.wav'), [data], SR, { gain: g });
  console.log(name.padEnd(14), (data.length / SR).toFixed(2).padStart(6) + ' s', 'peak', (p * g).toFixed(2), 'gain', g.toFixed(2));
}

const MAIN = import.meta.url === pathToFileURL(process.argv[1]).href; // imported (for tests), it renders nothing
export { burst, ring, biquad, hoof, step, piano, struck, sustained, reverb, SR, CUES, melody, chord };
if (MAIN) for (const [name, cue] of Object.entries(CUES)) if (want(name)) renderCue(name, cue);
const FX = {
  // [render, loudness]: a loop's loudness is its RMS; a one-shot's ({win}) is its loudest 50 ms
  hoof_0: [() => hoof(0), { win: 0.2 }], hoof_1: [() => hoof(1), { win: 0.18 }], hoof_2: [() => hoof(2), { win: 0.2 }], hoof_3: [() => hoof(3), { win: 0.18 }],
  cab_roll: [cabRoll, { rms: 0.11 }], rail_wheels: [rail, { rms: 0.115 }], street_air: [street, { rms: 0.1 }],
  wood_0: [() => step('wood', 0), { win: 0.09 }], wood_1: [() => step('wood', 1), { win: 0.085 }], wood_2: [() => step('wood', 2), { win: 0.09 }], wood_3: [() => step('wood', 3), { win: 0.085 }],
  stone_0: [() => step('stone', 0), { win: 0.07 }], stone_1: [() => step('stone', 1), { win: 0.065 }], stone_2: [() => step('stone', 2), { win: 0.07 }], stone_3: [() => step('stone', 3), { win: 0.065 }],
  creak: [door, { win: 0.13 }], whoosh: [paper, { win: 0.2 }], stamp: [stamp, { win: 0.23 }], box: [box, { win: 0.16 }], title_phrase: [titlePhrase, { rms: 0.13 }],
};
for (const [name, f] of Object.entries(FX)) {
  if (!MAIN || !want(name)) continue;
  const [fn, level] = f;
  write(name, fn(), level);
}
