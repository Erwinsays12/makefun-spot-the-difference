// Shared constants for Twin Lanterns: every size, time and score rule in one place so the
// renderer, the world and the screenshot staging all agree on the same numbers.

/** Logical canvas size; the renderer scales it to the real canvas with devicePixelRatio. */
export const VIEW_W = 1280;
export const VIEW_H = 800;

/** The two picture panels: same size, same y, a centre gap that holds the counter. */
export const PANEL_W = 560;
export const PANEL_H = 560;
export const PANEL_Y = 112;
export const LEFT_X = 40;
export const RIGHT_X = 680;
export const PANEL_R = 18;

/** Seconds on the clock for each of the three rounds. */
export const ROUND_TIMES = [100, 90, 80];

/** Differences hidden in every scene. */
export const DIFFS_PER_ROUND = 7;

/** Hints a player may spend in one round. */
export const HINTS_PER_ROUND = 3;
/** Seconds before another hint may be spent. */
export const HINT_COOLDOWN = 8;
/** Seconds a hint ring stays visible. */
export const HINT_RING_SECONDS = 3;

/** Score rules. */
export const POINTS_FIND = 100;
export const POINTS_COMBO_STEP = 10;
export const POINTS_WRONG = -15;
export const POINTS_HINT = -40;
export const POINTS_TIME_PER_SECOND = 5;

/** A click counts as a find when it lands this close (panel pixels) to a difference. */
export const FIND_RADIUS = 34;

/** How long, in seconds, the "found it" burst and the "wrong spot" flash last. */
export const BURST_SECONDS = 0.7;
export const WRONG_FLASH_SECONDS = 0.5;

/** Ranks shown on the victory screen by total score. */
export const RANKS = [
  { min: 2600, title: 'Eagle Eye' },
  { min: 2000, title: 'Sharp Spotter' },
  { min: 1400, title: 'Keen Observer' },
  { min: 800, title: 'Curious Wanderer' },
  { min: 0, title: 'Casual Glancer' },
];

export const BEST_KEY = 'twin-lanterns-best';
export const MUTE_KEY = 'twin-lanterns-muted';

/** Keyboard actions, by code, so the same keys work on any layout. */
export const KEY_HINT = 'KeyH';
export const KEY_PAUSE = 'KeyP';
export const KEY_MUTE = 'KeyM';
export const KEY_RESTART = 'KeyR';
export const KEY_NEXT = 'KeyN';
