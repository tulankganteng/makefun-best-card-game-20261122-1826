// Ember Court — every card in the Court deck.
// Original names, art and text: no card here copies a commercial game.
// Creatures fight on the board (attack / health); spells resolve at once.

export const CARDS = [
  // --- Ember creatures: cheap, hot, fragile ---------------------------
  { id: 'imp', name: 'Ember Imp', house: 'ember', kind: 'creature', cost: 1, atk: 2, hp: 1,
    text: 'A spark with teeth.' },
  { id: 'hound', name: 'Ember Hound', house: 'ember', kind: 'creature', cost: 3, atk: 3, hp: 3,
    text: 'It fetches the fire back.' },
  { id: 'drake', name: 'Ember Drake', house: 'ember', kind: 'creature', cost: 5, atk: 5, hp: 4,
    text: 'The Court keeps one for a reason.' },
  // --- Tide creatures: patient, hard to remove ------------------------
  { id: 'sprite', name: 'Tide Sprite', house: 'tide', kind: 'creature', cost: 1, atk: 1, hp: 2,
    text: 'Small. Slippery. Everywhere.' },
  { id: 'eel', name: 'Tide Eel', house: 'tide', kind: 'creature', cost: 3, atk: 2, hp: 4,
    text: 'It bites the hand that feeds it.' },
  { id: 'leviathan', name: 'Tide Leviathan', house: 'tide', kind: 'creature', cost: 6, atk: 6, hp: 6,
    text: 'The deep answers when called.' },
  // --- Thorn creatures: slow, stubborn, outlasts you -------------------
  { id: 'pup', name: 'Thorn Pup', house: 'thorn', kind: 'creature', cost: 2, atk: 2, hp: 2,
    text: 'It chews the furniture. Then you.' },
  { id: 'bramble', name: 'Thorn Bramble', house: 'thorn', kind: 'creature', cost: 3, atk: 1, hp: 5,
    text: 'Cut it down. It grows back.' },
  { id: 'ancient', name: 'Thorn Ancient', house: 'thorn', kind: 'creature', cost: 6, atk: 4, hp: 7,
    text: 'Older than the Court itself.' },
  // --- Gale creatures: fast, sharp, thin -------------------------------
  { id: 'kite', name: 'Gale Kite', house: 'gale', kind: 'creature', cost: 2, atk: 3, hp: 1,
    text: 'You hear it after it hits.' },
  { id: 'falcon', name: 'Gale Falcon', house: 'gale', kind: 'creature', cost: 4, atk: 4, hp: 3,
    text: 'It hunts from above the clouds.' },
  { id: 'stormrider', name: 'Gale Stormrider', house: 'gale', kind: 'creature', cost: 5, atk: 4, hp: 5,
    text: 'Rides the storm in, never out.' },
  // --- Spells ------------------------------------------------------------
  { id: 'spark', name: 'Spark Burst', house: 'ember', kind: 'spell', cost: 2, target: 'any',
    text: 'Deal 3 damage to any target.' },
  { id: 'mend', name: 'Mend', house: 'tide', kind: 'spell', cost: 2, target: 'self',
    text: 'Restore 5 life to your hero.' },
  { id: 'map', name: 'Whispered Map', house: 'gale', kind: 'spell', cost: 2, target: 'none',
    text: 'Draw 2 cards.' },
  { id: 'rain', name: 'Cinder Rain', house: 'ember', kind: 'spell', cost: 4, target: 'none',
    text: 'Deal 2 damage to all enemy creatures.' },
];

export const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));

// The 30-card Court deck: two of every creature, spells weighted light.
export const DECK_LIST = [
  'imp', 'imp', 'hound', 'hound', 'drake', 'drake',
  'sprite', 'sprite', 'eel', 'eel', 'leviathan', 'leviathan',
  'pup', 'pup', 'bramble', 'bramble', 'ancient', 'ancient',
  'kite', 'kite', 'falcon', 'falcon', 'stormrider', 'stormrider',
  'spark', 'spark', 'mend', 'mend', 'map', 'rain',
];

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffledDeck(seed) {
  const rnd = mulberry32(seed);
  const deck = [...DECK_LIST];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
