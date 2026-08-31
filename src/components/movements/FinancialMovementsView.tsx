import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Filter,
  Search,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Calendar,
  Layers,
  X,
  FileSpreadsheet,
  Scale,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FinancialMovement, MovementType, MatchStatus, AccountId } from '../../types';
import { formatCurrency } from '../../utils/financialCalculations';
import { ReconciliationView } from '../reconciliation/ReconciliationView';

export const FinancialMovementsView: React.FC = () => {
  const {
    movements,
    accounts,
    operations,
    suppliers,
    addMovement,
    deleteMovement,
    updateMovement,
    clearMovementsOnly,
    openImportCenter
  } = useApp();

  const [activeTab, setActiveTab] = useState<'movements' | 'reconciliation'>('movements');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [matchFilter, setMatchFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMovement, setEditingMovement] = useState<FinancialMovement | null>(null);

  const pendingReconciliationCount = movements.filter(m => m.matchStatus !== 'verde').length;

  if (activeTab === 'reconciliation') {
    return (
      <div className="space-y-4">
        <ReconciliationView
          initialAccountId={accountFilter}
          onBack={() => setActiveTab('movements')}
        />
      </div>
    );
  }

  const [form, setForm] = useState<{
    date: string;
    amount: number;
    type: MovementType;
    description: string;
    rawPayerOrAlias: string;
    accountId: AccountId;
    category: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    type: 'ingreso',
    description: '',
    rawPayerOrAlias: '',
    accountId: 'mp_gaston',
    category: ''
  });

  const filteredMovements = movements.filter(m => {
    if (typeFilter !== 'all' && m.type !== typeFilter) return false;
    if (matchFilter !== 'all' && m.matchStatus !== matchFilter) return false;
    if (accountFilter !== 'all' && m.accountId !== accountFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchDesc = m.description.toLowerCase().includes(q);
      const matchPayer = m.rawPayerOrAlias?.toLowerCase().includes(q);
      if (!matchDesc && !matchPayer) return false;
    }
    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.amount <= 0 || !form.description) {
      alert('Por favor complete monto y descripción.');
      return;
    }

    addMovement({
      date: form.date,
      amount: Number(form.amount),
      type: form.type,
      description: form.description,
      rawPayerOrAlias: form.rawPayerOrAlias || form.description,
      accountId: form.accountId,
      category: form.category || (form.type === 'ingreso' ? 'Cobro Cliente' : 'Pago General'),
      matchStatus: 'rojo',
      isInternalTransfer: form.type === 'transferencia_interna',
      importedAt: new Date().toISOString()
    });

    setShowAddModal(false);
    setForm({
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      type: 'ingreso',
      description: '',
      rawPayerOrAlias: '',
      accountId: 'mp_gaston',
      category: ''
    });
  };

  const getMatchBadge = (status: MatchStatus) => {
    switch (status) {
      case 'verde':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>Verde (Conciliado)</span>
          </span>
        );
      case 'amarillo':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3" />
            <span>Amarillo (Sugerido)</span>
          </span>
        );
      case 'rojo':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <HelpCircle className="w-3 h-3" />
            <span>Rojo (Sin Asignar)</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
            <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
            <span>Movimientos Financieros & Extractos</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Registro cronológico de todos los movimientos de cuentas bancarias y billeteras de Mercado Pago.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Button to open Conciliación filtered by selected account */}
          <button
            onClick={() => setActiveTab('reconciliation')}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            title="Abrir motor de conciliación bancaria y Mercado Pago"
          >
            <Scale className="w-4 h-4 text-indigo-600" />
            <span>Conciliación Bancaria/MP</span>
            {pendingReconciliationCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono font-bold">
                {pendingReconciliationCount} pend.
              </span>
            )}
          </button>

          <button
            onClick={() => openImportCenter('movements')}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 text-emerald-700 border border-emerald-200 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Importar Extractos</span>
          </button>

          {movements.length > 0 && (
            <button
              onClick={() => {
                if (confirm('¿Vaciar todos los movimientos bancarios y extractos? Esta acción eliminará los movimientos registrados.')) {
                  clearMovementsOnly();
                }
              }}
              className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              title="Vaciar movimientos para cargar extractos reales"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vaciar Extractos</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[#1A1A1A] hover:bg-black text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Cargar Movimiento</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por descripción, alias o pagador..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-3 py-1.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-gray-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Todos los Tipos</option>
            <option value="ingreso">Solo Ingresos</option>
            <option value="egreso">Solo Egresos</option>
            <option value="transferencia_interna">Transferencias Internas</option>
          </select>

          <select
            value={matchFilter}
            onChange={(e) => setMatchFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-gray-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Todos los Estados (Verde/Amarillo/Rojo)</option>
            <option value="verde">Solo Conciliados (Verde)</option>
            <option value="amarillo">Solo Sugeridos (Amarillo)</option>
            <option value="rojo">Solo Sin Asignar (Rojo)</option>
          </select>

          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-gray-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Todas las Cuentas</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div className="text-gray-500 font-mono">
          Mostrando <strong className="text-gray-900">{filteredMovements.length}</strong> de {movements.length} movimientos
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 text-[10px]">
              <tr>
                <th className="py-3 px-3.5">Fecha</th>
                <th className="py-3 px-3">Cuenta</th>
                <th className="py-3 px-3">Tipo</th>
                <th className="py-3 px-3">Descripción / Alias MP</th>
                <th className="py-3 px-3 text-right">Monto</th>
                <th className="py-3 px-3 text-center">Estado Conciliación</th>
                <th className="py-3 px-3">Asignación</th>
                <th className="py-3 px-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400 font-sans">
                    No se encontraron movimientos financieros con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => {
                  const acc = accounts.find(a => a.id === mov.accountId);
                  const linkedOp = operations.find(o => o.id === mov.operationId);
                  const linkedSup = suppliers.find(s => s.id === mov.supplierId);

                  return (
                    <tr key={mov.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-3.5 text-gray-600 font-medium">{mov.date}</td>
                      <td className="py-3 px-3 font-sans">
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 text-[11px] font-medium">
                          {acc?.name.split('-')[0].trim() || mov.accountId}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-sans">
                        {mov.type === 'ingreso' ? (
                          <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            <span>Ingreso</span>
                          </span>
                        ) : mov.type === 'egreso' ? (
                          <span className="text-rose-700 flex items-center gap-1 font-semibold">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>Egreso</span>
                          </span>
                        ) : (
                          <span className="text-purple-700 flex items-center gap-1 font-semibold">
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span>Traspaso</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-sans text-gray-900">
                        <div className="font-medium">{mov.description}</div>
                        {mov.rawPayerOrAlias && mov.rawPayerOrAlias !== mov.description && (
                          <span className="text-[11px] text-gray-500 font-mono">{mov.rawPayerOrAlias}</span>
                        )}
                      </td>
                      <td className={`py-3 px-3 text-right font-bold ${
                        mov.type === 'ingreso' ? 'text-emerald-700' : mov.type === 'egreso' ? 'text-rose-700' : 'text-purple-700'
                      }`}>
                        {mov.type === 'ingreso' ? '+' : mov.type === 'egreso' ? '-' : ''}
                        {formatCurrency(mov.amount)}
                      </td>
                      <td className="py-3 px-3 text-center font-sans">
                        {getMatchBadge(mov.matchStatus)}
                      </td>
                      <td className="py-3 px-3 font-sans text-xs">
                        {linkedOp && (
                          <span className="text-indigo-600 font-semibold block">{linkedOp.code}: {linkedOp.name}</span>
                        )}
                        {linkedSup && (
                          <span className="text-amber-700 font-semibold block">{linkedSup.name}</span>
                        )}
                        {mov.isInternalTransfer && (
                          <span className="text-purple-700 text-[11px] font-medium">Movimiento Interno entre Cuentas</span>
                        )}
                        {!linkedOp && !linkedSup && !mov.isInternalTransfer && (
                          <span className="text-gray-400 text-[11px] italic">Pendiente de clasificar</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditingMovement(mov)}
                            className="p-1.5 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Editar movimiento"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('¿Eliminar este movimiento financiero?')) {
                                deleteMovement(mov.id);
                              }
                            }}
                            className="p-1.5 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Eliminar movimiento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-xs">
            <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Nuevo Movimiento Manual</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-3">
              <div>
                <label className="block text-gray-600 mb-1">Fecha *</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1">Tipo de Movimiento</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ingreso">Ingreso (+)</option>
                    <option value="egreso">Egreso (-)</option>
                    <option value="transferencia_interna">Transferencia Interna</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-600 mb-1">Monto ($) *</label>
                  <input
                    type="number"
                    required
                    value={form.amount || ''}
                    onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 font-bold font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Cuenta Bancaria / Billetera</label>
                <select
                  value={form.accountId}
                  onChange={(e) => setForm({ ...form, accountId: e.target.value as any })}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-800 focus:outline-none focus:border-indigo-500"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Descripción del Movimiento *</label>
                <input
                  type="text"
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="ej. Transferencia recibida Colegio San Martín"
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Alias MP / Pagador Crudo</label>
                <input
                  type="text"
                  value={form.rawPayerOrAlias}
                  onChange={(e) => setForm({ ...form, rawPayerOrAlias: e.target.value })}
                  placeholder="ej. sanmartin.administracion.mp"
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-indigo-700 font-mono focus:outline-none focus:border-indigo-500"
                />
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
                  Guardar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Movement Modal */}
      {editingMovement && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-xs">
            <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Editar Movimiento Financiero</h2>
              <button onClick={() => setEditingMovement(null)} className="p-1 rounded bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMovement(editingMovement.id, {
                  date: editingMovement.date,
                  amount: Number(editingMovement.amount),
                  type: editingMovement.type,
                  description: editingMovement.description,
                  rawPayerOrAlias: editingMovement.rawPayerOrAlias,
                  accountId: editingMovement.accountId,
                  matchStatus: editingMovement.matchStatus,
                  category: editingMovement.category
                });
                setEditingMovement(null);
              }}
              className="p-6 space-y-3"
            >
              <div>
                <label className="block text-gray-600 mb-1 font-medium">Fecha *</label>
                <input
                  type="date"
                  required
                  value={editingMovement.date}
                  onChange={(e) => setEditingMovement({ ...editingMovement, date: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Tipo</label>
                  <select
                    value={editingMovement.type}
                    onChange={(e) => setEditingMovement({ ...editingMovement, type: e.target.value as any })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ingreso">Ingreso (+)</option>
                    <option value="egreso">Egreso (-)</option>
                    <option value="transferencia_interna">Transferencia Interna</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Monto ($) *</label>
                  <input
                    type="number"
                    required
                    value={editingMovement.amount || ''}
                    onChange={(e) => setEditingMovement({ ...editingMovement, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 font-bold font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Cuenta Bancaria / Billetera</label>
                <select
                  value={editingMovement.accountId}
                  onChange={(e) => setEditingMovement({ ...editingMovement, accountId: e.target.value as any })}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-800 focus:outline-none focus:border-indigo-500"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Descripción del Movimiento *</label>
                <input
                  type="text"
                  required
                  value={editingMovement.description}
                  onChange={(e) => setEditingMovement({ ...editingMovement, description: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Alias MP / Pagador Crudo</label>
                <input
                  type="text"
                  value={editingMovement.rawPayerOrAlias || ''}
                  onChange={(e) => setEditingMovement({ ...editingMovement, rawPayerOrAlias: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-indigo-700 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Estado Conciliación</label>
                  <select
                    value={editingMovement.matchStatus}
                    onChange={(e) => setEditingMovement({ ...editingMovement, matchStatus: e.target.value as any })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="verde">Verde (Conciliado)</option>
                    <option value="amarillo">Amarillo (Sugerido)</option>
                    <option value="rojo">Rojo (Sin Asignar)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Categoría</label>
                  <input
                    type="text"
                    value={editingMovement.category || ''}
                    onChange={(e) => setEditingMovement({ ...editingMovement, category: e.target.value })}
                    placeholder="ej. Cobro Pasaje"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingMovement(null)}
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
