import {
  Operation,
  FinancialAccount,
  FixedExpense,
  FinancialMovement,
  MonthlyClosing,
  HistoricalPeriod,
  CultourFinancialPosition,
  ExchangeRateConfig,
  Currency,
  UnitChannelPerformance
} from '../types';

export const DEFAULT_EXCHANGE_RATE: ExchangeRateConfig = {
  usdToArsRate: 1320,
  rateDate: '2026-08-30',
  sourceLabel: 'Dólar Financiero / MEP'
};

export interface FinancialKPIs {
  // Cash & Holdings
  currentCashARS: number;
  currentCashUSD: number;
  currentCashEquivalentUSD: number;
  currentCash: number; // Consolidado en ARS para compatibilidad

  projectedCash: number;
  pendingReceivablesARS: number;
  pendingReceivablesUSD: number;
  pendingReceivables: number;
  pendingSupplierPayablesARS: number;
  pendingSupplierPayablesUSD: number;
  pendingSupplierPayables: number;
  monthlyFixedExpensesARS: number;
  monthlyFixedExpensesUSD: number;
  monthlyFixedExpenses: number;

  // Obligaciones (Compromisos pendientes exigibles)
  obligationsARS?: number;
  obligationsUSD?: number;
  obligationsEquivalentUSD?: number;
  committedCashARS: number;
  committedCashUSD: number;
  committedCashEquivalentUSD: number;
  committedCash: number;

  // Caja Libre Real
  freeCashARS: number;
  freeCashUSD: number;
  freeCashEquivalentUSD: number;
  availableCashARS: number;
  availableCashUSD: number;
  availableCashEquivalentUSD: number;
  projectedFreeCash: number;

  // Future Ops Custody
  futureOpsCollectedARS: number;
  futureOpsCollectedUSD: number;
  futureOpsCollectedEquivalentUSD: number;

  // Operations Profitability
  totalExpectedRevenueARS: number;
  totalExpectedRevenueUSD: number;
  totalExpectedRevenue: number;
  totalReceivedRevenueARS: number;
  totalReceivedRevenueUSD: number;
  totalReceivedRevenue: number;
  totalPendingRevenueARS: number;
  totalPendingRevenueUSD: number;
  totalPendingRevenue: number;

  totalExpectedCostARS: number;
  totalExpectedCostUSD: number;
  totalExpectedCost: number;
  totalPaidCostARS: number;
  totalPaidCostUSD: number;
  totalPaidCost: number;
  totalPendingCostARS: number;
  totalPendingCostUSD: number;
  totalPendingCost: number;

  totalExpectedProfitARS: number;
  totalExpectedProfitUSD: number;
  totalExpectedProfitEquivalentUSD: number;
  totalExpectedProfit: number;
  totalRealizedProfitARS: number;
  totalRealizedProfitUSD: number;
  totalRealizedProfitEquivalentUSD: number;
  totalRealizedProfit: number;
  totalPendingProfit: number;
  expectedProfitMargin: number;

  // Realized vs Projected separation
  pastOpsRealizedProfitARS?: number;
  pastOpsRealizedProfitUSD?: number;
  pastOpsRealizedProfitEquivalentUSD?: number;
  futureOpsProjectedProfitARS?: number;
  futureOpsProjectedProfitUSD?: number;
  futureOpsProjectedProfitEquivalentUSD?: number;

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
  
  // ARS Metrics
  initialCashARS: number;
  projectedIncomeARS: number;
  projectedSupplierPaymentsARS: number;
  projectedFixedExpensesARS: number;
  finalProjectedCashARS: number;
  netMonthlyCashFlowARS: number;

  // USD Metrics
  initialCashUSD: number;
  projectedIncomeUSD: number;
  projectedSupplierPaymentsUSD: number;
  projectedFixedExpensesUSD: number;
  finalProjectedCashUSD: number;
  netMonthlyCashFlowUSD: number;

