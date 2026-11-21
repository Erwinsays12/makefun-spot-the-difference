// All sound is synthesized with WebAudio: short oscillator envelopes, no audio files, no
// network. The context is created lazily on the first user gesture, so the page stays silent
// until the player interacts, and every call is safe before that moment.

const NOTE_NAMES = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };

/** Frequency of a note like "a5" or "c#4". */
function frequency(note) {
  const match = /^([a-g])(#?)(\d)$/.exec(note);
  const semitone = NOTE_NAMES[match[1]] + (match[2] ? 1 : 0) + (Number(match[3]) + 1) * 12;
  return 440 * Math.pow(2, (semitone - 69) / 12);
}

/** One enveloped tone: attack fast, then decay to silence over `seconds`. */
function tone(context, destination, note, when, seconds, type, volume) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency(note);
  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(volume, when + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + seconds);
  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(when);
  oscillator.stop(when + seconds + 0.05);
}

/**
 * The sound board: created once, muted through localStorage, and quiet until unlocked by a
 * gesture. Every effect is a few tones; nothing is loaded from disk.
 */
export function createAudio() {
  let context = null;
  let master = null;
  let muted = false;
  try {
    muted = window.localStorage.getItem('twin-lanterns-muted') === '1';
  } catch {
    muted = false;
  }

  function ensure() {
    if (context) return true;
    try {
      const AudioContext = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioContext) return false;
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0.5;
      master.connect(context.destination);
    } catch {
      return false;
    }
    return true;
  }

  /** Call from any pointer or key handler so the browser allows sound afterwards. */
  function unlock() {
    if (!ensure()) return;
    if (context.state === 'suspended') context.resume().catch(() => {});
  }

  function play(notes, type, volume, stepSeconds, noteSeconds) {
    if (muted || !ensure() || context.state !== 'running') return;
    const start = context.currentTime + 0.01;
    notes.forEach((note, index) => {
      tone(context, master, note, start + index * stepSeconds, noteSeconds, type, volume);
    });
  }

  return {
    unlock,
    isMuted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      try {
        window.localStorage.setItem('twin-lanterns-muted', muted ? '1' : '0');
      } catch {
        // Storage can be off: the mute then lasts this visit only.
      }
      return muted;
    },
    /** A bright two-note chime when a difference is found. */
    found() {
      play(['e5', 'a5'], 'sine', 0.22, 0.07, 0.5);
    },
    /** A soft low buzz for a wrong click. */
    wrong() {
      play(['a3'], 'sawtooth', 0.1, 0, 0.22);
    },
    /** A gentle pluck when a hint is spent. */
    hint() {
      play(['g4', 'b4'], 'triangle', 0.16, 0.09, 0.4);
    },
    /** A short tick as the last seconds run out. */
    tick() {
      play(['c6'], 'square', 0.05, 0, 0.06);
    },
    /** A rising arpeggio when a round is cleared. */
    roundClear() {
      play(['c5', 'e5', 'g5', 'c6'], 'sine', 0.2, 0.09, 0.55);
    },
    /** A longer fanfare for finishing all three rounds. */
    victory() {
      play(['c5', 'e5', 'g5', 'c6', 'e6', 'g6'], 'sine', 0.2, 0.11, 0.7);
    },
    /** A low note when time runs out. */
    timeUp() {
      play(['e4', 'c4'], 'triangle', 0.18, 0.18, 0.6);
    },
  };
}
