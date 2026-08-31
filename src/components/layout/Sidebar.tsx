import React, { useState } from 'react';
import {
  LayoutDashboard,
  Compass,
  Building2,
  Users,
  Receipt,
  CreditCard,
  TrendingUp,
  CalendarCheck,
  History,
  Landmark,
  Layers,
  FileSpreadsheet,
  LogOut,
  Loader2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeColor?: string;
  roles: string[];
}

interface NavGroup {
  id: string;
  title: string;
  roles: string[];
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, kpis, currentRole, userProfile, logout } = useApp();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsLoggingOut(true);
      await logout();
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navGroups: NavGroup[] = [
    {
      id: 'operacion',
      title: 'OPERACIÓN',
      roles: ['socio', 'administrativo', 'operativo'],
      items: [
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
          id: 'collections',
          label: 'Cobranzas',
          icon: Receipt,
          badge: kpis.pendingStudentsDebtCount > 0 ? `${kpis.pendingStudentsDebtCount} pend.` : undefined,
          badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
          roles: ['socio', 'administrativo', 'operativo']
        }
      ]
    },
    {
      id: 'directorios',
      title: 'DIRECTORIOS',
      roles: ['socio', 'administrativo', 'operativo'],
      items: [
        {
          id: 'clients',
          label: 'Clientes & Agencias',
          icon: Users,
          badge: undefined,
          roles: ['socio', 'administrativo', 'operativo']
        },
        {
          id: 'suppliers',
          label: 'Proveedores',
          icon: Building2,
          badge: undefined,
          roles: ['socio', 'administrativo', 'operativo']
        }
      ]
    },
    {
      id: 'tesoreria',
      title: 'TESORERÍA',
      roles: ['socio', 'administrativo'],
      items: [
        {
          id: 'accounts',
          label: 'Cuentas',
          icon: Landmark,
          badge: undefined,
          roles: ['socio', 'administrativo']
        },
        {
          id: 'movements',
          label: 'Movimientos',
          icon: CreditCard,
          badge: kpis.unreconciledMovementsCount > 0 ? `${kpis.unreconciledMovementsCount} pend.` : undefined,
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
          roles: ['socio', 'administrativo']
        },
        {
          id: 'fixed_expenses',
          label: 'Gastos Fijos',
          icon: Receipt,
          badge: undefined,
          roles: ['socio', 'administrativo']
        }
      ]
    },
    {
      id: 'socios',
      title: 'SOCIOS',
      roles: ['socio', 'administrativo'],
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard de Socios',
          icon: LayoutDashboard,
          badge: undefined,
          roles: ['socio', 'administrativo']
        },
        {
          id: 'closing',
          label: 'Cierres Mensuales',
          icon: CalendarCheck,
          badge: undefined,
          roles: ['socio', 'administrativo']
        },
        {
          id: 'projection',
          label: 'Proyección',
          icon: TrendingUp,
          badge: undefined,
          roles: ['socio']
        },
        {
          id: 'history',
          label: 'Histórico',
          icon: History,
          badge: undefined,
          roles: ['socio']
        }
      ]
    }
  ];

  // Loose item at the end
  const looseImportItem: NavItem = {
    id: 'templates',
    label: 'Importación',
    icon: FileSpreadsheet,
    badge: undefined,
    roles: ['socio', 'administrativo', 'operativo']
  };

  // Filter groups and items by user role
  const visibleGroups = navGroups
    .filter(group => group.roles.includes(currentRole))
    .map(group => ({
      ...group,
      items: group.items.filter(item => item.roles.includes(currentRole))
    }))
    .filter(group => group.items.length > 0);

  const isLooseImportVisible = looseImportItem.roles.includes(currentRole);

  return (
    <aside className="w-[260px] bg-[#FFFFFF] border-r border-[#E5E5E1] flex flex-col shrink-0 sticky top-0 h-[calc(100vh-4.5rem)]">
      
      {/* Brand Header */}
      <div className="p-5 border-b border-[#E5E5E1]">
        <span className="label-mono block mb-1">System v2026</span>
        <div className="font-serif text-2xl font-medium tracking-tight text-[#1A1A1A]">
          SGOF Cultour
        </div>
      </div>

      {/* Main Nav Items with Groups */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {visibleGroups.map((group) => (
          <div key={group.id} className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-mono font-bold tracking-wider text-[#888888] uppercase select-none">
              {group.title}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition-all group cursor-pointer ${
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
                        className={`font-mono text-[10px] px-1.5 py-0.2 rounded border font-medium ${
                          item.badgeColor || (isActive ? 'bg-[#FFFFFF] text-[#1A1A1A] border-[#D0D0CC]' : 'bg-[#F9F9F7] text-[#666666] border-[#E5E5E1]')
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Separator before loose Importación item */}
        {isLooseImportVisible && (
          <div className="pt-2 border-t border-[#E5E5E1]/80">
            <button
              onClick={() => setActiveTab(looseImportItem.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-all group cursor-pointer ${
                activeTab === looseImportItem.id
                  ? 'bg-[#E5E5E1] text-[#1A1A1A] font-medium'
                  : 'text-[#666666] hover:text-[#1A1A1A] hover:bg-[#F9F9F7]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <looseImportItem.icon className={`w-4 h-4 shrink-0 transition-colors ${activeTab === looseImportItem.id ? 'text-[#1A1A1A]' : 'text-[#888888] group-hover:text-[#1A1A1A]'}`} />
                <span className="truncate">{looseImportItem.label}</span>
              </div>
            </button>
          </div>
        )}
      </nav>

      {/* User Block at bottom matching the design */}
      <div className="p-4 border-t border-[#E5E5E1] bg-[#FFFFFF]">
        <div 
          onClick={handleLogout}
          className="flex items-center gap-3 p-2 bg-[#FFFFFF] hover:bg-[#F4F4F0] border border-[#E5E5E1] hover:border-[#D0D0CC] rounded-lg transition-all cursor-pointer group select-none"
          title="Cerrar sesión en SGOF Cultour"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleLogout(e as any);
            }
          }}
        >
          <div className="w-7 h-7 bg-[#E5E5E1] group-hover:bg-[#D0D0CC] text-[#1A1A1A] rounded flex items-center justify-center text-xs font-semibold font-mono transition-colors shrink-0">
            {userProfile?.fullName ? userProfile.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'MP'}
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-[#1A1A1A] truncate group-hover:text-black">
              {userProfile?.fullName || 'Mariano Pipkin'}
            </div>
            <div className="text-[11px] text-[#666666] truncate capitalize">
              {currentRole === 'socio' ? 'Socio Administrador' : currentRole}
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="p-1.5 rounded-md text-[#888888] group-hover:text-[#EF4444] hover:bg-rose-50 hover:text-[#EF4444] transition-colors shrink-0 cursor-pointer"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            {isLoggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#4F46E5]" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
};
