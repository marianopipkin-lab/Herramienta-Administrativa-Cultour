import React, { useState, useMemo } from 'react';
import {
  History,
  Layers,
  TrendingUp,
  Calendar,
  DollarSign,
  Download,
  Filter,
  CheckCircle2,
  PieChart as PieIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatPercent } from '../../utils/financialCalculations';
import { INITIAL_HISTORICAL_PERIODS } from '../../data/initialData';
import { BusinessUnit } from '../../types';

export const HistoricalView: React.FC = () => {
  const [selectedUnit, setSelectedUnit] = useState<string>('all');

  // Group historical periods by month
  const monthlyAggregates = useMemo(() => {
    const monthsMap = new Map<string, {
      monthKey: string;
      monthLabel: string;
      receptivoRevenue: number;
      receptivoCost: number;
      salidasRevenue: number;
      salidasCost: number;
      viajesRevenue: number;
      viajesCost: number;
      totalRevenue: number;
      totalCost: number;
      totalProfit: number;
      opsCount: number;
    }>();

    INITIAL_HISTORICAL_PERIODS.forEach(p => {
      const existing = monthsMap.get(p.yearMonth) || {
        monthKey: p.yearMonth,
        monthLabel: p.yearMonth === '2026-03' ? 'Marzo 2026' : p.yearMonth === '2026-04' ? 'Abril 2026' : p.yearMonth === '2026-05' ? 'Mayo 2026' : p.yearMonth === '2026-06' ? 'Junio 2026' : 'Julio 2026',
        receptivoRevenue: 0,
        receptivoCost: 0,
        salidasRevenue: 0,
        salidasCost: 0,
        viajesRevenue: 0,
        viajesCost: 0,
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        opsCount: 0
      };

      if (p.businessUnit === 'receptivo') {
        existing.receptivoRevenue += p.revenue;
        existing.receptivoCost += p.expenses;
      } else if (p.businessUnit === 'salidas') {
        existing.salidasRevenue += p.revenue;
        existing.salidasCost += p.expenses;
      } else if (p.businessUnit === 'viajes') {
        existing.viajesRevenue += p.revenue;
        existing.viajesCost += p.expenses;
      }

      existing.totalRevenue += p.revenue;
      existing.totalCost += p.expenses;
      existing.totalProfit += p.result;
      existing.opsCount += p.operationsCount || 0;

      monthsMap.set(p.yearMonth, existing);
    });

    return Array.from(monthsMap.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, []);

  const chartData = useMemo(() => {
    return monthlyAggregates.map(m => ({
      month: m.monthLabel.split(' ')[0],
      receptivo: m.receptivoRevenue,
      salidas: m.salidasRevenue,
      viajes: m.viajesRevenue,
      totalProfit: m.totalProfit
    }));
  }, [monthlyAggregates]);

  // Overall totals
  const totals = useMemo(() => {
    let rev = 0;
    let cost = 0;
    let profit = 0;
    let ops = 0;

    monthlyAggregates.forEach(m => {
      rev += m.totalRevenue;
      cost += m.totalCost;
      profit += m.totalProfit;
      ops += m.opsCount;
    });

    const margin = rev > 0 ? (profit / rev) * 100 : 0;

    return { rev, cost, profit, margin, ops };
  }, [monthlyAggregates]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
            <History className="w-5 h-5 text-indigo-600" />
            <span>Histórico Consolidado por Unidad de Negocio</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Resultados consolidados de operaciones cerradas (Marzo a Julio 2026 previo a fecha de corte).
          </p>
        </div>

        <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 text-right self-start sm:self-auto">
          <span className="text-[10px] uppercase font-bold text-emerald-700 block">Ganancia Acumulada Histórica</span>
          <span className="text-base font-bold text-emerald-700 font-mono">{formatCurrency(totals.profit)}</span>
        </div>
      </div>

      {/* Aggregate Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-gray-400 block">Ventas Totales Mar-Jul</span>
          <span className="text-lg font-bold text-emerald-700 font-mono">{formatCurrency(totals.rev)}</span>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-gray-400 block">Costos Totales Mar-Jul</span>
          <span className="text-lg font-bold text-rose-700 font-mono">{formatCurrency(totals.cost)}</span>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-indigo-600 block">Ganancia Neta</span>
          <span className="text-lg font-bold text-indigo-700 font-mono">{formatCurrency(totals.profit)}</span>
        </div>
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-emerald-700 block">Margen Promedio</span>
          <span className="text-lg font-bold text-gray-900 font-mono">{formatPercent(totals.margin)}</span>
        </div>
      </div>

      {/* Historical Evolution Chart */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Facturación por Unidad de Negocio (Marzo - Julio 2026)</h3>
            <p className="text-xs text-gray-500">Distribución de ingresos mensuales por rama comercial</p>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
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
              <Bar dataKey="receptivo" name="Turismo Receptivo" fill="#0284c7" stackId="a" />
              <Bar dataKey="salidas" name="Salidas Educativas" fill="#059669" stackId="a" />
              <Bar dataKey="viajes" name="Viajes Educativos" fill="#4f46e5" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Historical Breakdown Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-white border-b border-gray-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Detalle Mes a Mes Marzo - Julio 2026
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 text-[10px]">
              <tr>
                <th className="py-3 px-3.5">Mes</th>
                <th className="py-3 px-3 text-right text-sky-700">Receptivo ($)</th>
                <th className="py-3 px-3 text-right text-emerald-700">Salidas ($)</th>
                <th className="py-3 px-3 text-right text-indigo-700">Viajes ($)</th>
                <th className="py-3 px-3 text-right">Venta Total</th>
                <th className="py-3 px-3 text-right text-rose-700">Costo Total</th>
                <th className="py-3 px-3 text-right text-indigo-700 font-bold">Ganancia</th>
                <th className="py-3 px-3 text-right">Margen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {monthlyAggregates.map((row) => {
                const margin = row.totalRevenue > 0 ? (row.totalProfit / row.totalRevenue) * 100 : 0;

                return (
                  <tr key={row.monthKey} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-3.5 font-sans font-bold text-gray-900">{row.monthLabel}</td>
                    <td className="py-3 px-3 text-right text-gray-700">{formatCurrency(row.receptivoRevenue)}</td>
                    <td className="py-3 px-3 text-right text-gray-700">{formatCurrency(row.salidasRevenue)}</td>
                    <td className="py-3 px-3 text-right text-gray-700">{formatCurrency(row.viajesRevenue)}</td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-700">{formatCurrency(row.totalRevenue)}</td>
                    <td className="py-3 px-3 text-right text-rose-700">{formatCurrency(row.totalCost)}</td>
                    <td className="py-3 px-3 text-right font-bold text-indigo-700">{formatCurrency(row.totalProfit)}</td>
                    <td className="py-3 px-3 text-right text-gray-500">{formatPercent(margin)}</td>
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
