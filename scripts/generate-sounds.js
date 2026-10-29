/* global __dirname, Buffer */
// Synthesizes the game's sounds - its moves, and its start and end - into
// assets/sounds/ as 16-bit mono WAVs:
//   node scripts/generate-sounds.js
// Modelled on how the real thing makes its sound: a felted wooden piece
// meeting a wooden board is a short, soft force pulse, which sets ringing
// dozens of the board's resonances - each dying away faster the higher it
// is, as wood soaks up high frequencies - plus the piece's own small, very
// damped ring, then a little of the table and room around them. Check and
// mate add struck wooden bars, tuned like a marimba's. Seeded, so running it
// again writes the same files. Replace any file with a recording of the same
// name to change that sound.
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const OUT_DIR = path.join(__dirname, '..', 'assets', 'sounds');

// mulberry32: a small seeded PRNG, so the noise is the same every run.
function random(seed) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function silence(seconds) {
  return new Float32Array(Math.round(seconds * SAMPLE_RATE));
}

/** Adds `source` into `target`, starting `atSeconds` in, scaled by `gain`. */
function mixInto(target, source, atSeconds, gain = 1) {
  const offset = Math.round(atSeconds * SAMPLE_RATE);
  for (let i = 0; i < source.length && offset + i < target.length; i++) {
    target[offset + i] += source[i] * gain;
  }
}

/** The force of a contact lasting `seconds`: a half-sine, roughened a
 * little. A soft felt base makes a longer, duller pulse than bare wood. */
function contactPulse(seconds, next) {
  const out = silence(seconds);
  for (let i = 0; i < out.length; i++) {
    const shape = Math.sin((Math.PI * i) / out.length);
    out[i] = shape * (0.85 + 0.3 * next());
  }
  return out;
}

/** Rings each mode - { frequency, decay (s), gain } - from `excitation`:
 * a two-pole resonator apiece, summed. */
function resonate(excitation, modes, seconds) {
  const out = silence(seconds);
  for (const { frequency, decay, gain } of modes) {
    const w = (2 * Math.PI * frequency) / SAMPLE_RATE;
    const r = Math.exp(-1 / (decay * SAMPLE_RATE));
    const a1 = 2 * r * Math.cos(w);
    const a2 = -r * r;
    // Scaled so every mode rings at `gain`, whatever its frequency.
    const input = gain * Math.sin(w);
    let y1 = 0;
    let y2 = 0;
    for (let i = 0; i < out.length; i++) {
      const x = i < excitation.length ? excitation[i] : 0;
      const y = a1 * y1 + a2 * y2 + input * x;
      y2 = y1;
      y1 = y;
      out[i] += y;
    }
  }
  return out;
}

// Wood's loss factor: a mode at frequency f dies away in 1 / (π f η)
// seconds, so the board's highs go first and its low "thock" lingers.
const BOARD_LOSS = 0.025;
const PIECE_LOSS = 0.04;

/** A mode's level for the share of the sound's energy it should carry: a
 * short-lived mode needs to start louder to be heard as much. */
function levelFor(energy, decay) {
  return energy * Math.sqrt(0.004 / decay);
}

/** The board's resonances: many, irregularly spaced, strongest in the
 * low mids, as a wooden board's are, with one low thump of the board
 * against the table. */
function boardModes(next, pitch) {
  const modes = [{ frequency: 135 * pitch, decay: 0.018, gain: 0.12 }];
  for (let i = 0; i < 46; i++) {
    // Log-spaced from 180Hz to 5kHz, jittered so no two notes line up.
    const position = (i + next()) / 46;
    const frequency = 180 * Math.pow(5000 / 180, position) * pitch;
    // Most of it from about 500Hz to 3kHz, where wood on wood clicks.
    const emphasis =
      frequency / (frequency + 1400) / (1 + Math.pow(frequency / 3600, 2));
    // Held at the board's lowest modes, which it loses through the table.
    const decay = Math.min(1 / (Math.PI * frequency * BOARD_LOSS), 0.016);
    modes.push({
      frequency,
      decay,
      gain: levelFor(emphasis * (0.4 + 0.6 * next()), decay),
    });
  }
  return modes;
}

