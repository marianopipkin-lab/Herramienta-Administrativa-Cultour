import React, { useState } from 'react';
import {
  X,
  Compass,
  Building2,
  Calendar,
  DollarSign,
  Users,
  Plus,
  Trash2,
  Save,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BusinessUnit, OperationStatus, AccountId, PaymentMethod } from '../../types';
import { formatCurrency } from '../../utils/financialCalculations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NewOperationModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { addOperation, suppliers, accounts } = useApp();

  const [form, setForm] = useState({
    name: '',
    code: `OP-2026-${Math.floor(100 + Math.random() * 900)}`,
    businessUnit: 'receptivo' as BusinessUnit,
    serviceType: 'City Tour & Excursión',
    clientOrSchool: '',
    date: new Date().toISOString().split('T')[0],
    endDate: '',
    passengerCount: 15,
    status: 'confirmada' as OperationStatus,
    responsiblePerson: 'Gastón Silva',
    observations: '',
    expectedRevenue: 450000,
    expectedCost: 280000,
  });

  // Optional initial income
  const [hasInitialIncome, setHasInitialIncome] = useState(true);
  const [initialIncomeAmount, setInitialIncomeAmount] = useState(200000);
  const [initialIncomeAccount, setInitialIncomeAccount] = useState<AccountId>('mp_gaston');

  // Optional supplier assignment
  const [assignedSuppliers, setAssignedSuppliers] = useState<Array<{
    supplierId: string;
    serviceCategory: string;
    expectedCost: number;
    expectedPaymentDate: string;
    paidFromAccountId: AccountId;
  }>>([
    {
      supplierId: suppliers[0]?.id || 'sup_1',
      serviceCategory: 'Transporte',
      expectedCost: 180000,
      expectedPaymentDate: new Date().toISOString().split('T')[0],
      paidFromAccountId: 'banco_santander'
    }
  ]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.clientOrSchool) {
      alert('Por favor ingrese el nombre de la operación y el cliente.');
      return;
    }

    const opId = `op_${Date.now()}`;

    // Build incomes
    const incomes = hasInitialIncome && initialIncomeAmount > 0 ? [
      {
        id: `inc_${Date.now()}`,
        operationId: opId,
        date: form.date,
        amount: Number(initialIncomeAmount),
        payerName: form.clientOrSchool,
        paymentMethod: 'mercado_pago' as PaymentMethod,
        accountId: initialIncomeAccount,
        status: 'cobrado' as const,
        reference: 'Seña / Cobro inicial'
      }
    ] : [];

    // Build supplier costs
    const supCosts = assignedSuppliers.map((s, idx) => {
      const supObj = suppliers.find(sp => sp.id === s.supplierId);
      return {
        id: `supc_${Date.now()}_${idx}`,
        operationId: opId,
        supplierId: s.supplierId,
        supplierName: supObj?.name || 'Proveedor',
        serviceCategory: s.serviceCategory,
        mpAlias: supObj?.mpAlias,
        expectedCost: Number(s.expectedCost),
        paidCost: 0,
        expectedPaymentDate: s.expectedPaymentDate,
        paidFromAccountId: s.paidFromAccountId,
        paymentMethod: 'transferencia' as PaymentMethod,
        status: 'pendiente' as const
      };
    });

    const totalExpCost = supCosts.reduce((sum, s) => sum + s.expectedCost, 0) || Number(form.expectedCost);
    const totalRecRev = incomes.reduce((sum, i) => sum + i.amount, 0);

    addOperation({
      name: form.name,
      code: form.code,
      businessUnit: form.businessUnit,
      serviceType: form.serviceType,
      clientOrSchool: form.clientOrSchool,
      date: form.date,
      endDate: form.endDate || undefined,
      passengerCount: Number(form.passengerCount),
      status: form.status,
      responsiblePerson: form.responsiblePerson,
      observations: form.observations,
      expectedRevenue: Number(form.expectedRevenue),
      receivedRevenue: totalRecRev,
      expectedCost: totalExpCost,
      paidCost: 0,
      incomes: incomes,
      suppliers: supCosts,
      students: []
    });

    onClose();
  };

  const handleAddSupplierRow = () => {
    setAssignedSuppliers([
      ...assignedSuppliers,
      {
        supplierId: suppliers[0]?.id || '',
        serviceCategory: 'Alojamiento',
        expectedCost: 100000,
        expectedPaymentDate: form.date,
        paidFromAccountId: 'banco_santander'
      }
    ]);
  };

  const handleRemoveSupplierRow = (index: number) => {
    setAssignedSuppliers(assignedSuppliers.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Nueva Operación Turística</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          
          {/* Section 1: General Info */}
          <div className="space-y-3">
            <h3 className="font-bold text-gray-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-600" />
              <span>1. Identificación del Servicio</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-gray-600 mb-1">Nombre de la Operación *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="ej. Transfer IN + City Tour Privado"
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Código Identificador</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-indigo-700 font-mono font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Unidad de Negocio</label>
                <select
                  value={form.businessUnit}
                  onChange={(e) => setForm({ ...form, businessUnit: e.target.value as BusinessUnit })}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="receptivo">Turismo Receptivo</option>
                  <option value="salidas">Salidas Educativas</option>
                  <option value="viajes">Viajes Educativos</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Cliente / Colegio / Agencia *</label>
                <input
                  type="text"
                  required
                  value={form.clientOrSchool}
                  onChange={(e) => setForm({ ...form, clientOrSchool: e.target.value })}
                  placeholder="ej. Agencia Brasil Tur / Col. Belgrano"
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Tipo de Servicio</label>
                <input
                  type="text"
                  value={form.serviceType}
                  onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                  placeholder="ej. Excursión / Viaje Egresados"
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Fecha Principal</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Cantidad Pasajeros (Pax)</label>
                <input
                  type="number"
                  value={form.passengerCount}
                  onChange={(e) => setForm({ ...form, passengerCount: parseInt(e.target.value, 10) || 1 })}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Responsable</label>
                <input
                  type="text"
                  value={form.responsiblePerson}
                  onChange={(e) => setForm({ ...form, responsiblePerson: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Financial Projection */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h3 className="font-bold text-gray-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>2. Presupuesto & Cobranza Inicial</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-600 mb-1">Ingreso Total Esperado ($)</label>
                <input
                  type="number"
                  value={form.expectedRevenue || ''}
                  onChange={(e) => setForm({ ...form, expectedRevenue: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-emerald-700 font-bold font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Costo Total Estimado ($)</label>
                <input
                  type="number"
                  value={form.expectedCost || ''}
                  onChange={(e) => setForm({ ...form, expectedCost: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-rose-700 font-bold font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Checkbox initial collection */}
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2">
              <label className="flex items-center gap-2 text-gray-800 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={hasInitialIncome}
                  onChange={(e) => setHasInitialIncome(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0 bg-white border-gray-300"
                />
                <span>Registrar seña o cobro inicial inmediatamente</span>
              </label>

              {hasInitialIncome && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-gray-600 mb-1">Monto Cobrado Inicial ($)</label>
                    <input
                      type="number"
                      value={initialIncomeAmount || ''}
                      onChange={(e) => setInitialIncomeAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-emerald-700 font-mono font-medium focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1">Cuenta Receptora</label>
                    <select
                      value={initialIncomeAccount}
                      onChange={(e) => setInitialIncomeAccount(e.target.value as AccountId)}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-800 focus:border-indigo-500"
                    >
                      {accounts.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Suppliers Assignment */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>3. Proveedores Asignados ({assignedSuppliers.length})</span>
              </h3>
              <button
                type="button"
                onClick={handleAddSupplierRow}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3 h-3" />
                <span>Agregar Proveedor</span>
              </button>
            </div>

            <div className="space-y-2">
              {assignedSuppliers.map((row, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                  <div className="sm:col-span-4">
                    <select
                      value={row.supplierId}
                      onChange={(e) => {
                        const updated = [...assignedSuppliers];
                        updated[idx].supplierId = e.target.value;
                        setAssignedSuppliers(updated);
                      }}
                      className="w-full bg-white border border-gray-200 rounded p-1.5 text-gray-800 text-xs focus:border-indigo-500"
                    >
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <select
                      value={row.serviceCategory}
                      onChange={(e) => {
                        const updated = [...assignedSuppliers];
                        updated[idx].serviceCategory = e.target.value;
                        setAssignedSuppliers(updated);
                      }}
                      className="w-full bg-white border border-gray-200 rounded p-1.5 text-gray-800 text-xs focus:border-indigo-500"
                    >
                      <option value="Transporte">Transporte</option>
                      <option value="Alojamiento">Alojamiento</option>
                      <option value="Gastronomía">Gastronomía</option>
                      <option value="Guías">Guías</option>
                      <option value="Entradas">Entradas</option>
                      <option value="Seguros">Seguros</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <input
                      type="number"
                      value={row.expectedCost || ''}
                      onChange={(e) => {
                        const updated = [...assignedSuppliers];
                        updated[idx].expectedCost = parseFloat(e.target.value) || 0;
                        setAssignedSuppliers(updated);
                      }}
                      placeholder="Costo $"
                      className="w-full bg-white border border-gray-200 rounded p-1.5 text-rose-700 font-mono text-xs focus:border-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveSupplierRow(idx)}
                      className="p-1 rounded text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Observations */}
          <div className="pt-3 border-t border-gray-100">
            <label className="block text-gray-600 mb-1">Observaciones / Notas Logísticas</label>
            <textarea
              rows={2}
              value={form.observations}
              onChange={(e) => setForm({ ...form, observations: e.target.value })}
              placeholder="Detalles sobre micros, horarios, pagos condicionados..."
              className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="text-gray-500 font-mono text-xs">
              Ganancia Estimada: <strong className="text-emerald-700">{formatCurrency(form.expectedRevenue - form.expectedCost)}</strong>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Crear Operación</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
