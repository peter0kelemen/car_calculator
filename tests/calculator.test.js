const test = require('node:test');
const assert = require('node:assert');
const Calculator = require('../src/calculator.js');

test('getAnnualTaxRate returns correct values based on age', (t) => {
    assert.strictEqual(Calculator.getAnnualTaxRate(1), 345);
    assert.strictEqual(Calculator.getAnnualTaxRate(3), 345);
    assert.strictEqual(Calculator.getAnnualTaxRate(4), 300);
    assert.strictEqual(Calculator.getAnnualTaxRate(7), 300);
    assert.strictEqual(Calculator.getAnnualTaxRate(8), 230);
    assert.strictEqual(Calculator.getAnnualTaxRate(11), 230);
    assert.strictEqual(Calculator.getAnnualTaxRate(12), 185);
    assert.strictEqual(Calculator.getAnnualTaxRate(15), 185);
    assert.strictEqual(Calculator.getAnnualTaxRate(16), 140);
});

test('getTransferTaxRate returns correct values', (t) => {
    // kw <= 40
    assert.strictEqual(Calculator.getTransferTaxRate(30, 2), 550);
    assert.strictEqual(Calculator.getTransferTaxRate(30, 5), 450);
    assert.strictEqual(Calculator.getTransferTaxRate(30, 10), 300);

    // kw > 120
    assert.strictEqual(Calculator.getTransferTaxRate(150, 2), 850);
    assert.strictEqual(Calculator.getTransferTaxRate(150, 5), 750);
    assert.strictEqual(Calculator.getTransferTaxRate(150, 10), 650);
});

test('calculateTCO for ICE car (Benzin/Dízel)', (t) => {
    const params = {
        annualKm: 12000,
        interestRate: 0.065,
        fuelPrice: 610,
        solarExcess: 4500,
        isImp: false,
        isEv: false,
        price: 5000000,
        hp: 120,
        age: 8,
        cons: 7.5,
        regTax: 0,
        importMisc: 0,
        service: 130000,
        tire: 80000,
        ins: 180000,
        depRate: 10,
        years: 5
    };

    const result = Calculator.calculateTCO(params);

    // Verify structure
    assert.ok(result.fuel > 0);
    assert.ok(result.maint > 0);
    assert.ok(result.ins > 0);
    assert.ok(result.dep > 0);
    assert.ok(result.opp > 0);
    assert.ok(result.totalTCO > 0);

    // Specific check for tax inclusion in maintenance
    // 120 HP ~= 88 kW. Age 8 -> Tax Rate 230. Tax = 88 * 230 = 20240.
    // Base Maint = 130000 + 80000 = 210000.
    // Expected Maint per year should include tax.
    // Note: Tax changes as car gets older (8, 9, 10, 11, 12).
    // Age 8-11: 230/kW. Age 12: 185/kW.
    // Years 1-4 (Age 8-11): Tax = 20240.
    // Year 5 (Age 12): Tax = 88 * 185 = 16280.
    // Avg Tax = (20240 * 4 + 16280) / 5 = (80960 + 16280) / 5 = 97240 / 5 = 19448.
    // Avg Maint = 210000 + 19448 = 229448.

    // Let's check if it's close.
    assert.ok(Math.abs(result.maint - 229448) < 1000, `Expected maint ~229448, got ${result.maint}`);
});

test('calculateTCO for EV car', (t) => {
    const params = {
        annualKm: 12000,
        interestRate: 0.065,
        fuelPrice: 610,
        solarExcess: 4500, // Enough for 12000km * 17kWh/100km = 2040 kWh? No.
        // Needed: 120 * 17 = 2040 kWh. Solar 4500. So Fuel Cost should be 0.
        isImp: true,
        isEv: true,
        price: 8000000,
        hp: 170,
        age: 4,
        cons: 17,
        regTax: 0,
        importMisc: 200000,
        service: 50000,
        tire: 95000,
        ins: 200000,
        depRate: 10,
        years: 5
    };

    const result = Calculator.calculateTCO(params);

    assert.strictEqual(result.fuel, 0, 'EV with enough solar should have 0 fuel cost');

    // Check maintenance (no tax for EV)
    // Base = 50000 + 95000 = 145000.
    assert.strictEqual(result.maint, 145000);
});

