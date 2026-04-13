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

**`calculator.html`** — A teljes UI egyetlen HTML fájlban, inline CSS-sel. A két külső script (`calculator.js`, `ui.js`) sorrendben töltődik be a `</body>` előtt.

**`ui.js`** — DOM interakciók és megjelenítési logika: `updateUI`, `calcTax`, `validate`, `calculateCar`, `calculateBoth`, `markWinner`, `markStale`. Függ a `Calculator` globálistól, amit a `calculator.js` definiál.

**`calculator.test.js`** — Node.js beépített `node:test` keretrendszerrel írt tesztek.

## Kulcsos számítási részletek

- **EV üzemanyag-logika**: Ha a szükséges kWh <= napelem-többlet (solarExcess), az üzemanyagköltség nulla; felette 250 Ft/kWh hardkódolt nyilvános töltési árral számol.
- **CAPEX**: Vételár + 12 000 Ft (okmányok) + átírási illeték (ICE esetén) + import költségek vagy 18 500 Ft eredetiségvizsgálat (belföldi esetén).
- **Haszonáldozat (opportunity cost)**: `capex × interestRate` évente (a kezdeti CAPEX nem csökken az évek során).
- **Infláció**: Az üzemanyag-, szerviz- és gumiköltségekre vonatkozik (`(1 + infláció%)^(i-1)` szorzóval); az adó nem inflálódik.
- **Értékvesztés**: Csökkenő egyenleg alapú; az éves értékvesztés az aktuális értékre vetítve kerül számításra.
