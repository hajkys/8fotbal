// Vstupní bod: propojí logiku (core), počítačového soupeře (ai) a vykreslení (ui).
// Režimy: člověk proti počítači (člověk = Hráč 1, modrý, brání dolní bránu)
// nebo dva hráči na jednom zařízení.

import { createGame } from './core/game.js';
import { createRenderer, PLAYER_COLORS } from './ui/renderer.js';
import { bindInput, DIRECTION_LABELS } from './ui/input.js';
import { chooseMove, LEVELS } from './ai/ai.js';

const HUMAN = 1;
const AI = 2;
const AUTO_MOVE_DELAY = 400; // ms – jediný možný tah člověka
const AI_MOVE_DELAY = 600;   // ms – aby bylo vidět, že počítač „přemýšlí“

const canvas = document.getElementById('pitch');
const statusEl = document.getElementById('status');
const newBtn = document.getElementById('new-game');
const undoBtn = document.getElementById('undo');
const modeSel = document.getElementById('mode');
const levelSel = document.getElementById('level');
const levelLabel = document.getElementById('level-label');
const hintsBox = document.getElementById('hints');
const rulesBtn = document.getElementById('rules-btn');
const rulesDialog = document.getElementById('rules');

rulesBtn.addEventListener('click', () => rulesDialog.showModal());
// zavření kliknutím mimo okno
rulesDialog.addEventListener('click', (ev) => {
  if (ev.target === rulesDialog) rulesDialog.close();
});

// Nápověda tahů (kuličky s písmeny kláves) – ve výchozím stavu vypnutá, volba se pamatuje.
try {
  hintsBox.checked = localStorage.getItem('fotbal.hints') === '1';
} catch { /* localStorage nemusí být dostupné */ }

for (const [id, lv] of Object.entries(LEVELS)) {
  levelSel.add(new Option(`${id} – ${lv.name}`, id));
}
levelSel.value = '3';

const renderer = createRenderer(canvas);
let game;
let vsComputer = true;
let level = 3;
let hover = null;
let note = '';
let autoEnabled = true;   // po „Zpět“ se vypne, jinak by hra krok hned zopakovala
let timer = null;         // automatický tah člověka / tah počítače

const isAiTurn = () => vsComputer && game.state.winner === null && game.state.currentPlayer === AI;
// při otevřených pravidlech se tahy z klávesnice ani myši neprovádějí
const humanMoves = () => (isAiTurn() || rulesDialog.open ? [] : game.legalMoves());

function playerName(p) {
  if (vsComputer) return p === HUMAN ? 'Ty (modrý, útočíš nahoru)' : 'Počítač (červený)';
  return p === 1 ? 'Hráč 1 (modrý, útočí nahoru)' : 'Hráč 2 (červený, útočí dolů)';
}

function cancelTimer() {
  clearTimeout(timer);
  timer = null;
}

function newGame() {
  cancelTimer();
  vsComputer = modeSel.value === 'ai';
  level = Number(levelSel.value);
  levelLabel.hidden = !vsComputer;
  game = createGame({ startingPlayer: Math.random() < 0.5 ? 1 : 2 });
  hover = null;
  note = '';
  autoEnabled = true;
  update();
}

function keyLabels(moves) {
  const { ball } = game.state;
  const labels = {};
  for (const m of moves) {
    labels[`${m.x},${m.y}`] = DIRECTION_LABELS[`${m.x - ball.x},${m.y - ball.y}`];
  }
  return labels;
}

function update() {
  const { state } = game;
  const moves = humanMoves();
  const showHints = hintsBox.checked;
  // bez nápovědy se zvýrazní jen cíl těsně pod myší
  renderer.render(state, {
    moves: showHints ? moves : (hover ? [hover] : []),
    hover,
    labels: showHints ? keyLabels(moves) : {},
  });
  undoBtn.disabled = vsComputer
    ? !state.history.some((h) => h.player === HUMAN)
    : state.history.length === 0;

  if (state.winner !== null) {
    statusEl.textContent = vsComputer
      ? (state.winner === HUMAN ? 'Konec hry – vyhráváš!' : 'Konec hry – vyhrává počítač.')
      : `Konec hry – vyhrává ${playerName(state.winner)}.`;
    statusEl.style.color = PLAYER_COLORS[state.winner];
    return;
  }

  statusEl.style.color = PLAYER_COLORS[state.currentPlayer];
  if (isAiTurn()) {
    statusEl.textContent = `${note}Počítač přemýšlí…`;
    if (timer === null) timer = setTimeout(aiStep, AI_MOVE_DELAY);
    return;
  }
  statusEl.textContent = `${note}Na tahu: ${playerName(state.currentPlayer)}`;

  // Existuje-li jediný možný tah, hra ho udělá sama.
  if (autoEnabled && moves.length === 1 && timer === null) {
    timer = setTimeout(() => play(moves[0], 'Jediný možný tah. '), AUTO_MOVE_DELAY);
  }
}

function aiStep() {
  timer = null;
  if (!isAiTurn()) return;
  play(chooseMove(game.state, level), 'Počítač: ');
}

function play(to, prefix = '') {
  cancelTimer();
  const rec = game.play(to);
  hover = null;
  autoEnabled = true;
  note = `${prefix}${rec.bounced ? 'Odraz! ' : ''}`;
  update();
}

bindInput(canvas, renderer, {
  getMoves: humanMoves,
  getBall: () => game.state.ball,
  onHover: (p) => {
    hover = p;
    update();
  },
  onMove: (to) => play(to),
});

newBtn.addEventListener('click', newGame);
modeSel.addEventListener('change', newGame);
levelSel.addEventListener('change', newGame);
hintsBox.addEventListener('change', () => {
  try {
    localStorage.setItem('fotbal.hints', hintsBox.checked ? '1' : '0');
  } catch { /* ignorovat */ }
  hintsBox.blur(); // aby klávesy Q W E… nezůstaly v checkboxu
  update();
});
undoBtn.addEventListener('click', () => {
  cancelTimer();
  game.undo();
  // proti počítači vrátit i jeho tahy, aby byl znovu na tahu člověk
  while (vsComputer && game.state.currentPlayer === AI && game.state.history.length > 0) game.undo();
  autoEnabled = false;
  note = '';
  update();
});

newGame();
