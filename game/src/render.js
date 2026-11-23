// Ember Court — everything the eye sees, drawn on one canvas.
// The table, both hands, both boards, life and mana, the log, and the
// title / victory / defeat screens. input.js asks this module where
// things are, so hit-testing and drawing always agree.

import { CANVAS_W, CANVAS_H, CARD, MINI, HOUSES, HERO } from './config.js';
import { CARD_BY_ID } from './cards.js';

const W = CANVAS_W;
const H = CANVAS_H;

// --- layout: every rect the mouse can touch -----------------------------
export function handRects(state) {
  const n = state.player.hand.length;
  const total = n * (CARD.w + CARD.gap) - CARD.gap;
  const x0 = (W - total) / 2;
  return state.player.hand.map((_, i) => ({
    x: x0 + i * (CARD.w + CARD.gap),
    y: H - CARD.h - 14,
    w: CARD.w,
    h: CARD.h,
  }));
}

export function boardRects(state, who) {
  const board = who === 'player' ? state.player.board : state.ai.board;
  const n = board.length;
  const total = n * (MINI.w + 12) - 12;
  const x0 = (W - total) / 2;
  const y = who === 'player' ? 392 : 196;
  return board.map((_, i) => ({
    x: x0 + i * (MINI.w + 12),
    y,
    w: MINI.w,
    h: MINI.h,
  }));
}

export function heroRect(state, who) {
  return who === 'player'
    ? { x: 36, y: H - 108, w: 150, h: 92 }
    : { x: 36, y: 20, w: 150, h: 92 };
}

export function endTurnRect() {
  return { x: W - 196, y: H - 104, w: 160, h: 56 };
}

export function aiHandRects(state) {
  const n = state.ai.hand.length;
  const total = n * 34 + 60;
  const x0 = (W - total) / 2;
  return state.ai.hand.map((_, i) => ({ x: x0 + i * 34, y: 26, w: 94, h: 60 }));
}

// --- small drawing helpers ------------------------------------------------
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function inRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

// --- cards ------------------------------------------------------------------
function drawCardFace(ctx, cardId, rect, opts = {}) {
  const card = CARD_BY_ID[cardId];
  const house = HOUSES[card.house];
  const { selected = false, playable = false, dim = false, small = false } = opts;
  // Board creatures show their CURRENT attack/health, not the printed one.
  const atk = opts.stats ? opts.stats.atk : card.atk;
  const hp = opts.stats ? opts.stats.hp : card.hp;
  const { x, y, w, h } = rect;
  const bandH = small ? 26 : 34;

  ctx.save();
  if (dim) ctx.globalAlpha = 0.55;
  rr(ctx, x, y, w, h, 10);
  ctx.fillStyle = '#f7efdd';
  ctx.fill();
  ctx.lineWidth = selected ? 4 : 2;
  ctx.strokeStyle = selected ? '#ffd94a' : playable ? '#7ee787' : '#3a2c1c';
  ctx.stroke();

  // House band, with the house name across it.
  ctx.save();
  rr(ctx, x, y, w, bandH, 10);
  ctx.fillStyle = house.color;
  ctx.fill();
  ctx.fillRect(x, y + bandH - 10, w, 10);
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${small ? 10 : 12}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(house.name.toUpperCase(), x + w / 2 + (small ? 8 : 10), y + bandH / 2 + 1);

  // Cost gem, overlapping the band's top-left corner.
  ctx.beginPath();
  ctx.arc(x + 18, y + 18, small ? 13 : 16, 0, Math.PI * 2);
  ctx.fillStyle = '#2b6cb0';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#bfe0ff';
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${small ? 14 : 18}px sans-serif`;
  ctx.fillText(String(card.cost), x + 18, y + 19);

  // Card name on its own line, full width, so long names stay readable.
  ctx.fillStyle = '#2c2417';
  ctx.font = `bold ${card.name.length > 13 ? (small ? 10 : 12) : (small ? 11 : 13)}px sans-serif`;
  ctx.fillText(card.name, x + w / 2, y + bandH + (small ? 13 : 16));

  // Big house mark as the card art.
  ctx.font = `${small ? 34 : 46}px serif`;
  ctx.fillText(house.mark, x + w / 2, y + h * 0.52);

  // House flavour line.
  ctx.fillStyle = '#6b5a44';
  ctx.font = `italic ${small ? 9 : 10}px sans-serif`;
  ctx.fillText(house.text, x + w / 2, y + h * 0.68);

  // Rules text: one line on small board cards, two on hand cards, kept
  // clear of the attack/health row at the bottom.
  ctx.fillStyle = '#2c2417';
  ctx.font = `${small ? 10 : 11}px sans-serif`;
  const lines = wrapText(ctx, card.text, w - 16);
  const ruleLines = lines.slice(0, small ? 1 : 2);
  ruleLines.forEach((ln, i) => {
    ctx.fillText(ln, x + w / 2, y + h - (small ? 32 : 40) + i * 13);
  });

  if (card.kind === 'creature') {
    // Attack, bottom-left. Health, bottom-right.
    ctx.font = `bold ${small ? 15 : 18}px sans-serif`;
    ctx.fillStyle = '#c0392b';
    ctx.textAlign = 'left';
    ctx.fillText(`⚔ ${atk}`, x + 8, y + h - 10);
    ctx.fillStyle = '#c0392b';
    ctx.textAlign = 'right';
    ctx.fillText(`❤ ${hp}`, x + w - 8, y + h - 10);
  } else {
    ctx.fillStyle = house.dark;
    ctx.font = `bold ${small ? 10 : 11}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('✦ SPELL ✦', x + w / 2, y + h - 10);
  }
  ctx.restore();
}

