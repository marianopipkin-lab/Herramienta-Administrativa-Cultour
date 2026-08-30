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
      
      {/* Header Bar matching Design HTML */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#a5b4fc] mb-1">
            Auditoría Ejecutiva de Socios
          </div>
          <h1 className="font-syne font-extrabold text-3xl sm:text-4xl text-white tracking-tight leading-none uppercase">
            DASHBOARD<br />POSICIÓN FINANCIERA
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-[#18181a] p-1 rounded-md border border-white/10">
            <button
              onClick={() => setViewMode('fotografia')}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                viewMode === 'fotografia'
                  ? 'bg-[#a5b4fc] text-[#111113]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Fotografía
            </button>
            <button
              onClick={() => setViewMode('evolucion')}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                viewMode === 'evolucion'
                  ? 'bg-[#a5b4fc] text-[#111113]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Evolución
            </button>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">
              Corte: <span className="text-[#34d399] font-bold">{cutoffConfig.cutoffDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          AUDIT PANEL (SOCIOS) - MATCHING DESIGN VARIATION
      ======================================================== */}
      <div className="bg-[#222224] border border-[#a5b4fc]/30 rounded-lg p-6 shadow-[0_0_40px_rgba(165,180,252,0.08)]">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between pb-4 border-b border-white/10 gap-2">
          <div>
            <h2 className="font-syne font-extrabold text-xl text-white tracking-tight uppercase">
              AUDITORÍA DE CAJA VS DISPONIBLE
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
              Desglose estricto: el saldo de cuentas incluye anticipos de viajes futuros que no deben confundirse con ganancia disponible.
            </p>
          </div>
          <div className="font-mono text-xs text-zinc-300 bg-[#18181a] px-3 py-1.5 rounded border border-white/10 self-start md:self-auto">
            REF: <span className="text-white font-bold">$1.320 / USD</span>
          </div>
        </div>

        {/* Stat Grid with colored left borders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          
          {/* Stat 1: Dinero en Cuentas */}
          <div className="border-l-2 border-white/30 pl-4 py-1">
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 flex items-center justify-between">
              <span>1. Dinero en Cuentas</span>
              <Wallet className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1.5">
              {formatCurrency(financialPosition.cashARS, 'ARS')}
            </div>
            <div className="text-[10px] font-mono text-zinc-400 mt-1">
              USD {financialPosition.cashUSD.toLocaleString('es-AR')} ({formatCurrency(financialPosition.cashEquivalentUSD, 'USD')} equiv.)
            </div>
          </div>

          {/* Stat 2: Fondos Custodia */}
          <div className="border-l-2 border-[#a5b4fc] pl-4 py-1">
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#a5b4fc] flex items-center justify-between">
              <span>2. Fondos Custodia</span>
              <Clock className="w-3.5 h-3.5 text-[#a5b4fc]" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#a5b4fc] mt-1.5">
              {formatCurrency(financialPosition.futureOpsCollectedARS, 'ARS')}
            </div>
            <div className="text-[10px] font-mono text-[#a5b4fc]/80 mt-1">
              {formatCurrency(financialPosition.futureOpsCollectedEquivalentUSD, 'USD')} (Antic. Futuros)
            </div>
          </div>

          {/* Stat 3: Comprometido */}
          <div className="border-l-2 border-[#fbbf24] pl-4 py-1">
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#fbbf24] flex items-center justify-between">
              <span>3. Comprometido</span>
              <ArrowDownRight className="w-3.5 h-3.5 text-[#fbbf24]" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#fbbf24] mt-1.5">
              -{formatCurrency(financialPosition.committedFundsARS, 'ARS')}
            </div>
            <div className="text-[10px] font-mono text-[#fbbf24]/80 mt-1">
              Costos Pendientes ({formatCurrency(financialPosition.committedFundsEquivalentUSD, 'USD')})
            </div>
          </div>

          {/* Stat 4: Ganancia Real */}
          <div className="border-l-2 border-[#34d399] pl-4 py-1">
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#34d399] flex items-center justify-between">
              <span>4. Ganancia Real</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399]" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#34d399] mt-1.5">
              {formatCurrency(financialPosition.availableProfitEquivalentUSD, 'USD')}
            </div>
            <div className="text-[10px] font-mono text-[#34d399]/80 mt-1">
              Retiro/Inversión ({formatCurrency(financialPosition.availableProfitARS, 'ARS')})
            </div>
          </div>

        </div>

        {/* Sub-strip for Realized vs Projected Profit */}
        <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center justify-between bg-[#18181a] px-4 py-2.5 rounded border border-white/10">
            <span className="text-zinc-300">
              <strong className="text-white">Operaciones ya realizadas:</strong> Ganancia devengada real
            </span>
            <span className="font-mono font-bold text-[#34d399]">
              {formatCurrency(financialPosition.pastOpsRealizedProfitARS, 'ARS')} / {formatCurrency(financialPosition.pastOpsRealizedProfitUSD, 'USD')}
            </span>
          </div>

          <div className="flex items-center justify-between bg-[#18181a] px-4 py-2.5 rounded border border-white/10">
            <span className="text-zinc-300">
              <strong className="text-white">Operaciones futuras:</strong> Margen proyectado
            </span>
            <span className="font-mono font-bold text-[#a5b4fc]">
              {formatCurrency(financialPosition.futureOpsProjectedProfitARS, 'ARS')} / {formatCurrency(financialPosition.futureOpsProjectedProfitUSD, 'USD')}
            </span>
          </div>
        </div>

      </div>

      {/* ========================================================
          RESUMEN MENSUAL & ALERTAS CRÍTICAS (DESIGN SPLIT GRID)
      ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card: Resumen Mensual */}
        <div className="bg-[#18181a] border border-white/10 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">
              Resumen Mensual
            </div>
            <button
              onClick={() => setActiveTab('projection')}
              className="text-[11px] font-mono text-[#a5b4fc] hover:underline flex items-center gap-1"
            >
              <span>Ver Proyección</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-zinc-400 font-mono text-[10px] uppercase">
                <th className="pb-2">MES</th>
                <th className="pb-2 text-right">C. INICIAL</th>
                <th className="pb-2 text-right">RESULTADO</th>
                <th className="pb-2 text-right">CAJA FINAL</th>
              </tr>
            </thead>
            <tbody className="font-mono divide-y divide-white/5">
              {monthlyProjection.slice(0, 4).map((m) => {
                const diff = m.projectedIncome - m.projectedSupplierPayments - m.projectedFixedExpenses;
                return (
                  <tr key={m.monthKey} className={m.isProjected ? "bg-[#a5b4fc]/5" : "hover:bg-[#222224]/50"}>
                    <td className="py-2.5 text-zinc-200">
                      {m.monthLabel} {m.isProjected && <span className="text-[9px] text-[#a5b4fc] font-bold">(P)</span>}
                    </td>
                    <td className="py-2.5 text-right text-zinc-400">
                      ${(m.initialCash / 1000000).toFixed(1)}M
                    </td>
                    <td className={`py-2.5 text-right font-bold ${diff >= 0 ? 'text-[#34d399]' : 'text-[#fb7185]'}`}>
                      {diff >= 0 ? '+' : ''}${(diff / 1000000).toFixed(1)}M
                    </td>
                    <td className="py-2.5 text-right font-bold text-white">
                      ${(m.finalProjectedCash / 1000000).toFixed(1)}M
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Card: Alertas Críticas */}
        <div className="bg-[#18181a] border border-white/10 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 mb-4">
              Alertas Críticas
            </div>
            
            <div className="space-y-3">
              {/* Alert 1: Unreconciled */}
              <div 
                onClick={() => setActiveTab('reconciliation')}
                className="p-3 border border-dashed border-[#fb7185]/60 bg-[#fb7185]/5 rounded cursor-pointer hover:bg-[#fb7185]/10 transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-zinc-200 block">{kpis.unreconciledMovementsCount} Movimientos sin clasificar</span>
                  <span className="text-[11px] text-zinc-400">Extractos pendientes de conciliar</span>
                </div>
                <span className="font-mono text-[#fb7185] font-bold text-sm">
                  {formatCurrency(kpis.unreconciledAmount)}
                </span>
              </div>

              {/* Alert 2: Monthly Closing */}
              <div 
                onClick={() => setActiveTab('closing')}
                className="p-3 border border-[#fbbf24]/50 bg-[#fbbf24]/5 rounded cursor-pointer hover:bg-[#fbbf24]/10 transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-medium text-zinc-200 block">Cierre {cutoffConfig.cutoffDate.slice(0, 7)} en revisión</span>
                  <span className="text-[11px] text-zinc-400">Auditoría y conciliación de saldos</span>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#fbbf24] bg-[#fbbf24]/10 px-2 py-1 rounded">
                  Ver Auditoría
                </span>
              </div>

              {/* Alert 3: Students Debt */}
              <div 
                onClick={() => setActiveTab('students')}
                className="p-3 border border-white/10 bg-[#222224]/50 rounded cursor-pointer hover:bg-[#222224] transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-medium text-zinc-200 block">Alumnos con cuotas pendientes</span>
                  <span className="text-[11px] text-zinc-400">{kpis.pendingStudentsDebtCount} pagadores en mora</span>
                </div>
                <span className="font-mono text-[#fb7185] font-bold">
                  {formatCurrency(kpis.pendingStudentsDebtAmount)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
            <span>Sistema Online</span>
            <span className="text-[#34d399] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]"></span> 100% Sincronizado
            </span>
          </div>
        </div>

      </div>

      {/* ========================================================
          1. CAJA / TENENCIA METRICS (SECTION 3 PROMPT MANDATE)
      ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Tenencia Actual */}
        <div className="bg-[#18181a] border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Tenencia Actual</span>
            <div className="p-1.5 rounded bg-[#222224] text-[#a5b4fc] border border-white/10">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-white font-mono tracking-tight">
              {formatCurrency(kpis.currentCash)}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1 font-mono">
              Total en 6 cuentas (MP, Bancos, Caja)
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] font-mono">
            <span className="text-zinc-400">Santander + Galicia:</span>
            <span className="text-zinc-200 font-bold">
              {formatCurrency((accounts.find(a => a.id === 'banco_santander')?.currentBalance || 0) + (accounts.find(a => a.id === 'banco_galicia')?.currentBalance || 0))}
            </span>
          </div>
        </div>

        {/* Card 2: Cobros Pendientes */}
        <div className="bg-[#18181a] border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#34d399] uppercase tracking-widest">Cobros Pendientes</span>
            <div className="p-1.5 rounded bg-[#34d399]/15 text-[#34d399] border border-[#34d399]/30">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[#34d399] font-mono tracking-tight">
              +{formatCurrency(kpis.pendingReceivables)}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1 font-mono">
              Operaciones confirmadas y cuotas
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] font-mono">
            <span className="text-zinc-400">Recaudación Cobrada:</span>
            <span className="text-[#34d399] font-bold">{formatCurrency(kpis.totalReceivedRevenue)}</span>
          </div>
        </div>

        {/* Card 3: Caja Comprometida */}
        <div className="bg-[#18181a] border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#fbbf24] uppercase tracking-widest">Caja Comprometida</span>
            <div className="p-1.5 rounded bg-[#fbbf24]/15 text-[#fbbf24] border border-[#fbbf24]/30">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[#fbbf24] font-mono tracking-tight">
              -{formatCurrency(kpis.committedCash)}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1 font-mono">
              Proveedores pendientes + Gastos fijos
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] font-mono">
            <span className="text-zinc-400">Proveedores a pagar:</span>
            <span className="text-[#fbbf24] font-bold">{formatCurrency(kpis.pendingSupplierPayables)}</span>
          </div>
        </div>

        {/* Card 4: Caja Libre Proyectada */}
        <div className="bg-[#18181a] border border-[#34d399]/40 rounded-lg p-4 shadow-[0_0_20px_rgba(52,211,153,0.05)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-[#34d399] uppercase tracking-widest">Caja Libre Proyectada</span>
            <div className="p-1.5 rounded bg-[#34d399]/20 text-[#34d399] border border-[#34d399]/40">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-[#34d399] font-mono tracking-tight">
              {formatCurrency(kpis.projectedFreeCash)}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1 font-mono">
              Caja neta disponible tras saldar compromisos
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] font-mono">
            <span className="text-zinc-400">Tenencia Proyectada:</span>
            <span className="text-white font-bold">{formatCurrency(kpis.projectedCash)}</span>
          </div>
        </div>

      </div>

      {/* ========================================================
          2. GANANCIA VS CAJA & UNIDADES DE NEGOCIO
      ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ganancia vs Caja explainer card */}
        <div className="lg:col-span-1 bg-[#18181a] border border-white/10 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-[#a5b4fc]" />
                <span>Principio: Ganancia vs Caja</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#222224] text-[#a5b4fc] border border-white/10 font-bold uppercase">
                Regla Central
              </span>
            </div>

            <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
              <strong className="text-zinc-200">Caja</strong> es el dinero real disponible hoy en cuentas bancarias y Mercado Pago.
              <br /><br />
              <strong className="text-zinc-200">Ganancia</strong> es el resultado económico devengado por las operaciones (Ventas menos Costos asociados).
            </p>

            <div className="mt-4 space-y-2 text-xs bg-[#222224] p-3.5 rounded border border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Ingresos Totales Esperados:</span>
                <span className="font-bold text-white font-mono">{formatCurrency(kpis.totalExpectedRevenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Costos Totales Esperados:</span>
                <span className="font-semibold text-[#fb7185] font-mono">-{formatCurrency(kpis.totalExpectedCost)}</span>
              </div>
              <div className="border-t border-white/10 pt-2 flex justify-between items-center font-bold">
                <span className="text-[#a5b4fc]">Ganancia Esperada:</span>
                <span className="text-[#34d399] font-mono">{formatCurrency(kpis.totalExpectedProfit)}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-zinc-400 font-mono">
                <span>Margen Operativo Promedio:</span>
                <span className="text-[#34d399] font-bold">{formatPercent(kpis.expectedProfitMargin)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-zinc-300">
              <span>Ganancia Realizada:</span>
              <span className="text-[#34d399] font-bold">{formatCurrency(kpis.totalRealizedProfit)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Resultado Pendiente:</span>
              <span className="text-[#fbbf24] font-bold">{formatCurrency(kpis.totalPendingProfit)}</span>
            </div>
          </div>
        </div>

        {/* Business Units Performance Cards */}
        <div className="lg:col-span-2 bg-[#18181a] border border-white/10 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#a5b4fc]" />
                <span>Rendimiento por Unidad de Negocio</span>
              </h3>
              <button
                onClick={() => setActiveTab('operations')}
                className="text-xs font-mono text-[#a5b4fc] hover:underline flex items-center gap-1 font-bold"
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

                const borderColor = key === 'receptivo' ? 'border-cyan-500/30' : key === 'salidas' ? 'border-emerald-500/30' : 'border-indigo-500/30';
                const tagColor = key === 'receptivo' ? 'text-cyan-400' : key === 'salidas' ? 'text-emerald-400' : 'text-[#a5b4fc]';

                return (
                  <div key={key} className={`rounded-lg p-3.5 bg-[#222224] border ${borderColor} flex flex-col justify-between`}>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${tagColor}`}>{stat.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#18181a] text-zinc-300 font-mono border border-white/10 font-medium">
                          {stat.count} ops
                        </span>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between text-zinc-400">
                          <span className="text-[11px]">Ventas:</span>
                          <span className="text-zinc-200">{formatCurrency(stat.expectedRev)}</span>
                        </div>
                        <div className="flex justify-between text-zinc-400">
                          <span className="text-[11px]">Costos:</span>
                          <span className="text-zinc-400">{formatCurrency(stat.expectedCost)}</span>
                        </div>
                        <div className="flex justify-between text-[#34d399] font-bold pt-1.5 border-t border-white/10">
                          <span className="text-[11px]">Margen:</span>
                          <span>{formatPercent(margin)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/10">
                      <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                        <span>Cobrado ({formatPercent(cobradoPercent)})</span>
                        <span className="text-zinc-200 font-bold">{formatCurrency(stat.receivedRev)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#18181a] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#34d399] rounded-full transition-all"
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
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#34d399]"></span>
                <span>Gastos fijos estructura: <strong className="text-white font-mono">{formatCurrency(kpis.monthlyFixedExpenses)}/mes</strong></span>
              </span>
            </div>
            <button
              onClick={() => setActiveTab('fixed_expenses')}
              className="text-xs font-mono text-[#a5b4fc] hover:underline font-bold"
            >
              Ver detalle de gastos fijos →
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================
          3. EVOLUCIÓN MENSUAL DE CAJA (CHART & TABLE)
      ======================================================== */}
      <div className="bg-[#18181a] border border-white/10 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-white/10">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#a5b4fc]" />
              <span>Evolución Mensual & Proyección de Caja</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Caja inicial, cobros operativos, pagos a proveedores, gastos fijos y caja final proyectada mes a mes.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('projection')}
            className="text-xs font-mono text-[#a5b4fc] hover:underline font-bold flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Ver Análisis Completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Recharts Monthly Projection Chart with dark styling */}
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyProjection}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="monthLabel" stroke="#a1a1aa" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#a1a1aa"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181a',
                  borderColor: 'rgba(255,255,255,0.15)',
                  color: '#f2f2f2',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                }}
                formatter={(value: any) => formatCurrency(Number(value))}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="projectedIncome" name="Cobros / Ingresos" fill="#34d399" radius={[3, 3, 0, 0]} />
              <Bar dataKey="projectedSupplierPayments" name="Pagos Proveedores" fill="#fbbf24" radius={[3, 3, 0, 0]} />
              <Bar dataKey="projectedFixedExpenses" name="Gastos Fijos" fill="#fb7185" radius={[3, 3, 0, 0]} />
              <Bar dataKey="finalProjectedCash" name="Caja Final Proyectada" fill="#a5b4fc" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Table */}
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#222224] text-zinc-400 uppercase tracking-wider font-mono text-[10px] border-b border-white/10">
              <tr>
                <th className="py-2.5 px-4">Mes</th>
                <th className="py-2.5 px-4 text-right">Caja Inicial</th>
                <th className="py-2.5 px-4 text-right text-[#34d399]">Cobros</th>
                <th className="py-2.5 px-4 text-right text-[#fbbf24]">Pagos Proveedores</th>
                <th className="py-2.5 px-4 text-right text-[#fb7185]">Gastos Fijos</th>
                <th className="py-2.5 px-4 text-right text-[#a5b4fc] font-bold">Caja Final Proyectada</th>
                <th className="py-2.5 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {monthlyProjection.map((row) => (
                <tr key={row.monthKey} className="hover:bg-[#222224]/50 transition-colors">
                  <td className="py-2.5 px-4 font-sans font-medium text-zinc-200">
                    {row.monthLabel}
                  </td>
                  <td className="py-2.5 px-4 text-right text-zinc-400">
                    {formatCurrency(row.initialCash)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-[#34d399] font-bold">
                    +{formatCurrency(row.projectedIncome)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-[#fbbf24] font-semibold">
                    -{formatCurrency(row.projectedSupplierPayments)}
                  </td>
                  <td className="py-2.5 px-4 text-right text-[#fb7185] font-semibold">
                    -{formatCurrency(row.projectedFixedExpenses)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-[#a5b4fc]">
                    {formatCurrency(row.finalProjectedCash)}
                  </td>
                  <td className="py-2.5 px-4 text-center font-sans">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                      row.isProjected
                        ? 'bg-[#a5b4fc]/15 text-[#a5b4fc] border-[#a5b4fc]/30'
                        : 'bg-[#34d399]/15 text-[#34d399] border-[#34d399]/30'
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

      {/* Footer bar matching Design variation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10 text-xs text-zinc-400 font-mono">
        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Google Sheets & Database Integrated
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-1 rounded bg-[#222224] text-zinc-300 border border-white/10 text-[10px] font-bold uppercase">
            Turismo Receptivo: 33% Margen
          </span>
          <span className="px-2.5 py-1 rounded bg-[#222224] text-[#34d399] border border-white/10 text-[10px] font-bold uppercase">
            Viajes Educativos: 87% Cobrado
          </span>
          <span className="px-2.5 py-1 rounded bg-[#222224] text-[#a5b4fc] border border-white/10 text-[10px] font-bold uppercase">
            SGOF Enterprise 2026
          </span>
        </div>
      </div>

    </div>
  );
};
