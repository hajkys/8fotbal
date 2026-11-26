// Kreslení hřiště, čar a míče na canvas. Viz docs/hriste.md

import { WIDTH, HEIGHT, GOAL_LEFT, GOAL_RIGHT } from '../core/board.js';

export const PLAYER_COLORS = { 1: '#4aa3ff', 2: '#ff6464' };

const PITCH_GREEN = '#256428';    // jednobarevná tráva (původní #2e7d32 o 20 % tmavší)
const MIDFIELD_LINE = '#3d453e';  // středová čára a kruh – tmavě šedá

const CELL = 52;             // velikost buňky v px (logická)
const PAD = CELL;             // okraj kolem hřiště
const ROWS = HEIGHT + 2;      // y od -1 do HEIGHT + 1

export function createRenderer(canvas) {
  const logicalW = WIDTH * CELL + 2 * PAD;
  const logicalH = ROWS * CELL + 2 * PAD;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = Math.round(logicalW * dpr);
  canvas.height = Math.round(logicalH * dpr);
  canvas.style.aspectRatio = `${logicalW} / ${logicalH}`;
  canvas.style.width = `${logicalW}px`;
  const ctx = canvas.getContext('2d');

  const px = (x) => PAD + x * CELL;
  const py = (y) => PAD + (y + 1) * CELL;   // y = -1 je první řádek

  function line(a, b) {
    ctx.beginPath();
    ctx.moveTo(px(a.x), py(a.y));
    ctx.lineTo(px(b.x), py(b.y));
    ctx.stroke();
  }

  function drawPitch() {
    // lajny
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    // obvod hřiště; ústí brány (mezi tyčemi) je otevřené
    ctx.beginPath();
    ctx.moveTo(px(GOAL_LEFT), py(0));
    ctx.lineTo(px(0), py(0));
    ctx.lineTo(px(0), py(HEIGHT));
    ctx.lineTo(px(GOAL_LEFT), py(HEIGHT));
    ctx.moveTo(px(GOAL_RIGHT), py(HEIGHT));
    ctx.lineTo(px(WIDTH), py(HEIGHT));
    ctx.lineTo(px(WIDTH), py(0));
    ctx.lineTo(px(GOAL_RIGHT), py(0));
    ctx.stroke();
    // středová čára a kruh – tmavě šedé, aby nerušily hru
    ctx.strokeStyle = MIDFIELD_LINE;
    ctx.lineWidth = 2;
    line({ x: 0, y: HEIGHT / 2 }, { x: WIDTH, y: HEIGHT / 2 });
    ctx.beginPath();
    ctx.arc(px(WIDTH / 2), py(HEIGHT / 2), CELL * 1.2, 0, Math.PI * 2);
    ctx.stroke();

    // brány
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    // horní brána brání Hráč 2 (červený), dolní Hráč 1 (modrý)
    for (const [yLine, yBack, owner] of [[0, -1, 2], [HEIGHT, HEIGHT + 1, 1]]) {
      ctx.fillStyle = PLAYER_COLORS[owner];
      ctx.globalAlpha = 0.9;
      ctx.fillRect(px(GOAL_LEFT), Math.min(py(yLine), py(yBack)), (GOAL_RIGHT - GOAL_LEFT) * CELL, CELL);
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(px(GOAL_LEFT), py(yLine));
      ctx.lineTo(px(GOAL_LEFT), py(yBack));
      ctx.lineTo(px(GOAL_RIGHT), py(yBack));
      ctx.lineTo(px(GOAL_RIGHT), py(yLine));
      ctx.stroke();
    }
  }

  function dot(x, y, r) {
    ctx.beginPath();
    ctx.arc(px(x), py(y), r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  function drawPoints() {
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (let y = 0; y <= HEIGHT; y++) {
      for (let x = 0; x <= WIDTH; x++) dot(x, y, 3);
    }
    // brankové body – výraznější (žluté)
    ctx.fillStyle = '#ffd54a';
    for (const y of [-1, HEIGHT + 1]) {
      for (let x = GOAL_LEFT; x <= GOAL_RIGHT; x++) dot(x, y, 4.5);
    }
  }

  function drawHistory(state) {
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (const h of state.history) {
      ctx.strokeStyle = PLAYER_COLORS[h.player];
      line(h.from, h.to);
    }
  }

  function drawHints(moves, hover, player, labels) {
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const m of moves) {
      const isHover = hover && hover.x === m.x && hover.y === m.y;
      ctx.beginPath();
      ctx.arc(px(m.x), py(m.y), isHover ? 13 : 11, 0, Math.PI * 2);
      ctx.fillStyle = isHover ? PLAYER_COLORS[player] : 'rgba(255,255,255,0.7)';
      ctx.fill();
      const label = labels[`${m.x},${m.y}`];
      if (label) {
        ctx.fillStyle = isHover ? '#ffffff' : '#1b1b1b';
        ctx.fillText(label, px(m.x), py(m.y) + 0.5);
      }
    }
  }

  function drawBall(ball) {
    ctx.beginPath();
    ctx.arc(px(ball.x), py(ball.y), 10, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#111111';
    ctx.stroke();
  }

  /**
   * Překreslí celé hřiště.
   * @param state stav hry
   * @param opts  { moves: legální cíle k zobrazení, hover: bod pod myší,
   *               labels: { "x,y": popisek klávesy } }
   */
  function render(state, { moves = [], hover = null, labels = {} } = {}) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, logicalW, logicalH);
    ctx.fillStyle = PITCH_GREEN;
    ctx.fillRect(0, 0, logicalW, logicalH);
    drawPitch();
    drawPoints();
    drawHistory(state);
    drawHints(moves, hover, state.currentPlayer, labels);
    drawBall(state.ball);
  }

  /** Souřadnice události myši/dotyku → nejbližší bod mřížky (i brankový) a vzdálenost v buňkách. */
  function pointFromEvent(ev) {
    const rect = canvas.getBoundingClientRect();
    const cx = (ev.clientX - rect.left) * (logicalW / rect.width);
    const cy = (ev.clientY - rect.top) * (logicalH / rect.height);
    const gx = (cx - PAD) / CELL;
    const gy = (cy - PAD) / CELL - 1;
    const x = Math.round(gx);
    const y = Math.round(gy);
    return { point: { x, y }, dist: Math.hypot(gx - x, gy - y) };
  }

  return { render, pointFromEvent };
}