/** A piece's own ring: a small block of hardwood, high and short. */
function pieceModes(next, pitch) {
  return [1900, 2750, 3900, 5300].map((base) => {
    const frequency = base * pitch * (0.94 + 0.12 * next());
    const decay = 1 / (Math.PI * frequency * PIECE_LOSS);
    return {
      frequency,
      decay,
      gain: levelFor(0.3 * (0.6 + 0.4 * next()), decay),
    };
  });
}

/** A piece set down on the board. `contact` is how long the base touches
 * for - shorter is harder - and `pitch` shifts the board and piece, so
 * two pieces don't sound identical. */
function placement({ contact = 0.0002, pitch = 1, pieceRing = 2, seed }) {
  const next = random(seed);
  const pulse = contactPulse(contact, next);
  const body = resonate(pulse, boardModes(next, pitch), 0.22);
  const piece = resonate(pulse, pieceModes(next, pitch), 0.22);
  mixInto(body, piece, 0, pieceRing);
  return body;
}

/** One piece knocking another: bare wood on wood, mostly the pieces'
 * own ring and little of the board. */
function knock({ pitch = 1, seed }) {
  const next = random(seed);
  const pulse = contactPulse(0.00012, next);
  const out = resonate(pulse, pieceModes(next, pitch * 0.85), 0.12);
  const board = resonate(pulse, boardModes(next, pitch), 0.12);
  mixInto(out, board, 0, 0.25);
  return out;
}

/** A struck wooden bar - a marimba's: its overtones sit at about 4 and 10
 * times the note, and die away much faster than it. A longer `mallet` is a
 * softer one. */
function woodenBar({ frequency, seconds, decay, mallet = 0.0015, seed }) {
  const next = random(seed);
  const pulse = contactPulse(mallet, next);
  return resonate(
    pulse,
    [
      { frequency, decay, gain: 1 },
      { frequency: frequency * 3.93, decay: decay / 4, gain: 0.25 },
      { frequency: frequency * 9.9, decay: decay / 12, gain: 0.08 },
    ],
    seconds,
  );
}

/** Wood sliding over wood: friction is a stream of tiny sticks and slips,
 * so noise in short grains, through a band that rises as the piece speeds
 * up and falls as it slows. */
function slide({ seconds, from, to, seed }) {
  const next = random(seed);
  const out = silence(seconds);
  let low = 0;
  let band = 0;
  let grain = 0;
  for (let i = 0; i < out.length; i++) {
    const progress = i / out.length;
    // Up to speed and back down: loudest, and brightest, mid-slide.
    const speed = Math.sin(Math.PI * progress);
    if (i % 90 === 0) grain = 0.5 + next();
    const center = from + (to - from) * progress + 500 * speed;
    // A state-variable band-pass, retuned every sample.
    const f = 2 * Math.sin((Math.PI * center) / SAMPLE_RATE);
    const noise = (next() * 2 - 1) * grain;
    low += f * band;
    const high = noise - low - 0.7 * band;
    band += f * high;
    out[i] = band * speed * speed;
  }
  return out;
}

/** A deep blow - something heavy landing: a low tone falling in pitch as
 * it dies, like a drum struck hard. */
function boom({ from, to, seconds, decay }) {
  const out = silence(seconds);
  let phase = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SAMPLE_RATE;
    const frequency = to + (from - to) * Math.exp(-t / 0.06);
    phase += (2 * Math.PI * frequency) / SAMPLE_RATE;
    out[i] = Math.min(1, t / 0.002) * Math.exp(-t / decay) * Math.sin(phase);
  }
  return out;
}

/** The table and room: reflections that start straight away and blur
 * together - dark, quiet noise, rather than distinct echoes, whose regular
 * spacing would ring like metal. */
