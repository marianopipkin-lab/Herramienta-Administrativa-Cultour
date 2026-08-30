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
    <header className="bg-[#18181a] border-b border-white/10 text-[#f2f2f2] sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand & Cutoff Badge */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#a5b4fc] flex items-center justify-center text-[#111113] shadow-sm">
            <Wallet className="w-4 h-4 text-[#111113]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-syne font-extrabold text-sm tracking-tight text-white uppercase">SISTEMA GESTIÓN</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#222224] text-[#a5b4fc] border border-white/10 font-bold uppercase">
                CONTROL SGOF
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 flex items-center gap-1.5 font-mono">
              <span className="text-zinc-500">Corte inicial:</span>
              <span className="text-[#34d399] font-bold">{cutoffConfig.cutoffDate}</span>
            </p>
          </div>
        </div>

        {/* Live Cash Snapshot Ribbon */}
        <div className="hidden lg:flex items-center gap-4 bg-[#222224] border border-white/10 rounded-lg px-4 py-1.5 shadow-inner">
          <div className="border-r border-white/10 pr-4">
            <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider block font-mono">Caja Actual</span>
            <span className="text-xs font-bold text-white font-mono">{formatCurrency(kpis.currentCash)}</span>
          </div>
          <div className="border-r border-white/10 pr-4">
            <span className="text-[9px] uppercase font-bold text-[#fbbf24] tracking-wider block font-mono">Comprometido</span>
            <span className="text-xs font-semibold text-[#fbbf24] font-mono">-{formatCurrency(kpis.committedCash)}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-[#34d399] tracking-wider block font-mono">Caja Libre Proy.</span>
            <span className="text-xs font-bold text-[#34d399] font-mono">{formatCurrency(kpis.projectedFreeCash)}</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          
          {/* Alerts notification bell */}
          <div className="relative">
            <button
              onClick={() => setShowAlertsMenu(!showAlertsMenu)}
              className="p-2 rounded bg-[#222224] hover:bg-[#28282b] text-zinc-300 hover:text-white border border-white/10 transition-colors relative"
              title="Alertas y Notificaciones"
            >
              <Bell className="w-4 h-4" />
              {(unreconciledCount > 0 || pendingStudents > 0) && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#fb7185] text-[10px] font-bold text-[#111113] rounded-full flex items-center justify-center animate-pulse font-mono">
                  {unreconciledCount + pendingStudents}
                </span>
              )}
            </button>

            {showAlertsMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-[#18181a] border border-white/15 rounded-lg shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">Alertas Activas</h4>
                  <span className="text-[10px] text-zinc-500 font-mono">{unreconciledCount + pendingStudents} items</span>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {unreconciledCount > 0 && (
                    <div 
                      onClick={() => { setActiveTab('reconciliation'); setShowAlertsMenu(false); }}
                      className="p-2.5 rounded bg-[#fbbf24]/10 border border-[#fbbf24]/30 hover:bg-[#fbbf24]/20 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 text-[#fbbf24] text-xs font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#fbbf24]" />
                        <span>{unreconciledCount} Movimientos sin conciliar</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 font-mono">
                        Total {formatCurrency(kpis.unreconciledAmount)} pendientes de clasificar en Mercado Pago / Bancos.
                      </p>
                    </div>
                  )}

                  {pendingStudents > 0 && (
                    <div 
                      onClick={() => { setActiveTab('students'); setShowAlertsMenu(false); }}
                      className="p-2.5 rounded bg-[#fb7185]/10 border border-[#fb7185]/30 hover:bg-[#fb7185]/20 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 text-[#fb7185] text-xs font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#fb7185]" />
                        <span>{pendingStudents} Estudiantes con saldo adeudado</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 font-mono">
                        Total {formatCurrency(kpis.pendingStudentsDebtAmount)} de cuotas impagas en Viajes Educativos.
                      </p>
                    </div>
                  )}

                  {unreconciledCount === 0 && pendingStudents === 0 && (
                    <div className="text-center py-4 text-zinc-400 text-xs flex flex-col items-center gap-1">
                      <CheckCircle2 className="w-6 h-6 text-[#34d399]" />
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
              className="px-2.5 py-1.5 rounded bg-[#222224] hover:bg-[#28282b] text-zinc-200 border border-white/10 transition-colors text-xs font-medium flex items-center gap-1.5 font-mono"
              title="Herramientas de Base de Datos y Copias"
            >
              <Database className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Datos</span>
            </button>

            {showBackupMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-[#18181a] border border-white/15 rounded-lg shadow-2xl p-2 z-50 space-y-1 text-xs">
                <button
                  onClick={() => { setShowDataManagementModal(true); setShowBackupMenu(false); }}
                  className="w-full text-left px-3 py-2 rounded bg-[#a5b4fc]/15 hover:bg-[#a5b4fc]/25 text-[#a5b4fc] font-bold flex items-center gap-2"
                >
                  <Database className="w-4 h-4 text-[#a5b4fc]" />
                  <span>Empezar de Cero / Limpiar</span>
                </button>
                <div className="border-t border-white/10 my-1"></div>
                <button
                  onClick={() => { handleDownloadTemplate(); setShowBackupMenu(false); }}
                  className="w-full text-left px-3 py-2 rounded hover:bg-[#222224] text-zinc-300 flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#34d399]" />
                  <span>Descargar Plantilla Excel</span>
                </button>
                <button
                  onClick={() => { handleExportJSON(); setShowBackupMenu(false); }}
                  className="w-full text-left px-3 py-2 rounded hover:bg-[#222224] text-zinc-300 flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-[#a5b4fc]" />
                  <span>Exportar Backup (JSON)</span>
                </button>
                <label className="w-full text-left px-3 py-2 rounded hover:bg-[#222224] text-zinc-300 flex items-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4 text-purple-400" />
                  <span>Restaurar Backup (JSON)</span>
                  <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                </label>
                <div className="border-t border-white/10 my-1"></div>
                <button
                  onClick={() => {
                    if (confirm('¿Restaurar los datos de demostración iniciales? Se sobreescribirán los cambios no exportados.')) {
                      resetToDemoData();
                      setShowBackupMenu(false);
                    }
                  }}
                  className="w-full text-left px-3 py-2 rounded hover:bg-[#fb7185]/20 text-[#fb7185] flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4 text-[#fb7185]" />
                  <span>Restablecer Demo Inicial</span>
                </button>
              </div>
            )}
          </div>

          {/* Google Sheets button */}
          <button
            onClick={() => setActiveTab('sheets')}
            className="px-2.5 py-1.5 rounded bg-[#34d399]/15 hover:bg-[#34d399]/25 text-[#34d399] border border-[#34d399]/30 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm font-mono"
            title="Google Sheets & Google Drive Workspace"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#34d399]" />
            <span className="hidden sm:inline">Sheets</span>
          </button>

          {/* Import Excel */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3 py-1.5 rounded bg-[#222224] hover:bg-[#28282b] text-zinc-200 border border-white/10 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm font-mono uppercase tracking-wider"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden md:inline">Importar</span>
          </button>

          {/* + Nueva Operación button (Accent button from design HTML) */}
          <button
            onClick={() => setIsNewOpModalOpen(true)}
            className="px-3.5 py-1.5 rounded bg-[#a5b4fc] hover:bg-[#c7d2fe] text-[#111113] font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-sm uppercase tracking-wider font-mono"
          >
            <PlusCircle className="w-4 h-4 text-[#111113]" />
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
