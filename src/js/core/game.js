// Stav hry a střídání hráčů. Viz docs/architektura.md

import { CENTER, allPitchPoints, isWall, pointKey } from './board.js';
import { applyMove, undoMove, legalMoves } from './rules.js';

/**
 * Nová hra. Stav:
 * { ball, currentPlayer, visitedPoints, usedEdges, history, winner }
 * Hráč 1 hraje směrem nahoru (útočí na horní bránu), Hráč 2 dolů.
 */
export function createState({ startingPlayer = 1 } = {}) {
  const visitedPoints = new Set(
    allPitchPoints().filter(isWall).map(pointKey),   // ústí brány není stěna
  );
  return {
    ball: { ...CENTER },
    currentPlayer: startingPlayer,
    visitedPoints,
    usedEdges: new Set(),
    history: [],
    winner: null,
  };
}

export function createGame(options = {}) {
  const state = createState(options);
  const undoStack = [];

  return {
    state,
    legalMoves: () => legalMoves(state),
    /** Provede krok; vrací záznam (bounced, blocked…) nebo vyhodí chybu. */
    play(to) {
      const record = applyMove(state, to);
      undoStack.push(record);
      return record;
    },
    /** Vrátí poslední krok; false, není-li co vracet. */
    undo() {
      const record = undoStack.pop();
      if (!record) return false;
      undoMove(state, record);
      return true;
    },
    get isOver() { return state.winner !== null; },
  };
}
