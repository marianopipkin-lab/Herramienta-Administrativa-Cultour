import React, { useState, useMemo } from 'react';
import {
  Compass,
  PlusCircle,
  FileSpreadsheet,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  X,
  ChevronRight,
  Briefcase,
  GraduationCap,
  Plane,
  Building
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Operation, BusinessUnit, OperationStatus } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/financialCalculations';
import { exportOperationsToExcel } from '../../utils/excelParser';

export const OperationsMaster: React.FC = () => {
  const {
    operations,
    setSelectedOperationId,
    setIsNewOpModalOpen,
    setIsImportModalOpen,
    currentRole
  } = useApp();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<'all' | 'receptivo_directo' | 'receptivo_agencia' | 'salidas' | 'viajes'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'futuras' | 'realizadas' | 'este_mes'>('all');
  const [collectionFilter, setCollectionFilter] = useState<'all' | 'cobrado_total' | 'cobro_pendiente'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pagado_total' | 'pago_pendiente'>('all');

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthKey = todayStr.substring(0, 7);

  // Filtered operations
  const filteredOperations = useMemo(() => {
    return operations.filter(op => {
      // Search text (Name, Code, Client, Responsible)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          op.name.toLowerCase().includes(q) ||
          op.code.toLowerCase().includes(q) ||
          op.clientOrSchool.toLowerCase().includes(q) ||
          op.responsiblePerson.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Channel / Unit filter
      if (channelFilter === 'receptivo_directo') {
        if (op.businessUnit !== 'receptivo' || op.receptiveChannel === 'agencia') return false;
      } else if (channelFilter === 'receptivo_agencia') {
        if (op.businessUnit !== 'receptivo' || op.receptiveChannel !== 'agencia') return false;
      } else if (channelFilter === 'salidas') {
        if (op.businessUnit !== 'salidas' && op.educationalModality !== 'salidas') return false;
      } else if (channelFilter === 'viajes') {
        if (op.businessUnit !== 'viajes' && op.educationalModality !== 'viajes') return false;
      }

      // Status
      if (statusFilter !== 'all' && op.status !== statusFilter) return false;

      // Time (Futuras / Realizadas / Este mes)
      if (timeFilter === 'futuras' && op.date < todayStr) return false;
      if (timeFilter === 'realizadas' && (op.date >= todayStr || op.status !== 'realizada')) return false;
      if (timeFilter === 'este_mes' && !op.date.startsWith(currentMonthKey)) return false;

      // Cobrado vs Pendiente
      const isCobradoTotal = op.receivedRevenue >= op.expectedRevenue && op.expectedRevenue > 0;
      if (collectionFilter === 'cobrado_total' && !isCobradoTotal) return false;
      if (collectionFilter === 'cobro_pendiente' && isCobradoTotal) return false;

      // Pagado vs Pendiente
      const isPagadoTotal = op.paidCost >= op.expectedCost && op.expectedCost > 0;
      if (paymentFilter === 'pagado_total' && !isPagadoTotal) return false;
      if (paymentFilter === 'pago_pendiente' && isPagadoTotal) return false;

      return true;
    });
  }, [operations, searchQuery, channelFilter, statusFilter, timeFilter, collectionFilter, paymentFilter, todayStr, currentMonthKey]);

  // Summary of filtered (distinguishing ARS & USD)
  const summary = useMemo(() => {
    let expRevARS = 0;
    let recRevARS = 0;
    let expCostARS = 0;
    let paidCostARS = 0;

    let expRevUSD = 0;
    let recRevUSD = 0;
    let expCostUSD = 0;
    let paidCostUSD = 0;

    let totalPax = 0;

    filteredOperations.forEach(op => {
      totalPax += op.passengerCount || 0;
      if (op.currency === 'USD') {
        expRevUSD += op.expectedRevenue || 0;
        recRevUSD += op.receivedRevenue || 0;
        expCostUSD += op.expectedCost || 0;
        paidCostUSD += op.paidCost || 0;
      } else {
        expRevARS += op.expectedRevenue || 0;
        recRevARS += op.receivedRevenue || 0;
        expCostARS += op.expectedCost || 0;
        paidCostARS += op.paidCost || 0;
      }
    });

    const expProfitARS = expRevARS - expCostARS;
    const expProfitUSD = expRevUSD - expCostUSD;

    return {
      count: filteredOperations.length,
      totalPax,
      expRevARS,
      recRevARS,
      pendRevARS: Math.max(0, expRevARS - recRevARS),
      expCostARS,
      paidCostARS,
      pendCostARS: Math.max(0, expCostARS - paidCostARS),
      expProfitARS,
      expRevUSD,
      recRevUSD,
      expCostUSD,
      paidCostUSD,
      expProfitUSD
    };
  }, [filteredOperations]);

  // Export to Excel
  const handleExport = () => {
    const buffer = exportOperationsToExcel(filteredOperations);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Master_Operaciones_Cultour_${todayStr}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setChannelFilter('all');
    setStatusFilter('all');
    setTimeFilter('all');
    setCollectionFilter('all');
    setPaymentFilter('all');
  };

  const hasActiveFilters = searchQuery || channelFilter !== 'all' || statusFilter !== 'all' || timeFilter !== 'all' || collectionFilter !== 'all' || paymentFilter !== 'all';

  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#18181a] border border-white/10 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#a5b4fc] bg-[#222224] px-2 py-0.5 rounded border border-white/10">
              Files & Operaciones
            </span>
            <span className="text-xs text-zinc-400 font-mono">Cultour Core</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white font-syne flex items-center gap-2.5">
            <Compass className="w-6 h-6 text-[#a5b4fc]" />
            <span>Master de Operaciones</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Seguimiento integral de Files: Turismo Receptivo (Directo & Agencias B2B) y Turismo Educativo (Salidas & Viajes).
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleExport}
            className="px-3 py-1.5 rounded-lg bg-[#222224] hover:bg-[#28282b] text-zinc-200 border border-white/10 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
            title="Exportar listado actual a Excel"
          >
            <Download className="w-3.5 h-3.5 text-[#34d399]" />
            <span>Exportar Excel</span>
          </button>
          
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-[#222224] hover:bg-[#28282b] text-zinc-200 border border-white/10 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#34d399]" />
            <span>Importar</span>
          </button>

          {currentRole !== 'operativo' && (
            <button
              onClick={() => setIsNewOpModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-[#a5b4fc] hover:bg-[#c7d2fe] text-[#111113] font-mono font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all uppercase tracking-wider"
            >
              <PlusCircle className="w-4 h-4 text-[#111113]" />
              <span>+ Nuevo File</span>
            </button>
          )}
        </div>
      </div>

      {/* Aggregate KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#18181a] border border-white/10 rounded-xl p-3 shadow-sm">
          <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block">Operaciones</span>
          <span className="text-base font-bold text-white font-mono">{summary.count} files</span>
          <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">{summary.totalPax} pasajeros</span>
        </div>

        {currentRole !== 'operativo' ? (
          <>
            <div className="bg-[#18181a] border border-white/10 rounded-xl p-3 shadow-sm">
              <span className="text-[10px] font-mono uppercase font-bold text-[#34d399] block">Ingresos (ARS)</span>
              <span className="text-sm font-bold text-white font-mono">{formatCurrency(summary.expRevARS, 'ARS')}</span>
              <span className="text-[10px] text-[#34d399] font-mono block mt-0.5">Cobrado: {formatCurrency(summary.recRevARS, 'ARS')}</span>
            </div>

            <div className="bg-[#18181a] border border-white/10 rounded-xl p-3 shadow-sm">
              <span className="text-[10px] font-mono uppercase font-bold text-[#34d399] block">Ingresos (USD)</span>
              <span className="text-sm font-bold text-[#a5b4fc] font-mono">{formatCurrency(summary.expRevUSD, 'USD')}</span>
              <span className="text-[10px] text-[#34d399] font-mono block mt-0.5">Cobrado: {formatCurrency(summary.recRevUSD, 'USD')}</span>
            </div>

            <div className="bg-[#18181a] border border-white/10 rounded-xl p-3 shadow-sm">
              <span className="text-[10px] font-mono uppercase font-bold text-[#fb7185] block">Costos Estimados</span>
              <span className="text-sm font-bold text-zinc-200 font-mono">{formatCurrency(summary.expCostARS, 'ARS')}</span>
              {summary.expCostUSD > 0 && (
                <span className="text-[10px] text-[#fb7185] font-mono block mt-0.5">+ {formatCurrency(summary.expCostUSD, 'USD')}</span>
              )}
            </div>

            <div className="bg-[#18181a] border border-white/10 rounded-xl p-3 shadow-sm">
              <span className="text-[10px] font-mono uppercase font-bold text-[#fbbf24] block">Cobro Pendiente</span>
              <span className="text-sm font-bold text-[#fbbf24] font-mono">{formatCurrency(summary.pendRevARS, 'ARS')}</span>
              {summary.expRevUSD - summary.recRevUSD > 0 && (
                <span className="text-[10px] text-[#fbbf24] font-mono block mt-0.5">+ {formatCurrency(summary.expRevUSD - summary.recRevUSD, 'USD')}</span>
              )}
            </div>

            <div className="bg-[#18181a] border border-[#a5b4fc]/30 rounded-xl p-3 shadow-sm bg-indigo-950/20">
              <span className="text-[10px] font-mono uppercase font-bold text-[#a5b4fc] block">Ganancia Proyectada</span>
              <span className="text-sm font-bold text-white font-mono">{formatCurrency(summary.expProfitARS, 'ARS')}</span>
              {summary.expProfitUSD > 0 && (
                <span className="text-[10px] text-[#a5b4fc] font-mono block mt-0.5">+ {formatCurrency(summary.expProfitUSD, 'USD')}</span>
              )}
            </div>
          </>
        ) : (
          <div className="col-span-5 bg-[#18181a] border border-white/10 rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-mono">Modo Operativo Activo (Valores financieros restringidos)</span>
            <span className="text-xs text-[#a5b4fc] font-mono font-bold">Total Pasajeros a Operar: {summary.totalPax}</span>
          </div>
        )}
      </div>

      {/* Multi-Filters Filter Bar */}
      <div className="bg-[#18181a] border border-white/10 rounded-xl p-4 space-y-3 shadow-sm">
        {/* Sub-Channel tabs */}
        <div className="flex flex-wrap items-center bg-[#222224] p-1 rounded-lg border border-white/10 text-xs gap-1">
          <button
            onClick={() => setChannelFilter('all')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              channelFilter === 'all' ? 'bg-[#a5b4fc] text-[#111113]' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Todas ({operations.length})
          </button>
          <button
            onClick={() => setChannelFilter('receptivo_directo')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              channelFilter === 'receptivo_directo' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Receptivo: Directo USD</span>
          </button>
          <button
            onClick={() => setChannelFilter('receptivo_agencia')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              channelFilter === 'receptivo_agencia' ? 'bg-purple-950 text-purple-300 font-bold border border-purple-800' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Receptivo: Agencias B2B</span>
          </button>
          <button
            onClick={() => setChannelFilter('salidas')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              channelFilter === 'salidas' ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-800' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Salidas Educativas</span>
          </button>
          <button
            onClick={() => setChannelFilter('viajes')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              channelFilter === 'viajes' ? 'bg-indigo-950 text-indigo-300 font-bold border border-indigo-800' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Viajes Educativos</span>
          </button>
        </div>

        {/* Secondary search and dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          
          {/* Search box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar file por nombre, código, colegio, responsable..."
              className="w-full bg-[#222224] border border-white/10 rounded-lg pl-8 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#a5b4fc] text-xs font-mono"
            />
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#222224] border border-white/10 rounded-lg px-2.5 py-2 text-zinc-300 focus:outline-none focus:border-[#a5b4fc] text-xs font-mono"
            >
              <option value="all">Estado: Todos</option>
              <option value="confirmada">Confirmada</option>
              <option value="en_curso">En Curso</option>
              <option value="realizada">Realizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          {/* Time filter */}
          <div>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="w-full bg-[#222224] border border-white/10 rounded-lg px-2.5 py-2 text-zinc-300 focus:outline-none focus:border-[#a5b4fc] text-xs font-mono"
            >
              <option value="all">Fechas: Todas</option>
              <option value="futuras">Operaciones Futuras</option>
              <option value="realizadas">Operaciones Realizadas</option>
              <option value="este_mes">Este Mes Actual</option>
            </select>
          </div>

          {/* Cobranza filter */}
          <div>
            <select
              value={collectionFilter}
              onChange={(e) => setCollectionFilter(e.target.value as any)}
              className="w-full bg-[#222224] border border-white/10 rounded-lg px-2.5 py-2 text-zinc-300 focus:outline-none focus:border-[#a5b4fc] text-xs font-mono"
            >
              <option value="all">Cobranza: Todas</option>
              <option value="cobro_pendiente">Cobro Pendiente</option>
              <option value="cobrado_total">100% Cobrado</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs font-mono">
            <span className="text-zinc-400">
              Mostrando <strong className="text-white">{filteredOperations.length}</strong> de <strong className="text-white">{operations.length}</strong> operaciones
            </span>
            <button
              onClick={clearFilters}
              className="text-xs text-[#fb7185] hover:underline flex items-center gap-1 font-bold"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpiar filtros</span>
            </button>
          </div>
        )}
      </div>

      {/* Operations Master Table */}
      <div className="bg-[#18181a] border border-white/10 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#141416] text-zinc-400 uppercase font-mono text-[10px] border-b border-white/10">
              <tr>
                <th className="py-3 px-3.5">Código / File</th>
                <th className="py-3 px-3">Unidad / Canal</th>
                <th className="py-3 px-3">Cliente / Colegio</th>
                <th className="py-3 px-3">Fecha & Pax</th>
                <th className="py-3 px-3">Estado</th>
                {currentRole !== 'operativo' && (
                  <>
                    <th className="py-3 px-3 text-right text-[#34d399]">Ingreso Esp.</th>
                    <th className="py-3 px-3 text-right text-[#34d399]">Cobrado</th>
                    <th className="py-3 px-3 text-right text-[#fbbf24]">Cobro Pend.</th>
                    <th className="py-3 px-3 text-right text-[#fb7185]">Costo Esp.</th>
                    <th className="py-3 px-3 text-right text-[#a5b4fc] font-bold">Ganancia Esp.</th>
                  </>
                )}
                <th className="py-3 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {filteredOperations.length === 0 ? (
                <tr>
                  <td colSpan={currentRole !== 'operativo' ? 11 : 6} className="py-12 text-center text-zinc-500 font-sans">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                    <p className="text-sm font-medium text-zinc-400">No se encontraron operaciones con los filtros aplicados.</p>
                    <button
                      onClick={clearFilters}
                      className="mt-2 text-xs text-[#a5b4fc] font-bold hover:underline font-mono"
                    >
                      Restablecer filtros
                    </button>
                  </td>
                </tr>
              ) : (
                filteredOperations.map((op) => {
                  const pendingRec = Math.max(0, op.expectedRevenue - op.receivedRevenue);
                  const expectedProfit = op.expectedRevenue - op.expectedCost;

                  let channelBadge = (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#222224] text-zinc-400 border border-white/10 font-bold">
                      {op.businessUnit}
                    </span>
                  );

                  if (op.businessUnit === 'receptivo') {
                    channelBadge = op.receptiveChannel === 'agencia' ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                        Receptivo: B2B
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                        Receptivo: Directo
                      </span>
                    );
                  } else if (op.businessUnit === 'salidas') {
                    channelBadge = (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                        Salida Educativa
                      </span>
                    );
                  } else if (op.businessUnit === 'viajes') {
                    channelBadge = (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                        Viaje Educativo
                      </span>
                    );
                  }

                  const statusBadge =
                    op.status === 'confirmada'
                      ? 'bg-indigo-950 text-indigo-300 border-indigo-800'
                      : op.status === 'realizada'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : op.status === 'en_curso'
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-rose-950 text-rose-300 border-rose-800';

                  return (
                    <tr
                      key={op.id}
                      onClick={() => setSelectedOperationId(op.id)}
                      className="hover:bg-[#222224]/50 transition-colors cursor-pointer group"
                    >
                      {/* Name & Code */}
                      <td className="py-3.5 px-3.5 font-sans">
                        <div className="font-bold text-white group-hover:text-[#a5b4fc] transition-colors flex items-center gap-1.5">
                          <span>{op.name}</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 font-mono mt-0.5 flex items-center gap-2">
                          <span className="text-[#a5b4fc] font-bold">{op.code}</span>
                          {op.currency === 'USD' && (
                            <span className="px-1 rounded bg-cyan-950 text-cyan-300 text-[9px] border border-cyan-800">USD</span>
                          )}
                        </div>
                      </td>

                      {/* Channel Badge */}
                      <td className="py-3.5 px-3 font-sans">
                        {channelBadge}
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-3 font-sans text-zinc-300 font-medium max-w-[160px] truncate">
                        {op.clientOrSchool}
                      </td>

                      {/* Date & Pax */}
                      <td className="py-3.5 px-3 text-zinc-400 text-[11px]">
                        <div className="text-white font-mono">{op.date}</div>
                        <div className="text-zinc-500 font-mono text-[10px]">{op.passengerCount} pax</div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 font-sans">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize font-semibold ${statusBadge}`}>
                          {op.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Financial columns */}
                      {currentRole !== 'operativo' && (
                        <>
                          <td className="py-3.5 px-3 text-right text-[#34d399] font-semibold">
                            {formatCurrency(op.expectedRevenue, op.currency)}
                          </td>
                          <td className="py-3.5 px-3 text-right text-[#34d399]">
                            {formatCurrency(op.receivedRevenue, op.currency)}
                          </td>
                          <td className="py-3.5 px-3 text-right text-[#fbbf24]">
                            {pendingRec > 0 ? formatCurrency(pendingRec, op.currency) : '-'}
                          </td>
                          <td className="py-3.5 px-3 text-right text-[#fb7185]">
                            {formatCurrency(op.expectedCost, op.currency)}
                          </td>
                          <td className="py-3.5 px-3 text-right font-bold text-[#a5b4fc]">
                            {formatCurrency(expectedProfit, op.currency)}
                          </td>
                        </>
                      )}

                      {/* Action Chevron */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="p-1 rounded text-zinc-500 group-hover:text-white group-hover:bg-[#222224] transition-all inline-block">
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
