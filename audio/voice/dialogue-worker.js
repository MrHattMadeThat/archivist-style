import { createVoice } from './game-voice.js';

const CHUNK_FRAMES = 6400;
let ready, latest;

async function initialize(sampleRate, readAloud) {
  const response = await fetch(new URL('cmudict.txt', import.meta.url));
  if (!response.ok) throw new Error('Unable to load the pronunciation dictionary (' + response.status + ')');
  const dictionary = await response.text();
  return createVoice({
    wasm: new URL('game_voice_wasm.wasm', import.meta.url),
    dictionary,
    sampleRate,
    readAloud
  });
}

async function render({ id, text, cast, shout, sampleRate, readAloud }) {
  const engine = await (ready ??= initialize(sampleRate, readAloud).catch(error => {
    ready = null;
    throw error;
  }));
  if (id !== latest) return;
  if (!text) {
    engine.stop();
    return;
  }
  let remaining = engine.start(text, cast, shout);
  while (id === latest && remaining > 0) {
    const audio = engine.render(Math.min(CHUNK_FRAMES, remaining));
    if (!audio.length) break;
    remaining -= audio.length;
    postMessage({ id, audio }, [audio.buffer]);
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}

globalThis.onmessage = ({ data }) => {
  latest = data.id;
  if (!data.text && !ready) return;
  render(data).catch(error => {
    if (data.id === latest) postMessage({ id: data.id, error: error.message });
  });
};
