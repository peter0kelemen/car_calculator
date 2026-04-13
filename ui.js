// --- UI KEZELÉS ---
function updateUI(prefix) {
    const isImp = document.getElementById(prefix + '-imp').checked;
    const isEv = document.getElementById(prefix + '-ev').checked;
    const price = Number(document.getElementById(prefix + '-price').value);

    // Import mezők megjelenítése
    document.getElementById(prefix + '-import-box').style.display = isImp ? 'block' : 'none';

    // Alapértelmezések beállítása
    if (isEv) {
        document.getElementById(prefix + '-tax').value = 0;
        // Ha import és EV, regadó 0
        if (isImp) document.getElementById(prefix + '-regtax').value = 0;

        // Javasolt értékek
        if (document.getElementById(prefix + '-cons').value < 10) document.getElementById(prefix + '-cons').value = 17; // kWh
        if (document.getElementById(prefix + '-service').value > 100000) document.getElementById(prefix + '-service').value = 50000;
    } else {
        calcTax(prefix); // Adó újraszámolása ICE-hez
        if (isImp) document.getElementById(prefix + '-regtax').value = 50000;

        // Javasolt értékek
        if (document.getElementById(prefix + '-cons').value > 10) document.getElementById(prefix + '-cons').value = 7.5; // Liter
        if (document.getElementById(prefix + '-service').value < 60000) document.getElementById(prefix + '-service').value = 130000;
    }

    // Értékvesztés javaslat (10%) - REMOVED as it is now a fixed rate input
    // document.getElementById(prefix + '-dep').value = Math.round(price * 0.1);
}

function calcTax(prefix) {
    const isEv = document.getElementById(prefix + '-ev').checked;
    if (isEv) {
        document.getElementById(prefix + '-tax').value = 0;
        return;
    }
    const hp = Number(document.getElementById(prefix + '-hp').value);
    const age = Number(document.getElementById(prefix + '-age').value);

    const kw = Math.round(hp * 0.7355);
    // Use Calculator.getAnnualTaxRate
    const rate = Calculator.getAnnualTaxRate(age);

    document.getElementById(prefix + '-tax').value = kw * rate;
}

// --- VALIDÁCIÓ ---
function validate() {
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    const errors = [];

    function check(id, condition, message) {
        const el = document.getElementById(id);
        if (!el) return;
        const val = Number(el.value);
        if (!condition(val, el)) {
            el.classList.add('input-error');
            errors.push(message);
        }
    }

    check('global-km',        v => v > 0,              'Éves futás: pozitív szám szükséges');
    check('global-years',     v => v > 0 && v <= 50,   'Tervezett évek: 1–50 közé kell esnie');
    check('global-interest',  v => v >= 0,             'Állampapír kamat: nem lehet negatív');
    check('global-fuelprice', v => v >= 0,             'Üzemanyagár: nem lehet negatív');
    check('global-evcharge',  v => v >= 0,             'EV töltési ár: nem lehet negatív');
    check('global-solar',     v => v >= 0,             'Napelem többlet: nem lehet negatív');

    for (const [prefix, label] of [['a', '"A"'], ['b', '"B"']]) {
        check(`${prefix}-price`,    v => v > 0,               `${label} autó vételár: pozitív szám szükséges`);
        check(`${prefix}-hp`,       v => v > 0,               `${label} autó teljesítmény: pozitív szám szükséges`);
        check(`${prefix}-cons`,     v => v > 0,               `${label} autó fogyasztás: pozitív szám szükséges`);
        check(`${prefix}-dep-rate`, v => v >= 0 && v <= 100,  `${label} autó értékvesztés: 0–100% közé kell esnie`);
    }

    const errorBox = document.getElementById('error-box');
    if (errors.length > 0) {
        errorBox.innerHTML = '<strong>Kérlek javítsd az alábbi hibákat:</strong><ul>' +
            errors.map(e => `<li>${e}</li>`).join('') + '</ul>';
        errorBox.style.display = 'block';
    } else {
        errorBox.style.display = 'none';
    }

    return errors.length === 0;
}

