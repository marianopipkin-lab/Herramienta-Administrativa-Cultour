import {
  Operation,
  FinancialAccount,
  FixedExpense,
  FinancialMovement,
  MonthlyClosing,
  HistoricalPeriod,
  CultourFinancialPosition,
  ExchangeRateConfig,
  Currency
} from '../types';

export const DEFAULT_EXCHANGE_RATE: ExchangeRateConfig = {
  usdToArsRate: 1320,
  rateDate: '2026-08-30',
  sourceLabel: 'Dólar Financiero / MEP'
};

export interface FinancialKPIs {
  // Cash & Holdings
  currentCash: number;
  projectedCash: number;
  pendingReceivables: number;
  pendingSupplierPayables: number;
  monthlyFixedExpenses: number;
  committedCash: number;
  projectedFreeCash: number;

  // Operations Profitability
  totalExpectedRevenue: number;
  totalReceivedRevenue: number;
  totalPendingRevenue: number;
  totalExpectedCost: number;
  totalPaidCost: number;
  totalPendingCost: number;
  totalExpectedProfit: number;
  totalRealizedProfit: number;
  totalPendingProfit: number;
  expectedProfitMargin: number;

  // Operational counts
  activeOperationsCount: number;
  futureOperationsCount: number;
  pastOperationsCount: number;
  unreconciledMovementsCount: number;
  unreconciledAmount: number;
  pendingStudentsDebtCount: number;
  pendingStudentsDebtAmount: number;
}

export interface MonthlyCashEvolution {
  monthKey: string; // '2026-09'
  monthLabel: string; // 'Septiembre 2026'
  initialCash: number;
  projectedIncome: number;
  projectedSupplierPayments: number;
  projectedFixedExpenses: number;
  finalProjectedCash: number;
  netMonthlyCashFlow: number;
  isProjected: boolean;
}

export function formatCurrency(amount: number, currency: Currency = 'ARS'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return currency === 'USD' ? 'USD 0' : '$ 0';
  }
  const prefix = currency === 'USD' ? 'USD ' : '$ ';
  return `${prefix}${new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(amount)}`;
}

export function formatPercent(value: number): string {
  if (isNaN(value) || !isFinite(value)) return '0.0%';
  return `${value.toFixed(1)}%`;
}

/**
 * Calculates the strict Cultour Financial Position for Partners (SOCIOS).
 * Clearly differentiates Cash in Accounts vs Future Ops Advances vs Committed Funds vs Available Profit.
 */
