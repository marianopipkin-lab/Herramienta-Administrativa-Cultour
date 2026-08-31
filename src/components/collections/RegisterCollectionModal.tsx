import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Building,
  DollarSign,
  Calendar,
  FileText,
  User,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod, AccountId, Currency } from '../../types';
import { formatCurrency } from '../../utils/financialCalculations';
import { ClientCollectionSummary } from './collectionUtils';

interface RegisterCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialClient?: ClientCollectionSummary | null;
  initialOperationId?: string;
  initialAmount?: number;
  initialConcept?: string;
}

export const RegisterCollectionModal: React.FC<RegisterCollectionModalProps> = ({
  isOpen,
  onClose,
  initialClient,
  initialOperationId,
  initialAmount,
  initialConcept
}) => {
  const { operations, accounts, recordCollection } = useApp();

  const [selectedOpId, setSelectedOpId] = useState<string>(initialOperationId || (initialClient?.operationIds[0] || operations[0]?.id || ''));
  const [clientName, setClientName] = useState<string>(initialClient?.clientName || '');
  const [concept, setConcept] = useState<string>(initialConcept || 'Pago de Cuota');
  const [amount, setAmount] = useState<number>(initialAmount || 0);
  const [currency, setCurrency] = useState<Currency>(initialClient?.currency || 'ARS');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mercado_pago');
  const [destinationAccountId, setDestinationAccountId] = useState<AccountId>(accounts[0]?.id || 'mp_mariano');
  const [voucherOrReference, setVoucherOrReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (initialOperationId) {
      setSelectedOpId(initialOperationId);
      const op = operations.find(o => o.id === initialOperationId);
      if (op) {
        setClientName(op.clientOrSchool || op.name);
        setCurrency(op.currency || 'ARS');
      }
    } else if (initialClient) {
      setClientName(initialClient.clientName);
      setCurrency(initialClient.currency);
      if (initialClient.operationIds.length > 0) {
        setSelectedOpId(initialClient.operationIds[0]);
      }
    }
    if (initialAmount !== undefined) {
      setAmount(initialAmount);
    }
    if (initialConcept) {
      setConcept(initialConcept);
    }
  }, [initialClient, initialOperationId, initialAmount, initialConcept, operations]);

  const selectedOp = operations.find(o => o.id === selectedOpId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOpId) {
      alert('Por favor selecciona una operación / file.');
      return;
    }
    if (amount <= 0) {
      alert('El importe a cobrar debe ser mayor a 0.');
      return;
    }
    if (!clientName.trim()) {
      alert('Por favor ingresa el nombre del cliente o pagador.');
      return;
    }

    recordCollection({
      operationId: selectedOpId,
      clientName: clientName.trim(),
      concept: concept.trim() || 'Cobro Operativo',
      amount: Number(amount),
      currency,
      paymentMethod,
      destinationAccountId,
      voucherOrReference: voucherOrReference.trim(),
      notes: notes.trim()
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E1]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-50 text-[#059669] border border-emerald-200">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">Registrar Nuevo Cobro</h3>
              <p className="text-[11px] text-[#666666] font-mono">Ingreso de fondos vinculado a cliente y file</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#888888] hover:text-[#1A1A1A] p-1.5 rounded-lg hover:bg-[#F4F4F0] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          
          {/* Operation Selector */}
          <div>
            <label className="block text-[#666666] font-mono font-bold mb-1 uppercase text-[10px]">
              Operación / File Asociado *
            </label>
            <select
              value={selectedOpId}
              onChange={(e) => {
                const opId = e.target.value;
                setSelectedOpId(opId);
                const op = operations.find(o => o.id === opId);
                if (op) {
                  setClientName(op.clientOrSchool || op.name);
                  setCurrency(op.currency || 'ARS');
                }
              }}
              className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-[#1A1A1A] font-mono focus:outline-none focus:border-[#4F46E5] shadow-xs cursor-pointer font-bold"
            >
              {operations.map(op => (
                <option key={op.id} value={op.id}>
                  {op.code} - {op.name} ({op.clientOrSchool}) [{op.date}]
                </option>
              ))}
            </select>
          </div>

          {/* Client Name */}
          <div>
            <label className="block text-[#666666] font-mono font-bold mb-1 uppercase text-[10px]">
              Cliente / Escuela / Pagador *
            </label>
            <input
              type="text"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ej: Colegio San Martín o Juan Pérez"
              className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-[#1A1A1A] font-sans font-medium focus:outline-none focus:border-[#4F46E5] shadow-xs"
            />
          </div>

          {/* Concept */}
          <div>
            <label className="block text-[#666666] font-mono font-bold mb-1 uppercase text-[10px]">
              Concepto del Cobro *
            </label>
            <input
              type="text"
              required
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Ej: Cuota 1/3, Seña 30%, Pago Total"
              className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-[#1A1A1A] font-sans focus:outline-none focus:border-[#4F46E5] shadow-xs"
            />
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-[#666666] font-mono font-bold mb-1 uppercase text-[10px]">
                Importe Cobrado *
              </label>
              <input
                type="number"
                step="0.01"
                required
                min="0.01"
                value={amount || ''}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-[#1A1A1A] font-mono font-bold text-sm focus:outline-none focus:border-[#4F46E5] shadow-xs"
              />
            </div>
            <div>
              <label className="block text-[#666666] font-mono font-bold mb-1 uppercase text-[10px]">
                Moneda *
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-[#1A1A1A] font-mono font-bold text-sm focus:outline-none focus:border-[#4F46E5] shadow-xs cursor-pointer"
              >
                <option value="ARS">ARS ($)</option>
                <option value="USD">USD (US$)</option>
              </select>
            </div>
          </div>

          {/* Payment Method & Destination Account */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[#666666] font-mono font-bold mb-1 uppercase text-[10px]">
                Medio de Pago *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-[#1A1A1A] font-mono focus:outline-none focus:border-[#4F46E5] shadow-xs cursor-pointer"
              >
                <option value="mercado_pago">Mercado Pago</option>
                <option value="transferencia">Transferencia Bancaria</option>
                <option value="efectivo">Efectivo</option>
                <option value="paypal">PayPal</option>
                <option value="wetravel">WeTravel</option>
                <option value="tarjeta">Tarjeta Débito/Crédito</option>
                <option value="cheque">Cheque</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-[#666666] font-mono font-bold mb-1 uppercase text-[10px]">
                Cuenta Destino Real *
              </label>
              <select
                value={destinationAccountId}
                onChange={(e) => setDestinationAccountId(e.target.value)}
                className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-[#1A1A1A] font-mono focus:outline-none focus:border-[#4F46E5] shadow-xs cursor-pointer font-bold"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Voucher / Reference */}
          <div>
            <label className="block text-[#666666] font-mono font-bold mb-1 uppercase text-[10px]">
              Nro de Comprobante / Transacción / Referencia
            </label>
            <input
              type="text"
              value={voucherOrReference}
              onChange={(e) => setVoucherOrReference(e.target.value)}
              placeholder="Ej: Transferencia Santander #849102 / MP Op 928341"
              className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-[#1A1A1A] placeholder-[#888888] font-mono focus:outline-none focus:border-[#4F46E5] shadow-xs"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[#666666] font-mono font-bold mb-1 uppercase text-[10px]">
              Observaciones Internas
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles adicionales sobre el cobro o acuerdo..."
              className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-[#1A1A1A] placeholder-[#888888] font-sans focus:outline-none focus:border-[#4F46E5] shadow-xs resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#E5E5E1]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#F4F4F0] hover:bg-[#E5E5E1] text-[#1A1A1A] font-mono text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#1A1A1A] hover:bg-black text-white font-mono text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
              <span>Confirmar y Acreditar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