function room(dry) {
  const next = random(99);
  const response = silence(0.1);
  let smoothed = 0;
  for (let i = 0; i < response.length; i++) {
    const t = i / SAMPLE_RATE;
    // Absorbed above about 2.5kHz: wood, cloth and air take the highs.
    smoothed += 0.3 * (next() * 2 - 1 - smoothed);
    const envelope =
      Math.min(1, t / 0.0015) *
      (0.7 * Math.exp(-t / 0.008) + 0.3 * Math.exp(-t / 0.03));
    response[i] = smoothed * envelope;
  }
  const wet = silence(dry.length / SAMPLE_RATE + 0.1);
  mixInto(wet, dry, 0);
  for (let i = 0; i < dry.length; i++) {
    if (dry[i] === 0) continue;
    const level = 0.02 * dry[i];
    for (let j = 0; j < response.length; j++) {
      wet[i + j] += level * response[j];
    }
  }
  return wet;
}

/** A gentle low-pass, then a high-pass to keep the speaker from chasing
 * sub-bass and DC; then a short fade at the end. */
function finish(samples) {
  const out = new Float32Array(samples.length);
  const lowPass = 1 - Math.exp((-2 * Math.PI * 7500) / SAMPLE_RATE);
  const highPass = Math.exp((-2 * Math.PI * 70) / SAMPLE_RATE);
  let low = 0;
  let previousIn = 0;
  let previousOut = 0;
  for (let i = 0; i < samples.length; i++) {
    low += lowPass * (samples[i] - low);
    const high = highPass * (previousOut + low - previousIn);
    previousIn = low;
    previousOut = high;
    out[i] = high;
  }
  const fade = Math.round(0.01 * SAMPLE_RATE);
  for (let i = 0; i < fade; i++) out[out.length - 1 - i] *= i / fade;
  return out;
}

function normalize(samples, peakDb) {
  const peak = samples.reduce(
    (max, sample) => Math.max(max, Math.abs(sample)),
    0,
  );
  const gain = Math.pow(10, peakDb / 20) / peak;
  return samples.map((sample) => sample * gain);
}

function writeWav(name, samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((sample, i) => {
    const clamped = Math.max(-1, Math.min(1, sample));
    data.writeInt16LE(Math.round(clamped * 32767), i * 2);
  });
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  fs.writeFileSync(
    path.join(OUT_DIR, `${name}.wav`),
    Buffer.concat([header, data]),
  );
}

function render(dry, peakDb) {
  return normalize(finish(room(dry)), peakDb);
}

function move() {
  return render(placement({ seed: 1 }), -6);
}

// The taken piece knocked aside, then the capturer set down harder.
function capture() {
  const out = silence(0.26);
  mixInto(out, knock({ seed: 2 }), 0, 0.5);
  mixInto(out, placement({ contact: 0.00016, pieceRing: 1.6, seed: 3 }), 0.03);
  return render(out, -3);
}

// The king steps across and sets down; the rook slides the length of the
// board after it, and comes to rest tucked in beside the king - a soft tap
// as it lands, and a lighter one as it nudges up against him.
function castle() {
  const out = silence(0.22);
  mixInto(out, placement({ contact: 0.0003, pitch: 1.04, seed: 4 }), 0, 0.85);
  mixInto(
    out,
    slide({ seconds: 0.075, from: 700, to: 1100, seed: 5 }),
    0.02,
    0.5,
  );
  mixInto(
    out,
    placement({ contact: 0.00034, pitch: 0.92, seed: 6 }),
    0.095,
    0.75,
  );
  mixInto(out, knock({ pitch: 1.1, seed: 7 }), 0.108, 0.22);
  return render(out, -5);
}

