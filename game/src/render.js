// The renderer: one canvas, one frame at a time. It paints the table, the two picture panels,
// the heads-up display, every marker the player earned, and the title, pause and end screens.
// The scenes themselves live in scenes.js; this file only frames them and draws the game chrome.

import {
  DIFFS_PER_ROUND,
  LEFT_X,
  PANEL_H,
  PANEL_R,
  PANEL_W,
  PANEL_Y,
  RIGHT_X,
  ROUND_TIMES,
  VIEW_H,
  VIEW_W,
} from './config.js';
import { SCENES } from './scenes.js';
import {
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_ROUND_CLEAR,
  SCREEN_TIME_UP,
  SCREEN_TITLE,
  SCREEN_VICTORY,
} from './world.js';

const CREAM = '#f4ead8';
const GOLD = '#f7c873';
const INK = '#17142b';
const PANEL_GAP_X = LEFT_X + PANEL_W;

function disc(g, x, y, r, fill) {
  g.fillStyle = fill;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}

function text(g, value, x, y, font, fill, align = 'left') {
  g.font = font;
  g.fillStyle = fill;
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.fillText(value, x, y);
}

const FONT_TITLE = '700 64px Georgia, "Times New Roman", serif';
const FONT_SUBTITLE = 'italic 22px Georgia, serif';
const FONT_HUD = '700 20px "Trebuchet MS", Verdana, sans-serif';
const FONT_HUD_SMALL = '600 15px "Trebuchet MS", Verdana, sans-serif';
const FONT_BIG = '700 44px Georgia, serif';
const FONT_PANEL = '600 17px "Trebuchet MS", Verdana, sans-serif';

/** Draw one scene inside a rounded panel frame, clipped to the picture. */
function drawPanel(g, scene, diffs, ox) {
  g.save();
  g.beginPath();
  g.roundRect(ox, PANEL_Y, PANEL_W, PANEL_H, PANEL_R);
  g.clip();
  g.translate(ox, PANEL_Y);
  scene.draw(g, diffs);
  g.restore();
  // The wooden frame.
  g.save();
  g.strokeStyle = '#8a6a45';
  g.lineWidth = 10;
  g.beginPath();
  g.roundRect(ox - 5, PANEL_Y - 5, PANEL_W + 10, PANEL_H + 10, PANEL_R + 5);
  g.stroke();
  g.strokeStyle = '#f7c873';
  g.lineWidth = 2;
  g.beginPath();
  g.roundRect(ox - 5, PANEL_Y - 5, PANEL_W + 10, PANEL_H + 10, PANEL_R + 5);
  g.stroke();
  g.restore();
}

/** A gold ring marking a found difference, on one panel. */
function drawFoundMarker(g, ox, diff, age) {
  const x = ox + diff.x;
  const y = PANEL_Y + diff.y;
  const pop = Math.min(1, age / 0.25);
  const radius = 26 * (0.7 + 0.3 * pop);
  g.save();
  g.strokeStyle = GOLD;
  g.lineWidth = 5;
  g.shadowColor = GOLD;
  g.shadowBlur = 14;
  g.beginPath();
  g.arc(x, y, radius, 0, Math.PI * 2);
  g.stroke();
  g.restore();
  // A small tick above the ring.
  g.save();
  g.strokeStyle = GOLD;
  g.lineWidth = 4;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x - 8, y - radius - 16);
  g.lineTo(x - 2, y - radius - 8);
  g.lineTo(x + 10, y - radius - 22);
  g.stroke();
  g.restore();
}

/** The expanding burst right after a find. */
function drawBurst(g, ox, burst) {
  const progress = burst.age / 0.7;
  if (progress >= 1) return;
  g.save();
  g.globalAlpha = 1 - progress;
  g.strokeStyle = GOLD;
  g.lineWidth = 4;
  g.beginPath();
  g.arc(ox + burst.x, PANEL_Y + burst.y, 20 + progress * 46, 0, Math.PI * 2);
  g.stroke();
  g.restore();
}

