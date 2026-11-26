import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  allPitchPoints, isBorder, isInside, isGoalPoint, isForbiddenEdge, edgeKey, CENTER,
} from '../src/js/core/board.js';

test('mřížka má 9 × 11 bodů a střed (4,5)', () => {
  assert.equal(allPitchPoints().length, 99);
  assert.deepEqual(CENTER, { x: 4, y: 5 });
});

test('obvod a vnitřek', () => {
  assert.ok(isBorder({ x: 0, y: 5 }));
  assert.ok(isBorder({ x: 3, y: 0 }));
  assert.ok(!isBorder({ x: 4, y: 5 }));
  assert.ok(!isBorder({ x: 1, y: 1 }));
});

test('brankové body: tři na zadní lajně každé brány', () => {
  for (const x of [3, 4, 5]) {
    assert.ok(isGoalPoint({ x, y: -1 }));
    assert.ok(isGoalPoint({ x, y: 11 }));
  }
  assert.ok(!isGoalPoint({ x: 2, y: -1 }));
  assert.ok(!isInside({ x: 2, y: -1 }));
  assert.ok(!isInside({ x: 4, y: -2 }));
});

test('klíč úsečky je nezávislý na směru', () => {
  const a = { x: 1, y: 2 };
  const b = { x: 2, y: 3 };
  assert.equal(edgeKey(a, b), edgeKey(b, a));
});

test('zakázané úsečky: obvod a tyče', () => {
  assert.ok(isForbiddenEdge({ x: 0, y: 3 }, { x: 0, y: 4 }));
  assert.ok(isForbiddenEdge({ x: 1, y: 0 }, { x: 2, y: 0 }));
  assert.ok(isForbiddenEdge({ x: 2, y: 0 }, { x: 3, y: 0 }));   // koncová čára vedle tyče
  assert.ok(isForbiddenEdge({ x: 5, y: 10 }, { x: 6, y: 10 }));
  assert.ok(isForbiddenEdge({ x: 3, y: 0 }, { x: 3, y: -1 }));  // tyč
  assert.ok(isForbiddenEdge({ x: 5, y: 10 }, { x: 5, y: 11 })); // tyč dole
  assert.ok(isForbiddenEdge({ x: 2, y: 0 }, { x: 3, y: -1 }));  // mimo bránu
});

test('ústí brány mezi tyčemi je průchozí (do tyče a zpět)', () => {
  assert.ok(!isForbiddenEdge({ x: 4, y: 0 }, { x: 3, y: 0 }));
  assert.ok(!isForbiddenEdge({ x: 4, y: 0 }, { x: 5, y: 0 }));
  assert.ok(!isForbiddenEdge({ x: 4, y: 10 }, { x: 3, y: 10 }));
});

test('povolené úsečky: úhlopříčka v rohu, vstup do brány', () => {
  assert.ok(!isForbiddenEdge({ x: 0, y: 1 }, { x: 1, y: 0 }));
  assert.ok(!isForbiddenEdge({ x: 3, y: 0 }, { x: 4, y: -1 }));
  assert.ok(!isForbiddenEdge({ x: 4, y: 0 }, { x: 4, y: -1 }));
  assert.ok(!isForbiddenEdge({ x: 4, y: 0 }, { x: 3, y: -1 }));
  assert.ok(!isForbiddenEdge({ x: 4, y: 10 }, { x: 5, y: 11 }));
});
