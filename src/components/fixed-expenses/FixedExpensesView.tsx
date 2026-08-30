import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Layers,
  Calendar,
  DollarSign,
  TrendingDown,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FixedExpense, FixedExpenseCategory, AccountId } from '../../types';
import { formatCurrency } from '../../utils/financialCalculations';

export const FixedExpensesView: React.FC = () => {
  const { fixedExpenses, addFixedExpense, updateFixedExpense, deleteFixedExpense, accounts, openImportCenter } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null);

  const [form, setForm] = useState<{
    provider: string;
    description: string;
    category: FixedExpenseCategory;
    amount: number;
    dueDay: number;
    paidFromAccountId: AccountId;
    frequency: 'mensual' | 'anual' | 'quincenal' | 'trimestral';
  }>({
    provider: '',
    description: '',
    category: 'empleados',
    amount: 0,
    dueDay: 5,
    paidFromAccountId: 'banco_santander',
    frequency: 'mensual'
  });

  const categories: { id: FixedExpenseCategory; label: string; color: string }[] = [
    { id: 'empleados', label: 'Empleados & Sueldos', color: 'text-indigo-700 bg-indigo-50 border-indigo-100' },
    { id: 'marketing', label: 'Marketing & Publicidad', color: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
    { id: 'tecnologia', label: 'Tecnología & Software', color: 'text-purple-700 bg-purple-50 border-purple-100' },
    { id: 'administracion', label: 'Administración & Asesoría', color: 'text-amber-700 bg-amber-50 border-amber-100' },
    { id: 'otros', label: 'Otros Gastos Fijos', color: 'text-gray-700 bg-gray-100 border-gray-200' }
  ];

  const filteredExpenses = fixedExpenses.filter(fe => {
    if (categoryFilter !== 'all' && fe.category !== categoryFilter) return false;
    return true;
  });

  const totalMonthlyStructure = fixedExpenses
    .filter(f => f.status === 'activo')
    .reduce((sum, f) => sum + f.amount, 0);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.provider || form.amount <= 0) {
      alert('Por favor ingrese proveedor y monto mensual.');
      return;
    }

    addFixedExpense({
      provider: form.provider,
      description: form.description || form.provider,
      category: form.category,
      amount: Number(form.amount),
      dueDay: Number(form.dueDay),
      paidFromAccountId: form.paidFromAccountId,
      currency: 'ARS',
      frequency: form.frequency,
      status: 'activo'
    });

    setShowAddModal(false);
    setForm({
      provider: '',
      description: '',
      category: 'empleados',
      amount: 0,
      dueDay: 5,
      paidFromAccountId: 'banco_santander',
      frequency: 'mensual'
    });
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-rose-600" />
            <span>Estructura de Gastos Fijos</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Costos fijos mensuales recurrentes de la empresa (Sueldos, marketing, sistemas y honorarios).
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 text-right">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">Carga Mensual Fija</span>
            <span className="text-sm font-bold text-rose-700 font-mono">{formatCurrency(totalMonthlyStructure)}/mes</span>
          </div>

          <button
            onClick={() => openImportCenter('fixed_expenses')}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 text-emerald-700 border border-emerald-200 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Importar Excel</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Gasto Fijo</span>
          </button>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-xl border font-semibold transition-all ${
            categoryFilter === 'all'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          Todos ({fixedExpenses.length})
        </button>
        {categories.map(cat => {
          const subtotal = fixedExpenses.filter(f => f.category === cat.id && f.status === 'activo').reduce((sum, f) => sum + f.amount, 0);

          return (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl border font-semibold transition-all whitespace-nowrap ${
                categoryFilter === cat.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat.label} ({formatCurrency(subtotal)})
            </button>
          );
        })}
      </div>

      {/* Expenses Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExpenses.map((expense) => {
          const cat = categories.find(c => c.id === expense.category);
          const acc = accounts.find(a => a.id === expense.paidFromAccountId);

          return (
            <div
              key={expense.id}
              className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                expense.status === 'activo' ? 'border-[#E5E7EB] hover:border-gray-300' : 'border-gray-200 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{expense.provider}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold inline-block mt-1 ${cat?.color}`}>
                      {cat?.label}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingExpense(expense)}
                      className="p-1.5 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Editar gasto fijo"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar gasto fijo "${expense.provider}"?`)) {
                          deleteFixedExpense(expense.id);
                        }
                      }}
                      className="p-1.5 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Eliminar gasto fijo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Importe Mensual:</span>
                    <span className="text-sm font-bold text-rose-700 font-mono">{formatCurrency(expense.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-500">Día de Pago:</span>
                    <span className="text-gray-800 font-mono">Día {expense.dueDay} de cada mes</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-500">Cuenta de Débito:</span>
                    <span className="text-gray-800 font-medium">{acc?.name}</span>
                  </div>
                  {expense.description && (
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-gray-500">Detalle:</span>
                      <span className="text-gray-800">{expense.description}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-gray-600 font-medium">
                  <input
                    type="checkbox"
                    checked={expense.status === 'activo'}
                    onChange={(e) => updateFixedExpense(expense.id, { status: e.target.checked ? 'activo' : 'pausado' })}
                    className="rounded text-indigo-600 focus:ring-0 bg-white border-gray-300"
                  />
                  <span>{expense.status === 'activo' ? 'Activo en proyección' : 'Pausado'}</span>
                </label>

                <span className="text-[10px] text-gray-400 font-mono">Anual: {formatCurrency(expense.amount * 12)}</span>
              </div>

            </div>
          );
        })}
      </div>

      {/* Modal Add Fixed Expense */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-xs">
            <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Nuevo Gasto Fijo Recurrente</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-3">
              <div>
                <label className="block text-gray-600 mb-1">Proveedor / Beneficiario *</label>
                <input
                  type="text"
                  required
                  value={form.provider}
                  onChange={(e) => setForm({ ...form, provider: e.target.value })}
                  placeholder="ej. Estudio Contable Martínez & Asoc."
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Descripción del Concepto</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="ej. Asesoría impositiva y laboral"
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1">Rubro</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-800 focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-600 mb-1">Monto Mensual ($) *</label>
                  <input
                    type="number"
                    required
                    value={form.amount || ''}
                    onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="ej. 350000"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-rose-700 font-bold font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1">Día de Pago (1 a 31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={form.dueDay}
                    onChange={(e) => setForm({ ...form, dueDay: parseInt(e.target.value, 10) || 5 })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-1">Cuenta Habitual</label>
                  <select
                    value={form.paidFromAccountId}
                    onChange={(e) => setForm({ ...form, paidFromAccountId: e.target.value as any })}
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
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition-colors"
                >
                  Guardar Gasto Fijo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Fixed Expense */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-xs">
            <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Editar Gasto Fijo: {editingExpense.provider}</h2>
              <button onClick={() => setEditingExpense(null)} className="p-1 rounded bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateFixedExpense(editingExpense.id, {
                  provider: editingExpense.provider,
                  description: editingExpense.description,
                  category: editingExpense.category,
                  amount: Number(editingExpense.amount),
                  dueDay: Number(editingExpense.dueDay),
                  paidFromAccountId: editingExpense.paidFromAccountId,
                  status: editingExpense.status
                });
                setEditingExpense(null);
              }}
              className="p-6 space-y-3"
            >
              <div>
                <label className="block text-gray-600 mb-1 font-medium">Proveedor / Beneficiario *</label>
                <input
                  type="text"
                  required
                  value={editingExpense.provider}
                  onChange={(e) => setEditingExpense({ ...editingExpense, provider: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Descripción del Concepto</label>
                <input
                  type="text"
                  value={editingExpense.description}
                  onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Rubro</label>
                  <select
                    value={editingExpense.category}
                    onChange={(e) => setEditingExpense({ ...editingExpense, category: e.target.value as any })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-800 focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Monto Mensual ($) *</label>
                  <input
                    type="number"
                    required
                    value={editingExpense.amount || ''}
                    onChange={(e) => setEditingExpense({ ...editingExpense, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-rose-700 font-bold font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Día de Pago (1 a 31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={editingExpense.dueDay}
                    onChange={(e) => setEditingExpense({ ...editingExpense, dueDay: parseInt(e.target.value, 10) || 5 })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Cuenta Habitual</label>
                  <select
                    value={editingExpense.paidFromAccountId}
                    onChange={(e) => setEditingExpense({ ...editingExpense, paidFromAccountId: e.target.value as any })}
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
                  onClick={() => setEditingExpense(null)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition-colors"
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
