import React, { useState } from 'react';
import {
  Trash2,
  RotateCcw,
  Download,
  Upload,
  Database,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  Calendar,
  X,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/financialCalculations';
import { generateTemplateWorkbook } from '../../utils/excelParser';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DataManagementModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    operations,
    suppliers,
    accounts,
    movements,
    fixedExpenses,
    cutoffConfig,
    clearAllData,
    resetToDemoData,
    exportDatabaseJSON,
    importDatabaseJSON,
    setIsImportModalOpen,
    setActiveTab
  } = useApp();

  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [resetBalancesToZero, setResetBalancesToZero] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleClearData = () => {
    clearAllData({ resetBalancesToZero });
    setConfirmClearOpen(false);
    setStatusMessage({
      type: 'success',
      text: '¡Base de datos limpiada con éxito! Ya puedes comenzar a cargar tus operaciones y saldos reales.'
    });
    setTimeout(() => {
      onClose();
      setActiveTab('accounts');
    }, 1500);
  };

  const handleRestoreDemo = () => {
    if (confirm('¿Restaurar los datos de demostración? Se sobreescribirá la información actual no respaldada.')) {
      resetToDemoData();
      setStatusMessage({
        type: 'success',
        text: 'Datos de demostración restaurados correctamente.'
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  const handleExportJSON = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Turismo_Finanzas_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage({ type: 'success', text: 'Copia de seguridad descargada exitosamente en formato JSON.' });
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importDatabaseJSON(content);
        if (ok) {
          setStatusMessage({ type: 'success', text: 'Copia de seguridad restaurada correctamente.' });
          setTimeout(() => onClose(), 1500);
        } else {
          setStatusMessage({ type: 'error', text: 'Error al interpretar el archivo JSON. Verifique el formato.' });
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

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

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-xs">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Gestión de Datos & Puesta a Cero</h2>
              <p className="text-xs text-gray-500">
                Limpieza de datos ficticios, configuración de saldos reales y copias de seguridad.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-gray-200/60 hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border flex items-center gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
          )}

          {/* Current Database Summary */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5 flex items-center gap-2">
              <span>Estado Actual de la Base de Datos</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Operaciones</span>
                <span className="text-base font-bold text-gray-900 font-mono">{operations.length}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Proveedores</span>
                <span className="text-base font-bold text-gray-900 font-mono">{suppliers.length}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Movimientos</span>
                <span className="text-base font-bold text-gray-900 font-mono">{movements.length}</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Gastos Fijos</span>
                <span className="text-base font-bold text-gray-900 font-mono">{fixedExpenses.length}</span>
              </div>
            </div>
          </div>

          {/* Action 1: Start Clean from Scratch */}
          {!confirmClearOpen ? (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Empezar de Cero (Borrar Datos de Prueba)</span>
                  </h4>
                  <p className="text-xs text-rose-700">
                    Elimina todas las operaciones, extractos, proveedores y costos de prueba para comenzar a cargar tu información real y verídica.
                  </p>
                </div>
                <button
                  onClick={() => setConfirmClearOpen(true)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition-colors shrink-0"
                >
                  Limpiar Base
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border-2 border-rose-500 bg-rose-50 space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span>¿Confirmas que deseas vaciar toda la información ficticia?</span>
              </div>
              <p className="text-xs text-rose-800">
                Se vaciarán todas las operaciones, extractos de cuentas y gastos. Podrás ingresar tus saldos reales verificados de cada banco/Mercado Pago.
              </p>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-rose-900 bg-white/80 p-2.5 rounded-lg border border-rose-200">
                <input
                  type="checkbox"
                  checked={resetBalancesToZero}
                  onChange={(e) => setResetBalancesToZero(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span>Reiniciar saldos de todas las cuentas a $0 (puedes ajustarlos luego en Cuentas)</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setConfirmClearOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleClearData}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors shadow-xs"
                >
                  Sí, vaciar y empezar de cero
                </button>
              </div>
            </div>
          )}

          {/* Action 2: Import & Sync Real Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => {
                onClose();
                setIsImportModalOpen(true);
              }}
              className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/50 cursor-pointer transition-all space-y-1.5"
            >
              <div className="flex items-center gap-2 text-indigo-900 font-bold">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                <span>Importar Planilla Excel / CSV</span>
              </div>
              <p className="text-[11px] text-indigo-700">
                Carga tus operaciones históricas o futuras masivamente desde un archivo Excel.
              </p>
            </div>

            <div
              onClick={() => {
                onClose();
                setActiveTab('sheets');
              }}
              className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50 cursor-pointer transition-all space-y-1.5"
            >
              <div className="flex items-center gap-2 text-emerald-900 font-bold">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Sincronizar con Google Sheets</span>
              </div>
              <p className="text-[11px] text-emerald-700">
                Conecta tu Google Drive para exportar o importar planillas en vivo con tus socios.
              </p>
            </div>
          </div>

          {/* Action 3: Backup & Restore */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Copias de Seguridad (Backup)
            </h4>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={handleExportJSON}
                className="px-3.5 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-medium flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>Descargar Copia JSON</span>
              </button>

              <label className="px-3.5 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-medium flex items-center gap-1.5 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-purple-600" />
                <span>Restaurar Copia JSON</span>
                <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
              </label>

              <button
                onClick={handleDownloadTemplate}
                className="px-3.5 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-medium flex items-center gap-1.5 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Plantilla Excel</span>
              </button>
            </div>
          </div>

          {/* Action 4: Restore Demo */}
          <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <span>¿Quieres volver a explorar con datos de prueba?</span>
            <button
              onClick={handleRestoreDemo}
              className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restaurar Datos de Demostración</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
