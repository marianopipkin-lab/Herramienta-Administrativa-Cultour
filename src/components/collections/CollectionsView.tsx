import React, { useState, useMemo } from 'react';
import {
  Building,
  GraduationCap,
  Users,
  Search,
  Filter,
  PlusCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowDownLeft,
  DollarSign,
  Calendar,
  CreditCard,
  Wallet,
  Download,
  Eye,
  FileSpreadsheet,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Currency, PaymentMethod } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/financialCalculations';
import {
  PeriodType,
  ClientCategory,
  DateRange,
  getDateRangeForPeriod,
  aggregateClientCollections,
  ClientCollectionSummary,
  ClientQuotaItem,
  isDateInRange,
  getDaysDifference
} from './collectionUtils';
import { StudentPayerManager } from '../students/StudentPayerManager';
import { RegisterCollectionModal } from './RegisterCollectionModal';
import { ClientCollectionsDetailModal } from './ClientCollectionsDetailModal';

export const CollectionsView: React.FC = () => {
  const {
    operations,
    accounts,
    setSelectedOperationId,
    openImportCenter
  } = useApp();

  // Navigation & Drilldown State
  const [selectedSchoolOpId, setSelectedSchoolOpId] = useState<string | null>(null);
  const [selectedDetailClient, setSelectedDetailClient] = useState<ClientCollectionSummary | null>(null);

  // Period State
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month');
  const [baseDateOffset, setBaseDateOffset] = useState<number>(0); // Shift periods forward/backward
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Primary Perspective Tab:
  // 1: 'due_in_range' -> "Cuotas que vencen en el rango"
  // 2: 'received_in_range' -> "Cobros recibidos en el rango"
  const [activePerspective, setActivePerspective] = useState<'due_in_range' | 'received_in_range'>('due_in_range');

  // Filters State
  const [clientCategory, setClientCategory] = useState<ClientCategory>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currencyFilter, setCurrencyFilter] = useState<'all' | Currency>('all');
  const [alertFilter, setAlertFilter] = useState<'all' | 'vencido' | 'urgente_15d' | 'pendiente' | 'al_dia'>('all');

  // Modal State for Registering Collections
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [modalInitialClient, setModalInitialClient] = useState<ClientCollectionSummary | null>(null);
  const [modalInitialOpId, setModalInitialOpId] = useState<string | undefined>(undefined);
  const [modalInitialAmount, setModalInitialAmount] = useState<number | undefined>(undefined);
  const [modalInitialConcept, setModalInitialConcept] = useState<string | undefined>(undefined);

  // Compute current Date Range object based on period and navigation offset
  const currentDateRange = useMemo<DateRange>(() => {
    const today = new Date();
    const shifted = new Date(today);

    if (baseDateOffset !== 0) {
      if (selectedPeriod === 'day') {
        shifted.setDate(today.getDate() + baseDateOffset);
      } else if (selectedPeriod === 'week') {
        shifted.setDate(today.getDate() + baseDateOffset * 7);
      } else if (selectedPeriod === 'fortnight') {
        shifted.setDate(today.getDate() + baseDateOffset * 15);
      } else if (selectedPeriod === 'month') {
        shifted.setMonth(today.getMonth() + baseDateOffset);
      } else if (selectedPeriod === 'quarter') {
        shifted.setMonth(today.getMonth() + baseDateOffset * 3);
      } else if (selectedPeriod === 'year') {
        shifted.setFullYear(today.getFullYear() + baseDateOffset);
      }
    }

    return getDateRangeForPeriod(selectedPeriod, customStart, customEnd, shifted);
  }, [selectedPeriod, baseDateOffset, customStart, customEnd]);

  // Aggregate all client collections (Strictly calculates sums from students for schools)
  const allClientSummaries = useMemo<ClientCollectionSummary[]>(() => {
    return aggregateClientCollections(operations, currentDateRange);
  }, [operations, currentDateRange]);

  // Filter client summaries according to search, category, currency, and alert status
  const filteredClientSummaries = useMemo(() => {
    return allClientSummaries.filter(client => {
      // Category filter
      if (clientCategory !== 'all' && client.clientType !== clientCategory) return false;

      // Currency filter
      if (currencyFilter !== 'all' && client.currency !== currencyFilter) return false;

      // Alert / Status filter
      if (alertFilter === 'vencido' && client.overallAlert !== 'vencido') return false;
      if (alertFilter === 'urgente_15d' && client.overallAlert !== 'urgente_15d') return false;
      if (alertFilter === 'pendiente' && client.totalPending <= 0) return false;
      if (alertFilter === 'al_dia' && client.totalPending > 0) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = client.clientName.toLowerCase().includes(term);
        const matchOp = client.operations.some(
          op => op.code.toLowerCase().includes(term) ||
                op.name.toLowerCase().includes(term) ||
                (op.destination && op.destination.toLowerCase().includes(term))
        );
        const matchStudent = client.quotas.some(
          q => (q.studentName && q.studentName.toLowerCase().includes(term)) ||
               (q.payerName && q.payerName.toLowerCase().includes(term))
        );
        if (!matchName && !matchOp && !matchStudent) return false;
      }

      return true;
    });
  }, [allClientSummaries, clientCategory, currencyFilter, alertFilter, searchTerm]);

  // KPI Global Summaries
  const kpis = useMemo(() => {
    let totalContractedARS = 0;
    let totalContractedUSD = 0;
    let totalCollectedARS = 0;
    let totalCollectedUSD = 0;
    let totalPendingARS = 0;
    let totalPendingUSD = 0;

    let periodCollectedARS = 0;
    let periodCollectedUSD = 0;
    let periodDueARS = 0;
    let periodDueUSD = 0;

    let expiredClientsCount = 0;
    let expiredAmountARS = 0;
    let expiredAmountUSD = 0;

    let urgent15dClientsCount = 0;
    let urgent15dAmountARS = 0;
    let urgent15dAmountUSD = 0;

    allClientSummaries.forEach(c => {
      if (c.currency === 'USD') {
        totalContractedUSD += c.totalContracted;
        totalCollectedUSD += c.totalCollected;
        totalPendingUSD += c.totalPending;
        periodCollectedUSD += c.periodCollectedAmount;
        periodDueUSD += c.periodDueAmount;
        if (c.expiredQuotasCount > 0) {
          expiredClientsCount++;
          expiredAmountUSD += c.expiredQuotasAmount;
        } else if (c.urgent15dQuotasCount > 0) {
          urgent15dClientsCount++;
          urgent15dAmountUSD += c.urgent15dQuotasAmount;
        }
      } else {
        totalContractedARS += c.totalContracted;
        totalCollectedARS += c.totalCollected;
        totalPendingARS += c.totalPending;
        periodCollectedARS += c.periodCollectedAmount;
        periodDueARS += c.periodDueAmount;
        if (c.expiredQuotasCount > 0) {
          expiredClientsCount++;
          expiredAmountARS += c.expiredQuotasAmount;
        } else if (c.urgent15dQuotasCount > 0) {
          urgent15dClientsCount++;
          urgent15dAmountARS += c.urgent15dQuotasAmount;
        }
      }
    });

    return {
      totalContractedARS,
      totalContractedUSD,
      totalCollectedARS,
      totalCollectedUSD,
      totalPendingARS,
      totalPendingUSD,
      periodCollectedARS,
      periodCollectedUSD,
      periodDueARS,
      periodDueUSD,
      expiredClientsCount,
      expiredAmountARS,
      expiredAmountUSD,
      urgent15dClientsCount,
      urgent15dAmountARS,
      urgent15dAmountUSD
    };
  }, [allClientSummaries]);

  // Open Quick Modal to record collection for a client
  const handleOpenRegisterForClient = (client: ClientCollectionSummary, quota?: ClientQuotaItem) => {
    setModalInitialClient(client);
    setModalInitialOpId(quota ? quota.operationId : client.operationIds[0]);
    setModalInitialAmount(quota ? quota.balance : client.totalPending > 0 ? client.totalPending : 0);
    setModalInitialConcept(quota ? quota.concept : `Cobro ${client.clientName}`);
    setIsRegisterModalOpen(true);
  };

  // If user drilled down into a specific school, render the StudentPayerManager directly
  if (selectedSchoolOpId) {
    return (
      <StudentPayerManager
        initialOperationId={selectedSchoolOpId}
        onBack={() => setSelectedSchoolOpId(null)}
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* 1. Header with Actions */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-[#E5E5E1]">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1A1A1A] leading-[1.15]">
            Cobranzas & Clientes<br />
            <span className="italic font-normal">Escuelas, Agencias & Turistas</span>
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#666666]">
            <span className="text-[#4F46E5] font-medium font-mono">[ Control por Cliente ]</span>
            <span className="text-[#D0D0CC]">•</span>
            <span>Consolidado automático: Nóminas nominales ↔ Cuotas ↔ Cobros recibidos ↔ Alertas</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => openImportCenter('students')}
            className="px-3.5 py-2 rounded-lg bg-[#FFFFFF] hover:bg-[#F4F4F0] text-[#1A1A1A] border border-[#E5E5E1] font-mono font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#059669]" />
            <span>Importar Pasajeros</span>
          </button>

          <button
            onClick={() => {
              setModalInitialClient(null);
              setModalInitialOpId(undefined);
              setModalInitialAmount(0);
              setModalInitialConcept('Cobro de Cuota');
              setIsRegisterModalOpen(true);
            }}
            className="px-4 py-2 bg-[#1A1A1A] hover:bg-black text-white rounded-lg font-bold text-xs flex items-center gap-2 transition-all shadow-xs font-mono uppercase cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-[#059669]" />
            <span>Registrar Cobro</span>
          </button>
        </div>
      </div>

      {/* 2. Top Level KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        
        {/* Total Contratado */}
        <div className="bg-[#FFFFFF] border border-[#E5E5E1] p-4 rounded-xl shadow-xs">
          <span className="text-[10px] font-mono uppercase font-bold text-[#666666] block">
            Total Contratado
          </span>
          <div className="mt-1">
            <span className="text-xl font-bold text-[#1A1A1A] font-mono block">
              {formatCurrency(kpis.totalContractedARS, 'ARS')}
            </span>
            {kpis.totalContractedUSD > 0 && (
              <span className="text-xs text-[#666666] font-mono block">
                + {formatCurrency(kpis.totalContractedUSD, 'USD')}
              </span>
            )}
          </div>
          <span className="text-[10px] text-[#888888] font-mono mt-1 block">
            Suma de nóminas y acuerdos
          </span>
        </div>

        {/* Total Cobrado */}
        <div className="bg-[#FFFFFF] border border-[#E5E5E1] p-4 rounded-xl shadow-xs">
          <span className="text-[10px] font-mono uppercase font-bold text-[#059669] block">
            Total Cobrado
          </span>
          <div className="mt-1">
            <span className="text-xl font-bold text-[#059669] font-mono block">
              {formatCurrency(kpis.totalCollectedARS, 'ARS')}
            </span>
            {kpis.totalCollectedUSD > 0 && (
              <span className="text-xs text-[#059669]/80 font-mono block">
                + {formatCurrency(kpis.totalCollectedUSD, 'USD')}
              </span>
            )}
          </div>
          <span className="text-[10px] text-[#059669]/80 font-mono mt-1 block">
            {formatPercent(kpis.totalContractedARS > 0 ? (kpis.totalCollectedARS / kpis.totalContractedARS) * 100 : 0)} recaudado en cuentas
          </span>
        </div>

        {/* Saldo Pendiente Total */}
        <div className="bg-rose-50/60 border border-rose-200 p-4 rounded-xl shadow-xs">
          <span className="text-[10px] font-mono uppercase font-bold text-[#E11D48] block">
            Saldo Pendiente Total
          </span>
          <div className="mt-1">
            <span className="text-xl font-extrabold text-[#E11D48] font-mono block">
              {formatCurrency(kpis.totalPendingARS, 'ARS')}
            </span>
            {kpis.totalPendingUSD > 0 && (
              <span className="text-xs text-[#E11D48]/80 font-mono block">
                + {formatCurrency(kpis.totalPendingUSD, 'USD')}
              </span>
            )}
          </div>
          <span className="text-[10px] text-[#E11D48]/80 font-mono mt-1 block">
            Diferencia a cobrar
          </span>
        </div>

        {/* 🔴 Vencidas */}
        <div className={`p-4 rounded-xl border shadow-xs ${
          kpis.expiredClientsCount > 0
            ? 'bg-rose-100/50 border-rose-300'
            : 'bg-[#FFFFFF] border-[#E5E5E1]'
        }`}>
          <span className="text-[10px] font-mono uppercase font-bold text-[#E11D48] flex items-center gap-1">
            <span>🔴 Cuotas Vencidas</span>
          </span>
          <div className="mt-1">
            <span className="text-xl font-bold text-[#E11D48] font-mono block">
              {formatCurrency(kpis.expiredAmountARS, 'ARS')}
            </span>
            {kpis.expiredAmountUSD > 0 && (
              <span className="text-xs text-[#E11D48] font-mono block">
                + {formatCurrency(kpis.expiredAmountUSD, 'USD')}
              </span>
            )}
          </div>
          <span className="text-[10px] text-[#E11D48] font-mono mt-1 block">
            {kpis.expiredClientsCount} {kpis.expiredClientsCount === 1 ? 'cliente con deuda vencida' : 'clientes con deuda vencida'}
          </span>
        </div>

        {/* 🟡 Vencen en ≤ 15 días */}
        <div className={`p-4 rounded-xl border shadow-xs ${
          kpis.urgent15dClientsCount > 0
            ? 'bg-amber-50 border-amber-300'
            : 'bg-[#FFFFFF] border-[#E5E5E1]'
        }`}>
          <span className="text-[10px] font-mono uppercase font-bold text-[#D97706] flex items-center gap-1">
            <span>🟡 Vencen en ≤ 15 días</span>
          </span>
          <div className="mt-1">
            <span className="text-xl font-bold text-[#D97706] font-mono block">
              {formatCurrency(kpis.urgent15dAmountARS, 'ARS')}
            </span>
            {kpis.urgent15dAmountUSD > 0 && (
              <span className="text-xs text-[#D97706] font-mono block">
                + {formatCurrency(kpis.urgent15dAmountUSD, 'USD')}
              </span>
            )}
          </div>
          <span className="text-[10px] text-[#D97706] font-mono mt-1 block">
            {kpis.urgent15dClientsCount} {kpis.urgent15dClientsCount === 1 ? 'cliente con vencimiento cercano' : 'clientes con vencimiento cercano'}
          </span>
        </div>

      </div>

      {/* 3. Filter Bar & Period Selector */}
      <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-2xl p-5 shadow-xs space-y-4">
        
        {/* Row 1: Perspective Tabs (Two distinct mandatory questions) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E5E1]">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-[#666666] block mb-1">
              Perspectiva de Análisis
            </span>
            <div className="inline-flex rounded-xl bg-[#F4F4F0] p-1 border border-[#E5E5E1] font-mono text-xs">
              
              {/* Tab 1: Cuotas que vencen en el rango */}
              <button
                onClick={() => setActivePerspective('due_in_range')}
                className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activePerspective === 'due_in_range'
                    ? 'bg-[#1A1A1A] text-white shadow-xs'
                    : 'text-[#666666] hover:text-[#1A1A1A]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Cuotas que Vencen en el Rango</span>
                {kpis.periodDueARS > 0 && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/30 text-amber-200 ml-1">
                    {formatCurrency(kpis.periodDueARS, 'ARS')}
                  </span>
                )}
              </button>

              {/* Tab 2: Cobros recibidos en el rango */}
              <button
                onClick={() => setActivePerspective('received_in_range')}
                className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activePerspective === 'received_in_range'
                    ? 'bg-[#1A1A1A] text-white shadow-xs'
                    : 'text-[#666666] hover:text-[#1A1A1A]'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cobros Recibidos en el Rango</span>
                {kpis.periodCollectedARS > 0 && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/30 text-emerald-200 ml-1">
                    {formatCurrency(kpis.periodCollectedARS, 'ARS')}
                  </span>
                )}
              </button>

            </div>
          </div>

          {/* Period Range Indicator & Navigator */}
          <div className="flex flex-col sm:items-end">
            <span className="text-[10px] font-mono uppercase font-bold text-[#666666] block mb-1">
              Período Activo
            </span>
            <div className="flex items-center gap-2 bg-[#F9F9F7] px-3 py-1.5 rounded-xl border border-[#E5E5E1]">
              <button
                onClick={() => setBaseDateOffset(prev => prev - 1)}
                title="Período Anterior"
                className="p-1 rounded hover:bg-[#E5E5E1] text-[#666666] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="font-mono text-xs font-bold text-[#1A1A1A] px-2 min-w-[140px] text-center">
                {currentDateRange.label}
              </span>

              <button
                onClick={() => setBaseDateOffset(prev => prev + 1)}
                title="Período Siguiente"
                className="p-1 rounded hover:bg-[#E5E5E1] text-[#666666] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {baseDateOffset !== 0 && (
                <button
                  onClick={() => setBaseDateOffset(0)}
                  title="Volver a la fecha actual"
                  className="ml-1 text-[10px] font-mono text-[#4F46E5] hover:underline cursor-pointer"
                >
                  [ Hoy ]
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Period Interval Selector & Category Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          
          {/* Period Intervals (Día, Semana, Quincena, Mes, Trimestre, Año, Todos) */}
          <div className="flex flex-wrap items-center gap-1 bg-[#F4F4F0] p-1 rounded-lg border border-[#E5E5E1] font-mono text-xs">
            <span className="text-[10px] font-bold text-[#888888] px-2 uppercase">Intervalo:</span>
            {(['day', 'week', 'fortnight', 'month', 'quarter', 'year', 'all'] as PeriodType[]).map(p => {
              const labels: Record<PeriodType, string> = {
                day: 'Día',
                week: 'Semana',
                fortnight: 'Quincena',
                month: 'Mes',
                quarter: 'Trimestre',
                year: 'Año',
                all: 'Histórico',
                custom: 'Custom'
              };
              const isSelected = selectedPeriod === p;
              return (
                <button
                  key={p}
                  onClick={() => {
                    setSelectedPeriod(p);
                    setBaseDateOffset(0);
                  }}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1A1A1A] text-white font-bold shadow-xs'
                      : 'text-[#666666] hover:text-[#1A1A1A]'
                  }`}
                >
                  {labels[p]}
                </button>
              );
            })}
          </div>

          {/* Client Category Buttons */}
          <div className="flex flex-wrap items-center gap-1 bg-[#F4F4F0] p-1 rounded-lg border border-[#E5E5E1] font-mono text-xs">
            <button
              onClick={() => setClientCategory('all')}
              className={`px-3 py-1 rounded transition-all cursor-pointer ${
                clientCategory === 'all'
                  ? 'bg-[#1A1A1A] text-white font-bold shadow-xs'
                  : 'text-[#666666] hover:text-[#1A1A1A]'
              }`}
            >
              Todos los Clientes ({allClientSummaries.length})
            </button>
            <button
              onClick={() => setClientCategory('escuela')}
              className={`px-3 py-1 rounded transition-all flex items-center gap-1.5 cursor-pointer ${
                clientCategory === 'escuela'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-indigo-800 hover:bg-indigo-50'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Escuelas ({allClientSummaries.filter(c => c.clientType === 'escuela').length})</span>
            </button>
            <button
              onClick={() => setClientCategory('agencia')}
              className={`px-3 py-1 rounded transition-all flex items-center gap-1.5 cursor-pointer ${
                clientCategory === 'agencia'
                  ? 'bg-amber-600 text-white font-bold shadow-xs'
                  : 'text-amber-800 hover:bg-amber-50'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Agencias ({allClientSummaries.filter(c => c.clientType === 'agencia').length})</span>
            </button>
            <button
              onClick={() => setClientCategory('turista')}
              className={`px-3 py-1 rounded transition-all flex items-center gap-1.5 cursor-pointer ${
                clientCategory === 'turista'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Turistas Directos ({allClientSummaries.filter(c => c.clientType === 'turista').length})</span>
            </button>
          </div>

        </div>

        {/* Row 3: Search Box, Currency & Alert Status Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          
          {/* Search box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente, escuela, alumno o file..."
              className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg pl-8 pr-3 py-2 text-[#1A1A1A] placeholder-[#888888] focus:outline-none focus:border-[#4F46E5] text-xs font-mono transition-colors"
            />
          </div>

          {/* Quick Status Filter & Currency Filter */}
          <div className="flex items-center gap-2">
            <select
              value={alertFilter}
              onChange={(e) => setAlertFilter(e.target.value as any)}
              className="bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-xs font-mono text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5] cursor-pointer"
            >
              <option value="all">Estado: Todos</option>
              <option value="vencido">🔴 Solo Vencidos</option>
              <option value="urgente_15d">🟡 Vencen en ≤ 15 días</option>
              <option value="pendiente">Con Saldo Pendiente</option>
              <option value="al_dia">🟢 Al Día (Saldados)</option>
            </select>

            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value as any)}
              className="bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-xs font-mono text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5] cursor-pointer font-bold"
            >
              <option value="all">Moneda: Todas</option>
              <option value="ARS">ARS ($)</option>
              <option value="USD">USD (US$)</option>
            </select>
          </div>

        </div>

      </div>

      {/* 4. Master Consolidated Table (Nivel de Cliente) */}
      <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F9F9F7] text-[#666666] uppercase font-mono border-b border-[#E5E5E1] text-[10px]">
              <tr>
                <th className="py-3 px-4 font-semibold">Cliente / Escuela / Entidad</th>
                <th className="py-3 px-3 font-semibold">Files / Operaciones</th>
                <th className="py-3 px-3 font-semibold">Nómina / Pax</th>
                <th className="py-3 px-3 text-right font-semibold">Total Contratado</th>
                <th className="py-3 px-3 text-right text-[#059669] font-semibold">Total Cobrado</th>
                <th className="py-3 px-3 text-right text-[#E11D48] font-semibold">Saldo Pendiente</th>
                <th className="py-3 px-3 font-semibold">
                  {activePerspective === 'due_in_range'
                    ? 'Cuotas en Rango / Vencimiento'
                    : 'Cobrado en Rango'}
                </th>
                <th className="py-3 px-3 text-center font-semibold">Alerta</th>
                <th className="py-3 px-4 text-center font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E1] font-mono">
              {filteredClientSummaries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#888888] font-sans">
                    <div className="max-w-md mx-auto space-y-2">
                      <p className="text-sm font-bold text-[#1A1A1A]">No se encontraron clientes para los filtros seleccionados.</p>
                      <p className="text-xs text-[#666666]">Prueba cambiando el período o el término de búsqueda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClientSummaries.map((client) => {
                  const hasDebt = client.totalPending > 0;
                  const isSchool = client.clientType === 'escuela';

                  return (
                    <tr
                      key={client.clientId}
                      className={`hover:bg-[#F4F4F0]/60 transition-colors ${
                        client.overallAlert === 'vencido' ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      
                      {/* Column 1: Client Name & Type */}
                      <td className="py-3.5 px-4 font-sans">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                            client.clientType === 'escuela'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : client.clientType === 'agencia'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {client.clientType === 'escuela' ? 'Escuela' : client.clientType === 'agencia' ? 'Agencia' : 'Turista'}
                          </span>
                          <button
                            onClick={() => {
                              if (isSchool && client.operationIds.length > 0) {
                                setSelectedSchoolOpId(client.operationIds[0]);
                              } else {
                                setSelectedDetailClient(client);
                              }
                            }}
                            className="font-bold text-[#1A1A1A] hover:text-[#4F46E5] transition-colors text-left font-serif text-sm cursor-pointer"
                          >
                            {client.clientName}
                          </button>
                        </div>
                      </td>

                      {/* Column 2: Operations / Files */}
                      <td className="py-3.5 px-3 font-sans">
                        <div className="flex flex-col gap-0.5">
                          {client.operations.slice(0, 2).map(op => (
                            <div key={op.id} className="flex items-center gap-1.5">
                              <span className="font-mono text-[11px] font-bold text-[#4F46E5]">{op.code}</span>
                              <span className="text-[11px] text-[#666666] truncate max-w-[140px]">{op.name}</span>
                            </div>
                          ))}
                          {client.operations.length > 2 && (
                            <span className="text-[10px] text-[#888888] font-mono">
                              +{client.operations.length - 2} files más
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 3: Students / Passengers Count */}
                      <td className="py-3.5 px-3 font-sans">
                        {isSchool ? (
                          <div className="flex flex-col">
                            <span className="font-mono font-bold text-[#1A1A1A]">
                              {client.studentsCount} alumnos
                            </span>
                            <div className="flex items-center gap-1 text-[10px] font-mono">
                              {client.liberatedCount > 0 && (
                                <span className="text-emerald-700 font-semibold">
                                  ({client.liberatedCount} lib.)
                                </span>
                              )}
                              {client.debtorStudentsCount > 0 ? (
                                <span className="text-[#E11D48]">
                                  • {client.debtorStudentsCount} con saldo
                                </span>
                              ) : (
                                <span className="text-[#059669]">
                                  • Todos al día
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#666666] font-mono text-[11px]">
                            {client.quotas.length} cuotas pactadas
                          </span>
                        )}
                      </td>

                      {/* Column 4: Total Contratado (Calculated from students assigned prices) */}
                      <td className="py-3.5 px-3 text-right font-medium text-[#1A1A1A]">
                        {formatCurrency(client.totalContracted, client.currency)}
                      </td>

                      {/* Column 5: Total Cobrado */}
                      <td className="py-3.5 px-3 text-right font-bold text-[#059669]">
                        {formatCurrency(client.totalCollected, client.currency)}
                      </td>

                      {/* Column 6: Saldo Pendiente */}
                      <td className="py-3.5 px-3 text-right font-bold">
                        {client.totalPending > 0 ? (
                          <span className={client.overallAlert === 'vencido' ? 'text-[#E11D48]' : 'text-[#D97706]'}>
                            {formatCurrency(client.totalPending, client.currency)}
                          </span>
                        ) : (
                          <span className="text-[#059669]">$ 0</span>
                        )}
                      </td>

                      {/* Column 7: Perspective specific metric */}
                      <td className="py-3.5 px-3">
                        {activePerspective === 'due_in_range' ? (
                          <div>
                            {client.periodDueAmount > 0 ? (
                              <div className="font-bold text-[#E11D48]">
                                {formatCurrency(client.periodDueAmount, client.currency)}
                                <span className="text-[10px] text-[#888888] font-normal block">
                                  {client.periodDueCount} cuotas en este período
                                </span>
                              </div>
                            ) : client.nextDueDate ? (
                              <div className="text-[11px]">
                                <span className="font-mono text-[#666666]">{client.nextDueDate}</span>
                                {client.daysToNextDueDate !== null && (
                                  <span className={`text-[10px] block ${
                                    client.daysToNextDueDate < 0
                                      ? 'text-[#E11D48] font-bold'
                                      : client.daysToNextDueDate <= 15
                                      ? 'text-[#D97706] font-bold'
                                      : 'text-[#888888]'
                                  }`}>
                                    {client.daysToNextDueDate < 0
                                      ? `Vencida (${Math.abs(client.daysToNextDueDate)}d)`
                                      : `En ${client.daysToNextDueDate} días`}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[#059669] text-[11px] font-bold">Sin deuda</span>
                            )}
                          </div>
                        ) : (
                          <div>
                            {client.periodCollectedAmount > 0 ? (
                              <div className="font-bold text-[#059669]">
                                {formatCurrency(client.periodCollectedAmount, client.currency)}
                                <span className="text-[10px] text-[#059669]/80 font-normal block">
                                  Ingresado en período
                                </span>
                              </div>
                            ) : (
                              <span className="text-[#888888] text-[11px]">-</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Column 8: Alert Status Badge */}
                      <td className="py-3.5 px-3 text-center font-sans">
                        {client.overallAlert === 'vencido' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            🔴 Vencida
                          </span>
                        ) : client.overallAlert === 'urgente_15d' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            🟡 ≤ 15 días
                          </span>
                        ) : client.totalPending <= 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            🟢 Al Día
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            En Fecha
                          </span>
                        )}
                      </td>

                      {/* Column 9: Actions */}
                      <td className="py-3.5 px-4 text-center font-sans">
                        <div className="flex items-center justify-center gap-2">
                          
                          {/* For schools: Direct button to open StudentPayerManager nominal list */}
                          {isSchool && client.operationIds.length > 0 && (
                            <button
                              onClick={() => setSelectedSchoolOpId(client.operationIds[0])}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Abrir Nómina Nominal de Alumnos (StudentPayerManager)"
                            >
                              <GraduationCap className="w-3.5 h-3.5 text-[#4F46E5]" />
                              <span>Nómina</span>
                            </button>
                          )}

                          {/* Detail Modal for non-school clients */}
                          {!isSchool && (
                            <button
                              onClick={() => setSelectedDetailClient(client)}
                              className="px-2.5 py-1 rounded-lg bg-[#F4F4F0] hover:bg-[#E5E5E1] text-[#1A1A1A] border border-[#E5E5E1] text-[11px] font-mono font-bold transition-colors cursor-pointer"
                            >
                              Ver Detalle
                            </button>
                          )}

                          {/* Quick Collection Button */}
                          {hasDebt && (
                            <button
                              onClick={() => handleOpenRegisterForClient(client)}
                              className="px-2.5 py-1 rounded-lg bg-[#1A1A1A] hover:bg-black text-white text-[11px] font-mono font-bold transition-colors shadow-xs cursor-pointer"
                            >
                              Cobrar
                            </button>
                          )}

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

      {/* Register Collection Modal */}
      {isRegisterModalOpen && (
        <RegisterCollectionModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          initialClient={modalInitialClient}
          initialOperationId={modalInitialOpId}
          initialAmount={modalInitialAmount}
          initialConcept={modalInitialConcept}
        />
      )}

      {/* Client Detail Modal */}
      {selectedDetailClient && (
        <ClientCollectionsDetailModal
          client={selectedDetailClient}
          onClose={() => setSelectedDetailClient(null)}
          onOpenStudentPayer={(opId) => {
            setSelectedDetailClient(null);
            setSelectedSchoolOpId(opId);
          }}
          onOpenRegisterCollection={(client, quota) => {
            handleOpenRegisterForClient(client, quota);
          }}
        />
      )}

    </div>
  );
};
