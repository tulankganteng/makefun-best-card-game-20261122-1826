// Ember Court — the frame loop: draw, listen, and let the Duchess
// take her turn on a timer. No build step, no network, plain modules.

import { CANVAS_W, CANVAS_H, AI } from './config.js';
import { newGame, endTurn } from './state.js';
import { aiTick } from './ai.js';
import { draw } from './render.js';
import { handleClick, handleKey } from './input.js';
import { applyShot } from './shots.js';
import { sfx } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '1');

let state = newGame(seed);
let hover = null;
let lastPhase = state.phase;
let aiStartedAt = 0;

if (shotName) {
  const note = applyShot(state, shotName, seed);
  console.log(`[shot] ${shotName}: ${note}`);
  // Frozen frame: draw once and stop, so the screenshot is deterministic.
  draw(ctx, state, null);
} else {
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    hover = {
      x: (e.clientX - r.left) * (CANVAS_W / r.width),
      y: (e.clientY - r.top) * (CANVAS_H / r.height),
    };
  });
  canvas.addEventListener('mouseleave', () => { hover = null; });
  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * (CANVAS_W / r.width);
    const y = (e.clientY - r.top) * (CANVAS_H / r.height);
    const before = state.phase;
    handleClick(state, x, y);
    if (state.phase !== before) sfx.play();
  });
  window.addEventListener('keydown', (e) => {
    if ([' ', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
    handleKey(state, e.key);
  });

  function frame(now) {
    // The Duchess takes her turn one move at a time.
    if (state.phase === 'playing' && state.turn === 'ai') {
      if (!aiStartedAt) aiStartedAt = now + AI.firstMs;
      if (now >= aiStartedAt) {
        if (state.aiTimer === 0) state.aiTimer = now;
        const done = aiTick(state, now);
        if (done) aiStartedAt = 0;
      }
    } else {
      aiStartedAt = 0;
    }

    if (state.phase !== lastPhase) {
      if (state.phase === 'won') sfx.win();
      if (state.phase === 'lost') sfx.lose();
      lastPhase = state.phase;
    }

    draw(ctx, state, hover);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// Expose the state for play-testing from the console.
window.__emberCourt = { get state() { return state; }, newGame, endTurn };