/** A red cross where a wrong click landed. */
function drawWrongSpot(g, ox, spot) {
  const progress = spot.age / 0.5;
  if (progress >= 1) return;
  const x = ox + spot.x;
  const y = PANEL_Y + spot.y;
  g.save();
  g.globalAlpha = 1 - progress;
  g.strokeStyle = '#e84f4f';
  g.lineWidth = 4;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x - 12, y - 12);
  g.lineTo(x + 12, y + 12);
  g.moveTo(x + 12, y - 12);
  g.lineTo(x - 12, y + 12);
  g.stroke();
  g.restore();
}

export function createRenderer(canvas) {
  const g = canvas.getContext('2d');

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(VIEW_W * dpr);
    canvas.height = Math.round(VIEW_H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function drawBackground() {
    const gradient = g.createLinearGradient(0, 0, 0, VIEW_H);
    gradient.addColorStop(0, '#221d42');
    gradient.addColorStop(1, '#141126');
    g.fillStyle = gradient;
    g.fillRect(0, 0, VIEW_W, VIEW_H);
    // A faint felt circle behind the pictures.
    const glow = g.createRadialGradient(640, 420, 60, 640, 420, 620);
    glow.addColorStop(0, 'rgba(247, 200, 115, 0.08)');
    glow.addColorStop(1, 'rgba(247, 200, 115, 0)');
    g.fillStyle = glow;
    g.fillRect(0, 0, VIEW_W, VIEW_H);
  }

  function drawHud(world, best) {
    const state = world.state;
    const scene = SCENES[state.round];
    const round = state.roundState;
    text(g, 'TWIN LANTERNS', 40, 34, '700 26px Georgia, serif', GOLD);
    text(g, `ROUND ${state.round + 1} / ${SCENES.length} — ${scene.name}`, 40, 66, FONT_HUD_SMALL, CREAM);
    // The timer bar, centre top.
    const timeWidth = 320;
    const timeX = 640 - timeWidth / 2;
    const fraction = Math.max(0, round.timeLeft / ROUND_TIMES[state.round]);
    const urgent = round.timeLeft <= 10 && state.screen === SCREEN_PLAY;
    g.fillStyle = 'rgba(244, 234, 216, 0.18)';
    g.beginPath();
    g.roundRect(timeX, 22, timeWidth, 16, 8);
    g.fill();
    g.fillStyle = urgent ? '#e84f4f' : fraction > 0.5 ? '#7cba6a' : '#e8a13c';
    if (fraction > 0) {
      g.beginPath();
      g.roundRect(timeX, 22, timeWidth * fraction, 16, 8);
      g.fill();
    }
    text(g, `${Math.ceil(round.timeLeft)}s`, 640, 58, FONT_HUD, urgent ? '#ff9a9a' : CREAM, 'center');
    // Score, top right.
    text(g, `SCORE ${state.totalScore}`, 1240, 34, FONT_HUD, CREAM, 'right');
    text(g, `BEST ${Math.max(best, state.totalScore)}`, 1240, 66, FONT_HUD_SMALL, 'rgba(244, 234, 216, 0.7)', 'right');
  }

  function drawCounter(world) {
    const state = world.state;
    const remaining = world.remainingCount();
    const cx = PANEL_GAP_X + 40;
    text(g, String(remaining), cx, 330, '700 72px Georgia, serif', remaining === 0 ? '#7cba6a' : GOLD, 'center');
    text(g, 'LEFT', cx, 384, FONT_HUD_SMALL, CREAM, 'center');
    text(g, 'TO FIND', cx, 406, FONT_HUD_SMALL, CREAM, 'center');
    // Dots for the seven differences: gold once found.
    const found = state.roundState.found;
    SCENES[state.round].diffs.forEach((diff, index) => {
      const y = 452 + index * 26;
      disc(g, cx, y, 7, found.has(diff.id) ? GOLD : 'rgba(244, 234, 216, 0.25)');
    });
    // A small "VS" badge between the pictures.
    disc(g, cx, 150, 24, '#8a6a45');
    text(g, 'VS', cx, 151, '700 15px Georgia, serif', CREAM, 'center');
  }

  function drawBottomBar(world, muted) {
    const round = world.state.roundState;
    const hintsLeft = 3 - round.hintUsed;
    const hintText = round.hintCooldownLeft > 0
      ? `Hint ready in ${Math.ceil(round.hintCooldownLeft)}s`
      : `H — Hint (${hintsLeft} left)`;
    text(g, hintText, 40, 716, FONT_PANEL, hintsLeft > 0 ? GOLD : 'rgba(244, 234, 216, 0.5)');
    text(g, 'Click a difference on either picture', 640, 716, FONT_PANEL, 'rgba(244, 234, 216, 0.75)', 'center');
    text(g, `P Pause  ·  M Sound ${muted ? 'off' : 'on'}  ·  R Restart`, 1240, 716, FONT_PANEL, 'rgba(244, 234, 216, 0.75)', 'right');
    const combo = round.combo;
    if (combo >= 2 && world.state.screen === SCREEN_PLAY) {
      text(g, `COMBO ×${combo}`, 640, 752, '700 20px Georgia, serif', GOLD, 'center');
    }
  }

  function drawMarkers(world, nowSeconds) {
    const state = world.state;
    const scene = SCENES[state.round];
    const round = state.roundState;
    const showMarkers = state.screen !== SCREEN_TITLE;
    if (!showMarkers) return;
    for (const diff of scene.diffs) {
      if (!round.found.has(diff.id)) continue;
      drawFoundMarker(g, LEFT_X, diff, 1);
      drawFoundMarker(g, RIGHT_X, diff, 1);
    }
    for (const burst of round.bursts) {
      drawBurst(g, LEFT_X, burst);
      drawBurst(g, RIGHT_X, burst);
    }
    for (const spot of round.wrongSpots) {
      drawWrongSpot(g, LEFT_X, spot);
      drawWrongSpot(g, RIGHT_X, spot);
    }
    if (round.hint) {
      const pulse = 1 + 0.18 * Math.sin(nowSeconds * 6);
      for (const ox of [LEFT_X, RIGHT_X]) {
        g.save();
        g.setLineDash([10, 8]);
        g.strokeStyle = GOLD;
        g.lineWidth = 4;
        g.beginPath();
        g.arc(ox + round.hint.x, PANEL_Y + round.hint.y, 30 * pulse, 0, Math.PI * 2);
        g.stroke();
        g.restore();
      }
    }
  }

  function drawCursor(input) {
    const crosshair = input.crosshair();
    const mouse = input.mouse();
    if (crosshair.visible) {
      g.save();
      g.strokeStyle = GOLD;
      g.lineWidth = 2.5;
      g.beginPath();
      g.arc(crosshair.x, crosshair.y, 16, 0, Math.PI * 2);
      g.stroke();
      g.beginPath();
      g.moveTo(crosshair.x - 24, crosshair.y);
      g.lineTo(crosshair.x + 24, crosshair.y);
      g.moveTo(crosshair.x, crosshair.y - 24);
      g.lineTo(crosshair.x, crosshair.y + 24);
      g.stroke();
      g.restore();
      return;
    }
    if (!mouse.inside) return;
    const insidePanel = mouse.y >= PANEL_Y && mouse.y <= PANEL_Y + PANEL_H
      && ((mouse.x >= LEFT_X && mouse.x <= LEFT_X + PANEL_W) || (mouse.x >= RIGHT_X && mouse.x <= RIGHT_X + PANEL_W));
    if (!insidePanel) return;
    g.save();
    g.strokeStyle = 'rgba(247, 200, 115, 0.8)';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(mouse.x, mouse.y, 14, 0, Math.PI * 2);
    g.stroke();
    g.restore();
  }

  /** A dark veil plus a centred card, for the title and end screens. */
  function overlayCard(title, lines, accent) {
    g.fillStyle = 'rgba(20, 17, 38, 0.72)';
    g.fillRect(0, 0, VIEW_W, VIEW_H);
    const cardW = 680;
    const cardH = 96 + lines.length * 36 + 70;
    const cardX = 640 - cardW / 2;
    const cardY = 400 - cardH / 2;
    g.fillStyle = '#221d42';
    g.beginPath();
    g.roundRect(cardX, cardY, cardW, cardH, 20);
    g.fill();
    g.strokeStyle = GOLD;
    g.lineWidth = 2;
    g.beginPath();
    g.roundRect(cardX, cardY, cardW, cardH, 20);
    g.stroke();
    text(g, title, 640, cardY + 52, FONT_BIG, accent, 'center');
    lines.forEach((line, index) => {
      text(g, line, 640, cardY + 108 + index * 36, FONT_PANEL, CREAM, 'center');
    });
  }

  function rankTitle(totalScore) {
    if (totalScore >= 2600) return 'Eagle Eye';
    if (totalScore >= 2000) return 'Sharp Spotter';
    if (totalScore >= 1400) return 'Keen Observer';
    if (totalScore >= 800) return 'Curious Wanderer';
    return 'Casual Glancer';
  }

  return {
    draw(world, input, best, muted) {
      const state = world.state;
      const nowSeconds = performance.now() / 1000;
      drawBackground();
      const scene = SCENES[state.round];
      const rightDiffs = world.allDiffs();
      drawPanel(g, scene, new Set(), LEFT_X);
      drawPanel(g, scene, rightDiffs, RIGHT_X);
      // Panel captions.
      text(g, 'ORIGINAL', LEFT_X + PANEL_W / 2, PANEL_Y + PANEL_H + 26, FONT_HUD_SMALL, 'rgba(244, 234, 216, 0.7)', 'center');
      text(g, 'SPOT THE CHANGES', RIGHT_X + PANEL_W / 2, PANEL_Y + PANEL_H + 26, FONT_HUD_SMALL, 'rgba(244, 234, 216, 0.7)', 'center');
      drawHud(world, best);
      if (state.screen !== SCREEN_TITLE) drawCounter(world);
      drawMarkers(world, nowSeconds);
      drawBottomBar(world, muted);
      drawCursor(input);

      if (state.screen === SCREEN_TITLE) {
        g.fillStyle = 'rgba(20, 17, 38, 0.66)';
        g.fillRect(0, 0, VIEW_W, VIEW_H);
        text(g, 'TWIN LANTERNS', 640, 210, FONT_TITLE, GOLD, 'center');
        text(g, 'A spot-the-difference hunt in three lantern-lit scenes', 640, 268, FONT_SUBTITLE, CREAM, 'center');
        text(g, 'Two pictures hang side by side. Seven small things changed in the right one.', 640, 330, FONT_PANEL, CREAM, 'center');
        text(g, 'Click a difference on either picture to circle it. Find all 7 before the clock runs out.', 640, 362, FONT_PANEL, CREAM, 'center');
        text(g, 'H spends a hint  ·  P pauses  ·  M toggles sound  ·  Arrows + Space play without a mouse', 640, 394, FONT_PANEL, 'rgba(244, 234, 216, 0.75)', 'center');
        const pulse = 0.75 + 0.25 * Math.sin(nowSeconds * 3);
        g.save();
        g.globalAlpha = pulse;
        text(g, 'Click or press Space to begin', 640, 470, '700 26px Georgia, serif', GOLD, 'center');
        g.restore();
        if (best > 0) text(g, `Best score: ${best}`, 640, 516, FONT_PANEL, CREAM, 'center');
      } else if (state.screen === SCREEN_PAUSED) {
        overlayCard('PAUSED', ['Take a breath. The clock is stopped.', 'Press P or Space to keep hunting.'], GOLD);
      } else if (state.screen === SCREEN_ROUND_CLEAR) {
        const next = SCENES[state.round + 1];
        overlayCard('ROUND CLEAR!', [
          `Time bonus: +${state.roundClearBonus}`,
          `Round score: ${state.roundState.roundScore}   ·   Total: ${state.totalScore}`,
          `Next: ${next.name} — ${next.subtitle}`,
          'Press N or Space for the next round.',
        ], '#7cba6a');
      } else if (state.screen === SCREEN_VICTORY) {
        overlayCard('YOU FOUND THEM ALL!', [
          `Total score: ${state.totalScore}`,
          `Best combo ×${state.roundState.bestCombo}   ·   Rank: ${rankTitle(state.totalScore)}`,
          `Best score: ${Math.max(best, state.totalScore)}`,
          'Press R to play again, or Space to start over.',
        ], GOLD);
      } else if (state.screen === SCREEN_TIME_UP) {
        const found = state.roundState.found.size;
        overlayCard("TIME'S UP", [
          `You found ${found} of ${DIFFS_PER_ROUND} differences in ${scene.name}.`,
          `Score so far: ${state.totalScore}`,
          'Press R to retry this round.',
        ], '#e84f4f');
      }
    },
  };
}
