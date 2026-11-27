import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

// Mulberry32. Existing game scores rely on this exact sequence.
export function seeded(seed) {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** Write signed 16-bit PCM. An optional RIFF smpl chunk marks the whole clip as a forward loop. */
export function writeWav(file, channels, sampleRate, { loop = false, gain = 1 } = {}) {
  const frames = channels[0]?.length;
  if (!frames || !channels.every(channel => channel.length === frames)) {
    throw new Error('WAV channels must contain the same positive number of samples');
  }
  const count = channels.length;
  const pcmBytes = frames * count * 2;
  const bytes = Buffer.alloc(44 + pcmBytes + (loop ? 68 : 0));
  bytes.write('RIFF', 0);
  bytes.writeUInt32LE(bytes.length - 8, 4);
  bytes.write('WAVEfmt ', 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(count, 22);
  bytes.writeUInt32LE(sampleRate, 24);
  bytes.writeUInt32LE(sampleRate * count * 2, 28);
  bytes.writeUInt16LE(count * 2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36);
  bytes.writeUInt32LE(pcmBytes, 40);
  let offset = 44;
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < count; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i] * gain));
      bytes.writeInt16LE(Math.round(sample * 32767), offset);
      offset += 2;
    }
  }
  if (loop) {
    bytes.write('smpl', offset);
    bytes.writeUInt32LE(60, offset + 4);
    bytes.writeUInt32LE(Math.round(1e9 / sampleRate), offset + 16);
    bytes.writeUInt32LE(60, offset + 20);
    bytes.writeUInt32LE(1, offset + 36);
    bytes.writeUInt32LE(frames - 1, offset + 56);
  }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, bytes);
}
