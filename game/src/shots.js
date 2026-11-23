// Ember Court — deterministic screenshot setups.
// ?shot=start|play|win|loss&seed=N renders one frozen moment of the
// game, so the screenshots are real renders of the game's own code and
// look the same every time they are taken.

import { newGame, startGame } from './state.js';

function creature(id, atk, hp, canAttack = true) {
  return { id, atk, hp, maxHp: hp, canAttack };
}

export function applyShot(state, name, seed) {
  state.shot = name;

  if (name === 'start') {
    state.phase = 'title';
    return 'Title screen — the Court waits for a challenger';
  }

  if (name === 'play') {
    // THE cover: a mid-duel table — both hands, both boards, life and
    // mana totals, the log, and a creature ready to attack.
    startGame(state);
    state.turnCount = 5;
    const p = state.player;
    const a = state.ai;
    p.life = 24; p.mana = 6; p.maxMana = 7;
    a.life = 19; a.mana = 3; a.maxMana = 7;
    p.board = [
      creature('hound', 3, 3),
      creature('eel', 2, 4),
      creature('falcon', 4, 2),
    ];
    a.board = [
      creature('bramble', 1, 5),
      creature('kite', 3, 1),
    ];
    p.hand = ['drake', 'spark', 'mend', 'imp', 'map'];
    a.hand = ['imp', 'eel', 'spark', 'pup', 'rain'];
    state.log = [
      'The Duchess plays Thorn Bramble (1/5).',
      'Your Gale Falcon strikes the Duchess for 4.',
      'Your turn — 6 mana.',
      'Ember Hound trades with Tide Eel.',
      'The Court is in session.',
    ];
    return 'Mid-duel — both hands, both boards, life and mana in one frame';
  }

  if (name === 'win') {
    startGame(state);
    state.turnCount = 9;
    const p = state.player;
    const a = state.ai;
    p.life = 14; p.mana = 2; p.maxMana = 9;
    a.life = 0; a.mana = 0; a.maxMana = 9;
    p.board = [creature('drake', 5, 4, false), creature('leviathan', 6, 3, false)];
    a.board = [];
    p.hand = ['mend', 'imp'];
    a.hand = ['sprite'];
    state.phase = 'won';
    state.over = true;
    state.log = [
      'The Duchess falls. The Court is yours.',
      'Your Ember Drake strikes the Duchess for 5.',
      'Your turn — 2 mana.',
    ];
    return 'Victory — the Duchess falls, the Court is yours';
  }

  if (name === 'loss') {
    startGame(state);
    state.turnCount = 8;
    const p = state.player;
    const a = state.ai;
    p.life = 0; p.mana = 0; p.maxMana = 8;
    a.life = 11; a.mana = 4; a.maxMana = 8;
    p.board = [];
    a.board = [creature('leviathan', 6, 6, false), creature('hound', 3, 1, false)];
    p.hand = ['pup'];
    a.hand = ['drake', 'spark'];
    state.phase = 'lost';
    state.over = true;
    state.log = [
      'Your flame gutters out. The Duchess keeps the Court.',
      'Tide Leviathan strikes you for 6.',
      'The Duchess takes her turn.',
    ];
    return 'Defeat — your flame gutters out';
  }

  return '';
}

// Build a fresh state already posed for a shot, for the screenshot run.
export function stateForShot(name, seed = 1) {
  const state = newGame(seed);
  applyShot(state, name, seed);
  return state;
}
