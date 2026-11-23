// Ember Court — tuning constants for the whole duel.
// One place holds every number the other modules read, so balancing
// never means hunting through the game code.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

// The green baize table the duel is played on.
export const TABLE = { x: 24, y: 24, w: 1232, h: 672 };

// A duel: first to take the other side's life to 0 wins.
export const HERO = {
  life: 30,
  handSize: 7,
  boardMax: 5,
  startHand: 4,
  maxMana: 10,
};

// Card geometry on the table (player hand, bottom row).
export const CARD = { w: 116, h: 158, gap: 10, fan: 14 };
export const MINI = { w: 96, h: 128 }; // board creatures

// The four houses of the Court. Each has a colour, a suit mark and a
// one-line flavour the card text leans on.
export const HOUSES = {
  ember: { name: 'Ember', mark: '🔥', color: '#e2583e', dark: '#7a2417', text: 'burns bright, burns fast' },
  tide: { name: 'Tide', mark: '💧', color: '#3e8fe2', dark: '#174a7a', text: 'wears the other side down' },
  thorn: { name: 'Thorn', mark: '🌿', color: '#58a34a', dark: '#2c5a24', text: 'grows back thicker' },
  gale: { name: 'Gale', mark: '🍃', color: '#d8b13c', dark: '#7a5f14', text: 'strikes before it is seen' },
};

// Turn timing for the AI, in milliseconds between its moves.
export const AI = { thinkMs: 650, firstMs: 900 };
