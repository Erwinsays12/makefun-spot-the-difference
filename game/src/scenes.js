// The three scenes of Twin Lanterns, drawn procedurally on canvas — no image files, no borrowed
// art. Each scene is one draw function that paints the same picture twice: once plain (the left
// panel) and once with a set of differences applied (the right panel). A difference is a small,
// fair change: something missing, something extra, or one colour swapped, always at a fixed spot
// the world can test a click against.
//
// Every scene draws in its own 560 by 560 space. The renderer translates the context to the
// panel's origin first, so the coordinates below are panel-local on both sides.

import { createRandom, range } from './random.js';

/* ---------- tiny shape helpers ---------- */

function disc(g, x, y, r, fill) {
  g.fillStyle = fill;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}

function ellipse(g, x, y, rx, ry, fill) {
  g.fillStyle = fill;
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.fill();
}

function rect(g, x, y, w, h, fill) {
  g.fillStyle = fill;
  g.fillRect(x, y, w, h);
}

function rrect(g, x, y, w, h, r, fill) {
  g.fillStyle = fill;
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
}

function poly(g, points, fill) {
  g.fillStyle = fill;
  g.beginPath();
  g.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) g.lineTo(points[i][0], points[i][1]);
  g.closePath();
  g.fill();
}

function line(g, x1, y1, x2, y2, stroke, width) {
  g.strokeStyle = stroke;
  g.lineWidth = width;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.stroke();
}

/** A four-point sparkle. */
function sparkle(g, x, y, r, fill) {
  g.fillStyle = fill;
  g.beginPath();
  g.moveTo(x, y - r);
  g.quadraticCurveTo(x, y, x + r, y);
  g.quadraticCurveTo(x, y, x, y + r);
  g.quadraticCurveTo(x, y, x - r, y);
  g.quadraticCurveTo(x, y, x, y - r);
  g.fill();
}

/** A soft cloud of three overlapping discs. */
function cloud(g, x, y, s, fill) {
  disc(g, x, y, 26 * s, fill);
  disc(g, x + 24 * s, y + 6 * s, 20 * s, fill);
  disc(g, x - 26 * s, y + 8 * s, 18 * s, fill);
  rect(g, x - 26 * s, y, 52 * s, 14 * s, fill);
}

/** A gull: two short arcs suggesting wings. */
function gull(g, x, y, s, stroke) {
  g.strokeStyle = stroke;
  g.lineWidth = 3 * s;
  g.lineCap = 'round';
  g.beginPath();
  g.arc(x - 9 * s, y, 9 * s, Math.PI * 1.15, Math.PI * 1.85);
  g.stroke();
  g.beginPath();
  g.arc(x + 9 * s, y, 9 * s, Math.PI * 1.15, Math.PI * 1.85);
  g.stroke();
}

function skyGradient(g, stops) {
  const gradient = g.createLinearGradient(0, 0, 0, 560);
  stops.forEach(([at, colour]) => gradient.addColorStop(at, colour));
  g.fillStyle = gradient;
  g.fillRect(0, 0, 560, 560);
}

/* ---------- scene 1: Harbor at Dusk ---------- */