  // Compatibility aliases (ARS)
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
 * Determines whether an operation represents a future trip whose funds are in custody.
 * A trip is FUTURE if:
 * 1. It is not cancelled.
 * 2. It is not marked as completed ('realizada').
 * 3. Its scheduled date (or endDate) has not yet passed (< today).
 *
 * When a trip is executed, finished, or marked 'realizada', its funds are no longer in custody
 * and are liberated for free cash calculation.
 */
export function isFutureTrip(op: Operation, todayStr: string = new Date().toISOString().split('T')[0]): boolean {
  if (op.status === 'cancelada') return false;
  if (op.status === 'realizada') return false;
  const opDate = op.endDate || op.date;
  if (!opDate) return true;
  return opDate >= todayStr;
}

/**
 * Calculates the strict Cultour Financial Position for Partners (SOCIOS).
 * Clearly differentiates:
 * 1. Real Cash in Accounts (ARS & USD)
 * 2. Money Collected for Future Trips (Customer Advances / Escrow)
 * 3. Pending Supplier Obligations (Payables for future & past ops)
 * 4. Monthly Fixed Expenses
 * 5. Total Committed Funds
 * 6. Free Cash / Real Available Liquidity
 * 7. Realized Operational Profit (Executed trips P&L)
 * 8. Projected Profit (Future trips P&L)
 * 9. Breakdown by Business Unit & Channel (Receptivo Directo, Receptivo Agencias, Salidas Educativas, Viajes Educativos)
 */
export function calculateCultourFinancialPosition(
  operations: Operation[],
  accounts: FinancialAccount[],
  fixedExpenses: FixedExpense[],
  rateConfig: ExchangeRateConfig = DEFAULT_EXCHANGE_RATE
): CultourFinancialPosition {
  const rate = rateConfig.usdToArsRate > 0 ? rateConfig.usdToArsRate : 1320;
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Dinero real actualmente existente en cuentas
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

  // 2. Operaciones activas
  const activeOps = operations.filter(op => op.status !== 'cancelada');

  let futureOpsCollectedARS = 0;
  let futureOpsCollectedUSD = 0;
  let futureOpsPendingCostsARS = 0;
  let futureOpsPendingCostsUSD = 0;
  let pastOpsPendingCostsARS = 0;
  let pastOpsPendingCostsUSD = 0;

  let pastOpsRevenueARS = 0;
  let pastOpsRevenueUSD = 0;
  let pastOpsCostsARS = 0;
  let pastOpsCostsUSD = 0;
  let pastOpsRealizedProfitARS = 0;
  let pastOpsRealizedProfitUSD = 0;

  let futureOpsExpectedRevenueARS = 0;
  let futureOpsExpectedRevenueUSD = 0;
  let futureOpsExpectedCostARS = 0;
  let futureOpsExpectedCostUSD = 0;
  let futureOpsProjectedProfitARS = 0;
  let futureOpsProjectedProfitUSD = 0;

  let pendingReceivablesARS = 0;
  let pendingReceivablesUSD = 0;

  // Breakdown by unit and channel
  const channels: {
    receptivoDirecto: UnitChannelPerformance;
    receptivoAgencia: UnitChannelPerformance;
    salidasEducativas: UnitChannelPerformance;
    viajesEducativos: UnitChannelPerformance;
  } = {
    receptivoDirecto: {
      name: 'Turismo Receptivo — Venta Directa',
      currency: 'USD',
      opsCount: 0,
      expectedRevenue: 0,
      receivedRevenue: 0,
      pendingRevenue: 0,
      expectedCost: 0,
      paidCost: 0,
      pendingCost: 0,
      expectedProfit: 0,
      realizedProfit: 0,
      margin: 0
    },
    receptivoAgencia: {
      name: 'Turismo Receptivo — Agencias B2B',
      currency: 'USD',
      opsCount: 0,
      expectedRevenue: 0,
      receivedRevenue: 0,
      pendingRevenue: 0,
      expectedCost: 0,
      paidCost: 0,
      pendingCost: 0,
      expectedProfit: 0,
      realizedProfit: 0,
      margin: 0,
      agencyCommission: 0
    },
    salidasEducativas: {
      name: 'Turismo Educativo — Salidas Educativas',
      currency: 'ARS',
      opsCount: 0,
      expectedRevenue: 0,
      receivedRevenue: 0,
      pendingRevenue: 0,
      expectedCost: 0,
      paidCost: 0,
      pendingCost: 0,
      expectedProfit: 0,
      realizedProfit: 0,
      margin: 0
    },
    viajesEducativos: {
      name: 'Turismo Educativo — Viajes Educativos',
      currency: 'ARS',
      opsCount: 0,
      expectedRevenue: 0,
      receivedRevenue: 0,
      pendingRevenue: 0,
      expectedCost: 0,
      paidCost: 0,
      pendingCost: 0,
      expectedProfit: 0,
      realizedProfit: 0,
      margin: 0
    }
  };

  const buMap = {
    receptivo: { revenue: 0, costs: 0, profit: 0, margin: 0, opsCount: 0, currency: 'USD' as Currency },
    salidas: { revenue: 0, costs: 0, profit: 0, margin: 0, opsCount: 0, currency: 'ARS' as Currency },
    viajes: { revenue: 0, costs: 0, profit: 0, margin: 0, opsCount: 0, currency: 'ARS' as Currency }
  };

  activeOps.forEach(op => {
    const isFuture = isFutureTrip(op, todayStr);
    const isUSD = op.currency === 'USD' || op.businessUnit === 'receptivo';
    const recRev = op.receivedRevenue || 0;
    const expRev = op.expectedRevenue || 0;
    const paidCost = op.paidCost || 0;
    const expCost = op.expectedCost || 0;
    const pendingRev = Math.max(0, expRev - recRev);
    const pendingCost = Math.max(0, expCost - paidCost);

    // Legacy BU stats
    if (buMap[op.businessUnit]) {
      buMap[op.businessUnit].revenue += expRev;
      buMap[op.businessUnit].costs += expCost;
      buMap[op.businessUnit].opsCount += 1;
    }

    // Assign to Channel
    let chKey: keyof typeof channels = 'salidasEducativas';
    if (op.businessUnit === 'receptivo') {
      chKey = op.receptiveChannel === 'agencia' ? 'receptivoAgencia' : 'receptivoDirecto';
    } else if (op.businessUnit === 'viajes') {
      chKey = 'viajesEducativos';
    } else {
      chKey = 'salidasEducativas';
    }

    const ch = channels[chKey];
    ch.opsCount += 1;
    ch.expectedRevenue += expRev;
    ch.receivedRevenue += recRev;
    ch.pendingRevenue += pendingRev;
    ch.expectedCost += expCost;
    ch.paidCost += paidCost;
    ch.pendingCost += pendingCost;
    ch.expectedProfit += (expRev - expCost);
    ch.realizedProfit += (recRev - paidCost);
    if (op.businessUnit === 'receptivo' && op.receptiveChannel === 'agencia' && op.agencyCommission) {
      channels.receptivoAgencia.agencyCommission = (channels.receptivoAgencia.agencyCommission || 0) + op.agencyCommission;
    }

    // Categorize Future vs Past
    if (isFuture) {
      if (isUSD) {
        futureOpsCollectedUSD += recRev;
        futureOpsPendingCostsUSD += pendingCost;
        futureOpsExpectedRevenueUSD += expRev;
        futureOpsExpectedCostUSD += expCost;
        futureOpsProjectedProfitUSD += (expRev - expCost);
        pendingReceivablesUSD += pendingRev;
      } else {
        futureOpsCollectedARS += recRev;
        futureOpsPendingCostsARS += pendingCost;
        futureOpsExpectedRevenueARS += expRev;
        futureOpsExpectedCostARS += expCost;
        futureOpsProjectedProfitARS += (expRev - expCost);
        pendingReceivablesARS += pendingRev;
      }
    } else {
      // Past / Executed trips
      if (isUSD) {
        pastOpsRevenueUSD += expRev;
        pastOpsCostsUSD += expCost;
        pastOpsRealizedProfitUSD += (recRev - paidCost);
        pastOpsPendingCostsUSD += pendingCost;
        pendingReceivablesUSD += pendingRev;
      } else {
        pastOpsRevenueARS += expRev;
        pastOpsCostsARS += expCost;
        pastOpsRealizedProfitARS += (recRev - paidCost);
        pastOpsPendingCostsARS += pendingCost;
        pendingReceivablesARS += pendingRev;
      }
    }
  });

  // Calculate channel margins
  Object.values(channels).forEach(ch => {
    ch.margin = ch.expectedRevenue > 0 ? (ch.expectedProfit / ch.expectedRevenue) * 100 : 0;
  });

  // Calculate BU margins
  Object.keys(buMap).forEach(key => {
    const unit = buMap[key as keyof typeof buMap];
    unit.profit = unit.revenue - unit.costs;
    unit.margin = unit.revenue > 0 ? (unit.profit / unit.revenue) * 100 : 0;
  });

  // 3. Gastos fijos mensuales de estructura activos pendientes de pago
  const monthlyFixedARS = fixedExpenses
    .filter(f => f.status === 'activo' && !f.isPaidCurrentMonth && f.currency !== 'USD')
    .reduce((acc, f) => {
      if (f.frequency === 'mensual') return acc + f.amount;
      if (f.frequency === 'anual') return acc + (f.amount / 12);
      if (f.frequency === 'quincenal') return acc + (f.amount * 2);
      if (f.frequency === 'trimestral') return acc + (f.amount / 3);
      return acc + f.amount;
    }, 0);

  const monthlyFixedUSD = fixedExpenses
    .filter(f => f.status === 'activo' && !f.isPaidCurrentMonth && f.currency === 'USD')
    .reduce((acc, f) => acc + f.amount, 0);

  // 4. Obligaciones: compromisos financieros exigibles actualmente pendientes de pago (proveedores de viajes devengados + estructura mensual no pagada)
  const obligationsARS = pastOpsPendingCostsARS + monthlyFixedARS;
  const obligationsUSD = pastOpsPendingCostsUSD + monthlyFixedUSD;
  const obligationsEquivalentUSD = obligationsUSD + (obligationsARS / rate);

  const committedFundsARS = obligationsARS;
  const committedFundsUSD = obligationsUSD;
  const committedFundsEquivalentUSD = obligationsEquivalentUSD;

  // 5. Caja Libre Real:
  // FÓRMULA ESTRICTA: CAJA LIBRE REAL = DINERO EN CUENTAS - FONDOS VIAJES FUTUROS - OBLIGACIONES
  // Nunca superior a Dinero en Cuentas, nunca negativa.
  const freeCashARS = Math.min(cashARS, Math.max(0, cashARS - futureOpsCollectedARS - obligationsARS));
  const freeCashUSD = Math.min(cashUSD, Math.max(0, cashUSD - futureOpsCollectedUSD - obligationsUSD));
  const freeCashEquivalentUSD = freeCashUSD + (freeCashARS / rate);

  const availableCashARS = freeCashARS;
  const availableCashUSD = freeCashUSD;
  const availableCashEquivalentUSD = freeCashEquivalentUSD;

  const availableProfitARS = freeCashARS;
  const availableProfitUSD = freeCashUSD;
  const availableProfitEquivalentUSD = freeCashEquivalentUSD;

  // Margins
  const pastOpsMarginARS = pastOpsRevenueARS > 0 ? (pastOpsRealizedProfitARS / pastOpsRevenueARS) * 100 : 0;
  const pastOpsMarginUSD = pastOpsRevenueUSD > 0 ? (pastOpsRealizedProfitUSD / pastOpsRevenueUSD) * 100 : 0;
  const futureOpsProjectedMarginARS = futureOpsExpectedRevenueARS > 0 ? (futureOpsProjectedProfitARS / futureOpsExpectedRevenueARS) * 100 : 0;
  const futureOpsProjectedMarginUSD = futureOpsExpectedRevenueUSD > 0 ? (futureOpsProjectedProfitUSD / futureOpsExpectedRevenueUSD) * 100 : 0;

  return {
    cashARS,
    cashUSD,
    cashEquivalentUSD,

    futureOpsCollectedARS,
    futureOpsCollectedUSD,
    futureOpsCollectedEquivalentUSD: futureOpsCollectedUSD + (futureOpsCollectedARS / rate),

    obligationsARS,
    obligationsUSD,
    obligationsEquivalentUSD,

    futureOpsPendingCostsARS,
    futureOpsPendingCostsUSD,
    futureOpsPendingCostsEquivalentUSD: futureOpsPendingCostsUSD + (futureOpsPendingCostsARS / rate),

    pastOpsPendingCostsARS,
    pastOpsPendingCostsUSD,
    pastOpsPendingCostsEquivalentUSD: pastOpsPendingCostsUSD + (pastOpsPendingCostsARS / rate),

    monthlyFixedARS,
    monthlyFixedUSD,

    committedFundsARS,
    committedFundsUSD,
    committedFundsEquivalentUSD,

    availableCashARS,
    availableCashUSD,
    availableCashEquivalentUSD,
    freeCashARS,
    freeCashUSD,
    freeCashEquivalentUSD,
    availableProfitARS,
    availableProfitUSD,
    availableProfitEquivalentUSD,

    pastOpsRevenueARS,
    pastOpsRevenueUSD,
    pastOpsCostsARS,
    pastOpsCostsUSD,
    pastOpsRealizedProfitARS,
    pastOpsRealizedProfitUSD,
    pastOpsRealizedProfitEquivalentUSD: pastOpsRealizedProfitUSD + (pastOpsRealizedProfitARS / rate),
    pastOpsMarginARS,
    pastOpsMarginUSD,

    futureOpsExpectedRevenueARS,
    futureOpsExpectedRevenueUSD,
    futureOpsExpectedCostARS,
    futureOpsExpectedCostUSD,
    futureOpsProjectedProfitARS,
    futureOpsProjectedProfitUSD,
    futureOpsProjectedProfitEquivalentUSD: futureOpsProjectedProfitUSD + (futureOpsProjectedProfitARS / rate),
    futureOpsProjectedMarginARS,
    futureOpsProjectedMarginUSD,

    pendingReceivablesARS,
    pendingReceivablesUSD,
    pendingReceivablesEquivalentUSD: pendingReceivablesUSD + (pendingReceivablesARS / rate),

    byUnitAndChannel: channels,
    byBusinessUnit: buMap
  };
}

export function calculateKPIs(
  operations: Operation[],
  accounts: FinancialAccount[],
  fixedExpenses: FixedExpense[],
  movements: FinancialMovement[],
  rateConfig: ExchangeRateConfig = DEFAULT_EXCHANGE_RATE
): FinancialKPIs {
  const rate = rateConfig.usdToArsRate > 0 ? rateConfig.usdToArsRate : 1320;
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Current Cash in accounts separated
  let currentCashARS = 0;
  let currentCashUSD = 0;

  accounts.forEach(a => {
    const bal = a.currentBalance || 0;
    if (a.currency === 'USD') {
      currentCashUSD += bal;
    } else {
      currentCashARS += bal;
    }
  });

  const currentCashEquivalentUSD = currentCashUSD + (currentCashARS / rate);
  const currentCash = currentCashARS; // compat

  // 2. Active operations
  const activeOps = operations.filter(op => op.status !== 'cancelada');

  let totalExpectedRevenueARS = 0;
  let totalExpectedRevenueUSD = 0;
  let totalReceivedRevenueARS = 0;
  let totalReceivedRevenueUSD = 0;
  let totalPendingRevenueARS = 0;
  let totalPendingRevenueUSD = 0;

  let totalExpectedCostARS = 0;
  let totalExpectedCostUSD = 0;
  let totalPaidCostARS = 0;
  let totalPaidCostUSD = 0;
  let totalPendingCostARS = 0;
  let totalPendingCostUSD = 0;

  activeOps.forEach(op => {
    const isUSD = op.currency === 'USD' || op.businessUnit === 'receptivo';
    const expRev = op.expectedRevenue || 0;
    const recRev = op.receivedRevenue || 0;
    const expCost = op.expectedCost || 0;
    const paidCost = op.paidCost || 0;
    const pendRev = Math.max(0, expRev - recRev);
    const pendCost = Math.max(0, expCost - paidCost);

    if (isUSD) {
      totalExpectedRevenueUSD += expRev;
      totalReceivedRevenueUSD += recRev;
      totalPendingRevenueUSD += pendRev;
      totalExpectedCostUSD += expCost;
      totalPaidCostUSD += paidCost;
      totalPendingCostUSD += pendCost;
    } else {
      totalExpectedRevenueARS += expRev;
      totalReceivedRevenueARS += recRev;
      totalPendingRevenueARS += pendRev;
      totalExpectedCostARS += expCost;
      totalPaidCostARS += paidCost;
      totalPendingCostARS += pendCost;
    }
  });

  const totalExpectedProfitARS = totalExpectedRevenueARS - totalExpectedCostARS;
  const totalExpectedProfitUSD = totalExpectedRevenueUSD - totalExpectedCostUSD;
  const totalExpectedProfitEquivalentUSD = totalExpectedProfitUSD + (totalExpectedProfitARS / rate);

  const totalRealizedProfitARS = totalReceivedRevenueARS - totalPaidCostARS;
  const totalRealizedProfitUSD = totalReceivedRevenueUSD - totalPaidCostUSD;
  const totalRealizedProfitEquivalentUSD = totalRealizedProfitUSD + (totalRealizedProfitARS / rate);

  const expectedProfitMargin = (totalExpectedRevenueARS + totalExpectedRevenueUSD * rate) > 0
    ? (totalExpectedProfitEquivalentUSD / (totalExpectedRevenueUSD + totalExpectedRevenueARS / rate)) * 100
    : 0;

  // Monthly fixed expenses (active & unpaid this month)
  let monthlyFixedExpensesARS = 0;
  let monthlyFixedExpensesUSD = 0;

  fixedExpenses
    .filter(f => f.status === 'activo' && !f.isPaidCurrentMonth)
    .forEach(f => {
      let mAmount = f.amount;
      if (f.frequency === 'anual') mAmount = f.amount / 12;
      if (f.frequency === 'quincenal') mAmount = f.amount * 2;
      if (f.frequency === 'trimestral') mAmount = f.amount / 3;

      if (f.currency === 'USD') {
        monthlyFixedExpensesUSD += mAmount;
      } else {
        monthlyFixedExpensesARS += mAmount;
      }
    });

    // Future ops collected (in custody)
    let futureOpsCollectedARS = 0;
    let futureOpsCollectedUSD = 0;

    activeOps
      .filter(op => isFutureTrip(op, todayStr))
      .forEach(op => {
        const isUSD = op.currency === 'USD' || op.businessUnit === 'receptivo';
        if (isUSD) {
          futureOpsCollectedUSD += (op.receivedRevenue || 0);
        } else {
          futureOpsCollectedARS += (op.receivedRevenue || 0);
        }
      });

    const futureOpsCollectedEquivalentUSD = futureOpsCollectedUSD + (futureOpsCollectedARS / rate);

    // Separate future vs past pending costs
    let pastOpsPendingCostsARS = 0;
    let pastOpsPendingCostsUSD = 0;
    let futureOpsPendingCostsARS = 0;
    let futureOpsPendingCostsUSD = 0;

    activeOps.forEach(op => {
      const isFuture = isFutureTrip(op, todayStr);
      const isUSD = op.currency === 'USD' || op.businessUnit === 'receptivo';
      const pendingCost = Math.max(0, (op.expectedCost || 0) - (op.paidCost || 0));

      if (isFuture) {
        if (isUSD) futureOpsPendingCostsUSD += pendingCost;
        else futureOpsPendingCostsARS += pendingCost;
      } else {
        if (isUSD) pastOpsPendingCostsUSD += pendingCost;
        else pastOpsPendingCostsARS += pendingCost;
      }
    });

    // Obligaciones (Compromisos pendientes exigibles: proveedores devengados + estructura mensual activa no pagada)
    const obligationsARS = pastOpsPendingCostsARS + monthlyFixedExpensesARS;
    const obligationsUSD = pastOpsPendingCostsUSD + monthlyFixedExpensesUSD;
    const obligationsEquivalentUSD = obligationsUSD + (obligationsARS / rate);

    const committedCashARS = obligationsARS;
    const committedCashUSD = obligationsUSD;
    const committedCashEquivalentUSD = obligationsEquivalentUSD;
    const committedCash = committedCashARS;

    // Caja Libre Real: DINERO EN CUENTAS - FONDOS VIAJES FUTUROS - OBLIGACIONES
    const freeCashARS = Math.min(currentCashARS, Math.max(0, currentCashARS - futureOpsCollectedARS - obligationsARS));
    const freeCashUSD = Math.min(currentCashUSD, Math.max(0, currentCashUSD - futureOpsCollectedUSD - obligationsUSD));
    const freeCashEquivalentUSD = freeCashUSD + (freeCashARS / rate);

    const availableCashARS = freeCashARS;
    const availableCashUSD = freeCashUSD;
    const availableCashEquivalentUSD = freeCashEquivalentUSD;

    const projectedCash = currentCashARS + totalPendingRevenueARS - totalPendingCostARS;
    const projectedFreeCash = freeCashARS;

  // Counts & alerts
  const activeOperationsCount = activeOps.length;
  const futureOperationsCount = activeOps.filter(op => isFutureTrip(op, todayStr)).length;
  const pastOperationsCount = activeOps.filter(op => !isFutureTrip(op, todayStr)).length;

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
    currentCashARS,
    currentCashUSD,
    currentCashEquivalentUSD,
    currentCash,

    projectedCash,
    pendingReceivablesARS: totalPendingRevenueARS,
    pendingReceivablesUSD: totalPendingRevenueUSD,
    pendingReceivables: totalPendingRevenueARS,
    pendingSupplierPayablesARS: totalPendingCostARS,
    pendingSupplierPayablesUSD: totalPendingCostUSD,
    pendingSupplierPayables: totalPendingCostARS,
    monthlyFixedExpensesARS,
    monthlyFixedExpensesUSD,
    monthlyFixedExpenses: monthlyFixedExpensesARS,
    obligationsARS,
    obligationsUSD,
    obligationsEquivalentUSD,
    committedCashARS,
    committedCashUSD,
    committedCashEquivalentUSD,
    committedCash,
    freeCashARS,
    freeCashUSD,
    freeCashEquivalentUSD,
    availableCashARS,
    availableCashUSD,
    availableCashEquivalentUSD,
    projectedFreeCash,
    futureOpsCollectedARS,
    futureOpsCollectedUSD,
    futureOpsCollectedEquivalentUSD,

    totalExpectedRevenueARS,
    totalExpectedRevenueUSD,
    totalExpectedRevenue: totalExpectedRevenueARS,
    totalReceivedRevenueARS,
    totalReceivedRevenueUSD,
    totalReceivedRevenue: totalReceivedRevenueARS,
    totalPendingRevenueARS,
    totalPendingRevenueUSD,
    totalPendingRevenue: totalPendingRevenueARS,

    totalExpectedCostARS,
    totalExpectedCostUSD,
    totalExpectedCost: totalExpectedCostARS,
    totalPaidCostARS,
    totalPaidCostUSD,
    totalPaidCost: totalPaidCostARS,
    totalPendingCostARS,
    totalPendingCostUSD,
    totalPendingCost: totalPendingCostARS,

    totalExpectedProfitARS,
    totalExpectedProfitUSD,
    totalExpectedProfitEquivalentUSD,
    totalExpectedProfit: totalExpectedProfitARS,
    totalRealizedProfitARS,
    totalRealizedProfitUSD,
    totalRealizedProfitEquivalentUSD,
    totalRealizedProfit: totalRealizedProfitARS,
    totalPendingProfit: totalExpectedProfitARS - totalRealizedProfitARS,
    expectedProfitMargin,

    activeOperationsCount,
    futureOperationsCount,
    pastOperationsCount,
    unreconciledMovementsCount,
    unreconciledAmount,
    pendingStudentsDebtCount,
    pendingStudentsDebtAmount
  };
}

