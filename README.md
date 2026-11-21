[![make.fun](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/c/best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/Erwinsays12/makefun-spot-the-difference/rank.svg)](https://make.fun/c/best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/Erwinsays12/makefun-spot-the-difference/reward.svg)](https://make.fun/c/best-spot-the-difference-game-20261121-0451)

# Twin Lanterns — Spot the Difference

A spot-the-difference hunt in three lantern-lit scenes, entered in the
[make.fun best spot the difference game bounty](https://make.fun/c/best-spot-the-difference-game-20261121-0451).

Two pictures hang side by side. Seven small things changed in the right one — a missing gull
over the harbor, a repainted sail, a fox's tail tip, a cat asleep on a market roof. Click a
difference on either picture to circle it in gold, and find all seven before the clock runs out.

## How to play

- **Mouse:** click a difference on either picture.
- **Keyboard:** arrow keys move the crosshair, Space or Enter clicks where it stands, Tab jumps
  between the two pictures.
- **H** spends a hint (3 per round, 8 second cooldown, −40 points). **P** pauses. **M** toggles
  sound. **R** restarts. **N** moves to the next round after a clear.

## The rounds

1. **Harbor at Dusk** — a lighthouse, two boats and a low sun. 100 seconds.
2. **The Fox's Garden** — a fox under an old oak, tulips and a beehive. 90 seconds.
3. **Lantern Night Market** — paper lanterns, steamer baskets and a cat on the roof. 80 seconds.

Each find scores 100 points plus a combo bonus for finds in a row; a wrong click costs 15 points
and breaks the combo. Clearing a round pays 5 points per second left on the clock. Finish all
three rounds to earn a rank, from Casual Glancer up to Eagle Eye.

## Running it

Serve `game/` with any static server — `node serve.ts` opens it at http://localhost:8080 — and
open `game/index.html` in desktop Chrome. No build step, no network requests: every sound is
synthesized with WebAudio and every picture is drawn procedurally on canvas.

`?shot=start|play|win` stages a screenshot scene instead of running the loop.

## Layout

- `game/index.html` — the page, one canvas and the module entry point.
- `game/src/main.js` — boot, the frame loop and screen changes.
- `game/src/world.js` — the state machine: rounds, clock, score, hints.
- `game/src/scenes.js` — the three original scenes and their seven differences each.
- `game/src/render.js` — the table, panels, HUD, markers and end screens.
- `game/src/input.js` — mouse and keyboard, including the crosshair.
- `game/src/audio.js` — synthesized chimes, buzzes and fanfares.
- `game/src/config.js` — sizes, times and score rules.
- `game/src/random.js` — the seeded generator behind the scenery.
- `game/src/shots.js` — the staged screenshot scenes.
- `main.ts` — hands `game/` and `screenshots/` in as the entry.

## License

MIT — see [LICENSE](LICENSE).
