import React, { useState } from 'react';
import {
  X,
  Building,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Copy,
  Check,
  Plus,
  ArrowRight,
  Filter,
  FileText,
  MessageSquare
} from 'lucide-react';
import { Supplier, Operation, AccountId, PaymentMethod, Currency } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatPercent } from '../../utils/financialCalculations';
import {
  getSupplierBreakdown,
  getSupplierSummaryStats,
  SupplierItemBreakdown
} from './supplierUtils';

interface SupplierDetailModalProps {
  supplier: Supplier;
  onClose: () => void;
  onEdit: (supplier: Supplier) => void;
}

export const SupplierDetailModal: React.FC<SupplierDetailModalProps> = ({
  supplier,
  onClose,
  onEdit
}) => {
  const { operations, accounts, recordSupplierPayment, setSelectedOperationId } = useApp();

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [filterAlert, setFilterAlert] = useState<'all' | 'vencido' | 'urgente_15d' | 'pendiente' | 'pagado'>('all');
  const [payingItem, setPayingItem] = useState<SupplierItemBreakdown | null>(null);

  // Quick Payment form state
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('transferencia');
  const [payAccountId, setPayAccountId] = useState<AccountId>(supplier.defaultAccountId || 'banco_santander');
  const [payReference, setPayReference] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');

  // Get consolidated breakdown and stats
  const breakdown = getSupplierBreakdown(supplier, operations);
  const stats = getSupplierSummaryStats(supplier, operations);

  const filteredBreakdown = breakdown.filter(item => {
    if (filterAlert === 'vencido') return item.alertStatus === 'vencido';
    if (filterAlert === 'urgente_15d') return item.alertStatus === 'urgente_15d';
    if (filterAlert === 'pendiente') return item.balance > 0;
    if (filterAlert === 'pagado') return item.balance <= 0;
    return true;
  });

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleStartPayment = (item: SupplierItemBreakdown) => {
    setPayingItem(item);
    setPayAmount(item.balance);
    setPayAccountId(supplier.defaultAccountId || 'banco_santander');
    setPayMethod(supplier.mpAlias ? 'mercado_pago' : 'transferencia');
    setPayReference(`Pago file ${item.operationCode} - ${item.serviceCategory}`);
    setPayNotes('');
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingItem || payAmount <= 0) {
      alert('Por favor ingrese un monto válido mayor a 0');
      return;
    }

    recordSupplierPayment({
      operationId: payingItem.operationId,
      supplierId: supplier.id,
      supplierName: supplier.name,
      contractId: payingItem.id.startsWith('sc_') ? payingItem.id : undefined,
      concept: `Servicio ${payingItem.serviceCategory} (${payingItem.operationCode})`,
      amount: Number(payAmount),
      currency: payingItem.currency,
      paymentMethod: payMethod,
      sourceAccountId: payAccountId,
      reference: payReference,
      notes: payNotes
    });

    setPayingItem(null);
  };

  const paidPercentage = stats.totalContracted > 0 ? (stats.totalPaid / stats.totalContracted) * 100 : 100;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-[#E5E5E1] rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-white border-b border-[#E5E5E1] flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 mt-0.5">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1A1A1A]">
                  {supplier.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono">
                  {supplier.category}
                </span>
                {stats.hasExpired && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 font-mono flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    <span>{stats.expiredCount} Vencido{stats.expiredCount > 1 ? 's' : ''} ({formatCurrency(stats.expiredAmount)})</span>
                  </span>
                )}
                {!stats.hasExpired && stats.hasUrgent15d && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>{stats.urgent15dCount} Vence en ≤15d ({formatCurrency(stats.urgent15dAmount)})</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#666666] mt-1 line-clamp-1">
                {supplier.serviceDescription || 'Sin descripción adicional de servicio'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(supplier)}
              className="px-3 py-1.5 rounded-lg border border-[#E5E5E1] hover:bg-[#F9F9F7] text-xs font-semibold text-[#1A1A1A] transition-colors cursor-pointer"
            >
              Editar Datos
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#FAFAF8]">
          
          {/* Fast Contact & Payment Box */}
          <div className="bg-white p-4 rounded-xl border border-[#E5E5E1] shadow-xs">
            <div className="text-[11px] font-mono font-bold text-[#666666] uppercase mb-3 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
              <span>Canales de Transferencia & Contacto para Pagos</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Alias MP */}
              <div className="p-3 bg-[#F9F9F7] rounded-lg border border-[#E5E5E1] flex flex-col justify-between">
                <span className="text-[10px] text-[#666666] font-mono">Alias Mercado Pago:</span>
                {supplier.mpAlias ? (
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono font-bold text-indigo-700 truncate pr-1">{supplier.mpAlias}</span>
                    <button
                      onClick={() => handleCopy(supplier.mpAlias!, 'mpAlias')}
                      className="p-1 rounded text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                      title="Copiar alias"
                    >
                      {copiedField === 'mpAlias' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ) : (
                  <span className="text-[#888888] italic text-[11px] mt-1">No registrado</span>
                )}
              </div>

              {/* CBU / CVU */}
              <div className="p-3 bg-[#F9F9F7] rounded-lg border border-[#E5E5E1] flex flex-col justify-between">
                <span className="text-[10px] text-[#666666] font-mono">CBU / CVU Bancario:</span>
                {supplier.cbu ? (
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-[11px] font-bold text-[#1A1A1A] truncate pr-1">{supplier.cbu}</span>
                    <button
                      onClick={() => handleCopy(supplier.cbu!, 'cbu')}
                      className="p-1 rounded text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                      title="Copiar CBU"
                    >
                      {copiedField === 'cbu' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ) : (
                  <span className="text-[#888888] italic text-[11px] mt-1">No registrado</span>
                )}
              </div>

              {/* Contact Person & Phone */}
              <div className="p-3 bg-[#F9F9F7] rounded-lg border border-[#E5E5E1] flex flex-col justify-between">
                <span className="text-[10px] text-[#666666] font-mono">Contacto / Teléfono:</span>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-medium text-[#1A1A1A] truncate">
                    {supplier.contactName || supplier.phone || 'Sin contacto'}
                  </span>
                  {supplier.phone && (
                    <a
                      href={`https://wa.me/${supplier.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="Abrir WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="p-3 bg-[#F9F9F7] rounded-lg border border-[#E5E5E1] flex flex-col justify-between">
                <span className="text-[10px] text-[#666666] font-mono">Correo Electrónico:</span>
                {supplier.email ? (
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-medium text-[#1A1A1A] truncate">{supplier.email}</span>
                    <a
                      href={`mailto:${supplier.email}`}
                      className="p-1 rounded text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Enviar email"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ) : (
                  <span className="text-[#888888] italic text-[11px] mt-1">No registrado</span>
                )}
              </div>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#E5E5E1] shadow-xs">
              <span className="text-[10px] font-mono text-[#666666] uppercase block">Total Contratado</span>
              <span className="text-xl font-bold font-mono text-[#1A1A1A] block mt-1">
                {formatCurrency(stats.totalContracted)}
              </span>
              <span className="text-[10px] text-[#888888] font-mono mt-1 block">
                En {stats.operationsCount} file{stats.operationsCount !== 1 ? 's' : ''} ({stats.itemsCount} servicios)
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E5E5E1] shadow-xs">
              <span className="text-[10px] font-mono text-[#666666] uppercase block">Total Pagado</span>
              <span className="text-xl font-bold font-mono text-emerald-700 block mt-1">
                {formatCurrency(stats.totalPaid)}
              </span>
              <div className="mt-1 flex items-center gap-1.5">
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, paidPercentage))}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-emerald-700 font-bold">{Math.round(paidPercentage)}%</span>
              </div>
            </div>

            <div className={`p-4 rounded-xl border shadow-xs ${
              stats.totalBalance > 0
                ? stats.hasExpired
                  ? 'bg-rose-50/50 border-rose-200'
                  : stats.hasUrgent15d
                  ? 'bg-amber-50/50 border-amber-200'
                  : 'bg-white border-[#E5E5E1]'
                : 'bg-emerald-50/50 border-emerald-200'
            }`}>
              <span className="text-[10px] font-mono text-[#666666] uppercase block">Saldo Pendiente</span>
              <span className={`text-xl font-bold font-mono block mt-1 ${
                stats.totalBalance > 0
                  ? stats.hasExpired
                    ? 'text-rose-700'
                    : stats.hasUrgent15d
                    ? 'text-amber-700'
                    : 'text-gray-900'
                  : 'text-emerald-700'
              }`}>
                {formatCurrency(stats.totalBalance)}
              </span>
              <span className="text-[10px] font-mono mt-1 block text-[#666666]">
                {stats.totalBalance === 0 ? 'Sin saldo pendiente' : `${stats.itemsCount - breakdown.filter(b => b.balance <= 0).length} servicios por saldar`}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E5E5E1] shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-mono text-[#666666] uppercase block">Participación en Files</span>
              <div className="text-xl font-bold font-mono text-indigo-700 mt-1">
                {stats.operationsCount} <span className="text-xs font-normal text-gray-500">Operaciones</span>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">
                Prestador regular activo
              </span>
            </div>
          </div>

          {/* Desglose Fila por Fila Header & Filters */}
          <div className="bg-white p-4 rounded-xl border border-[#E5E5E1] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E5E1]">
              <div>
                <h3 className="font-serif font-bold text-base text-[#1A1A1A] flex items-center gap-2">
                  <span>Desglose de Servicios por File</span>
                  <span className="text-xs font-sans font-normal text-[#666666] bg-gray-100 px-2 py-0.5 rounded-full font-mono">
                    Ordenado por Fecha de Servicio
                  </span>
                </h3>
                <p className="text-xs text-[#666666] mt-0.5">
                  Visualización cronológica de contratos pactados, importes abonados, saldos restantes y fechas de vencimiento.
                </p>
              </div>

              {/* Status Filter buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setFilterAlert('all')}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                    filterAlert === 'all' ? 'bg-[#1A1A1A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Todos ({breakdown.length})
                </button>
                {stats.hasExpired && (
                  <button
                    onClick={() => setFilterAlert('vencido')}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors cursor-pointer ${
                      filterAlert === 'vencido' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    }`}
                  >
                    🔴 Vencidos ({stats.expiredCount})
                  </button>
                )}
                {stats.hasUrgent15d && (
                  <button
                    onClick={() => setFilterAlert('urgente_15d')}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors cursor-pointer ${
                      filterAlert === 'urgente_15d' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                    }`}
                  >
                    🟡 ≤15 Días ({stats.urgent15dCount})
                  </button>
                )}
                <button
                  onClick={() => setFilterAlert('pendiente')}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                    filterAlert === 'pendiente' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  Con Saldo
                </button>
                <button
                  onClick={() => setFilterAlert('pagado')}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                    filterAlert === 'pagado' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  Saldados
                </button>
              </div>
            </div>

            {/* Breakdown Table */}
            <div className="overflow-x-auto rounded-xl border border-[#E5E5E1]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F9F9F7] text-[#666666] uppercase tracking-wider font-semibold border-b border-[#E5E5E1] text-[10px] font-mono">
                  <tr>
                    <th className="py-3 px-3">Estado / Alerta</th>
                    <th className="py-3 px-3">File / Operación</th>
                    <th className="py-3 px-3">Fecha Servicio</th>
                    <th className="py-3 px-3">Servicio / Rubro</th>
                    <th className="py-3 px-3 text-right">Pactado</th>
                    <th className="py-3 px-3 text-right">Pagado</th>
                    <th className="py-3 px-3 text-right">Resta (Saldo)</th>
                    <th className="py-3 px-3">Vencimiento</th>
                    <th className="py-3 px-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E1] font-mono">
                  {filteredBreakdown.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-400 font-sans">
                        No hay servicios contratados con este proveedor bajo los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredBreakdown.map((item) => {
                      const isExpired = item.alertStatus === 'vencido';
                      const isUrgent15 = item.alertStatus === 'urgente_15d';
                      const isFullyPaid = item.balance <= 0;

                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            isExpired
                              ? 'bg-rose-50/40 hover:bg-rose-50/80'
                              : isUrgent15
                              ? 'bg-amber-50/30 hover:bg-amber-50/70'
                              : 'bg-white hover:bg-[#F9F9F7]'
                          }`}
                        >
                          {/* Alert Badge */}
                          <td className="py-3 px-3 whitespace-nowrap font-sans">
                            {isFullyPaid ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Pagado</span>
                              </span>
                            ) : isExpired ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                <span>Vencido hace {Math.abs(item.daysDifference)}d</span>
                              </span>
                            ) : isUrgent15 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Vence en {item.daysDifference}d</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                                <span>En fecha</span>
                              </span>
                            )}
                          </td>

                          {/* Operation Info */}
                          <td className="py-3 px-3 font-sans">
                            <div className="flex flex-col">
                              <button
                                onClick={() => {
                                  setSelectedOperationId(item.operationId);
                                  onClose();
                                }}
                                className="font-bold text-xs text-indigo-600 hover:underline flex items-center gap-1 text-left cursor-pointer group"
                              >
                                <span>{item.operationCode}</span>
                                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                              <span className="text-[11px] text-[#1A1A1A] font-medium truncate max-w-[180px]">
                                {item.operationName}
                              </span>
                              <span className="text-[10px] text-[#888888] truncate max-w-[180px]">
                                {item.clientOrSchool}
                              </span>
                            </div>
                          </td>

                          {/* Operation Service Date */}
                          <td className="py-3 px-3 whitespace-nowrap text-gray-700 font-mono text-[11px]">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              <span>{item.operationDate}</span>
                            </div>
                          </td>

                          {/* Service Description */}
                          <td className="py-3 px-3 font-sans text-xs">
                            <span className="font-bold text-[#1A1A1A] block">{item.serviceCategory}</span>
                            {item.serviceDescription && (
                              <span className="text-[10px] text-[#666666] line-clamp-1">
                                {item.serviceDescription}
                              </span>
                            )}
                          </td>

                          {/* Expected Cost */}
                          <td className="py-3 px-3 text-right font-bold text-gray-900 font-mono text-xs whitespace-nowrap">
                            {formatCurrency(item.expectedCost)}
                          </td>

                          {/* Paid Cost */}
                          <td className="py-3 px-3 text-right font-bold text-emerald-700 font-mono text-xs whitespace-nowrap">
                            {formatCurrency(item.paidCost)}
                          </td>

                          {/* Balance */}
                          <td className={`py-3 px-3 text-right font-bold font-mono text-xs whitespace-nowrap ${
                            item.balance > 0
                              ? isExpired
                                ? 'text-rose-700'
                                : isUrgent15
                                ? 'text-amber-700'
                                : 'text-gray-900'
                              : 'text-gray-400'
                          }`}>
                            {formatCurrency(item.balance)}
                          </td>

                          {/* Due Date */}
                          <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px]">
                            <span className={`px-2 py-0.5 rounded ${
                              item.balance <= 0
                                ? 'text-gray-400'
                                : isExpired
                                ? 'bg-rose-100 text-rose-800 font-bold'
                                : isUrgent15
                                ? 'bg-amber-100 text-amber-800 font-bold'
                                : 'text-gray-700'
                            }`}>
                              {item.dueDate}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-center whitespace-nowrap font-sans">
                            {item.balance > 0 ? (
                              <button
                                onClick={() => handleStartPayment(item)}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] transition-colors shadow-2xs cursor-pointer flex items-center gap-1 mx-auto"
                              >
                                <DollarSign className="w-3 h-3" />
                                <span>Pagar</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedOperationId(item.operationId);
                                  onClose();
                                }}
                                className="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-gray-100 transition-colors cursor-pointer"
                                title="Ver File"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            )}
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

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-[#E5E5E1] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-[#666666] font-mono">
            {filteredBreakdown.length} servicio{filteredBreakdown.length !== 1 ? 's' : ''} registrado{filteredBreakdown.length !== 1 ? 's' : ''} en total
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#1A1A1A] hover:bg-black text-white font-bold transition-colors cursor-pointer"
          >
            Cerrar Desglose
          </button>
        </div>
      </div>

      {/* Fast Payment Modal */}
      {payingItem && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white border border-[#E5E5E1] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-xs">
            <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-indigo-950">Registrar Pago a Proveedor</h3>
                <p className="text-[11px] text-indigo-700 mt-0.5">
                  {supplier.name} • {payingItem.operationCode}
                </p>
              </div>
              <button
                onClick={() => setPayingItem(null)}
                className="p-1 rounded bg-white text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
                <div className="flex justify-between text-gray-500">
                  <span>File:</span>
                  <span className="font-bold text-gray-900 font-mono">{payingItem.operationCode} - {payingItem.operationName}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Servicio:</span>
                  <span className="font-semibold text-gray-900">{payingItem.serviceCategory}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Saldo a Pagar:</span>
                  <span className="font-bold text-rose-700 font-mono">{formatCurrency(payingItem.balance)}</span>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Monto a Pagar ($) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  max={payingItem.balance}
                  value={payAmount || ''}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-base font-mono font-bold text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1">Medio de Pago</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-gray-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="mercado_pago">Mercado Pago</option>
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-600 mb-1">Cuenta de Débito *</label>
                  <select
                    value={payAccountId}
                    onChange={(e) => setPayAccountId(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-gray-800 focus:outline-none focus:border-indigo-500"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({formatCurrency(acc.currentBalance)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Comprobante / Nro Referencia</label>
                <input
                  type="text"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  placeholder="ej. Transf. Nro 918239123"
                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Notas u Observaciones</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="ej. Cancelación total del micro"
                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPayingItem(null)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Confirmar Pago & Imputar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