/**
 * Generates monthly cash evolution purely from REAL data:
 * - Real historical closings / actual movements for past months.
 * - Real scheduled operations and fixed expenses for future months.
 * ZERO hardcoded filler values.
 */
/**
 * Generates monthly cash evolution purely from REAL data:
 * - Real historical closings / actual movements for past months.
 * - Real scheduled operations and fixed expenses for future months.
 * - Separates ARS and USD flows cleanly.
 * ZERO hardcoded filler values.
 */
export function generateMonthlyCashProjection(
  currentCashARS: number,
  currentCashUSD: number = 0,
  operations: Operation[],
  fixedExpenses: FixedExpense[],
  historicalPeriods: HistoricalPeriod[],
  monthlyClosings: MonthlyClosing[],
  movements: FinancialMovement[] = []
): MonthlyCashEvolution[] {
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const result: MonthlyCashEvolution[] = [];
  const monthlyFixedCostARS = fixedExpenses
    .filter(f => f.status === 'activo' && f.currency !== 'USD')
    .reduce((acc, f) => {
      if (f.frequency === 'mensual') return acc + f.amount;
      if (f.frequency === 'anual') return acc + (f.amount / 12);
      if (f.frequency === 'quincenal') return acc + (f.amount * 2);
      if (f.frequency === 'trimestral') return acc + (f.amount / 3);
      return acc + f.amount;
    }, 0);

  const monthlyFixedCostUSD = fixedExpenses
    .filter(f => f.status === 'activo' && f.currency === 'USD')
    .reduce((acc, f) => {
      if (f.frequency === 'mensual') return acc + f.amount;
      if (f.frequency === 'anual') return acc + (f.amount / 12);
      if (f.frequency === 'quincenal') return acc + (f.amount * 2);
      if (f.frequency === 'trimestral') return acc + (f.amount / 3);
      return acc + f.amount;
    }, 0);

  // 1. Past months (real data from monthly closings or movements)
  const pastMonths = ['2026-06', '2026-07', '2026-08'];
  let currentRunningARS = currentCashARS;
  let currentRunningUSD = currentCashUSD;

  // If closings exist, use them
  pastMonths.forEach(ym => {
    const [year, month] = ym.split('-');
    const mIdx = parseInt(month, 10) - 1;
    const label = `${monthNames[mIdx]} ${year}`;

    const closing = monthlyClosings.find(c => c.yearMonth === ym);
    const monthMovsARS = movements.filter(m => m.date && m.date.startsWith(ym) && !m.isInternalTransfer && m.currency !== 'USD');
    const monthMovsUSD = movements.filter(m => m.date && m.date.startsWith(ym) && !m.isInternalTransfer && m.currency === 'USD');

    let incARS = 0;
    let expARS = 0;
    let finalCashARS = 0;

    let incUSD = 0;
    let expUSD = 0;
    let finalCashUSD = 0;

    if (closing) {
      incARS = closing.totalIncome;
      expARS = closing.totalExpense;
      finalCashARS = closing.calculatedFinalCash;
    } else if (monthMovsARS.length > 0) {
      incARS = monthMovsARS.filter(m => m.type === 'ingreso').reduce((sum, m) => sum + m.amount, 0);
      expARS = monthMovsARS.filter(m => m.type === 'egreso').reduce((sum, m) => sum + m.amount, 0);
      finalCashARS = currentRunningARS;
    } else {
      const opsInMonthARS = operations.filter(o => o.date && o.date.startsWith(ym) && o.status !== 'cancelada' && o.currency !== 'USD');
      incARS = opsInMonthARS.reduce((s, o) => s + (o.receivedRevenue || 0), 0);
      expARS = opsInMonthARS.reduce((s, o) => s + (o.paidCost || 0), 0) + monthlyFixedCostARS;
      finalCashARS = currentRunningARS;
    }

    if (monthMovsUSD.length > 0) {
      incUSD = monthMovsUSD.filter(m => m.type === 'ingreso').reduce((sum, m) => sum + m.amount, 0);
      expUSD = monthMovsUSD.filter(m => m.type === 'egreso').reduce((sum, m) => sum + m.amount, 0);
      finalCashUSD = currentRunningUSD;
    } else {
      const opsInMonthUSD = operations.filter(o => o.date && o.date.startsWith(ym) && o.status !== 'cancelada' && (o.currency === 'USD' || o.businessUnit === 'receptivo'));
      incUSD = opsInMonthUSD.reduce((s, o) => s + (o.receivedRevenue || 0), 0);
      expUSD = opsInMonthUSD.reduce((s, o) => s + (o.paidCost || 0), 0) + monthlyFixedCostUSD;
      finalCashUSD = currentRunningUSD;
    }

    const initARS = Math.max(0, finalCashARS - incARS + expARS);
    const initUSD = Math.max(0, finalCashUSD - incUSD + expUSD);

    result.push({
      monthKey: ym,
      monthLabel: label,
      initialCashARS: initARS,
      projectedIncomeARS: incARS,
      projectedSupplierPaymentsARS: Math.max(0, expARS - monthlyFixedCostARS),
      projectedFixedExpensesARS: monthlyFixedCostARS,
      finalProjectedCashARS: finalCashARS,
      netMonthlyCashFlowARS: incARS - expARS,

      initialCashUSD: initUSD,
      projectedIncomeUSD: incUSD,
      projectedSupplierPaymentsUSD: Math.max(0, expUSD - monthlyFixedCostUSD),
      projectedFixedExpensesUSD: monthlyFixedCostUSD,
      finalProjectedCashUSD: finalCashUSD,
      netMonthlyCashFlowUSD: incUSD - expUSD,

      // Compatibility aliases
      initialCash: initARS,
      projectedIncome: incARS,
      projectedSupplierPayments: Math.max(0, expARS - monthlyFixedCostARS),
      projectedFixedExpenses: monthlyFixedCostARS,
      finalProjectedCash: finalCashARS,
      netMonthlyCashFlow: incARS - expARS,

      isProjected: false
    });
  });

  // 2. Future months (Sep 2026, Oct 2026, Nov 2026, Dec 2026) derived from real scheduled operations
  const futureMonths = ['2026-09', '2026-10', '2026-11', '2026-12'];
  let simCashARS = currentCashARS;
  let simCashUSD = currentCashUSD;

  futureMonths.forEach(ym => {
    const [year, month] = ym.split('-');
    const mIdx = parseInt(month, 10) - 1;
    const label = `${monthNames[mIdx]} ${year} (Proy.)`;

    let monthIncomeARS = 0;
    let monthSupplierCostsARS = 0;

    let monthIncomeUSD = 0;
    let monthSupplierCostsUSD = 0;

    operations.forEach(op => {
      if (op.status !== 'cancelada') {
        const isUSD = op.currency === 'USD' || op.businessUnit === 'receptivo';
        if (op.date && op.date.startsWith(ym)) {
          const pendingRev = Math.max(0, op.expectedRevenue - op.receivedRevenue);
          const pendingCost = Math.max(0, op.expectedCost - op.paidCost);
          if (isUSD) {
            monthIncomeUSD += pendingRev;
            monthSupplierCostsUSD += pendingCost;
          } else {
            monthIncomeARS += pendingRev;
            monthSupplierCostsARS += pendingCost;
          }
        }
      }
    });

    const initARS = simCashARS;
    const finalCashARS = initARS + monthIncomeARS - monthSupplierCostsARS - monthlyFixedCostARS;
    simCashARS = finalCashARS;

    const initUSD = simCashUSD;
    const finalCashUSD = initUSD + monthIncomeUSD - monthSupplierCostsUSD - monthlyFixedCostUSD;
    simCashUSD = finalCashUSD;

    result.push({
      monthKey: ym,
      monthLabel: label,
      initialCashARS: initARS,
      projectedIncomeARS: monthIncomeARS,
      projectedSupplierPaymentsARS: monthSupplierCostsARS,
      projectedFixedExpensesARS: monthlyFixedCostARS,
      finalProjectedCashARS: finalCashARS,
      netMonthlyCashFlowARS: monthIncomeARS - monthSupplierCostsARS - monthlyFixedCostARS,

      initialCashUSD: initUSD,
      projectedIncomeUSD: monthIncomeUSD,
      projectedSupplierPaymentsUSD: monthSupplierCostsUSD,
      projectedFixedExpensesUSD: monthlyFixedCostUSD,
      finalProjectedCashUSD: finalCashUSD,
      netMonthlyCashFlowUSD: monthIncomeUSD - monthSupplierCostsUSD - monthlyFixedCostUSD,

      // Compatibility aliases
      initialCash: initARS,
      projectedIncome: monthIncomeARS,
      projectedSupplierPayments: monthSupplierCostsARS,
      projectedFixedExpenses: monthlyFixedCostARS,
      finalProjectedCash: finalCashARS,
      netMonthlyCashFlow: monthIncomeARS - monthSupplierCostsARS - monthlyFixedCostARS,

      isProjected: true
    });
  });

  return result;
}
