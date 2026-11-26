# Hřiště

## Rozměry

Standardní hřiště má **8 × 10 buněk** (8 do šířky, 10 do délky), tedy mřížku **9 × 11 bodů**.

- Souřadnice bodu: `(x, y)`, `x ∈ 0..8`, `y ∈ 0..10`.
- Počátek `(0, 0)` je vlevo nahoře, osa `y` roste dolů (jako na canvasu).
- Střed hřiště / výkop: `(4, 5)`.

Rozměry jsou v kódu konfigurovatelné (`WIDTH = 8`, `HEIGHT = 10`, `GOAL_WIDTH = 2`); šířka by měla být sudá, aby brána byla symetrická.

## Brány

Brána je široká **2 buňky**, mezi tyčemi `x = 3` a `x = 5`, a je „vystrčená“ za koncovou čáru o 1 buňku.

```
        x: 0 1 2 3 4 5 6 7 8
y = -1          G G G            horní brána – brankové body (3,-1) (4,-1) (5,-1)
y =  0   o-o-o-T . o . T-o-o-o   koncová čára (ústí brány otevřené); T = tyče (3,0) a (5,0)
y =  1   o . . . . . . . o
  ...
y =  5   o . . . + . . . o       + = střed (4, 5)
  ...
y =  9   o . . . . . . . o
y = 10   o-o-o-T . o . T-o-o-o   koncová čára (ústí brány otevřené); T = tyče (3,10) a (5,10)
y = 11          G G G            dolní brána – brankové body (3,11) (4,11) (5,11)
```

Brána má **tři brankové body** na zadní lajně (včetně obou zadních rohů):

- horní brána: `(3,-1)`, `(4,-1)`, `(5,-1)` (útočí na ni Hráč 1, který hraje směrem nahoru),
- dolní brána: `(3,11)`, `(4,11)`, `(5,11)`.
- Boční čáry brány (tyče `(3,0)–(3,-1)` a `(5,0)–(5,-1)`, dole `(3,10)–(3,11)` a `(5,10)–(5,11)`) jsou stejně jako obvod hřiště **zakázané** – po tyči se hrát nesmí.
- Legální tahy do horní brány tedy jsou: z `(3,0)` jen na `(4,-1)`; z `(4,0)` na `(3,-1)`, `(4,-1)` i `(5,-1)`; z `(5,0)` jen na `(4,-1)`. Dolní brána je souměrně.
- Dosažení kteréhokoli brankového bodu je gól, hra končí.

**Barvy a obrana:** Hráč 1 je modrý, brání **dolní** bránu a útočí na horní. Hráč 2 je červený, brání **horní** bránu a útočí na dolní. Brány jsou vybarveny barvou svého obránce (dolní modrá, horní červená). Ve hře proti počítači hraje člověk vždy Hráče 1 (brání dolní bránu), počítač Hráče 2.

## Obvod a odrazové body

- Všechny body na obvodu (`x = 0`, `x = 8`, `y = 0`, `y = 10`) jsou od začátku **navštívené** → odraz, hráč táhne znovu. **Výjimka:** střed ústí brány `(4,0)` a `(4,10)` není stěna – je to běžný bod, který se stane navštíveným až po prvním příchodu (příchod tam neodráží, tah přechází na soupeře).
- Úsečky **po obvodu** (např. `(0,3)–(0,4)` nebo `(1,0)–(2,0)`) jsou zakázané.
- **Výjimka – ústí brány:** úsečky mezi tyčemi, tedy `(3,0)–(4,0)` a `(4,0)–(5,0)` (dole `(3,10)–(4,10)` a `(4,10)–(5,10)`), jsou **povolené**. Tah po nich končí v tyči, což je obvodový bod → odraz jako od stěny (hráč táhne znovu). Dál po koncové čáře za tyč (`(2,0)–(3,0)`) už se hrát nesmí.
- Tyče `(3,0)`, `(5,0)`, `(3,10)`, `(5,10)` jsou obvodové body a chovají se stejně.
- Body mimo hřiště a mimo brankové body neexistují.

## Datová reprezentace

- Bod: `{ x, y }`, klíč `"x,y"` (pro `Set`/`Map`).
- Směry (8): `dx, dy ∈ {-1,0,1}`, kromě `(0,0)`.
- Úsečka: neuspořádaná dvojice sousedních bodů, klíč např. `"x1,y1-x2,y2"` s body seřazenými, aby `A–B` a `B–A` byly totéž.
- Stav: `visitedPoints: Set`, `usedEdges: Set`, `ball: {x, y}`.

## Vykreslení (návrh)

- Zelené hřiště, bílé čáry obvodu, tečkovaná mřížka bodů.
- Čáry hráčů: Hráč 1 modře, Hráč 2 červeně.
- Míč jako kolečko v aktuálním bodu, zvýrazněné legální cílové body.
