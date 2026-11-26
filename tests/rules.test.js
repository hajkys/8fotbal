import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/js/core/game.js';
import { applyMove, undoMove, legalMoves } from '../src/js/core/rules.js';

const key = (m) => `${m.x},${m.y}`;
const keys = (moves) => moves.map(key).sort();

test('ze středu je 8 legálních tahů', () => {
  const g = createGame();
  assert.equal(g.legalMoves().length, 8);
});

test('tah do nového bodu předá tah soupeři', () => {
  const g = createGame();
  const rec = g.play({ x: 4, y: 4 });
  assert.equal(rec.bounced, false);
  assert.equal(g.state.currentPlayer, 2);
});

test('použitou úsečku nelze znovu použít', () => {
  const g = createGame();
  g.play({ x: 4, y: 4 });
  assert.ok(!keys(g.legalMoves()).includes('4,5'));
});

test('odraz od navštíveného bodu: hráč táhne znovu', () => {
  const g = createGame();
  g.play({ x: 4, y: 4 });             // P1 → P2
  g.play({ x: 5, y: 5 });             // P2 → P1
  const rec = g.play({ x: 4, y: 5 }); // střed už je navštívený
  assert.equal(rec.bounced, true);
  assert.equal(g.state.currentPlayer, 1);
});

test('odraz od obvodu: hráč táhne znovu', () => {
  const g = createGame();
  g.state.ball = { x: 1, y: 3 };
  const rec = g.play({ x: 0, y: 3 });
  assert.equal(rec.bounced, true);
  assert.equal(g.state.currentPlayer, 1);
});

test('hra po obvodu je zakázaná', () => {
  const g = createGame();
  g.state.ball = { x: 0, y: 3 };
  assert.deepEqual(keys(g.legalMoves()), ['1,2', '1,3', '1,4']);
});

test('z tyče vede do brány jen úhlopříčka; po ústí brány se dá jít k druhé tyči', () => {
  const g = createGame();
  g.state.ball = { x: 3, y: 0 };
  assert.deepEqual(keys(g.legalMoves()), ['2,1', '3,1', '4,-1', '4,0', '4,1']);
});

test('tah po ústí brány končí v tyči a odrazí se jako od stěny', () => {
  const g = createGame();
  g.state.ball = { x: 4, y: 0 };
  let rec = g.play({ x: 3, y: 0 });   // doleva do tyče
  assert.equal(rec.bounced, true);
  assert.equal(g.state.currentPlayer, 1);
  assert.ok(!keys(g.legalMoves()).includes('4,0')); // úsečka už je použitá
  assert.ok(!keys(g.legalMoves()).includes('2,0')); // dál po koncové čáře nelze

  const g2 = createGame();
  g2.state.ball = { x: 4, y: 0 };
  rec = g2.play({ x: 5, y: 0 });      // doprava do tyče
  assert.equal(rec.bounced, true);
});

test('úhlopříčky se smějí křížit', () => {
  const g = createGame();
  g.play({ x: 5, y: 4 });             // P1: (4,5)–(5,4)
  g.play({ x: 5, y: 5 });             // P2
  assert.ok(keys(g.legalMoves()).includes('4,4')); // (5,5)–(4,4) kříží první
});

test('gól do horní brány vyhrává Hráč 1 (i po odrazu od tyče)', () => {
  const g = createGame();
  g.state.ball = { x: 3, y: 1 };
  g.play({ x: 3, y: 0 });             // tyč = stěna → odraz
  g.play({ x: 4, y: -1 });
  assert.equal(g.state.winner, 1);
  assert.deepEqual(g.legalMoves(), []);
});

test('střed ústí brány není stěna: příchod tam neodráží, druhý příchod už ano', () => {
  const g = createGame();
  g.state.ball = { x: 4, y: 1 };
  const rec = g.play({ x: 4, y: 0 });
  assert.equal(rec.bounced, false);
  assert.equal(g.state.currentPlayer, 2);
  assert.equal(g.state.visitedPoints.has('4,0'), true);  // teď je navštívený

  const g2 = createGame();
  assert.equal(g2.state.visitedPoints.has('4,0'), false);
  assert.equal(g2.state.visitedPoints.has('4,10'), false);
  assert.equal(g2.state.visitedPoints.has('3,0'), true);  // tyč je stěna
  assert.equal(g2.state.visitedPoints.has('5,10'), true);
});

test('gól kteréhokoli ze tří brankových bodů, i zadního rohu', () => {
  for (const x of [3, 4, 5]) {
    const g = createGame();
    g.state.ball = { x: 4, y: 0 };
    g.play({ x, y: -1 });
    assert.equal(g.state.winner, 1, `brankový bod (${x},-1)`);
  }
});

test('vlastní gól: Hráč 1 do dolní brány → vyhrává Hráč 2', () => {
  const g = createGame();
  g.state.ball = { x: 4, y: 10 };
  g.play({ x: 4, y: 11 });
  assert.equal(g.state.winner, 2);
});

test('hráč bez legálního tahu prohrává', () => {
  const g = createGame();
  g.state.ball = { x: 1, y: 1 };      // P1; roh (0,0) má jediný tah
  const rec = g.play({ x: 0, y: 0 }); // odraz, ale není kam táhnout
  assert.equal(rec.blocked, true);
  assert.equal(g.state.winner, 2);
});

test('nelegální tah vyhodí chybu a nezmění stav', () => {
  const g = createGame();
  assert.throws(() => g.play({ x: 9, y: 5 }));
  assert.throws(() => g.play({ x: 4, y: 7 }));
  assert.equal(g.state.history.length, 0);
});

test('po konci hry už nejde táhnout', () => {
  const g = createGame();
  g.state.ball = { x: 4, y: 0 };
  g.play({ x: 4, y: -1 });
  assert.throws(() => g.play({ x: 4, y: 0 }));
});

test('undoMove vrací stav přesně zpět', () => {
  const g = createGame();
  g.play({ x: 4, y: 4 });
  g.play({ x: 5, y: 5 });
  const before = {
    ball: { ...g.state.ball },
    player: g.state.currentPlayer,
    visited: [...g.state.visitedPoints].sort(),
    edges: [...g.state.usedEdges].sort(),
    len: g.state.history.length,
  };
  const rec = applyMove(g.state, { x: 4, y: 5 }); // odraz
  undoMove(g.state, rec);
  assert.deepEqual(g.state.ball, before.ball);
  assert.equal(g.state.currentPlayer, before.player);
  assert.deepEqual([...g.state.visitedPoints].sort(), before.visited);
  assert.deepEqual([...g.state.usedEdges].sort(), before.edges);
  assert.equal(g.state.history.length, before.len);
});

test('game.undo vrací i gól', () => {
  const g = createGame();
  g.state.ball = { x: 4, y: 0 };
  g.play({ x: 4, y: -1 });
  assert.ok(g.undo());
  assert.equal(g.state.winner, null);
  assert.ok(legalMoves(g.state).length > 0);
});

test('náhodná hra vždy skončí a nikdy neporuší pravidla', () => {
  for (let i = 0; i < 200; i++) {
    const g = createGame({ startingPlayer: 1 + (i % 2) });
    let steps = 0;
    while (!g.isOver) {
      const moves = g.legalMoves();
      assert.ok(moves.length > 0, 'hra neskončila, ale není tah');
      g.play(moves[Math.floor(Math.random() * moves.length)]);
      assert.ok(++steps < 500, 'příliš dlouhá hra');
    }
    assert.ok(g.state.winner === 1 || g.state.winner === 2);
  }
});
