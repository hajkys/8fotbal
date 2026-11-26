import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/js/core/game.js';
import { chooseMove, LEVELS } from '../src/js/ai/ai.js';

const snapshot = (s) => JSON.stringify({
  ball: s.ball,
  p: s.currentPlayer,
  v: [...s.visitedPoints].sort(),
  e: [...s.usedEdges].sort(),
  h: s.history.length,
  w: s.winner,
});

const isLegal = (g, m) => g.legalMoves().some((l) => l.x === m.x && l.y === m.y);

test('AI na všech úrovních vybere legální tah a nezmění stav', () => {
  for (const level of Object.keys(LEVELS)) {
    const g = createGame({ startingPlayer: 2 });
    const before = snapshot(g.state);
    const to = chooseMove(g.state, Number(level), { timeMs: 150 });
    assert.equal(snapshot(g.state), before, `úroveň ${level} změnila stav`);
    assert.ok(isLegal(g, to), `úroveň ${level}: nelegální tah`);
  }
});

test('AI hned dá gól, když ho má na dosah (úrovně 2–5)', () => {
  for (const level of [2, 3, 4, 5]) {
    const g = createGame({ startingPlayer: 2 });
    g.state.ball = { x: 4, y: 9 };         // Hráč 2 útočí dolů
    g.state.visitedPoints.add('4,9');
    const to = chooseMove(g.state, level, { rng: () => 0.99, timeMs: 150 });
    // z (4,9) vede na koncovou čáru (odraz) a odtud do brány; AI musí zvolit tah na y = 10
    assert.equal(to.y, 10, `úroveň ${level}`);
    assert.notEqual(to.x, 4, `úroveň ${level}: (4,10) není odraz, vede do tyče (3,10)/(5,10)`);
  }
});

test('AI nedá vlastní gól, když existuje alternativa', () => {
  for (const level of [1, 2, 3, 4, 5]) {
    for (let i = 0; i < 20; i++) {
      // Hráč 2 stojí před vlastní (horní) bránou – gól do ní by byl vlastní
      const g = createGame({ startingPlayer: 2 });
      g.state.ball = { x: 4, y: 0 };
      const to = chooseMove(g.state, level, { timeMs: 100 });
      assert.ok(to.y !== -1, `úroveň ${level}: vlastní gól`);
    }
  }
});

test('AI hrající za oba hráče dohraje partii podle pravidel', () => {
  for (const level of [1, 2, 3]) {
    const g = createGame();
    let steps = 0;
    while (!g.isOver) {
      const to = chooseMove(g.state, level);
      assert.ok(isLegal(g, to));
      g.play(to);
      assert.ok(++steps < 500);
    }
  }
});

test('Střední AI poráží náhodného hráče', () => {
  let wins = 0;
  const games = 20;
  for (let i = 0; i < games; i++) {
    const g = createGame({ startingPlayer: 1 + (i % 2) });
    let steps = 0;
    while (!g.isOver && steps++ < 500) {
      if (g.state.currentPlayer === 2) {
        g.play(chooseMove(g.state, 3));
      } else {
        const moves = g.legalMoves();
        g.play(moves[Math.floor(Math.random() * moves.length)]);
      }
    }
    if (g.state.winner === 2) wins++;
  }
  assert.ok(wins >= 16, `AI vyhrála jen ${wins}/${games}`);
});

test('vyšší úroveň poráží nižší (Těžká vs. Začátečník)', () => {
  let wins = 0;
  const games = 10;
  for (let i = 0; i < games; i++) {
    const g = createGame({ startingPlayer: 1 + (i % 2) });
    let steps = 0;
    while (!g.isOver && steps++ < 500) {
      const level = g.state.currentPlayer === 2 ? 4 : 1;
      g.play(chooseMove(g.state, level, { timeMs: 60 }));
    }
    if (g.state.winner === 2) wins++;
  }
  assert.ok(wins >= 8, `Těžká vyhrála jen ${wins}/${games}`);
});
