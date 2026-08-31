import React, { useState } from 'react';
import {
  TrendingUp,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Scale,
  CheckCircle2,
  HelpCircle,
  Clock,
  Filter,
  DollarSign
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatPercent } from '../../utils/financialCalculations';

export const FinancialProjectionView: React.FC = () => {
  const { monthlyProjection, financialPosition, operations, fixedExpenses, exchangeRate } = useApp();

  const [selectedCurrency, setSelectedCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [selectedMonth, setSelectedMonth] = useState<string>(monthlyProjection[0]?.monthKey || '');

  const activeMonthData = monthlyProjection.find(m => m.monthKey === selectedMonth) || monthlyProjection[0];

  // Filter operations associated with the selected month and currency
  const monthOps = operations.filter(op => {
    const isUSD = op.currency === 'USD' || op.businessUnit === 'receptivo';
    const matchCur = selectedCurrency === 'USD' ? isUSD : !isUSD;
    return op.date.startsWith(selectedMonth) && matchCur;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span>Proyección Financiera & Flujo de Caja Futuro</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Simulación mensual: Cobros reales de operaciones, cancelación a proveedores y gastos fijos de estructura por moneda separada.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Currency Switcher */}
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setSelectedCurrency('ARS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                selectedCurrency === 'ARS'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Pesos (ARS)
            </button>
            <button
              onClick={() => setSelectedCurrency('USD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                selectedCurrency === 'USD'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Dólares (USD)
            </button>
          </div>

          <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 text-right self-start sm:self-auto font-mono">
            <span className="text-[10px] uppercase font-bold text-gray-400 block font-sans">Caja Libre Real Disponible</span>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-sm font-bold text-emerald-700">{formatCurrency(financialPosition.availableCashARS, 'ARS')}</span>
              <span className="text-xs text-gray-400">+</span>
              <span className="text-sm font-bold text-indigo-600">{formatCurrency(financialPosition.availableCashUSD, 'USD')}</span>
            </div>
            <span className="text-[10px] text-gray-400 block mt-0.5">
              ≈ {formatCurrency(financialPosition.availableCashEquivalentUSD, 'USD')} eq.
            </span>
          </div>
        </div>
      </div>

      {/* Main Area Chart: Projected Evolution */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Evolución de Tenencia y Flujos Netos en {selectedCurrency}
            </h3>
            <p className="text-xs text-gray-500">
              Trayectoria de saldo disponible proyectado al cierre de cada período en {selectedCurrency}
            </p>
          </div>
          <div className="text-[11px] font-mono text-gray-500 bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">
            Tipo de cambio ref: ${exchangeRate.usdToArsRate.toLocaleString('es-AR')} / USD
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyProjection} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={selectedCurrency === 'ARS' ? '#4f46e5' : '#059669'} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={selectedCurrency === 'ARS' ? '#4f46e5' : '#059669'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="monthLabel" stroke="#94a3b8" fontSize={11} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={(val) => selectedCurrency === 'ARS' ? `$${(val / 1000000).toFixed(1)}M` : `US$${val.toLocaleString('es-AR')}`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                formatter={(value: any) => formatCurrency(Number(value), selectedCurrency)}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Area
                type="monotone"
                dataKey={selectedCurrency === 'ARS' ? 'finalProjectedCashARS' : 'finalProjectedCashUSD'}
                name={`Caja Final Proyectada (${selectedCurrency})`}
                stroke={selectedCurrency === 'ARS' ? '#4f46e5' : '#059669'}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCash)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Monthly Projection Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-gray-100 bg-white flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Cronograma Financiero Consolidado ({selectedCurrency})
            </h3>
            <span className="text-[11px] text-gray-400 font-mono">Calculado a partir de compromisos y operaciones reales en {selectedCurrency}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 text-[10px]">
              <tr>
                <th className="py-3 px-3.5">Mes</th>
                <th className="py-3 px-3 text-right">Caja Inicial</th>
                <th className="py-3 px-3 text-right text-emerald-700">Cobros Esperados</th>
                <th className="py-3 px-3 text-right text-amber-700">Pagos Proveedores</th>
                <th className="py-3 px-3 text-right text-rose-700">Gastos Fijos</th>
                <th className="py-3 px-3 text-right text-indigo-700 font-bold">Caja Final</th>
                <th className="py-3 px-3 text-right text-emerald-700">Flujo Neto</th>
                <th className="py-3 px-3 text-center">Tipo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {monthlyProjection.map((row) => {
                const init = selectedCurrency === 'ARS' ? row.initialCashARS : row.initialCashUSD;
                const inc = selectedCurrency === 'ARS' ? row.projectedIncomeARS : row.projectedIncomeUSD;
                const supp = selectedCurrency === 'ARS' ? row.projectedSupplierPaymentsARS : row.projectedSupplierPaymentsUSD;
                const fixed = selectedCurrency === 'ARS' ? row.projectedFixedExpensesARS : row.projectedFixedExpensesUSD;
                const final = selectedCurrency === 'ARS' ? row.finalProjectedCashARS : row.finalProjectedCashUSD;
                const net = inc - supp - fixed;
                const isSelected = row.monthKey === selectedMonth;

                return (
                  <tr
                    key={row.monthKey}
                    onClick={() => setSelectedMonth(row.monthKey)}
                    className={`cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/50 font-medium' : 'hover:bg-gray-50/60'}`}
                  >
                    <td className="py-3 px-3.5 font-sans font-bold text-gray-900 flex items-center gap-1.5">
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>}
                      <span>{row.monthLabel}</span>
                    </td>
                    <td className="py-3 px-3 text-right text-gray-600">
                      {formatCurrency(init, selectedCurrency)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-700 font-semibold">
                      +{formatCurrency(inc, selectedCurrency)}
                    </td>
                    <td className="py-3 px-3 text-right text-amber-700">
                      -{formatCurrency(supp, selectedCurrency)}
                    </td>
                    <td className="py-3 px-3 text-right text-rose-700">
                      -{formatCurrency(fixed, selectedCurrency)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-indigo-700">
                      {formatCurrency(final, selectedCurrency)}
                    </td>
                    <td className={`py-3 px-3 text-right font-semibold ${net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {net >= 0 ? '+' : ''}{formatCurrency(net, selectedCurrency)}
                    </td>
                    <td className="py-3 px-3 text-center font-sans">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        row.isProjected
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {row.isProjected ? 'Proyectado' : 'Real / Cerrado'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Month detail inspection card */}
      {activeMonthData && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Detalle de Operaciones en {activeMonthData.monthLabel} ({selectedCurrency})</span>
            </h3>
            <span className="text-xs font-mono text-gray-500">
              {monthOps.length} operación(es) programada(s)
            </span>
          </div>

          {monthOps.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-2">
              No hay operaciones en {selectedCurrency} con fecha de salida en este mes calendario. Los gastos corresponden a la estructura fija recurrente.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {monthOps.map(op => (
                <div key={op.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1.5">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-gray-900">{op.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-gray-600 border border-gray-200">
                      {op.code}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {op.clientOrSchool} • {op.passengerCount} pasajeros
                  </div>
                  <div className="flex justify-between text-zinc-600 font-mono text-[11px] pt-1 border-t border-gray-200">
                    <span>Esperado: {formatCurrency(op.expectedRevenue, op.currency || selectedCurrency)}</span>
                    <span className="text-emerald-700 font-bold">Cobrado: {formatCurrency(op.receivedRevenue, op.currency || selectedCurrency)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