// --- SZÁMÍTÁS ---
function calculateCar(prefix) {
    // Globális változók
    const annualKm = Number(document.getElementById('global-km').value);
    const interestRate = Number(document.getElementById('global-interest').value) / 100;
    const fuelPrice = Number(document.getElementById('global-fuelprice').value);
    const evChargePrice = Number(document.getElementById('global-evcharge').value);
    const solarExcess = Number(document.getElementById('global-solar').value);

    // Autó specifikus változók
    const isImp = document.getElementById(prefix + '-imp').checked;
    const isEv = document.getElementById(prefix + '-ev').checked;
    const price = Number(document.getElementById(prefix + '-price').value);
    const hp = Number(document.getElementById(prefix + '-hp').value);
    const age = Number(document.getElementById(prefix + '-age').value);
    const cons = Number(document.getElementById(prefix + '-cons').value);

    const regTax = Number(document.getElementById(prefix + '-regtax').value);
    const importMisc = Number(document.getElementById(prefix + '-importmisc').value);
    const service = Number(document.getElementById(prefix + '-service').value);
    const tire = Number(document.getElementById(prefix + '-tire').value);
    const ins = Number(document.getElementById(prefix + '-ins').value);
    const depRate = Number(document.getElementById(prefix + '-dep-rate').value);
    const years = Number(document.getElementById('global-years').value);
    const inflationRate = Number(document.getElementById('global-inflation').value);

    // Call the logic function
    return Calculator.calculateTCO({
        annualKm, interestRate, fuelPrice, evChargePrice, solarExcess,
        isImp, isEv, price, hp, age, cons,
        regTax, importMisc, service, tire, ins, depRate, years,
        inflationRate
    });
}

function markWinner(aId, bId, aVal, bVal) {
    const aEl = document.getElementById(aId);
    const bEl = document.getElementById(bId);
    aEl.classList.remove('winner');
    bEl.classList.remove('winner');
    if (aVal < bVal) aEl.classList.add('winner');
    else if (bVal < aVal) bEl.classList.add('winner');
}

function markStale() {
    const table = document.getElementById('results');
    if (table.style.display === 'none') return;
    table.classList.add('stale');
    document.getElementById('stale-warning').style.display = 'block';
}

function clearStale() {
    document.getElementById('results').classList.remove('stale');
    document.getElementById('stale-warning').style.display = 'none';
}

function calculateBoth() {
    if (!validate()) return;
    clearStale();

    const resA = calculateCar('a');
    const resB = calculateCar('b');
    const km = Number(document.getElementById('global-km').value);

    const fmt = (n) => new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format(n);

    // Fill Table A
    document.getElementById('res-a-fuel').innerText = fmt(resA.fuel);
    document.getElementById('res-a-maint').innerText = fmt(resA.maint);
    document.getElementById('res-a-ins').innerText = fmt(resA.ins);
    document.getElementById('res-a-dep').innerText = fmt(resA.dep);
    document.getElementById('res-a-opp').innerText = fmt(resA.opp);
    document.getElementById('res-a-total').innerText = fmt(resA.totalAvg);
    document.getElementById('res-a-total-tco').innerText = fmt(resA.totalTCO);
    document.getElementById('res-a-monthly').innerText = fmt(resA.totalAvg / 12);
    document.getElementById('res-a-km').innerText = Math.round(resA.totalAvg / km) + " Ft";

    // Fill Table B
    document.getElementById('res-b-fuel').innerText = fmt(resB.fuel);
    document.getElementById('res-b-maint').innerText = fmt(resB.maint);
    document.getElementById('res-b-ins').innerText = fmt(resB.ins);
    document.getElementById('res-b-dep').innerText = fmt(resB.dep);
    document.getElementById('res-b-opp').innerText = fmt(resB.opp);
    document.getElementById('res-b-total').innerText = fmt(resB.totalAvg);
    document.getElementById('res-b-total-tco').innerText = fmt(resB.totalTCO);
    document.getElementById('res-b-monthly').innerText = fmt(resB.totalAvg / 12);
    document.getElementById('res-b-km').innerText = Math.round(resB.totalAvg / km) + " Ft";

    // Mark winners (lower cost = better)
    markWinner('res-a-fuel',      'res-b-fuel',      resA.fuel,     resB.fuel);
    markWinner('res-a-maint',     'res-b-maint',     resA.maint,    resB.maint);
    markWinner('res-a-ins',       'res-b-ins',       resA.ins,      resB.ins);
    markWinner('res-a-dep',       'res-b-dep',       resA.dep,      resB.dep);
    markWinner('res-a-opp',       'res-b-opp',       resA.opp,      resB.opp);
    // A TELJES TCO sor header jellegű összesítő — itt nem jelölünk győztest
    markWinner('res-a-total',     'res-b-total',     resA.totalAvg, resB.totalAvg);
    markWinner('res-a-monthly',   'res-b-monthly',   resA.totalAvg, resB.totalAvg);
    markWinner('res-a-km',        'res-b-km',        resA.totalAvg, resB.totalAvg);

    document.getElementById('res-years').innerText = document.getElementById('global-years').value;

    document.getElementById('results').style.display = 'table';

    // Scroll to results
    document.getElementById('results').scrollIntoView({ behavior: "smooth" });
}

// Init
updateUI('a');
updateUI('b');

// Elavult eredmény jelzése minden input változásra
document.querySelectorAll('input').forEach(el => el.addEventListener('input', markStale));
document.querySelectorAll('input[type=radio]').forEach(el => el.addEventListener('change', markStale));
