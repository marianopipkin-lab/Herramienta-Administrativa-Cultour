import React, { useState } from 'react';
import {
  X,
  Building,
  GraduationCap,
  Users,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Plus,
  ArrowRight,
  Filter,
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatPercent } from '../../utils/financialCalculations';
import { ClientCollectionSummary, ClientQuotaItem, ClientCollectionItem } from './collectionUtils';

interface ClientCollectionsDetailModalProps {
  client: ClientCollectionSummary;
  onClose: () => void;
  onOpenStudentPayer?: (operationId: string) => void;
  onOpenRegisterCollection: (client: ClientCollectionSummary, quota?: ClientQuotaItem) => void;
}

export const ClientCollectionsDetailModal: React.FC<ClientCollectionsDetailModalProps> = ({
  client,
  onClose,
  onOpenStudentPayer,
  onOpenRegisterCollection
}) => {
  const { setSelectedOperationId } = useApp();
  const [activeTab, setActiveTab] = useState<'quotas' | 'collections'>('quotas');
  const [filterStatus, setFilterStatus] = useState<'all' | 'vencido' | 'urgente_15d' | 'pendiente' | 'pagado'>('all');

  const filteredQuotas = client.quotas.filter(q => {
    if (filterStatus === 'vencido') return q.alertStatus === 'vencido';
    if (filterStatus === 'urgente_15d') return q.alertStatus === 'urgente_15d';
    if (filterStatus === 'pendiente') return q.balance > 0;
    if (filterStatus === 'pagado') return q.balance <= 0;
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-[#E5E5E1] flex flex-col sm:flex-row sm:items-start justify-between gap-4 bg-[#FDFDFD]">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                client.clientType === 'escuela'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : client.clientType === 'agencia'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {client.clientType === 'escuela' ? 'Escuela / Colegio' : client.clientType === 'agencia' ? 'Agencia de Viajes' : 'Turista Directo'}
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#1A1A1A]">{client.clientName}</h2>
            </div>
            <p className="text-xs text-[#666666] mt-1 font-mono">
              {client.operationsCount} {client.operationsCount === 1 ? 'file / operación vinculada' : 'files / operaciones vinculadas'} • Moneda {client.currency}
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {client.clientType === 'escuela' && client.operationIds.length > 0 && onOpenStudentPayer && (
              <button
                onClick={() => {
                  onClose();
                  onOpenStudentPayer(client.operationIds[0]);
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <GraduationCap className="w-3.5 h-3.5 text-[#4F46E5]" />
                <span>Ver Nómina de Alumnos</span>
              </button>
            )}
            <button
              onClick={() => onOpenRegisterCollection(client)}
              className="px-3.5 py-1.5 rounded-lg bg-[#1A1A1A] hover:bg-black text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Cobro</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#888888] hover:text-[#1A1A1A] hover:bg-[#F4F4F0] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Financial KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#F9F9F7] p-3.5 rounded-xl border border-[#E5E5E1]">
              <span className="text-[10px] font-mono uppercase font-bold text-[#666666] block">Total Contratado</span>
              <span className="text-lg font-bold text-[#1A1A1A] font-mono">{formatCurrency(client.totalContracted, client.currency)}</span>
              <span className="text-[10px] text-[#888888] font-mono block">Monto pactado total</span>
            </div>

            <div className="bg-[#F9F9F7] p-3.5 rounded-xl border border-[#E5E5E1]">
              <span className="text-[10px] font-mono uppercase font-bold text-[#059669] block">Total Cobrado</span>
              <span className="text-lg font-bold text-[#059669] font-mono">{formatCurrency(client.totalCollected, client.currency)}</span>
              <span className="text-[10px] text-[#059669]/80 font-mono block">
                {formatPercent(client.totalContracted > 0 ? (client.totalCollected / client.totalContracted) * 100 : 0)} recaudado
              </span>
            </div>

            <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200">
              <span className="text-[10px] font-mono uppercase font-bold text-[#E11D48] block">Saldo Pendiente</span>
              <span className="text-lg font-extrabold text-[#E11D48] font-mono">{formatCurrency(client.totalPending, client.currency)}</span>
              <span className="text-[10px] text-[#E11D48]/80 font-mono block">Resta por cobrar</span>
            </div>

            <div className="bg-[#F9F9F7] p-3.5 rounded-xl border border-[#E5E5E1]">
              <span className="text-[10px] font-mono uppercase font-bold text-[#666666] block">Estado de Cuotas</span>
              <div className="mt-1">
                {client.expiredQuotasCount > 0 ? (
                  <span className="text-xs font-bold text-[#E11D48] font-mono">
                    🔴 {client.expiredQuotasCount} vencidas ({formatCurrency(client.expiredQuotasAmount, client.currency)})
                  </span>
                ) : client.urgent15dQuotasCount > 0 ? (
                  <span className="text-xs font-bold text-[#D97706] font-mono">
                    🟡 {client.urgent15dQuotasCount} vencen ≤15d ({formatCurrency(client.urgent15dQuotasAmount, client.currency)})
                  </span>
                ) : (
                  <span className="text-xs font-bold text-[#059669] font-mono">
                    🟢 Al día / En fecha
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Operations Tags */}
          <div className="bg-[#F9F9F7] p-4 rounded-xl border border-[#E5E5E1] space-y-2">
            <span className="text-[10px] font-mono uppercase font-bold text-[#666666] block">Files / Operaciones Asociadas</span>
            <div className="flex flex-wrap gap-2">
              {client.operations.map(op => (
                <div
                  key={op.id}
                  className="flex items-center gap-2 bg-[#FFFFFF] border border-[#E5E5E1] px-3 py-1.5 rounded-lg text-xs"
                >
                  <span className="font-mono font-bold text-[#4F46E5]">{op.code}</span>
                  <span className="font-sans text-[#1A1A1A]">{op.name}</span>
                  <span className="text-[11px] text-[#888888] font-mono">({op.date})</span>
                  <button
                    onClick={() => {
                      onClose();
                      setSelectedOperationId(op.id);
                    }}
                    title="Ver ficha de operación"
                    className="text-[#4F46E5] hover:text-[#3730A3] ml-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-[#E5E5E1]">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('quotas')}
                className={`pb-2 text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeTab === 'quotas'
                    ? 'text-[#1A1A1A] border-b-2 border-[#1A1A1A]'
                    : 'text-[#888888] hover:text-[#1A1A1A]'
                }`}
              >
                Cuotas & Vencimientos ({client.quotas.length})
              </button>
              <button
                onClick={() => setActiveTab('collections')}
                className={`pb-2 text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeTab === 'collections'
                    ? 'text-[#1A1A1A] border-b-2 border-[#1A1A1A]'
                    : 'text-[#888888] hover:text-[#1A1A1A]'
                }`}
              >
                Cobros Registrados ({client.collections.length})
              </button>
            </div>

            {activeTab === 'quotas' && (
              <div className="flex items-center gap-1 text-[11px] font-mono">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${filterStatus === 'all' ? 'bg-[#1A1A1A] text-white font-bold' : 'text-[#666666]'}`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilterStatus('vencido')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${filterStatus === 'vencido' ? 'bg-rose-600 text-white font-bold' : 'text-[#E11D48]'}`}
                >
                  Vencidas
                </button>
                <button
                  onClick={() => setFilterStatus('pendiente')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${filterStatus === 'pendiente' ? 'bg-amber-600 text-white font-bold' : 'text-[#D97706]'}`}
                >
                  Pendientes
                </button>
              </div>
            )}
          </div>

          {/* Tab 1: Quotas Table */}
          {activeTab === 'quotas' && (
            <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F9F9F7] text-[#666666] uppercase font-mono border-b border-[#E5E5E1] text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">File / Operación</th>
                    <th className="py-2.5 px-3 font-semibold">Concepto / Cuota</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Importe</th>
                    <th className="py-2.5 px-3 text-right text-[#059669] font-semibold">Cobrado</th>
                    <th className="py-2.5 px-3 text-right text-[#E11D48] font-semibold">Saldo</th>
                    <th className="py-2.5 px-3 font-semibold">Vencimiento</th>
                    <th className="py-2.5 px-3 text-center font-semibold">Estado</th>
                    <th className="py-2.5 px-3 text-center font-semibold">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E1] font-mono">
                  {filteredQuotas.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[#888888] font-sans">
                        No hay cuotas que coincidan con el filtro seleccionado.
                      </td>
                    </tr>
                  ) : (
                    filteredQuotas.map(q => (
                      <tr
                        key={q.id}
                        className={`hover:bg-[#F4F4F0]/60 transition-colors ${
                          q.alertStatus === 'vencido' ? 'bg-rose-50/30' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-sans">
                          <span className="font-mono font-bold text-[#4F46E5]">{q.operationCode}</span>
                          <span className="text-[11px] text-[#666666] block">{q.operationName}</span>
                        </td>
                        <td className="py-2.5 px-3 font-sans font-medium text-[#1A1A1A]">
                          {q.concept}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {formatCurrency(q.amount, q.currency)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#059669] font-bold">
                          {formatCurrency(q.paidAmount, q.currency)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold">
                          {q.balance > 0 ? (
                            <span className={q.alertStatus === 'vencido' ? 'text-[#E11D48]' : 'text-[#D97706]'}>
                              {formatCurrency(q.balance, q.currency)}
                            </span>
                          ) : (
                            <span className="text-[#059669]">$ 0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col">
                            <span className={`text-[11px] font-bold ${
                              q.alertStatus === 'vencido' ? 'text-[#E11D48]' : q.alertStatus === 'urgente_15d' ? 'text-[#D97706]' : 'text-[#1A1A1A]'
                            }`}>
                              {q.dueDate}
                            </span>
                            {q.balance > 0 && (
                              <span className="text-[10px] text-[#888888]">
                                {q.daysDifference < 0 ? `Vencida (${Math.abs(q.daysDifference)}d)` : `Faltan ${q.daysDifference}d`}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans">
                          {q.isLiberated ? (
                            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Liberado
                            </span>
                          ) : q.balance <= 0 ? (
                            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Pagada
                            </span>
                          ) : q.alertStatus === 'vencido' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              🔴 Vencida
                            </span>
                          ) : q.alertStatus === 'urgente_15d' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              🟡 ≤ 15 días
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              En Fecha
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-sans">
                          {q.balance > 0 && !q.isLiberated && (
                            <button
                              onClick={() => onOpenRegisterCollection(client, q)}
                              className="px-2.5 py-1 rounded bg-[#1A1A1A] hover:bg-black text-white text-[11px] font-mono font-bold transition-colors shadow-xs cursor-pointer"
                            >
                              Cobrar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 2: Collections Receipts Table */}
          {activeTab === 'collections' && (
            <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F9F9F7] text-[#666666] uppercase font-mono border-b border-[#E5E5E1] text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Fecha de Cobro</th>
                    <th className="py-2.5 px-3 font-semibold">File / Operación</th>
                    <th className="py-2.5 px-3 font-semibold">Concepto</th>
                    <th className="py-2.5 px-3 text-right font-semibold text-[#059669]">Monto Recibido</th>
                    <th className="py-2.5 px-3 font-semibold">Medio de Pago</th>
                    <th className="py-2.5 px-3 font-semibold">Cuenta Destino</th>
                    <th className="py-2.5 px-3 font-semibold">Comprobante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E1] font-mono">
                  {client.collections.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#888888] font-sans">
                        No hay cobros registrados aún para este cliente.
                      </td>
                    </tr>
                  ) : (
                    client.collections.map(col => (
                      <tr key={col.id} className="hover:bg-[#F4F4F0]/60 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-[#1A1A1A]">
                          {col.date}
                        </td>
                        <td className="py-2.5 px-3 font-sans">
                          <span className="font-mono font-bold text-[#4F46E5]">{col.operationCode}</span>
                          <span className="text-[11px] text-[#666666] block">{col.operationName}</span>
                        </td>
                        <td className="py-2.5 px-3 font-sans text-[#1A1A1A]">
                          {col.concept}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#059669]">
                          {formatCurrency(col.amount, col.currency)}
                        </td>
                        <td className="py-2.5 px-3 font-sans capitalize text-[#666666]">
                          {col.paymentMethod.replace('_', ' ')}
                        </td>
                        <td className="py-2.5 px-3 text-[#666666] font-mono text-[11px]">
                          {col.destinationAccountId}
                        </td>
                        <td className="py-2.5 px-3 text-[#666666] font-mono text-[11px]">
                          {col.voucherOrReference || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