function drawCardBack(ctx, rect, label) {
  const { x, y, w, h } = rect;
  rr(ctx, x, y, w, h, 8);
  ctx.fillStyle = '#5a1f1f';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#d8b13c';
  ctx.stroke();
  rr(ctx, x + 6, y + 6, w - 12, h - 12, 6);
  ctx.strokeStyle = 'rgba(216,177,60,0.6)';
  ctx.stroke();
  ctx.fillStyle = '#d8b13c';
  ctx.font = `bold ${Math.round(w / 4)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label || 'EC', x + w / 2, y + h / 2);
}

// --- heroes, mana, log ------------------------------------------------------
function drawHero(ctx, state, who) {
  const r = heroRect(state, who);
  const side = who === 'player' ? state.player : state.ai;
  const isAI = who === 'ai';
  const targeted = state.selection && state.selection.needsTarget;

  ctx.save();
  rr(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.fillStyle = isAI ? '#3d1a1a' : '#1a2f4a';
  ctx.fill();
  ctx.lineWidth = targeted ? 4 : 2;
  ctx.strokeStyle = targeted ? '#ff5a4a' : '#d8b13c';
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = '28px serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(isAI ? '👑' : '🔥', r.x + 10, r.y + 26);
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(isAI ? 'Cinder Duchess' : 'You', r.x + 44, r.y + 18);
  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = side.life <= 10 ? '#ff6b5e' : '#fff';
  ctx.fillText(`❤ ${side.life}`, r.x + 44, r.y + 48);
  ctx.fillStyle = '#bcd6ff';
  ctx.font = '12px sans-serif';
  ctx.fillText(`Deck ${side.deck.length}  •  Hand ${side.hand.length}`, r.x + 10, r.y + 76);

  ctx.restore();
}

function drawMana(ctx, state, who) {
  const side = who === 'player' ? state.player : state.ai;
  // Player mana sits in the free strip between the board and the hand;
  // the Duchess's sits between her hand and her board. Both stay clear
  // of the cards at every hand size.
  const baseY = who === 'player' ? 534 : 132;
  const x0 = W / 2 - (HERO.maxMana * 22) / 2;
  ctx.save();
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < HERO.maxMana; i++) {
    const cx = x0 + i * 22 + 9;
    const cy = baseY;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 8);
    ctx.lineTo(cx + 7, cy);
    ctx.lineTo(cx, cy + 8);
    ctx.lineTo(cx - 7, cy);
    ctx.closePath();
    ctx.fillStyle = i < side.mana ? '#4aa8ff' : 'rgba(255,255,255,0.18)';
    ctx.fill();
    ctx.strokeStyle = '#bfe0ff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.fillStyle = '#cfe6ff';
  ctx.fillText(`${side.mana}/${side.maxMana} mana`, x0 + HERO.maxMana * 22 + 10, baseY);
  ctx.restore();
}

function drawLog(ctx, state) {
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = '13px sans-serif';
  state.log.forEach((line, i) => {
    ctx.fillStyle = i === 0 ? 'rgba(255,255,255,0.95)' : `rgba(255,255,255,${0.75 - i * 0.1})`;
    ctx.fillText(line, 40, 330 + i * 19);
  });
  ctx.restore();
}

// --- screens ------------------------------------------------------------------
function drawTitle(ctx, state) {
  ctx.save();
  // Fanned sample cards behind the title.
  const samples = ['drake', 'leviathan', 'ancient', 'stormrider'];
  samples.forEach((id, i) => {
    ctx.save();
    ctx.translate(400 + i * 170, 470);
    ctx.rotate((i - 1.5) * 0.1);
    drawCardFace(ctx, id, { x: -58, y: -79, w: 116, h: 158 });
    ctx.restore();
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 84px Georgia, serif';
  ctx.fillText('EMBER COURT', W / 2, 150);
  ctx.fillStyle = '#f7efdd';
  ctx.font = 'italic 24px Georgia, serif';
  ctx.fillText('A duel of cards for the Court — first to take the other side’s 30 life wins.', W / 2, 205);
  ctx.font = '20px sans-serif';
  ctx.fillStyle = '#cfe6ff';
  ctx.fillText('Click a card to play it · Click your creature, then an enemy, to attack', W / 2, 250);
  ctx.fillText('Keys 1–7 play cards · Space ends your turn · R starts over', W / 2, 278);
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(state.turnCount === 0 ? '— Click or press Enter to play —' : '— Click or press Enter to play —', W / 2, 640);
  ctx.restore();
}

function drawEndScreen(ctx, state, won) {
  ctx.save();
  // An opaque panel in the middle of the table, so the verdict reads
  // cleanly over whatever the board looked like when the duel ended.
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, W, H);
  rr(ctx, 240, 140, 800, 360, 18);
  ctx.fillStyle = '#0d2f1c';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#d8b13c';
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? '#ffd94a' : '#ff6b5e';
  ctx.font = 'bold 72px Georgia, serif';
  ctx.fillText(won ? 'VICTORY' : 'DEFEAT', W / 2, 250);
  ctx.fillStyle = '#f7efdd';
  ctx.font = '24px Georgia, serif';
  ctx.fillText(
    won ? 'The Duchess falls. The Ember Court is yours.' : 'Your flame gutters out. The Duchess keeps the Court.',
    W / 2, 310,
  );
  ctx.font = '18px sans-serif';
  ctx.fillStyle = '#cfe6ff';
  ctx.fillText(`Turns played: ${state.turnCount}  •  Your life: ${state.player.life}  •  Duchess life: ${state.ai.life}`, W / 2, 360);
  ctx.fillStyle = '#ffd94a';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('Press R to play again', W / 2, 430);
  ctx.restore();
}

// --- the table ------------------------------------------------------------------
export function draw(ctx, state, hover) {
  // Baize.
  const g = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 760);
  g.addColorStop(0, '#1e5c38');
  g.addColorStop(1, '#0d2f1c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#d8b13c';
  ctx.lineWidth = 4;
  ctx.strokeRect(14, 14, W - 28, H - 28);
  ctx.strokeStyle = 'rgba(216,177,60,0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(26, 26, W - 52, H - 52);

  if (state.phase === 'title') {
    drawTitle(ctx, state);
    return;
  }

  // Opponent hand: card backs, with the count clear of them.
  const aiBacks = aiHandRects(state);
  aiBacks.forEach((r) => drawCardBack(ctx, r, 'EC'));
  ctx.fillStyle = '#cfe6ff';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const backsEnd = aiBacks.length ? aiBacks[aiBacks.length - 1].x + aiBacks[aiBacks.length - 1].w : W / 2;
  ctx.fillText(`Duchess hand: ${state.ai.hand.length}`, backsEnd + 12, 56);

  // Heroes and mana.
  drawHero(ctx, state, 'ai');
  drawHero(ctx, state, 'player');
  drawMana(ctx, state, 'ai');
  drawMana(ctx, state, 'player');

  // Boards.
  const needsTarget = state.selection && state.selection.needsTarget;
  boardRects(state, 'ai').forEach((r, i) => {
    const c = state.ai.board[i];
    drawCardFace(ctx, c.id, r, { small: true, stats: { atk: c.atk, hp: c.hp } });
    if (needsTarget) {
      ctx.save();
      ctx.strokeStyle = '#ff5a4a';
      ctx.lineWidth = 3;
      rr(ctx, r.x - 3, r.y - 3, r.w + 6, r.h + 6, 10);
      ctx.stroke();
      ctx.restore();
    }
  });
  boardRects(state, 'player').forEach((r, i) => {
    const c = state.player.board[i];
    const selected = state.selection && state.selection.kind === 'board' && state.selection.index === i;
    drawCardFace(ctx, c.id, r, { small: true, selected, stats: { atk: c.atk, hp: c.hp } });
    if (c.canAttack && state.turn === 'player' && state.phase === 'playing') {
      ctx.save();
      ctx.strokeStyle = '#7ee787';
      ctx.lineWidth = 3;
      rr(ctx, r.x - 3, r.y - 3, r.w + 6, r.h + 6, 10);
      ctx.stroke();
      ctx.restore();
    }
  });

  // Turn banner.
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = state.turn === 'player' ? '#7ee787' : '#ffb86b';
  const banner = state.phase === 'playing'
    ? (state.turn === 'player' ? 'Your turn — play a card, then attack' : 'The Duchess is thinking…')
    : '';
  ctx.fillText(banner, W / 2, 356);
  ctx.restore();

  // Log — hidden behind the verdict panel once the duel is over.
  if (state.phase === 'playing') drawLog(ctx, state);

  // Player hand.
  const rects = handRects(state);
  state.player.hand.forEach((id, i) => {
    const r = { ...rects[i] };
    const isHover = hover && inRect(hover.x, hover.y, r);
    const isSel = state.selection && state.selection.kind === 'hand' && state.selection.index === i;
    if (isHover || isSel) r.y -= 18;
    const card = CARD_BY_ID[id];
    const affordable = card.cost <= state.player.mana && state.turn === 'player' && state.phase === 'playing';
    drawCardFace(ctx, id, r, { selected: isSel, playable: affordable, dim: !affordable && state.phase === 'playing' });
  });

  // End Turn button.
  const eb = endTurnRect();
  const canEnd = state.phase === 'playing' && state.turn === 'player';
  ctx.save();
  rr(ctx, eb.x, eb.y, eb.w, eb.h, 10);
  ctx.fillStyle = canEnd ? '#d8b13c' : 'rgba(255,255,255,0.15)';
  ctx.fill();
  ctx.fillStyle = canEnd ? '#231a08' : 'rgba(255,255,255,0.5)';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('End Turn ⏎', eb.x + eb.w / 2, eb.y + eb.h / 2 + 1);
  ctx.restore();

  // Selection hint, in the free space under the log.
  if (state.selection && state.selection.needsTarget) {
    ctx.save();
    ctx.textAlign = 'left';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#ffd94a';
    ctx.fillText('Choose a target — click an enemy', 40, 462);
    ctx.fillText('creature or the Duchess', 40, 484);
    ctx.restore();
  }

  if (state.phase === 'won') drawEndScreen(ctx, state, true);
  if (state.phase === 'lost') drawEndScreen(ctx, state, false);
}

export { inRect };
