# car_calculator

A browser-based Total Cost of Ownership (TCO) calculator for comparing two cars side by side. Built for the Hungarian market, it accounts for registration tax, annual vehicle tax, depreciation, fuel, maintenance, insurance, inflation, and opportunity cost over a configurable ownership period. Supports both ICE and electric vehicles, with optional solar surplus offset for EV charging costs.

## Files

| File | Description |
|------|-------------|
| `calculator.html` | Single-file UI |
| `calculator.js` | Business logic (UMD — runs in both Node.js and browser) |
| `calculator.css` | Styles |
| `ui.js` | DOM interactions and rendering |
| `calculator.test.js` | Unit tests using Node.js built-in `node:test` |

## Usage

Open `calculator.html` in a browser — no server needed.

## Tests

```bash
node --test calculator.test.js
```

