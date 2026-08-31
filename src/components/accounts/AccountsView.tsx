import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Wallet,
  Calendar,
  Save,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  X,
  Sparkles,
  Database
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AccountId, FinancialAccount } from '../../types';
import { formatCurrency } from '../../utils/financialCalculations';
import { DataManagementModal } from '../common/DataManagementModal';

export const AccountsView: React.FC = () => {
  const {
    accounts,
    addAccount,
    updateAccount,
    deleteAccount,
    updateAccountBalance,
    cutoffConfig,
    updateCutoffConfig,
    exchangeRate,
    kpis
  } = useApp();

  const [cutoffDate, setCutoffDate] = useState(cutoffConfig.cutoffDate);
  const [cutoffDescription, setCutoffDescription] = useState(cutoffConfig.description);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  // Balances state mapped by account.id
  const [balances, setBalances] = useState<Record<string, number>>({});

  useEffect(() => {
    const initial: Record<string, number> = {};
    accounts.forEach(acc => {
      initial[acc.id] = acc.currentBalance ?? 0;
    });
    setBalances(initial);
  }, [accounts]);

  // Calculate separated ARS and USD totals
  const totalARS = accounts
    .filter(a => a.currency === 'ARS')
    .reduce((sum, a) => sum + (Number(balances[a.id]) || 0), 0);

  const totalUSD = accounts
    .filter(a => a.currency === 'USD')
    .reduce((sum, a) => sum + (Number(balances[a.id]) || 0), 0);

  const rate = exchangeRate?.usdToArsRate || 1320;
  const totalEquivalentUSD = totalUSD + (rate > 0 ? totalARS / rate : 0);

  // Account Edit Modal state
  const [editingAccount, setEditingAccount] = useState<FinancialAccount | null>(null);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);

  // New Account form
  const [newAccountForm, setNewAccountForm] = useState<{
    name: string;
    type: 'banco' | 'mercado_pago' | 'efectivo' | 'inversion';
    currency: 'ARS' | 'USD';
    initialBalance: number;
    alias: string;
    cbu: string;
    holder: string;
    description: string;
  }>({
    name: '',
    type: 'banco',
    currency: 'ARS',
    initialBalance: 0,
    alias: '',
    cbu: '',
    holder: '',
    description: ''
  });

  const handleSaveCutoffAndBalances = () => {
    // Update cutoff config
    updateCutoffConfig({
      cutoffDate,
      description: cutoffDescription,
      accountsInitialBalances: balances,
      initialFixedCostsMonthly: cutoffConfig.initialFixedCostsMonthly
    });

    // Update each account balance and initial balance
    Object.entries(balances).forEach(([accId, bal]) => {
      const numBal = Number(bal) || 0;
      updateAccount(accId, { currentBalance: numBal, initialBalance: numBal });
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountForm.name.trim()) {
      alert('Por favor ingrese el nombre de la cuenta.');
      return;
    }

    const created = addAccount({
      name: newAccountForm.name,
      type: newAccountForm.type,
      currency: newAccountForm.currency,
      currentBalance: Number(newAccountForm.initialBalance) || 0,
      initialBalance: Number(newAccountForm.initialBalance) || 0,
      alias: newAccountForm.alias,
      cbu: newAccountForm.cbu,
      holder: newAccountForm.holder || 'Titular',
      description: newAccountForm.description
    });

    setBalances(prev => ({
      ...prev,
      [created.id]: Number(newAccountForm.initialBalance) || 0
    }));

    setIsAddAccountModalOpen(false);
    setNewAccountForm({
      name: '',
      type: 'banco',
      currency: 'ARS',
      initialBalance: 0,
      alias: '',
      cbu: '',
      holder: '',
      description: ''
    });
  };

  const handleSaveEditedAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    updateAccount(editingAccount.id, {
      name: editingAccount.name,
      type: editingAccount.type,
      currency: editingAccount.currency,
      currentBalance: Number(editingAccount.currentBalance) || 0,
      initialBalance: Number(editingAccount.initialBalance) || 0,
      alias: editingAccount.alias,
      cbu: editingAccount.cbu,
      holder: editingAccount.holder,
      description: editingAccount.description
    });

    setBalances(prev => ({
      ...prev,
      [editingAccount.id]: Number(editingAccount.currentBalance) || 0
    }));

    setEditingAccount(null);
  };

  const getAccountIconColor = (type: string, name: string) => {
    const lower = (type + ' ' + name).toLowerCase();
    if (lower.includes('mercado') || lower.includes('mp')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (lower.includes('santander')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (lower.includes('galicia')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (lower.includes('macro') || lower.includes('bbva')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (lower.includes('efectivo') || lower.includes('caja')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (lower.includes('plazo') || lower.includes('inversion')) return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
            <Landmark className="w-5 h-5 text-indigo-600" />
            <span>Cuentas Financieras & Configuración de Corte</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Carga tus cuentas bancarias, billeteras reales, saldos verificados y fecha de corte operativa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => setIsDataModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Empezar de Cero / Datos</span>
          </button>

          <button
            onClick={() => setIsAddAccountModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nueva Cuenta</span>
          </button>

          <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 text-right font-mono">
            <span className="text-[10px] uppercase font-bold text-gray-400 block font-sans">Total en Cuentas</span>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-sm font-bold text-gray-900">{formatCurrency(totalARS, 'ARS')}</span>
              <span className="text-xs text-gray-500">+</span>
              <span className="text-sm font-bold text-indigo-600">{formatCurrency(totalUSD, 'USD')}</span>
            </div>
            <span className="text-[10px] text-gray-400 block mt-0.5">
              ≈ {formatCurrency(totalEquivalentUSD, 'USD')} eq.
            </span>
          </div>
        </div>
      </div>

      {/* Cutoff Configuration Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>1. Parámetros de la Fecha de Corte (Punto Cero)</span>
          </h3>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold">
            Corte Activo: {cutoffConfig.cutoffDate}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-gray-600 mb-1 font-medium">Fecha de Corte Operativa *</label>
            <input
              type="date"
              value={cutoffDate}
              onChange={(e) => setCutoffDate(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-emerald-700 font-mono font-bold text-sm focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Las operaciones anteriores a esta fecha se tratan como histórico cerrado.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-gray-600 mb-1 font-medium">Descripción / Alcance del Corte</label>
            <input
              type="text"
              value={cutoffDescription}
              onChange={(e) => setCutoffDescription(e.target.value)}
              placeholder="ej. Corte inicial verificado para el inicio de gestión compartida con socios."
              className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-gray-900 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Account Balances Grid */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-indigo-600" />
              <span>2. Cuentas Financieras & Saldos Verificados</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Puedes agregar tus bancos, editar titulares, alias, CBU y actualizar los saldos reales de cada cuenta.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => {
            const iconColor = getAccountIconColor(account.type, account.name);

            return (
              <div key={account.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 relative group">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">{account.name}</h4>
                    <span className="text-[11px] text-gray-500 capitalize">{account.type.replace('_', ' ')} • {account.holder}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingAccount(account)}
                      className="p-1 rounded bg-white text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 transition-colors"
                      title="Editar datos de la cuenta"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {accounts.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar la cuenta "${account.name}"?`)) {
                            deleteAccount(account.id);
                          }
                        }}
                        className="p-1 rounded bg-white text-gray-400 hover:text-rose-600 hover:bg-rose-50 border border-gray-200 transition-colors"
                        title="Eliminar cuenta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Alias and CBU info */}
                {(account.alias || account.cbu) && (
                  <div className="bg-white/80 p-2 rounded-lg border border-gray-200 text-[10px] space-y-0.5 font-mono">
                    {account.alias && (
                      <div className="text-indigo-700 flex justify-between">
                        <span className="text-gray-400 font-sans">Alias:</span>
                        <span className="font-bold">{account.alias}</span>
                      </div>
                    )}
                    {account.cbu && (
                      <div className="text-gray-600 flex justify-between">
                        <span className="text-gray-400 font-sans">CBU:</span>
                        <span>{account.cbu}</span>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] text-gray-600 mb-1 font-semibold">
                    Saldo Real Verificado ({account.currency})
                  </label>
                  <input
                    type="number"
                    value={balances[account.id] !== undefined ? balances[account.id] : account.currentBalance}
                    onChange={(e) => setBalances({
                      ...balances,
                      [account.id]: parseFloat(e.target.value) || 0
                    })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 font-mono text-base font-bold text-gray-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-2 border-t border-gray-200 text-[11px] text-gray-500 flex justify-between items-center">
                  <span>Moneda: {account.currency}</span>
                  <span className="text-emerald-700 font-semibold">{formatCurrency(balances[account.id] || 0)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Save button & feedback */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            {savedSuccess ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span>¡Saldos y fecha de corte guardados correctamente!</span>
              </span>
            ) : (
              <span>Los cambios impactarán en los cálculos de la tenencia actual y proyectada.</span>
            )}
          </div>

          <button
            onClick={handleSaveCutoffAndBalances}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Configuración de Saldos</span>
          </button>
        </div>

      </div>

      {/* Add Account Modal */}
      {isAddAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-xs">
            <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Nueva Cuenta Bancaria o Billetera</h2>
              <button onClick={() => setIsAddAccountModalOpen(false)} className="p-1 rounded bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-6 space-y-3">
              <div>
                <label className="block text-gray-600 mb-1 font-medium">Nombre de la Cuenta *</label>
                <input
                  type="text"
                  required
                  value={newAccountForm.name}
                  onChange={(e) => setNewAccountForm({ ...newAccountForm, name: e.target.value })}
                  placeholder="ej. Banco Macro - Cuenta Operativa"
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Tipo</label>
                  <select
                    value={newAccountForm.type}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, type: e.target.value as any })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="banco">Banco Tradicional</option>
                    <option value="mercado_pago">Mercado Pago / Billetera</option>
                    <option value="efectivo">Efectivo / Caja</option>
                    <option value="inversion">Plazo Fijo / Inversión</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Moneda</label>
                  <select
                    value={newAccountForm.currency}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, currency: e.target.value as any })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ARS">ARS ($)</option>
                    <option value="USD">USD (U$S)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Saldo Inicial al Corte ($)</label>
                <input
                  type="number"
                  value={newAccountForm.initialBalance || ''}
                  onChange={(e) => setNewAccountForm({ ...newAccountForm, initialBalance: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 font-bold font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Titular de la Cuenta</label>
                <input
                  type="text"
                  value={newAccountForm.holder}
                  onChange={(e) => setNewAccountForm({ ...newAccountForm, holder: e.target.value })}
                  placeholder="ej. Mariano Pipkin / Agencia SRL"
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Alias</label>
                  <input
                    type="text"
                    value={newAccountForm.alias}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, alias: e.target.value })}
                    placeholder="ej. viajes.turismo.mp"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-indigo-700 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">CBU / CVU</label>
                  <input
                    type="text"
                    value={newAccountForm.cbu}
                    onChange={(e) => setNewAccountForm({ ...newAccountForm, cbu: e.target.value })}
                    placeholder="22 dígitos"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddAccountModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition-colors"
                >
                  Crear Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-xs">
            <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Editar Cuenta: {editingAccount.name}</h2>
              <button onClick={() => setEditingAccount(null)} className="p-1 rounded bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedAccount} className="p-6 space-y-3">
              <div>
                <label className="block text-gray-600 mb-1 font-medium">Nombre de la Cuenta *</label>
                <input
                  type="text"
                  required
                  value={editingAccount.name}
                  onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Tipo</label>
                  <select
                    value={editingAccount.type}
                    onChange={(e) => setEditingAccount({ ...editingAccount, type: e.target.value as any })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="banco">Banco Tradicional</option>
                    <option value="mercado_pago">Mercado Pago / Billetera</option>
                    <option value="efectivo">Efectivo / Caja</option>
                    <option value="inversion">Plazo Fijo / Inversión</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Moneda</label>
                  <select
                    value={editingAccount.currency}
                    onChange={(e) => setEditingAccount({ ...editingAccount, currency: e.target.value as any })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ARS">ARS ($)</option>
                    <option value="USD">USD (U$S)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-1 font-medium">Titular</label>
                <input
                  type="text"
                  value={editingAccount.holder}
                  onChange={(e) => setEditingAccount({ ...editingAccount, holder: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">Alias</label>
                  <input
                    type="text"
                    value={editingAccount.alias || ''}
                    onChange={(e) => setEditingAccount({ ...editingAccount, alias: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-indigo-700 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1 font-medium">CBU / CVU</label>
                  <input
                    type="text"
                    value={editingAccount.cbu || ''}
                    onChange={(e) => setEditingAccount({ ...editingAccount, cbu: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
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

      {/* Data Management & Clean Slate Modal */}
      <DataManagementModal isOpen={isDataModalOpen} onClose={() => setIsDataModalOpen(false)} />

    </div>
  );
};

