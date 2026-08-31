import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Trash2,
  Edit2,
  Mail,
  Phone,
  CreditCard,
  Building,
  CheckCircle2,
  Tag,
  FileSpreadsheet,
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronRight,
  Filter,
  DollarSign,
  Copy,
  Check,
  LayoutGrid,
  List
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Supplier, AccountId } from '../../types';
import { formatCurrency } from '../../utils/financialCalculations';
import { getSupplierSummaryStats } from './supplierUtils';
import { SupplierDetailModal } from './SupplierDetailModal';

export const SuppliersMaster: React.FC = () => {
  const {
    suppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    accounts,
    operations,
    openImportCenter
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterAlertStatus, setFilterAlertStatus] = useState<'all' | 'vencido' | 'urgente_15d' | 'pendiente' | 'al_dia'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSupplierForDetail, setSelectedSupplierForDetail] = useState<Supplier | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [form, setForm] = useState<{
    name: string;
    mpAlias: string;
    cbu: string;
    category: string;
    serviceDescription: string;
    contactName: string;
    phone: string;
    email: string;
    defaultAccountId: AccountId;
  }>({
    name: '',
    mpAlias: '',
    cbu: '',
    category: 'Transporte',
    serviceDescription: '',
    contactName: '',
    phone: '',
    email: '',
    defaultAccountId: 'banco_santander'
  });

  const categories = [
    'Transporte',
    'Alojamiento',
    'Gastronomía',
    'Guías',
    'Seguros',
    'Entradas',
    'Coordinación',
    'Otros'
  ];

  // Map each supplier to its aggregated financial stats
  const suppliersWithStats = useMemo(() => {
    return suppliers.map(supplier => {
      const stats = getSupplierSummaryStats(supplier, operations);
      return {
        supplier,
        stats
      };
    });
  }, [suppliers, operations]);

  // Global KPIs across all suppliers
  const globalStats = useMemo(() => {
    let totalContracted = 0;
    let totalPaid = 0;
    let totalBalance = 0;
    let totalExpired = 0;
    let totalUrgent15d = 0;
    let suppliersWithDebtCount不易 = 0;

    suppliersWithStats.forEach(({ stats }) => {
      totalContracted += stats.totalContracted;
      totalPaid += stats.totalPaid;
      totalBalance += stats.totalBalance;
      if (stats.hasExpired) totalExpired++;
      if (stats.hasUrgent15d && !stats.hasExpired) totalUrgent15d++;
      if (stats.totalBalance > 0) suppliersWithDebtCount不易++;
    });

    return {
      totalContracted,
      totalPaid,
      totalBalance,
      totalExpired,
      totalUrgent15d,
      suppliersWithDebtCount: suppliersWithDebtCount不易
    };
  }, [suppliersWithStats]);

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliersWithStats.filter(({ supplier, stats }) => {
      if (selectedCategory !== 'all' && supplier.category !== selectedCategory) return false;
      
      // Filter by alert / payment status
      if (filterAlertStatus === 'vencido' && !stats.hasExpired) return false;
      if (filterAlertStatus === 'urgente_15d' && !stats.hasUrgent15d) return false;
      if (filterAlertStatus === 'pendiente' && stats.totalBalance <= 0) return false;
      if (filterAlertStatus === 'al_dia' && stats.totalBalance > 0) return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const q综合 = searchQuery.toLowerCase();
        const matchName = supplier.name.toLowerCase().includes(q综合);
        const matchAlias進 = supplier.mpAlias?.toLowerCase().includes(q综合);
        const matchContact = supplier.contactName?.toLowerCase().includes(q综合);
        const matchCbu = supplier.cbu?.includes(q综合);
        const matchCategory = supplier.category.toLowerCase().includes(q综合);
        if (!matchName && !matchAlias進 && !matchContact && !matchCbu && !matchCategory) return false;
      }
      return true;
    });
  }, [suppliersWithStats, selectedCategory, filterAlertStatus, searchQuery]);

  const handleCopyAlias = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddSubmit拼 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      alert('Por favor ingrese el nombre del proveedor.');
      return;
    }

    addSupplier({
      name: form.name,
      mpAlias: form.mpAlias || undefined,
      cbu: form.cbu || undefined,
      category: form.category,
      serviceDescription: form.serviceDescription || form.category,
      contactName: form.contactName || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      defaultAccountId: form.defaultAccountId,
      active: true
    });

    setShowAddModal(false);
    setForm({
      name: '',
      mpAlias: '',
      cbu: '',
      category: 'Transporte',
      serviceDescription: '',
      contactName: '',
      phone: '',
      email: '',
      defaultAccountId: 'banco_santander'
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-[#E5E5E1]">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1A1A1A] leading-[1.15]">
            Maestro de Proveedores<br />
            <span className="italic font-normal">Cuentas por Pagar, Vencimientos & Alias MP</span>
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#666666]">
            <span className="text-indigo-600 font-medium font-mono">[ Control Unificado de Prestadores ]</span>
            <span className="text-[#D0D0CC]">•</span>
            <span>Total registrados: <strong className="text-[#1A1A1A] font-mono">{suppliers.length}</strong></span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => openImportCenter('suppliers')}
            className="px-3.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center gap-2 transition-all shadow-2xs font-mono cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Importar Proveedores</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#1A1A1A] hover:bg-black text-white rounded-lg font-bold text-xs flex items-center gap-2 transition-all shadow-sm font-mono uppercase cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Proveedor</span>
          </button>
        </div>
      </div>

      {/* Financial Overview KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] border border-[#E5E5E1] p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#666666] mb-1">
            <span className="text-[11px] font-mono uppercase font-bold text-[#666666]">Total Contratado</span>
            <Building className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-mono font-normal text-[#1A1A1A]">
            {formatCurrency(globalStats.totalContracted)}
          </div>
          <p className="text-[11px] text-[#888888] font-mono mt-1">Suma global de contratos y servicios</p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5E5E1] p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#666666] mb-1">
            <span className="text-[11px] font-mono uppercase font-bold text-[#666666]">Total Pagado</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-mono font-normal text-emerald-700">
            {formatCurrency(globalStats.totalPaid)}
          </div>
          <p className="text-[11px] text-[#888888] font-mono mt-1">
            {globalStats.totalContracted > 0
              ? `${Math.round((globalStats.totalPaid / globalStats.totalContracted) * 100)}% cancelado`
              : '100% al día'}
          </p>
        </div>

        <div className={`p-4 rounded-xl border shadow-xs ${
          globalStats.totalBalance > 0
            ? globalStats.totalExpired > 0
              ? 'bg-rose-50/40 border-rose-200'
              : 'bg-amber-50/40 border-amber-200'
            : 'bg-white border-[#E5E5E1]'
        }`}>
          <div className="flex items-center justify-between text-[#666666] mb-1">
            <span className="text-[11px] font-mono uppercase font-bold text-[#666666]">Saldo Pendiente</span>
            <DollarSign className="w-4 h-4 text-[#1A1A1A]" />
          </div>
          <div className={`text-2xl font-mono font-normal ${
            globalStats.totalBalance > 0 ? (globalStats.totalExpired > 0 ? 'text-rose-700' : 'text-amber-700') : 'text-emerald-700'
          }`}>
            {formatCurrency(globalStats.totalBalance)}
          </div>
          <p className="text-[11px] text-[#666666] font-mono mt-1">
            {globalStats.suppliersWithDebtCount} proveedor{globalStats.suppliersWithDebtCount !== 1 ? 'es' : ''} con saldo a liquidar
          </p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5E5E1] p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#666666] mb-1">
            <span className="text-[11px] font-mono uppercase font-bold text-[#666666]">Vencimientos & Alertas</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-mono font-normal text-rose-700">
              {globalStats.totalExpired}
            </span>
            <span className="text-xs font-mono text-rose-600 font-bold">Vencidos</span>
            <span className="text-[#D0D0CC]">•</span>
            <span className="text-lg font-mono text-amber-700 font-medium">
              {globalStats.totalUrgent15d}
            </span>
            <span className="text-xs font-mono text-amber-600 font-medium">≤15d</span>
          </div>
          <p className="text-[11px] text-[#888888] font-mono mt-1">Alertas operativas prioritarias</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E5E5E1] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por proveedor, alias MP, CBU, contacto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAFAF8] border border-[#E5E5E1] rounded-xl pl-9 pr-4 py-2 text-xs text-[#1A1A1A] placeholder-gray-400 focus:outline-none focus:border-indigo-500 font-sans"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Selector */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#FAFAF8] border border-[#E5E5E1] rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500 font-sans cursor-pointer"
          >
            <option value="all">Todos los Rubros</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Alert Status Filter */}
          <select
            value={filterAlertStatus}
            onChange={(e) => setFilterAlertStatus(e.target.value as any)}
            className="bg-[#FAFAF8] border border-[#E5E5E1] rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500 font-sans cursor-pointer"
          >
            <option value="all">Todos los Estados</option>
            <option value="vencido">🔴 Con Deuda Vencida</option>
            <option value="urgente_15d">🟡 Vence en ≤15 Días</option>
            <option value="pendiente">Con Saldo Pendiente</option>
            <option value="al_dia">🟢 Al Día / Saldados</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-[#E5E5E1] rounded-xl p-0.5 bg-[#FAFAF8]">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-gray-400 hover:text-gray-700'
              }`}
              title="Vista de Tabla"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-gray-400 hover:text-gray-700'
              }`}
              title="Vista de Tarjetas"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Table View */}
      {viewMode === 'table' ? (
        <div className="bg-white border border-[#E5E5E1] rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9F9F7] text-[#666666] uppercase tracking-wider font-semibold border-b border-[#E5E5E1] text-[10px] font-mono">
                <tr>
                  <th className="py-3.5 px-4">Proveedor / Rubro</th>
                  <th className="py-3.5 px-4">Alias MP / CBU</th>
                  <th className="py-3.5 px-4 text-center">Files</th>
                  <th className="py-3.5 px-4 text-right">Total Contratado</th>
                  <th className="py-3.5 px-4 text-right">Total Pagado</th>
                  <th className="py-3.5 px-4 text-right">Saldo Pendiente</th>
                  <th className="py-3.5 px-4">Estado Vencimientos</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E1] font-mono">
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400 font-sans">
                      No se encontraron proveedores que coincidan con los filtros de búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map(({ supplier, stats }) => {
                    const isExpired = stats.hasExpired;
                    const isUrgent15 = !isExpired && stats.hasUrgent15d;
                    const isFullyPaid = stats.totalBalance <= 0;

                    return (
                      <tr
                        key={supplier.id}
                        onClick={() => setSelectedSupplierForDetail(supplier)}
                        className={`transition-colors cursor-pointer group ${
                          isExpired
                            ? 'bg-rose-50/20 hover:bg-rose-50/50'
                            : isUrgent15
                            ? 'bg-amber-50/20 hover:bg-amber-50/50'
                            : 'hover:bg-[#F9F9F7]'
                        }`}
                      >
                        {/* Supplier Name & Category */}
                        <td className="py-3.5 px-4 font-sans">
                          <div className="flex flex-col">
                            <span className="font-bold text-xs text-gray-900 group-hover:text-indigo-600 transition-colors">
                              {supplier.name}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {supplier.category}
                              </span>
                              {supplier.contactName && (
                                <span className="text-[11px] text-gray-500 truncate max-w-[140px]">
                                  {supplier.contactName}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* MP Alias / CBU */}
                        <td className="py-3.5 px-4 font-sans">
                          {supplier.mpAlias ? (
                            <div className="flex items-center gap-1.5 font-mono text-indigo-700">
                              <span className="font-semibold text-xs">{supplier.mpAlias}</span>
                              <button
                                onClick={(e) => handleCopyAlias(supplier.mpAlias!, supplier.id, e)}
                                className="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                                title="Copiar alias MP"
                              >
                                {copiedId === supplier.id ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          ) : supplier.cbu ? (
                            <span className="font-mono text-[10px] text-gray-600 truncate max-w-[140px] block">
                              CBU: {supplier.cbu}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">Sin alias registrado</span>
                          )}
                        </td>

                        {/* Files Count */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800 font-bold text-xs">
                            {stats.operationsCount}
                          </span>
                        </td>

                        {/* Total Contratado */}
                        <td className="py-3.5 px-4 text-right font-bold text-gray-900 text-xs">
                          {formatCurrency(stats.totalContracted)}
                        </td>

                        {/* Total Pagado */}
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-700 text-xs">
                          {formatCurrency(stats.totalPaid)}
                        </td>

                        {/* Saldo Pendiente */}
                        <td className={`py-3.5 px-4 text-right font-bold text-xs ${
                          stats.totalBalance > 0
                            ? isExpired
                              ? 'text-rose-700'
                              : isUrgent15
                              ? 'text-amber-700'
                              : 'text-gray-900'
                            : 'text-gray-400'
                        }`}>
                          {formatCurrency(stats.totalBalance)}
                        </td>

                        {/* Estado Vencimientos */}
                        <td className="py-3.5 px-4 font-sans whitespace-nowrap">
                          {isFullyPaid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Al día (Saldado)</span>
                            </span>
                          ) : isExpired ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>{stats.expiredCount} Vencido{stats.expiredCount > 1 ? 's' : ''} ({formatCurrency(stats.expiredAmount)})</span>
                            </span>
                          ) : isUrgent15 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>{stats.urgent15dCount} Vence en ≤15d</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                              <span>En fecha ({formatCurrency(stats.totalBalance)})</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center font-sans whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setSelectedSupplierForDetail(supplier)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Ver Desglose fila por fila"
                            >
                              <span>Desglose</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setEditingSupplier(supplier)}
                              className="p-1.5 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Editar proveedor"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`¿Eliminar al proveedor "${supplier.name}"?`)) {
                                  deleteSupplier(supplier.id);
                                }
                              }}
                              className="p-1.5 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Eliminar proveedor"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards / Bento Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map(({ supplier, stats }) => {
            const isExpired不易 = stats.hasExpired;
            const isUrgent15 = !isExpired不易 && stats.hasUrgent15d;
            const isFullyPaid = stats.totalBalance <= 0;

            return (
              <div
                key={supplier.id}
                onClick={() => setSelectedSupplierForDetail(supplier)}
                className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all cursor-pointer group hover:shadow-md ${
                  isExpired不易
                    ? 'border-rose-300 hover:border-rose-400 bg-rose-50/10'
                    : isUrgent15
                    ? 'border-amber-300 hover:border-amber-400 bg-amber-50/10'
                    : 'border-[#E5E5E1] hover:border-gray-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {supplier.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold font-mono">
                          {supplier.category}
                        </span>
                        <span className="text-[11px] font-mono text-gray-500">
                          {stats.operationsCount} file{stats.operationsCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setEditingSupplier(supplier)}
                        className="p-1.5 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Editar proveedor"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar al proveedor "${supplier.name}"?`)) {
                            deleteSupplier(supplier.id);
                          }
                        }}
                        className="p-1.5 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Eliminar proveedor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">{supplier.serviceDescription}</p>

                  {/* Payment Alias / CBU Box */}
                  <div className="mt-3 bg-[#F9F9F7] p-2.5 rounded-xl border border-[#E5E5E1] space-y-1.5 text-[11px]">
                    {supplier.mpAlias && (
                      <div className="flex items-center justify-between text-indigo-700 font-mono">
                        <span className="text-gray-500 font-sans text-[10px]">Alias MP:</span>
                        <div className="flex items-center gap-1">
                          <span className="font-bold">{supplier.mpAlias}</span>
                          <button
                            onClick={(e) => handleCopyAlias(supplier.mpAlias!, supplier.id, e)}
                            className="p-0.5 text-gray-400 hover:text-indigo-600"
                          >
                            {copiedId === supplier.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    )}
                    {supplier.cbu && (
                      <div className="flex items-center justify-between text-gray-700 font-mono text-[10px]">
                        <span className="text-gray-500 font-sans">CBU:</span>
                        <span className="truncate max-w-[170px]">{supplier.cbu}</span>
                      </div>
                    )}
                    {supplier.contactName && (
                      <div className="flex items-center justify-between text-gray-700 text-[10px]">
                        <span className="text-gray-500">Contacto:</span>
                        <span>{supplier.contactName} ({supplier.phone || '-'})</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Summary & Alert Status */}
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-[9px] text-gray-500 block uppercase">Contratado</span>
                      <span className="font-bold text-gray-900 text-[11px]">{formatCurrency(stats.totalContracted)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 block uppercase">Pagado</span>
                      <span className="font-bold text-emerald-700 text-[11px]">{formatCurrency(stats.totalPaid)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-gray-500 block uppercase">Saldo</span>
                      <span className={`font-bold text-[11px] ${
                        stats.totalBalance > 0 ? (isExpired不易 ? 'text-rose-700' : 'text-amber-700') : 'text-gray-400'
                      }`}>
                        {formatCurrency(stats.totalBalance)}
                      </span>
                    </div>
                  </div>

                  {/* Status pill & Button */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      {isFullyPaid ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Al día</span>
                        </span>
                      ) : isExpired不易 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>{stats.expiredCount} Vencido</span>
                        </span>
                      ) : isUrgent15 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>≤15d por vencer</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-gray-500">
                          En fecha
                        </span>
                      )}
                    </div>

                    <span className="text-xs text-indigo-600 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Ver Desglose
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Supplier Detail Breakdown Modal */}
      {selectedSupplierForDetail && (
        <SupplierDetailModal
          supplier={selectedSupplierForDetail}
          onClose={() => setSelectedSupplierForDetail(null)}
          onEdit={(s) => {
            setSelectedSupplierForDetail(null);
            setEditingSupplier(s);
          }}
        />
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white border border-[#E5E5E1] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-xs">
            <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Nuevo Proveedor / Prestador</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit拼} className="p-6 space-y-3">
              <div>
                <label className="block text-gray-600 mb-1">Razón Social / Nombre Comercial *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="ej. Empresa de Transporte Andes SRL"
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1">Rubro</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-800 focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-600 mb-1">Alias Mercado Pago</label>
                  <input
                    type="text"
                    value={form.mpAlias}
                    onChange={(e) => setForm({ ...form, mpAlias: e.target.value })}
                    placeholder="ej. andes.transporte.mp"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-indigo-700 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-1">CBU / CVU Bancario</label>
                <input
                  type="text"
                  value={form.cbu}
                  onChange={(e) => setForm({ ...form, cbu: e.target.value })}
                  placeholder="ej. 0720023420000019283741"
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Descripción del Servicio</label>
                <input
                  type="text"
                  value={form.serviceDescription}
                  onChange={(e) => setForm({ ...form, serviceDescription: e.target.value })}
                  placeholder="ej. Buses doble piso 60 pax con chofer habilitado CNRT"
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1">Contacto Persona</label>
                  <input
                    type="text"
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    placeholder="ej. Carlos Gómez"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+54 9 11 ..."
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="contacto@proveedor.com"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Cuenta de Pago por Defecto</label>
                  <select
                    value={form.defaultAccountId}
                    onChange={(e) => setForm({ ...form, defaultAccountId: e.target.value as any })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-800 focus:outline-none focus:border-indigo-500"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#1A1A1A] hover:bg-black text-white font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingSupplier && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white border border-[#E5E5E1] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-xs">
            <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Editar Proveedor: {editingSupplier.name}</h2>
              <button onClick={() => setEditingSupplier(null)} className="p-1 rounded bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateSupplier(editingSupplier.id, {
                  name: editingSupplier.name,
                  category: editingSupplier.category,
                  mpAlias: editingSupplier.mpAlias || undefined,
                  cbu: editingSupplier.cbu || undefined,
                  serviceDescription: editingSupplier.serviceDescription,
                  contactName: editingSupplier.contactName || undefined,
                  phone: editingSupplier.phone || undefined,
                  email: editingSupplier.email || undefined,
                  defaultAccountId: editingSupplier.defaultAccountId
                });
                setEditingSupplier(null);
              }}
              className="p-6 space-y-3"
            >
              <div>
                <label className="block text-gray-600 mb-1">Razón Social / Nombre Comercial *</label>
                <input
                  type="text"
                  required
                  value={editingSupplier.name}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1">Rubro</label>
                  <select
                    value={editingSupplier.category}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, category: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-800 focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-600 mb-1">Alias Mercado Pago</label>
                  <input
                    type="text"
                    value={editingSupplier.mpAlias || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, mpAlias: e.target.value })}
                    placeholder="ej. andes.transporte.mp"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-indigo-700 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-1">CBU / CVU Bancario</label>
                <input
                  type="text"
                  value={editingSupplier.cbu || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, cbu: e.target.value })}
                  placeholder="ej. 0720023420000019283741"
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Descripción del Servicio</label>
                <input
                  type="text"
                  value={editingSupplier.serviceDescription}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, serviceDescription: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1">Contacto Persona</label>
                  <input
                    type="text"
                    value={editingSupplier.contactName || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, contactName: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={editingSupplier.phone || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingSupplier(null)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#1A1A1A] hover:bg-black text-white font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
