// Load one mono speech renderer. Supply a WebAssembly module, bytes, or URL,
// and the unpacked pronunciation dictionary text.
export async function createVoice({
  wasm = new URL('./game_voice_wasm.wasm', import.meta.url),
  dictionary,
  sampleRate,
  readAloud = false,
}) {
  const encoder = new TextEncoder();
  if (typeof dictionary !== 'string') throw new TypeError('Expected dictionary text');
  const source = typeof wasm === 'string' || wasm instanceof URL
    ? await fetch(wasm).then(response => {
      if (!response.ok) throw new Error('Cannot load voice WebAssembly (' + response.status + ')');
      return response.arrayBuffer();
    })
    : wasm;
  const instance = source instanceof WebAssembly.Module
    ? await WebAssembly.instantiate(source)
    : (await WebAssembly.instantiate(source)).instance;
  const x = instance.exports;

  function withText(text, callback) {
    const bytes = encoder.encode(text);
    const pointer = x.voice_alloc(bytes.length);
    try {
      new Uint8Array(x.memory.buffer, pointer, bytes.length).set(bytes);
      return callback(pointer, bytes.length);
    } finally {
      x.voice_free(pointer, bytes.length);
    }
  }

  let handle = withText(dictionary, (pointer, length) => x.voice_create(sampleRate, pointer, length));
  if (!handle) throw new RangeError('Sample rate must be within 8000–192000 Hz');

  function requireOpen() {
    if (!handle) throw new Error('Voice has been closed');
  }

  return {
    start(text, cast, shout = null) {
      requireOpen();
      if (typeof text !== 'string') throw new TypeError('Expected speech text');
      if (readAloud) text = normalizeReadAloud(text);
      const request = JSON.stringify({ text, cast, shout });
      const frames = withText(request, (pointer, length) => x.voice_start(handle, pointer, length));
      if (frames < 0) throw new TypeError('Invalid cast or shout settings');
      return frames;
    },
    render(maxFrames) {
      requireOpen();
      if (!Number.isSafeInteger(maxFrames) || maxFrames < 0 || maxFrames > 0x7fffffff) {
        throw new RangeError('Expected a non-negative 32-bit frame count');
      }
      const count = x.voice_render(handle, maxFrames);
      if (!count) return new Float32Array();
      return new Float32Array(x.memory.buffer, x.voice_output(handle), count).slice();
    },
    stop() {
      requireOpen();
      x.voice_stop(handle);
    },
    close() {
      if (handle) {
        x.voice_destroy(handle);
        handle = 0;
      }
    },
  };
}

// Optional English read-aloud rules for punctuation, titles and years.
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
export function normalizeReadAloud(text) {
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
