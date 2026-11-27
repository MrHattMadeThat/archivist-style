// Mixer and physically modelled samples adapted from Props Not Included.
(() => {
  const key = 'archivist:audio-v1';
  const levels = { master: 0.85, music: 0.7, effects: 0.85, voices: 0.9 };
  const muted = { voices: false }; // a switch of its own, so turning voices back on restores the slider's level
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    for (const bus of Object.keys(levels)) {
      if (Number.isFinite(saved?.[bus])) levels[bus] = Math.max(0, Math.min(1, saved[bus]));
    }
    for (const bus of Object.keys(muted)) muted[bus] = saved?.muted?.[bus] === true;
  } catch {}
  const save = () => { try { localStorage.setItem(key, JSON.stringify({ ...levels, muted })); } catch {} };
  const busLevel = bus => muted[bus] ? 0 : levels[bus] ** 2;

  let context, scene = '', revision = 0;
  const buses = {}, buffers = new Map(), loops = new Map();
  // sounds rendered by scripts/render_audio.mjs; footsteps and hooves come in four takes each
  const effects = ['wood', 'stone', 'hoof'].flatMap(n => [0, 1, 2, 3].map(i => n + '_' + i))
    .concat(['creak', 'whoosh', 'stamp', 'box', 'title_phrase']);
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
        buses[bus].gain.value = busLevel(bus);
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
  const cast = {
    narrator:  { f0: 147, rate: 1.02, female: 0.45, breathiness: 0.20, tension: 0.43 },
    conductor: { f0: 125, rate: 1.12, female: 0.05, breathiness: 0.08, tension: 0.68 },
    harrow:    { f0: 102, rate: 0.97, female: 0.03, breathiness: 0.18, tension: 0.46 },
    attendant: { f0: 190, rate: 1.04, female: 0.95, breathiness: 0.17, tension: 0.52 },
    you:       { f0: 156, rate: 1.09, female: 0.49, breathiness: 0.14, tension: 0.50 }
  };
  let dialogue;

  function stopVoice() {
    dialogue?.stop();
  }

  function speak(who, text) {
    if (!context || !levels.voices || muted.voices || !text || document.hidden) {
      stopVoice();
      return;
    }
    dialogue ??= window.GameSoundDialogue?.createPlayer({
      context, destination: buses.voices, volume: 1.6, readAloud: true,
      onError: error => console.warn('Dialogue synthesis failed', error)
    });
    const { f0, rate, female, breathiness, tension } = Object.hasOwn(cast, who) ? cast[who] : cast.you;
    dialogue?.speak(text, {
      f0, rate, body: { female, child: 0 }, source: { breathiness, tension }
    });
  }

  function mix() {
    const current = ++revision;
    if (!context) return;
    const active = scene && !document.hidden;
    buses.master.gain.setTargetAtTime(active ? levels.master ** 2 : 0, context.currentTime, 0.015);
    if (!active) stopVoice();
    const score = scene === 'desk' ? 'bench_keys' : scene;
    const beds = ['room', 'rail_wheels', 'street_air'];
    for (const name of [...beds, ...scores]) {
      const bed = scene === 'train' ? 'rail_wheels' : scene === 'street' ? 'street_air' : 'room';
      const ambience = beds.includes(name);
      const wanted = ambience ? name === bed : name === score;
      const bus = ambience ? 'effects' : 'music';
      const volume = name === 'street_air' ? 0.34 : ambience ? 0.27 : 0.48;
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
        else buses[bus].gain.setTargetAtTime(busLevel(bus), context.currentTime, 0.015);
      }
      save();
    };
  }
  // "Voices" boxes (start menu and pause menu): unticked, nobody reads the lines aloud
  const switches = [...document.querySelectorAll('[data-audio-on]')];
  function setOn(bus, on) {
    muted[bus] = !on;
    for (const box of switches) if (box.dataset.audioOn === bus) box.checked = on;
    for (const slider of document.querySelectorAll('[data-audio-bus="' + bus + '"]')) slider.disabled = !on;
    if (bus === 'voices' && !on) stopVoice();
    if (context) buses[bus].gain.setTargetAtTime(busLevel(bus), context.currentTime, 0.015);
    save();
  }
  for (const box of switches) box.onchange = () => setOn(box.dataset.audioOn, box.checked);
  for (const bus of Object.keys(muted)) setOn(bus, !muted[bus]);

  // a loop held at a level that follows the game (the cab's wheels with its speed); level 0 lets it go
  const driven = new Map();
  function drive(name, level) {
    if (!context || context.state !== 'running') return;
    const now = context.currentTime, held = driven.get(name);
    if (level > 0.001 && scene && !document.hidden) {
      if (!held) {
        const entry = { level, node: null };
        driven.set(name, entry);
        load(name).then(buffer => {
          if (!buffer || driven.get(name) !== entry) return;
          entry.node = source(buffer, 'effects', entry.level, 1, true);
        });
      } else if (Math.abs(held.level - level) > 0.005) {
        held.level = level;
        if (held.node) { held.node.gain.gain.cancelScheduledValues(now); held.node.gain.gain.setTargetAtTime(level, now, 0.08); }
      }
    } else if (held) {
      driven.delete(name);
      if (held.node) {
        held.node.gain.gain.cancelScheduledValues(now);
        held.node.gain.gain.setTargetAtTime(0, now, 0.08);
        held.node.node.stop(now + 0.6);
      }
    }
  }

  window.MuseumAudio = {
    speak, stopVoice, drive,
    scene(next) {
      if (scene !== next) { scene = next; mix(); }
    },
    async play(name, volume = 0.4, rate = 1) {
      if (!context || context.state !== 'running' || !scene || document.hidden) return;
      const current = revision;
      const buffer = await load(name);
      if (buffer && current === revision) source(buffer, name === 'title_phrase' ? 'music' : 'effects', volume, rate, false);
    }
  };
})();
