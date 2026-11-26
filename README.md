# Osmisměrný fotbálek

Webová hra v čistém JavaScriptu (bez závislostí a bez build kroku) – papírový fotbálek, kde se míč pohybuje po mřížce v 8 směrech. Hraje se proti počítači (5 úrovní obtížnosti) nebo ve dvou na jednom zařízení.

**Hrát online:** https://hajkys.github.io/8fotbal/

## Jak se hraje

Míč začíná ve středu hřiště a hráči se střídají. V jednom tahu míč přeskočí na sousední bod v jednom z 8 směrů a zanechá za sebou čáru, kterou už nelze použít znovu. Dorazí-li míč do bodu, který už je „navštívený“ (obvod hřiště nebo konec dřívější čáry), hráč táhne znovu – míč se odrazil. Vyhrává ten, kdo dostane míč do soupeřovy brány, nebo koho soupeř zablokuje bez možnosti tahu.

Podrobně: [pravidla](docs/pravidla.md), [tvar hřiště](docs/hriste.md).

## Ovládání

- **Myš / dotyk:** klik na bod, kam má míč jít.
- **Klávesnice:** 8 směrů jako `Q W E / A · D / Z X C` (nebo numerická klávesnice `7 8 9 / 4 · 6 / 1 2 3`).
- **Nápověda tahů:** přepínač nahoře zobrazí legální cíle s písmeny kláves.
- **Jediný možný tah:** hra ho po krátké prodlevě udělá sama.
- **Zpět:** vrátí poslední tah (proti počítači i jeho odpověď).

## Počítačový soupeř

Hledání tahů dopředu (negamax s alfa-beta ořezáváním) s řetězy odrazů v listech stromu. Úrovně 1–5 se liší hloubkou hledání, použitými znaky ohodnocení, šancí na chybu a časovým limitem. Člověk hraje modrého (brání dolní bránu), počítač červeného. Viz [docs/ai.md](docs/ai.md).

## Spuštění lokálně

Potřebujete [Node.js](https://nodejs.org/) (testy a vývojový server; samotná hra poběží v jakémkoli moderním prohlížeči).

```powershell
npm run serve   # vývojový server, http://localhost:3000
npm test        # testy logiky a AI (node:test)
```

Soubor `src/index.html` nejde otevřít přímo ze složky (`file://`), protože prohlížeče bez serveru nenačtou ES moduly.

## Struktura projektu

```
├── docs/                  funkční popis (Markdown)
│   ├── pravidla.md        pravidla hry
│   ├── hriste.md          tvar a souřadnice hřiště
│   ├── architektura.md    členění kódu a datové struktury
│   └── ai.md              počítačový soupeř, úrovně obtížnosti
├── src/                   hra (statické soubory, nasazují se na Pages)
│   ├── index.html, css/style.css
│   └── js/
│       ├── main.js        propojení modulů, herní smyčka
│       ├── core/          logika hry bez DOM: board, rules, game
│       ├── ui/            renderer (canvas), input (myš, klávesy)
│       └── ai/ai.js       počítačový soupeř
├── tests/                 testy logiky a AI
├── dev-server.js          malý statický server pro vývoj
└── .github/workflows/     nasazení na GitHub Pages
```

## Nasazení

Při každém pushi do větve `main` GitHub Actions spustí testy a nasadí složku `src/` na GitHub Pages ([workflow](.github/workflows/pages.yml)).
