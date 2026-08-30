import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Upload,
  Download,
  Search,
  Plus,
  Eye,
  LogOut,
  Layers,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Lock,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  getCurrentUser
} from '../../services/googleAuth';
import {
  listSpreadsheets,
  getSpreadsheetMetadata,
  readSheetRange,
  exportAllToGoogleSpreadsheet,
  writeSheetValues,
  DriveSpreadsheetFile,
  GoogleSpreadsheetMetadata
} from '../../services/googleSheetsService';
import { User } from 'firebase/auth';
import { formatCurrency } from '../../utils/financialCalculations';
import { Operation, FinancialMovement, BusinessUnit } from '../../types';

export const GoogleSheetsView: React.FC = () => {
  const {
    operations,
    movements,
    suppliers,
    fixedExpenses,
    monthlyProjection,
    batchImportOperations,
    batchImportMovements
  } = useApp();

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Drive spreadsheets
  const [spreadsheets, setSpreadsheets] = useState<DriveSpreadsheetFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [fileSearch, setFileSearch] = useState('');

  // Selected spreadsheet & tab
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [sheetMetadata, setSheetMetadata] = useState<GoogleSpreadsheetMetadata | null>(null);
  const [selectedTabTitle, setSelectedTabTitle] = useState<string>('');
  const [previewRows, setPreviewRows] = useState<any[][]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessInfo, setExportSuccessInfo] = useState<{ id: string; url: string; title: string } | null>(null);
  const [exportTitle, setExportTitle] = useState(`Gestión Financiera Turismo - ${new Date().toISOString().split('T')[0]}`);

  // Import State
  const [importTargetType, setImportTargetType] = useState<'operations' | 'movements'>('operations');
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

  // Sync Confirmation Modal (Mandatory User Confirmation for destructive/mutating operations)
  const [showConfirmSyncModal, setShowConfirmSyncModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Initialize Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setAuthError(null);
        loadUserSpreadsheets();
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        loadUserSpreadsheets();
      }
    } catch (err: any) {
      setAuthError(err.message || 'Error al autenticar con Google');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setSpreadsheets([]);
    setSelectedSheetId(null);
    setSheetMetadata(null);
    setPreviewRows([]);
  };

  const loadUserSpreadsheets = async () => {
    setIsLoadingFiles(true);
    try {
      const files = await listSpreadsheets();
      setSpreadsheets(files);
      if (files.length > 0 && !selectedSheetId) {
        handleSelectSpreadsheet(files[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching spreadsheets:', err);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSelectSpreadsheet = async (sheetId: string) => {
    setSelectedSheetId(sheetId);
    setPreviewRows([]);
    try {
      const meta = await getSpreadsheetMetadata(sheetId);
      setSheetMetadata(meta);
      if (meta.sheets.length > 0) {
        const firstTab = meta.sheets[0].title;
        setSelectedTabTitle(firstTab);
        loadTabPreview(sheetId, firstTab);
      }
    } catch (err: any) {
      console.error('Error reading metadata:', err);
    }
  };

  const loadTabPreview = async (sheetId: string, tabName: string) => {
    setIsLoadingPreview(true);
    try {
      const rows = await readSheetRange(sheetId, `${tabName}!A1:Z30`);
      setPreviewRows(rows);
    } catch (err: any) {
      console.error('Error reading tab rows:', err);
      setPreviewRows([]);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleTabChange = (tabName: string) => {
    setSelectedTabTitle(tabName);
    if (selectedSheetId) {
      loadTabPreview(selectedSheetId, tabName);
    }
  };

  // Full Export to new Google Spreadsheet
  const handleExportFullSystem = async () => {
    if (!token) {
      alert('Debe iniciar sesión con Google para exportar a Google Sheets.');
      return;
    }

    setIsExporting(true);
    setExportSuccessInfo(null);

    try {
      const result = await exportAllToGoogleSpreadsheet(exportTitle, {
        operations,
        movements,
        suppliers,
        fixedExpenses,
        monthlyProjection
      });

      setExportSuccessInfo({
        id: result.spreadsheetId,
        url: result.spreadsheetUrl,
        title: exportTitle
      });

      // Refresh list
      loadUserSpreadsheets();
    } catch (err: any) {
      alert(`Error al exportar a Google Sheets: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Sync to existing sheet (with confirmation dialog)
  const handleExecuteSyncToCurrentSheet = async () => {
    if (!selectedSheetId || !selectedTabTitle) return;

    setIsSyncing(true);
    try {
      if (selectedTabTitle.toLowerCase().includes('operacion') || importTargetType === 'operations') {
        const opHeaders = ['Código', 'Nombre Operación', 'Unidad de Negocio', 'Fecha', 'Estado Operativo', 'Cliente', 'Pasajeros', 'Venta Esperada', 'Costo Esperado', 'Margen', 'Cobrado'];
        const opRows = operations.map(op => [
          op.code,
          op.name,
          op.businessUnit,
          op.date,
          op.status,
          op.clientOrSchool || '-',
          op.passengerCount,
          op.expectedRevenue,
          op.expectedCost,
          op.expectedRevenue - op.expectedCost,
          op.receivedRevenue
        ]);
        await writeSheetValues(selectedSheetId, `${selectedTabTitle}!A1`, [opHeaders, ...opRows]);
      } else {
        const movHeaders = ['ID', 'Fecha', 'Cuenta', 'Tipo', 'Descripción', 'Alias MP', 'Monto', 'Estado', 'Categoría'];
        const movRows = movements.map(m => [
          m.id,
          m.date,
          m.accountId,
          m.type,
          m.description,
          m.rawPayerOrAlias || '',
          m.amount,
          m.matchStatus,
          m.category || ''
        ]);
        await writeSheetValues(selectedSheetId, `${selectedTabTitle}!A1`, [movHeaders, ...movRows]);
      }

      setShowConfirmSyncModal(false);
      alert(`¡Sincronización exitosa! Los datos se han actualizado en la hoja "${selectedTabTitle}".`);
      loadTabPreview(selectedSheetId, selectedTabTitle);
    } catch (err: any) {
      alert(`Error durante la sincronización: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Import from preview rows into the App
  const handleImportPreviewData = () => {
    if (!previewRows || previewRows.length < 2) {
      alert('La hoja seleccionada no contiene suficientes filas para importar.');
      return;
    }

    const headers = previewRows[0].map(h => String(h).toLowerCase().trim());
    const dataRows = previewRows.slice(1);

    if (importTargetType === 'operations') {
      const codeIdx = headers.findIndex(h => h.includes('código') || h.includes('codigo') || h.includes('id'));
      const nameIdx = headers.findIndex(h => h.includes('nombre') || h.includes('operación') || h.includes('operacion') || h.includes('viaje'));
      const unitIdx = headers.findIndex(h => h.includes('unidad') || h.includes('tipo'));
      const dateIdx = headers.findIndex(h => h.includes('fecha'));
      const clientIdx = headers.findIndex(h => h.includes('cliente') || h.includes('colegio'));
      const revIdx = headers.findIndex(h => h.includes('venta') || h.includes('ingreso') || h.includes('total'));
      const paxIdx = headers.findIndex(h => h.includes('pasajeros') || h.includes('pax') || h.includes('alumnos'));

      let importedCount = 0;
      dataRows.forEach((row, i) => {
        if (!row || row.length === 0) return;
        const name = nameIdx >= 0 && row[nameIdx] ? String(row[nameIdx]) : `Operación Importada ${i + 1}`;
        let unit: BusinessUnit = 'receptivo';
        if (unitIdx >= 0 && row[unitIdx]) {
          const uStr = String(row[unitIdx]).toLowerCase();
          if (uStr.includes('salida')) unit = 'salidas';
          else if (uStr.includes('viaje')) unit = 'viajes';
        }

        const date = dateIdx >= 0 && row[dateIdx] ? String(row[dateIdx]) : new Date().toISOString().split('T')[0];
        const client = clientIdx >= 0 && row[clientIdx] ? String(row[clientIdx]) : '';
        const rev = revIdx >= 0 ? parseFloat(String(row[revIdx]).replace(/[^0-9.-]/g, '')) || 0 : 0;
        const pax = paxIdx >= 0 ? parseInt(String(row[paxIdx])) || 0 : 0;

        operations.push({
          id: `op_gsheet_${Date.now()}_${i}`,
          code: codeIdx >= 0 && row[codeIdx] ? String(row[codeIdx]) : `OP-GS-${100 + i}`,
          name,
          businessUnit: unit,
          currency: 'ARS',
          serviceType: 'Importado Google Sheet',
          date,
          status: 'confirmada',
          clientOrSchool: client,
          passengerCount: pax,
          responsiblePerson: 'Admin',
          observations: 'Importado desde Google Sheets',
          expectedRevenue: rev,
          receivedRevenue: 0,
          expectedCost: 0,
          paidCost: 0,
          incomes: [],
          suppliers: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        importedCount++;
      });

      setImportResult({
        success: true,
        message: `Se importaron exitosamente ${importedCount} operaciones desde Google Sheets.`
      });
    } else {
      // Import movements
      const dateIdx = headers.findIndex(h => h.includes('fecha'));
      const descIdx = headers.findIndex(h => h.includes('descrip') || h.includes('detalle') || h.includes('concepto'));
      const amountIdx = headers.findIndex(h => h.includes('monto') || h.includes('importe') || h.includes('valor'));
      const typeIdx = headers.findIndex(h => h.includes('tipo'));
      const aliasIdx = headers.findIndex(h => h.includes('alias') || h.includes('pagador'));

      let importedMovCount = 0;
      dataRows.forEach((row, i) => {
        if (!row || row.length === 0) return;
        const desc = descIdx >= 0 && row[descIdx] ? String(row[descIdx]) : `Movimiento Google Sheet ${i + 1}`;
        const amount = amountIdx >= 0 ? parseFloat(String(row[amountIdx]).replace(/[^0-9.-]/g, '')) || 0 : 0;
        const date = dateIdx >= 0 && row[dateIdx] ? String(row[dateIdx]) : new Date().toISOString().split('T')[0];
        let type: any = 'ingreso';
        if (typeIdx >= 0 && row[typeIdx]) {
          const tStr = String(row[typeIdx]).toLowerCase();
          if (tStr.includes('egreso') || tStr.includes('gasto') || tStr.includes('pago')) type = 'egreso';
        }

        movements.unshift({
          id: `mov_gsheet_${Date.now()}_${i}`,
          date,
          amount: Math.abs(amount),
          type,
          description: desc,
          rawPayerOrAlias: aliasIdx >= 0 && row[aliasIdx] ? String(row[aliasIdx]) : desc,
          accountId: 'mp_gaston',
          matchStatus: 'rojo',
          isInternalTransfer: false,
          category: type === 'ingreso' ? 'Cobro Google Sheet' : 'Gasto Google Sheet',
          importedAt: new Date().toISOString()
        });
        importedMovCount++;
      });

      setImportResult({
        success: true,
        message: `Se importaron ${importedMovCount} movimientos bancarios/MP desde Google Sheets.`
      });
    }
  };

  const filteredSpreadsheets = spreadsheets.filter(s => {
    if (!fileSearch) return true;
    return s.name.toLowerCase().includes(fileSearch.toLowerCase());
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>Integración con Google Sheets & Google Drive</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Sincronización bidireccional: Exporta libros contables completos o importa planillas operativas y extractos de Mercado Pago.
          </p>
        </div>

        {/* Auth Status & Action */}
        <div>
          {user ? (
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-2 pr-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google User'}
                  className="w-8 h-8 rounded-full border border-gray-200"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                  {user.email?.charAt(0).toUpperCase() || 'G'}
                </div>
              )}
              <div className="text-left">
                <div className="text-xs font-bold text-gray-900 leading-tight truncate max-w-[140px]">
                  {user.displayName || user.email}
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Conectado a Google
                </span>
              </div>
              <button
                onClick={handleLogout}
                title="Cerrar sesión de Google"
                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={isAuthenticating}
              className="px-4 py-2 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs flex items-center gap-2.5 shadow-xs transition-all hover:border-gray-400"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>{isAuthenticating ? 'Conectando...' : 'Iniciar Sesión con Google'}</span>
            </button>
          )}
        </div>
      </div>

      {authError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{authError}</span>
        </div>
      )}

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Export Full System to Google Sheets */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card: Export to Google Sheets */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <Download className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-gray-900">Crear Planilla Maestra en Google Drive</h3>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Genera automáticamente una hoja de cálculo estructurada con <strong>6 pestañas sincronizadas</strong> en tu Google Drive:
            </p>

            <div className="space-y-1.5 text-xs text-gray-700 font-medium">
              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-50 border border-gray-200/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>1. Resumen y Proyecciones Mensuales</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-50 border border-gray-200/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>2. Operaciones ({operations.length} registros y márgenes)</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-50 border border-gray-200/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>3. Extractos Bancarios & MP ({movements.length} movimientos)</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-50 border border-gray-200/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>4. Proveedores & Saldos Pendientes ({suppliers.length})</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-50 border border-gray-200/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>5. Gastos Fijos de Estructura ({fixedExpenses.length})</span>
              </div>
              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-50 border border-gray-200/60">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>6. Estudiantes & Pagadores (Nominal de Viajes)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre de la Planilla en Drive:</label>
              <input
                type="text"
                value={exportTitle}
                onChange={(e) => setExportTitle(e.target.value)}
                placeholder="Nombre del archivo..."
                className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-gray-900 font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>

            {user ? (
              <button
                onClick={handleExportFullSystem}
                disabled={isExporting}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creando y cargando pestañas en Google Sheets...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4" />
                    <span>Exportar Todo a Google Sheets</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleSignIn}
                className="w-full py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <Lock className="w-4 h-4 text-gray-500" />
                <span>Conectar Google para Exportar</span>
              </button>
            )}

            {exportSuccessInfo && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>¡Planilla creada con éxito en Google Drive!</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  Archivo: <strong>{exportSuccessInfo.title}</strong>
                </p>
                <a
                  href={exportSuccessInfo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors"
                >
                  <span>Abrir en Google Sheets</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* User Spreadsheets Explorer List */}
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-gray-900">Tus Planillas en Google Drive</h3>
              </div>
              {user && (
                <button
                  onClick={loadUserSpreadsheets}
                  disabled={isLoadingFiles}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  title="Actualizar lista de Drive"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>

            {user ? (
              <>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={fileSearch}
                    onChange={(e) => setFileSearch(e.target.value)}
                    placeholder="Filtrar planillas por nombre..."
                    className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 text-xs">
                  {isLoadingFiles ? (
                    <div className="text-center py-6 text-gray-400 font-sans">
                      <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-indigo-600" />
                      <span>Cargando archivos desde Drive...</span>
                    </div>
                  ) : filteredSpreadsheets.length === 0 ? (
                    <div className="text-center py-6 text-gray-400">
                      No se encontraron hojas de cálculo en tu Google Drive.
                    </div>
                  ) : (
                    filteredSpreadsheets.map((sheet) => (
                      <button
                        key={sheet.id}
                        onClick={() => handleSelectSpreadsheet(sheet.id)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                          selectedSheetId === sheet.id
                            ? 'bg-indigo-50/70 border-indigo-200 shadow-2xs font-semibold'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="truncate text-gray-900 font-medium">{sheet.name}</div>
                          {sheet.modifiedTime && (
                            <span className="text-[10px] text-gray-400 font-mono">
                              Modificado: {new Date(sheet.modifiedTime).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <span className="text-indigo-600 text-xs shrink-0">
                          {selectedSheetId === sheet.id ? 'Seleccionada' : 'Ver'}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="p-6 text-center text-gray-400 text-xs bg-gray-50 rounded-xl border border-dashed border-gray-200">
                Inicia sesión con Google para ver y sincronizar tus planillas de Drive.
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Sheet Viewer, Tab Selector & Import/Sync Actions */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs space-y-4">
            {selectedSheetId && sheetMetadata ? (
              <>
                {/* Active Spreadsheet Details */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-gray-900">{sheetMetadata.title}</h3>
                      <a
                        href={sheetMetadata.spreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-indigo-600 p-1"
                        title="Abrir hoja en Google Sheets"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <p className="text-xs text-gray-500 font-mono">ID: {sheetMetadata.spreadsheetId}</p>
                  </div>

                  {/* Actions: Sync & Import buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowConfirmSyncModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Sincronizar Datos</span>
                    </button>
                  </div>
                </div>

                {/* Tabs Selector */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Pestañas de la Planilla:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {sheetMetadata.sheets.map(tab => (
                      <button
                        key={tab.sheetId}
                        onClick={() => handleTabChange(tab.title)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          selectedTabTitle === tab.title
                            ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tab.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Data Preview Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-gray-400" />
                      <span>Vista previa de datos en "{selectedTabTitle}" ({previewRows.length} filas)</span>
                    </span>

                    {/* Import to App Action */}
                    <div className="flex items-center gap-2">
                      <select
                        value={importTargetType}
                        onChange={(e) => setImportTargetType(e.target.value as any)}
                        className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="operations">Importar a Operaciones</option>
                        <option value="movements">Importar a Extractos/Movimientos</option>
                      </select>

                      <button
                        onClick={handleImportPreviewData}
                        disabled={previewRows.length < 2}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1 shadow-2xs transition-colors disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Importar al Sistema</span>
                      </button>
                    </div>
                  </div>

                  {importResult && (
                    <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      importResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{importResult.message}</span>
                    </div>
                  )}

                  <div className="border border-gray-200 rounded-xl overflow-hidden max-h-96 overflow-x-auto bg-gray-50/50">
                    {isLoadingPreview ? (
                      <div className="text-center py-12 text-gray-400 text-xs">
                        <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-indigo-600" />
                        <span>Leyendo celdas desde Google Sheets...</span>
                      </div>
                    ) : previewRows.length === 0 ? (
                      <div className="text-center py-12 text-gray-400 text-xs">
                        No hay datos o la pestaña seleccionada está vacía.
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200 text-[11px]">
                          <tr>
                            {previewRows[0].map((header, idx) => (
                              <th key={idx} className="py-2.5 px-3 whitespace-nowrap">
                                {String(header || `Columna ${idx + 1}`)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white font-mono text-[11px]">
                          {previewRows.slice(1).map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-gray-50">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="py-2 px-3 whitespace-nowrap text-gray-700">
                                  {String(cell ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16 space-y-3">
                <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto" />
                <h4 className="text-base font-bold text-gray-800">Ninguna Planilla Seleccionada</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Selecciona una planilla del listado de Google Drive o crea una nueva con el botón de exportación total.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Mandatory User Confirmation Modal for Destructive/Mutating Operations */}
      {showConfirmSyncModal && selectedSheetId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center gap-2.5 text-amber-800 font-bold text-base">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Confirmar Sincronización en Google Sheets</span>
            </div>

            <p className="text-gray-600 leading-relaxed">
              ¿Está seguro de que desea sobrescribir el contenido de la pestaña <strong>"{selectedTabTitle}"</strong> en la planilla <strong>"{sheetMetadata?.title}"</strong> con los datos actuales del sistema?
            </p>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] space-y-1">
              <span className="font-semibold block">Acción que se ejecutará con tu permiso:</span>
              <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                <li>Actualizará los valores de celdas en Google Sheets.</li>
                <li>Los datos previos en esa pestaña serán reemplazados por el estado actual.</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowConfirmSyncModal(false)}
                disabled={isSyncing}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteSyncToCurrentSheet}
                disabled={isSyncing}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Sincronizando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirmar y Actualizar Hoja</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
