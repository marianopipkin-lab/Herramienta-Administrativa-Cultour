import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Calendar,
  Layers,
  Scale,
  CreditCard,
  Building2,
  Users,
  Compass,
  ArrowRight,
  Info,
  Clock,
  RefreshCw,
  Sliders,
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
  Legend
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatPercent } from '../../utils/financialCalculations';

export const GeneralDashboard: React.FC = () => {
  const {
    kpis,
    financialPosition,
    monthlyProjection,
    operations,
    fixedExpenses,
    accounts,
    setActiveTab,
    setSelectedOperationId,
    cutoffConfig,
    exchangeRate,
    setExchangeRate
  } = useApp();

  const [viewMode, setViewMode] = useState<'fotografia' | 'evolucion'>('fotografia');
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [tempRate, setTempRate] = useState(exchangeRate.usdToArsRate.toString());

  const handleSaveRate = () => {
    const num = Number(tempRate);
    if (!isNaN(num) && num > 0) {
      setExchangeRate({
        ...exchangeRate,
        usdToArsRate: num,
        rateDate: new Date().toISOString().split('T')[0]
      });
      setIsEditingRate(false);
    }
  };

  const channels = financialPosition.byUnitAndChannel;

  return (
    <div className="space-y-12 pb-16">
      
      {/* View Header matching Design Variation */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-[#E5E5E1]">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1A1A1A] leading-[1.15]">
            Posición Financiera<br />
            <span className="italic font-normal">Auditoría de Socios</span>
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#666666]">
            <span className="text-[#4F46E5] font-medium font-mono">[ Fotografía de Capital ]</span>
            <span className="text-[#D0D0CC]">•</span>
            <span>Consolidado — Cultour Receptivo & Educativo</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Rate Editor Widget */}
          <div className="font-mono text-xs bg-[#FFFFFF] px-3.5 py-2 rounded-lg border border-[#E5E5E1] flex items-center gap-3 shadow-sm">
            {isEditingRate ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[#666666]">$</span>
                <input
                  type="number"
                  value={tempRate}
                  onChange={(e) => setTempRate(e.target.value)}
                  className="w-20 bg-[#F9F9F7] text-[#1A1A1A] px-2 py-0.5 rounded border border-[#4F46E5] text-xs font-mono"
                  autoFocus
                />
                <button
                  onClick={handleSaveRate}
                  className="px-2 py-0.5 rounded bg-[#1A1A1A] text-white font-medium text-[10px] uppercase"
                >
                  OK
                </button>
              </div>
            ) : (
              <>
                <div>
                  <span className="text-[10px] text-[#666666] uppercase block font-mono">Ref USD/ARS:</span>
                  <span className="text-[#1A1A1A] font-semibold">${exchangeRate.usdToArsRate.toLocaleString('es-AR')}</span>
                </div>
                <button
                  onClick={() => { setIsEditingRate(true); setTempRate(exchangeRate.usdToArsRate.toString()); }}
                  className="text-[#666666] hover:text-[#1A1A1A] p-1 rounded hover:bg-[#F9F9F7]"
                  title="Modificar tipo de cambio"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center p-1 bg-[#FFFFFF] rounded-lg border border-[#E5E5E1] shadow-sm">
            <button
              onClick={() => setViewMode('fotografia')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                viewMode === 'fotografia'
                  ? 'bg-[#1A1A1A] text-white'
                  : 'text-[#666666] hover:text-[#1A1A1A]'
              }`}
            >
              Fotografía
            </button>
            <button
              onClick={() => setViewMode('evolucion')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                viewMode === 'evolucion'
                  ? 'bg-[#1A1A1A] text-white'
                  : 'text-[#666666] hover:text-[#1A1A1A]'
              }`}
            >
              Evolución
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          METRICS GRID (Bloque 1 — Posición Actual)
      ======================================================== */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* 01. Dinero en Cuentas */}
          <div className="flex flex-col">
            <span className="label-mono">01. Dinero en Cuentas</span>
            <div className="font-sans text-3xl font-normal tracking-tight text-[#1A1A1A] mt-2">
              {formatCurrency(financialPosition.cashARS, 'ARS')}
            </div>
            <div className="text-xs text-[#666666] mt-1.5 flex items-center justify-between">
              <span>+ {formatCurrency(financialPosition.cashUSD, 'USD')} (Caja Actual)</span>
              <span className="text-[10px] text-[#888888]">eq. {formatCurrency(financialPosition.cashEquivalentUSD, 'USD')}</span>
            </div>
          </div>

          {/* 02. Fondos Viajes Futuros */}
          <div className="flex flex-col">
            <span className="label-mono">02. Fondos Viajes Futuros</span>
            <div className="font-sans text-3xl font-normal tracking-tight text-[#4F46E5] mt-2">
              {formatCurrency(financialPosition.futureOpsCollectedARS, 'ARS')}
            </div>
            <div className="text-xs text-[#666666] mt-1.5 flex items-center justify-between">
              <span>+ {formatCurrency(financialPosition.futureOpsCollectedUSD, 'USD')}</span>
              <span className="text-[10px] text-[#4F46E5] font-medium">Capital en Custodia</span>
            </div>
          </div>

          {/* 03. Obligaciones */}
          <div className="flex flex-col">
            <span className="label-mono">03. Obligaciones</span>
            <div className="font-sans text-3xl font-normal tracking-tight text-[#F59E0B] mt-2">
              -{formatCurrency(financialPosition.committedFundsARS, 'ARS')}
            </div>
            <div className="text-xs text-[#666666] mt-1.5 flex items-center justify-between">
              <span>-{formatCurrency(financialPosition.committedFundsUSD, 'USD')}</span>
              <span className="text-[10px] text-[#F59E0B]">Proveedores y Estructura</span>
            </div>
          </div>

          {/* 04. Caja Libre Real */}
          <div className="flex flex-col">
            <span className="label-mono">04. Caja Libre Real</span>
            <div className="font-sans text-3xl font-semibold tracking-tight text-[#10B981] mt-2">
              {formatCurrency(financialPosition.availableCashEquivalentUSD, 'USD')}
            </div>
            <div className="text-xs text-[#666666] mt-1.5 flex items-center justify-between">
              <span>{formatCurrency(financialPosition.availableCashARS, 'ARS')} + {formatCurrency(financialPosition.availableCashUSD, 'USD')}</span>
              <span className="text-[10px] text-[#10B981] font-medium">Liquidez Neta Disponible</span>
            </div>
          </div>

        </div>

        {/* Realized vs Projected auxiliary pill */}
        <div className="mt-8 pt-6 border-t border-[#E5E5E1] grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-lg p-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-xs font-semibold text-[#1A1A1A]">Operaciones Realizadas (Devengado)</div>
              <div className="text-[11px] text-[#666666]">Resultado económico de servicios ya prestados</div>
            </div>
            <div className="text-right font-mono">
              <div className="text-sm font-semibold text-[#10B981]">
                {formatCurrency(financialPosition.pastOpsRealizedProfitEquivalentUSD, 'USD')}
              </div>
              <div className="text-[10px] text-[#666666]">
                {formatCurrency(financialPosition.pastOpsRealizedProfitARS, 'ARS')}
              </div>
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-lg p-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-xs font-semibold text-[#1A1A1A]">Operaciones Futuras (Proyectado)</div>
              <div className="text-[11px] text-[#666666]">Margen presupuestado a devengar</div>
            </div>
            <div className="text-right font-mono">
              <div className="text-sm font-semibold text-[#4F46E5]">
                {formatCurrency(financialPosition.futureOpsProjectedProfitEquivalentUSD, 'USD')}
              </div>
              <div className="text-[10px] text-[#666666]">
                {formatCurrency(financialPosition.futureOpsProjectedProfitARS, 'ARS')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 2: RENTABILIDAD POR CANAL (Bloque 2)
      ======================================================== */}
      <section className="space-y-6">
        <div className="border-b border-[#1A1A1A] pb-3 flex justify-between items-end">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
            Rentabilidad por Canal
          </h2>
          <span className="label-mono">Bloque 2</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Receptivo Directo */}
          <div className="bg-[#FFFFFF] p-6 rounded-lg border border-[#E5E5E1] border-l-4 border-l-[#06B6D4] shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-[#666666] block mb-3">Receptivo — Directo</span>
              <span className="text-xl font-semibold text-[#1A1A1A] block mb-4 font-mono">
                {formatCurrency(channels.receptivoDirecto.expectedRevenue, 'USD')}
              </span>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between py-1 border-t border-[#F3F3F1] text-[#666666]">
                  <span>Margen:</span>
                  <strong className="text-[#10B981]">{formatPercent(channels.receptivoDirecto.margin)}</strong>
                </div>
                <div className="flex justify-between py-1 border-t border-[#F3F3F1] text-[#666666]">
                  <span>Ops:</span>
                  <strong className="text-[#1A1A1A]">{channels.receptivoDirecto.opsCount}</strong>
                </div>
                <div className="flex justify-between py-1 border-t border-[#F3F3F1] text-[#666666]">
                  <span>Costos:</span>
                  <span className="text-[#EF4444]">-{formatCurrency(channels.receptivoDirecto.expectedCost, 'USD')}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-[#F3F3F1] text-[11px] font-mono flex justify-between text-[#666666]">
              <span>Cobrado Real:</span>
              <strong className="text-[#10B981]">{formatCurrency(channels.receptivoDirecto.receivedRevenue, 'USD')}</strong>
            </div>
          </div>

          {/* Receptivo B2B */}
          <div className="bg-[#FFFFFF] p-6 rounded-lg border border-[#E5E5E1] border-l-4 border-l-[#4F46E5] shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-[#666666] block mb-3">Receptivo — B2B</span>
              <span className="text-xl font-semibold text-[#1A1A1A] block mb-4 font-mono">
                {formatCurrency(channels.receptivoAgencia.expectedRevenue, 'USD')}
              </span>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between py-1 border-t border-[#F3F3F1] text-[#666666]">
                  <span>Margen:</span>
                  <strong className="text-[#10B981]">{formatPercent(channels.receptivoAgencia.margin)}</strong>
                </div>
                <div className="flex justify-between py-1 border-t border-[#F3F3F1] text-[#666666]">
                  <span>Ops:</span>
                  <strong className="text-[#1A1A1A]">{channels.receptivoAgencia.opsCount}</strong>
                </div>
                <div className="flex justify-between py-1 border-t border-[#F3F3F1] text-[#666666]">
                  <span>Costos:</span>
                  <span className="text-[#EF4444]">-{formatCurrency(channels.receptivoAgencia.expectedCost, 'USD')}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-[#F3F3F1] text-[11px] font-mono flex justify-between text-[#666666]">
              <span>Cobrado Real:</span>
              <strong className="text-[#10B981]">{formatCurrency(channels.receptivoAgencia.receivedRevenue, 'USD')}</strong>
            </div>
          </div>

          {/* Salidas Educativas */}
          <div className="bg-[#FFFFFF] p-6 rounded-lg border border-[#E5E5E1] border-l-4 border-l-[#10B981] shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-[#666666] block mb-3">Salidas Educativas</span>
              <span className="text-xl font-semibold text-[#1A1A1A] block mb-4 font-mono">
                {formatCurrency(channels.salidasEducativas.expectedRevenue, 'ARS')}
              </span>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between py-1 border-t border-[#F3F3F1] text-[#666666]">
                  <span>Margen:</span>
                  <strong className="text-[#10B981]">{formatPercent(channels.salidasEducativas.margin)}</strong>
                </div>
                <div className="flex justify-between py-1 border-t border-[#F3F3F1] text-[#666666]">
                  <span>Ops:</span>
                  <strong className="text-[#1A1A1A]">{channels.salidasEducativas.opsCount}</strong>
                </div>
                <div className="flex justify-between py-1 border-t border-[#F3F3F1] text-[#666666]">
                  <span>Costos:</span>
                  <span className="text-[#EF4444]">-{formatCurrency(channels.salidasEducativas.expectedCost, 'ARS')}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-[#F3F3F1] text-[11px] font-mono flex justify-between text-[#666666]">
              <span>Cobrado Real:</span>
              <strong className="text-[#10B981]">{formatCurrency(channels.salidasEducativas.receivedRevenue, 'ARS')}</strong>
            </div>
          </div>

          {/* Viajes Educativos */}
          <div className="bg-[#FFFFFF] p-6 rounded-lg border border-[#E5E5E1] border-l-4 border-l-[#1A1A1A] shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-[#666666] block mb-3">Viajes Educativos</span>
              <span className="text-xl font-semibold text-[#1A1A1A] block mb-4 font-mono">
                {formatCurrency(channels.viajesEducativos.expectedRevenue, 'ARS')}
              </span>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between py-1 border-t border-[#F3F3F1] text-[#666666]">
                  <span>Margen:</span>
                  <strong className="text-[#10B981]">{formatPercent(channels.viajesEducativos.margin)}</strong>
                </div>
                <div className="flex justify-between py-1 border-t border-[#F3F3F1] text-[#666666]">
                  <span>Ops:</span>
                  <strong className="text-[#1A1A1A]">{channels.viajesEducativos.opsCount}</strong>
                </div>
                <div className="flex justify-between py-1 border-t border-[#F3F3F1] text-[#666666]">
                  <span>Costos:</span>
                  <span className="text-[#EF4444]">-{formatCurrency(channels.viajesEducativos.expectedCost, 'ARS')}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-[#F3F3F1] text-[11px] font-mono flex justify-between text-[#666666]">
              <span>Cobrado Real:</span>
              <strong className="text-[#10B981]">{formatCurrency(channels.viajesEducativos.receivedRevenue, 'ARS')}</strong>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================
          SECTION 3: EVOLUCIÓN DE FLUJO (Bloque 3)
      ======================================================== */}
      <section className="space-y-6">
        <div className="border-b border-[#1A1A1A] pb-3 flex justify-between items-end">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">
            Evolución de Flujo
          </h2>
          <span className="label-mono">Bloque 3</span>
        </div>

        {/* Projection Chart */}
        <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-lg p-6 shadow-sm">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyProjection}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E1" vertical={false} />
                <XAxis dataKey="monthLabel" stroke="#666666" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#666666"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E5E5E1',
                    color: '#1A1A1A',
                    borderRadius: '0.5rem',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                  }}
                  formatter={(value: any) => formatCurrency(Number(value), 'ARS')}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
                <Bar dataKey="projectedIncome" name="Cobros / Ingresos" fill="#10B981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="projectedSupplierPayments" name="Pagos Proveedores" fill="#F59E0B" radius={[3, 3, 0, 0]} />
                <Bar dataKey="projectedFixedExpenses" name="Gastos Fijos" fill="#EF4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="finalProjectedCash" name="Caja Final Proyectada" fill="#4F46E5" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Projection Table styled strictly according to Design Variation */}
        <div className="bg-[#FFFFFF] rounded-lg border border-[#E5E5E1] overflow-hidden shadow-sm">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E5E1] bg-[#FDFDFB]">
                <th className="text-left py-3 px-4 text-[#666666] font-medium">Mes</th>
                <th className="text-right py-3 px-4 text-[#666666] font-medium">Caja Inicial</th>
                <th className="text-right py-3 px-4 text-[#666666] font-medium">Cobros</th>
                <th className="text-right py-3 px-4 text-[#666666] font-medium">Pagos</th>
                <th className="text-right py-3 px-4 text-[#666666] font-medium">Estructura</th>
                <th className="text-right py-3 px-4 text-[#666666] font-medium">Caja Final</th>
                <th className="text-center py-3 px-4 text-[#666666] font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F3F1] font-mono">
              {monthlyProjection.map((row) => (
                <tr key={row.monthKey} className="hover:bg-[#F9F9F7] transition-colors">
                  <td className="py-3 px-4 font-sans font-medium text-[#1A1A1A]">
                    {row.monthLabel}
                  </td>
                  <td className="py-3 px-4 text-right text-[#666666]">
                    {formatCurrency(row.initialCash, 'ARS')}
                  </td>
                  <td className="py-3 px-4 text-right text-[#10B981] font-medium">
                    +{formatCurrency(row.projectedIncome, 'ARS')}
                  </td>
                  <td className="py-3 px-4 text-right text-[#666666]">
                    -{formatCurrency(row.projectedSupplierPayments, 'ARS')}
                  </td>
                  <td className="py-3 px-4 text-right text-[#666666]">
                    -{formatCurrency(row.projectedFixedExpenses, 'ARS')}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-[#1A1A1A]">
                    {formatCurrency(row.finalProjectedCash, 'ARS')}
                  </td>
                  <td className="py-3 px-4 text-center font-sans">
                    <span className={`inline-block py-0.5 px-2.5 rounded-full text-[11px] font-medium ${
                      row.isProjected
                        ? 'bg-[#EEF2FF] text-[#4F46E5]'
                        : 'bg-[#E6F6EF] text-[#10B981]'
                    }`}>
                      {row.isProjected ? 'Proyectado' : 'Cerrado'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer System Meta */}
      <div className="pt-6 border-t border-[#E5E5E1] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#666666] font-mono">
        <div>Cultour — Sistema de Gestión Operativa y Financiera</div>
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 bg-[#FFFFFF] border border-[#E5E5E1] rounded text-[#1A1A1A]">
            Directo: {formatPercent(channels.receptivoDirecto.margin)}
          </span>
          <span className="px-2 py-0.5 bg-[#FFFFFF] border border-[#E5E5E1] rounded text-[#4F46E5]">
            B2B: {formatPercent(channels.receptivoAgencia.margin)}
          </span>
          <span className="px-2 py-0.5 bg-[#FFFFFF] border border-[#E5E5E1] rounded text-[#10B981]">
            Educativo: {formatPercent(channels.viajesEducativos.margin)}
          </span>
        </div>
      </div>

    </div>
  );
};
