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
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-[#E5E5E1]">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1A1A1A] leading-[1.15]">
            Master de Operaciones<br />
            <span className="italic font-normal">Files, Receptivo & Educativo</span>
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#666666]">
            <span className="text-[#4F46E5] font-medium font-mono">[ Cultour Core Operations ]</span>
            <span className="text-[#D0D0CC]">•</span>
            <span>Seguimiento integral: Receptivo (Directo & Agencias B2B) y Turismo Educativo</span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={handleExport}
            className="px-3.5 py-2 rounded-lg bg-[#FFFFFF] hover:bg-[#F4F4F0] text-[#1A1A1A] border border-[#E5E5E1] text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            title="Exportar listado actual a Excel"
          >
            <Download className="w-3.5 h-3.5 text-[#059669]" />
            <span>Exportar Excel</span>
          </button>
          
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 rounded-lg bg-[#FFFFFF] hover:bg-[#F4F4F0] text-[#1A1A1A] border border-[#E5E5E1] text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#059669]" />
            <span>Importar</span>
          </button>

          {currentRole !== 'operativo' && (
            <button
              onClick={() => setIsNewOpModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-[#1A1A1A] hover:bg-black text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all uppercase tracking-wider cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-white" />
              <span>+ Nuevo File</span>
            </button>
          )}
        </div>
      </div>

      {/* Aggregate KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-mono uppercase font-bold text-[#666666] block">Operaciones</span>
          <span className="text-base font-bold text-[#1A1A1A] font-mono">{summary.count} files</span>
          <span className="text-[10px] text-[#888888] font-mono block mt-0.5">{summary.totalPax} pasajeros</span>
        </div>

        {currentRole !== 'operativo' ? (
          <>
            <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] font-mono uppercase font-bold text-[#059669] block">Ingresos (ARS)</span>
              <span className="text-sm font-bold text-[#1A1A1A] font-mono">{formatCurrency(summary.expRevARS, 'ARS')}</span>
              <span className="text-[10px] text-[#059669] font-mono block mt-0.5">Cobrado: {formatCurrency(summary.recRevARS, 'ARS')}</span>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] font-mono uppercase font-bold text-[#0284C7] block">Ingresos (USD)</span>
              <span className="text-sm font-bold text-[#4F46E5] font-mono">{formatCurrency(summary.expRevUSD, 'USD')}</span>
              <span className="text-[10px] text-[#059669] font-mono block mt-0.5">Cobrado: {formatCurrency(summary.recRevUSD, 'USD')}</span>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] font-mono uppercase font-bold text-[#E11D48] block">Costos Estimados</span>
              <span className="text-sm font-bold text-[#1A1A1A] font-mono">{formatCurrency(summary.expCostARS, 'ARS')}</span>
              {summary.expCostUSD > 0 && (
                <span className="text-[10px] text-[#E11D48] font-mono block mt-0.5">+ {formatCurrency(summary.expCostUSD, 'USD')}</span>
              )}
            </div>

            <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-2xl p-4 shadow-xs">
              <span className="text-[10px] font-mono uppercase font-bold text-[#D97706] block">Cobro Pendiente</span>
              <span className="text-sm font-bold text-[#D97706] font-mono">{formatCurrency(summary.pendRevARS, 'ARS')}</span>
              {summary.expRevUSD - summary.recRevUSD > 0 && (
                <span className="text-[10px] text-[#D97706] font-mono block mt-0.5">+ {formatCurrency(summary.expRevUSD - summary.recRevUSD, 'USD')}</span>
              )}
            </div>

            <div className="bg-[#FFFFFF] border border-indigo-200 rounded-2xl p-4 shadow-xs bg-indigo-50/40">
              <span className="text-[10px] font-mono uppercase font-bold text-[#4F46E5] block">Ganancia Proyectada</span>
              <span className="text-sm font-bold text-[#1A1A1A] font-mono">{formatCurrency(summary.expProfitARS, 'ARS')}</span>
              {summary.expProfitUSD > 0 && (
                <span className="text-[10px] text-[#4F46E5] font-mono block mt-0.5">+ {formatCurrency(summary.expProfitUSD, 'USD')}</span>
              )}
            </div>
          </>
        ) : (
          <div className="col-span-5 bg-[#FFFFFF] border border-[#E5E5E1] rounded-2xl p-4 flex items-center justify-between shadow-xs">
            <span className="text-xs text-[#666666] font-mono">Modo Operativo Activo (Valores financieros restringidos)</span>
            <span className="text-xs text-[#4F46E5] font-mono font-bold">Total Pasajeros a Operar: {summary.totalPax}</span>
          </div>
        )}
      </div>

      {/* Multi-Filters Filter Bar */}
      <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-xl p-4 space-y-3 shadow-xs">
        {/* Sub-Channel tabs */}
        <div className="flex flex-wrap items-center bg-[#F4F4F0] p-1 rounded-lg border border-[#E5E5E1] text-xs gap-1">
          <button
            onClick={() => setChannelFilter('all')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
              channelFilter === 'all' ? 'bg-[#1A1A1A] text-white shadow-xs' : 'text-[#666666] hover:text-[#1A1A1A]'
            }`}
          >
            Todas ({operations.length})
          </button>
          <button
            onClick={() => setChannelFilter('receptivo_directo')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              channelFilter === 'receptivo_directo' ? 'bg-cyan-50 text-cyan-800 font-bold border border-cyan-300' : 'text-[#666666] hover:text-[#1A1A1A]'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Receptivo: Directo USD</span>
          </button>
          <button
            onClick={() => setChannelFilter('receptivo_agencia')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              channelFilter === 'receptivo_agencia' ? 'bg-purple-50 text-purple-800 font-bold border border-purple-300' : 'text-[#666666] hover:text-[#1A1A1A]'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Receptivo: Agencias B2B</span>
          </button>
          <button
            onClick={() => setChannelFilter('salidas')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              channelFilter === 'salidas' ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-300' : 'text-[#666666] hover:text-[#1A1A1A]'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Salidas Educativas</span>
          </button>
          <button
            onClick={() => setChannelFilter('viajes')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              channelFilter === 'viajes' ? 'bg-indigo-50 text-indigo-800 font-bold border border-indigo-300' : 'text-[#666666] hover:text-[#1A1A1A]'
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
            <Search className="w-3.5 h-3.5 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar file por nombre, código, colegio, responsable..."
              className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg pl-8 pr-3 py-2 text-[#1A1A1A] placeholder-[#888888] focus:outline-none focus:border-[#4F46E5] text-xs font-mono transition-colors"
            />
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-2.5 py-2 text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5] text-xs font-mono"
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
              className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-2.5 py-2 text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5] text-xs font-mono"
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
              className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-2.5 py-2 text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5] text-xs font-mono"
            >
              <option value="all">Cobranza: Todas</option>
              <option value="cobro_pendiente">Cobro Pendiente</option>
              <option value="cobrado_total">100% Cobrado</option>
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-[#E5E5E1] text-xs font-mono">
            <span className="text-[#666666]">
              Mostrando <strong className="text-[#1A1A1A]">{filteredOperations.length}</strong> de <strong className="text-[#1A1A1A]">{operations.length}</strong> operaciones
            </span>
            <button
              onClick={clearFilters}
              className="text-xs text-[#E11D48] hover:underline flex items-center gap-1 font-bold cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpiar filtros</span>
            </button>
          </div>
        )}
      </div>

      {/* Operations Master Table */}
      <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F9F9F7] text-[#666666] uppercase font-mono text-[10px] border-b border-[#E5E5E1]">
              <tr>
                <th className="py-3 px-3.5 font-semibold">Código / File</th>
                <th className="py-3 px-3 font-semibold">Unidad / Canal</th>
                <th className="py-3 px-3 font-semibold">Cliente / Colegio</th>
                <th className="py-3 px-3 font-semibold">Fecha & Pax</th>
                <th className="py-3 px-3 font-semibold">Estado</th>
                {currentRole !== 'operativo' && (
                  <>
                    <th className="py-3 px-3 text-right text-[#059669] font-semibold">Ingreso Esp.</th>
                    <th className="py-3 px-3 text-right text-[#059669] font-semibold">Cobrado</th>
                    <th className="py-3 px-3 text-right text-[#D97706] font-semibold">Cobro Pend.</th>
                    <th className="py-3 px-3 text-right text-[#E11D48] font-semibold">Costo Esp.</th>
                    <th className="py-3 px-3 text-right text-[#4F46E5] font-bold">Ganancia Esp.</th>
                  </>
                )}
                <th className="py-3 px-3 text-center font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E1] font-mono">
              {filteredOperations.length === 0 ? (
                <tr>
                  <td colSpan={currentRole !== 'operativo' ? 11 : 6} className="py-12 text-center text-[#888888] font-sans">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-[#888888]" />
                    <p className="text-sm font-medium text-[#666666]">No se encontraron operaciones con los filtros aplicados.</p>
                    <button
                      onClick={clearFilters}
                      className="mt-2 text-xs text-[#4F46E5] font-bold hover:underline font-mono cursor-pointer"
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
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#F4F4F0] text-[#666666] border border-[#E5E5E1] font-bold">
                      {op.businessUnit}
                    </span>
                  );

                  if (op.businessUnit === 'receptivo') {
                    channelBadge = op.receptiveChannel === 'agencia' ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                        Receptivo: B2B
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200 font-bold">
                        Receptivo: Directo
                      </span>
                    );
                  } else if (op.businessUnit === 'salidas') {
                    channelBadge = (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                        Salida Educativa
                      </span>
                    );
                  } else if (op.businessUnit === 'viajes') {
                    channelBadge = (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                        Viaje Educativo
                      </span>
                    );
                  }

                  const statusBadge =
                    op.status === 'confirmada'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : op.status === 'realizada'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : op.status === 'en_curso'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200';

                  return (
                    <tr
                      key={op.id}
                      onClick={() => setSelectedOperationId(op.id)}
                      className="hover:bg-[#F4F4F0]/60 transition-colors cursor-pointer group"
                    >
                      {/* Name & Code */}
                      <td className="py-3.5 px-3.5 font-sans">
                        <div className="font-bold text-[#1A1A1A] group-hover:text-[#4F46E5] transition-colors flex items-center gap-1.5">
                          <span>{op.name}</span>
                        </div>
                        <div className="text-[11px] text-[#666666] font-mono mt-0.5 flex items-center gap-2">
                          <span className="text-[#4F46E5] font-bold">{op.code}</span>
                          {op.currency === 'USD' && (
                            <span className="px-1 rounded bg-cyan-50 text-cyan-700 text-[9px] border border-cyan-200 font-bold">USD</span>
                          )}
                        </div>
                      </td>

                      {/* Channel Badge */}
                      <td className="py-3.5 px-3 font-sans">
                        {channelBadge}
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-3 font-sans text-[#1A1A1A] font-medium max-w-[160px] truncate">
                        {op.clientOrSchool}
                      </td>

                      {/* Date & Pax */}
                      <td className="py-3.5 px-3 text-[#666666] text-[11px]">
                        <div className="text-[#1A1A1A] font-mono">{op.date}</div>
                        <div className="text-[#888888] font-mono text-[10px]">{op.passengerCount} pax</div>
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
                          <td className="py-3.5 px-3 text-right text-[#059669] font-semibold">
                            {formatCurrency(op.expectedRevenue, op.currency)}
                          </td>
                          <td className="py-3.5 px-3 text-right text-[#059669]">
                            {formatCurrency(op.receivedRevenue, op.currency)}
                          </td>
                          <td className="py-3.5 px-3 text-right text-[#D97706]">
                            {pendingRec > 0 ? formatCurrency(pendingRec, op.currency) : '-'}
                          </td>
                          <td className="py-3.5 px-3 text-right text-[#E11D48]">
                            {formatCurrency(op.expectedCost, op.currency)}
                          </td>
                          <td className="py-3.5 px-3 text-right font-bold text-[#4F46E5]">
                            {formatCurrency(expectedProfit, op.currency)}
                          </td>
                        </>
                      )}

                      {/* Action Chevron */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="p-1 rounded text-[#888888] group-hover:text-[#1A1A1A] group-hover:bg-[#E5E5E1] transition-all inline-block">
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
