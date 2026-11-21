// Input: the mouse position and clicks in canvas pixels, plus the keyboard actions the game
// listens for. The world only ever sees panel-local clicks and named actions; this module owns
// the translation between the two.
//
// The keyboard crosshair lets the whole game be played without a mouse: arrow keys move it,
// Space or Enter clicks where it stands, and Tab jumps it to the other panel.

import { LEFT_X, PANEL_H, PANEL_W, PANEL_Y, RIGHT_X, VIEW_H, VIEW_W } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_HINT = 4;
export const ACTION_MUTE = 8;
export const ACTION_RESTART = 16;
export const ACTION_NEXT = 32;

/** Which panel, if any, holds a canvas point; null when the point is outside both pictures. */
export function panelAt(canvasX, canvasY) {
  if (canvasY < PANEL_Y || canvasY > PANEL_Y + PANEL_H) return null;
  if (canvasX >= LEFT_X && canvasX <= LEFT_X + PANEL_W) {
    return { side: 'left', x: canvasX - LEFT_X, y: canvasY - PANEL_Y };
  }
  if (canvasX >= RIGHT_X && canvasX <= RIGHT_X + PANEL_W) {
    return { side: 'right', x: canvasX - RIGHT_X, y: canvasY - PANEL_Y };
  }
  return null;
}

export function createInput(canvas, onPointer) {
  const keysDown = new Set();
  let actions = 0;
  let clicks = [];
  let mouse = { x: VIEW_W / 2, y: PANEL_Y + PANEL_H / 2, inside: false };
  // The keyboard crosshair starts in the middle of the left picture.
  const crosshair = { x: LEFT_X + PANEL_W / 2, y: PANEL_Y + PANEL_H / 2, visible: false };
  const ARROW_SPEED = 420;

  function toCanvas(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * VIEW_W,
      y: ((event.clientY - rect.top) / rect.height) * VIEW_H,
    };
  }

  canvas.addEventListener('pointermove', (event) => {
    const point = toCanvas(event);
    mouse = { x: point.x, y: point.y, inside: true };
    crosshair.visible = false;
  });

  canvas.addEventListener('pointerdown', (event) => {
    const point = toCanvas(event);
    mouse = { x: point.x, y: point.y, inside: true };
    crosshair.visible = false;
    clicks.push(point);
    onPointer();
  });

  canvas.addEventListener('pointerleave', () => {
    mouse = { ...mouse, inside: false };
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    keysDown.add(event.code);
    if (event.code === 'Space' || event.code === 'Enter') {
      actions |= ACTION_CONFIRM;
      if (!crosshair.visible) {
        crosshair.x = mouse.x;
        crosshair.y = mouse.y;
      }
      crosshair.visible = true;
      clicks.push({ x: crosshair.x, y: crosshair.y });
      event.preventDefault();
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      actions |= ACTION_PAUSE;
    } else if (event.code === 'KeyH') {
      actions |= ACTION_HINT;
    } else if (event.code === 'KeyM') {
      actions |= ACTION_MUTE;
    } else if (event.code === 'KeyR') {
      actions |= ACTION_RESTART;
    } else if (event.code === 'KeyN') {
      actions |= ACTION_NEXT;
    } else if (event.code === 'Tab') {
      crosshair.visible = true;
      const onLeft = crosshair.x < LEFT_X + PANEL_W;
      crosshair.x = onLeft ? RIGHT_X + PANEL_W / 2 : LEFT_X + PANEL_W / 2;
      crosshair.y = PANEL_Y + PANEL_H / 2;
      event.preventDefault();
    }
    onPointer();
  });

  window.addEventListener('keyup', (event) => {
    keysDown.delete(event.code);
  });

  window.addEventListener('blur', () => {
    keysDown.clear();
  });

  return {
    /** Move the crosshair with the held arrow keys; call once per frame with seconds elapsed. */
    update(seconds) {
      if (!crosshair.visible) return;
      let dx = 0;
      let dy = 0;
      if (keysDown.has('ArrowLeft')) dx -= 1;
      if (keysDown.has('ArrowRight')) dx += 1;
      if (keysDown.has('ArrowUp')) dy -= 1;
      if (keysDown.has('ArrowDown')) dy += 1;
      if (dx === 0 && dy === 0) return;
      const length = Math.hypot(dx, dy);
      crosshair.x = Math.min(VIEW_W - 4, Math.max(4, crosshair.x + (dx / length) * ARROW_SPEED * seconds));
      crosshair.y = Math.min(VIEW_H - 4, Math.max(4, crosshair.y + (dy / length) * ARROW_SPEED * seconds));
    },
    /** The actions pressed since the last call, as a bitmask. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** The clicks since the last call, in canvas pixels. */
    takeClicks() {
      const taken = clicks;
      clicks = [];
      return taken;
    },
    mouse() {
      return mouse;
    },
    crosshair() {
      return crosshair;
    },
  };
}