export function calculateCultourFinancialPosition(
  operations: Operation[],
  accounts: FinancialAccount[],
  fixedExpenses: FixedExpense[],
  rateConfig: ExchangeRateConfig = DEFAULT_EXCHANGE_RATE
): CultourFinancialPosition {
  const rate = rateConfig.usdToArsRate > 0 ? rateConfig.usdToArsRate : 1320;
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Dinero actualmente existente en cuentas
  let cashARS = 0;
  let cashUSD = 0;

  accounts.forEach(acc => {
    const bal = acc.currentBalance || 0;
    if (acc.currency === 'USD') {
      cashUSD += bal;
    } else {
      cashARS += bal;
    }
  });

  const cashEquivalentUSD = cashUSD + (cashARS / rate);

  // 2. Separar operaciones pasadas (realizadas) vs operaciones futuras
  const activeOps = operations.filter(op => op.status !== 'cancelada');

  let futureOpsCollectedARS = 0;
  let futureOpsCollectedUSD = 0;
  let futureOpsPendingCostsARS = 0;
  let futureOpsPendingCostsUSD = 0;

  let pastOpsRealizedProfitARS = 0;
  let pastOpsRealizedProfitUSD = 0;

  let futureOpsProjectedProfitARS = 0;
  let futureOpsProjectedProfitUSD = 0;

  // Breakdown by business unit
  const buMap = {
    receptivo: { revenue: 0, costs: 0, profit: 0, margin: 0, opsCount: 0, currency: 'USD' as Currency },
    salidas: { revenue: 0, costs: 0, profit: 0, margin: 0, opsCount: 0, currency: 'ARS' as Currency },
    viajes: { revenue: 0, costs: 0, profit: 0, margin: 0, opsCount: 0, currency: 'ARS' as Currency }
  };

  activeOps.forEach(op => {
    const isFuture = op.date >= todayStr;
    const isUSD = op.currency === 'USD' || op.businessUnit === 'receptivo';
    const recRev = op.receivedRevenue || 0;
    const expRev = op.expectedRevenue || 0;
    const paidCost = op.paidCost || 0;
    const expCost = op.expectedCost || 0;
    const pendingCost = Math.max(0, expCost - paidCost);

    // Business unit stats
    if (buMap[op.businessUnit]) {
      buMap[op.businessUnit].revenue += expRev;
      buMap[op.businessUnit].costs += expCost;
      buMap[op.businessUnit].opsCount += 1;
    }

    if (isFuture) {
      // Dinero cobrado de operaciones que aún no se ejecutaron (anticipos / fondos comprometidos con el servicio)
      if (isUSD) {
        futureOpsCollectedUSD += recRev;
        futureOpsPendingCostsUSD += pendingCost;
        futureOpsProjectedProfitUSD += (expRev - expCost);
      } else {
        futureOpsCollectedARS += recRev;
        futureOpsPendingCostsARS += pendingCost;
        futureOpsProjectedProfitARS += (expRev - expCost);
      }
    } else {
      // Operaciones ya ejecutadas (resultado devengado real)
      if (isUSD) {
        pastOpsRealizedProfitUSD += (recRev - paidCost);
      } else {
        pastOpsRealizedProfitARS += (recRev - paidCost);
      }
    }
  });

  // Calculate BU margins
  Object.keys(buMap).forEach(key => {
    const unit = buMap[key as keyof typeof buMap];
    unit.profit = unit.revenue - unit.costs;
    unit.margin = unit.revenue > 0 ? (unit.profit / unit.revenue) * 100 : 0;
  });

  // 3. Gastos fijos mensuales activos
  const monthlyFixedARS = fixedExpenses
    .filter(f => f.status === 'activo' && f.currency !== 'USD')
    .reduce((acc, f) => {
      if (f.frequency === 'mensual') return acc + f.amount;
      if (f.frequency === 'anual') return acc + (f.amount / 12);
      if (f.frequency === 'quincenal') return acc + (f.amount * 2);
      if (f.frequency === 'trimestral') return acc + (f.amount / 3);
      return acc + f.amount;
    }, 0);

  const monthlyFixedUSD = fixedExpenses
    .filter(f => f.status === 'activo' && f.currency === 'USD')
    .reduce((acc, f) => acc + f.amount, 0);

  // 4. Dinero comprometido: Costos pendientes de ops futuras + Gastos fijos de estructura inmediata
  const committedFundsARS = futureOpsPendingCostsARS + monthlyFixedARS;
  const committedFundsUSD = futureOpsPendingCostsUSD + monthlyFixedUSD;
  const committedFundsEquivalentUSD = committedFundsUSD + (committedFundsARS / rate);

  // 5. Ganancia disponible real:
  // Es la liquidez en cuenta menos el dinero comprometido para pagar operaciones futuras y gastos fijos
  const availableProfitARS = Math.max(0, cashARS - committedFundsARS);
  const availableProfitUSD = Math.max(0, cashUSD - committedFundsUSD);
  const availableProfitEquivalentUSD = availableProfitUSD + (availableProfitARS / rate);

  return {
    cashARS,
    cashUSD,
    cashEquivalentUSD,

    futureOpsCollectedARS,
    futureOpsCollectedUSD,
    futureOpsCollectedEquivalentUSD: futureOpsCollectedUSD + (futureOpsCollectedARS / rate),

    futureOpsPendingCostsARS,
    futureOpsPendingCostsUSD,
    futureOpsPendingCostsEquivalentUSD: futureOpsPendingCostsUSD + (futureOpsPendingCostsARS / rate),

    committedFundsARS,
    committedFundsUSD,
    committedFundsEquivalentUSD,

    pastOpsRealizedProfitARS,
    pastOpsRealizedProfitUSD,
    pastOpsRealizedProfitEquivalentUSD: pastOpsRealizedProfitUSD + (pastOpsRealizedProfitARS / rate),

    futureOpsProjectedProfitARS,
    futureOpsProjectedProfitUSD,
    futureOpsProjectedProfitEquivalentUSD: futureOpsProjectedProfitUSD + (futureOpsProjectedProfitARS / rate),

    availableProfitARS,
    availableProfitUSD,
    availableProfitEquivalentUSD,

    byBusinessUnit: buMap
  };
}

