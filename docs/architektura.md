# Architektura

Zásada: **logika hry (`core/`) nezná DOM ani canvas** – dá se testovat samostatně a znovu použít pro AI nebo online hru.

## Moduly

| Modul | Odpovědnost |
|---|---|
| `core/board.js` | konstanty hřiště, generování bodů, klíče bodů a úseček, určení obvodových bodů a brankových bodů |
| `core/rules.js` | `legalMoves(state)`, `applyMove(state, dir)`, detekce odrazu, gólu a zablokování |
| `core/game.js` | `createGame(options)`, aktuální hráč, historie tahů, undo, výsledek |
| `ui/renderer.js` | kreslení hřiště, čar, míče a nápověda tahů na canvas |
| `ui/input.js` | převod kliknutí/dotyku na bod mřížky a tah |
| `ai/ai.js` | výběr tahu počítače podle úrovně obtížnosti – viz [ai.md](ai.md) |
| `main.js` | propojení: vytvoří hru, renderer a vstup, řeší smyčku tahů |

## Stav hry

```js
{
  ball: { x, y },
  currentPlayer: 1 | 2,
  visitedPoints: Set<string>,
  usedEdges: Set<string>,
  history: [{ player, from, to, bounced }],
  winner: null | 1 | 2
}
```

## Tok tahu

1. UI zjistí cíl kliknutí → `applyMove(state, to)`.
2. `rules` ověří legalitu, zapíše úsečku, označí body jako navštívené.
3. Vyhodnotí: gól → `winner`; odraz → hráč zůstává; jinak se hráč přepne; nemá-li další hráč tah → prohrává.
4. UI překreslí.

## Testy

`tests/` – jednotkové testy pravidel (odraz, zákaz obvodu, kříž úhlopříček, gól, zablokování). Nástroj zvolíme později (např. Vitest nebo `node --test`).
