import React from 'react';
import {
  LayoutDashboard,
  Compass,
  GraduationCap,
  Building2,
  Users,
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
      id: 'clients',
      label: 'Clientes & Colegios',
      icon: Users,
      badge: undefined
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
    <aside className="w-64 bg-[#18181a] border-r border-white/10 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      
      {/* Brand Header */}
      <div className="p-5 border-b border-white/10">
        <div className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#a5b4fc] mb-1">
          [0.1] v2026.08
        </div>
        <h1 className="font-syne font-extrabold text-2xl tracking-tight leading-tight text-white">
          SGOF<br />SYSTEM
        </h1>
      </div>

      {/* Business Unit Quick Tag */}
      <div className="p-3 border-b border-white/10 bg-[#141416]">
        <div className="bg-[#222224] rounded-lg p-2.5 border border-white/10">
          <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-[#a5b4fc]" />
              <span>Unidades de Negocio</span>
            </div>
            <span className="text-[9px] text-zinc-500 font-mono">3 activas</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between text-zinc-300">
              <span className="flex items-center gap-2 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                <span>Turismo Receptivo</span>
              </span>
              <span className="font-mono text-[10px] text-cyan-400 font-bold">TR</span>
            </div>
            <div className="flex items-center justify-between text-zinc-300">
              <span className="flex items-center gap-2 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Salidas Educativas</span>
              </span>
              <span className="font-mono text-[10px] text-emerald-400 font-bold">SE</span>
            </div>
            <div className="flex items-center justify-between text-zinc-300">
              <span className="flex items-center gap-2 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#a5b4fc]"></span>
                <span>Viajes Educativos</span>
              </span>
              <span className="font-mono text-[10px] text-[#a5b4fc] font-bold">VE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Nav Items */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-500 mb-2 px-2">
          Navegación Principal
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-[#222224] text-[#a5b4fc] border-l-2 border-[#a5b4fc] shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#222224]/50 border-l-2 border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#a5b4fc]' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`font-mono text-[10px] px-1.5 py-0.5 rounded border font-semibold ${
                    item.badgeColor || (isActive ? 'bg-[#a5b4fc]/20 text-[#a5b4fc] border-[#a5b4fc]/30' : 'bg-[#222224] text-zinc-400 border-white/10')
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
      <div className="p-3.5 border-t border-white/10 bg-[#141416] text-[11px] text-zinc-400">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#a5b4fc] flex items-center justify-center text-[10px] font-bold font-mono text-[#111113]">
              AC
            </div>
            <div>
              <p className="font-bold text-zinc-200 leading-tight">Admin Central</p>
              <p className="font-mono text-[9px] text-[#34d399] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse"></span>
                System Online
              </p>
            </div>
          </div>
          <span className="font-mono text-[10px] text-zinc-500 bg-[#222224] px-1.5 py-0.5 rounded border border-white/10">
            v2026
          </span>
        </div>
      </div>
    </aside>
  );
};
