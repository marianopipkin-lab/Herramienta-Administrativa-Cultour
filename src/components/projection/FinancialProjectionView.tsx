import React, { useState } from 'react';
import {
  TrendingUp,
  Calendar,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Scale,
  CheckCircle2,
  HelpCircle
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
  const { monthlyProjection, kpis, operations, fixedExpenses } = useApp();

  const [selectedMonth, setSelectedMonth] = useState<string>(monthlyProjection[0]?.monthKey || '');

  const activeMonthData = monthlyProjection.find(m => m.monthKey === selectedMonth) || monthlyProjection[0];

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
            Simulación mensual: Cobros proyectados de operaciones, cancelación a proveedores y gastos fijos de estructura.
          </p>
        </div>

        <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 text-right self-start sm:self-auto">
          <span className="text-[10px] uppercase font-bold text-gray-400 block">Caja Libre Proyectada</span>
          <span className="text-base font-bold text-emerald-700 font-mono">{formatCurrency(kpis.projectedFreeCash)}</span>
        </div>
      </div>

      {/* Main Area Chart: Projected Evolution */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Evolución de Tenencia y Flujos Netos</h3>
            <p className="text-xs text-gray-500">Trayectoria de saldo disponible al cierre de cada mes</p>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyProjection} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="monthLabel" stroke="#94a3b8" fontSize={11} />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.75rem', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                formatter={(value: any) => formatCurrency(Number(value))}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Area type="monotone" dataKey="finalProjectedCash" name="Caja Final Proyectada" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorCash)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Monthly Projection Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-gray-100 bg-white flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Cronograma Financiero Consolidado
          </h3>
          <span className="text-[11px] text-gray-400 font-mono">Calculado a partir de compromisos reales</span>
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
                const net = row.projectedIncome - row.projectedSupplierPayments - row.projectedFixedExpenses;

                return (
                  <tr key={row.monthKey} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-3.5 font-sans font-bold text-gray-900">
                      {row.monthLabel}
                    </td>
                    <td className="py-3 px-3 text-right text-gray-600">
                      {formatCurrency(row.initialCash)}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-700 font-semibold">
                      +{formatCurrency(row.projectedIncome)}
                    </td>
                    <td className="py-3 px-3 text-right text-amber-700">
                      -{formatCurrency(row.projectedSupplierPayments)}
                    </td>
                    <td className="py-3 px-3 text-right text-rose-700">
                      -{formatCurrency(row.projectedFixedExpenses)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-indigo-700">
                      {formatCurrency(row.finalProjectedCash)}
                    </td>
                    <td className={`py-3 px-3 text-right font-semibold ${net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {net >= 0 ? '+' : ''}{formatCurrency(net)}
                    </td>
                    <td className="py-3 px-3 text-center font-sans">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        row.isProjected
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {row.isProjected ? 'Proyectado' : 'Real'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
