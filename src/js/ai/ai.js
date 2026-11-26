// Počítačový soupeř. Viz docs/ai.md
//
// Negamax s alfa-beta ořezáváním nad jednotlivými kroky míče. Po odrazu zůstává
// na tahu stejný hráč, takže se znaménko nemění a hloubka se nesnižuje (hloubka
// se počítá v „otočkách“). V listech se místo statického ohodnocení rozvine
// řetěz odrazů (quiescence), aby AI viděla hrozby gólu.

import { legalMoves, applyMove, undoMove } from '../core/rules.js';
import { WIDTH, HEIGHT, pointKey, isGoalPoint, goalScorer } from '../core/board.js';

const WIN = 100000;
const TIMEOUT = Symbol('timeout');
const MID_Y = HEIGHT / 2;
const MID_X = WIDTH / 2;

const WEIGHTS = { progress: 10, mobility: 3, reserve: 4, lateral: 2 };
const MAX_CHAIN = 6; // nejvýše tolik odrazů v řadě se v listu rozvíjí

/**
 * Úrovně obtížnosti. Čtyři „knoflíky“: hloubka, použité znaky ohodnocení,
 * pravděpodobnost chyby a časový limit.
 */
export const LEVELS = {
  1: { name: 'Začátečník', random: true },
  2: { name: 'Lehká', depth: 1, error: 0.2, timeMs: 200 },
  3: { name: 'Střední', depth: 2, mobility: true, error: 0.08, timeMs: 400 },
  4: { name: 'Těžká', depth: 8, mobility: true, reserve: true, lateral: true, error: 0.02, timeMs: 1000 },
  5: { name: 'Expert', depth: 12, mobility: true, reserve: true, lateral: true, error: 0, timeMs: 2500 },
};

const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];

/** Ohodnocení z pohledu hráče na tahu (`state.currentPlayer`). */
function evaluate(state, cfg) {
  const mover = state.currentPlayer;
  const b = state.ball;
  // Hráč 1 útočí nahoru (menší y), Hráč 2 dolů.
  let s = WEIGHTS.progress * (mover === 1 ? MID_Y - b.y : b.y - MID_Y);
  if (cfg.lateral) s -= WEIGHTS.lateral * Math.abs(b.x - MID_X);
  if (cfg.mobility || cfg.reserve) {
    const moves = legalMoves(state);
    if (cfg.mobility) s += WEIGHTS.mobility * moves.length;
    if (cfg.reserve) {
      let bounces = 0;
      for (const m of moves) if (state.visitedPoints.has(pointKey(m))) bounces++;
      s += WEIGHTS.reserve * bounces;
    }
  }
  return s;
}

/** Řazení tahů: gól, odrazy, postup k soupeřově bráně (lepší ořezávání). */
function orderMoves(state, moves) {
  const mover = state.currentPlayer;
  const dir = mover === 1 ? -1 : 1;
  const ball = state.ball;
  const score = (to) => {
    let v = (to.y - ball.y) * dir;
    if (isGoalPoint(to)) v += goalScorer(to) === mover ? 1000 : -1000;
    else if (state.visitedPoints.has(pointKey(to))) v += 5;
    return v;
  };
  return moves
    .map((to) => ({ to, v: score(to) }))
    .sort((a, b) => b.v - a.v)
    .map((e) => e.to);
}

function tick(ctx) {
  ctx.nodes++;
  if ((ctx.nodes & 1023) === 0 && Date.now() > ctx.deadline) throw TIMEOUT;
}

/** Výsledek po provedeném kroku z pohledu `mover`; null, pokud hra pokračuje. */
function terminalScore(state, mover, ply) {
  if (state.winner === null) return null;
  return state.winner === mover ? WIN - ply : -(WIN - ply);
}

