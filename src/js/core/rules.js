// Pravidla: legální tahy, odraz, gól, zablokování. Viz docs/pravidla.md

import {
  DIRECTIONS, pointKey, edgeKey, isInside, isGoalPoint, goalScorer, isForbiddenEdge,
} from './board.js';

export const other = (player) => (player === 1 ? 2 : 1);

/** Legální cílové body míče z aktuální pozice (prázdné, je-li hra skončená). */
export function legalMoves(state) {
  if (state.winner !== null) return [];
  const { ball } = state;
  const moves = [];
  for (const [dx, dy] of DIRECTIONS) {
    const to = { x: ball.x + dx, y: ball.y + dy };
    if (!isInside(to)) continue;
    if (isForbiddenEdge(ball, to)) continue;
    if (state.usedEdges.has(edgeKey(ball, to))) continue;
    moves.push(to);
  }
  return moves;
}

export function isLegalMove(state, to) {
  return legalMoves(state).some((m) => m.x === to.x && m.y === to.y);
}

/**
 * Provede krok míče (mění `state`). Vrací záznam pro `undoMove`.
 * Vyhazuje chybu při nelegálním kroku.
 */
export function applyMove(state, to) {
  if (!isLegalMove(state, to)) {
    throw new Error(`Nelegální tah na (${to.x},${to.y})`);
  }
  const from = state.ball;
  const player = state.currentPlayer;
  const eKey = edgeKey(from, to);
  const fromKey = pointKey(from);
  const toKey = pointKey(to);

  const addedFrom = !state.visitedPoints.has(fromKey);
  const bounced = state.visitedPoints.has(toKey);
  const addedTo = !bounced;

  state.usedEdges.add(eKey);
  if (addedFrom) state.visitedPoints.add(fromKey);
  if (addedTo) state.visitedPoints.add(toKey);
  state.ball = { x: to.x, y: to.y };

  const record = {
    player, from, to: state.ball, bounced, eKey, addedFrom, addedTo, prevWinner: state.winner,
  };

  if (isGoalPoint(to)) {
    state.winner = goalScorer(to);
  } else {
    // odraz: hráč táhne znovu; jinak se střídá
    state.currentPlayer = bounced ? player : other(player);
    if (legalMoves(state).length === 0) {
      // hráč na tahu je zablokován → prohrává
      state.winner = other(state.currentPlayer);
      record.blocked = true;
    }
  }

  state.history.push({ player, from, to: state.ball, bounced });
  return record;
}

/** Vrátí poslední `applyMove` zpět (pro AI a undo). */
export function undoMove(state, record) {
  state.history.pop();
  state.usedEdges.delete(record.eKey);
  if (record.addedFrom) state.visitedPoints.delete(pointKey(record.from));
  if (record.addedTo) state.visitedPoints.delete(pointKey(record.to));
  state.ball = record.from;
  state.currentPlayer = record.player;
  state.winner = record.prevWinner;
}
