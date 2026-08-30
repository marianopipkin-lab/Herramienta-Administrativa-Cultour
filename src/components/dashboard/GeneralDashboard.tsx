import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Calendar,
  Layers,
  Scale,
  CreditCard,
  Building2,
  Users,
  Compass,
  ArrowRight,
  Info,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatPercent } from '../../utils/financialCalculations';

export const GeneralDashboard: React.FC = () => {
  const {
    kpis,
    financialPosition,
    monthlyProjection,
    operations,
    fixedExpenses,
    accounts,
    setActiveTab,
    setSelectedOperationId,
    cutoffConfig
  } = useApp();

  const [viewMode, setViewMode] = useState<'fotografia' | 'evolucion'>('fotografia');

  // Business units breakdown
  const buStats = {
    receptivo: {
      name: 'Turismo Receptivo',
      color: 'text-cyan-700',
      bg: 'bg-cyan-50/60 border-cyan-200',
      expectedRev: 0,
      receivedRev: 0,
      expectedCost: 0,
      paidCost: 0,
      count: 0
    },
    salidas: {
      name: 'Salidas Educativas',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50/60 border-emerald-200',
      expectedRev: 0,
      receivedRev: 0,
      expectedCost: 0,
      paidCost: 0,
      count: 0
    },
    viajes: {
      name: 'Viajes Educativos',
      color: 'text-indigo-700',
      bg: 'bg-indigo-50/60 border-indigo-200',
      expectedRev: 0,
      receivedRev: 0,
      expectedCost: 0,
      paidCost: 0,
      count: 0
    }
  };

  operations.forEach(op => {
    if (op.status !== 'cancelada' && buStats[op.businessUnit]) {
      buStats[op.businessUnit].expectedRev += op.expectedRevenue || 0;
      buStats[op.businessUnit].receivedRev += op.receivedRevenue || 0;
      buStats[op.businessUnit].expectedCost += op.expectedCost || 0;
      buStats[op.businessUnit].paidCost += op.paidCost || 0;
      buStats[op.businessUnit].count += 1;
    }
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <span>Dashboard Ejecutivo & Posición Financiera</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Posición unificada de caja, operaciones comprometidas y resultado económico proyectado.
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl border border-gray-200 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('fotografia')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'fotografia'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Fotografía Actual
          </button>
          <button
            onClick={() => setViewMode('evolucion')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'evolucion'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Evolución Mensual
          </button>
        </div>
      </div>

      {/* ========================================================
          POSICIÓN FINANCIERA & GANANCIA DISPONIBLE (SOCIOS)
      ======================================================== */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-gray-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold uppercase tracking-wider">
                Auditoría Ejecutiva de Socios
              </span>
              <h2 className="text-sm font-bold text-gray-900">
                Posición Financiera: Saldo de Cuentas vs. Ganancia Disponible
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Desglose estricto: el saldo de cuentas incluye anticipos de viajes futuros que no deben confundirse con ganancia disponible.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-gray-400">Tipo de cambio referencial:</span>
            <span className="font-mono text-xs font-bold text-gray-800 ml-1.5">$1.320 / USD</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          
          {/* Box 1: Dinero en Cuentas */}
          <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center justify-between">
              <span>1. Dinero en Cuentas</span>
              <Wallet className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-gray-500">En Pesos (ARS):</span>
                <span className="font-mono text-xs font-bold text-gray-900">{formatCurrency(financialPosition.cashARS, 'ARS')}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-gray-500">En Dólares (USD):</span>
                <span className="font-mono text-xs font-bold text-cyan-800">{formatCurrency(financialPosition.cashUSD, 'USD')}</span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between items-baseline">
                <span className="text-[11px] font-semibold text-gray-700">Total Equiv.:</span>
                <span className="font-mono text-xs font-bold text-indigo-700">{formatCurrency(financialPosition.cashEquivalentUSD, 'USD')}</span>
              </div>
            </div>
          </div>

          {/* Box 2: Cobros de Operaciones Futuras */}
          <div className="bg-blue-50/40 rounded-xl p-4 border border-blue-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-800 flex items-center justify-between">
              <span>2. Fondos en Custodia (Futuros)</span>
              <Clock className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-blue-950/70">Cobrado ARS:</span>
                <span className="font-mono text-xs font-semibold text-blue-900">{formatCurrency(financialPosition.futureOpsCollectedARS, 'ARS')}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-blue-950/70">Cobrado USD:</span>
                <span className="font-mono text-xs font-semibold text-cyan-800">{formatCurrency(financialPosition.futureOpsCollectedUSD, 'USD')}</span>
              </div>
              <div className="pt-2 border-t border-blue-100 flex justify-between items-baseline">
                <span className="text-[11px] font-semibold text-blue-900">Total Anticipos:</span>
                <span className="font-mono text-xs font-bold text-blue-950">{formatCurrency(financialPosition.futureOpsCollectedEquivalentUSD, 'USD')}</span>
              </div>
            </div>
          </div>

          {/* Box 3: Dinero Comprometido */}
          <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-200">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center justify-between">
              <span>3. Dinero Comprometido</span>
              <ArrowDownRight className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-amber-900/70">Costos Pendientes ARS:</span>
                <span className="font-mono text-xs font-semibold text-amber-900">-{formatCurrency(financialPosition.committedFundsARS, 'ARS')}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-amber-900/70">Costos Pendientes USD:</span>
                <span className="font-mono text-xs font-semibold text-amber-900">-{formatCurrency(financialPosition.committedFundsUSD, 'USD')}</span>
              </div>
              <div className="pt-2 border-t border-amber-200 flex justify-between items-baseline">
                <span className="text-[11px] font-semibold text-amber-900">Total Comprometido:</span>
                <span className="font-mono text-xs font-bold text-amber-950">-{formatCurrency(financialPosition.committedFundsEquivalentUSD, 'USD')}</span>
              </div>
            </div>
          </div>

          {/* Box 4: Ganancia Disponible Real */}
          <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-300">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center justify-between">
              <span>4. Ganancia Disponible Real</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-emerald-900/70">Disponible ARS:</span>
                <span className="font-mono text-xs font-bold text-emerald-900">{formatCurrency(financialPosition.availableProfitARS, 'ARS')}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-emerald-900/70">Disponible USD:</span>
                <span className="font-mono text-xs font-bold text-emerald-900">{formatCurrency(financialPosition.availableProfitUSD, 'USD')}</span>
              </div>
              <div className="pt-2 border-t border-emerald-200 flex justify-between items-baseline">
                <span className="text-[11px] font-bold text-emerald-900">Total Retiro/Inversión:</span>
                <span className="font-mono text-xs font-black text-emerald-900">{formatCurrency(financialPosition.availableProfitEquivalentUSD, 'USD')}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Sub-strip for Realized vs Projected Profit */}
        <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="flex items-center justify-between bg-gray-50 px-3.5 py-2.5 rounded-lg border border-gray-200">
            <span className="text-gray-600">
              <strong className="text-gray-900">Operaciones ya realizadas:</strong> Ganancia devengada real
            </span>
            <span className="font-mono font-bold text-emerald-700">
              {formatCurrency(financialPosition.pastOpsRealizedProfitARS, 'ARS')} / {formatCurrency(financialPosition.pastOpsRealizedProfitUSD, 'USD')}
            </span>
          </div>

          <div className="flex items-center justify-between bg-gray-50 px-3.5 py-2.5 rounded-lg border border-gray-200">
            <span className="text-gray-600">
              <strong className="text-gray-900">Operaciones futuras:</strong> Resultado proyectado
            </span>
            <span className="font-mono font-bold text-indigo-700">
              {formatCurrency(financialPosition.futureOpsProjectedProfitARS, 'ARS')} / {formatCurrency(financialPosition.futureOpsProjectedProfitUSD, 'USD')}
            </span>
          </div>
        </div>

      </div>

      {/* ========================================================
          1. CAJA / TENENCIA (SECTION 3 PROMPT MANDATE)
      ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Tenencia Actual */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tenencia Actual</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900 font-mono tracking-tight">
              {formatCurrency(kpis.currentCash)}
            </div>
            <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
              <span>Total en 6 cuentas (MP, Bancos, Efectivo)</span>
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px]">
            <span className="text-gray-500">Santander + Galicia:</span>
            <span className="text-gray-800 font-mono font-medium">
              {formatCurrency((accounts.find(a => a.id === 'banco_santander')?.currentBalance || 0) + (accounts.find(a => a.id === 'banco_galicia')?.currentBalance || 0))}
            </span>
          </div>
        </div>

        {/* Card 2: Cobros Pendientes */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Cobros Pendientes</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-700 font-mono tracking-tight">
              +{formatCurrency(kpis.pendingReceivables)}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Operaciones confirmadas y cuotas escolares
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px]">
            <span className="text-gray-500">Recaudación Cobrada:</span>
            <span className="text-emerald-700 font-mono font-semibold">{formatCurrency(kpis.totalReceivedRevenue)}</span>
          </div>
        </div>

        {/* Card 3: Caja Comprometida */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Caja Comprometida</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-700 font-mono tracking-tight">
              -{formatCurrency(kpis.committedCash)}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Proveedores pendientes + Gastos fijos
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px]">
            <span className="text-gray-500">Proveedores a pagar:</span>
            <span className="text-amber-700 font-mono font-semibold">{formatCurrency(kpis.pendingSupplierPayables)}</span>
          </div>
        </div>

        {/* Card 4: Caja Libre Proyectada (Key Metric) */}
        <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-5 relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Caja Libre Proyectada</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-800 font-mono tracking-tight">
              {formatCurrency(kpis.projectedFreeCash)}
            </div>
            <p className="text-[11px] text-emerald-700 mt-1">
              Caja neta disponible tras saldar compromisos
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-emerald-200 flex items-center justify-between text-[11px]">
            <span className="text-emerald-700">Tenencia Proyectada:</span>
            <span className="text-emerald-900 font-mono font-bold">{formatCurrency(kpis.projectedCash)}</span>
          </div>
        </div>

      </div>

      {/* ========================================================
          2. GANANCIA VS CAJA (SECTION 4 PROMPT MANDATE)
      ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ganancia vs Caja explainer card */}
        <div className="lg:col-span-1 bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-600" />
                <span>Principio: Ganancia vs Caja</span>
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold">
                Regla Central
              </span>
            </div>

            <p className="text-xs text-gray-600 mt-3 leading-relaxed">
              <strong className="text-gray-900">Caja</strong> es el dinero real disponible hoy en cuentas bancarias y Mercado Pago.
              <br /><br />
              <strong className="text-gray-900">Ganancia</strong> es el resultado económico devengado por las operaciones (Ventas menos Costos asociados).
            </p>

            <div className="mt-4 space-y-2.5 text-xs bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Ingresos Totales Esperados:</span>
                <span className="font-semibold text-gray-900 font-mono">{formatCurrency(kpis.totalExpectedRevenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Costos Totales Esperados:</span>
                <span className="font-semibold text-rose-600 font-mono">-{formatCurrency(kpis.totalExpectedCost)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between items-center font-bold">
                <span className="text-indigo-700">Ganancia Esperada:</span>
                <span className="text-emerald-700 font-mono">{formatCurrency(kpis.totalExpectedProfit)}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-gray-500">
                <span>Margen Operativo Promedio:</span>
                <span className="text-emerald-700 font-mono font-semibold">{formatPercent(kpis.expectedProfitMargin)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 space-y-2 text-xs">
            <div className="flex justify-between text-gray-700">
              <span>Ganancia Realizada a la fecha:</span>
              <span className="font-mono text-emerald-700 font-semibold">{formatCurrency(kpis.totalRealizedProfit)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Resultado Pendiente de cobro/pago:</span>
              <span className="font-mono text-amber-700 font-semibold">{formatCurrency(kpis.totalPendingProfit)}</span>
            </div>
          </div>
        </div>

        {/* Business Units Performance Cards */}
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Rendimiento por Unidad de Negocio</span>
              </h3>
              <button
                onClick={() => setActiveTab('operations')}
                className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-semibold"
              >
                <span>Ver Master Operaciones</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              {Object.entries(buStats).map(([key, stat]) => {
                const profit = stat.expectedRev - stat.expectedCost;
                const margin = stat.expectedRev > 0 ? (profit / stat.expectedRev) * 100 : 0;
                const cobradoPercent = stat.expectedRev > 0 ? (stat.receivedRev / stat.expectedRev) * 100 : 0;

                return (
                  <div key={key} className={`rounded-xl p-3.5 border ${stat.bg} flex flex-col justify-between shadow-2xs`}>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${stat.color}`}>{stat.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-white text-gray-700 font-mono border border-gray-200 font-medium">
                          {stat.count} ops
                        </span>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs">
                        <div className="flex justify-between text-gray-700">
                          <span className="text-[11px] text-gray-500">Ventas:</span>
                          <span className="font-mono font-semibold">{formatCurrency(stat.expectedRev)}</span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                          <span className="text-[11px] text-gray-500">Costos:</span>
                          <span className="font-mono text-gray-600">{formatCurrency(stat.expectedCost)}</span>
                        </div>
                        <div className="flex justify-between text-emerald-700 font-bold pt-1.5 border-t border-gray-200/60">
                          <span className="text-[11px]">Ganancia:</span>
                          <span className="font-mono">{formatCurrency(profit)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-gray-200/60">
                      <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                        <span>Cobrado ({formatPercent(cobradoPercent)})</span>
                        <span className="font-mono text-gray-800 font-medium">{formatCurrency(stat.receivedRev)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all"
                          style={{ width: `${Math.min(100, cobradoPercent)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Action bar */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 text-gray-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Gastos fijos estructura: <strong className="text-gray-900 font-mono">{formatCurrency(kpis.monthlyFixedExpenses)}/mes</strong></span>
              </span>
            </div>
            <button
              onClick={() => setActiveTab('fixed_expenses')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Ver detalle de gastos fijos →
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================
          3. EVOLUCIÓN MENSUAL DE CAJA (TABLE & CHART)
      ======================================================== */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Evolución Mensual & Proyección de Caja</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Caja inicial, cobros operativos, pagos a proveedores, gastos fijos y caja final proyectada mes a mes.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('projection')}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Ver Análisis Completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Recharts Monthly Projection Chart */}
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyProjection}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="monthLabel" stroke="#6B7280" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#6B7280"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E5E7EB',
                  color: '#111827',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                formatter={(value: any) => formatCurrency(Number(value))}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="projectedIncome" name="Cobros / Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="projectedSupplierPayments" name="Pagos Proveedores" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="projectedFixedExpenses" name="Gastos Fijos" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="finalProjectedCash" name="Caja Final Proyectada" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Mandatory Monthly Table from Section 3 Prompt */}
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 text-[10px]">
              <tr>
                <th className="py-3 px-4">Mes</th>
                <th className="py-3 px-4 text-right">Caja Inicial</th>
                <th className="py-3 px-4 text-right text-emerald-700">Cobros</th>
                <th className="py-3 px-4 text-right text-amber-700">Pagos Proveedores</th>
                <th className="py-3 px-4 text-right text-rose-700">Gastos Fijos</th>
                <th className="py-3 px-4 text-right text-indigo-700 font-bold">Caja Final Proyectada</th>
                <th className="py-3 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {monthlyProjection.map((row) => (
                <tr key={row.monthKey} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3 px-4 font-sans font-medium text-gray-900">
                    {row.monthLabel}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700">
                    {formatCurrency(row.initialCash)}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-700 font-semibold">
                    +{formatCurrency(row.projectedIncome)}
                  </td>
                  <td className="py-3 px-4 text-right text-amber-700 font-semibold">
                    -{formatCurrency(row.projectedSupplierPayments)}
                  </td>
                  <td className="py-3 px-4 text-right text-rose-700 font-semibold">
                    -{formatCurrency(row.projectedFixedExpenses)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-indigo-700">
                    {formatCurrency(row.finalProjectedCash)}
                  </td>
                  <td className="py-3 px-4 text-center font-sans">
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${
                      row.isProjected
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}>
                      {row.isProjected ? 'Proyectado' : 'Real / Cerrado'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================
          4. ALERTAS OPERATIVAS & FINANCIERAS (SECTION 18 MANDATE)
      ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Unreconciled Movements & Differences Alert */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-600" />
              <span>Conciliación & Movimientos Pendientes</span>
            </h4>
            <span className="text-xs text-amber-700 font-mono font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
              {kpis.unreconciledMovementsCount} alertas
            </span>
          </div>

          <div className="space-y-2">
            <div
              onClick={() => setActiveTab('reconciliation')}
              className="p-3 rounded-xl bg-gray-50 border border-gray-200 hover:border-gray-300 hover:bg-gray-100/70 cursor-pointer transition-all flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <div>
                  <span className="font-semibold text-gray-800">Movimientos sin clasificar (Rojo)</span>
                  <p className="text-[11px] text-gray-500">Extractos bancarios/MP sin vincular a operación o proveedor</p>
                </div>
              </div>
              <span className="text-rose-600 font-mono font-bold">{formatCurrency(kpis.unreconciledAmount)}</span>
            </div>

            <div
              onClick={() => setActiveTab('closing')}
              className="p-3 rounded-xl bg-gray-50 border border-gray-200 hover:border-gray-300 hover:bg-gray-100/70 cursor-pointer transition-all flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <div>
                  <span className="font-semibold text-gray-800">Cierre Agosto 2026 en revisión</span>
                  <p className="text-[11px] text-gray-500">Fecha de corte 31/08 - Validar control de saldos</p>
                </div>
              </div>
              <span className="text-indigo-600 font-mono font-bold">Ver Auditoría →</span>
            </div>
          </div>
        </div>

        {/* Student Debt & Supplier Payables Alert */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Deudores & Compromisos de Proveedores</span>
            </h4>
            <span className="text-xs text-rose-700 font-mono font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
              {kpis.pendingStudentsDebtCount} alumnos
            </span>
          </div>

          <div className="space-y-2">
            <div
              onClick={() => setActiveTab('students')}
              className="p-3 rounded-xl bg-gray-50 border border-gray-200 hover:border-gray-300 hover:bg-gray-100/70 cursor-pointer transition-all flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <div>
                  <span className="font-semibold text-gray-800">Alumnos con cuotas pendientes</span>
                  <p className="text-[11px] text-gray-500">Viaje Egresados Tandil Col. San Andrés (2 con saldo)</p>
                </div>
              </div>
              <span className="text-rose-600 font-mono font-bold">{formatCurrency(kpis.pendingStudentsDebtAmount)}</span>
            </div>

            <div
              onClick={() => setActiveTab('operations')}
              className="p-3 rounded-xl bg-gray-50 border border-gray-200 hover:border-gray-300 hover:bg-gray-100/70 cursor-pointer transition-all flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <div>
                  <span className="font-semibold text-gray-800">Saldos a pagar a proveedores</span>
                  <p className="text-[11px] text-gray-500">Micros, hoteles y seguros de operaciones próximas</p>
                </div>
              </div>
              <span className="text-amber-700 font-mono font-bold">{formatCurrency(kpis.pendingSupplierPayables)}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
