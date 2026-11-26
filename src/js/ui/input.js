// Převod kliknutí / dotyku / klávesnice na bod mřížky a tah.

const SNAP_DISTANCE = 0.45; // v buňkách; dál od bodu se klik ignoruje

// Klávesy pro 8 směrů: Q W E / A · D / Z X C (a numerická klávesnice 7 8 9 / 4 · 6 / 1 2 3).
const KEY_DIRECTIONS = {
  KeyQ: [-1, -1], KeyW: [0, -1], KeyE: [1, -1],
  KeyA: [-1, 0],                 KeyD: [1, 0],
  KeyZ: [-1, 1],  KeyX: [0, 1],  KeyC: [1, 1],
  Numpad7: [-1, -1], Numpad8: [0, -1], Numpad9: [1, -1],
  Numpad4: [-1, 0],                    Numpad6: [1, 0],
  Numpad1: [-1, 1],  Numpad2: [0, 1],  Numpad3: [1, 1],
};

/** Popisek klávesy pro směr [dx, dy] (zobrazuje se u legálních cílů). */
export const DIRECTION_LABELS = {
  '-1,-1': 'Q', '0,-1': 'W', '1,-1': 'E',
  '-1,0': 'A',               '1,0': 'D',
  '-1,1': 'Z',  '0,1': 'X',  '1,1': 'C',
};

/**
 * @param canvas    canvas s hřištěm
 * @param renderer  objekt s pointFromEvent(ev)
 * @param handlers  { getMoves(): legální cíle, getBall(): bod míče,
 *                    onHover(point|null), onMove(point) }
 */
export function bindInput(canvas, renderer, { getMoves, getBall, onHover, onMove }) {
  function legalTarget(ev) {
    const { point, dist } = renderer.pointFromEvent(ev);
    if (dist > SNAP_DISTANCE) return null;
    return getMoves().find((m) => m.x === point.x && m.y === point.y) ?? null;
  }

  canvas.addEventListener('pointermove', (ev) => onHover(legalTarget(ev)));
  canvas.addEventListener('pointerleave', () => onHover(null));
  canvas.addEventListener('pointerdown', (ev) => {
    const target = legalTarget(ev);
    if (target) onMove(target);
  });

  window.addEventListener('keydown', (ev) => {
    if (ev.repeat || ev.ctrlKey || ev.altKey || ev.metaKey) return;
    const dir = KEY_DIRECTIONS[ev.code];
    if (!dir) return;
    ev.preventDefault();
    const ball = getBall();
    const to = { x: ball.x + dir[0], y: ball.y + dir[1] };
    if (getMoves().some((m) => m.x === to.x && m.y === to.y)) onMove(to);
  });
}