// The move, set down firmly, then two rising notes on a wooden bar.
function check() {
  const out = silence(0.5);
  mixInto(out, placement({ contact: 0.0002, seed: 6 }), 0);
  mixInto(
    out,
    woodenBar({ frequency: 659.3, seconds: 0.35, decay: 0.09, seed: 7 }),
    0.06,
    0.18,
  );
  mixInto(
    out,
    woodenBar({ frequency: 987.8, seconds: 0.38, decay: 0.11, seed: 8 }),
    0.15,
    0.18,
  );
  return render(out, -3);
}

// The mating piece slammed down, a heavy blow under it, then a low,
// unresolved tritone on big wooden bars sinking a half step - and a dark
// rumble left hanging.
function checkmate() {
  const out = silence(1.6);
  mixInto(
    out,
    placement({ contact: 0.00018, pitch: 0.85, pieceRing: 1.2, seed: 9 }),
    0,
  );
  mixInto(out, boom({ from: 180, to: 60, seconds: 0.9, decay: 0.2 }), 0, 0.6);
  const bar = (frequency, at, gain, seed) =>
    mixInto(
      out,
      woodenBar({ frequency, seconds: 1.2, decay: 0.4, mallet: 0.003, seed }),
      at,
      gain,
    );
  // D and G♯ - the tritone - then both down a half step, to C♯ and G:
  // an octave up where a phone's speaker can play them, with the low
  // octave under them for headphones.
  [
    [293.7, 0.09, 0.26],
    [415.3, 0.09, 0.21],
    [146.8, 0.09, 0.08],
    [277.2, 0.42, 0.32],
    [392.0, 0.42, 0.26],
    [138.6, 0.42, 0.09],
    [69.3, 0.42, 0.09],
  ].forEach(([frequency, at, gain], i) => bar(frequency, at, gain, 10 + i));
  mixInto(out, rumble({ seconds: 1.1, seed: 15 }), 0.38, 0.06);
  return render(out, -3);
}

/** Low, swelling noise, dying slowly. */
function rumble({ seconds, seed }) {
  const next = random(seed);
  const out = silence(seconds);
  let a = 0;
  let b = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SAMPLE_RATE;
    a += 0.02 * (next() * 2 - 1 - a);
    b += 0.02 * (a - b);
    out[i] = 12 * b * Math.min(1, t / 0.12) * Math.exp(-t / 0.35);
  }
  return out;
}

// A game begins: a light tap, as of pieces set out, then a bright, rising
// fifth on a wooden bar.
function gameStart() {
  const out = silence(0.55);
  mixInto(out, placement({ contact: 0.0003, pitch: 1.08, seed: 20 }), 0, 0.5);
  mixInto(
    out,
    woodenBar({ frequency: 392.0, seconds: 0.3, decay: 0.09, seed: 21 }),
    0.05,
    0.28,
  );
  mixInto(
    out,
    woodenBar({ frequency: 587.3, seconds: 0.4, decay: 0.13, seed: 22 }),
    0.14,
    0.3,
  );
  return render(out, -5);
}

// A game over some other way than mate: a falling fifth, settling onto a
// soft low note under it - calm and final, where mate is dark.
function gameEnd() {
  const out = silence(0.95);
  mixInto(
    out,
    woodenBar({ frequency: 587.3, seconds: 0.3, decay: 0.1, seed: 23 }),
    0,
    0.26,
  );
  mixInto(
    out,
    woodenBar({
      frequency: 392.0,
      seconds: 0.7,
      decay: 0.22,
      mallet: 0.0025,
      seed: 24,
    }),
    0.13,
    0.3,
  );
  mixInto(
    out,
    woodenBar({
      frequency: 196.0,
      seconds: 0.75,
      decay: 0.26,
      mallet: 0.003,
      seed: 25,
    }),
    0.13,
    0.2,
  );
  return render(out, -5);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
writeWav('move', move());
writeWav('capture', capture());
writeWav('castle', castle());
writeWav('check', check());
writeWav('checkmate', checkmate());
writeWav('game-start', gameStart());
writeWav('game-end', gameEnd());
