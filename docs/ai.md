# Počítačový soupeř (AI)

Hra člověka proti počítači. Počítač hraje podle stejných pravidel jako člověk ([pravidla.md](pravidla.md)) a používá výhradně funkce z `core/` (`legalMoves`, `applyMove`). Kód je v `src/js/ai/ai.js`, rozhraní je jedna funkce:

```js
chooseMove(state, level) -> { to: {x, y} }   // jeden krok míče
```

Protože po odrazu hráč táhne znovu, AI je volána opakovaně, dokud je na tahu.

## Základ herní logiky počítače

### 1. Co je „tah“ pro prohledávání

Hráč má na jednu „otočku“ potenciálně **řetěz kroků** (každý odraz = další krok). Při prohledávání proto:

- uzel stromu = stav hry po jednom kroku míče,
- hloubka se počítá v **otočkách** (změna hráče na tahu), ne v krocích – řetěz odrazů se rozvine celý v rámci jedné otočky,
- stav se ukládá jako `visitedPoints` + `usedEdges` (viz [architektura.md](architektura.md)) a po rekurzi se krok vrací zpět (`undo`), aby se nekopírovalo.

### 2. Algoritmus

**Minimax s alfa-beta ořezáváním** (negamax varianta):

1. Vygeneruj legální kroky (`legalMoves`).
2. Kroky seřaď – nejdřív gól, pak kroky směrem k soupeřově bráně, pak odrazy (lepší ořezávání).
3. Rekurzivně ohodnoť; při změně hráče se znaménko obrátí, při odrazu **ne** (hráč zůstává na tahu).
4. Na úrovni s časovým limitem **iterativní prohlubování** (hloubka 1, 2, 3 … dokud nevyprší čas), použije se poslední dokončená hloubka.

### 3. Ohodnocení pozice (heuristika)

Koncové stavy:

| Situace | Hodnota |
|---|---|
| gól do soupeřovy brány | `+∞` (spíš `+10000 − hloubka`, ať AI vyhrává co nejrychleji) |
| gól do vlastní brány / zablokování AI | `−∞` |
| zablokování soupeře | `+∞` |

Ostatní pozice (součet vážených znaků z pohledu AI):

| Znak | Význam |
|---|---|
| **Postup** | poloha míče ve směru k soupeřově bráně (hodnotí se z pohledu hráče na tahu) |
| **Pohyblivost** | počet legálních kroků z aktuálního bodu míče (míč v rohu / v pasti je nebezpečný) |
| **Odraz v záloze** | kolik z těchto kroků vede do už navštíveného bodu = možnost řetězení odrazů |
| **Odklon od osy** | penalizace za vzdálenost míče od osy brány (sloupec 4) |

**Hrozba gólu** se nehodnotí váhou, ale **quiescence** hledáním: v listu stromu se rozvinou řetězy odrazů a gólové kroky (nejvýše 6 odrazů v řadě), takže AI vidí, že hráč na tahu může dotáhnout řetěz do brány. Tím se pokryje i obrana (soupeřova hrozba po mém tahu).

„Past na soupeře“ (kolik tahů zbývá soupeři) zatím není samostatný znak – vychází nepřímo z hledání, protože zablokování soupeře je koncový stav.

Váhy jsou celočíselné konstanty v `ai.js` (`WEIGHTS`) a dají se ladit hrou AI proti AI.

### 4. Okamžité kontroly (před hledáním)

Platí na všech úrovních, protože jsou levné:

1. **Bezpečné tahy:** kroky, po nichž hráč okamžitě prohrává (vlastní gól, vlastní zablokování), se vyřadí z náhodných výběrů (úroveň 1 a „chyby“ ostatních úrovní).
2. Gól na dosah řetězem odrazů najde hledání (úrovně 2–5) a preferuje nejrychlejší výhru (`WIN − hloubka`).

## Úrovně obtížnosti

Obtížnost se stupňuje čtyřmi nezávislými „knoflíky“:

1. **hloubka hledání** (kolik otoček dopředu),
2. **kvalita ohodnocení** (kolik znaků heuristiky se používá),
3. **pravděpodobnost chyby** (s danou šancí zahraje náhodný legální krok místo nejlepšího),
4. **čas / šířka** (limit času na tah, případně omezení počtu zvažovaných kroků).

| Úroveň | Název | Hloubka (otočky) | Heuristika | Chyba | Chování |
|---|---|---|---|---|---|
| 1 | Začátečník | 0 | – | náhodně | náhodný krok; jen se vyhne okamžité prohře (vlastní gól, vlastní zablokování) |
| 2 | Lehká | 1 | postup | 20 % | hladově vybírá krok k soupeřově bráně; vidí jen gól řetězem odrazů; limit 200 ms |
| 3 | Střední | 2 | postup + pohyblivost | 8 % | vidí vlastní hrozby a hrozbu soupeře o otočku dopředu; limit 400 ms |
| 4 | Těžká | až 8 (podle času) | všechny znaky | 2 % | iterativní prohlubování, plánuje řetězy odrazů, limit 1 s |
| 5 | Expert | až 12 (podle času) | všechny znaky | 0 % | nejsilnější hra, limit 2,5 s na tah |

Transpoziční tabulka (cache pozic) zatím není implementovaná – je to možné zlepšení pro Experta.

Čísla jsou výchozí návrh; konečné hodnoty se doladí hrou (AI úrovně n proti n+1 by měla vyhrávat přibližně 70–80 % partií). Testy zatím ověřují, že Střední AI poráží náhodného hráče a Těžká porazí Začátečníka.

## Další chování

- **Prodleva „přemýšlení“:** UI před tahem počítače počká 600 ms (a ukáže „Počítač přemýšlí…“), pak se spočítá tah. Samotný výpočet je omezen časovým limitem dané úrovně.
- **Bez Web Workeru:** AI se počítá v hlavním vlákně. Dlouhý výpočet (úroveň Expert) tak může krátce zablokovat stránku, proto je u vyšších úrovní pevný časový limit na tah. Pokud se to v praxi ukáže jako problém, lze výpočet později přesunout do Web Workeru (`ai/worker.js`), rozhraní `chooseMove` se nemění.
- **Náhoda:** shodně ohodnocené kroky se vybírají náhodně, aby hra neopakovala stejné partie.
- **Strany:** člověk hraje vždy Hráče 1 (modrý, brání dolní bránu, útočí nahoru), počítač Hráče 2 (červený, brání horní bránu). Před hrou si člověk vybírá jen úroveň obtížnosti; začínající hráč se určí losem.

## Testování AI

Testy jsou v `tests/ai.test.js`: AI nikdy nevybere nelegální krok ani nezmění stav; dá gól, když ho má na dosah; nedá vlastní gól, když existuje alternativa; dohraje celou partii; Střední poráží náhodného hráče; Těžká poráží Začátečníka.
