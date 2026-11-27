// Chimera WASM interface adapted from the Props Not Included sound sketchbook.
let x = null; const enc = new TextEncoder(), dec = new TextDecoder();
const KEYS = ["jaw","tbX","tbY","ttX","ttY","ttCurl","root","lipAp","lipProt","lipWidth","labiodental","velum","larynx","epilarynx","ventricular","lateral","dorsum","abduction","closure","breath","f0","vibrato"];
const SRC_DEFAULT = [110, 0.06, 8, 0.15, 0.5, 0, 0.1, 0, 6, 5, 1, 0.25];
function call(fn, a) {
  const b = enc.encode(JSON.stringify(Object.assign({ fn }, a || {})));
  const p = x.chimera_alloc(b.length); new Uint8Array(x.memory.buffer, p, b.length).set(b);
  const s = x.chimera_call(p, b.length); x.chimera_free(p, b.length);
  const v = JSON.parse(dec.decode(new Uint8Array(x.memory.buffer, x.chimera_result_ptr(), x.chimera_result_len())));
  if (s !== 0) throw new Error(fn + ': ' + v.error); return v;
}
function writeGestures(at, gs) {
  const n = gs.length, dv = new DataView(x.memory.buffer, at, n * 272), by = new Uint8Array(x.memory.buffer, at, n * 272);
  for (let i = 0; i < n; i++) {
    const g = gs[i], o = i * 272;
    const head = [g.t0, g.t1, g.rampIn, g.rampOut, g.strength, g.speed ?? NaN, g.releaseHold ?? NaN, g.tag ?? NaN];
    for (let j = 0; j < 8; j++) dv.setFloat64(o + j * 8, head[j], true);
    for (let k = 0; k < KEYS.length; k++) dv.setFloat64(o + 64 + k * 8, NaN, true);
    for (const k in g.targets) { const j = KEYS.indexOf(k); if (j >= 0 && g.targets[k] != null) dv.setFloat64(o + 64 + j * 8, g.targets[k], true); }
    by[o + 240] = 255;
  }
  return n;
}

// The pitch, pace, tract proportions and glottal source belong to the speaker.
const cast = {
  narrator:  { pitch: 147, rate: 1.02, female: 0.45, breath: 0.20, tension: 0.43 },
  conductor: { pitch: 125, rate: 1.12, female: 0.05, breath: 0.08, tension: 0.68 },
  harrow:    { pitch: 102, rate: 0.97, female: 0.03, breath: 0.18, tension: 0.46 },
  attendant: { pitch: 190, rate: 1.04, female: 0.95, breath: 0.17, tension: 0.52 },
  you:       { pitch: 156, rate: 1.09, female: 0.49, breath: 0.14, tension: 0.50 }
};
const sr = 32000;

// What the dictionary would get wrong, said the way a person reads it aloud. The engine reads 1984 as "one
// thousand nine hundred eighty-four", "St. John" as "street John" (and stops at the full stop), and runs
// "Chapter 2 · Two" together. Only the voice hears this; the words on screen stay as written.
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const TENS_PLURAL = ['', 'tens', 'twenties', 'thirties', 'forties', 'fifties', 'sixties', 'seventies', 'eighties', 'nineties'];
const twoDigits = n => n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
function yearWords(n) {
  if (n >= 2000 && n < 2010) return 'two thousand' + (n % 10 ? ' ' + ONES[n % 10] : '');
  const hi = twoDigits(Math.floor(n / 100)), lo = n % 100;
  return lo === 0 ? hi + ' hundred' : lo < 10 ? hi + ' oh ' + ONES[lo] : hi + ' ' + twoDigits(lo);
}
function spoken(text) {
  return text
    .replace(/[’‘]/g, "'")
    .replace(/\s*[·•]\s*/g, ', ')
    .replace(/\bSt\.\s+(?=[A-Z])/g, 'Saint ')
    .replace(/\bMrs\.\s/g, 'Missus ').replace(/\bMr\.\s/g, 'Mister ').replace(/\bDr\.\s/g, 'Doctor ')
    .replace(/\bNo\.\s*(?=\d)/g, 'Number ')
    .replace(/\b(?:c|ca)\.\s*(?=\d{4})/g, 'about ')
    .replace(/\b(1\d{3}|20\d\d)\s*[-–—]\s*(1\d{3}|20\d\d)\b/g, '$1 to $2')
    .replace(/\b(1\d|20)([0-9])0s\b/g, (_, hi, ten) => twoDigits(+hi) + ' ' + (ten === '0' ? 'hundreds' : TENS_PLURAL[+ten]))
    .replace(/(^|[^\d,.$])\b(1\d{3}|20\d\d)\b(?![,.]\d)/g, (_, before, y) => before + yearWords(+y));
}
let engine, ready, latest;

async function initialize() {
  const files = await Promise.all(['chimera.wasm', 'cmudict.txt'].map(async name => {
    const response = await fetch('../audio/voice/' + name);
    if (!response.ok) throw Error('Cannot load ' + name);
    return response;
  }));
  const [wasm, dictionary] = await Promise.all([files[0].arrayBuffer(), files[1].text()]);
  x = (await WebAssembly.instantiate(wasm, {})).instance.exports;
  call('g2pLoad', { text: dictionary });
  engine = x.engine_new(sr);
}

async function render({id, who, text}) {
  await (ready ??= initialize());
  if (id !== latest) return;
  const voice = cast[who] || cast.you;
  const body = { female: voice.female, child: 0 };
  x.engine_stop_speech(engine);
  x.engine_set_body(engine, body.female, body.child);
  const values = new Float64Array(x.memory.buffer, x.engine_values(engine), 32);
  values.fill(NaN);
  values.set(SRC_DEFAULT);
  values[0] = voice.pitch;
  values[3] = voice.breath;
  values[4] = voice.tension;
  x.engine_set_source(engine);
  const phrases = call('g2pPhrases', { text: spoken(text) });
  if (!phrases.length) return;
  const plan = call('planPhrases', { phrases, options: { body, t0: 0, rate: voice.rate, f0: voice.pitch } });
  const clock = x.engine_clock(engine);
  const count = writeGestures(x.engine_records(engine), plan.gestures.slice(0, 4000));
  const start = x.engine_schedule(engine, count, 0.03, 1);
  const length = Math.ceil((start - clock + plan.end + 0.35) * sr);
  for (let offset = 0; offset < length && id === latest; offset += 6400) {
    const audio = new Float32Array(Math.min(6400, length - offset));
    for (let i = 0; i < audio.length; i += 512) {
      const n = Math.min(512, audio.length - i);
      const ptr = x.engine_render(engine, n);
      audio.set(new Float32Array(x.memory.buffer, ptr, n), i);
    }
    postMessage({id, sr, audio}, [audio.buffer]);
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}

onmessage = ({data}) => {
  latest = data.id;
  if (data.text) render(data).catch(error => {
    if (!engine) ready = null;
    console.warn('Dialogue synthesis failed', error);
  });
};
