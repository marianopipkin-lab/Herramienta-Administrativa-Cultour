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
  ChevronRight
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
    setIsImportModalOpen
  } = useApp();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [buFilter, setBuFilter] = useState<string>('all');
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

      // BU
      if (buFilter !== 'all' && op.businessUnit !== buFilter) return false;

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
  }, [operations, searchQuery, buFilter, statusFilter, timeFilter, collectionFilter, paymentFilter, todayStr, currentMonthKey]);

  // Summary of filtered
  const summary = useMemo(() => {
    let expRev = 0;
    let recRev = 0;
    let expCost = 0;
    let paidCost = 0;

    filteredOperations.forEach(op => {
      expRev += op.expectedRevenue || 0;
      recRev += op.receivedRevenue || 0;
      expCost += op.expectedCost || 0;
      paidCost += op.paidCost || 0;
    });

    const expProfit = expRev - expCost;
    const realizedProfit = recRev - paidCost;

    return {
      count: filteredOperations.length,
      expRev,
      recRev,
      pendRev: Math.max(0, expRev - recRev),
      expCost,
      paidCost,
      pendCost: Math.max(0, expCost - paidCost),
      expProfit,
      realizedProfit,
      margin: expRev > 0 ? (expProfit / expRev) * 100 : 0
    };
  }, [filteredOperations]);

  // Export to Excel
  const handleExport = () => {
    const buffer = exportOperationsToExcel(filteredOperations);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Master_Operaciones_${todayStr}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setBuFilter('all');
    setStatusFilter('all');
    setTimeFilter('all');
    setCollectionFilter('all');
    setPaymentFilter('all');
  };

  const hasActiveFilters = searchQuery || buFilter !== 'all' || statusFilter !== 'all' || timeFilter !== 'all' || collectionFilter !== 'all' || paymentFilter !== 'all';

  return (
    <div className="space-y-5 pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-indigo-600" />
            <span>Master de Operaciones</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Sistema operativo central: seguimiento financiero, estado de cobranzas, costos de proveedores y rentabilidad unitaria.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleExport}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Exportar listado actual a Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exportar Excel</span>
          </button>
          
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Importar</span>
          </button>

          <button
            onClick={() => setIsNewOpModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium flex items-center gap-1.5 shadow-xs transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Nueva Operación</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Ribbon for filtered results */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-gray-400 block">Operaciones</span>
          <span className="text-base font-bold text-gray-900 font-mono">{summary.count}</span>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-emerald-700 block">Ingreso Esperado</span>
          <span className="text-base font-bold text-emerald-700 font-mono">{formatCurrency(summary.expRev)}</span>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-emerald-700 block">Cobrado / Pendiente</span>
          <div className="text-xs font-mono font-semibold">
            <span className="text-emerald-700">{formatCurrency(summary.recRev)}</span>
            <span className="text-gray-400"> / </span>
            <span className="text-amber-700">{formatCurrency(summary.pendRev)}</span>
          </div>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-rose-700 block">Costo Esperado</span>
          <span className="text-base font-bold text-rose-700 font-mono">{formatCurrency(summary.expCost)}</span>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-gray-600 block">Pagado / Pendiente</span>
          <div className="text-xs font-mono font-semibold">
            <span className="text-gray-800">{formatCurrency(summary.paidCost)}</span>
            <span className="text-gray-400"> / </span>
            <span className="text-amber-700">{formatCurrency(summary.pendCost)}</span>
          </div>
        </div>
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-indigo-700 block">Ganancia Esperada</span>
          <span className="text-base font-bold text-indigo-900 font-mono">{formatCurrency(summary.expProfit)}</span>
          <span className="text-[10px] text-indigo-600 font-mono block font-medium">Margen: {formatPercent(summary.margin)}</span>
        </div>
      </div>

      {/* Multi-Filters Filter Bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 space-y-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          
          {/* Search box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, colegio, código..."
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs"
            />
          </div>

          {/* Business Unit filter */}
          <div>
            <select
              value={buFilter}
              onChange={(e) => setBuFilter(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-gray-700 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs"
            >
              <option value="all">Todas las Unidades</option>
              <option value="receptivo">Turismo Receptivo</option>
              <option value="salidas">Salidas Educativas</option>
              <option value="viajes">Viajes Educativos</option>
            </select>
          </div>

          {/* Time filter */}
          <div>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-gray-700 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs"
            >
              <option value="all">Todas las Fechas</option>
              <option value="futuras">Operaciones Futuras</option>
              <option value="realizadas">Operaciones Realizadas</option>
              <option value="este_mes">Este Mes (Actual)</option>
            </select>
          </div>

          {/* Cobranza filter */}
          <div>
            <select
              value={collectionFilter}
              onChange={(e) => setCollectionFilter(e.target.value as any)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-gray-700 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs"
            >
              <option value="all">Estado de Cobro (Todos)</option>
              <option value="cobro_pendiente">Cobro Pendiente</option>
              <option value="cobrado_total">100% Cobrado</option>
            </select>
          </div>

          {/* Pago Proveedores filter */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-gray-700 focus:outline-none focus:border-indigo-500 focus:bg-white text-xs"
            >
              <option value="all">Estado de Pago (Todos)</option>
              <option value="pago_pendiente">Pago Pendiente</option>
              <option value="pagado_total">100% Pagado</option>
            </select>
          </div>

        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
            <span className="text-gray-500">
              Mostrando <strong className="text-gray-800">{filteredOperations.length}</strong> de <strong className="text-gray-800">{operations.length}</strong> operaciones
            </span>
            <button
              onClick={clearFilters}
              className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpiar filtros</span>
            </button>
          </div>
        )}
      </div>

      {/* Operations Master Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-[#E5E7EB] text-[10px]">
              <tr>
                <th className="py-3 px-3.5">Código / Operación</th>
                <th className="py-3 px-3">Unidad</th>
                <th className="py-3 px-3">Cliente / Colegio</th>
                <th className="py-3 px-3">Fecha</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-3 text-right text-emerald-700">Ingreso Esp.</th>
                <th className="py-3 px-3 text-right text-emerald-700">Cobrado</th>
                <th className="py-3 px-3 text-right text-amber-700">Cobro Pend.</th>
                <th className="py-3 px-3 text-right text-rose-700">Costo Esp.</th>
                <th className="py-3 px-3 text-right text-gray-600">Pagado</th>
                <th className="py-3 px-3 text-right text-amber-700">Costo Pend.</th>
                <th className="py-3 px-3 text-right text-indigo-700 font-bold">Ganancia Esp.</th>
                <th className="py-3 px-3 text-right text-emerald-700">Res. a la Fecha</th>
                <th className="py-3 px-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {filteredOperations.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-gray-400 font-sans">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm font-medium text-gray-600">No se encontraron operaciones con los filtros aplicados.</p>
                    <button
                      onClick={clearFilters}
                      className="mt-2 text-xs text-indigo-600 font-semibold hover:underline"
                    >
                      Restablecer filtros
                    </button>
                  </td>
                </tr>
              ) : (
                filteredOperations.map((op) => {
                  const pendingRec = Math.max(0, op.expectedRevenue - op.receivedRevenue);
                  const pendingCost = Math.max(0, op.expectedCost - op.paidCost);
                  const expectedProfit = op.expectedRevenue - op.expectedCost;
                  const realizedProfit = op.receivedRevenue - op.paidCost;

                  const buBadge =
                    op.businessUnit === 'receptivo'
                      ? 'bg-cyan-50 text-cyan-700 border-cyan-100'
                      : op.businessUnit === 'salidas'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-100';

                  const buLabel =
                    op.businessUnit === 'receptivo'
                      ? 'Receptivo'
                      : op.businessUnit === 'salidas'
                      ? 'Salidas'
                      : 'Viajes';

                  const statusBadge =
                    op.status === 'confirmada'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                      : op.status === 'realizada'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : op.status === 'en_curso'
                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                      : 'bg-rose-50 text-rose-700 border-rose-100';

                  return (
                    <tr
                      key={op.id}
                      onClick={() => setSelectedOperationId(op.id)}
                      className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Name & Code */}
                      <td className="py-3.5 px-3.5 font-sans">
                        <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                          <span>{op.name}</span>
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5 flex items-center gap-2">
                          <span className="text-indigo-600 font-semibold">{op.code}</span>
                          <span>•</span>
                          <span>{op.passengerCount} pax</span>
                        </div>
                      </td>

                      {/* BU */}
                      <td className="py-3.5 px-3 font-sans">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${buBadge}`}>
                          {buLabel}
                        </span>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-3 font-sans text-gray-700 font-medium max-w-[160px] truncate">
                        {op.clientOrSchool}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-3 text-gray-600 text-[11px]">
                        {op.date}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 font-sans">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize font-semibold ${statusBadge}`}>
                          {op.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Expected Rev */}
                      <td className="py-3.5 px-3 text-right text-emerald-700 font-semibold">
                        {formatCurrency(op.expectedRevenue)}
                      </td>

                      {/* Received Rev */}
                      <td className="py-3.5 px-3 text-right text-emerald-700">
                        {formatCurrency(op.receivedRevenue)}
                      </td>

                      {/* Pending Rev */}
                      <td className="py-3.5 px-3 text-right text-amber-700">
                        {pendingRec > 0 ? formatCurrency(pendingRec) : '-'}
                      </td>

                      {/* Expected Cost */}
                      <td className="py-3.5 px-3 text-right text-rose-700">
                        {formatCurrency(op.expectedCost)}
                      </td>

                      {/* Paid Cost */}
                      <td className="py-3.5 px-3 text-right text-gray-700">
                        {formatCurrency(op.paidCost)}
                      </td>

                      {/* Pending Cost */}
                      <td className="py-3.5 px-3 text-right text-amber-700">
                        {pendingCost > 0 ? formatCurrency(pendingCost) : '-'}
                      </td>

                      {/* Expected Profit */}
                      <td className="py-3.5 px-3 text-right font-bold text-indigo-700">
                        {formatCurrency(expectedProfit)}
                      </td>

                      {/* Realized to date */}
                      <td className="py-3.5 px-3 text-right font-semibold text-emerald-700">
                        {formatCurrency(realizedProfit)}
                      </td>

                      {/* Action Chevron */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="p-1 rounded-lg text-gray-400 group-hover:text-white group-hover:bg-indigo-600 transition-all inline-block">
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
