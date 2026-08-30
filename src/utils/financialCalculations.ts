import {
  Operation,
  FinancialAccount,
  FixedExpense,
  FinancialMovement,
  MonthlyClosing,
  HistoricalPeriod
} from '../types';

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

export function formatCurrency(amount: number, currency: 'ARS' | 'USD' = 'ARS'): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '$0';
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
  // Note: already paid costs are already out of current cash, so we ONLY subtract pending costs!
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

  // 1. Include past 2 months from closings/historical
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

  // 2. Future 4 months (Sep 2026, Oct 2026, Nov 2026, Dec 2026)
  const futureMonths = ['2026-09', '2026-10', '2026-11', '2026-12'];
  let simCash = currentCash;

  futureMonths.forEach(ym => {
    const [year, month] = ym.split('-');
    const mIdx = parseInt(month, 10) - 1;
    const label = `${monthNames[mIdx]} ${year} (Proy.)`;

    // Incomes scheduled or operations in this month
    let monthIncome = 0;
    let monthSupplierCosts = 0;

    operations.forEach(op => {
      // Check operations in this month
      if (op.date && op.date.startsWith(ym)) {
        // Pending revenue to collect
        const pendingRev = Math.max(0, op.expectedRevenue - op.receivedRevenue);
        monthIncome += pendingRev;

        // Pending supplier costs to pay
        const pendingCost = Math.max(0, op.expectedCost - op.paidCost);
        monthSupplierCosts += pendingCost;
      }
    });

    // In case no operations exist for future months yet, apply baseline projection
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
