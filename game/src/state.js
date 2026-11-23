// Ember Court — the duel itself: turns, mana, drawing, playing cards,
// attacking, fatigue, and the win/loss conditions. No rendering here;
// render.js draws whatever this state holds.

import { HERO } from './config.js';
import { CARD_BY_ID, shuffledDeck } from './cards.js';

export function makeSide(name, seed) {
  return {
    name,
    life: HERO.life,
    mana: 0,
    maxMana: 0,
    deck: shuffledDeck(seed),
    hand: [],
    board: [],
    fatigue: 0,
  };
}

export function newGame(seed = 1) {
  const state = {
    seed,
    phase: 'title', // title | playing | won | lost
    turn: 'player',
    turnCount: 0,
    player: makeSide('You', seed),
    ai: makeSide('The Cinder Duchess', seed + 101),
    log: ['The Court is in session.'],
    selection: null, // { kind: 'hand', index } | { kind: 'board', index }
    target: null,
    message: '',
    aiQueue: [],
    aiTimer: 0,
    over: false,
  };
  for (let i = 0; i < HERO.startHand; i++) drawCard(state, 'player');
  for (let i = 0; i < HERO.startHand; i++) drawCard(state, 'ai');
  return state;
}

export function sideOf(state, who) {
  return who === 'player' ? state.player : state.ai;
}
export function foeOf(state, who) {
  return who === 'player' ? state.ai : state.player;
}

export function log(state, text) {
  state.log.unshift(text);
  if (state.log.length > 6) state.log.length = 6;
}

// "You play" but "The Cinder Duchess plays": the player is second person.
function subj(side, verb) {
  return side.name === 'You' ? `You ${verb}` : `${side.name} ${verb}s`;
}

export function drawCard(state, who) {
  const side = sideOf(state, who);
  if (side.deck.length === 0) {
    side.fatigue += 1;
    side.life -= side.fatigue;
    log(state, `${subj(side, 'draw')} from an empty deck — fatigue ${side.fatigue}.`);
    checkEnd(state);
    return null;
  }
  const id = side.deck.pop();
  if (side.hand.length >= HERO.handSize) {
    log(state, `${side.name === 'You' ? 'Your' : `${side.name}'s`} hand is full — ${CARD_BY_ID[id].name} burns away.`);
    return null;
  }
  side.hand.push(id);
  return id;
}

export function startTurn(state, who) {
  const side = sideOf(state, who);
  state.turn = who;
  state.turnCount += who === 'player' ? 1 : 0;
  side.maxMana = Math.min(HERO.maxMana, side.maxMana + 1);
  side.mana = side.maxMana;
  for (const c of side.board) c.canAttack = true;
  drawCard(state, who);
  log(state, who === 'player' ? `Your turn — ${side.mana} mana.` : `The Duchess takes her turn.`);
}

export function startGame(state) {
  state.phase = 'playing';
  state.player.maxMana = 0;
  startTurn(state, 'player');
  log(state, 'Play a card, then attack. End your turn with Space or the button.');
}

export function canPlay(state, who, handIndex) {
  const side = sideOf(state, who);
  if (state.phase !== 'playing' || state.turn !== who) return false;
  const card = CARD_BY_ID[side.hand[handIndex]];
  if (!card) return false;
  if (card.cost > side.mana) return false;
  if (card.kind === 'creature' && side.board.length >= HERO.boardMax) return false;
  return true;
}

// target: null | { kind: 'hero', who } | { kind: 'board', who, index }
export function playCard(state, who, handIndex, target = null) {
  const side = sideOf(state, who);
  const foe = foeOf(state, who);
  const card = CARD_BY_ID[side.hand[handIndex]];
  if (!card || !canPlay(state, who, handIndex)) return false;

  if (card.kind === 'spell' && card.target === 'any' && !target) return false;
  if (card.kind === 'spell' && card.target === 'self' && target) return false;

  side.hand.splice(handIndex, 1);
  side.mana -= card.cost;

  if (card.kind === 'creature') {
    side.board.push({ id: card.id, atk: card.atk, hp: card.hp, maxHp: card.hp, canAttack: false });
    log(state, `${subj(side, 'play')} ${card.name} (${card.atk}/${card.hp}).`);
  } else if (card.id === 'spark') {
    damageTarget(state, who, target, 3);
    log(state, `${subj(side, 'cast')} Spark Burst for 3.`);
  } else if (card.id === 'mend') {
    side.life = Math.min(HERO.life, side.life + 5);
    log(state, `${subj(side, 'mend')} 5 life.`);
  } else if (card.id === 'map') {
    drawCard(state, who);
    drawCard(state, who);
    log(state, `${subj(side, 'consult')} the Whispered Map.`);
  } else if (card.id === 'rain') {
    for (const c of [...foe.board]) {
      c.hp -= 2;
      if (c.hp <= 0) removeDead(state, foe);
    }
    log(state, `${subj(side, 'call')} down Cinder Rain.`);
  }
  checkEnd(state);
  return true;
}

export function damageTarget(state, who, target, amount) {
  const foe = foeOf(state, who);
  if (target.kind === 'hero') {
    const victim = sideOf(state, target.who);
    victim.life -= amount;
    log(state, `${subj(victim, 'take')} ${amount} damage.`);
  } else {
    const victim = sideOf(state, target.who).board[target.index];
    if (!victim) return;
    victim.hp -= amount;
    log(state, `${CARD_BY_ID[victim.id].name} takes ${amount} damage.`);
    removeDead(state, sideOf(state, target.who));
  }
  checkEnd(state);
}

export function removeDead(state, side) {
  side.board = side.board.filter((c) => c.hp > 0);
}

export function canAttackWith(state, who, boardIndex) {
  const side = sideOf(state, who);
  const c = side.board[boardIndex];
  return state.phase === 'playing' && state.turn === who && !!c && c.canAttack;
}

// target: { kind: 'hero', who } | { kind: 'board', who, index }
export function attack(state, who, boardIndex, target) {
  const side = sideOf(state, who);
  const foe = foeOf(state, who);
  const attacker = side.board[boardIndex];
  if (!attacker || !canAttackWith(state, who, boardIndex)) return false;

  if (target.kind === 'hero') {
    const victim = sideOf(state, target.who);
    victim.life -= attacker.atk;
    attacker.canAttack = false;
    log(state, `${CARD_BY_ID[attacker.id].name} strikes ${victim.name} for ${attacker.atk}.`);
  } else {
    const victim = sideOf(state, target.who).board[target.index];
    if (!victim) return false;
    victim.hp -= attacker.atk;
    attacker.hp -= victim.atk;
    attacker.canAttack = false;
    log(state, `${CARD_BY_ID[attacker.id].name} trades with ${CARD_BY_ID[victim.id].name}.`);
    removeDead(state, side);
    removeDead(state, foe);
  }
  checkEnd(state);
  return true;
}

export function endTurn(state) {
  if (state.phase !== 'playing' || state.turn !== 'player') return;
  state.selection = null;
  state.target = null;
  startTurn(state, 'ai');
}

export function checkEnd(state) {
  if (state.over) return;
  if (state.ai.life <= 0) {
    state.ai.life = 0;
    state.phase = 'won';
    state.over = true;
    log(state, 'The Duchess falls. The Court is yours.');
  } else if (state.player.life <= 0) {
    state.player.life = 0;
    state.phase = 'lost';
    state.over = true;
    log(state, 'Your flame gutters out. The Duchess keeps the Court.');
  }
}
