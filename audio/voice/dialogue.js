(() => {
  const workerUrl = new URL('dialogue-worker.js', document.currentScript.src);

  function createPlayer({
    context, destination, volume = 1, sampleRate = 32000, readAloud = false, onError = console.warn
  }) {
    let worker, request = 0, nextChunk = 0, closed = false;
    const playing = new Set();

    function clearPlayback() {
      for (const source of playing) {
        source.stop();
        source.disconnect();
      }
      playing.clear();
      nextChunk = 0;
    }

    function stop() {
      request++;
      worker?.postMessage({ id: request });
      clearPlayback();
    }

    function receive({ data }) {
      if (data.id !== request) return;
      if (data.error) {
        clearPlayback();
        onError(data.error);
        return;
      }
      const buffer = context.createBuffer(1, data.audio.length, sampleRate);
      buffer.copyToChannel(data.audio, 0);
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(gain);
      source.onended = () => {
        if (playing.delete(source)) source.disconnect();
      };
      const at = Math.max(nextChunk, context.currentTime + (nextChunk ? 0.01 : 0.12));
      source.start(at);
      playing.add(source);
      nextChunk = at + buffer.duration;
    }

    function speak(text, cast, { shout = null } = {}) {
      if (closed) return;
      stop();
      if (!text || !globalThis.Worker) return;
      try {
        if (!worker) {
          const current = new Worker(workerUrl, { type: 'module' });
          current.onmessage = receive;
          current.onerror = event => {
            if (worker !== current) return;
            current.terminate();
            worker = null;
            clearPlayback();
            onError(event.message || 'Unable to load the dialogue worker');
          };
          worker = current;
        }
        worker.postMessage({ id: request, text, cast, shout, sampleRate, readAloud });
      } catch (error) {
        onError(error);
      }
    }

    const gain = context.createGain();
    gain.gain.value = volume;
    gain.connect(destination);

    return {
      speak,
      stop,
      close() {
        if (closed) return;
        stop();
        closed = true;
        worker?.terminate();
        worker = null;
        gain.disconnect();
      }
    };
  }

  globalThis.GameSoundDialogue = { createPlayer };
})();
