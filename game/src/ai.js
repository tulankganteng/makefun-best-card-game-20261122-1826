// Ember Court — the Cinder Duchess plays by a simple, honest heuristic:
// spend mana on the best value she can afford, attack with everything
// ready, and finish the player when the numbers say she can. No hidden
// information, no cheating: she sees only her own hand and the board.

import { CARD_BY_ID } from './cards.js';
import { canPlay, playCard, canAttackWith, attack, drawCard, log, startTurn } from './state.js';

// One AI move: either a card play or one attack. Returns true when it
// did something, false when it is done for the turn.
export function aiStep(state) {
  const ai = state.ai;
  const foe = state.player;

  // 1. Lethal check: if the board can end it, swing for the hero.
  const readyAtk = ai.board.reduce((s, c) => s + (c.canAttack ? c.atk : 0), 0);
  if (readyAtk >= foe.life && ai.board.some((c) => c.canAttack)) {
    const i = ai.board.findIndex((c) => c.canAttack);
    return attack(state, 'ai', i, { kind: 'hero', who: 'player' });
  }

  // 2. Mend when hurt and it is cheap.
  const mendIdx = ai.hand.findIndex((id) => id === 'mend');
  if (mendIdx >= 0 && ai.life <= 12 && canPlay(state, 'ai', mendIdx)) {
    return playCard(state, 'ai', mendIdx);
  }

  // 3. Play the most expensive creature she can afford, creatures first.
  let bestIdx = -1;
  let bestCost = -1;
  ai.hand.forEach((id, i) => {
    const card = CARD_BY_ID[id];
    if (card.kind === 'creature' && card.cost > bestCost && canPlay(state, 'ai', i)) {
      bestCost = card.cost;
      bestIdx = i;
    }
  });
  if (bestIdx >= 0) return playCard(state, 'ai', bestIdx);

  // 4. Spark Burst at the biggest enemy creature, or the hero when ahead.
  const sparkIdx = ai.hand.findIndex((id) => id === 'spark');
  if (sparkIdx >= 0 && canPlay(state, 'ai', sparkIdx)) {
    let target = { kind: 'hero', who: 'player' };
    let biggest = -1;
    foe.board.forEach((c, i) => {
      if (c.atk + c.hp > biggest) { biggest = c.atk + c.hp; target = { kind: 'board', who: 'player', index: i }; }
    });
    if (foe.board.length > 0 || ai.life > foe.life) {
      return playCard(state, 'ai', sparkIdx, target);
    }
  }

  // 5. Draw when the hand is thin and mana is spare.
  const mapIdx = ai.hand.findIndex((id) => id === 'map');
  if (mapIdx >= 0 && ai.hand.length <= 3 && canPlay(state, 'ai', mapIdx)) {
    return playCard(state, 'ai', mapIdx);
  }

  // 6. Cinder Rain when the player has a wide board.
  const rainIdx = ai.hand.findIndex((id) => id === 'rain');
  if (rainIdx >= 0 && foe.board.length >= 3 && canPlay(state, 'ai', rainIdx)) {
    return playCard(state, 'ai', rainIdx);
  }

  // 7. Attack: trade up when possible, else go for the hero.
  for (let i = 0; i < ai.board.length; i++) {
    if (!canAttackWith(state, 'ai', i)) continue;
    const attacker = ai.board[i];
    let prey = -1;
    foe.board.forEach((c, j) => {
      if (c.atk <= attacker.hp && c.hp <= attacker.atk && (prey < 0 || c.atk > foe.board[prey].atk)) prey = j;
    });
    if (prey >= 0) return attack(state, 'ai', i, { kind: 'board', who: 'player', index: prey });
    return attack(state, 'ai', i, { kind: 'hero', who: 'player' });
  }

  return false;
}

// Drive the Duchess through her whole turn, one move per tick, then
// hand the turn back. main.js calls this on a timer while it is the
// AI's turn; it returns true when the turn is finished.
export function aiTick(state, now) {
  if (state.phase !== 'playing' || state.turn !== 'ai' || state.over) return true;
  if (now < state.aiTimer) return false;
  const did = aiStep(state);
  if (state.over) return true;
  if (!did) {
    state.aiTimer = 0;
    state.aiQueue = [];
    state.selection = null;
    startTurn(state, 'player');
    return true;
  }
  state.aiTimer = now + 650;
  return false;
}
