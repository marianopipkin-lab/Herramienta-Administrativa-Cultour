import React, { useState } from 'react';
import {
  Wallet,
  PlusCircle,
  FileSpreadsheet,
  Download,
  Upload,
  RotateCcw,
  Bell,
  Search,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Database,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/financialCalculations';
import { generateTemplateWorkbook } from '../../utils/excelParser';
import { DataManagementModal } from '../common/DataManagementModal';

export const Navbar: React.FC = () => {
  const {
    kpis,
    cutoffConfig,
    setIsNewOpModalOpen,
    setIsImportModalOpen,
    setActiveTab,
    resetToDemoData,
    exportDatabaseJSON,
    importDatabaseJSON,
    movements,
    operations
  } = useApp();

  const [showBackupMenu, setShowBackupMenu] = useState(false);
  const [showAlertsMenu, setShowAlertsMenu] = useState(false);
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
    <header className="bg-white border-b border-[#E5E7EB] text-[#1A1A1A] sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand & Cutoff Badge */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-xs text-white">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-gray-900">SISTEMA GESTIÓN</span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold">
                Operativa & Financiera
              </span>
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1.5 font-mono">
              <span>Corte inicial:</span>
              <span className="text-emerald-700 font-semibold">{cutoffConfig.cutoffDate}</span>
            </p>
          </div>
        </div>

        {/* Live Cash Snapshot Ribbon */}
        <div className="hidden lg:flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-1.5">
          <div className="border-r border-gray-200 pr-4">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">Caja Actual</span>
            <span className="text-sm font-bold text-gray-900 font-mono">{formatCurrency(kpis.currentCash)}</span>
          </div>
          <div className="border-r border-gray-200 pr-4">
            <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider block">Comprometido</span>
            <span className="text-sm font-semibold text-amber-700 font-mono">-{formatCurrency(kpis.committedCash)}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider block">Caja Libre Proy.</span>
            <span className="text-sm font-bold text-emerald-700 font-mono">{formatCurrency(kpis.projectedFreeCash)}</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          
          {/* Alerts notification bell */}
          <div className="relative">
            <button
              onClick={() => setShowAlertsMenu(!showAlertsMenu)}
              className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 border border-gray-200 transition-colors relative"
              title="Alertas y Notificaciones"
            >
              <Bell className="w-4 h-4" />
              {(unreconciledCount > 0 || pendingStudents > 0) && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                  {unreconciledCount + pendingStudents}
                </span>
              )}
            </button>

            {showAlertsMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Alertas Activas</h4>
                  <span className="text-[11px] text-gray-400 font-mono">{unreconciledCount + pendingStudents} items</span>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {unreconciledCount > 0 && (
                    <div 
                      onClick={() => { setActiveTab('reconciliation'); setShowAlertsMenu(false); }}
                      className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100/70 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 text-amber-800 text-xs font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                        <span>{unreconciledCount} Movimientos sin conciliar</span>
                      </div>
                      <p className="text-[11px] text-amber-700 mt-1">
                        Total {formatCurrency(kpis.unreconciledAmount)} pendientes de clasificar en Mercado Pago / Bancos.
                      </p>
                    </div>
                  )}

                  {pendingStudents > 0 && (
                    <div 
                      onClick={() => { setActiveTab('students'); setShowAlertsMenu(false); }}
                      className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100/70 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 text-rose-800 text-xs font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                        <span>{pendingStudents} Estudiantes con saldo adeudado</span>
                      </div>
                      <p className="text-[11px] text-rose-700 mt-1">
                        Total {formatCurrency(kpis.pendingStudentsDebtAmount)} de cuotas impagas en Viajes Educativos.
                      </p>
                    </div>
                  )}

                  {unreconciledCount === 0 && pendingStudents === 0 && (
                    <div className="text-center py-4 text-gray-500 text-xs flex flex-col items-center gap-1">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
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
              className="px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition-colors text-xs font-medium flex items-center gap-1.5"
              title="Herramientas de Base de Datos y Copias"
            >
              <Database className="w-3.5 h-3.5 text-gray-500" />
              <span className="hidden sm:inline">Datos</span>
            </button>

            {showBackupMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl p-2 z-50 space-y-1 text-xs">
                <button
                  onClick={() => { setShowDataManagementModal(true); setShowBackupMenu(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-semibold flex items-center gap-2"
                >
                  <Database className="w-4 h-4 text-indigo-600" />
                  <span>Empezar de Cero / Limpiar</span>
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={() => { handleDownloadTemplate(); setShowBackupMenu(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Descargar Plantilla Excel</span>
                </button>
                <button
                  onClick={() => { handleExportJSON(); setShowBackupMenu(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>Exportar Backup (JSON)</span>
                </button>
                <label className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 flex items-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4 text-purple-600" />
                  <span>Restaurar Backup (JSON)</span>
                  <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                </label>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={() => {
                    if (confirm('¿Restaurar los datos de demostración iniciales? Se sobreescribirán los cambios no exportados.')) {
                      resetToDemoData();
                      setShowBackupMenu(false);
                    }
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-700 flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <span>Restablecer Demo Inicial</span>
                </button>
              </div>
            )}
          </div>

          {/* Google Sheets button */}
          <button
            onClick={() => setActiveTab('sheets')}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs"
            title="Google Sheets & Google Drive Workspace"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Google Sheets</span>
          </button>

          {/* Import Excel */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 border border-gray-200 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Importar Excel</span>
          </button>

          {/* + Nueva Operación */}
          <button
            onClick={() => setIsNewOpModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nueva Operación</span>
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
