import React, { useState } from 'react';
import {
  Wallet,
  PlusCircle,
  FileSpreadsheet,
  Download,
  Upload,
  RotateCcw,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Database,
  LogOut,
  User,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/financialCalculations';
import { generateTemplateWorkbook } from '../../utils/excelParser';
import { DataManagementModal } from '../common/DataManagementModal';

export const Navbar: React.FC = () => {
  const {
    kpis,
    cutoffConfig,
    exchangeRate,
    setIsNewOpModalOpen,
    setIsImportModalOpen,
    setActiveTab,
    resetToDemoData,
    exportDatabaseJSON,
    importDatabaseJSON,
    currentRole,
    setCurrentRole,
    userProfile,
    logout,
    supabaseStatus,
    syncFromSupabase,
    isLoadingData
  } = useApp();

  const [showBackupMenu, setShowBackupMenu] = useState(false);
  const [showAlertsMenu, setShowAlertsMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDataManagementModal, setShowDataManagementModal] = useState(false);

  // Download Excel Template
  const handleDownloadTemplate = () => {
    const buffer = generateTemplateWorkbook();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Plantilla_Operaciones_Turismo.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export JSON backup
  const handleExportJSON = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Turismo_Finanzas_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importDatabaseJSON(content);
        if (ok) {
          alert('Copia de seguridad restaurada correctamente.');
        } else {
          alert('Error al leer el archivo JSON.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const unreconciledCount = kpis.unreconciledMovementsCount;
  const pendingStudents = kpis.pendingStudentsDebtCount;

  return (
    <header className="bg-[#F9F9F7] border-b border-[#E5E5E1] text-[#1A1A1A] sticky top-0 z-30">
      <div className="max-w-[1400px] mx-auto px-6 h-18 flex items-center justify-between gap-4">
        
        {/* Left Meta & Reference */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-xs text-[#666666]">
            <span>
              Ref MEP: <strong className="text-[#1A1A1A] font-mono">${exchangeRate?.usdToArsRate ? exchangeRate.usdToArsRate.toLocaleString('es-AR') : '1.320'}</strong>
            </span>
            <span className="text-[#D0D0CC]">•</span>
            <span>
              Corte: <strong className="text-[#1A1A1A] font-mono">{cutoffConfig.cutoffDate}</strong>
            </span>
          </div>

          {/* Live Cash Snapshot Ribbon in clean light style (visible only for 'socio' role) */}
          {currentRole === 'socio' && (
            <div className="hidden xl:flex items-center gap-4 bg-[#FFFFFF] border border-[#E5E5E1] rounded-lg px-3.5 py-1.5 shadow-sm">
              <div className="border-r border-[#E5E5E1] pr-3.5">
                <span className="text-[9px] uppercase font-bold text-[#666666] tracking-wider block font-mono">Caja Real</span>
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <span className="font-semibold text-[#1A1A1A]">{formatCurrency(kpis.currentCashARS, 'ARS')}</span>
                  <span className="text-[#888888]">|</span>
                  <span className="font-semibold text-[#06B6D4]">{formatCurrency(kpis.currentCashUSD, 'USD')}</span>
                </div>
              </div>
              <div className="border-r border-[#E5E5E1] pr-3.5">
                <span className="text-[9px] uppercase font-bold text-[#F59E0B] tracking-wider block font-mono">Comprometido</span>
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <span className="font-medium text-[#F59E0B]">-{formatCurrency(kpis.committedCashARS, 'ARS')}</span>
                </div>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-[#10B981] tracking-wider block font-mono">Caja Libre</span>
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <span className="font-semibold text-[#10B981]">{formatCurrency(kpis.freeCashUSD, 'USD')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          
          {/* Supabase Status Pill */}
          <button
            onClick={() => setShowDataManagementModal(true)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border flex items-center gap-1.5 transition-all ${
              supabaseStatus === 'connected'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                : supabaseStatus === 'connecting'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100'
                : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
            }`}
            title="Base de datos Supabase: Click para abrir panel de sincronización"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {supabaseStatus === 'connected'
                ? 'Supabase Conectado'
                : supabaseStatus === 'connecting'
                ? 'Sincronizando...'
                : 'Modo Local'}
            </span>
          </button>

          {/* Quick sync button if connected */}
          {supabaseStatus === 'connected' && (
            <button
              onClick={() => syncFromSupabase()}
              disabled={isLoadingData}
              className="p-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F4F4F0] text-[#666666] hover:text-[#1A1A1A] border border-[#E5E5E1] transition-colors"
              title="Recargar datos desde Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin text-[#4F46E5]' : ''}`} />
            </button>
          )}

          {/* Alerts notification bell */}
          <div className="relative">
            <button
              onClick={() => setShowAlertsMenu(!showAlertsMenu)}
              className="p-2 rounded-md bg-[#FFFFFF] hover:bg-[#F4F4F0] text-[#666666] hover:text-[#1A1A1A] border border-[#E5E5E1] transition-colors relative"
              title="Alertas y Notificaciones"
            >
              <Bell className="w-4 h-4" />
              {(unreconciledCount > 0 || pendingStudents > 0) && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#EF4444] text-[10px] font-bold text-white rounded-full flex items-center justify-center font-mono">
                  {unreconciledCount + pendingStudents}
                </span>
              )}
            </button>

            {showAlertsMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-[#FFFFFF] border border-[#E5E5E1] rounded-lg shadow-xl p-3 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-[#E5E5E1] pb-2 mb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A] font-mono">Alertas Activas</h4>
                  <span className="text-[10px] text-[#666666] font-mono">{unreconciledCount + pendingStudents} items</span>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {unreconciledCount > 0 && (
                    <div 
                      onClick={() => { setActiveTab('reconciliation'); setShowAlertsMenu(false); }}
                      className="p-2.5 rounded bg-amber-50 border border-amber-200 hover:bg-amber-100 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 text-amber-900 text-xs font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                        <span>{unreconciledCount} Movimientos sin conciliar</span>
                      </div>
                      <p className="text-[11px] text-amber-800 mt-1 font-mono">
                        Total {formatCurrency(kpis.unreconciledAmount)} pendientes de clasificar.
                      </p>
                    </div>
                  )}

                  {pendingStudents > 0 && (
                    <div 
                      onClick={() => { setActiveTab('students'); setShowAlertsMenu(false); }}
                      className="p-2.5 rounded bg-rose-50 border border-rose-200 hover:bg-rose-100 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 text-rose-900 text-xs font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                        <span>{pendingStudents} Estudiantes con saldo adeudado</span>
                      </div>
                      <p className="text-[11px] text-rose-800 mt-1 font-mono">
                        Total {formatCurrency(kpis.pendingStudentsDebtAmount)} de cuotas impagas.
                      </p>
                    </div>
                  )}

                  {unreconciledCount === 0 && pendingStudents === 0 && (
                    <div className="text-center py-4 text-[#666666] text-xs flex flex-col items-center gap-1">
                      <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
                      <span>Todo al día sin alertas críticas</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Backup & System Tools dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowBackupMenu(!showBackupMenu)}
              className="px-2.5 py-1.5 rounded-md bg-[#FFFFFF] hover:bg-[#F4F4F0] text-[#1A1A1A] border border-[#E5E5E1] transition-colors text-xs font-medium flex items-center gap-1.5 font-mono"
              title="Herramientas de Base de Datos y Copias"
            >
              <Database className="w-3.5 h-3.5 text-[#666666]" />
              <span className="hidden sm:inline">Datos</span>
            </button>

            {showBackupMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-[#FFFFFF] border border-[#E5E5E1] rounded-lg shadow-xl p-2 z-50 space-y-1 text-xs">
                <button
                  onClick={() => { setShowDataManagementModal(true); setShowBackupMenu(false); }}
                  className="w-full text-left px-3 py-2 rounded bg-indigo-50 hover:bg-indigo-100 text-[#4F46E5] font-semibold flex items-center gap-2"
                >
                  <Database className="w-4 h-4 text-[#4F46E5]" />
                  <span>Sincronizar Supabase / Limpiar</span>
                </button>
                <div className="border-t border-[#E5E5E1] my-1"></div>
                <button
                  onClick={() => { handleDownloadTemplate(); setShowBackupMenu(false); }}
                  className="w-full text-left px-3 py-2 rounded hover:bg-[#F4F4F0] text-[#1A1A1A] flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#10B981]" />
                  <span>Descargar Plantilla Excel</span>
                </button>
                <button
                  onClick={() => { handleExportJSON(); setShowBackupMenu(false); }}
                  className="w-full text-left px-3 py-2 rounded hover:bg-[#F4F4F0] text-[#1A1A1A] flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-[#4F46E5]" />
                  <span>Exportar Backup (JSON)</span>
                </button>
                <label className="w-full text-left px-3 py-2 rounded hover:bg-[#F4F4F0] text-[#1A1A1A] flex items-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4 text-purple-600" />
                  <span>Restaurar Backup (JSON)</span>
                  <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                </label>
                <div className="border-t border-[#E5E5E1] my-1"></div>
                <button
                  onClick={() => {
                    if (confirm('¿Restaurar los datos de demostración iniciales? Se sobreescribirán los cambios no exportados.')) {
                      resetToDemoData();
                      setShowBackupMenu(false);
                    }
                  }}
                  className="w-full text-left px-3 py-2 rounded hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4 text-rose-500" />
                  <span>Restablecer Demo Inicial</span>
                </button>
              </div>
            )}
          </div>

          {/* Role Switcher */}
          <div className="flex items-center bg-[#FFFFFF] border border-[#E5E5E1] rounded-md p-0.5 text-xs">
            <span className="text-[9px] font-mono uppercase text-[#666666] px-2 font-bold hidden xl:inline">Rol:</span>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value as any)}
              className="bg-transparent text-xs font-mono font-medium text-[#1A1A1A] focus:outline-none cursor-pointer pr-2 py-1"
              title="Cambiar Rol de Usuario"
            >
              <option value="socio">Socio (Full)</option>
              <option value="administrativo">Administrativo</option>
              <option value="operativo">Operativo</option>
            </select>
          </div>

          {/* Import button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-1.5 rounded-md bg-transparent hover:bg-[#FFFFFF] text-[#1A1A1A] border border-[#E5E5E1] font-medium text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#666666]" />
            <span className="hidden md:inline">Importar Datos</span>
          </button>

          {/* + Nueva Operación button (Solid Dark #1A1A1A) */}
          <button
            onClick={() => setIsNewOpModalOpen(true)}
            className="px-4 py-1.5 rounded-md bg-[#1A1A1A] hover:bg-black text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5 text-white" />
            <span>+ Nueva Operación</span>
          </button>

        </div>
      </div>

      {/* Global Data Management Modal */}
      <DataManagementModal
        isOpen={showDataManagementModal}
        onClose={() => setShowDataManagementModal(false)}
      />
    </header>
  );
};
