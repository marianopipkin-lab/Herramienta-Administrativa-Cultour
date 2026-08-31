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
  Clock,
  RefreshCw,
  Sliders,
  DollarSign
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
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
    cutoffConfig,
    exchangeRate,
    setExchangeRate
  } = useApp();

  const [viewMode, setViewMode] = useState<'fotografia' | 'evolucion'>('fotografia');
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [tempRate, setTempRate] = useState(exchangeRate.usdToArsRate.toString());

  const handleSaveRate = () => {
    const num = Number(tempRate);
    if (!isNaN(num) && num > 0) {
      setExchangeRate({
        ...exchangeRate,
        usdToArsRate: num,
        rateDate: new Date().toISOString().split('T')[0]
      });
      setIsEditingRate(false);
    }
  };

  const channels = financialPosition.byUnitAndChannel;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#a5b4fc] mb-1">
            Auditoría Ejecutiva de Socios — Cultour
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
          BLOQUE 1 — POSICIÓN ACTUAL (AUDITORÍA DE CAJA VS DISPONIBLE)
      ======================================================== */}
      <div className="bg-[#222224] border border-[#a5b4fc]/30 rounded-lg p-6 shadow-[0_0_40px_rgba(165,180,252,0.08)]">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between pb-4 border-b border-white/10 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#a5b4fc]/20 text-[#a5b4fc] font-bold uppercase border border-[#a5b4fc]/30">
                BLOQUE 1
              </span>
              <h2 className="font-syne font-extrabold text-xl text-white tracking-tight uppercase">
                POSICIÓN ACTUAL & AUDITORÍA DE FONDOS
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
              Principio Central: <strong>Dinero en Cuentas ≠ Ganancia</strong> y <strong>Dinero de Viajes Futuros ≠ Caja Libre</strong>.
              Los saldos de ARS y USD se administran en sus monedas de origen y se consolidan al tipo de cambio de referencia.
            </p>
          </div>

          {/* Exchange rate widget */}
          <div className="font-mono text-xs text-zinc-300 bg-[#18181a] px-3 py-2 rounded-lg border border-white/10 self-start md:self-auto flex items-center gap-2.5">
            {isEditingRate ? (
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400">$</span>
                <input
                  type="number"
                  value={tempRate}
                  onChange={(e) => setTempRate(e.target.value)}
                  className="w-20 bg-[#222224] text-white px-1.5 py-0.5 rounded border border-[#a5b4fc] text-xs font-mono"
                  autoFocus
                />
                <button
                  onClick={handleSaveRate}
                  className="px-2 py-0.5 rounded bg-[#34d399] text-[#111113] font-bold text-[10px] uppercase"
                >
                  OK
                </button>
              </div>
            ) : (
              <>
                <div>
                  <span className="text-zinc-400 text-[10px] block uppercase">Ref USD/ARS ({exchangeRate.sourceLabel}):</span>
                  <span className="text-white font-bold">${exchangeRate.usdToArsRate.toLocaleString('es-AR')}</span>
                  <span className="text-zinc-500 text-[10px] ml-1">({exchangeRate.rateDate})</span>
                </div>
                <button
                  onClick={() => { setIsEditingRate(true); setTempRate(exchangeRate.usdToArsRate.toString()); }}
                  className="text-zinc-400 hover:text-[#a5b4fc] p-1 rounded hover:bg-white/5"
                  title="Modificar tipo de cambio de referencia"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stat Grid with strictly separated ARS, USD & Equivalent */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          
          {/* Stat 1: Dinero Real en Cuentas */}
          <div className="border-l-2 border-white/40 pl-4 py-1 bg-[#18181a]/40 rounded-r-lg group relative">
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400 flex items-center justify-between">
              <span>1. Dinero en Cuentas</span>
              <div className="flex items-center gap-1">
                <Info className="w-3 h-3 text-zinc-500 cursor-help" title="Caja total: dinero actualmente existente en las cuentas financieras de Cultour." />
                <Wallet className="w-3.5 h-3.5 text-zinc-400" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1.5">
              {formatCurrency(financialPosition.cashARS, 'ARS')}
            </div>
            <div className="text-xs font-mono text-zinc-300 mt-1 flex items-center justify-between">
              <span>+ {formatCurrency(financialPosition.cashUSD, 'USD')}</span>
              <span className="text-[10px] text-zinc-400">({formatCurrency(financialPosition.cashEquivalentUSD, 'USD')} eq.)</span>
            </div>
            <div className="text-[10px] font-mono text-zinc-500 mt-1 pt-1 border-t border-white/5">
              Saldos en cuentas (ARS y USD independientes)
            </div>
          </div>

          {/* Stat 2: Fondos de Operaciones Futuras */}
          <div className="border-l-2 border-[#a5b4fc] pl-4 py-1 bg-[#18181a]/40 rounded-r-lg group relative">
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#a5b4fc] flex items-center justify-between">
              <span>2. Fondos Viajes Futuros</span>
              <div className="flex items-center gap-1">
                <Info className="w-3 h-3 text-[#a5b4fc]/70 cursor-help" title="Fondos futuros: dinero cobrado de operaciones que todavía no ocurrieron. Es dinero en custodia que NO es ganancia disponible." />
                <Clock className="w-3.5 h-3.5 text-[#a5b4fc]" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-[#a5b4fc] mt-1.5">
              {formatCurrency(financialPosition.futureOpsCollectedARS, 'ARS')}
            </div>
            <div className="text-xs font-mono text-[#a5b4fc]/90 mt-1 flex items-center justify-between">
              <span>+ {formatCurrency(financialPosition.futureOpsCollectedUSD, 'USD')}</span>
              <span className="text-[10px] text-[#a5b4fc]/70">({formatCurrency(financialPosition.futureOpsCollectedEquivalentUSD, 'USD')} eq.)</span>
            </div>
            <div className="text-[10px] font-mono text-[#a5b4fc]/60 mt-1 pt-1 border-t border-white/5">
              Anticipos cobrados de viajes futuros (Custodia)
            </div>
          </div>

          {/* Stat 3: Obligaciones Pendientes / Fondos Comprometidos */}
          <div className="border-l-2 border-[#fbbf24] pl-4 py-1 bg-[#18181a]/40 rounded-r-lg group relative">
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#fbbf24] flex items-center justify-between">
              <span>3. Obligaciones Pendientes</span>
              <div className="flex items-center gap-1">
                <Info className="w-3 h-3 text-[#fbbf24]/70 cursor-help" title="Obligaciones pendientes: dinero que Cultour todavía debe pagar a proveedores y gastos de estructura mensual." />
                <ArrowDownRight className="w-3.5 h-3.5 text-[#fbbf24]" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-[#fbbf24] mt-1.5">
              -{formatCurrency(financialPosition.committedFundsARS, 'ARS')}
            </div>
            <div className="text-xs font-mono text-[#fbbf24]/90 mt-1 flex items-center justify-between">
              <span>- {formatCurrency(financialPosition.committedFundsUSD, 'USD')}</span>
              <span className="text-[10px] text-[#fbbf24]/70">({formatCurrency(financialPosition.committedFundsEquivalentUSD, 'USD')} eq.)</span>
            </div>
            <div className="text-[10px] font-mono text-[#fbbf24]/60 mt-1 pt-1 border-t border-white/5">
              Proveedores pendientes + Estructura mensual
            </div>
          </div>

          {/* Stat 4: Caja Libre / Dinero Disponible Real */}
          <div className="border-l-2 border-[#34d399] pl-4 py-1 bg-[#18181a]/40 rounded-r-lg group relative">
            <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#34d399] flex items-center justify-between">
              <span>4. Caja Libre Real</span>
              <div className="flex items-center gap-1">
                <Info className="w-3 h-3 text-[#34d399]/70 cursor-help" title="Caja libre: liquidez disponible después de reservar la custodia de viajes futuros y obligaciones inmediatas. Caja Libre = Caja Actual - Fondos Futuros - Estructura." />
                <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399]" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono text-[#34d399] mt-1.5">
              {formatCurrency(financialPosition.availableCashEquivalentUSD ?? financialPosition.availableProfitEquivalentUSD, 'USD')}
            </div>
            <div className="text-xs font-mono text-[#34d399]/90 mt-1 flex items-center justify-between">
              <span>{formatCurrency(financialPosition.availableCashARS ?? financialPosition.availableProfitARS, 'ARS')}</span>
              <span className="text-zinc-400 text-[10px]">+ {formatCurrency(financialPosition.availableCashUSD ?? financialPosition.availableProfitUSD, 'USD')}</span>
            </div>
            <div className="text-[10px] font-mono text-[#34d399]/60 mt-1 pt-1 border-t border-white/5">
              Liquidez neta libre de pasivos y custodia
            </div>
          </div>

        </div>

        {/* Realized vs Projected Profit Banner */}
        <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center justify-between bg-[#18181a] px-4 py-3 rounded-lg border border-white/10">
            <div>
              <span className="text-white font-bold block">Operaciones Realizadas (Devengado):</span>
              <span className="text-zinc-400 text-[11px]">Resultado económico real de viajes ya ejecutados</span>
            </div>
            <div className="text-right font-mono">
              <span className="font-bold text-[#34d399] block text-sm">
                {formatCurrency(financialPosition.pastOpsRealizedProfitEquivalentUSD, 'USD')}
              </span>
              <span className="text-[10px] text-zinc-400">
                {formatCurrency(financialPosition.pastOpsRealizedProfitARS, 'ARS')} + {formatCurrency(financialPosition.pastOpsRealizedProfitUSD, 'USD')}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between bg-[#18181a] px-4 py-3 rounded-lg border border-white/10">
            <div>
              <span className="text-white font-bold block">Operaciones Futuras (Proyectado):</span>
              <span className="text-zinc-400 text-[11px]">Margen presupuestado a devengar tras ejecución</span>
            </div>
            <div className="text-right font-mono">
              <span className="font-bold text-[#a5b4fc] block text-sm">
                {formatCurrency(financialPosition.futureOpsProjectedProfitEquivalentUSD, 'USD')}
              </span>
              <span className="text-[10px] text-zinc-400">
                {formatCurrency(financialPosition.futureOpsProjectedProfitARS, 'ARS')} + {formatCurrency(financialPosition.futureOpsProjectedProfitUSD, 'USD')}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================
          BLOQUE 2 — RESULTADO ECONÓMICO POR UNIDAD Y CANAL
      ======================================================== */}
      <div className="bg-[#18181a] border border-white/10 rounded-lg p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#34d399]/20 text-[#34d399] font-bold uppercase border border-[#34d399]/30">
                BLOQUE 2
              </span>
              <h2 className="font-syne font-extrabold text-xl text-white tracking-tight uppercase">
                RESULTADO ECONÓMICO & RENTABILIDAD POR CANAL
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Desglose estricto por unidad y canal comercial. Las comisiones de agencias B2B se deducen del valor comercial y los costos reflejan contrataciones a proveedores.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('operations')}
            className="text-xs font-mono text-[#a5b4fc] hover:underline font-bold flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Ver Master de Operaciones</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Commercial Channels Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Channel 1: Receptivo Directo */}
          <div className="rounded-lg p-4 bg-[#222224] border border-cyan-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-cyan-400">Receptivo — Directo</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#18181a] text-zinc-300 font-mono border border-white/10 font-bold">
                  {channels.receptivoDirecto.opsCount} ops (USD)
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-zinc-400">
                  <span>Ventas Esperadas:</span>
                  <span className="text-white font-bold">{formatCurrency(channels.receptivoDirecto.expectedRevenue, 'USD')}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Costos Proveedores:</span>
                  <span className="text-[#fb7185]">-{formatCurrency(channels.receptivoDirecto.expectedCost, 'USD')}</span>
                </div>
                <div className="flex justify-between text-[#34d399] font-bold pt-1.5 border-t border-white/10">
                  <span>Resultado Esperado:</span>
                  <span>{formatCurrency(channels.receptivoDirecto.expectedProfit, 'USD')}</span>
                </div>
                <div className="flex justify-between text-zinc-400 text-[11px]">
                  <span>Margen Comercial:</span>
                  <span className="text-[#34d399] font-bold">{formatPercent(channels.receptivoDirecto.margin)}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/10 text-[11px] font-mono flex justify-between text-zinc-400">
              <span>Cobrado Real:</span>
              <span className="text-[#34d399] font-bold">{formatCurrency(channels.receptivoDirecto.receivedRevenue, 'USD')}</span>
            </div>
          </div>

          {/* Channel 2: Receptivo Agencias */}
          <div className="rounded-lg p-4 bg-[#222224] border border-blue-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-blue-400">Receptivo — Agencias B2B</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#18181a] text-zinc-300 font-mono border border-white/10 font-bold">
                  {channels.receptivoAgencia.opsCount} ops (USD)
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-zinc-400">
                  <span>Ventas Netas:</span>
                  <span className="text-white font-bold">{formatCurrency(channels.receptivoAgencia.expectedRevenue, 'USD')}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Costos Proveedores:</span>
                  <span className="text-[#fb7185]">-{formatCurrency(channels.receptivoAgencia.expectedCost, 'USD')}</span>
                </div>
                <div className="flex justify-between text-[#34d399] font-bold pt-1.5 border-t border-white/10">
                  <span>Resultado Esperado:</span>
                  <span>{formatCurrency(channels.receptivoAgencia.expectedProfit, 'USD')}</span>
                </div>
                <div className="flex justify-between text-zinc-400 text-[11px]">
                  <span>Margen Comercial:</span>
                  <span className="text-[#34d399] font-bold">{formatPercent(channels.receptivoAgencia.margin)}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/10 text-[11px] font-mono flex justify-between text-zinc-400">
              <span>Cobrado Real:</span>
              <span className="text-[#34d399] font-bold">{formatCurrency(channels.receptivoAgencia.receivedRevenue, 'USD')}</span>
            </div>
          </div>

          {/* Channel 3: Salidas Educativas */}
          <div className="rounded-lg p-4 bg-[#222224] border border-emerald-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-emerald-400">Salidas Educativas</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#18181a] text-zinc-300 font-mono border border-white/10 font-bold">
                  {channels.salidasEducativas.opsCount} ops (ARS)
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-zinc-400">
                  <span>Recaudación:</span>
                  <span className="text-white font-bold">{formatCurrency(channels.salidasEducativas.expectedRevenue, 'ARS')}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Costos Servicios:</span>
                  <span className="text-[#fb7185]">-{formatCurrency(channels.salidasEducativas.expectedCost, 'ARS')}</span>
                </div>
                <div className="flex justify-between text-[#34d399] font-bold pt-1.5 border-t border-white/10">
                  <span>Resultado Esperado:</span>
                  <span>{formatCurrency(channels.salidasEducativas.expectedProfit, 'ARS')}</span>
                </div>
                <div className="flex justify-between text-zinc-400 text-[11px]">
                  <span>Margen Operativo:</span>
                  <span className="text-[#34d399] font-bold">{formatPercent(channels.salidasEducativas.margin)}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/10 text-[11px] font-mono flex justify-between text-zinc-400">
              <span>Cobrado Real:</span>
              <span className="text-[#34d399] font-bold">{formatCurrency(channels.salidasEducativas.receivedRevenue, 'ARS')}</span>
            </div>
          </div>

          {/* Channel 4: Viajes Educativos */}
          <div className="rounded-lg p-4 bg-[#222224] border border-indigo-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-indigo-400">Viajes Educativos</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#18181a] text-zinc-300 font-mono border border-white/10 font-bold">
                  {channels.viajesEducativos.opsCount} ops (ARS)
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-zinc-400">
                  <span>Total Contratado:</span>
                  <span className="text-white font-bold">{formatCurrency(channels.viajesEducativos.expectedRevenue, 'ARS')}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Costos Proveedores:</span>
                  <span className="text-[#fb7185]">-{formatCurrency(channels.viajesEducativos.expectedCost, 'ARS')}</span>
                </div>
                <div className="flex justify-between text-[#34d399] font-bold pt-1.5 border-t border-white/10">
                  <span>Resultado Esperado:</span>
                  <span>{formatCurrency(channels.viajesEducativos.expectedProfit, 'ARS')}</span>
                </div>
                <div className="flex justify-between text-zinc-400 text-[11px]">
                  <span>Margen Operativo:</span>
                  <span className="text-[#34d399] font-bold">{formatPercent(channels.viajesEducativos.margin)}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/10 text-[11px] font-mono flex justify-between text-zinc-400">
              <span>Cobrado Real:</span>
              <span className="text-[#34d399] font-bold">{formatCurrency(channels.viajesEducativos.receivedRevenue, 'ARS')}</span>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================
          BLOQUE 3 — PROYECCIÓN & ALERTAS CRÍTICAS
      ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Cobranzas y Pagos Pendientes */}
        <div className="bg-[#18181a] border border-white/10 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#fbbf24]/20 text-[#fbbf24] font-bold uppercase border border-[#fbbf24]/30">
                BLOQUE 3
              </span>
              <h3 className="text-sm font-bold text-white uppercase">
                Cobranzas & Pagos Pendientes
              </h3>
            </div>

            <div className="space-y-3 mt-4 text-xs font-mono">
              <div className="p-3 bg-[#222224] rounded-lg border border-white/5">
                <div className="flex justify-between items-center text-zinc-400 text-[11px]">
                  <span>Cobranzas Pendientes ARS:</span>
                  <span className="text-[#34d399] font-bold text-sm">+{formatCurrency(financialPosition.pendingReceivablesARS, 'ARS')}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-400 text-[11px] mt-1.5">
                  <span>Cobranzas Pendientes USD:</span>
                  <span className="text-cyan-400 font-bold text-sm">+{formatCurrency(financialPosition.pendingReceivablesUSD, 'USD')}</span>
                </div>
              </div>

              <div className="p-3 bg-[#222224] rounded-lg border border-white/5">
                <div className="flex justify-between items-center text-zinc-400 text-[11px]">
                  <span>Proveedores a Pagar ARS:</span>
                  <span className="text-[#fbbf24] font-bold text-sm">-{formatCurrency(financialPosition.futureOpsPendingCostsARS + financialPosition.pastOpsPendingCostsARS, 'ARS')}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-400 text-[11px] mt-1.5">
                  <span>Proveedores a Pagar USD:</span>
                  <span className="text-[#fbbf24] font-bold text-sm">-{formatCurrency(financialPosition.futureOpsPendingCostsUSD + financialPosition.pastOpsPendingCostsUSD, 'USD')}</span>
                </div>
              </div>

              <div className="p-3 bg-[#222224] rounded-lg border border-white/5">
                <div className="flex justify-between items-center text-zinc-400 text-[11px]">
                  <span>Gastos Fijos Estructura:</span>
                  <span className="text-[#fb7185] font-bold">{formatCurrency(financialPosition.monthlyFixedARS, 'ARS')}/mes</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">Resultado Proyectado Neto:</span>
            <span className="text-[#34d399] font-bold text-sm">{formatCurrency(financialPosition.futureOpsProjectedProfitEquivalentUSD, 'USD')}</span>
          </div>
        </div>

        {/* Card 2 & 3: Alertas y Resumen Mensual */}
        <div className="lg:col-span-2 bg-[#18181a] border border-white/10 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#fbbf24]" />
                <span>Alertas Operativas & Conciliación</span>
              </h3>
              <span className="text-[10px] font-mono text-zinc-400">Control en Tiempo Real</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Alert 1: Unreconciled */}
              <div 
                onClick={() => setActiveTab('reconciliation')}
                className="p-3 border border-dashed border-[#fb7185]/60 bg-[#fb7185]/5 rounded-lg cursor-pointer hover:bg-[#fb7185]/10 transition-colors flex flex-col justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-zinc-200 block">{kpis.unreconciledMovementsCount} Sin clasificar</span>
                  <span className="text-[11px] text-zinc-400">Extractos pendientes de conciliar</span>
                </div>
                <div className="font-mono text-[#fb7185] font-bold text-base mt-2">
                  {formatCurrency(kpis.unreconciledAmount, 'ARS')}
                </div>
              </div>

              {/* Alert 2: Monthly Closing */}
              <div 
                onClick={() => setActiveTab('closing')}
                className="p-3 border border-[#fbbf24]/50 bg-[#fbbf24]/5 rounded-lg cursor-pointer hover:bg-[#fbbf24]/10 transition-colors flex flex-col justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-zinc-200 block">Cierre {cutoffConfig.cutoffDate.slice(0, 7)}</span>
                  <span className="text-[11px] text-zinc-400">Auditoría y conciliación mensual</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#fbbf24] bg-[#fbbf24]/10 px-2 py-1 rounded">
                    Auditar Saldo
                  </span>
                </div>
              </div>

              {/* Alert 3: Students Debt */}
              <div 
                onClick={() => setActiveTab('students')}
                className="p-3 border border-white/10 bg-[#222224]/50 rounded-lg cursor-pointer hover:bg-[#222224] transition-colors flex flex-col justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-zinc-200 block">Cuotas en Mora</span>
                  <span className="text-[11px] text-zinc-400">{kpis.pendingStudentsDebtCount} pagadores pendientes</span>
                </div>
                <div className="font-mono text-[#fb7185] font-bold text-base mt-2">
                  {formatCurrency(kpis.pendingStudentsDebtAmount, 'ARS')}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>Motor de Clasificación y Reglas Activo</span>
            <button
              onClick={() => setActiveTab('reconciliation')}
              className="text-[#a5b4fc] hover:underline font-bold flex items-center gap-1"
            >
              <span>Ir a Conciliación</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================
          EVOLUCIÓN MENSUAL & PROYECCIÓN DE FLUJO DE CAJA (REAL DATA)
      ======================================================== */}
      <div className="bg-[#18181a] border border-white/10 rounded-lg p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-white/10">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#a5b4fc]" />
              <span>Evolución Mensual & Proyección de Flujo de Caja (Datos Reales)</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Caja inicial, cobranzas operativas, pagos a proveedores, gastos de estructura y caja final calculada exclusivamente sobre compromisos reales.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('projection')}
            className="text-xs font-mono text-[#a5b4fc] hover:underline font-bold flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Ver Simulación Completa</span>
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
                formatter={(value: any) => formatCurrency(Number(value), 'ARS')}
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
                <th className="py-2.5 px-4 text-right text-[#34d399]">Cobros Reales</th>
                <th className="py-2.5 px-4 text-right text-[#fbbf24]">Pagos Proveedores</th>
                <th className="py-2.5 px-4 text-right text-[#fb7185]">Gastos Fijos</th>
                <th className="py-2.5 px-4 text-right text-[#a5b4fc] font-bold">Caja Final</th>
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
                    {formatCurrency(row.initialCash, 'ARS')}
                  </td>
                  <td className="py-2.5 px-4 text-right text-[#34d399] font-bold">
                    +{formatCurrency(row.projectedIncome, 'ARS')}
                  </td>
                  <td className="py-2.5 px-4 text-right text-[#fbbf24] font-semibold">
                    -{formatCurrency(row.projectedSupplierPayments, 'ARS')}
                  </td>
                  <td className="py-2.5 px-4 text-right text-[#fb7185] font-semibold">
                    -{formatCurrency(row.projectedFixedExpenses, 'ARS')}
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-[#a5b4fc]">
                    {formatCurrency(row.finalProjectedCash, 'ARS')}
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

      {/* Footer bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10 text-xs text-zinc-400 font-mono">
        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Cultour — Sistema de Gestión Operativa y Financiera
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-1 rounded bg-[#222224] text-zinc-300 border border-white/10 text-[10px] font-bold uppercase">
            Receptivo: {formatPercent(channels.receptivoDirecto.margin)} Margen
          </span>
          <span className="px-2.5 py-1 rounded bg-[#222224] text-[#34d399] border border-white/10 text-[10px] font-bold uppercase">
            Educativo: {formatPercent(channels.viajesEducativos.margin)} Margen
          </span>
          <span className="px-2.5 py-1 rounded bg-[#222224] text-[#a5b4fc] border border-white/10 text-[10px] font-bold uppercase">
            SGOF v2.0
          </span>
        </div>
      </div>

    </div>
  );
};
