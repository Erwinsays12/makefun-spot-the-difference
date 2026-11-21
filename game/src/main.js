// Boot and the one loop: input is read every frame, the world advances in real seconds, and the
// renderer paints what is there. The game moves between six screens: title, play, paused,
// round-clear, victory and time-up.
//
// ?shot=start|play|win (with &seed=N, ignored: the scenes are fixed) stages that scene instead
// of running the loop, paints it twice and sets window.__shotReady for a screenshot.

import { BEST_KEY } from './config.js';
import { createAudio } from './audio.js';
import { createInput, panelAt, ACTION_CONFIRM, ACTION_HINT, ACTION_MUTE, ACTION_NEXT, ACTION_PAUSE, ACTION_RESTART } from './input.js';
import { createRenderer } from './render.js';
import { createWorld, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_ROUND_CLEAR, SCREEN_TIME_UP, SCREEN_TITLE, SCREEN_VICTORY } from './world.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off: the best score then lasts this visit only.
  }
}

const world = createWorld((event, detail) => {
  if (event === 'found') {
    audio.found();
    announce(`Found ${detail.diff.label}. ${world.remainingCount()} left.`);
  } else if (event === 'wrong') {
    audio.wrong();
  } else if (event === 'hint') {
    audio.hint();
    announce(`Hint: look near ${detail.diff.label}.`);
  } else if (event === 'tick') {
    audio.tick();
  } else if (event === 'round-clear') {
    audio.roundClear();
    announce(`Round clear. Time bonus ${detail.bonus}.`);
  } else if (event === 'victory') {
    audio.victory();
    saveBestIfBeaten();
    announce(`You found them all. Total score ${world.state.totalScore}.`);
  } else if (event === 'time-up') {
    audio.timeUp();
    announce("Time's up.");
  }
});

let best = readBest();
const renderer = createRenderer(canvas);
const input = createInput(canvas, () => audio.unlock());

function saveBestIfBeaten() {
  if (world.state.totalScore > best) {
    best = world.state.totalScore;
    saveBest(best);
  }
}

/** Screen readers (and anyone watching the page's text) hear the screen changes and each find. */
function announce(message) {
  status.textContent = message;
}

function runShot(name) {
  stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world, input, best, audio.isMuted());
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let last = performance.now();

  function handleClicks() {
    for (const click of input.takeClicks()) {
      const panel = panelAt(click.x, click.y);
      const screen = world.state.screen;
      if (screen === SCREEN_TITLE) {
        world.startGame();
        announce('Playing. Find 7 differences.');
        continue;
      }
      if (screen === SCREEN_ROUND_CLEAR || screen === SCREEN_VICTORY) {
        if (screen === SCREEN_ROUND_CLEAR) world.nextRound();
        else world.startGame();
        continue;
      }
      if (screen === SCREEN_TIME_UP) {
        world.retryRound();
        continue;
      }
      if (screen === SCREEN_PAUSED) {
        world.resume();
        continue;
      }
      if (panel) world.clickAt(panel);
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    const screen = world.state.screen;
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    if (actions & ACTION_HINT) world.useHint();
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) {
        world.pause();
        announce('Paused.');
      } else if (screen === SCREEN_PAUSED) {
        world.resume();
        announce('Playing.');
      }
    }
    if (actions & ACTION_RESTART) {
      if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED || screen === SCREEN_TIME_UP || screen === SCREEN_VICTORY) {
        world.startGame();
        announce('Playing. Find 7 differences.');
      }
    }
    if (actions & ACTION_NEXT) {
      if (screen === SCREEN_ROUND_CLEAR) world.nextRound();
    }
    if (actions & ACTION_CONFIRM) {
      if (screen === SCREEN_TITLE) {
        world.startGame();
        announce('Playing. Find 7 differences.');
      } else if (screen === SCREEN_ROUND_CLEAR) {
        world.nextRound();
      } else if (screen === SCREEN_TIME_UP) {
        world.retryRound();
      } else if (screen === SCREEN_VICTORY) {
        world.startGame();
        announce('Playing. Find 7 differences.');
      } else if (screen === SCREEN_PAUSED) {
        world.resume();
        announce('Playing.');
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const seconds = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    input.update(seconds);
    handleActions();
    handleClicks();
    world.step(seconds);
    renderer.draw(world, input, best, audio.isMuted());
  }

  // Leaving the tab pauses a running game rather than letting the clock run unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && world.state.screen === SCREEN_PLAY) {
      world.pause();
      announce('Paused.');
    }
  });

  announce('Twin Lanterns, a spot the difference game. Click or press Space to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