function drawHarbor(g, diffs) {
  const has = (id) => diffs.has(id);
  const rng = createRandom(11);
  skyGradient(g, [[0, '#2c2a5e'], [0.45, '#b45a7a'], [0.62, '#f2a65e'], [1, '#f7c873']]);

  // Early stars, top of the sky.
  for (let i = 0; i < 14; i += 1) {
    sparkle(g, range(rng, 20, 540), range(rng, 12, 130), range(rng, 2.5, 5), '#fff7d6');
  }
  // The one star that only the right picture has.
  if (has('star')) sparkle(g, 492, 48, 6, '#fff7d6');

  // The low sun and its glow on the water.
  const sunGlow = g.createRadialGradient(430, 185, 10, 430, 185, 120);
  sunGlow.addColorStop(0, 'rgba(255, 236, 170, 0.9)');
  sunGlow.addColorStop(1, 'rgba(255, 236, 170, 0)');
  g.fillStyle = sunGlow;
  g.fillRect(300, 55, 260, 260);
  disc(g, 430, 185, 46, '#ffdf6b');
  disc(g, 430, 185, 34, '#ffe89a');

  // Clouds drifting over the dusk.
  cloud(g, 120, 72, 1, 'rgba(255, 214, 190, 0.85)');
  if (!has('cloud')) cloud(g, 300, 108, 0.8, 'rgba(255, 214, 190, 0.8)');
  cloud(g, 465, 62, 0.65, 'rgba(255, 214, 190, 0.85)');

  // Gulls.
  gull(g, 180, 92, 1, '#3a2f4d');
  if (!has('gull')) gull(g, 380, 92, 1, '#3a2f4d');
  gull(g, 300, 58, 0.8, '#3a2f4d');

  // The sea.
  const sea = g.createLinearGradient(0, 300, 0, 560);
  sea.addColorStop(0, '#7a5a8c');
  sea.addColorStop(0.4, '#4a4a7d');
  sea.addColorStop(1, '#2e2a55');
  g.fillStyle = sea;
  g.fillRect(0, 300, 560, 260);
  // Sun path shimmering on the water.
  for (let i = 0; i < 9; i += 1) {
    const y = 320 + i * 26;
    const w = 60 + i * 16;
    rect(g, 430 - w / 2 + range(rng, -8, 8), y, w, 5, 'rgba(255, 214, 120, 0.35)');
  }
  // Wave strokes.
  for (let i = 0; i < 16; i += 1) {
    const x = range(rng, 10, 550);
    const y = range(rng, 320, 540);
    line(g, x, y, x + range(rng, 24, 60), y, 'rgba(255, 255, 255, 0.22)', 3);
  }

  // Rocks at the foot of the lighthouse.
  poly(g, [[20, 560], [30, 470], [90, 430], [150, 470], [170, 560]], '#4a3a52');
  poly(g, [[120, 560], [150, 500], [210, 480], [240, 560]], '#3a2c42');
  disc(g, 60, 500, 14, '#5a4a62');
  disc(g, 190, 520, 18, '#5a4a62');

  // The lighthouse: striped tower, gallery, lamp room and one lit window.
  rect(g, 66, 150, 56, 300, '#f4ead8');
  rect(g, 66, 210, 56, 34, '#c94f5e');
  rect(g, 66, 300, 56, 34, '#c94f5e');
  rect(g, 66, 390, 56, 34, '#c94f5e');
  rrect(g, 58, 138, 72, 14, 4, '#3a2c42');
  rrect(g, 72, 108, 44, 32, 4, '#3a2c42');
  rect(g, 80, 116, 28, 18, '#ffe89a');
  poly(g, [[66, 108], [122, 108], [94, 82]], '#c94f5e');
  disc(g, 94, 80, 5, '#ffe89a');
  rrect(g, 86, 246, 16, 24, 6, has('window') ? '#3a2c42' : '#ffd76b');
  // The beam sweeping out to sea — or switched off.
  if (!has('beam')) {
    const beam = g.createLinearGradient(122, 124, 420, 190);
    beam.addColorStop(0, 'rgba(255, 232, 154, 0.55)');
    beam.addColorStop(1, 'rgba(255, 232, 154, 0)');
    g.fillStyle = beam;
    g.beginPath();
    g.moveTo(122, 112);
    g.lineTo(430, 150);
    g.lineTo(430, 205);
    g.lineTo(122, 138);
    g.closePath();
    g.fill();
  }

  // Two little boats.
  // Boat one: red sail, unless the right picture repainted it teal.
  poly(g, [[268, 392], [322, 392], [295, 396]], '#6b4a2f');
  rect(g, 258, 388, 80, 12, '#7a5233');
  poly(g, [[296, 388], [296, 318], [338, 388]], has('sail') ? '#2f8f8a' : '#d94f4f');
  poly(g, [[290, 388], [290, 332], [258, 388]], '#f4ead8');
  line(g, 296, 312, 296, 392, '#5a3a22', 3);
  // Boat two: white sail, further out.
  poly(g, [[428, 452], [462, 452], [445, 456]], '#6b4a2f');
  rect(g, 420, 448, 58, 10, '#7a5233');
  poly(g, [[446, 448], [446, 396], [474, 448]], '#f4ead8');
  line(g, 446, 392, 446, 452, '#5a3a22', 3);

  // The striped buoy, bobbing near the boats.
  if (!has('buoy')) {
    ellipse(g, 500, 442, 16, 20, '#e8b13c');
    rect(g, 484, 434, 32, 8, '#c94f5e');
    rect(g, 496, 414, 8, 22, '#c94f5e');
    disc(g, 500, 412, 5, '#ffe89a');
  }
}

