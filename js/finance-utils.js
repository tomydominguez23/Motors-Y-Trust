/**
 * Cálculo de cuota referencial (crédito automotriz simplificado).
 * Uso: Trust Motors web + admin.
 */
(function (global) {
  function calcMonthlyPayment(price, downPayment = 0, months = 48, annualRatePercent = 24) {
    const principal = Math.max(0, Number(price) - Number(downPayment || 0));
    const n = Math.max(1, parseInt(months, 10) || 48);
    if (principal <= 0) return 0;

    const annual = Number(annualRatePercent);
    if (!annual || annual <= 0) {
      return Math.round(principal / n);
    }

    const r = annual / 100 / 12;
    const factor = Math.pow(1 + r, n);
    const pmt = (principal * r * factor) / (factor - 1);
    return Math.round(pmt);
  }

  function getVehicleMonthlyPayment(vehicle) {
    if (!vehicle || vehicle.finance_enabled === false) return null;

    if (vehicle.finance_monthly != null && vehicle.finance_monthly > 0) {
      return Number(vehicle.finance_monthly);
    }

    return calcMonthlyPayment(
      vehicle.price,
      vehicle.finance_down_payment ?? 0,
      vehicle.finance_months ?? 48,
      vehicle.finance_annual_rate ?? 24
    );
  }

  function formatFinanceNote(vehicle) {
    const months = vehicle.finance_months ?? 48;
    const down = Number(vehicle.finance_down_payment || 0);
    const rate = vehicle.finance_annual_rate ?? 24;
    let note = `*Cuota referencial a ${months} meses`;
    if (down > 0) note += `, pie ${down.toLocaleString('es-CL')}`;
    note += `, tasa anual referencial ${rate}%. Sujeto a evaluación crediticia.`;
    return note;
  }

  global.TrustFinance = {
    calcMonthlyPayment,
    getVehicleMonthlyPayment,
    formatFinanceNote,
  };
})(typeof window !== 'undefined' ? window : global);