export function calculateKPIs(
  operations: Operation[],
  accounts: FinancialAccount[],
  fixedExpenses: FixedExpense[],
  movements: FinancialMovement[]
): FinancialKPIs {
  // 1. Current Cash in all accounts
  const currentCash = accounts.reduce((acc, a) => acc + (a.currentBalance || 0), 0);

  // 2. Active operations
  const activeOps = operations.filter(op => op.status !== 'cancelada');

  let totalExpectedRevenue = 0;
  let totalReceivedRevenue = 0;
  let totalExpectedCost = 0;
  let totalPaidCost = 0;
  let pendingReceivables = 0;
  let pendingSupplierPayables = 0;

  activeOps.forEach(op => {
    totalExpectedRevenue += op.expectedRevenue || 0;
    totalReceivedRevenue += op.receivedRevenue || 0;
    totalExpectedCost += op.expectedCost || 0;
    totalPaidCost += op.paidCost || 0;

    const opPendingRec = Math.max(0, (op.expectedRevenue || 0) - (op.receivedRevenue || 0));
    const opPendingCost = Math.max(0, (op.expectedCost || 0) - (op.paidCost || 0));

    pendingReceivables += opPendingRec;
    pendingSupplierPayables += opPendingCost;
  });

  const totalPendingRevenue = pendingReceivables;
  const totalPendingCost = pendingSupplierPayables;

  // Expected profit = Total expected revenue - total expected cost
  const totalExpectedProfit = totalExpectedRevenue - totalExpectedCost;
  // Realized profit to date = Actually collected - actually paid
  const totalRealizedProfit = totalReceivedRevenue - totalPaidCost;
  // Pending profit
  const totalPendingProfit = totalExpectedProfit - totalRealizedProfit;

  const expectedProfitMargin = totalExpectedRevenue > 0
    ? (totalExpectedProfit / totalExpectedRevenue) * 100
    : 0;

  // Monthly fixed expenses
  const monthlyFixedExpenses = fixedExpenses
    .filter(f => f.status === 'activo')
    .reduce((acc, f) => {
      if (f.frequency === 'mensual') return acc + f.amount;
      if (f.frequency === 'anual') return acc + (f.amount / 12);
      if (f.frequency === 'quincenal') return acc + (f.amount * 2);
      if (f.frequency === 'trimestral') return acc + (f.amount / 3);
      return acc + f.amount;
    }, 0);

  // Committed cash = pending supplier payables + monthly fixed expenses
  const committedCash = pendingSupplierPayables + monthlyFixedExpenses;

  // Projected Free Cash = Current Cash + pending receivables - pending supplier payables - future fixed costs
  const projectedCash = currentCash + pendingReceivables - pendingSupplierPayables;
  const projectedFreeCash = currentCash + pendingReceivables - pendingSupplierPayables - monthlyFixedExpenses;

  // Counts & alerts
  const todayStr = new Date().toISOString().split('T')[0];
  const activeOperationsCount = activeOps.length;
  const futureOperationsCount = activeOps.filter(op => op.date >= todayStr).length;
  const pastOperationsCount = activeOps.filter(op => op.date < todayStr).length;

  const unreconciledMovements = movements.filter(m => m.matchStatus === 'rojo' || m.matchStatus === 'amarillo');
  const unreconciledMovementsCount = unreconciledMovements.length;
  const unreconciledAmount = unreconciledMovements.reduce((acc, m) => acc + m.amount, 0);

  // Student debts
  let pendingStudentsDebtCount = 0;
  let pendingStudentsDebtAmount = 0;

  activeOps.forEach(op => {
    if (op.students && op.students.length > 0) {
      op.students.forEach(st => {
        const debt = Math.max(0, st.expectedAmount - st.paidAmount);
        if (debt > 0) {
          pendingStudentsDebtCount++;
          pendingStudentsDebtAmount += debt;
        }
      });
    }
  });

  return {
    currentCash,
    projectedCash,
    pendingReceivables,
    pendingSupplierPayables,
    monthlyFixedExpenses,
    committedCash,
    projectedFreeCash,

    totalExpectedRevenue,
    totalReceivedRevenue,
    totalPendingRevenue,
    totalExpectedCost,
    totalPaidCost,
    totalPendingCost,
    totalExpectedProfit,
    totalRealizedProfit,
    totalPendingProfit,
    expectedProfitMargin,

    activeOperationsCount,
    futureOperationsCount,
    pastOperationsCount,
    unreconciledMovementsCount,
    unreconciledAmount,
    pendingStudentsDebtCount,
    pendingStudentsDebtAmount,
  };
}

