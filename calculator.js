(function (exports) {

    function getTransferTaxRate(kw, age) {
        if (kw <= 40) return (age <= 3) ? 550 : (age <= 8 ? 450 : 300);
        if (kw <= 80) return (age <= 3) ? 650 : (age <= 8 ? 550 : 450);
        if (kw <= 120) return (age <= 3) ? 750 : (age <= 8 ? 650 : 550);
        return (age <= 3) ? 850 : (age <= 8 ? 750 : 650);
    }

    function getAnnualTaxRate(age) {
        if (age <= 3) return 345;
        if (age <= 7) return 300;
        if (age <= 11) return 230;
        if (age <= 15) return 185;
        return 140;
    }

    function calculateTCO(params) {
        // params: { annualKm, interestRate, fuelPrice, solarExcess, isImp, isEv, price, hp, age, cons, regTax, importMisc, service, tire, ins, depRate, years, inflationRate }

        const {
            annualKm, interestRate, fuelPrice, evChargePrice = 250, solarExcess,
            isImp, isEv, price, hp, age, cons,
            regTax, importMisc, service, tire, ins, depRate, years,
            inflationRate = 0 // Default to 0 if not provided
        } = params;

        if (!years || years <= 0) {
            throw new Error('A tervezett évek száma pozitív szám kell legyen.');
        }

        // 1. ÜZEMANYAG
        let fuelCost = 0;
        if (isEv) {
            // EV esetén kWh
            let needed = (annualKm / 100) * cons;
            if (needed > solarExcess) {
                fuelCost = (needed - solarExcess) * evChargePrice;
            } else {
                fuelCost = 0;
            }
        } else {
            // ICE esetén Liter * Globális Ár
            fuelCost = (annualKm / 100) * cons * fuelPrice;
        }

        // 2. CAPEX
        let capex = price + 12000; // Okmányok
        let kw = Math.round(hp * 0.7355);

        if (!isEv) {
            capex += (kw * getTransferTaxRate(kw, age));
        }

        if (isImp) {
            capex += regTax;
            capex += importMisc;
        } else {
            capex += 18500; // Eredetiségvizsga
        }

        // 3. ÉVES KÖLTSÉGEK
        let totalFuel = 0;
        let totalMaint = 0;
        let totalIns = 0;
        let totalDep = 0;
        let totalOpp = 0;

        let currentVal = price;

        for (let i = 1; i <= years; i++) {
            // Inflation multiplier for this year (assuming costs increase at the start or end? 
            // Usually TCO models apply inflation to the year's cost. 
            // Year 1 cost is usually base cost. Year 2 is base * (1+inf).
            // Or Year 1 is base * (1+inf)? 
            // Let's assume Year 1 is Base (current prices). Year 2 is inflated.
            // So multiplier = (1 + inflation/100)^(i-1)
            const inflationMultiplier = Math.pow(1 + inflationRate / 100, i - 1);

            // a) Üzemanyag
            totalFuel += (fuelCost * inflationMultiplier);

            // b) Adó
            let currentAge = age + i - 1;
            let currentTax = 0;
            if (!isEv) {
                currentTax = kw * getAnnualTaxRate(currentAge);
            }

            // c) Karbantartás
            // Service and Tire inflate. Tax does not.
            totalMaint += ((service + tire) * inflationMultiplier) + currentTax;

            // d) Biztosítás
            totalIns += (ins * inflationMultiplier);

            // e) Haszonáldozat (az év eleji autóértékre vetítve)
            totalOpp += (currentVal * interestRate);

            // f) Értékvesztés
            let annualDep = currentVal * (depRate / 100);
            totalDep += annualDep;
            currentVal -= annualDep;
        }

        let totalTCO = totalFuel + totalMaint + totalIns + totalDep + totalOpp;

        return {
            fuel: totalFuel / years,
            maint: totalMaint / years,
            ins: totalIns / years,
            dep: totalDep / years,
            opp: totalOpp / years,
            totalAvg: totalTCO / years,
            totalTCO: totalTCO
        };
    }

    exports.getTransferTaxRate = getTransferTaxRate;
    exports.getAnnualTaxRate = getAnnualTaxRate;
    exports.calculateTCO = calculateTCO;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.Calculator = {}));