function search(state, ctx, depth, alpha, beta, ply) {
  tick(ctx);
  if (depth <= 0) return quiesce(state, ctx, alpha, beta, ply);
  const mover = state.currentPlayer;
  let best = -Infinity;
  for (const to of orderMoves(state, legalMoves(state))) {
    const s = scoreMove(state, ctx, to, mover, depth, alpha, beta, ply);
    if (s > best) best = s;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

/** Provede krok, ohodnotí výsledek z pohledu `mover` a krok vrátí zpět. */
function scoreMove(state, ctx, to, mover, depth, alpha, beta, ply) {
  const rec = applyMove(state, to);
  try {
    const t = terminalScore(state, mover, ply + 1);
    if (t !== null) return t;
    // odraz: stejný hráč, stejné znaménko, hloubka se nesnižuje
    if (state.currentPlayer === mover) return search(state, ctx, depth, alpha, beta, ply + 1);
    return -search(state, ctx, depth - 1, -beta, -alpha, ply + 1);
  } finally {
    undoMove(state, rec);
  }
}

/** V listu se rozvinou už jen gólové kroky a odrazy (řetěz stejného hráče). */
function quiesce(state, ctx, alpha, beta, ply, chain = 0) {
  tick(ctx);
  const mover = state.currentPlayer;
  let best = evaluate(state, ctx.cfg);
  if (best >= beta || chain >= MAX_CHAIN) return best;
  if (best > alpha) alpha = best;

  const forcing = legalMoves(state).filter(
    (to) => (isGoalPoint(to) ? goalScorer(to) === mover : state.visitedPoints.has(pointKey(to))),
  );
  for (const to of orderMoves(state, forcing)) {
    const rec = applyMove(state, to);
    let s;
    try {
      s = terminalScore(state, mover, ply + 1);
      if (s === null) s = quiesce(state, ctx, alpha, beta, ply + 1, chain + 1);
    } finally {
      undoMove(state, rec);
    }
    if (s > best) best = s;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

/** Krok, po kterém hráč okamžitě neprohrává (vlastní gól, vlastní zablokování). */
function safeMoves(state, moves) {
  const mover = state.currentPlayer;
  const safe = moves.filter((to) => {
    const rec = applyMove(state, to);
    const lost = state.winner !== null && state.winner !== mover;
    undoMove(state, rec);
    return !lost;
  });
  return safe.length > 0 ? safe : moves;
}

/**
 * Vybere jeden krok míče pro hráče na tahu.
 * @param state  stav hry (po výpočtu je beze změny)
 * @param level  úroveň 1–5
 * @param opts   { rng, timeMs } – pro testy
 * @returns {{x, y}} cílový bod kroku
 */
export function chooseMove(state, level = 3, opts = {}) {
  const rng = opts.rng ?? Math.random;
  const cfg = { ...(LEVELS[level] ?? LEVELS[3]) };
  if (opts.timeMs !== undefined) cfg.timeMs = opts.timeMs;

  const moves = legalMoves(state);
  if (moves.length === 0) throw new Error('Není žádný legální tah');
  if (moves.length === 1) return moves[0];

  const safe = safeMoves(state, moves);
  if (cfg.random || rng() < (cfg.error ?? 0)) return pick(safe, rng);

  const mover = state.currentPlayer;
  const ctx = {
    cfg,
    nodes: 0,
    deadline: cfg.timeMs ? Date.now() + cfg.timeMs : Infinity,
  };

  let ordered = orderMoves(state, moves);
  let bestMoves = [ordered[0]];
  // iterativní prohlubování: po vypršení času platí poslední dokončená hloubka
  const depths = Array.from({ length: cfg.depth }, (_, i) => i + 1);

  for (const depth of depths) {
    let bestScore = -Infinity;
    let best = [];
    try {
      for (const to of ordered) {
        // okno s „-1“, aby rovnocenné tahy dostaly přesné skóre (náhodný výběr mezi nimi)
        const alpha = bestScore === -Infinity ? -Infinity : bestScore - 1;
        const s = scoreMove(state, ctx, to, mover, depth, alpha, Infinity, 0);
        if (s > bestScore) { bestScore = s; best = [to]; }
        else if (s === bestScore) best.push(to);
      }
    } catch (e) {
      if (e === TIMEOUT) break; // použije se poslední dokončená hloubka
      throw e;
    }
    bestMoves = best;
    if (bestScore >= WIN - 1000) break; // vynucená výhra nalezena
    // nejlepší tahy předchozí hloubky zkoušet první
    ordered = [...best, ...ordered.filter((m) => !best.includes(m))];
  }
  return pick(bestMoves, rng);
}
