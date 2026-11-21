// The game state: screens, rounds, the clock, the score and every rule about finding, missing
// and hinting. It knows nothing about drawing or input; it only answers what happened.

import {
  DIFFS_PER_ROUND,
  FIND_RADIUS,
  HINTS_PER_ROUND,
  HINT_COOLDOWN,
  HINT_RING_SECONDS,
  POINTS_COMBO_STEP,
  POINTS_FIND,
  POINTS_HINT,
  POINTS_TIME_PER_SECOND,
  POINTS_WRONG,
  ROUND_TIMES,
} from './config.js';
import { SCENES } from './scenes.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_ROUND_CLEAR = 'round-clear';
export const SCREEN_VICTORY = 'victory';
export const SCREEN_TIME_UP = 'time-up';

/** A fresh, empty per-round state. */
function freshRound() {
  return {
    found: new Set(),
    foundOrder: [],
    wrongSpots: [],
    bursts: [],
    hint: null,
    hintUsed: 0,
    hintCooldownLeft: 0,
    combo: 0,
    bestCombo: 0,
    wrongCount: 0,
    timeLeft: 0,
    roundScore: 0,
  };
}

/**
 * Create the world. `onEvent` is called with 'found' | 'wrong' | 'hint' | 'round-clear' |
 * 'victory' | 'time-up' | 'tick' so the shell can play sounds and announce.
 */
