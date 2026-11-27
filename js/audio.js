// Mixer and physically modelled samples adapted from Props Not Included.
(() => {
  const key = 'archivist:audio-v1';
  const levels = { master: 0.85, music: 0.7, effects: 0.85, voices: 0.9 };
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    for (const bus of Object.keys(levels)) {
      if (Number.isFinite(saved?.[bus])) levels[bus] = Math.max(0, Math.min(1, saved[bus]));
    }
  } catch {}

  let context, scene = '', revision = 0;
  const buses = {}, buffers = new Map(), loops = new Map();
  const effects = ['wood_0', 'wood_1', 'stone_0', 'stone_1', 'creak', 'whoosh', 'stamp'];
  function load(name) {
    if (!buffers.has(name)) {
      buffers.set(name, fetch('audio/' + name + '.wav')
        .then(response => {
          if (!response.ok) throw Error(response.status);
          return response.arrayBuffer();
        })
        .then(bytes => context.decodeAudioData(bytes))
        .catch(() => { buffers.delete(name); return null; }));
    }
    return buffers.get(name);
  }

  function unlock() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    if (!context) {
      context = new Audio();
      for (const bus of Object.keys(levels)) {
        buses[bus] = context.createGain();
        buses[bus].gain.value = levels[bus] ** 2;
        buses[bus].connect(bus === 'master' ? context.destination : buses.master);
      }
      for (const name of effects) load(name);
      mix();
    }
    if (context.state !== 'running') context.resume().catch(() => {});
  }
  for (const event of ['click', 'keydown']) window.addEventListener(event, unlock, true);

  function source(buffer, bus, volume, rate, loop, at = 0) {
    const node = context.createBufferSource(), gain = context.createGain();
    node.buffer = buffer;
    node.playbackRate.value = rate;
    node.loop = loop;
    gain.gain.value = volume;
    node.connect(gain).connect(buses[bus]);
    node.onended = () => { node.disconnect(); gain.disconnect(); };
    if (loop) {
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(volume, context.currentTime + 0.45);
    }
    node.start(at);
    return { node, gain };
  }

  const scores = ['street', 'train', 'entrance', 'gesner', 'fossils', 'birds', 'office', 'stacks', 'bench_keys'];
  let worker, utterance = 0, nextChunk = 0;
  const speaking = new Set();
  function stopVoice() {
    utterance++;
    worker?.postMessage({id: utterance});
    for (const node of speaking) node.stop();
    speaking.clear();
    nextChunk = 0;
  }
  function speak(who, text) {
    stopVoice();
    if (!context || !levels.voices || !text || document.hidden || !window.Worker) return;
    if (!worker) {
      worker = new Worker('js/voice-worker.js');
      worker.onmessage = ({data}) => {
        if (data.id !== utterance || document.hidden) return;
        const buffer = context.createBuffer(1, data.audio.length, data.sr);
        buffer.copyToChannel(data.audio, 0);
        const at = Math.max(nextChunk, context.currentTime + (nextChunk ? 0.01 : 0.12));
        const { node } = source(buffer, 'voices', 1.6, 1, false, at);
        speaking.add(node);
        node.addEventListener('ended', () => speaking.delete(node));
        nextChunk = at + buffer.duration;
      };
    }
    worker.postMessage({id: utterance, who, text});
  }

  function mix() {
    const current = ++revision;
    if (!context) return;
    const active = scene && !document.hidden;
    buses.master.gain.setTargetAtTime(active ? levels.master ** 2 : 0, context.currentTime, 0.015);
    if (!active) stopVoice();
    const score = scene === 'desk' ? 'bench_keys' : scene;
    for (const name of ['room', ...scores]) {
      const ambience = name === 'room';
      const wanted = ambience ? scene !== 'street' && scene !== 'train' : name === score;
      const bus = ambience ? 'effects' : 'music';
      const volume = ambience ? 0.25 : 0.23;
      if (active && wanted && !loops.has(name)) {
        load(name).then(buffer => {
          if (buffer && current === revision) loops.set(name, source(buffer, bus, volume, 1, true));
        });
      } else if ((!active || !wanted) && loops.has(name)) {
        const { node, gain } = loops.get(name);
        const now = context.currentTime;
        const level = gain.gain.value;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(level, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.35);
        node.stop(now + 0.35);
        loops.delete(name);
      }
    }
  }
  document.addEventListener('visibilitychange', mix);

  for (const slider of document.querySelectorAll('[data-audio-bus]')) {
    const bus = slider.dataset.audioBus;
    slider.value = levels[bus] * 100;
    slider.oninput = () => {
      levels[bus] = Number(slider.value) / 100;
      if (context) {
        if (bus === 'master') mix();
        else buses[bus].gain.setTargetAtTime(levels[bus] ** 2, context.currentTime, 0.015);
      }
      try { localStorage.setItem(key, JSON.stringify(levels)); } catch {}
    };
  }

  window.MuseumAudio = {
    speak, stopVoice,
    scene(next) {
      if (scene !== next) { scene = next; mix(); }
    },
    async play(name, volume = 0.4, rate = 1) {
      if (!context || context.state !== 'running' || !scene || document.hidden) return;
      const current = revision;
      const buffer = await load(name);
      if (buffer && current === revision) source(buffer, 'effects', volume, rate, false);
    }
  };
})();