const HARBOR_DIFFS = [
  { id: 'gull', x: 380, y: 92, r: 30, label: 'a gull' },
  { id: 'beam', x: 280, y: 158, r: 34, label: 'the lighthouse beam' },
  { id: 'buoy', x: 500, y: 436, r: 30, label: 'the buoy' },
  { id: 'sail', x: 312, y: 356, r: 30, label: 'the red sail' },
  { id: 'star', x: 492, y: 48, r: 26, label: 'an extra star' },
  { id: 'window', x: 94, y: 258, r: 26, label: 'the lighthouse window' },
  { id: 'cloud', x: 300, y: 108, r: 30, label: 'a cloud' },
];
/* ---------- scene 2: The Fox's Garden ---------- */

function drawGarden(g, diffs) {
  const has = (id) => diffs.has(id);
  const rng = createRandom(23);
  skyGradient(g, [[0, '#8ec9ee'], [0.55, '#cfeeda'], [1, '#fdf3cf']]);

  // The morning sun and its rays — one ray only shines in the left picture.
  disc(g, 472, 82, 40, '#ffdf6b');
  disc(g, 472, 82, 30, '#ffe89a');
  const rayAngles = [0, 45, 90, 135, 180, 225, 270, 315];
  rayAngles.forEach((angle, index) => {
    if (has('ray') && index === 0) return;
    const rad = (angle * Math.PI) / 180;
    line(g, 472 + Math.cos(rad) * 50, 82 + Math.sin(rad) * 50, 472 + Math.cos(rad) * 66, 82 + Math.sin(rad) * 66, '#ffdf6b', 5);
  });

  // A lazy cloud.
  cloud(g, 150, 66, 0.9, 'rgba(255, 255, 255, 0.9)');
  cloud(g, 330, 44, 0.6, 'rgba(255, 255, 255, 0.85)');

  // The old oak: trunk, branches and a round canopy.
  rect(g, 96, 250, 34, 170, '#7a5233');
  line(g, 112, 280, 70, 220, '#7a5233', 12);
  line(g, 118, 270, 168, 210, '#7a5233', 12);
  disc(g, 118, 180, 78, '#5d9c4f');
  disc(g, 60, 215, 52, '#6fae5e');
  disc(g, 180, 215, 56, '#6fae5e');
  disc(g, 118, 130, 48, '#7cba6a');
  // Acorns tucked in the canopy — one only grows in the left picture.
  disc(g, 84, 200, 7, '#a9803e');
  if (!has('acorn')) disc(g, 150, 150, 7, '#a9803e');
  disc(g, 196, 196, 7, '#a9803e');

  // The beehive hanging from the low branch.
  if (!has('hive')) {
    line(g, 168, 212, 168, 232, '#5a3a22', 3);
    ellipse(g, 168, 254, 26, 30, '#e8b13c');
    rect(g, 146, 246, 44, 7, '#c98f2a');
    rect(g, 150, 262, 36, 7, '#c98f2a');
    disc(g, 168, 272, 5, '#5a3a22');
  }

  // The meadow and the garden fence.
  rect(g, 0, 400, 560, 160, '#8fbf6a');
  rect(g, 0, 400, 560, 10, '#a5d183');
  for (let x = 20; x < 560; x += 52) {
    rect(g, x, 372, 10, 44, '#a9803e');
  }
  rect(g, 0, 380, 560, 8, '#a9803e');
  rect(g, 0, 402, 560, 8, '#a9803e');
  // A small bird perched on the fence — only on the left.
  if (!has('bird')) {
    disc(g, 482, 362, 12, '#4a6fa5');
    disc(g, 492, 352, 8, '#4a6fa5');
    poly(g, [[498, 354], [508, 357], [498, 360]], '#e8a13c');
    line(g, 476, 372, 490, 372, '#4a6fa5', 2);
  }

  // Stepping stones leading to the fox.
  ellipse(g, 300, 540, 34, 12, '#cfc4a8');
  ellipse(g, 350, 512, 30, 11, '#cfc4a8');
  ellipse(g, 268, 512, 28, 10, '#cfc4a8');

  // Grass tufts, scattered by the fixed seed.
  for (let i = 0; i < 18; i += 1) {
    const x = range(rng, 12, 548);
    const y = range(rng, 428, 548);
    line(g, x, y, x - 5, y - 12, '#5d9c4f', 2);
    line(g, x + 4, y, x + 8, y - 13, '#6fae5e', 2);
    line(g, x + 2, y, x + 2, y - 15, '#4f8a44', 2);
  }

  // Mushrooms by the oak's roots; the right picture grows one more.
  function mushroom(x, y, s, cap) {
    rect(g, x - 5 * s, y, 10 * s, 16 * s, '#f4ead8');
    g.fillStyle = cap;
    g.beginPath();
    g.arc(x, y, 20 * s, Math.PI, 0);
    g.closePath();
    g.fill();
    disc(g, x - 8 * s, y - 8 * s, 3 * s, '#fff');
    disc(g, x + 6 * s, y - 12 * s, 2.5 * s, '#fff');
  }
  mushroom(84, 496, 1, '#d94f4f');
  mushroom(196, 508, 0.8, '#d94f4f');
  if (has('mushroom')) mushroom(142, 512, 0.7, '#d94f4f');

  // The tulip bed.
  const tulipColours = ['#e85d75', '#e8a13c', '#e85d75', '#e85d75', '#e85d75', '#e8a13c'];
  tulipColours.forEach((colour, index) => {
    const x = 250 + index * 34;
    const y = 470;
    line(g, x, y, x, y + 34, '#4f8a44', 3);
    disc(g, x, y - 6, 11, colour);
    poly(g, [[x - 11, y - 6], [x, y - 22], [x + 11, y - 6]], colour);
  });

  // The fox, sitting up and watching the garden.
  // Body and haunch.
  ellipse(g, 330, 470, 52, 44, '#e07840');
  ellipse(g, 330, 500, 56, 22, '#f4ead8');
  // Tail curling out to the right, white-tipped on the left picture.
  g.strokeStyle = '#e07840';
  g.lineWidth = 26;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(372, 496);
  g.quadraticCurveTo(430, 500, 424, 452);
  g.stroke();
  g.strokeStyle = has('tail') ? '#e07840' : '#f4ead8';
  g.lineWidth = 26;
  g.beginPath();
  g.moveTo(420, 472);
  g.quadraticCurveTo(426, 452, 424, 448);
  g.stroke();
  // Head, ears and muzzle.
  disc(g, 330, 408, 34, '#e07840');
  poly(g, [[304, 386], [312, 350], [330, 380]], '#e07840');
  poly(g, [[330, 380], [348, 350], [356, 386]], '#e07840');
  poly(g, [[310, 374], [314, 356], [324, 370]], '#f4ead8');
  poly(g, [[336, 370], [346, 356], [350, 374]], '#f4ead8');
  ellipse(g, 330, 424, 20, 14, '#f4ead8');
  disc(g, 330, 416, 5, '#3a2c42');
  disc(g, 316, 400, 4, '#3a2c42');
  disc(g, 344, 400, 4, '#3a2c42');
  line(g, 312, 424, 300, 420, '#3a2c42', 2);
  line(g, 348, 424, 360, 420, '#3a2c42', 2);

  // The butterfly over the tulips.
  if (!has('butterfly')) {
    const bx = 432;
    const by = 210;
    ellipse(g, bx - 12, by - 6, 12, 8, '#9b6dd6');
    ellipse(g, bx + 12, by - 6, 12, 8, '#7c4fb8');
    ellipse(g, bx - 10, by + 8, 9, 6, '#b48ae0');
    ellipse(g, bx + 10, by + 8, 9, 6, '#9b6dd6');
    line(g, bx, by - 10, bx, by + 12, '#3a2c42', 3);
    disc(g, bx - 3, by - 12, 2, '#3a2c42');
    disc(g, bx + 3, by - 12, 2, '#3a2c42');
  }
}

