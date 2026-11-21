// A tiny seeded random generator (mulberry32) plus the small helpers the scenes use to place
// decoration. Every scene is drawn from a fixed seed, so the left and right panels always agree
// except for the differences the scene itself applies.

/** Build a generator from any integer seed. */
export function createRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** A float in [min, max). */
export function range(random, min, max) {
  return min + random() * (max - min);
}

/** An integer in [min, max]. */
export function intIn(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}

/** Pick one element of an array. */
export function pick(random, items) {
  return items[Math.floor(random() * items.length)];
}
