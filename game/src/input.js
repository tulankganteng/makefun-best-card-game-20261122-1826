// Ember Court — mouse and keyboard.
// Click a hand card to play it (or to arm a spell that needs a target),
// click one of your creatures, then an enemy creature or the Duchess,
// to attack. Keys 1-7 select hand cards, Space/Enter ends the turn,
// R restarts, Esc cancels a selection.

import { CARD_BY_ID } from './cards.js';
import { canPlay, playCard, canAttackWith, attack, endTurn, startGame, newGame } from './state.js';
import { handRects, boardRects, heroRect, endTurnRect, inRect } from './render.js';

function needsTargetFor(state, handIndex) {
  const card = CARD_BY_ID[state.player.hand[handIndex]];
  return card && card.kind === 'spell' && card.target === 'any';
}

export function handleClick(state, x, y) {
  if (state.phase === 'title') {
    startGame(state);
    return;
  }
  if (state.phase === 'won' || state.phase === 'lost') return;
  if (state.turn !== 'player') return;

  // End Turn button.
  if (inRect(x, y, endTurnRect())) {
    endTurn(state);
    return;
  }

  // A target is armed: enemy board, then the Duchess herself.
  if (state.selection && state.selection.needsTarget) {
    const aiRects = boardRects(state, 'ai');
    for (let i = 0; i < aiRects.length; i++) {
      if (inRect(x, y, aiRects[i])) {
        const sel = state.selection;
        const target = { kind: 'board', who: 'ai', index: i };
        if (sel.kind === 'hand') playCard(state, 'player', sel.index, target);
        else attack(state, 'player', sel.index, target);
        state.selection = null;
        return;
      }
    }
    if (inRect(x, y, heroRect(state, 'ai'))) {
      const sel = state.selection;
      const target = { kind: 'hero', who: 'ai' };
      if (sel.kind === 'hand') playCard(state, 'player', sel.index, target);
      else attack(state, 'player', sel.index, target);
      state.selection = null;
      return;
    }
    // Clicked nowhere valid: cancel.
    state.selection = null;
    return;
  }

  // Own board: select a ready creature to attack with.
  const myRects = boardRects(state, 'player');
  for (let i = 0; i < myRects.length; i++) {
    if (inRect(x, y, myRects[i])) {
      if (canAttackWith(state, 'player', i)) {
        state.selection = { kind: 'board', index: i, needsTarget: true };
      }
      return;
    }
  }

  // Hand: play the card, or arm it if it needs a target.
  const hRects = handRects(state);
  for (let i = 0; i < hRects.length; i++) {
    if (inRect(x, y, hRects[i])) {
      if (!canPlay(state, 'player', i)) {
        state.selection = null;
        return;
      }
      if (needsTargetFor(state, i)) {
        state.selection = { kind: 'hand', index: i, needsTarget: true };
      } else {
        playCard(state, 'player', i);
        state.selection = null;
      }
      return;
    }
  }

  state.selection = null;
}

export function handleKey(state, key) {
  if (key === 'r' || key === 'R') {
    const seed = state.seed + 1;
    const fresh = newGame(seed);
    Object.keys(state).forEach((k) => delete state[k]);
    Object.assign(state, fresh);
    return;
  }
  if (state.phase === 'title' && (key === 'Enter' || key === ' ')) {
    startGame(state);
    return;
  }
  if (state.phase !== 'playing' || state.turn !== 'player') return;
  if (key === 'Escape') {
    state.selection = null;
    return;
  }
  if (key === ' ' || key === 'Enter') {
    if (state.selection && state.selection.needsTarget) {
      // Enter with an armed spell/attack targets the enemy hero.
      const sel = state.selection;
      const target = { kind: 'hero', who: 'ai' };
      if (sel.kind === 'hand') playCard(state, 'player', sel.index, target);
      else attack(state, 'player', sel.index, target);
      state.selection = null;
      return;
    }
    endTurn(state);
    return;
  }
  const n = Number(key);
  if (n >= 1 && n <= 7) {
    const i = n - 1;
    if (i >= state.player.hand.length) return;
    if (!canPlay(state, 'player', i)) return;
    if (needsTargetFor(state, i)) {
      state.selection = { kind: 'hand', index: i, needsTarget: true };
    } else {
      playCard(state, 'player', i);
      state.selection = null;
    }
  }
}
