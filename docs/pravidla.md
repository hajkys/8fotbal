# Pravidla hry

Hrají dva hráči (Hráč 1 – dole, Hráč 2 – nahoře) na jednom hřišti, jeden míč. Hráči se střídají v tazích. Míč se pohybuje po bodech mřížky a každým krokem po sobě zanechává čáru.

## Cíl

Dostat míč do soupeřovy brány.

## Začátek

- Míč stojí ve středu hřiště.
- Začínající hráč se určí losem (nebo dohodou).
- Na hřišti zatím není nakreslená žádná čára.

## Tah

Míč se posune z aktuálního bodu do **sousedního bodu v jednom z 8 směrů** (S, SV, V, JV, J, JZ, Z, SZ) o délku jedné čtvercové buňky. Úsečka se zakreslí a už ji nelze použít znovu.

Tah je legální, pokud:

1. cílový bod leží uvnitř hřiště (nebo je to brankový bod),
2. úsečka mezi body ještě nebyla použita,
3. úsečka neleží na obvodu hřiště ani na boční čáře brány (po lajně ani po tyči se hrát nesmí). Výjimkou je ústí brány: z bodu před bránou lze táhnout i po koncové čáře mezi tyčemi do tyče (např. `(4,0)→(3,0)`); tyč je obvodový bod, takže následuje odraz jako od stěny.

Úhlopříčky se mohou **křížit** (diagonální úsečky v jedné buňce se navzájem neblokují) – každá se kreslí mezi jinými body.

## Odraz – hráč táhne znovu

Pokud míč dorazí do bodu, který je **už „navštívený“**, hráč táhne ještě jednou (a případně dál, dokud takové body zasahuje). Navštívený bod je:

- bod na obvodu hřiště (lajna, tyče branek) – kromě středu ústí brány `(4,0)` a `(4,10)`, který stěna není a odráží až po prvním navštívení,
- bod, ve kterém už začíná nebo končí nějaká dříve nakreslená úsečka.

Počáteční bod (střed) se stává navštíveným, jakmile z něj míč poprvé odejde.

Pokud míč dorazí do **nového** bodu, tah přechází na soupeře.

## Gól

Gól padne, když míč dorazí do kteréhokoli ze tří brankových bodů na zadní lajně brány (včetně zadních rohů, viz [hriste.md](hriste.md)). Vstřelí ho hráč, který míč tam dostal – i tehdy, když by to bylo do vlastní brány (vlastní gól se připisuje soupeři). Hra končí.

## Zablokování

Pokud hráč, který je na tahu, nemá žádný legální tah (míč je „v pasti“), **prohrává**.

## Remíza

Standardně žádná – zablokování rozhoduje. (Možné rozšíření: pravidlo opakování / limit počtu tahů.)

## Možné varianty (do budoucna)

- Různé velikosti hřiště (menší pro rychlou hru).
- Časový limit na tah.
- Hra proti počítači (`src/js/ai`).
