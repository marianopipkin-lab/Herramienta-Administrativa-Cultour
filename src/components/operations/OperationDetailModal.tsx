import React, { useState } from 'react';
import {
  X,
  Compass,
  Users,
  Building2,
  Calendar,
  Wallet,
  TrendingUp,
  Receipt,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Edit2,
  Save,
  DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  Operation,
  OperationIncomeRecord,
  SupplierCostRecord,
  StudentPayer,
  PaymentMethod,
  AccountId
} from '../../types';
import { formatCurrency, formatPercent } from '../../utils/financialCalculations';
import { OperationPreparationChecklistView } from './OperationPreparationChecklistView';
import { OperationItineraryView } from './OperationItineraryView';
import { PassengerChecklistGrid } from './PassengerChecklistGrid';
import { SupplierChecklistGrid } from './SupplierChecklistGrid';
import { ShieldCheck, CheckSquare, ListChecks } from 'lucide-react';

interface Props {
  operationId: string;
  onClose: () => void;
}

export const OperationDetailModal: React.FC<Props> = ({ operationId, onClose }) => {
  const {
    operations,
    updateOperation,
    deleteOperation,
    suppliers,
    accounts,
    movements,
    updateStudentPayment,
    addStudentToOperation
  } = useApp();

  const operation = operations.find(op => op.id === operationId);

  const [activeTab, setActiveTab] = useState<
    'rentabilidad' | 'preparacion' | 'itinerario' | 'pasajeros_checklist' | 'proveedores_checklist' | 'ingresos' | 'costos' | 'estudiantes' | 'movimientos' | 'info'
  >('rentabilidad');
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: operation?.name || '',
    serviceType: operation?.serviceType || '',
    clientOrSchool: operation?.clientOrSchool || '',
    date: operation?.date || '',
    endDate: operation?.endDate || '',
    passengerCount: operation?.passengerCount || 1,
    status: operation?.status || 'confirmada',
    responsiblePerson: operation?.responsiblePerson || '',
    observations: operation?.observations || '',
    expectedRevenue: operation?.expectedRevenue || 0,
    expectedCost: operation?.expectedCost || 0,
  });

  // New Income record state
  const [newIncome, setNewIncome] = useState<{
    amount: number;
    payerName: string;
    date: string;
    paymentMethod: PaymentMethod;
    accountId: AccountId;
    status: 'cobrado' | 'pendiente';
    reference?: string;
  }>({
    amount: 0,
    payerName: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'mercado_pago',
    accountId: 'mp_gaston',
    status: 'cobrado'
  });
  const [showAddIncome, setShowAddIncome] = useState(false);

  // New Supplier cost state
  const [newSupplierCost, setNewSupplierCost] = useState<{
    supplierId: string;
    serviceCategory: string;
    expectedCost: number;
    paidCost: number;
    expectedPaymentDate: string;
    paidFromAccountId: AccountId;
    paymentMethod: PaymentMethod;
    notes?: string;
  }>({
    supplierId: suppliers[0]?.id || '',
    serviceCategory: 'Transporte',
    expectedCost: 0,
    paidCost: 0,
    expectedPaymentDate: operation?.date || new Date().toISOString().split('T')[0],
    paidFromAccountId: 'banco_santander',
    paymentMethod: 'transferencia'
  });
  const [showAddSupplier, setShowAddSupplier] = useState(false);

  // New Student state
  const [newStudent, setNewStudent] = useState({
    studentName: '',
    payerName: '',
    payerPhone: '',
    expectedAmount: 180000,
    paidAmount: 0,
    paymentDueDate: operation?.date || new Date().toISOString().split('T')[0]
  });
  const [showAddStudent, setShowAddStudent] = useState(false);

  if (!operation) return null;

  // Real calculations
  const pendingRevenue = Math.max(0, operation.expectedRevenue - operation.receivedRevenue);
  const pendingCost = Math.max(0, operation.expectedCost - operation.paidCost);
  const expectedProfit = operation.expectedRevenue - operation.expectedCost;
  const realizedProfit = operation.receivedRevenue - operation.paidCost;
  const pendingProfit = expectedProfit - realizedProfit;
  const marginPercent = operation.expectedRevenue > 0 ? (expectedProfit / operation.expectedRevenue) * 100 : 0;

  // Filter linked movements
  const linkedMovements = movements.filter(m => m.operationId === operation.id);

  // Save General Info changes
  const handleSaveInfo = () => {
    updateOperation(operation.id, {
      name: editForm.name,
      serviceType: editForm.serviceType,
      clientOrSchool: editForm.clientOrSchool,
      date: editForm.date,
      endDate: editForm.endDate,
      passengerCount: Number(editForm.passengerCount),
      status: editForm.status as any,
      responsiblePerson: editForm.responsiblePerson,
      observations: editForm.observations,
      expectedRevenue: Number(editForm.expectedRevenue),
      expectedCost: Number(editForm.expectedCost)
    });
    setIsEditingInfo(false);
  };

  // Add Income record
  const handleAddIncome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncome.amount || !newIncome.payerName) {
      alert('Por favor complete los campos obligatorios del cobro.');
      return;
    }

    const incomeRecord: OperationIncomeRecord = {
      id: `inc_${Date.now()}`,
      operationId: operation.id,
      amount: Number(newIncome.amount),
      payerName: newIncome.payerName,
      date: newIncome.date,
      paymentMethod: newIncome.paymentMethod,
      accountId: newIncome.accountId,
      status: newIncome.status,
      reference: newIncome.reference
    };

    const updatedIncomes = [...(operation.incomes || []), incomeRecord];
    const newReceivedRevenue = updatedIncomes
      .filter(i => i.status === 'cobrado')
      .reduce((sum, i) => sum + i.amount, 0);

    updateOperation(operation.id, {
      incomes: updatedIncomes,
      receivedRevenue: newReceivedRevenue
    });

    setShowAddIncome(false);
    setNewIncome({
      amount: 0,
      payerName: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'mercado_pago',
      accountId: 'mp_gaston',
      status: 'cobrado'
    });
  };

  // Add Supplier Cost
  const handleAddSupplierCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierCost.supplierId || !newSupplierCost.expectedCost) {
      alert('Seleccione un proveedor y un importe esperado.');
      return;
    }

    const supObj = suppliers.find(s => s.id === newSupplierCost.supplierId);
    const costRecord: SupplierCostRecord = {
      id: `supc_${Date.now()}`,
      operationId: operation.id,
      supplierId: newSupplierCost.supplierId,
      supplierName: supObj?.name || 'Proveedor General',
      serviceCategory: newSupplierCost.serviceCategory,
      mpAlias: supObj?.mpAlias,
      expectedCost: Number(newSupplierCost.expectedCost),
      paidCost: Number(newSupplierCost.paidCost),
      expectedPaymentDate: newSupplierCost.expectedPaymentDate,
      actualPaymentDate: newSupplierCost.paidCost > 0 ? new Date().toISOString().split('T')[0] : undefined,
      paidFromAccountId: newSupplierCost.paidFromAccountId,
      paymentMethod: newSupplierCost.paymentMethod,
      status: Number(newSupplierCost.paidCost) >= Number(newSupplierCost.expectedCost)
        ? 'pagado'
        : Number(newSupplierCost.paidCost) > 0
        ? 'parcial'
        : 'pendiente',
      notes: newSupplierCost.notes
    };

    const updatedSuppliers = [...(operation.suppliers || []), costRecord];
    const newExpectedCost = updatedSuppliers.reduce((sum, s) => sum + s.expectedCost, 0);
    const newPaidCost = updatedSuppliers.reduce((sum, s) => sum + s.paidCost, 0);

    updateOperation(operation.id, {
      suppliers: updatedSuppliers,
      expectedCost: newExpectedCost,
      paidCost: newPaidCost
    });

    setShowAddSupplier(false);
  };

  // Add Student record
  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.studentName || !newStudent.payerName) {
      alert('Ingrese nombre del estudiante y pagador.');
      return;
    }

    addStudentToOperation(operation.id, {
      studentName: newStudent.studentName,
      payerName: newStudent.payerName,
      payerPhone: newStudent.payerPhone,
      expectedAmount: Number(newStudent.expectedAmount),
      paidAmount: Number(newStudent.paidAmount),
      paymentDueDate: newStudent.paymentDueDate
    });

    setShowAddStudent(false);
    setNewStudent({
      studentName: '',
      payerName: '',
      payerPhone: '',
      expectedAmount: 180000,
      paidAmount: 0,
      paymentDueDate: operation.date
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-mono font-bold text-xs">
              {operation.code.split('-')[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900 tracking-tight">{operation.name}</h2>
                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {operation.code}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {operation.clientOrSchool} • {operation.date} • {operation.passengerCount} pasajeros
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm(`¿Eliminar la operación "${operation.name}"? Esta acción no se puede deshacer.`)) {
                  deleteOperation(operation.id);
                  onClose();
                }
              }}
              className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs transition-colors"
              title="Eliminar Operación"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 bg-[#18181b] border-b border-[#27272a] flex items-center gap-1 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('rentabilidad')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'rentabilidad'
                ? 'border-indigo-500 text-indigo-400 font-bold bg-indigo-950/40'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Rentabilidad & Resumen</span>
          </button>

          <button
            onClick={() => setActiveTab('preparacion')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'preparacion'
                ? 'border-indigo-500 text-indigo-400 font-bold bg-indigo-950/40'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Checklist Preparación File (18)</span>
          </button>

          <button
            onClick={() => setActiveTab('itinerario')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'itinerario'
                ? 'border-indigo-500 text-indigo-400 font-bold bg-indigo-950/40'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            <span>Itinerario Operativo ({operation.itinerary?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('pasajeros_checklist')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'pasajeros_checklist'
                ? 'border-indigo-500 text-indigo-400 font-bold bg-indigo-950/40'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Checklist Pasajeros ({operation.students?.length || operation.passengers?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('proveedores_checklist')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'proveedores_checklist'
                ? 'border-indigo-500 text-indigo-400 font-bold bg-indigo-950/40'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Checklist Proveedores ({operation.suppliers?.length || operation.supplierContracts?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('ingresos')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'ingresos'
                ? 'border-indigo-500 text-emerald-400 font-bold bg-emerald-950/40'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Cobranzas ({operation.incomes?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('costos')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'costos'
                ? 'border-indigo-500 text-rose-400 font-bold bg-rose-950/40'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Costos ({operation.suppliers?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('movimientos')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'movimientos'
                ? 'border-indigo-500 text-indigo-400 font-bold bg-indigo-950/40'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Movimientos ({linkedMovements.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'info'
                ? 'border-indigo-500 text-indigo-400 font-bold bg-indigo-950/40'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Info General</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: RENTABILIDAD & RESUMEN */}
          {activeTab === 'rentabilidad' && (
            <div className="space-y-6">
              
              {/* Financial KPI Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Ingreso Esperado</span>
                  <span className="text-lg font-bold text-emerald-700 font-mono">{formatCurrency(operation.expectedRevenue)}</span>
                  <span className="text-[11px] text-gray-500 block mt-1">Cobrado: {formatCurrency(operation.receivedRevenue)}</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Costo Esperado</span>
                  <span className="text-lg font-bold text-rose-700 font-mono">{formatCurrency(operation.expectedCost)}</span>
                  <span className="text-[11px] text-gray-500 block mt-1">Pagado: {formatCurrency(operation.paidCost)}</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <span className="text-[10px] uppercase font-bold text-indigo-600 block">Ganancia Esperada</span>
                  <span className="text-lg font-bold text-indigo-700 font-mono">{formatCurrency(expectedProfit)}</span>
                  <span className="text-[11px] text-indigo-600 font-mono block mt-1">Margen: {formatPercent(marginPercent)}</span>
                </div>
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">Resultado a la Fecha</span>
                  <span className="text-lg font-extrabold text-emerald-800 font-mono">{formatCurrency(realizedProfit)}</span>
                  <span className="text-[11px] text-emerald-700 block mt-1">Pendiente: {formatCurrency(pendingProfit)}</span>
                </div>
              </div>

              {/* Progress bars for collections & supplier payments */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-700">Cobranza de Ingresos</span>
                    <span className="text-emerald-700 font-mono font-bold">
                      {formatPercent(operation.expectedRevenue > 0 ? (operation.receivedRevenue / operation.expectedRevenue) * 100 : 0)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all"
                      style={{ width: `${Math.min(100, operation.expectedRevenue > 0 ? (operation.receivedRevenue / operation.expectedRevenue) * 100 : 0)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500 font-mono pt-1">
                    <span>Cobrado: {formatCurrency(operation.receivedRevenue)}</span>
                    <span className="text-amber-700">Falta cobrar: {formatCurrency(pendingRevenue)}</span>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-700">Cancelación a Proveedores</span>
                    <span className="text-amber-700 font-mono font-bold">
                      {formatPercent(operation.expectedCost > 0 ? (operation.paidCost / operation.expectedCost) * 100 : 0)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, operation.expectedCost > 0 ? (operation.paidCost / operation.expectedCost) * 100 : 0)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500 font-mono pt-1">
                    <span>Pagado: {formatCurrency(operation.paidCost)}</span>
                    <span className="text-amber-700">Falta pagar: {formatCurrency(pendingCost)}</span>
                  </div>
                </div>
              </div>

              {/* Quick Operation Summary Table */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Detalle de Rentabilidad Unitaria</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-gray-200">
                    <span className="text-gray-600">Ingreso Total Esperado (Venta pactada):</span>
                    <span className="font-mono font-semibold text-gray-900">{formatCurrency(operation.expectedRevenue)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-200">
                    <span className="text-gray-600">Ingreso Cobrado Efectivamente:</span>
                    <span className="font-mono font-semibold text-emerald-700">{formatCurrency(operation.receivedRevenue)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-200">
                    <span className="text-gray-600">Saldo Pendiente de Cobro:</span>
                    <span className="font-mono font-semibold text-amber-700">{formatCurrency(pendingRevenue)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-200">
                    <span className="text-gray-600">Costo Total Estimado a Proveedores:</span>
                    <span className="font-mono font-semibold text-rose-700">{formatCurrency(operation.expectedCost)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-200">
                    <span className="text-gray-600">Costos Pagados Efectivamente:</span>
                    <span className="font-mono font-semibold text-gray-800">{formatCurrency(operation.paidCost)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-200">
                    <span className="text-gray-600">Costos Pendientes de Pago:</span>
                    <span className="font-mono font-semibold text-amber-700">{formatCurrency(pendingCost)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-gray-300 text-sm font-bold">
                    <span className="text-indigo-700">Ganancia Esperada Final:</span>
                    <span className="font-mono text-emerald-700">{formatCurrency(expectedProfit)}</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB: PREPARACIÓN DEL FILE (18 ÍTEMS CONTEXTUALES) */}
          {activeTab === 'preparacion' && (
            <OperationPreparationChecklistView operation={operation} />
          )}

          {/* TAB: ITINERARIO OPERATIVO INTEGRADO (15-DAY ALERTS) */}
          {activeTab === 'itinerario' && (
            <OperationItineraryView operation={operation} />
          )}

          {/* TAB: CHECKLIST PASAJEROS / ALUMNOS (DOC, MED, AUTH, CUOTAS) */}
          {activeTab === 'pasajeros_checklist' && (
            <PassengerChecklistGrid operation={operation} />
          )}

          {/* TAB: CHECKLIST PROVEEDORES (SERVICIOS, ESTADOS, PAGOS) */}
          {activeTab === 'proveedores_checklist' && (
            <SupplierChecklistGrid operation={operation} />
          )}

          {/* TAB 2: INGRESOS */}
          {activeTab === 'ingresos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Cronograma y Registro de Cobranzas</h3>
                  <p className="text-xs text-gray-500">Cuentas receptoras, medios de pago y estado de cobro</p>
                </div>
                <button
                  onClick={() => setShowAddIncome(!showAddIncome)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Registrar Cobro</span>
                </button>
              </div>

              {/* Form add income */}
              {showAddIncome && (
                <form onSubmit={handleAddIncome} className="p-4 rounded-xl bg-gray-50 border border-emerald-200 space-y-3 animate-in fade-in text-xs">
                  <div className="font-bold text-emerald-800">Nuevo Ingreso / Cobranza</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-gray-600 mb-1">Monto ($)</label>
                      <input
                        type="number"
                        value={newIncome.amount || ''}
                        onChange={(e) => setNewIncome({ ...newIncome, amount: parseFloat(e.target.value) || 0 })}
                        placeholder="ej. 500000"
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 font-mono focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Pagador / Cliente</label>
                      <input
                        type="text"
                        value={newIncome.payerName}
                        onChange={(e) => setNewIncome({ ...newIncome, payerName: e.target.value })}
                        placeholder="Nombre o Colegio"
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Fecha</label>
                      <input
                        type="date"
                        value={newIncome.date}
                        onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 font-mono focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Medio de Pago</label>
                      <select
                        value={newIncome.paymentMethod}
                        onChange={(e) => setNewIncome({ ...newIncome, paymentMethod: e.target.value as any })}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:border-indigo-500"
                      >
                        <option value="mercado_pago">Mercado Pago</option>
                        <option value="transferencia">Transferencia Bancaria</option>
                        <option value="efectivo">Efectivo</option>
                        <option value="tarjeta">Tarjeta de Crédito/Débito</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Cuenta Receptora</label>
                      <select
                        value={newIncome.accountId}
                        onChange={(e) => setNewIncome({ ...newIncome, accountId: e.target.value as any })}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:border-indigo-500"
                      >
                        {accounts.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Estado</label>
                      <select
                        value={newIncome.status}
                        onChange={(e) => setNewIncome({ ...newIncome, status: e.target.value as any })}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:border-indigo-500"
                      >
                        <option value="cobrado">Cobrado Efectivo</option>
                        <option value="pendiente">Pendiente de Cobro</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddIncome(false)}
                      className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-2xs"
                    >
                      Guardar Cobro
                    </button>
                  </div>
                </form>
              )}

              {/* Incomes table */}
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Pagador</th>
                      <th className="py-2.5 px-3">Medio de Pago</th>
                      <th className="py-2.5 px-3">Cuenta Receptora</th>
                      <th className="py-2.5 px-3 text-right">Importe</th>
                      <th className="py-2.5 px-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-mono">
                    {(!operation.incomes || operation.incomes.length === 0) ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-gray-400 font-sans">
                          No hay cobros registrados aún.
                        </td>
                      </tr>
                    ) : (
                      operation.incomes.map((inc) => {
                        const acc = accounts.find(a => a.id === inc.accountId);
                        return (
                          <tr key={inc.id} className="hover:bg-gray-50/60">
                            <td className="py-2.5 px-3 text-gray-600">{inc.date}</td>
                            <td className="py-2.5 px-3 font-sans text-gray-900 font-medium">{inc.payerName}</td>
                            <td className="py-2.5 px-3 font-sans text-gray-600 capitalize">{inc.paymentMethod.replace('_', ' ')}</td>
                            <td className="py-2.5 px-3 font-sans text-gray-500">{acc?.name || inc.accountId}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{formatCurrency(inc.amount)}</td>
                            <td className="py-2.5 px-3 text-center font-sans">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                inc.status === 'cobrado'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : 'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}>
                                {inc.status}
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
          )}

          {/* TAB 3: COSTOS & PROVEEDORES */}
          {activeTab === 'costos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Proveedores y Costos Directos</h3>
                  <p className="text-xs text-gray-500">Detalle de servicios, alias MP, fechas de pago y cuentas de débito</p>
                </div>
                <button
                  onClick={() => setShowAddSupplier(!showAddSupplier)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Proveedor</span>
                </button>
              </div>

              {/* Form add supplier cost */}
              {showAddSupplier && (
                <form onSubmit={handleAddSupplierCost} className="p-4 rounded-xl bg-gray-50 border border-indigo-200 space-y-3 animate-in fade-in text-xs">
                  <div className="font-bold text-indigo-700">Nuevo Costo de Proveedor</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-gray-600 mb-1">Proveedor</label>
                      <select
                        value={newSupplierCost.supplierId}
                        onChange={(e) => setNewSupplierCost({ ...newSupplierCost, supplierId: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:border-indigo-500"
                      >
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Rubro / Servicio</label>
                      <select
                        value={newSupplierCost.serviceCategory}
                        onChange={(e) => setNewSupplierCost({ ...newSupplierCost, serviceCategory: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:border-indigo-500"
                      >
                        <option value="Transporte">Transporte</option>
                        <option value="Alojamiento">Alojamiento</option>
                        <option value="Gastronomía">Gastronomía</option>
                        <option value="Guías">Guías & Coordinación</option>
                        <option value="Entradas">Entradas & Parques</option>
                        <option value="Seguros">Seguros</option>
                        <option value="Otros">Otros</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Fecha Prevista de Pago</label>
                      <input
                        type="date"
                        value={newSupplierCost.expectedPaymentDate}
                        onChange={(e) => setNewSupplierCost({ ...newSupplierCost, expectedPaymentDate: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 font-mono focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Costo Esperado ($)</label>
                      <input
                        type="number"
                        value={newSupplierCost.expectedCost || ''}
                        onChange={(e) => setNewSupplierCost({ ...newSupplierCost, expectedCost: parseFloat(e.target.value) || 0 })}
                        placeholder="ej. 450000"
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 font-mono focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Importe Pagado ($)</label>
                      <input
                        type="number"
                        value={newSupplierCost.paidCost || ''}
                        onChange={(e) => setNewSupplierCost({ ...newSupplierCost, paidCost: parseFloat(e.target.value) || 0 })}
                        placeholder="ej. 200000"
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 font-mono focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Cuenta Débito</label>
                      <select
                        value={newSupplierCost.paidFromAccountId}
                        onChange={(e) => setNewSupplierCost({ ...newSupplierCost, paidFromAccountId: e.target.value as any })}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:border-indigo-500"
                      >
                        {accounts.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddSupplier(false)}
                      className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-2xs"
                    >
                      Guardar Proveedor
                    </button>
                  </div>
                </form>
              )}

              {/* Suppliers table */}
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Proveedor / Servicio</th>
                      <th className="py-2.5 px-3">Alias MP / CBU</th>
                      <th className="py-2.5 px-3 text-right">Costo Esperado</th>
                      <th className="py-2.5 px-3 text-right">Pagado</th>
                      <th className="py-2.5 px-3 text-right text-amber-700">Pendiente</th>
                      <th className="py-2.5 px-3">Fecha Prevista</th>
                      <th className="py-2.5 px-3">Cuenta Pago</th>
                      <th className="py-2.5 px-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-mono">
                    {(!operation.suppliers || operation.suppliers.length === 0) ? (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-gray-400 font-sans">
                          No hay proveedores asignados aún.
                        </td>
                      </tr>
                    ) : (
                      operation.suppliers.map((sup) => {
                        const pend = Math.max(0, sup.expectedCost - sup.paidCost);
                        const acc = accounts.find(a => a.id === sup.paidFromAccountId);
                        return (
                          <tr key={sup.id} className="hover:bg-gray-50/60">
                            <td className="py-2.5 px-3 font-sans">
                              <div className="font-bold text-gray-900">{sup.supplierName}</div>
                              <div className="text-[11px] text-gray-500">{sup.serviceCategory}</div>
                            </td>
                            <td className="py-2.5 px-3 text-indigo-600 text-[11px]">
                              {sup.mpAlias || '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right text-rose-700 font-semibold">{formatCurrency(sup.expectedCost)}</td>
                            <td className="py-2.5 px-3 text-right text-gray-700">{formatCurrency(sup.paidCost)}</td>
                            <td className="py-2.5 px-3 text-right text-amber-700 font-semibold">{pend > 0 ? formatCurrency(pend) : '-'}</td>
                            <td className="py-2.5 px-3 text-gray-500 text-[11px]">{sup.expectedPaymentDate}</td>
                            <td className="py-2.5 px-3 font-sans text-gray-500 text-[11px]">{acc?.name || '-'}</td>
                            <td className="py-2.5 px-3 text-center font-sans">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                sup.status === 'pagado'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : sup.status === 'parcial'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                  : 'bg-rose-50 text-rose-700 border border-rose-100'
                              }`}>
                                {sup.status}
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
          )}

          {/* TAB 4: ESTUDIANTES & PAGADORES */}
          {activeTab === 'estudiantes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Nómina de Estudiantes y Pagadores</h3>
                  <p className="text-xs text-gray-500">
                    Relación Estudiante ↔ Padre/Madre/Tutor ↔ Cuota ↔ Cobro
                  </p>
                </div>
                <button
                  onClick={() => setShowAddStudent(!showAddStudent)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Estudiante</span>
                </button>
              </div>

              {/* Add student form */}
              {showAddStudent && (
                <form onSubmit={handleAddStudent} className="p-4 rounded-xl bg-gray-50 border border-indigo-200 space-y-3 animate-in fade-in text-xs">
                  <div className="font-bold text-indigo-700">Nuevo Estudiante / Pagador</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-gray-600 mb-1">Nombre del Estudiante</label>
                      <input
                        type="text"
                        value={newStudent.studentName}
                        onChange={(e) => setNewStudent({ ...newStudent, studentName: e.target.value })}
                        placeholder="ej. Mateo Domínguez"
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Padre/Madre/Pagador</label>
                      <input
                        type="text"
                        value={newStudent.payerName}
                        onChange={(e) => setNewStudent({ ...newStudent, payerName: e.target.value })}
                        placeholder="ej. Patricia Domínguez (Madre)"
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Teléfono / WhatsApp</label>
                      <input
                        type="text"
                        value={newStudent.payerPhone}
                        onChange={(e) => setNewStudent({ ...newStudent, payerPhone: e.target.value })}
                        placeholder="ej. 11-4455-8899"
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Importe Esperado ($)</label>
                      <input
                        type="number"
                        value={newStudent.expectedAmount || ''}
                        onChange={(e) => setNewStudent({ ...newStudent, expectedAmount: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 font-mono focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Importe Pagado Inicial ($)</label>
                      <input
                        type="number"
                        value={newStudent.paidAmount || ''}
                        onChange={(e) => setNewStudent({ ...newStudent, paidAmount: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 font-mono focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Fecha Vencimiento</label>
                      <input
                        type="date"
                        value={newStudent.paymentDueDate}
                        onChange={(e) => setNewStudent({ ...newStudent, paymentDueDate: e.target.value })}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 font-mono focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddStudent(false)}
                      className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-2xs"
                    >
                      Guardar Estudiante
                    </button>
                  </div>
                </form>
              )}

              {/* Students table */}
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Estudiante</th>
                      <th className="py-2.5 px-3">Padre / Pagador</th>
                      <th className="py-2.5 px-3">Contacto</th>
                      <th className="py-2.5 px-3 text-right">Cuota Esperada</th>
                      <th className="py-2.5 px-3 text-right">Pagado</th>
                      <th className="py-2.5 px-3 text-right text-rose-700">Saldo Adeudado</th>
                      <th className="py-2.5 px-3 text-center">Estado</th>
                      <th className="py-2.5 px-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-mono">
                    {(!operation.students || operation.students.length === 0) ? (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-gray-400 font-sans">
                          No hay nómina de estudiantes cargada en esta operación.
                        </td>
                      </tr>
                    ) : (
                      operation.students.map((st) => {
                        const debt = Math.max(0, st.expectedAmount - st.paidAmount);
                        return (
                          <tr key={st.id} className="hover:bg-gray-50/60">
                            <td className="py-2.5 px-3 font-sans font-bold text-gray-900">{st.studentName}</td>
                            <td className="py-2.5 px-3 font-sans text-gray-700">{st.payerName}</td>
                            <td className="py-2.5 px-3 font-sans text-gray-500 text-[11px]">{st.payerPhone || '-'}</td>
                            <td className="py-2.5 px-3 text-right text-gray-600">{formatCurrency(st.expectedAmount)}</td>
                            <td className="py-2.5 px-3 text-right text-emerald-700 font-semibold">{formatCurrency(st.paidAmount)}</td>
                            <td className="py-2.5 px-3 text-right text-rose-700 font-bold">{debt > 0 ? formatCurrency(debt) : '$ 0'}</td>
                            <td className="py-2.5 px-3 text-center font-sans">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                st.status === 'al_dia'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : st.status === 'pago_parcial'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                  : 'bg-rose-50 text-rose-700 border border-rose-100'
                              }`}>
                                {st.status === 'al_dia' ? 'Al Día' : st.status === 'pago_parcial' ? 'Parcial' : 'Pendiente'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-sans">
                              {debt > 0 && (
                                <button
                                  onClick={() => {
                                    const amountStr = prompt(`Registrar cobro para ${st.studentName} (Deuda actual: ${formatCurrency(debt)}):`, String(debt));
                                    if (amountStr) {
                                      const newTotalPaid = st.paidAmount + (parseFloat(amountStr) || 0);
                                      updateStudentPayment(operation.id, st.id, newTotalPaid);
                                    }
                                  }}
                                  className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold shadow-2xs"
                                >
                                  Cobrar
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
          )}

          {/* TAB 5: MOVIMIENTOS VINCULADOS */}
          {activeTab === 'movimientos' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Extractos Financieros Conciliados con esta Operación</h3>
                <p className="text-xs text-gray-500">Ingresos y egresos bancarios o de Mercado Pago asociados</p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-3">Descripción / Extracto</th>
                      <th className="py-2.5 px-3">Cuenta</th>
                      <th className="py-2.5 px-3 text-right">Importe</th>
                      <th className="py-2.5 px-3 text-center">Nivel Conciliación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-mono">
                    {linkedMovements.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-400 font-sans">
                          No hay movimientos bancarios directamente vinculados a esta operación.
                        </td>
                      </tr>
                    ) : (
                      linkedMovements.map((mov) => {
                        const acc = accounts.find(a => a.id === mov.accountId);
                        return (
                          <tr key={mov.id} className="hover:bg-gray-50/60">
                            <td className="py-2.5 px-3 text-gray-600">{mov.date}</td>
                            <td className="py-2.5 px-3 font-sans capitalize">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                mov.type === 'ingreso' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}>
                                {mov.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-sans text-gray-800">{mov.description}</td>
                            <td className="py-2.5 px-3 font-sans text-gray-500">{acc?.name}</td>
                            <td className={`py-2.5 px-3 text-right font-bold ${
                              mov.type === 'ingreso' ? 'text-emerald-700' : 'text-rose-700'
                            }`}>
                              {mov.type === 'ingreso' ? '+' : '-'}{formatCurrency(mov.amount)}
                            </td>
                            <td className="py-2.5 px-3 text-center font-sans">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold">
                                Conciliado (Verde)
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
          )}

          {/* TAB 6: INFO GENERAL & EDIT */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">Datos Generales de la Operación</h3>
                <button
                  onClick={() => {
                    if (isEditingInfo) {
                      handleSaveInfo();
                    } else {
                      setIsEditingInfo(true);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  {isEditingInfo ? (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Guardar Cambios</span>
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar Información</span>
                    </>
                  )}
                </button>
              </div>

              {isEditingInfo ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
                  <div>
                    <label className="block text-gray-600 mb-1">Nombre de la Operación</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1">Cliente / Colegio</label>
                    <input
                      type="text"
                      value={editForm.clientOrSchool}
                      onChange={(e) => setEditForm({ ...editForm, clientOrSchool: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1">Tipo de Servicio</label>
                    <input
                      type="text"
                      value={editForm.serviceType}
                      onChange={(e) => setEditForm({ ...editForm, serviceType: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1">Responsable</label>
                    <input
                      type="text"
                      value={editForm.responsiblePerson}
                      onChange={(e) => setEditForm({ ...editForm, responsiblePerson: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1">Fecha</label>
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 font-mono focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1">Cantidad Pasajeros</label>
                    <input
                      type="number"
                      value={editForm.passengerCount}
                      onChange={(e) => setEditForm({ ...editForm, passengerCount: parseInt(e.target.value, 10) || 1 })}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 font-mono focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1">Ingreso Esperado ($)</label>
                    <input
                      type="number"
                      value={editForm.expectedRevenue}
                      onChange={(e) => setEditForm({ ...editForm, expectedRevenue: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 font-mono focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 mb-1">Costo Esperado ($)</label>
                    <input
                      type="number"
                      value={editForm.expectedCost}
                      onChange={(e) => setEditForm({ ...editForm, expectedCost: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 font-mono focus:border-indigo-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-gray-600 mb-1">Observaciones</label>
                    <textarea
                      rows={3}
                      value={editForm.observations}
                      onChange={(e) => setEditForm({ ...editForm, observations: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:border-indigo-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
                  <div>
                    <span className="text-gray-500 block">Tipo de Servicio:</span>
                    <span className="text-gray-900 font-semibold">{operation.serviceType}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Unidad de Negocio:</span>
                    <span className="text-gray-900 font-semibold capitalize">{operation.businessUnit}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Cliente / Institución:</span>
                    <span className="text-gray-900 font-semibold">{operation.clientOrSchool}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Responsable de Coordinación:</span>
                    <span className="text-gray-900 font-semibold">{operation.responsiblePerson}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Fecha Programada:</span>
                    <span className="text-gray-900 font-mono">{operation.date}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Pasajeros / Alumnos:</span>
                    <span className="text-gray-900 font-mono font-semibold">{operation.passengerCount} pax</span>
                  </div>
                  <div className="sm:col-span-2 pt-2 border-t border-gray-200">
                    <span className="text-gray-500 block mb-1">Observaciones & Logística:</span>
                    <p className="text-gray-700 leading-relaxed bg-white p-3 rounded-lg border border-gray-200">
                      {operation.observations || 'Sin observaciones adicionales.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