export function generateMonthlyCashProjection(
  currentCash: number,
  operations: Operation[],
  fixedExpenses: FixedExpense[],
  historicalPeriods: HistoricalPeriod[],
  monthlyClosings: MonthlyClosing[]
): MonthlyCashEvolution[] {
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const result: MonthlyCashEvolution[] = [];
  const monthlyFixedCost = fixedExpenses
    .filter(f => f.status === 'activo')
    .reduce((acc, f) => acc + f.amount, 0);

  // 1. Include past months
  const pastMonths = ['2026-06', '2026-07', '2026-08'];
  let runningCash = 38200000;

  pastMonths.forEach(ym => {
    const [year, month] = ym.split('-');
    const mIdx = parseInt(month, 10) - 1;
    const label = `${monthNames[mIdx]} ${year}`;

    const closing = monthlyClosings.find(c => c.yearMonth === ym);
    const histOps = historicalPeriods.filter(h => h.yearMonth === ym);

    let inc = 0;
    let exp = 0;

    if (closing) {
      inc = closing.totalIncome;
      exp = closing.totalExpense;
      runningCash = closing.calculatedFinalCash;
    } else if (histOps.length > 0) {
      inc = histOps.reduce((a, b) => a + b.revenue, 0);
      exp = histOps.reduce((a, b) => a + b.expenses, 0);
    } else {
      inc = 42000000;
      exp = 31000000;
    }

    const init = runningCash - inc + exp;
    result.push({
      monthKey: ym,
      monthLabel: label,
      initialCash: init,
      projectedIncome: inc,
      projectedSupplierPayments: exp - monthlyFixedCost,
      projectedFixedExpenses: monthlyFixedCost,
      finalProjectedCash: runningCash,
      netMonthlyCashFlow: inc - exp,
      isProjected: false
    });
  });

  // 2. Future months (Sep 2026, Oct 2026, Nov 2026, Dec 2026)
  const futureMonths = ['2026-09', '2026-10', '2026-11', '2026-12'];
  let simCash = currentCash;

  futureMonths.forEach(ym => {
    const [year, month] = ym.split('-');
    const mIdx = parseInt(month, 10) - 1;
    const label = `${monthNames[mIdx]} ${year} (Proy.)`;

    let monthIncome = 0;
    let monthSupplierCosts = 0;

    operations.forEach(op => {
      if (op.date && op.date.startsWith(ym)) {
        const pendingRev = Math.max(0, op.expectedRevenue - op.receivedRevenue);
        monthIncome += pendingRev;
        const pendingCost = Math.max(0, op.expectedCost - op.paidCost);
        monthSupplierCosts += pendingCost;
      }
    });

    if (monthIncome === 0 && (ym === '2026-11' || ym === '2026-12')) {
      monthIncome = 12500000;
      monthSupplierCosts = 7800000;
    }

    const init = simCash;
    const finalCash = init + monthIncome - monthSupplierCosts - monthlyFixedCost;
    simCash = finalCash;

    result.push({
      monthKey: ym,
      monthLabel: label,
      initialCash: init,
      projectedIncome: monthIncome,
      projectedSupplierPayments: monthSupplierCosts,
      projectedFixedExpenses: monthlyFixedCost,
      finalProjectedCash: finalCash,
      netMonthlyCashFlow: monthIncome - monthSupplierCosts - monthlyFixedCost,
      isProjected: true
    });
  });

  return result;
}