const GARDEN_DIFFS = [
  { id: 'butterfly', x: 432, y: 210, r: 30, label: 'the butterfly' },
  { id: 'mushroom', x: 142, y: 500, r: 26, label: 'an extra mushroom' },
  { id: 'tail', x: 420, y: 460, r: 28, label: 'the fox tail tip' },
  { id: 'hive', x: 168, y: 252, r: 30, label: 'the beehive' },
  { id: 'acorn', x: 150, y: 150, r: 24, label: 'an acorn' },
  { id: 'bird', x: 484, y: 360, r: 26, label: 'the bird on the fence' },
  { id: 'ray', x: 472, y: 26, r: 26, label: 'a sun ray' },
];

/* ---------- scene 3: Lantern Night Market ---------- */

function drawMarket(g, diffs) {
  const has = (id) => diffs.has(id);
  const rng = createRandom(47);
  skyGradient(g, [[0, '#191638'], [0.55, '#33265e'], [1, '#5a2e5e']]);

  // Stars and the moon with its craters.
  for (let i = 0; i < 18; i += 1) {
    sparkle(g, range(rng, 16, 544), range(rng, 12, 220), range(rng, 2, 4.5), '#ffe9a8');
  }
  disc(g, 104, 92, 42, '#f7ead0');
  disc(g, 104, 92, 32, '#fdf6dd');
  disc(g, 92, 82, 7, '#e8d5ae');
  disc(g, 118, 106, 9, '#e8d5ae');
  if (has('crater')) disc(g, 116, 76, 6, '#e8d5ae');

  // The lantern string swaying across the top.
  g.strokeStyle = '#2a1e40';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(0, 46);
  g.quadraticCurveTo(280, 96, 560, 46);
  g.stroke();
  const lanternXs = [70, 160, 250, 340, 430, 510];
  const lanternColours = ['#e84f4f', '#e8a13c', '#e84f4f', '#e8a13c', '#e84f4f', '#e8a13c'];
  lanternXs.forEach((x, index) => {
    const y = 46 + Math.sin((x / 560) * Math.PI) * 34;
    line(g, x, y, x, y + 12, '#2a1e40', 2);
    const colour = has('lantern') && index === 2 ? '#3fae6a' : lanternColours[index];
    ellipse(g, x, y + 30, 16, 20, colour);
    rect(g, x - 6, y + 8, 12, 5, '#f7c873');
    rect(g, x - 6, y + 48, 12, 5, '#f7c873');
    line(g, x, y + 53, x, y + 66, '#f7c873', 2);
  });

  // Bunting flags under the lanterns — one flag missing on the right.
  const flagColours = ['#e84f4f', '#e8a13c', '#3fae6a', '#4a6fa5', '#9b6dd6'];
  for (let i = 0; i < 9; i += 1) {
    if (has('flag') && i === 4) continue;
    const x = 40 + i * 56;
    poly(g, [[x, 150], [x + 44, 150], [x + 22, 178]], flagColours[i % flagColours.length]);
  }

  // The rooftops and the market stalls.
  rect(g, 0, 470, 560, 90, '#241a38');
  // Left stall.
  rect(g, 56, 300, 190, 170, '#6b4a2f');
  rect(g, 66, 320, 170, 120, '#8a6a45');
  poly(g, [[46, 300], [256, 300], [236, 252], [66, 252]], '#c94f5e');
  rect(g, 46, 252, 210, 12, '#a83e4c');
  // Awning stripes on the left stall.
  for (let i = 0; i < 5; i += 1) {
    poly(g, [[66 + i * 42, 252], [86 + i * 42, 252], [96 + i * 42, 300], [76 + i * 42, 300]], i % 2 ? '#f4ead8' : '#c94f5e');
  }
  // The cat asleep on the left stall's roof.
  if (!has('cat')) {
    ellipse(g, 150, 240, 26, 12, '#3a2c42');
    disc(g, 172, 230, 11, '#3a2c42');
    poly(g, [[164, 222], [166, 208], [174, 220]], '#3a2c42');
    poly(g, [[174, 220], [182, 208], [182, 222]], '#3a2c42');
    g.strokeStyle = '#3a2c42';
    g.lineWidth = 6;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(126, 242);
    g.quadraticCurveTo(108, 232, 116, 216);
    g.stroke();
  }
  // Jars on the left counter.
  rrect(g, 84, 396, 26, 34, 6, '#7cba6a');
  rrect(g, 118, 400, 26, 30, 6, '#e8a13c');
  rrect(g, 152, 394, 26, 36, 6, '#e84f4f');
  // A paper fan pinned to the left stall.
  disc(g, 216, 360, 22, '#e8a13c');
  disc(g, 216, 360, 14, '#c94f5e');
  disc(g, 216, 360, 6, '#f4ead8');

  // Right stall.
  rect(g, 314, 300, 190, 170, '#6b4a2f');
  rect(g, 324, 320, 170, 120, '#8a6a45');
  poly(g, [[304, 300], [514, 300], [494, 252], [324, 252]], '#4a6fa5');
  rect(g, 304, 252, 210, 12, '#3a5a80');
  // Awning stripes on the right stall — one stripe swaps colour on the right.
  for (let i = 0; i < 5; i += 1) {
    const stripe = has('awning') && i === 2 ? '#e84f4f' : i % 2 ? '#f4ead8' : '#4a6fa5';
    poly(g, [[324 + i * 42, 252], [344 + i * 42, 252], [354 + i * 42, 300], [334 + i * 42, 300]], stripe);
  }
  // The shop window: warm and lit on the left, dark on the right.
  rrect(g, 340, 340, 60, 60, 6, has('window') ? '#241a38' : '#ffd76b');
  if (!has('window')) {
    line(g, 370, 340, 370, 400, '#6b4a2f', 4);
    line(g, 340, 370, 400, 370, '#6b4a2f', 4);
  }
  // Dumpling baskets on the right counter.
  ellipse(g, 440, 420, 30, 10, '#c98f2a');
  rect(g, 414, 396, 52, 24, '#e8b13c');
  rect(g, 414, 404, 52, 4, '#c98f2a');

  // The vendor's cart in the middle, with its steamer baskets.
  rect(g, 246, 430, 68, 60, '#7a5233');
  disc(g, 258, 494, 12, '#3a2c42');
  disc(g, 302, 494, 12, '#3a2c42');
  ellipse(g, 280, 428, 26, 9, '#c98f2a');
  rect(g, 256, 408, 48, 20, '#e8b13c');
  rect(g, 256, 416, 48, 3, '#c98f2a');
  if (has('basket')) {
    ellipse(g, 280, 404, 22, 8, '#c98f2a');
    rect(g, 260, 388, 40, 16, '#e8b13c');
    rect(g, 260, 394, 40, 3, '#c98f2a');
  }
  // Steam curling off the cart.
  g.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(272, 386);
  g.quadraticCurveTo(264, 366, 274, 348);
  g.stroke();
  g.beginPath();
  g.moveTo(290, 386);
  g.quadraticCurveTo(298, 364, 288, 346);
  g.stroke();

  // Cobblestones at the bottom.
  for (let i = 0; i < 12; i += 1) {
    ellipse(g, 30 + i * 48, 530 + (i % 2) * 12, 22, 9, '#3a2c52');
  }
}

