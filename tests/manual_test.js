// Manuális integrációs teszt: havi TCO alakulása éves futás függvényében.
// Futtatás: node manual_test.js
//
// Hasznos amikor gyorsan ellenőrizni szeretnénk, hogy az ICE vs EV havi
// költségek reálisan változnak-e különböző éves km-értékek esetén.

const Calculator = require('../src/calculator.js');

const baseParams = {
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
    years: 5,
    inflationRate: 3
};

const kmValues = [10000, 15000, 20000, 30000];

console.log("Havi TCO éves futás szerint (ICE):");
kmValues.forEach(km => {
    const res = Calculator.calculateTCO({ ...baseParams, annualKm: km });
    console.log(`  ${km} km/év → havi: ${Math.round(res.totalAvg / 12).toLocaleString('hu-HU')} Ft, teljes TCO: ${Math.round(res.totalTCO).toLocaleString('hu-HU')} Ft`);
});

console.log("\nHavi TCO éves futás szerint (EV):");
const evParams = { ...baseParams, isEv: true, cons: 17, price: 8000000 };
kmValues.forEach(km => {
    const res = Calculator.calculateTCO({ ...evParams, annualKm: km });
    console.log(`  ${km} km/év → havi: ${Math.round(res.totalAvg / 12).toLocaleString('hu-HU')} Ft, teljes TCO: ${Math.round(res.totalTCO).toLocaleString('hu-HU')} Ft`);
});
