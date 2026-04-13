# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run all tests
node --test tests/calculator.test.js

# Run a specific test case
node --test --test-name-pattern="getAnnualTaxRate" tests/calculator.test.js

# Manual integration test (monthly TCO by annual mileage)
node tests/manual_test.js
```

## Architecture

This is a browser-based car TCO (Total Cost of Ownership) comparison calculator for two cars ("A" and "B").

```
/
├── src/
│   ├── calculator.js      — business logic
│   ├── ui.js              — DOM interactions and display logic
│   └── calculator.css     — all styles
├── tests/
│   ├── calculator.test.js — unit tests
│   ├── manual_test.js     — integration test
│   └── validation_edge_test.js — validation bounds tests
├── index.html             — entry point
├── CLAUDE.md
└── README.md
```

**`src/calculator.js`** — All business logic lives here, with a UMD-style wrapper that works in Node.js (`module.exports`) and in the browser (`window.Calculator`).
- `getTransferTaxRate(kw, age)` — Transfer tax rate (based on kW and vehicle age)
- `getAnnualTaxRate(age)` — Annual vehicle tax rate (Ft/kW, based on vehicle age)
- `calculateTCO(params)` — Main calculation function; computes inflation-adjusted fuel, maintenance, insurance, depreciation, and opportunity costs in a year-by-year loop

**`index.html`** — The complete UI in a single HTML file, linked to `src/calculator.css`. The two external scripts (`src/calculator.js`, `src/ui.js`) are loaded in order before `</body>`.

**`src/calculator.css`** — All styles in a separate file; referenced by `index.html`.

**`src/ui.js`** — DOM interactions and display logic: `updateUI`, `calcTax`, `validate`, `calculateCar`, `calculateBoth`, `markWinner`, `markStale`. Depends on the `Calculator` global defined by `src/calculator.js`.

**`tests/calculator.test.js`** — Tests written using the Node.js built-in `node:test` framework.

## Key Calculation Details

- **EV fuel logic**: If the required kWh <= solar excess (solarExcess), fuel cost is zero; above that it uses the `evChargePrice` parameter (default: 250 Ft/kWh), which the UI loads from the `global-evcharge` input.
- **CAPEX**: Purchase price + 12,000 Ft (documentation) + transfer tax (ICE only) + import costs or 18,500 Ft originality inspection (for domestic vehicles).
- **Opportunity cost**: `current residual value × interestRate` annually (decreases in parallel with depreciation).
- **Inflation**: Applied to fuel, service, and tire costs (using multiplier `(1 + inflation%)^(i-1)`); taxes are not inflation-adjusted.
- **Depreciation**: Declining balance method; annual depreciation is calculated against the current value.
- **Validation bounds**:

  | Field | Min | Max |
  |---|---|---|
  | Annual mileage (km/yr) | 1 | 200,000 |
  | Planned years | 1 | 20 |
  | Government bond interest rate (%) | 0 | 20 |
  | Fuel price (Ft/L) | 0 | 2,000 |
  | EV charging price (Ft/kWh) | 0 | 2,000 |
  | Solar excess (kWh/yr) | 0 | 20,000 |
  | Inflation (%) | 0 | 25 |
  | Purchase price (Ft) | 1 | 100,000,000 |
  | Power (HP) | 1 | 1,000 |
  | Consumption (L/100km or kWh/100km) | 0.1 | 50 |
  | Depreciation rate (%) | 0 | 50 |
  | Service cost (Ft/yr) | 0 | 400,000 |
  | Tires (Ft/yr) | 0 | 400,000 |
  | Insurance (Ft/yr) | 0 | 400,000 |
  | Registration tax (Ft) | 0 | 10,000,000 |
  | Import other costs (Ft) | 0 | 10,000,000 |

## Security Principles

- **XSS prevention**: When rendering any content written back to the user (e.g. error messages), only the DOM API (`createElement`, `textContent`, `appendChild`) may be used. Using `innerHTML` is forbidden as it introduces XSS vulnerabilities.
