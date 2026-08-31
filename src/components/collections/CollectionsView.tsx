import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Filter,
  PlusCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowDownLeft,
  DollarSign,
  Calendar,
  Building,
  CreditCard,
  Wallet,
  Download,
  Eye,
  FileSpreadsheet,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CollectionRecord, PaymentQuota, PaymentMethod, AccountId, Currency } from '../../types';
import { formatCurrency } from '../../utils/financialCalculations';

export const CollectionsView: React.FC = () => {
  const {
    operations,
    accounts,
    recordCollection,
    setSelectedOperationId,
    currentRole
  } = useApp();

  const [activeTab, setActiveTab] = useState<'quotas' | 'records'>('quotas');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendiente' | 'parcial' | 'pagada' | 'vencida'>('all');
  const [currencyFilter, setCurrencyFilter] = useState<'all' | Currency>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State for new collection
  const [formData, setFormData] = useState<{
    operationId: string;
    clientId?: string;
    clientName: string;
    quotaId?: string;
    concept: string;
    amount: number;
    currency: Currency;
    paymentMethod: PaymentMethod;
    destinationAccountId: AccountId;
    notes: string;
    voucherOrReference: string;
  }>({
    operationId: '',
    clientName: '',
    concept: 'Pago de Cuota',
    amount: 0,
    currency: 'ARS',
    paymentMethod: 'mercado_pago',
    destinationAccountId: 'mp_gaston',
    notes: '',
    voucherOrReference: ''
  });

  // Extract all quotas from operations
  const allQuotas = useMemo(() => {
    const list: Array<PaymentQuota & { operationCode: string; operationName: string; businessUnit: string }> = [];
    operations.forEach(op => {
      if (op.quotas && op.quotas.length > 0) {
        op.quotas.forEach(q => {
          list.push({
            ...q,
            operationCode: op.code,
            operationName: op.name,
            businessUnit: op.businessUnit
          });
        });
      } else if (op.students && op.students.length > 0) {
        // Synthesize quotas from student payers if explicit quotas not yet generated
        op.students.forEach((st, idx) => {
          list.push({
            id: `st_quota_${st.id}`,
            operationId: op.id,
            clientId: st.id,
            clientName: `${st.studentName} (${st.payerName})`,
            quotaType: 'pago_unico',
            amount: st.expectedAmount,
            currency: st.currency || 'ARS',
            dueDate: st.paymentDueDate || op.date,
            status: st.status === 'al_dia' ? 'pagada' : st.status === 'pago_parcial' ? 'parcial' : st.status === 'vencido' ? 'vencida' : 'pendiente',
            paidAmount: st.paidAmount,
            balance: st.expectedAmount - st.paidAmount,
            operationCode: op.code,
            operationName: op.name,
            businessUnit: op.businessUnit
          });
        });
      }
    });
    return list;
  }, [operations]);

  // Extract all collections / receipts from operations
  const allCollections = useMemo(() => {
    const list: Array<CollectionRecord & { operationName?: string }> = [];
    operations.forEach(op => {
      if (op.collections && op.collections.length > 0) {
        op.collections.forEach(col => {
          list.push({
            ...col,
            operationName: op.name
          });
        });
      } else if (op.incomes && op.incomes.length > 0) {
        // Fallback to legacy incomes
        op.incomes.forEach(inc => {
          list.push({
            id: inc.id,
            operationId: op.id,
            operationCode: op.code,
            operationName: op.name,
            clientName: inc.payerName,
            concept: 'Ingreso Operativo',
            date: inc.date,
            amount: inc.amount,
            currency: inc.currency || op.currency || 'ARS',
            paymentMethod: inc.paymentMethod,
            destinationAccountId: inc.accountId,
            voucherOrReference: inc.reference,
            createdAt: inc.date
          });
        });
      }
    });
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [operations]);

  // Filtered Quotas
  const filteredQuotas = useMemo(() => {
    return allQuotas.filter(q => {
      if (statusFilter !== 'all' && q.status !== statusFilter) return false;
      if (currencyFilter !== 'all' && q.currency !== currencyFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchClient = q.clientName.toLowerCase().includes(term);
        const matchOp = q.operationCode.toLowerCase().includes(term) || q.operationName.toLowerCase().includes(term);
        if (!matchClient && !matchOp) return false;
      }
      return true;
    });
  }, [allQuotas, statusFilter, currencyFilter, searchTerm]);

  // Filtered Collections
  const filteredCollections = useMemo(() => {
    return allCollections.filter(c => {
      if (currencyFilter !== 'all' && c.currency !== currencyFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchClient = c.clientName.toLowerCase().includes(term);
        const matchOp = (c.operationCode || '').toLowerCase().includes(term) || (c.concept || '').toLowerCase().includes(term);
        if (!matchClient && !matchOp) return false;
      }
      return true;
    });
  }, [allCollections, currencyFilter, searchTerm]);

  // Totals
  const totals = useMemo(() => {
    let collectedARS = 0;
    let collectedUSD = 0;
    let pendingARS = 0;
    let pendingUSD = 0;

    allQuotas.forEach(q => {
      if (q.currency === 'USD') {
        collectedUSD += q.paidAmount || 0;
        pendingUSD += (q.balance || 0);
      } else {
        collectedARS += q.paidAmount || 0;
        pendingARS += (q.balance || 0);
      }
    });

    return { collectedARS, collectedUSD, pendingARS, pendingUSD };
  }, [allQuotas]);

  const handleOpenRegisterForQuota = (quota: PaymentQuota & { operationCode: string }) => {
    setFormData({
      operationId: quota.operationId,
      clientId: quota.clientId,
      clientName: quota.clientName,
      quotaId: quota.id,
      concept: `Cobro ${quota.quotaType} (${quota.operationCode})`,
      amount: quota.balance > 0 ? quota.balance : quota.amount,
      currency: quota.currency,
      paymentMethod: quota.expectedPaymentMethod || 'mercado_pago',
      destinationAccountId: quota.destinationAccountId || 'mp_gaston',
      notes: '',
      voucherOrReference: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmitCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.operationId || formData.amount <= 0 || !formData.clientName) {
      alert('Por favor complete la operación, cliente y monto.');
      return;
    }

    recordCollection({
      operationId: formData.operationId,
      clientId: formData.clientId,
      clientName: formData.clientName,
      quotaId: formData.quotaId,
      concept: formData.concept,
      amount: Number(formData.amount),
      currency: formData.currency,
      paymentMethod: formData.paymentMethod,
      destinationAccountId: formData.destinationAccountId,
      notes: formData.notes,
      voucherOrReference: formData.voucherOrReference
    });

    setIsModalOpen(false);
  };

  const getStatusBadge = (status: PaymentQuota['status']) => {
    switch (status) {
      case 'pagada':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">Pagada</span>;
      case 'parcial':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">Parcial</span>;
      case 'pendiente':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-50 text-amber-700 border border-amber-200 font-semibold">Pendiente</span>;
      case 'vencida':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-50 text-rose-700 border border-rose-200 font-semibold">Vencida</span>;
    }
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case 'mercado_pago': return 'Mercado Pago';
      case 'paypal': return 'PayPal';
      case 'wetravel': return 'WeTravel';
      case 'transferencia': return 'Transferencia Bancaria';
      case 'efectivo': return 'Efectivo';
      case 'tarjeta': return 'Tarjeta de Crédito/Débito';
      case 'cheque': return 'Cheque';
      default: return 'Otro';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-[#E5E5E1]">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1A1A1A] leading-[1.15]">
            Cobranzas & Planes de Pago<br />
            <span className="italic font-normal">Control de Ingresos & Cuotas</span>
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#666666]">
            <span className="text-[#4F46E5] font-medium font-mono">[ Trazabilidad de Pagadores ]</span>
            <span className="text-[#D0D0CC]">•</span>
            <span>Registro estructurado: Pagador → Operación → Cuota → Cuenta Destino Real</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const defaultOp = operations[0];
              setFormData({
                operationId: defaultOp ? defaultOp.id : '',
                clientName: defaultOp ? defaultOp.clientOrSchool : '',
                concept: 'Pago de Cuota',
                amount: 0,
                currency: defaultOp ? defaultOp.currency : 'ARS',
                paymentMethod: 'mercado_pago',
                destinationAccountId: 'mp_gaston',
                notes: '',
                voucherOrReference: ''
              });
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-[#1A1A1A] hover:bg-black text-white rounded-lg font-bold text-xs flex items-center gap-2 transition-all shadow-sm font-mono uppercase cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Registrar Cobro</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] border border-[#E5E5E1] p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-[#666666] mb-2">
            <span className="text-[11px] font-mono uppercase font-bold text-[#666666]">Cobrado en ARS</span>
            <ArrowDownLeft className="w-4 h-4 text-[#059669]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#059669]">
            {formatCurrency(totals.collectedARS, 'ARS')}
          </div>
          <p className="text-[11px] text-[#888888] font-mono mt-1">Total recaudado en pesos</p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5E5E1] p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-[#666666] mb-2">
            <span className="text-[11px] font-mono uppercase font-bold text-[#666666]">Cobrado en USD</span>
            <ArrowDownLeft className="w-4 h-4 text-[#0284C7]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#0284C7]">
            {formatCurrency(totals.collectedUSD, 'USD')}
          </div>
          <p className="text-[11px] text-[#888888] font-mono mt-1">PayPal, WeTravel y Bóveda USD</p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5E5E1] p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-[#666666] mb-2">
            <span className="text-[11px] font-mono uppercase font-bold text-[#666666]">Por Cobrar ARS</span>
            <Clock className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#D97706]">
            {formatCurrency(totals.pendingARS, 'ARS')}
          </div>
          <p className="text-[11px] text-[#888888] font-mono mt-1">Cuotas pendientes en ARS</p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5E5E1] p-5 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-[#666666] mb-2">
            <span className="text-[11px] font-mono uppercase font-bold text-[#666666]">Por Cobrar USD</span>
            <Clock className="w-4 h-4 text-[#4F46E5]" />
          </div>
          <div className="text-2xl font-serif font-bold text-[#4F46E5]">
            {formatCurrency(totals.pendingUSD, 'USD')}
          </div>
          <p className="text-[11px] text-[#888888] font-mono mt-1">Saldos pendientes receptivo</p>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E5E5E1] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Sub-tab selection */}
        <div className="flex items-center bg-[#F4F4F0] p-1 rounded-lg border border-[#E5E5E1] text-xs">
          <button
            onClick={() => setActiveTab('quotas')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'quotas' ? 'bg-[#1A1A1A] text-white shadow-xs' : 'text-[#666666] hover:text-[#1A1A1A]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Planes de Cuotas ({allQuotas.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'records' ? 'bg-[#1A1A1A] text-white shadow-xs' : 'text-[#666666] hover:text-[#1A1A1A]'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Recibos & Cobros Registrados ({allCollections.length})</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
            <input
              type="text"
              placeholder="Buscar cliente, file..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg pl-8 pr-3 py-2 text-xs text-[#1A1A1A] placeholder-[#888888] focus:outline-none focus:border-[#4F46E5] transition-colors"
            />
          </div>

          {/* Currency Filter */}
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value as any)}
            className="bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
          >
            <option value="all">Todas las divisas</option>
            <option value="ARS">ARS ($)</option>
            <option value="USD">USD (US$)</option>
          </select>

          {/* Status Filter for Quotas */}
          {activeTab === 'quotas' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
            >
              <option value="all">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="parcial">Parciales</option>
              <option value="pagada">Pagadas</option>
              <option value="vencida">Vencidas</option>
            </select>
          )}
        </div>
      </div>

      {/* Main Table View */}
      {activeTab === 'quotas' ? (
        /* Quotas Table */
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E5E5E1] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#E5E5E1] bg-[#F9F9F7] flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#1A1A1A] uppercase font-mono tracking-wide flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#4F46E5]" />
              <span>Cronograma de Cuotas & Compromisos de Pago</span>
            </h3>
            <span className="text-xs text-[#666666] font-mono">({filteredQuotas.length} cuotas listadas)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5E1] bg-[#FFFFFF] text-[#666666] font-mono text-[11px] uppercase">
                  <th className="py-3 px-4 font-semibold">Vencimiento</th>
                  <th className="py-3 px-4 font-semibold">Operación / File</th>
                  <th className="py-3 px-4 font-semibold">Pagador / Cliente</th>
                  <th className="py-3 px-4 font-semibold">Concepto / Tipo</th>
                  <th className="py-3 px-4 font-semibold text-right">Monto Total</th>
                  <th className="py-3 px-4 font-semibold text-right">Cobrado</th>
                  <th className="py-3 px-4 font-semibold text-right">Saldo Restante</th>
                  <th className="py-3 px-4 font-semibold text-center">Estado</th>
                  <th className="py-3 px-4 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E1]">
                {filteredQuotas.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-[#888888] font-mono text-xs">
                      No hay cuotas que coincidan con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredQuotas.map(q => (
                    <tr key={q.id} className="hover:bg-[#F4F4F0]/60 transition-colors">
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-[#1A1A1A]">{q.dueDate}</div>
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelectedOperationId(q.operationId)}
                          className="font-mono text-[#4F46E5] hover:underline font-bold text-left block cursor-pointer"
                        >
                          {q.operationCode}
                        </button>
                        <span className="text-[11px] text-[#666666] truncate block max-w-xs">{q.operationName}</span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#1A1A1A]">{q.clientName}</div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-[#666666] uppercase">
                        {q.quotaType.replace('_', ' ')}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-[#1A1A1A]">
                        {formatCurrency(q.amount, q.currency)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-[#059669] font-bold">
                        {formatCurrency(q.paidAmount, q.currency)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-[#D97706] font-bold">
                        {formatCurrency(q.balance, q.currency)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(q.status)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {q.balance > 0 ? (
                          <button
                            onClick={() => handleOpenRegisterForQuota(q)}
                            className="px-2.5 py-1 rounded bg-[#1A1A1A] hover:bg-black text-white font-bold text-[11px] font-mono transition-colors uppercase cursor-pointer"
                          >
                            Cobrar
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#059669] font-mono font-bold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Saldado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Receipts & Collections Records Table */
        <div className="bg-[#FFFFFF] rounded-xl border border-[#E5E5E1] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#E5E5E1] bg-[#F9F9F7] flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#1A1A1A] uppercase font-mono tracking-wide flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#059669]" />
              <span>Historial de Cobros Recibidos</span>
            </h3>
            <span className="text-xs text-[#666666] font-mono">({filteredCollections.length} cobros registrados)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5E1] bg-[#FFFFFF] text-[#666666] font-mono text-[11px] uppercase">
                  <th className="py-3 px-4 font-semibold">Fecha</th>
                  <th className="py-3 px-4 font-semibold">Operación</th>
                  <th className="py-3 px-4 font-semibold">Pagador / Cliente</th>
                  <th className="py-3 px-4 font-semibold">Concepto</th>
                  <th className="py-3 px-4 font-semibold">Medio de Pago</th>
                  <th className="py-3 px-4 font-semibold">Cuenta Destino Real</th>
                  <th className="py-3 px-4 font-semibold text-right">Monto Recibido</th>
                  <th className="py-3 px-4 font-semibold">Comprobante / Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E1]">
                {filteredCollections.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#888888] font-mono text-xs">
                      No hay cobros registrados.
                    </td>
                  </tr>
                ) : (
                  filteredCollections.map(col => {
                    const acc = accounts.find(a => a.id === col.destinationAccountId);

                    return (
                      <tr key={col.id} className="hover:bg-[#F4F4F0]/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#1A1A1A]">
                          {col.date}
                        </td>

                        <td className="py-3 px-4 font-mono">
                          <button
                            onClick={() => setSelectedOperationId(col.operationId)}
                            className="text-[#4F46E5] hover:underline font-bold block cursor-pointer"
                          >
                            {col.operationCode || 'File'}
                          </button>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#1A1A1A]">{col.clientName}</div>
                        </td>

                        <td className="py-3 px-4 text-[#666666]">
                          {col.concept}
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-[#F4F4F0] text-[#1A1A1A] font-mono text-[10px] border border-[#E5E5E1]">
                            {getPaymentMethodLabel(col.paymentMethod)}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-[#1A1A1A] flex items-center gap-1.5">
                            <Wallet className="w-3.5 h-3.5 text-[#059669]" />
                            <span>{acc ? acc.name : col.destinationAccountId}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-[#059669]">
                          +{formatCurrency(col.amount, col.currency)}
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] text-[#666666]">
                          {col.voucherOrReference || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Registrar Cobro */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E5E1] pb-3">
              <h3 className="text-base font-bold text-[#1A1A1A] font-serif">Registrar Nuevo Cobro</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#888888] hover:text-[#1A1A1A] font-mono text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitCollection} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-[#666666] mb-1">
                  Operación / File Relacionado
                </label>
                <select
                  value={formData.operationId}
                  onChange={(e) => {
                    const selected = operations.find(o => o.id === e.target.value);
                    setFormData({
                      ...formData,
                      operationId: e.target.value,
                      clientName: selected ? selected.clientOrSchool : formData.clientName,
                      currency: selected ? selected.currency : formData.currency
                    });
                  }}
                  className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
                  required
                >
                  <option value="">Seleccione una operación...</option>
                  {operations.map(o => (
                    <option key={o.id} value={o.id}>
                      [{o.code}] {o.name} - {o.clientOrSchool}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#666666] mb-1">
                    Nombre del Pagador / Cliente
                  </label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
                    placeholder="Ej: John Miller / Mariano Almada"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#666666] mb-1">
                    Concepto de Cobro
                  </label>
                  <input
                    type="text"
                    value={formData.concept}
                    onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                    className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
                    placeholder="Ej: Seña 30%, Cuota 1, Saldo"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#666666] mb-1">
                    Monto a Cobrar
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] font-mono focus:outline-none focus:border-[#4F46E5]"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#666666] mb-1">
                    Moneda Original
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
                    className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] font-mono focus:outline-none"
                  >
                    <option value="ARS">ARS ($ Pesos)</option>
                    <option value="USD">USD (US$ Dólares)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#666666] mb-1">
                    Medio de Cobro
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
                    className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none"
                  >
                    <option value="mercado_pago">Mercado Pago</option>
                    <option value="paypal">PayPal (USD)</option>
                    <option value="wetravel">WeTravel (USD)</option>
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#059669] mb-1">
                    Cuenta Destino Real
                  </label>
                  <select
                    value={formData.destinationAccountId}
                    onChange={(e) => setFormData({ ...formData, destinationAccountId: e.target.value })}
                    className="w-full bg-[#F9F9F7] border border-[#059669]/40 rounded-lg px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#059669]"
                    required
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.currency})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[#666666] mb-1">
                  N° de Comprobante / Referencia
                </label>
                <input
                  type="text"
                  value={formData.voucherOrReference}
                  onChange={(e) => setFormData({ ...formData, voucherOrReference: e.target.value })}
                  className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] font-mono focus:outline-none focus:border-[#4F46E5]"
                  placeholder="Ej: MP#928412984, Transf Santander #48291"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[#666666] mb-1">
                  Observaciones
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
                  placeholder="Detalles sobre el cobro o cuota saldada..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E5E1]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#F4F4F0] hover:bg-[#E5E5E1] text-[#1A1A1A] text-xs font-mono cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#1A1A1A] hover:bg-black text-white font-bold text-xs font-mono uppercase shadow-sm cursor-pointer"
                >
                  Confirmar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