test('calculateTCO years=0 esetén hibát dob', (t) => {
    const params = {
        annualKm: 12000, interestRate: 0.065, fuelPrice: 610, solarExcess: 0,
        isImp: false, isEv: false, price: 5000000, hp: 120, age: 8, cons: 7.5,
        regTax: 0, importMisc: 0, service: 130000, tire: 80000, ins: 180000,
        depRate: 10, years: 0
    };
    assert.throws(() => Calculator.calculateTCO(params), /pozitív/);
});

test('calculateTCO opportunity cost csökken az értékvesztéssel', (t) => {
    // price: 1 000 000, depRate: 50%, interestRate: 10%, years: 2
    // Év 1 eleji érték: 1 000 000 → opp: 100 000, dep: 500 000, év végi érték: 500 000
    // Év 2 eleji érték:   500 000 → opp:  50 000, dep: 250 000
    // totalOpp = 150 000, totalDep = 750 000
    const params = {
        annualKm: 1, interestRate: 0.10, fuelPrice: 0, solarExcess: 0,
        isImp: false, isEv: true,
        price: 1000000, hp: 100, age: 5, cons: 0,
        regTax: 0, importMisc: 0, service: 0, tire: 0, ins: 0,
        depRate: 50, years: 2, inflationRate: 0
    };

    const result = Calculator.calculateTCO(params);

    assert.strictEqual(result.opp * 2, 150000, `totalOpp expected 150000, got ${result.opp * 2}`);
    assert.strictEqual(result.dep * 2, 750000, `totalDep expected 750000, got ${result.dep * 2}`);
});

test('calculateTCO EV with custom evChargePrice', (t) => {
    const params = {
        annualKm: 12000,
        interestRate: 0,
        fuelPrice: 610,
        evChargePrice: 100, // Egyedi töltési ár
        solarExcess: 0,     // Nincs napelem, minden kWh-t fizetünk
        isImp: false,
        isEv: true,
        price: 1000000,
        hp: 100,
        age: 3,
        cons: 20, // 12000km * 20kWh/100km = 2400 kWh/év
        regTax: 0,
        importMisc: 0,
        service: 0,
        tire: 0,
        ins: 0,
        depRate: 0,
        years: 1
    };

    const result = Calculator.calculateTCO(params);

    // 2400 kWh * 100 Ft = 240 000 Ft üzemanyag
    assert.strictEqual(result.fuel, 240000, `Expected 240000, got ${result.fuel}`);
});

test('calculateTCO with Inflation', (t) => {
    const params = {
        annualKm: 12000,
        interestRate: 0, // Simplify to check inflation only on costs
        fuelPrice: 100,
        solarExcess: 0,
        isImp: false,
        isEv: false,
        price: 1000000,
        hp: 100,
        age: 5,
        cons: 10, // 12000km * 10L/100km = 1200L. 1200 * 100 = 120000 Fuel/year base.
        regTax: 0,
        importMisc: 0,
        service: 100000,
        tire: 0,
        ins: 0,
        depRate: 0, // No dep
        years: 2,
        inflationRate: 10 // 10%
    };

    // Year 1:
    // Fuel: 120000 * 1.0 = 120000
    // Service: 100000 * 1.0 = 100000
    // Tax: 100 HP ~= 74 kW. Age 5 -> Tax Rate 300. Tax = 74 * 300 = 22200.
    // Total Y1: 120000 + 100000 + 22200 = 242200.

    // Year 2:
    // Inflation multiplier = 1.1
    // Fuel: 120000 * 1.1 = 132000
    // Service: 100000 * 1.1 = 110000
    // Tax: Age 6 -> Tax Rate 300. Tax = 22200. (Tax does not inflate)
    // Total Y2: 132000 + 110000 + 22200 = 264200.

    // Total TCO: 242200 + 264200 = 506400.
    // Avg TCO: 253200.

    const result = Calculator.calculateTCO(params);

    assert.strictEqual(result.totalTCO, 506400);
    assert.strictEqual(result.totalAvg, 253200);
});
