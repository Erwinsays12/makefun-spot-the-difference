// The screenshot scenes behind ?shot=start|play|win. Each one sets the world to a real state
// the game itself can reach — the title screen, a round in progress with three differences
// already circled, and a finished round with all seven ringed — so the screenshots are honest
// renders of the game's own code, and the same query always gives the same frame.

import { SCREEN_PLAY, SCREEN_TITLE, SCREEN_VICTORY } from './world.js';

/** The three differences the play scene shows as already found. */
const PLAY_FOUND = ['gull', 'sail', 'buoy'];

/**
 * Put `world` into the named scene and return the screen to draw. Any other name stages the
 * title screen.
 */
export function stageShot(name, world) {
  const state = world.state;
  if (name === 'play') {
    world.startGame();
    // Play the first round forward: find three differences, as a player would.
    const scene = world.scene();
    for (const id of PLAY_FOUND) {
      const diff = scene.diffs.find((candidate) => candidate.id === id);
      world.clickAt({ x: diff.x, y: diff.y });
    }
    // Wind the clock to 64 seconds and let the find bursts finish.
    state.roundState.timeLeft = 64;
    state.roundState.bursts = [];
    state.screen = SCREEN_PLAY;
    return { screen: SCREEN_PLAY };
  }
  if (name === 'win') {
    // The last round, reached with a plausible score, every difference found.
    world.startAtRound(2, 1480);
    const scene = world.scene();
    world.state.roundState.timeLeft = 41;
    for (const diff of scene.diffs) world.clickAt({ x: diff.x, y: diff.y });
    world.state.roundState.bursts = [];
    return { screen: SCREEN_VICTORY };
  }
  world.backToTitle();
  state.screen = SCREEN_TITLE;
  return { screen: SCREEN_TITLE };
}
