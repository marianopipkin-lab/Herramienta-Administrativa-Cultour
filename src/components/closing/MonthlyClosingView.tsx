import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  Scale,
  ArrowRight,
  Lock,
  RotateCcw,
  Layers,
  FileCheck,
  DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MonthlyClosing, AccountId } from '../../types';
import { formatCurrency } from '../../utils/financialCalculations';

export const MonthlyClosingView: React.FC = () => {
  const { monthlyClosings, performMonthlyClosing, reopenMonthlyClosing, accounts, movements, kpis, cutoffConfig, exchangeRate } = useApp();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('2026-08');
  const [selectedMonthLabel, setSelectedMonthLabel] = useState<string>('Agosto 2026');

  // Real account balances entered at closing time
  const [accountRealBalances, setAccountRealBalances] = useState<Record<string, number>>({});

  useEffect(() => {
    const initial: Record<string, number> = {};
    accounts.forEach(a => {
      initial[a.id] = a.currentBalance || 0;
    });
    setAccountRealBalances(initial);
  }, [accounts]);

  const [notes, setNotes] = useState('');

  // Month calculation
  const monthMovements = movements.filter(m => m.date.startsWith(selectedMonthKey));
  const monthIncomesARS = monthMovements.filter(m => m.type === 'ingreso' && m.currency !== 'USD').reduce((sum, m) => sum + m.amount, 0);
  const monthExpensesARS = monthMovements.filter(m => m.type === 'egreso' && m.currency !== 'USD').reduce((sum, m) => sum + m.amount, 0);
  const unreconciledMovements = monthMovements.filter(m => m.matchStatus !== 'verde');

  // Initial cash calculation (sum of initial balances for ARS accounts)
  const initialCashARS = accounts
    .filter(a => a.currency === 'ARS')
    .reduce((sum, a) => sum + (a.initialBalance ?? a.currentBalance ?? 0), 0);

  const calculatedFinalBalanceARS = initialCashARS + monthIncomesARS - monthExpensesARS;

  const realFinalBalanceARS = accounts
    .filter(a => a.currency === 'ARS')
    .reduce((sum, a) => sum + (Number(accountRealBalances[a.id]) || 0), 0);

  const differenceARS = realFinalBalanceARS - calculatedFinalBalanceARS;

  const handleExecuteClose = () => {
    performMonthlyClosing(selectedMonthKey, notes || 'Cierre mensual auditado.', realFinalBalanceARS);
    alert(`¡Mes de ${selectedMonthLabel} cerrado con éxito! Los saldos han sido fijados.`);
    setCurrentStep(1);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
            <CalendarCheck className="w-5 h-5 text-indigo-600" />
            <span>Auditoría & Cierres Mensuales</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Proceso de conciliación integral: Control de saldo calculado vs saldo real de cuentas (ARS y USD).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Mes a Auditar:</span>
          <select
            value={selectedMonthKey}
            onChange={(e) => {
              setSelectedMonthKey(e.target.value);
              setSelectedMonthLabel(e.target.value === '2026-08' ? 'Agosto 2026' : e.target.value === '2026-09' ? 'Septiembre 2026' : 'Julio 2026');
            }}
            className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-800 focus:outline-none focus:border-indigo-500"
          >
            <option value="2026-08">Agosto 2026</option>
            <option value="2026-09">Septiembre 2026</option>
            <option value="2026-07">Julio 2026</option>
          </select>
        </div>
      </div>

      {/* Guided 5-Step Wizard Card */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-xs space-y-6">
        
        {/* Step indicator */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 overflow-x-auto gap-2 text-xs">
          {[
            { step: 1, title: '1. Extractos' },
            { step: 2, title: '2. Conciliación' },
            { step: 3, title: '3. Gastos Fijos' },
            { step: 4, title: '4. Control de Ecuación' },
            { step: 5, title: '5. Cierre Definitivo' }
          ].map((item) => (
            <button
              key={item.step}
              onClick={() => setCurrentStep(item.step)}
              className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                currentStep === item.step
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : currentStep > item.step
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              }`}
            >
              {currentStep > item.step && <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{item.title}</span>
            </button>
          ))}
        </div>

        {/* STEP 1: Extractos */}
        {currentStep === 1 && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-gray-900">Paso 1: Verificación de Extractos Bancarios</h3>
            <p className="text-gray-500">
              Comprueba que los extractos bancarios de Mercado Pago, Santander y Galicia correspondientes a <strong>{selectedMonthLabel}</strong> hayan sido importados.
            </p>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Movimientos Registrados en el Período:</span>
                <span className="font-mono font-bold text-gray-900">{monthMovements.length} movimientos</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Ingresos ARS Registrados:</span>
                <span className="font-mono font-bold text-emerald-700">+{formatCurrency(monthIncomesARS, 'ARS')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Egresos ARS Registrados:</span>
                <span className="font-mono font-bold text-rose-700">-{formatCurrency(monthExpensesARS, 'ARS')}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <span>Avanzar a Conciliación</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Conciliación */}
        {currentStep === 2 && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-gray-900">Paso 2: Revisión de Partidas Sin Clasificar</h3>
            <p className="text-gray-500">
              Para asegurar la exactitud del cierre, ningún movimiento debe quedar en estado "rojo" o "amarillo".
            </p>

            <div className={`p-4 rounded-xl border ${
              unreconciledMovements.length === 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                {unreconciledMovements.length === 0 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>¡Todos los movimientos del mes están correctamente clasificados!</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Quedan {unreconciledMovements.length} movimientos pendientes de clasificar en el módulo de Conciliación.</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Volver
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <span>Revisar Gastos Fijos</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Gastos Fijos */}
        {currentStep === 3 && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-gray-900">Paso 3: Verificación de Gastos Fijos del Mes</h3>
            <p className="text-gray-500">
              Confirmar que los costos de estructura operativa (sueldos, alquiler, suscripciones, etc.) hayan sido imputados o pagados.
            </p>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Estructura Mensual Presupuestada:</span>
                <span className="font-mono font-bold text-rose-700">{formatCurrency(kpis.monthlyFixedExpenses, 'ARS')}</span>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Volver
              </button>
              <button
                onClick={() => setCurrentStep(4)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <span>Ir al Control de Ecuación</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Control de Ecuación */}
        {currentStep === 4 && (
          <div className="space-y-5 text-xs">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Paso 4: Comprobación de la Ecuación Financiera (ARS)</h3>
              <p className="text-gray-500 mt-1">
                Comprobación: Saldo Inicial + Ingresos - Egresos = Saldo Final Calculado vs Saldo Real en Cuentas.
              </p>
            </div>

            {/* Equation Breakdown Box */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 font-mono">
              <div className="flex justify-between items-center text-gray-700">
                <span>(+) Saldo Inicial ARS del período:</span>
                <span className="font-bold text-gray-900">{formatCurrency(initialCashARS, 'ARS')}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-700">
                <span>(+) Ingresos reales ARS:</span>
                <span className="font-bold">+{formatCurrency(monthIncomesARS, 'ARS')}</span>
              </div>
              <div className="flex justify-between items-center text-rose-700">
                <span>(-) Egresos reales ARS:</span>
                <span className="font-bold">-{formatCurrency(monthExpensesARS, 'ARS')}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between items-center text-indigo-700 font-bold text-sm">
                <span>(=) Saldo Final Teórico Calculado ARS:</span>
                <span>{formatCurrency(calculatedFinalBalanceARS, 'ARS')}</span>
              </div>
              <div className="flex justify-between items-center text-gray-900 font-bold text-sm">
                <span>(vs) Saldo Real en Cuentas ARS (Extractos):</span>
                <span>{formatCurrency(realFinalBalanceARS, 'ARS')}</span>
              </div>
              <div className={`border-t border-gray-200 pt-2 flex justify-between items-center font-extrabold text-sm ${
                Math.abs(differenceARS) < 1000 ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                <span>(=) Diferencia de Conciliación ARS:</span>
                <span>{formatCurrency(differenceARS, 'ARS')}</span>
              </div>
            </div>

            {/* Real Accounts Inputs */}
            <div className="space-y-2">
              <span className="font-bold text-gray-700 uppercase tracking-wider text-[11px] block">
                Saldos Reales por Cuenta al 31 de {selectedMonthLabel}:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {accounts.map(acc => (
                  <div key={acc.id} className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-gray-700 font-medium">{acc.name}</label>
                      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-gray-200 text-gray-600 font-bold">{acc.currency}</span>
                    </div>
                    <input
                      type="number"
                      value={accountRealBalances[acc.id] !== undefined ? accountRealBalances[acc.id] : acc.currentBalance}
                      onChange={(e) => setAccountRealBalances({
                        ...accountRealBalances,
                        [acc.id]: parseFloat(e.target.value) || 0
                      })}
                      className="w-full bg-white border border-gray-200 rounded p-1.5 text-gray-900 font-mono focus:border-indigo-500 text-xs font-semibold"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setCurrentStep(3)}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Volver
              </button>
              <button
                onClick={() => setCurrentStep(5)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <span>Avanzar al Cierre</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Cierre Definitivo */}
        {currentStep === 5 && (
          <div className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-gray-900">Paso 5: Emisión y Sellado del Cierre Mensual</h3>
            <p className="text-gray-500 leading-relaxed">
              Al confirmar el cierre, los saldos quedarán registrados en el histórico y constituirán el saldo inicial inmutable para el mes siguiente.
            </p>

            <div>
              <label className="block text-gray-600 mb-1">Notas de Auditoría / Justificación de Diferencias</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="ej. Conciliación conforme. Diferencia $0 verificada contra extractos Santander y MP."
                className="w-full bg-white border border-gray-200 rounded-xl p-3 text-gray-900 focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setCurrentStep(4)}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Volver
              </button>
              <button
                onClick={handleExecuteClose}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-2 shadow-xs transition-colors"
              >
                <Lock className="w-4 h-4" />
                <span>Confirmar & Cerrar Mes ({selectedMonthLabel})</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Historical Closings Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-white border-b border-gray-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Historial de Cierres Mensuales Emitidos
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 text-[10px]">
              <tr>
                <th className="py-3 px-3.5">Período</th>
                <th className="py-3 px-3">Fecha de Cierre</th>
                <th className="py-3 px-3 text-right">Saldo Inicial</th>
                <th className="py-3 px-3 text-right text-emerald-700">Ingresos</th>
                <th className="py-3 px-3 text-right text-rose-700">Egresos</th>
                <th className="py-3 px-3 text-right font-bold text-indigo-700">Saldo Real Cuentas</th>
                <th className="py-3 px-3 text-right">Diferencia</th>
                <th className="py-3 px-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {monthlyClosings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400 font-sans">
                    No hay cierres mensuales emitidos previamente.
                  </td>
                </tr>
              ) : (
                monthlyClosings.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/60">
                    <td className="py-3 px-3.5 font-sans font-bold text-gray-900">{c.yearMonth}</td>
                    <td className="py-3 px-3 text-gray-500 text-[11px]">{c.closedAt ? c.closedAt.split('T')[0] : '-'}</td>
                    <td className="py-3 px-3 text-right text-gray-600">{formatCurrency(c.initialCash, 'ARS')}</td>
                    <td className="py-3 px-3 text-right text-emerald-700">+{formatCurrency(c.totalIncome, 'ARS')}</td>
                    <td className="py-3 px-3 text-right text-rose-700">-{formatCurrency(c.totalExpense, 'ARS')}</td>
                    <td className="py-3 px-3 text-right font-bold text-indigo-700">{formatCurrency(c.actualAccountCash, 'ARS')}</td>
                    <td className="py-3 px-3 text-right text-gray-800 font-semibold">{formatCurrency(c.reconciliationDifference, 'ARS')}</td>
                    <td className="py-3 px-3 text-center font-sans">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        c.status === 'cerrado'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {c.status === 'cerrado' ? 'Cerrado' : 'En Revisión'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
