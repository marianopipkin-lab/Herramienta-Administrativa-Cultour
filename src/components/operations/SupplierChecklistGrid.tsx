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
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-400" />
            Checklist de Proveedores & Prestadores de Servicios
          </h3>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            Control de contratación por rubro, presupuestos comprometidos y liquidación contable de pagos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-[#202024] border border-[#27272a] text-xs">
            <span className="text-[#a1a1aa] mr-1.5">Total Presupuestado:</span>
            <span className="font-mono font-bold text-white">
              {formatCurrency(operation.expectedCost, operation.currency)}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-[#202024] border border-[#27272a] text-xs">
            <span className="text-[#a1a1aa] mr-1.5">Pagado:</span>
            <span className="font-mono font-bold text-emerald-400">
              {formatCurrency(operation.paidCost, operation.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Categories Breakdown */}
      {supplierItems.length === 0 ? (
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-10 text-center space-y-3">
          <Building2 className="w-10 h-10 text-zinc-600 mx-auto" />
          <h4 className="text-base font-semibold text-white">No hay costos de proveedores registrados</h4>
          <p className="text-xs text-[#a1a1aa] max-w-md mx-auto">
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
                className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden shadow-sm"
              >
                {/* Category Header */}
                <div className="px-5 py-3 bg-[#202024] border-b border-[#27272a] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{cat}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-medium">
                      {catItems.length} {catItems.length === 1 ? 'prestador' : 'prestadores'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-zinc-400">Total: <strong className="text-white">{formatCurrency(catExpected, operation.currency)}</strong></span>
                    <span className="text-zinc-400">Pagado: <strong className="text-emerald-400">{formatCurrency(catPaid, operation.currency)}</strong></span>
                    <span className="text-zinc-400">Saldo: <strong className="text-amber-400">{formatCurrency(catBalance, operation.currency)}</strong></span>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#a1a1aa]">
                    <thead className="bg-[#19191d] text-zinc-400 uppercase tracking-wider font-semibold border-b border-[#27272a]">
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
                    <tbody className="divide-y divide-[#27272a]">
                      {catItems.map(item => (
                        <tr key={item.id} className="hover:bg-[#202024]/40 transition-colors">
                          {/* Proveedor */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{item.supplierName}</div>
                            {item.dueDate && (
                              <span className="text-[11px] text-zinc-500 font-mono">Vence: {item.dueDate}</span>
                            )}
                          </td>

                          {/* Detalle */}
                          <td className="py-3 px-4 text-zinc-300">
                            {item.serviceDescription || 'Sin detalle adicional'}
                          </td>

                          {/* Presupuesto */}
                          <td className="py-3 px-3 text-right font-mono font-medium text-white">
                            {formatCurrency(item.expectedCost, operation.currency)}
                          </td>

                          {/* Pagado */}
                          <td className="py-3 px-3 text-right font-mono text-emerald-400 font-medium">
                            {formatCurrency(item.paidAmount, operation.currency)}
                          </td>

                          {/* Saldo */}
                          <td className="py-3 px-3 text-right font-mono">
                            {item.balance > 0 ? (
                              <span className="text-amber-400 font-bold">
                                {formatCurrency(item.balance, operation.currency)}
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-medium flex items-center justify-end gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Saldado
                              </span>
                            )}
                          </td>

                          {/* Estado Derivado (Rule 2) */}
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                item.status === 'pagado'
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                  : item.status === 'parcial'
                                  ? 'bg-amber-950 text-amber-300 border-amber-800'
                                  : 'bg-rose-950 text-rose-300 border-rose-800'
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
                              className="px-2.5 py-1 rounded bg-sky-950 hover:bg-sky-900 border border-sky-800 text-sky-300 text-xs font-semibold flex items-center gap-1 mx-auto transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-[#202024] border-b border-[#27272a] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">Registrar Pago a Proveedor</h3>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalContract(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4">
              <div className="bg-[#111113] p-3.5 rounded-xl border border-[#27272a] space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#a1a1aa]">Proveedor:</span>
                  <span className="font-semibold text-white">{paymentModalContract.supplierName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#a1a1aa]">File:</span>
                  <span className="font-mono text-indigo-300">{operation.code} - {operation.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#a1a1aa]">Presupuesto Total:</span>
                  <span className="font-mono text-white">{formatCurrency(paymentModalContract.expectedCost, operation.currency)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#a1a1aa]">Saldo Restante:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {formatCurrency(paymentModalContract.balance, operation.currency)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a1a1aa] mb-1">
                  Monto a Transferir / Pagar ({operation.currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  className="w-full bg-[#111113] border border-[#27272a] rounded-xl px-4 py-2.5 text-sm text-white font-mono font-bold focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#a1a1aa] mb-1">Medio de Pago *</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
                    className="w-full bg-[#111113] border border-[#27272a] rounded-xl px-3 py-2.5 text-xs text-white"
                  >
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="mercado_pago">Mercado Pago / CVU</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="paypal">PayPal</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#a1a1aa] mb-1">Cuenta Origen (Débito) *</label>
                  <select
                    value={paymentForm.sourceAccountId}
                    onChange={e => setPaymentForm({ ...paymentForm, sourceAccountId: e.target.value })}
                    className="w-full bg-[#111113] border border-[#27272a] rounded-xl px-3 py-2.5 text-xs text-white"
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
                <label className="block text-xs font-semibold text-[#a1a1aa] mb-1">N° Comprobante / Transferencia</label>
                <input
                  type="text"
                  placeholder="Ej. TRANSF-GAL-998822"
                  value={paymentForm.reference}
                  onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  className="w-full bg-[#111113] border border-[#27272a] rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a1a1aa] mb-1">Concepto</label>
                <input
                  type="text"
                  value={paymentForm.concept}
                  onChange={e => setPaymentForm({ ...paymentForm, concept: e.target.value })}
                  className="w-full bg-[#111113] border border-[#27272a] rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setPaymentModalContract(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#202024] hover:bg-[#27272a] text-zinc-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-950"
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
