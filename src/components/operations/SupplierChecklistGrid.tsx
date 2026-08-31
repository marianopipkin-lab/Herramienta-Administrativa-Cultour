import React, { useState, useMemo } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  Plus,
  Trash2,
  Receipt,
  X,
  ExternalLink,
  ShieldCheck,
  DollarSign
} from 'lucide-react';
import {
  Operation,
  SupplierContract,
  SupplierCostRecord,
  PaymentMethod,
  AccountId
} from '../../types';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/financialCalculations';

interface Props {
  operation: Operation;
}

export const SupplierChecklistGrid: React.FC<Props> = ({ operation }) => {
  const {
    updateOperation,
    suppliers,
    accounts,
    recordSupplierPayment
  } = useApp();

  const [paymentModalContract, setPaymentModalContract] = useState<{
    contract: SupplierContract | SupplierCostRecord;
    supplierName: string;
    supplierId: string;
    expectedCost: number;
    paidCost: number;
    balance: number;
  } | null>(null);

  const [paymentForm, setPaymentForm] = useState<{
    amount: number;
    paymentMethod: PaymentMethod;
    sourceAccountId: AccountId;
    concept: string;
    reference: string;
    notes: string;
  }>({
    amount: 0,
    paymentMethod: 'transferencia',
    sourceAccountId: 'galicia_ars',
    concept: 'Pago a Proveedor',
    reference: '',
    notes: ''
  });

  // Supplier items unified
  const supplierItems = useMemo(() => {
    const list: Array<{
      id: string;
      supplierId: string;
      supplierName: string;
      category: string;
      serviceDescription?: string;
      expectedCost: number;
      paidAmount: number;
      balance: number;
      status: 'pagado' | 'parcial' | 'pendiente' | 'vencido';
      dueDate?: string;
      rawContract?: SupplierContract;
      rawCostRecord?: SupplierCostRecord;
    }> = [];

    if (operation.supplierContracts && operation.supplierContracts.length > 0) {
      operation.supplierContracts.forEach(c => {
        list.push({
          id: c.id,
          supplierId: c.supplierId,
          supplierName: c.supplierName,
          category: c.serviceCategory,
          serviceDescription: c.serviceDescription,
          expectedCost: c.expectedCost,
          paidAmount: c.paidAmount,
          balance: c.balance,
          status: c.status,
          dueDate: c.dueDate,
          rawContract: c
        });
      });
    } else if (operation.suppliers && operation.suppliers.length > 0) {
      operation.suppliers.forEach(s => {
        const balance = Math.max(0, s.expectedCost - s.paidCost);
        const status = s.paidCost >= s.expectedCost && s.expectedCost > 0 ? 'pagado' : s.paidCost > 0 ? 'parcial' : 'pendiente';
        list.push({
          id: s.id,
          supplierId: s.supplierId,
          supplierName: s.supplierName,
          category: s.serviceCategory,
          serviceDescription: s.notes,
          expectedCost: s.expectedCost,
          paidAmount: s.paidCost,
          balance,
          status: status as any,
          dueDate: s.expectedPaymentDate,
          rawCostRecord: s
        });
      });
    }

    return list;
  }, [operation.supplierContracts, operation.suppliers]);

  // Categories list
  const categories = ['Transporte', 'Alojamiento', 'Gastronomía', 'Guías', 'Entradas', 'Seguros', 'Otros'];

  // Open Payment Modal (Rule 2: Derivative UI, Traceable action)
  const handleOpenPayment = (item: typeof supplierItems[0]) => {
    setPaymentModalContract({
      contract: (item.rawContract || item.rawCostRecord) as any,
      supplierId: item.supplierId,
      supplierName: item.supplierName,
      expectedCost: item.expectedCost,
      paidCost: item.paidAmount,
      balance: item.balance
    });
    setPaymentForm({
      amount: item.balance > 0 ? item.balance : item.expectedCost,
      paymentMethod: 'transferencia',
      sourceAccountId: 'galicia_ars',
      concept: `Pago a ${item.supplierName} - ${item.category} (${operation.code})`,
      reference: '',
      notes: `Cancelación de servicio en File ${operation.code}`
    });
  };

  // Confirm Formal Supplier Payment
  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalContract || paymentForm.amount <= 0) {
      alert('Ingrese un monto válido mayor a 0.');
      return;
    }

    recordSupplierPayment({
      operationId: operation.id,
      supplierId: paymentModalContract.supplierId,
      supplierName: paymentModalContract.supplierName,
      contractId: paymentModalContract.contract.id,
      concept: paymentForm.concept,
      amount: paymentForm.amount,
      currency: operation.currency,
      paymentMethod: paymentForm.paymentMethod,
      sourceAccountId: paymentForm.sourceAccountId,
      notes: paymentForm.notes,
      reference: paymentForm.reference
    });

    setPaymentModalContract(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2 font-serif">
            <Building2 className="w-5 h-5 text-[#4F46E5]" />
            Checklist de Proveedores & Prestadores de Servicios
          </h3>
          <p className="text-xs text-[#666666] mt-0.5">
            Control de contratación por rubro, presupuestos comprometidos y liquidación contable de pagos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-[#F9F9F7] border border-[#E5E5E1] text-xs">
            <span className="text-[#666666] mr-1.5">Total Presupuestado:</span>
            <span className="font-mono font-bold text-[#1A1A1A]">
              {formatCurrency(operation.expectedCost, operation.currency)}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-[#F9F9F7] border border-[#E5E5E1] text-xs">
            <span className="text-[#666666] mr-1.5">Pagado:</span>
            <span className="font-mono font-bold text-[#059669]">
              {formatCurrency(operation.paidCost, operation.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Categories Breakdown */}
      {supplierItems.length === 0 ? (
        <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-2xl p-10 text-center space-y-3 shadow-xs">
          <Building2 className="w-10 h-10 text-[#888888] mx-auto" />
          <h4 className="text-base font-semibold text-[#1A1A1A] font-serif">No hay costos de proveedores registrados</h4>
          <p className="text-xs text-[#666666] max-w-md mx-auto">
            Utilice la importación masiva de costos de proveedores o agregue presupuestos en la pestaña de costos.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map(cat => {
            const catItems = supplierItems.filter(s => s.category.toLowerCase() === cat.toLowerCase());
            if (catItems.length === 0) return null;

            const catExpected = catItems.reduce((sum, s) => sum + s.expectedCost, 0);
            const catPaid = catItems.reduce((sum, s) => sum + s.paidAmount, 0);
            const catBalance = catItems.reduce((sum, s) => sum + s.balance, 0);

            return (
              <div
                key={cat}
                className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-2xl overflow-hidden shadow-xs"
              >
                {/* Category Header */}
                <div className="px-5 py-3 bg-[#F9F9F7] border-b border-[#E5E5E1] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#1A1A1A] font-serif">{cat}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#E5E5E1] text-[#666666] font-medium font-mono">
                      {catItems.length} {catItems.length === 1 ? 'prestador' : 'prestadores'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-[#666666]">Total: <strong className="text-[#1A1A1A]">{formatCurrency(catExpected, operation.currency)}</strong></span>
                    <span className="text-[#666666]">Pagado: <strong className="text-[#059669]">{formatCurrency(catPaid, operation.currency)}</strong></span>
                    <span className="text-[#666666]">Saldo: <strong className="text-[#D97706]">{formatCurrency(catBalance, operation.currency)}</strong></span>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#666666]">
                    <thead className="bg-[#F9F9F7] text-[#666666] uppercase tracking-wider font-semibold border-b border-[#E5E5E1]">
                      <tr>
                        <th className="py-2.5 px-4">Proveedor / Prestador</th>
                        <th className="py-2.5 px-4">Detalle del Servicio</th>
                        <th className="py-2.5 px-3 text-right">Presupuesto</th>
                        <th className="py-2.5 px-3 text-right">Pagado</th>
                        <th className="py-2.5 px-3 text-right">Saldo</th>
                        <th className="py-2.5 px-3 text-center">Estado Financiero</th>
                        <th className="py-2.5 px-3 text-center w-24">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E1]">
                      {catItems.map(item => (
                        <tr key={item.id} className="hover:bg-[#F9F9F7]/60 transition-colors">
                          {/* Proveedor */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-[#1A1A1A]">{item.supplierName}</div>
                            {item.dueDate && (
                              <span className="text-[11px] text-[#888888] font-mono">Vence: {item.dueDate}</span>
                            )}
                          </td>

                          {/* Detalle */}
                          <td className="py-3 px-4 text-[#666666]">
                            {item.serviceDescription || 'Sin detalle adicional'}
                          </td>

                          {/* Presupuesto */}
                          <td className="py-3 px-3 text-right font-mono font-medium text-[#1A1A1A]">
                            {formatCurrency(item.expectedCost, operation.currency)}
                          </td>

                          {/* Pagado */}
                          <td className="py-3 px-3 text-right font-mono text-[#059669] font-medium">
                            {formatCurrency(item.paidAmount, operation.currency)}
                          </td>

                          {/* Saldo */}
                          <td className="py-3 px-3 text-right font-mono">
                            {item.balance > 0 ? (
                              <span className="text-[#D97706] font-bold">
                                {formatCurrency(item.balance, operation.currency)}
                              </span>
                            ) : (
                              <span className="text-[#059669] font-medium flex items-center justify-end gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Saldado
                              </span>
                            )}
                          </td>

                          {/* Estado Derivado (Rule 2) */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                item.status === 'pagado'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : item.status === 'parcial'
                                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                                  : 'bg-rose-50 text-rose-700 border-rose-300'
                              }`}
                            >
                              {item.status === 'pagado' && <CheckCircle2 className="w-3 h-3" />}
                              {item.status === 'parcial' && <Clock className="w-3 h-3" />}
                              {item.status === 'pendiente' && <AlertTriangle className="w-3 h-3" />}
                              {item.status === 'pagado' ? 'Pagado 100%' : item.status === 'parcial' ? 'Parcial' : 'Impago'}
                            </span>
                          </td>

                          {/* Pagar (Rule 2) */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenPayment(item)}
                              className="px-2.5 py-1 rounded bg-[#F4F4F0] hover:bg-[#1A1A1A] hover:text-white border border-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold flex items-center gap-1 mx-auto transition-colors cursor-pointer"
                              title="Registrar Pago Contable a Proveedor"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Pagar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FINANCIAL PAYMENT MODAL (Rule 2: Derivative UI, Traceable action) */}
      {paymentModalContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-[#F9F9F7] border-b border-[#E5E5E1] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#059669]" />
                <h3 className="text-base font-bold text-[#1A1A1A] font-serif">Registrar Pago a Proveedor</h3>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalContract(null)}
                className="p-1.5 text-[#666666] hover:text-[#1A1A1A] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4">
              <div className="bg-[#F9F9F7] p-3.5 rounded-xl border border-[#E5E5E1] space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#666666]">Proveedor:</span>
                  <span className="font-semibold text-[#1A1A1A]">{paymentModalContract.supplierName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#666666]">File:</span>
                  <span className="font-mono text-[#4F46E5]">{operation.code} - {operation.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#666666]">Presupuesto Total:</span>
                  <span className="font-mono text-[#1A1A1A]">{formatCurrency(paymentModalContract.expectedCost, operation.currency)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#666666]">Saldo Restante:</span>
                  <span className="font-mono font-bold text-[#D97706]">
                    {formatCurrency(paymentModalContract.balance, operation.currency)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#666666] mb-1">
                  Monto a Transferir / Pagar ({operation.currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  className="w-full bg-[#FFFFFF] border border-[#E5E5E1] rounded-xl px-4 py-2.5 text-sm text-[#1A1A1A] font-mono font-bold focus:border-[#059669] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#666666] mb-1">Medio de Pago *</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
                    className="w-full bg-[#FFFFFF] border border-[#E5E5E1] rounded-xl px-3 py-2.5 text-xs text-[#1A1A1A]"
                  >
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="mercado_pago">Mercado Pago / CVU</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="paypal">PayPal</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#666666] mb-1">Cuenta Origen (Débito) *</label>
                  <select
                    value={paymentForm.sourceAccountId}
                    onChange={e => setPaymentForm({ ...paymentForm, sourceAccountId: e.target.value })}
                    className="w-full bg-[#FFFFFF] border border-[#E5E5E1] rounded-xl px-3 py-2.5 text-xs text-[#1A1A1A]"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.currency} - Saldo: {formatCurrency(acc.currentBalance, acc.currency)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#666666] mb-1">N° Comprobante / Transferencia</label>
                <input
                  type="text"
                  placeholder="Ej. TRANSF-GAL-998822"
                  value={paymentForm.reference}
                  onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  className="w-full bg-[#FFFFFF] border border-[#E5E5E1] rounded-xl px-4 py-2 text-xs text-[#1A1A1A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#666666] mb-1">Concepto</label>
                <input
                  type="text"
                  value={paymentForm.concept}
                  onChange={e => setPaymentForm({ ...paymentForm, concept: e.target.value })}
                  className="w-full bg-[#FFFFFF] border border-[#E5E5E1] rounded-xl px-4 py-2 text-xs text-[#1A1A1A]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E5E1]">
                <button
                  type="button"
                  onClick={() => setPaymentModalContract(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#FFFFFF] hover:bg-[#F4F4F0] border border-[#E5E5E1] text-[#1A1A1A] text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-black text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Confirmar y Debitar de Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
