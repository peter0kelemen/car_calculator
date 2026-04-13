// Validációs határérték tesztek — ui.js validate() logikájának izolált tesztje
// Futtatás: node validation_edge_test.js

const rules = [
    { id: 'global-km',        cond: v => v > 0 && v <= 200000,    label: 'Éves futás (km/év)',           min: 1,   max: 200000   },
    { id: 'global-years',     cond: v => v > 0 && v <= 20,        label: 'Tervezett évek',               min: 1,   max: 20       },
    { id: 'global-interest',  cond: v => v >= 0 && v <= 20,       label: 'Kamat (%)',                    min: 0,   max: 20       },
    { id: 'global-fuelprice', cond: v => v >= 0 && v <= 2000,     label: 'Üzemanyagár (Ft/L)',           min: 0,   max: 2000     },
    { id: 'global-evcharge',  cond: v => v >= 0 && v <= 2000,     label: 'EV töltési ár (Ft/kWh)',       min: 0,   max: 2000     },
    { id: 'global-solar',     cond: v => v >= 0 && v <= 20000,    label: 'Napelem-többlet (kWh/év)',      min: 0,   max: 20000    },
    { id: 'global-inflation', cond: v => v >= 0 && v <= 25,       label: 'Infláció (%)',                 min: 0,   max: 25       },
    { id: 'price',            cond: v => v > 0 && v <= 100000000, label: 'Vételár (Ft)',                 min: 1,   max: 100000000},
    { id: 'hp',               cond: v => v > 0 && v <= 1000,      label: 'Teljesítmény (LE)',            min: 1,   max: 1000     },
    { id: 'cons',             cond: v => v > 0 && v <= 50,        label: 'Fogyasztás',                   min: 0.1, max: 50       },
    { id: 'dep-rate',         cond: v => v >= 0 && v <= 50,       label: 'Értékvesztés ráta (%)',        min: 0,   max: 50       },
    { id: 'service',          cond: v => v >= 0 && v <= 400000,   label: 'Szerviz (Ft/év)',              min: 0,   max: 400000   },
    { id: 'tire',             cond: v => v >= 0 && v <= 400000,   label: 'Gumiabroncs (Ft/év)',          min: 0,   max: 400000   },
    { id: 'ins',              cond: v => v >= 0 && v <= 400000,   label: 'Biztosítás (Ft/év)',           min: 0,   max: 400000   },
    { id: 'regtax',           cond: v => v >= 0 && v <= 10000000, label: 'Regisztrációs adó (Ft)',       min: 0,   max: 10000000 },
    { id: 'importmisc',       cond: v => v >= 0 && v <= 10000000, label: 'Hazahozatal egyéb (Ft)',       min: 0,   max: 10000000 },
];

let passed = 0;
let failed = 0;

function assert(description, actual, expected) {
    if (actual === expected) {
        console.log(`  ✓ ${description}`);
        passed++;
    } else {
        console.error(`  ✗ ${description} — várt: ${expected}, kapott: ${actual}`);
        failed++;
    }
}

for (const rule of rules) {
    console.log(`\n[${rule.label}]`);

    // Minimum határ: éppen érvényes
    assert(`min (${rule.min}) elfogadva`,        rule.cond(rule.min),         true);
    // Maximum határ: éppen érvényes
    assert(`max (${rule.max}) elfogadva`,        rule.cond(rule.max),         true);

    // Maximum + 1 (vagy kis epszilon): elutasítva
    const overMax = rule.max + (Number.isInteger(rule.max) ? 1 : 0.01);
    assert(`max+1 (${overMax}) elutasítva`,      rule.cond(overMax),          false);

    // Középérték: érvényes
    const mid = (rule.min + rule.max) / 2;
    assert(`középérték (${mid}) elfogadva`,      rule.cond(mid),              true);

    // Negatív szám: mindig elutasítva (kivéve ha min=0-nál kisebb lehetne)
    assert(`negatív (-1) elutasítva`,            rule.cond(-1),               false);

    // 0 alatti határ: specifikusan a min < 1-es mezőknél
    if (rule.min === 0) {
        assert(`nulla (0) elfogadva (min=0)`,    rule.cond(0),                true);
    } else {
        assert(`nulla (0) elutasítva (min>0)`,   rule.cond(0),                false);
    }

    // NaN: elutasítva
    assert(`NaN elutasítva`,                     rule.cond(NaN),              false);

    // Infinity: elutasítva
    assert(`Infinity elutasítva`,                rule.cond(Infinity),         false);
}

console.log(`\n${'='.repeat(50)}`);
console.log(`Eredmény: ${passed} sikeres, ${failed} sikertelen`);
if (failed > 0) process.exit(1);
