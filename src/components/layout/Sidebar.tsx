import React from 'react';
import {
  LayoutDashboard,
  Compass,
  GraduationCap,
  Building2,
  Receipt,
  Scale,
  CreditCard,
  TrendingUp,
  CalendarCheck,
  History,
  Landmark,
  Layers,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, kpis } = useApp();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard General',
      icon: LayoutDashboard,
      badge: undefined
    },
    {
      id: 'operations',
      label: 'Master Operaciones',
      icon: Compass,
      badge: kpis.activeOperationsCount
    },
    {
      id: 'students',
      label: 'Estudiantes y Pagadores',
      icon: GraduationCap,
      badge: kpis.pendingStudentsDebtCount > 0 ? `${kpis.pendingStudentsDebtCount} con deuda` : undefined,
      badgeColor: 'bg-rose-950 text-rose-300 border-rose-800'
    },
    {
      id: 'suppliers',
      label: 'Proveedores y Alias MP',
      icon: Building2,
      badge: undefined
    },
    {
      id: 'movements',
      label: 'Movimientos Financieros',
      icon: Receipt,
      badge: undefined
    },
    {
      id: 'reconciliation',
      label: 'Conciliación Bancaria/MP',
      icon: Scale,
      badge: kpis.unreconciledMovementsCount > 0 ? `${kpis.unreconciledMovementsCount} pend.` : undefined,
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-800'
    },
    {
      id: 'fixed_expenses',
      label: 'Gastos Fijos Estructura',
      icon: CreditCard,
      badge: undefined
    },
    {
      id: 'projection',
      label: 'Proyección Financiera',
      icon: TrendingUp,
      badge: undefined
    },
    {
      id: 'closing',
      label: 'Cierres Mensuales',
      icon: CalendarCheck,
      badge: undefined
    },
    {
      id: 'history',
      label: 'Histórico por Unidad',
      icon: History,
      badge: undefined
    },
    {
      id: 'sheets',
      label: 'Google Sheets & Drive',
      icon: FileSpreadsheet,
      badge: 'Sync',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      id: 'accounts',
      label: 'Cuentas & Fecha de Corte',
      icon: Landmark,
      badge: undefined
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      
      {/* Business Unit Quick Tag */}
      <div className="p-4 border-b border-[#E5E7EB] bg-gray-50/40">
        <div className="bg-white rounded-xl p-3 border border-[#E5E7EB] shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Unidades de Negocio</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-gray-700">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                <span className="font-medium text-xs">Turismo Receptivo</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-gray-700">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-medium text-xs">Salidas Educativas</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-gray-700">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                <span className="font-medium text-xs">Viajes Educativos</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Nav Items */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${
                    item.badgeColor || (isActive ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-gray-100 text-gray-600 border-gray-200')
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Status / User footer */}
      <div className="p-4 border-t border-[#E5E7EB] bg-gray-50/80 text-[11px] text-gray-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">
              TG
            </div>
            <div>
              <p className="font-semibold text-gray-800 leading-tight">Admin Central</p>
              <p className="text-[10px] text-gray-400">Online</p>
            </div>
          </div>
          <span className="text-emerald-600 flex items-center gap-1 font-mono font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Activo
          </span>
        </div>
      </div>
    </aside>
  );
};
