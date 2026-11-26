// Hřiště: rozměry, body, úsečky. Viz docs/hriste.md

export const WIDTH = 8;       // buněk do šířky
export const HEIGHT = 10;     // buněk do délky
export const GOAL_WIDTH = 2;  // šířka brány v buňkách

// Tyče brány (sloupce) – brankové body leží na x ∈ [GOAL_LEFT, GOAL_RIGHT].
export const GOAL_LEFT = (WIDTH - GOAL_WIDTH) / 2;   // 3
export const GOAL_RIGHT = GOAL_LEFT + GOAL_WIDTH;    // 5

export const CENTER = { x: WIDTH / 2, y: HEIGHT / 2 };

export const DIRECTIONS = [
  [0, -1], [1, -1], [1, 0], [1, 1],
  [0, 1], [-1, 1], [-1, 0], [-1, -1],
];

export const pointKey = (p) => `${p.x},${p.y}`;

/** Neuspořádaný klíč úsečky: A–B a B–A dají totéž. */
export function edgeKey(a, b) {
  const ka = pointKey(a);
  const kb = pointKey(b);
  return ka < kb ? `${ka}-${kb}` : `${kb}-${ka}`;
}

/** Brankový bod: zadní lajna horní (y = -1) nebo dolní (y = HEIGHT + 1) brány. */
export function isGoalPoint(p) {
  return (p.y === -1 || p.y === HEIGHT + 1) && p.x >= GOAL_LEFT && p.x <= GOAL_RIGHT;
}

/** Hráč, který gól dosáhl: horní brána (y < 0) patří Hráči 1, dolní Hráči 2. */
export function goalScorer(p) {
  return p.y < 0 ? 1 : 2;
}

/** Bod vlastního hřiště (včetně obvodu), bez brankových bodů. */
export function isOnPitch(p) {
  return p.x >= 0 && p.x <= WIDTH && p.y >= 0 && p.y <= HEIGHT;
}

/** Bod existuje: na hřišti, nebo brankový. */
export function isInside(p) {
  return isOnPitch(p) || isGoalPoint(p);
}

/** Bod na obvodu hřiště (lajny, tyče). */
export function isBorder(p) {
  return isOnPitch(p) && (p.x === 0 || p.x === WIDTH || p.y === 0 || p.y === HEIGHT);
}

/** Vnitřní bod ústí brány (mezi tyčemi) – leží na koncové čáře, ale není stěna. */
export function isGoalMouth(p) {
  return (p.y === 0 || p.y === HEIGHT) && p.x > GOAL_LEFT && p.x < GOAL_RIGHT;
}

/** Bod, od kterého se míč odráží od začátku hry: obvod mimo ústí brány. */
export function isWall(p) {
  return isBorder(p) && !isGoalMouth(p);
}

/**
 * Zakázaná úsečka (nesmí se po ní hrát):
 *  - po obvodu hřiště (kromě ústí brány mezi tyčemi, to je průchozí),
 *  - po tyčích brány a vůbec do brankového bodu jinak než z řady před bránou.
 */
export function isForbiddenEdge(a, b) {
  const aGoal = isGoalPoint(a);
  const bGoal = isGoalPoint(b);
  if (aGoal || bGoal) {
    const goal = aGoal ? a : b;
    const other = aGoal ? b : a;
    const frontRow = goal.y < 0 ? 0 : HEIGHT;
    if (other.y !== frontRow) return true;
    if (other.x < GOAL_LEFT || other.x > GOAL_RIGHT) return true;
    // po tyči (svisle ze sloupce 3 nebo 5) se hrát nesmí
    if (other.x === goal.x && (goal.x === GOAL_LEFT || goal.x === GOAL_RIGHT)) return true;
    return false;
  }
  if (a.x === b.x && (a.x === 0 || a.x === WIDTH)) return true;
  if (a.y === b.y && (a.y === 0 || a.y === HEIGHT)) {
    // ústí brány (mezi tyčemi) je otevřené – po něm se hrát smí, tyč pak funguje jako stěna
    const inMouth = a.x >= GOAL_LEFT && a.x <= GOAL_RIGHT && b.x >= GOAL_LEFT && b.x <= GOAL_RIGHT;
    return !inMouth;
  }
  return false;
}

/** Všechny body hřiště (bez brankových), po řádcích. */
export function allPitchPoints() {
  const pts = [];
  for (let y = 0; y <= HEIGHT; y++) {
    for (let x = 0; x <= WIDTH; x++) pts.push({ x, y });
  }
  return pts;
}