export function createWorld(onEvent) {
  const state = {
    screen: SCREEN_TITLE,
    round: 0,
    totalScore: 0,
    best: 0,
    lastTickSecond: -1,
    roundState: freshRound(),
    roundClearBonus: 0,
    victory: false,
  };
  // The title screen shows a full clock before the first round starts.
  state.roundState.timeLeft = ROUND_TIMES[0];

  function scene() {
    return SCENES[state.round];
  }

  function startRound(round) {
    state.round = round;
    state.roundState = freshRound();
    state.roundState.timeLeft = ROUND_TIMES[round];
    state.screen = SCREEN_PLAY;
    state.lastTickSecond = -1;
  }

  /** Distance in panel pixels from a click to a difference. */
  function distanceToDiff(click, diff) {
    const dx = click.x - diff.x;
    const dy = click.y - diff.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Test a click given in panel-local coordinates (the same on either panel). Returns true
   * when the click found a difference.
   */
  function clickAt(click) {
    if (state.screen !== SCREEN_PLAY) return false;
    const round = state.roundState;
    const current = scene();
    for (const diff of current.diffs) {
      if (round.found.has(diff.id)) continue;
      if (distanceToDiff(click, diff) > FIND_RADIUS) continue;
      round.found.add(diff.id);
      round.foundOrder.push(diff.id);
      round.combo += 1;
      round.bestCombo = Math.max(round.bestCombo, round.combo);
      const gained = POINTS_FIND + (round.combo - 1) * POINTS_COMBO_STEP;
      round.roundScore += gained;
      state.totalScore += gained;
      round.bursts.push({ x: diff.x, y: diff.y, age: 0, kind: 'found' });
      onEvent('found', { diff, gained, combo: round.combo });
      if (round.found.size === DIFFS_PER_ROUND) finishRound();
      return true;
    }
    // A miss: points off, the combo breaks, a red flash marks the spot.
    round.combo = 0;
    round.wrongCount += 1;
    state.totalScore = Math.max(0, state.totalScore + POINTS_WRONG);
    round.roundScore = Math.max(0, round.roundScore + POINTS_WRONG);
    round.wrongSpots.push({ x: click.x, y: click.y, age: 0 });
    onEvent('wrong', { at: click });
    return false;
  }

  function finishRound() {
    const round = state.roundState;
    const bonus = Math.ceil(round.timeLeft) * POINTS_TIME_PER_SECOND;
    state.roundClearBonus = bonus;
    round.roundScore += bonus;
    state.totalScore += bonus;
    if (state.round === SCENES.length - 1) {
      state.screen = SCREEN_VICTORY;
      state.victory = true;
      onEvent('victory', { bonus });
    } else {
      state.screen = SCREEN_ROUND_CLEAR;
      onEvent('round-clear', { bonus });
    }
  }

  /** Spend a hint: reveal one unfound difference with a pulsing ring. */
  function useHint() {
    if (state.screen !== SCREEN_PLAY) return false;
    const round = state.roundState;
    if (round.hintUsed >= HINTS_PER_ROUND) return false;
    if (round.hintCooldownLeft > 0) return false;
    const current = scene();
    const remaining = current.diffs.filter((diff) => !round.found.has(diff.id));
    if (remaining.length === 0) return false;
    const diff = remaining[0];
    round.hintUsed += 1;
    round.hintCooldownLeft = HINT_COOLDOWN;
    round.hint = { x: diff.x, y: diff.y, age: 0 };
    state.totalScore = Math.max(0, state.totalScore + POINTS_HINT);
    round.roundScore = Math.max(0, round.roundScore + POINTS_HINT);
    onEvent('hint', { diff });
    return true;
  }

  /** Advance the clock and the little animations. Call once per frame with seconds elapsed. */
  function step(seconds) {
    const round = state.roundState;
    // Age the bursts and wrong flashes on every screen that shows them.
    for (const burst of round.bursts) burst.age += seconds;
    round.bursts = round.bursts.filter((burst) => burst.age < 0.7);
    for (const spot of round.wrongSpots) spot.age += seconds;
    round.wrongSpots = round.wrongSpots.filter((spot) => spot.age < 0.5);
    if (round.hint) {
      round.hint.age += seconds;
      if (round.hint.age > HINT_RING_SECONDS) round.hint = null;
    }
    if (round.hintCooldownLeft > 0) round.hintCooldownLeft = Math.max(0, round.hintCooldownLeft - seconds);
    if (state.screen !== SCREEN_PLAY) return;
    round.timeLeft -= seconds;
    const whole = Math.ceil(round.timeLeft);
    if (whole <= 10 && whole > 0 && whole !== state.lastTickSecond) {
      state.lastTickSecond = whole;
      onEvent('tick', { secondsLeft: whole });
    }
    if (round.timeLeft <= 0) {
      round.timeLeft = 0;
      state.screen = SCREEN_TIME_UP;
      onEvent('time-up', {});
    }
  }

  return {
    state,
    scene,
    /** Begin from the title screen. */
    startGame() {
      state.totalScore = 0;
      state.victory = false;
      startRound(0);
    },
    /** Begin a later round directly (used by the screenshot staging). */
    startAtRound(round, score) {
      state.totalScore = score;
      state.victory = false;
      startRound(round);
    },
    /** Move on after a cleared round. */
    nextRound() {
      if (state.screen === SCREEN_ROUND_CLEAR) startRound(state.round + 1);
    },
    /** Retry the round that ran out of time. */
    retryRound() {
      if (state.screen === SCREEN_TIME_UP) startRound(state.round);
    },
    backToTitle() {
      state.screen = SCREEN_TITLE;
      state.round = 0;
      state.totalScore = 0;
      state.roundState = freshRound();
      state.roundState.timeLeft = ROUND_TIMES[0];
    },
    pause() {
      if (state.screen === SCREEN_PLAY) state.screen = SCREEN_PAUSED;
    },
    resume() {
      if (state.screen === SCREEN_PAUSED) state.screen = SCREEN_PLAY;
    },
    clickAt,
    useHint,
    step,
    /** Differences already found, as a Set of ids, for the left panel. */
    foundSet() {
      return state.roundState.found;
    },
    /** The full difference set the right panel draws with: every difference, always. */
    allDiffs() {
      return new Set(scene().diffs.map((diff) => diff.id));
    },
    remainingCount() {
      return DIFFS_PER_ROUND - state.roundState.found.size;
    },
  };
}
