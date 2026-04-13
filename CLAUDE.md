# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Tesztek futtatása
node --test calculator.test.js

# Egy adott teszteset futtatása
node --test --test-name-pattern="getAnnualTaxRate" calculator.test.js

# Manuális integrációs teszt (havi TCO éves futás szerint)
node manual_test.js
```

## Architektúra

Ez egy böngészőalapú autó TCO (Total Cost of Ownership) összehasonlító kalkulátor két autóra ("A" és "B").

**`calculator.js`** — Az összes üzleti logika itt található, UMD-szerű wrapper-rel, ami Node.js-ben (`module.exports`) és böngészőben (`window.Calculator`) is működik.
- `getTransferTaxRate(kw, age)` — Átírási illeték mértéke (kW és kor alapján)
- `getAnnualTaxRate(age)` — Éves gépjárműadó mértéke (Ft/kW, kor alapján)
- `calculateTCO(params)` — Fő számítási függvény; évenkénti hurokkal számolja az inflációval növelt üzemanyag-, karbantartási-, biztosítási-, értékcsökkenési és haszonáldozat-költségeket

**`calculator.html`** — A teljes UI egyetlen HTML fájlban, külső `calculator.css`-sel. A két külső script (`calculator.js`, `ui.js`) sorrendben töltődik be a `</body>` előtt.

**`calculator.css`** — Az összes stílus külön fájlban; a `calculator.html` linkel rá.

**`ui.js`** — DOM interakciók és megjelenítési logika: `updateUI`, `calcTax`, `validate`, `calculateCar`, `calculateBoth`, `markWinner`, `markStale`. Függ a `Calculator` globálistól, amit a `calculator.js` definiál.

**`calculator.test.js`** — Node.js beépített `node:test` keretrendszerrel írt tesztek.

**`reproduce_issue.js`** — Maradványfájl; csak egy redirect stub, ami `manual_test.js` használatára irányít. Érdemi logikát nem tartalmaz.

## Kulcsos számítási részletek

- **EV üzemanyag-logika**: Ha a szükséges kWh <= napelem-többlet (solarExcess), az üzemanyagköltség nulla; felette az `evChargePrice` paraméterrel számol (default: 250 Ft/kWh), amit a UI a `global-evcharge` inputból tölt be.
- **CAPEX**: Vételár + 12 000 Ft (okmányok) + átírási illeték (ICE esetén) + import költségek vagy 18 500 Ft eredetiségvizsgálat (belföldi esetén).
- **Haszonáldozat (opportunity cost)**: `aktuális maradványérték × interestRate` évente (az értékcsökkenéssel párhuzamosan csökken).
- **Infláció**: Az üzemanyag-, szerviz- és gumiköltségekre vonatkozik (`(1 + infláció%)^(i-1)` szorzóval); az adó nem inflálódik.
- **Értékvesztés**: Csökkenő egyenleg alapú; az éves értékvesztés az aktuális értékre vetítve kerül számításra.
- **Validációs határértékek**:

  | Mező | Min | Max |
  |---|---|---|
  | Éves futás (km/év) | 1 | 200 000 |
  | Tervezett évek | 1 | 20 |
  | Állampapír kamat (%) | 0 | 20 |
  | Üzemanyagár (Ft/L) | 0 | 2 000 |
  | EV töltési ár (Ft/kWh) | 0 | 2 000 |
  | Napelem-többlet (kWh/év) | 0 | 20 000 |
  | Infláció (%) | 0 | 25 |
  | Vételár (Ft) | 1 | 100 000 000 |
  | Teljesítmény (LE) | 1 | 1 000 |
  | Fogyasztás (L/100km vagy kWh/100km) | 0,1 | 50 |
  | Értékvesztés ráta (%) | 0 | 50 |
  | Szerviz (Ft/év) | 0 | 400 000 |
  | Gumiabroncs (Ft/év) | 0 | 400 000 |
  | Biztosítás (Ft/év) | 0 | 400 000 |
  | Regisztrációs adó (Ft) | 0 | 10 000 000 |
  | Hazahozatal egyéb (Ft) | 0 | 10 000 000 |

## Biztonsági elvek

- **XSS-megelőzés**: A felhasználóra visszaírt tartalom renderelésénél (pl. hibaüzenetek) kizárólag a DOM API-t (`createElement`, `textContent`, `appendChild`) szabad használni. Az `innerHTML` használata tilos, mert XSS-sebezhetőséget okoz.
