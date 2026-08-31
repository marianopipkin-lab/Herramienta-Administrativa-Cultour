import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Link,
  ShieldCheck,
  Check,
  Layers,
  ArrowRightLeft,
  Search,
  Filter,
  Plus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FinancialMovement, Operation, Supplier, MatchStatus, AccountId } from '../../types';
import { formatCurrency } from '../../utils/financialCalculations';

interface ReconciliationViewProps {
  initialAccountId?: string;
  onBack?: () => void;
}

export const ReconciliationView: React.FC<ReconciliationViewProps> = ({
  initialAccountId = 'all',
  onBack
}) => {
  const { movements, operations, suppliers, accounts, rules, reconcileMovement, learnRule, deleteRule } = useApp();

  const [filterStatus, setFilterStatus] = useState<string>('pending'); // 'pending' (amarillo/rojo) or 'all' or 'verde'
  const [accountFilter, setAccountFilter] = useState<string>(initialAccountId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMovement, setSelectedMovement] = useState<FinancialMovement | null>(null);

  // Modal assign state
  const [targetType, setTargetType] = useState<'operation' | 'supplier' | 'internal'>('operation');
  const [selectedOpId, setSelectedOpId] = useState<string>('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [autoLearnRule, setAutoLearnRule] = useState<boolean>(true);

  const pendingCount = movements.filter(m => (accountFilter === 'all' || m.accountId === accountFilter) && m.matchStatus !== 'verde').length;
  const greenCount = movements.filter(m => (accountFilter === 'all' || m.accountId === accountFilter) && m.matchStatus === 'verde').length;
  const yellowCount = movements.filter(m => (accountFilter === 'all' || m.accountId === accountFilter) && m.matchStatus === 'amarillo').length;
  const redCount = movements.filter(m => (accountFilter === 'all' || m.accountId === accountFilter) && m.matchStatus === 'rojo').length;

  const filteredMovements = movements.filter(m => {
    if (accountFilter !== 'all' && m.accountId !== accountFilter) return false;
    if (filterStatus === 'pending' && m.matchStatus === 'verde') return false;
    if (filterStatus === 'verde' && m.matchStatus !== 'verde') return false;
    if (filterStatus === 'amarillo' && m.matchStatus !== 'amarillo') return false;
    if (filterStatus === 'rojo' && m.matchStatus !== 'rojo') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchDesc = m.description.toLowerCase().includes(q);
      const matchPayer = m.rawPayerOrAlias?.toLowerCase().includes(q);
      if (!matchDesc && !matchPayer) return false;
    }
    return true;
  });

  const handleOpenAssign = (mov: FinancialMovement) => {
    setSelectedMovement(mov);
    setSelectedOpId(mov.operationId || (operations[0]?.id ?? ''));
    setSelectedSupplierId(mov.supplierId || (suppliers[0]?.id ?? ''));
    setTargetType(mov.type === 'ingreso' ? 'operation' : mov.isInternalTransfer ? 'internal' : 'supplier');
  };

  const handleConfirmAssignment = () => {
    if (!selectedMovement) return;

    if (targetType === 'operation') {
      reconcileMovement(selectedMovement.id, {
        operationId: selectedOpId,
        category: 'Ingreso Operativo'
      });

      if (autoLearnRule && selectedMovement.rawPayerOrAlias) {
        learnRule({
          pattern: selectedMovement.rawPayerOrAlias,
          ruleType: 'payer_name',
          targetOperationId: selectedOpId
        });
      }
    } else if (targetType === 'supplier') {
      reconcileMovement(selectedMovement.id, {
        supplierId: selectedSupplierId,
        category: suppliers.find(s => s.id === selectedSupplierId)?.category || 'Costo Operativo'
      });

      if (autoLearnRule && selectedMovement.rawPayerOrAlias) {
        learnRule({
          pattern: selectedMovement.rawPayerOrAlias,
          ruleType: 'alias',
          targetSupplierId: selectedSupplierId
        });
      }
    } else if (targetType === 'internal') {
      reconcileMovement(selectedMovement.id, {
        isInternalTransfer: true,
        category: 'Transferencia Interna'
      });
    }

    setSelectedMovement(null);
  };

  const handleQuickApprove = (mov: FinancialMovement) => {
    reconcileMovement(mov.id, {
      operationId: mov.operationId,
      supplierId: mov.supplierId,
      isInternalTransfer: mov.isInternalTransfer
    });
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="mb-2 text-xs font-mono text-[#4F46E5] hover:underline flex items-center gap-1 cursor-pointer"
            >
              ← Volver a Movimientos Financieros
            </button>
          )}
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <span>Motor de Conciliación & Reglas de Inteligencia</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Asignación de movimientos de extractos a operaciones y proveedores mediante aprendizaje de patrones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Account Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-mono">Cuenta:</label>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
            >
              <option value="all">Todas las Cuentas</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 text-xs font-mono">
            <span className="text-gray-500">Sin Conciliar:</span>
            <span className="font-bold text-amber-700">{pendingCount}</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-500">Total:</span>
            <span className="text-gray-900 font-bold">{movements.filter(m => accountFilter === 'all' || m.accountId === accountFilter).length}</span>
          </div>
        </div>
      </div>

      {/* Ribbon stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
        <button
          onClick={() => setFilterStatus('verde')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filterStatus === 'verde'
              ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs'
              : 'bg-white border-[#E5E7EB] hover:border-gray-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-600 font-medium">Conciliados (Verde)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-xl font-bold text-emerald-700 font-mono mt-1 block">{greenCount}</span>
        </button>

        <button
          onClick={() => setFilterStatus('amarillo')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filterStatus === 'amarillo'
              ? 'bg-amber-50/70 border-amber-300 shadow-2xs'
              : 'bg-white border-[#E5E7EB] hover:border-gray-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-600 font-medium">Sugeridos (Amarillo)</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-xl font-bold text-amber-700 font-mono mt-1 block">{yellowCount}</span>
        </button>

        <button
          onClick={() => setFilterStatus('rojo')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filterStatus === 'rojo'
              ? 'bg-rose-50/70 border-rose-300 shadow-2xs'
              : 'bg-white border-[#E5E7EB] hover:border-gray-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-600 font-medium">Sin Asignar (Rojo)</span>
            <HelpCircle className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-xl font-bold text-rose-700 font-mono mt-1 block">{redCount}</span>
        </button>

        <button
          onClick={() => setFilterStatus('pending')}
          className={`p-4 rounded-xl border text-left transition-all ${
            filterStatus === 'pending'
              ? 'bg-indigo-50/70 border-indigo-300 shadow-2xs'
              : 'bg-white border-[#E5E7EB] hover:border-gray-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-600 font-medium">Pendientes Totales</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-xl font-bold text-indigo-700 font-mono mt-1 block">{pendingCount}</span>
        </button>
      </div>

      {/* List of movements to reconcile */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Bandeja de Conciliación de Movimientos
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === 'all' ? 'bg-gray-100 text-gray-900 font-semibold' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Ver Todos ({movements.length})
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-100 text-xs">
          {filteredMovements.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No hay movimientos pendientes para el filtro seleccionado.
            </div>
          ) : (
            filteredMovements.map((mov) => {
              const acc = accounts.find(a => a.id === mov.accountId);
              const op = operations.find(o => o.id === mov.operationId);
              const sup = suppliers.find(s => s.id === mov.supplierId);

              return (
                <div key={mov.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/60 transition-colors">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-gray-500">{mov.date}</span>
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 text-[10px] font-medium">
                        {acc?.name.split('-')[0].trim() || mov.accountId}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        mov.type === 'ingreso' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : mov.type === 'egreso' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}>
                        {mov.type}
                      </span>
                    </div>

                    <div className="font-semibold text-gray-900 text-sm">{mov.description}</div>
                    
                    {mov.rawPayerOrAlias && (
                      <div className="text-gray-500 font-mono text-[11px]">
                        Detalle / Alias: <span className="text-indigo-600 font-semibold">{mov.rawPayerOrAlias}</span>
                      </div>
                    )}

                    {/* Match reasoning note */}
                    {mov.matchReason && (
                      <div className="text-[11px] text-amber-800 bg-amber-50/80 px-2 py-1 rounded-md border border-amber-200/60 inline-flex items-center gap-1.5 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Sugerencia Inteligente: {mov.matchReason}</span>
                      </div>
                    )}

                    {mov.matchStatus === 'verde' && (
                      <div className="text-[11px] text-emerald-700 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Asignado a: {op ? `Operación ${op.code} - ${op.name}` : sup ? `Proveedor ${sup.name}` : 'Transferencia interna'}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <div className={`font-mono text-base font-bold ${
                      mov.type === 'ingreso' ? 'text-emerald-700' : mov.type === 'egreso' ? 'text-rose-700' : 'text-purple-700'
                    }`}>
                      {mov.type === 'ingreso' ? '+' : mov.type === 'egreso' ? '-' : ''}
                      {formatCurrency(mov.amount)}
                    </div>

                    <div className="flex gap-2">
                      {mov.matchStatus === 'amarillo' && (
                        <button
                          onClick={() => handleQuickApprove(mov)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1 shadow-xs transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Aprobar Sugerencia</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenAssign(mov)}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 text-indigo-600 border border-gray-200 font-semibold text-xs flex items-center gap-1 shadow-xs transition-colors"
                      >
                        <Link className="w-3.5 h-3.5" />
                        <span>{mov.matchStatus === 'verde' ? 'Reasignar' : 'Conciliar'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Learned Rules Master Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Reglas de Aprendizaje Automático ({rules.length})
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 text-[10px]">
              <tr>
                <th className="py-3 px-3.5">Patrón / Alias</th>
                <th className="py-3 px-3">Tipo de Regla</th>
                <th className="py-3 px-3">Asignación Automática</th>
                <th className="py-3 px-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {rules.map((rule) => {
                const targetSup = suppliers.find(s => s.id === rule.targetSupplierId);
                const targetOp = operations.find(o => o.id === rule.targetOperationId);

                return (
                  <tr key={rule.id} className="hover:bg-gray-50/60">
                    <td className="py-2.5 px-3.5 font-bold text-indigo-700">{rule.pattern}</td>
                    <td className="py-2.5 px-3 font-sans text-gray-500 capitalize">{rule.ruleType.replace('_', ' ')}</td>
                    <td className="py-2.5 px-3 font-sans">
                      {targetSup && <span className="text-amber-800 font-semibold">Proveedor: {targetSup.name}</span>}
                      {targetOp && <span className="text-indigo-600 font-semibold">Operación: {targetOp.code} - {targetOp.name}</span>}
                      {rule.isInternalTransfer && <span className="text-purple-700 font-semibold">Transferencia Interna</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => {
                          if (confirm('¿Eliminar esta regla automática?')) {
                            deleteRule(rule.id);
                          }
                        }}
                        className="text-gray-400 hover:text-rose-600 p-1 transition-colors"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Assign */}
      {selectedMovement && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-xs">
            <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Conciliar Movimiento Financiero</h2>
              <button onClick={() => setSelectedMovement(null)} className="p-1 rounded bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-1">
                <div className="text-gray-500 font-mono text-[11px]">{selectedMovement.date} • {selectedMovement.accountId}</div>
                <div className="text-sm font-bold text-gray-900">{selectedMovement.description}</div>
                <div className="font-mono text-emerald-700 font-bold">{formatCurrency(selectedMovement.amount)}</div>
              </div>

              <div>
                <label className="block text-gray-700 mb-2 font-semibold">1. Imputar a:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetType('operation')}
                    className={`py-2 px-3 rounded-lg border font-semibold transition-all ${
                      targetType === 'operation'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Operación
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('supplier')}
                    className={`py-2 px-3 rounded-lg border font-semibold transition-all ${
                      targetType === 'supplier'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Proveedor
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('internal')}
                    className={`py-2 px-3 rounded-lg border font-semibold transition-all ${
                      targetType === 'internal'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Traspaso Interno
                  </button>
                </div>
              </div>

              {targetType === 'operation' && (
                <div>
                  <label className="block text-gray-700 mb-1 font-medium">Seleccione Operación:</label>
                  <select
                    value={selectedOpId}
                    onChange={(e) => setSelectedOpId(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:border-indigo-500"
                  >
                    {operations.map(op => (
                      <option key={op.id} value={op.id}>
                        {op.code} - {op.name} ({op.businessUnit})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {targetType === 'supplier' && (
                <div>
                  <label className="block text-gray-700 mb-1 font-medium">Seleccione Proveedor:</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:border-indigo-500"
                  >
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>
                        {sup.name} ({sup.category}) - {sup.mpAlias || 'Sin alias'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedMovement.rawPayerOrAlias && (
                <div className="pt-2 border-t border-gray-100">
                  <label className="flex items-center gap-2 cursor-pointer text-gray-700 font-medium">
                    <input
                      type="checkbox"
                      checked={autoLearnRule}
                      onChange={(e) => setAutoLearnRule(e.target.checked)}
                      className="rounded text-indigo-600 bg-white border-gray-300"
                    />
                    <span>
                      Aprender regla automática para futuros movimientos con <strong className="text-indigo-600 font-mono">"{selectedMovement.rawPayerOrAlias}"</strong>
                    </span>
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedMovement(null)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAssignment}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar Conciliación</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
