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
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, kpis, currentRole, userProfile } = useApp();

  const allNavItems = [
    {
      id: 'dashboard_operativo',
      label: 'Dashboard Operativo',
      icon: Compass,
      badge: undefined,
      roles: ['socio', 'administrativo', 'operativo']
    },
    {
      id: 'operations',
      label: 'Operaciones / Files',
      icon: Layers,
      badge: kpis.activeOperationsCount > 0 ? kpis.activeOperationsCount : undefined,
      roles: ['socio', 'administrativo', 'operativo']
    },
    {
      id: 'clients',
      label: 'Clientes & Pagadores',
      icon: Users,
      badge: undefined,
      roles: ['socio', 'administrativo', 'operativo']
    },
    {
      id: 'suppliers',
      label: 'Proveedores & Alias MP',
      icon: Building2,
      badge: undefined,
      roles: ['socio', 'administrativo', 'operativo']
    },
    {
      id: 'collections',
      label: 'Cobranzas & Cuotas',
      icon: Receipt,
      badge: kpis.pendingStudentsDebtCount > 0 ? `${kpis.pendingStudentsDebtCount} pend.` : undefined,
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      roles: ['socio', 'administrativo']
    },
    {
      id: 'students',
      label: 'Estudiantes & Cuotas',
      icon: GraduationCap,
      badge: undefined,
      roles: ['socio', 'administrativo', 'operativo']
    },
    {
      id: 'accounts',
      label: 'Cuentas & Tesorería',
      icon: Landmark,
      badge: undefined,
      roles: ['socio', 'administrativo']
    },
    {
      id: 'movements',
      label: 'Movimientos Financieros',
      icon: CreditCard,
      badge: undefined,
      roles: ['socio', 'administrativo']
    },
    {
      id: 'reconciliation',
      label: 'Conciliación Bancaria/MP',
      icon: Scale,
      badge: kpis.unreconciledMovementsCount > 0 ? `${kpis.unreconciledMovementsCount} pend.` : undefined,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      roles: ['socio', 'administrativo']
    },
    {
      id: 'dashboard',
      label: 'Dashboard de Socios',
      icon: LayoutDashboard,
      badge: undefined,
      roles: ['socio', 'administrativo']
    },
    {
      id: 'projection',
      label: 'Proyección Financiera',
      icon: TrendingUp,
      badge: undefined,
      roles: ['socio']
    },
    {
      id: 'closing',
      label: 'Cierres Mensuales',
      icon: CalendarCheck,
      badge: undefined,
      roles: ['socio', 'administrativo']
    },
    {
      id: 'fixed_expenses',
      label: 'Gastos Fijos Estructura',
      icon: CreditCard,
      badge: undefined,
      roles: ['socio', 'administrativo']
    },
    {
      id: 'history',
      label: 'Histórico por Unidad',
      icon: History,
      badge: undefined,
      roles: ['socio']
    },
    {
      id: 'templates',
      label: 'Plantillas & Importación',
      icon: FileSpreadsheet,
      badge: '12',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      roles: ['socio', 'administrativo', 'operativo']
    },
    {
      id: 'sheets',
      label: 'Google Sheets & Drive',
      icon: FileSpreadsheet,
      badge: 'Sync',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      roles: ['socio', 'administrativo']
    }
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(currentRole));

  return (
    <aside className="w-[260px] bg-[#FFFFFF] border-r border-[#E5E5E1] flex flex-col shrink-0 min-h-[calc(100vh-4.5rem)]">
      
      {/* Brand Header */}
      <div className="p-6 border-b border-[#E5E5E1]">
        <span className="label-mono block mb-1">System v2026</span>
        <div className="font-serif text-2xl font-medium tracking-tight text-[#1A1A1A]">
          SGOF Cultour
        </div>
      </div>

      {/* Main Nav Items */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <span className="label-mono block px-3 mb-2">Navegación</span>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-all group ${
                isActive
                  ? 'bg-[#E5E5E1] text-[#1A1A1A] font-medium'
                  : 'text-[#666666] hover:text-[#1A1A1A] hover:bg-[#F9F9F7]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#1A1A1A]' : 'text-[#888888] group-hover:text-[#1A1A1A]'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`font-mono text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                    item.badgeColor || (isActive ? 'bg-[#FFFFFF] text-[#1A1A1A] border-[#D0D0CC]' : 'bg-[#F9F9F7] text-[#666666] border-[#E5E5E1]')
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Block at bottom matching the design */}
      <div className="p-4 border-t border-[#E5E5E1] bg-[#FFFFFF]">
        <div className="flex items-center gap-3 p-2 bg-[#FFFFFF] border border-[#E5E5E1] rounded-lg">
          <div className="w-7 h-7 bg-[#E5E5E1] text-[#1A1A1A] rounded flex items-center justify-center text-xs font-semibold font-mono">
            {userProfile?.fullName ? userProfile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'MP'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-[#1A1A1A] truncate">
              {userProfile?.fullName || 'Mariano Pipkin'}
            </div>
            <div className="text-[11px] text-[#666666] truncate capitalize">
              {currentRole === 'socio' ? 'Socio Administrador' : currentRole}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