const MARKET_DIFFS = [
  { id: 'lantern', x: 250, y: 92, r: 28, label: 'a green lantern' },
  { id: 'cat', x: 150, y: 234, r: 30, label: 'the cat on the roof' },
  { id: 'crater', x: 116, y: 76, r: 22, label: 'an extra moon crater' },
  { id: 'flag', x: 286, y: 162, r: 26, label: 'a bunting flag' },
  { id: 'awning', x: 420, y: 276, r: 26, label: 'an awning stripe' },
  { id: 'basket', x: 280, y: 396, r: 26, label: 'an extra steamer basket' },
  { id: 'window', x: 370, y: 370, r: 30, label: 'the shop window light' },
];

/* ---------- the scene table ---------- */

/** Every round, in order: its name, its painter and its seven differences. */
export const SCENES = [
  {
    id: 'harbor',
    name: 'Harbor at Dusk',
    subtitle: 'The lighthouse keeper swears nothing changed. Prove him wrong.',
    draw: drawHarbor,
    diffs: HARBOR_DIFFS,
  },
  {
    id: 'garden',
    name: "The Fox's Garden",
    subtitle: 'A fox, an oak, and seven small lies among the tulips.',
    draw: drawGarden,
    diffs: GARDEN_DIFFS,
  },
  {
    id: 'market',
    name: 'Lantern Night Market',
    subtitle: 'The stalls are buzzing — but something is off in the lamplight.',
    draw: drawMarket,
    diffs: MARKET_DIFFS,
  },
];
