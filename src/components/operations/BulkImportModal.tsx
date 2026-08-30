import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  FileCheck,
  Compass,
  Users,
  GraduationCap,
  CreditCard,
  Building2,
  HelpCircle,
  Layers,
  ArrowRight,
  RefreshCw,
  Check,
  Info,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  readRawFile,
  autoMatchColumns,
  OPERATION_FIELDS_SCHEMA,
  SUPPLIER_FIELDS_SCHEMA,
  STUDENT_FIELDS_SCHEMA,
  MOVEMENT_FIELDS_SCHEMA,
  FIXED_EXPENSE_FIELDS_SCHEMA,
  FieldDefinition,
  parseOperationsWithMapping,
  parseSuppliersWithMapping,
  parseStudentsWithMapping,
  parseMovementsWithMapping,
  parseFixedExpensesWithMapping,
  generateOperationsTemplate,
  generateSuppliersTemplate,
  generateStudentsTemplate,
  generateMovementsTemplate,
  generateFixedExpensesTemplate,
  ImportPreviewRow,
  SupplierImportPreviewRow,
  StudentImportPreviewRow,
  MovementImportPreviewRow,
  FixedExpenseImportPreviewRow
} from '../../utils/excelParser';
import { formatCurrency } from '../../utils/financialCalculations';
import { BusinessUnit } from '../../types';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ImportCategory = 'operations' | 'suppliers' | 'students' | 'movements' | 'fixed_expenses';

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose }) => {
  const {
    operations,
    suppliers,
    accounts,
    batchImportOperations,
    batchImportSuppliers,
    batchImportStudents,
    batchImportMovements,
    batchImportFixedExpenses,
    importCenterCategory,
    setImportCenterCategory
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<ImportCategory>(importCenterCategory || 'operations');
  const [currentStep, setCurrentStep] = useState<'upload' | 'mapping' | 'preview'>('upload');

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Column Mapping state
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  // Business Unit configuration for operations
  const [buMode, setBuMode] = useState<'from_column' | 'fixed'>('fixed');
  const [fixedBU, setFixedBU] = useState<BusinessUnit>('receptivo');
  const [defaultClient, setDefaultClient] = useState('Cliente General');
  const [defaultResponsible, setDefaultResponsible] = useState('Administración');

  // Preview data state
  const [opPreviews, setOpPreviews] = useState<ImportPreviewRow[]>([]);
  const [supplierPreviews, setSupplierPreviews] = useState<SupplierImportPreviewRow[]>([]);
  const [studentPreviews, setStudentPreviews] = useState<StudentImportPreviewRow[]>([]);
  const [movementPreviews, setMovementPreviews] = useState<MovementImportPreviewRow[]>([]);
  const [fixedExpensePreviews, setFixedExpensePreviews] = useState<FixedExpenseImportPreviewRow[]>([]);

  // Filter preview table
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'warning' | 'error'>('all');

  // Sync category when prop or context changes
  useEffect(() => {
    if (importCenterCategory) {
      setActiveCategory(importCenterCategory);
    }
  }, [importCenterCategory]);

  if (!isOpen) return null;

  // Active Schema based on Category
  const activeSchema: FieldDefinition[] = useMemo(() => {
    switch (activeCategory) {
      case 'operations':
        return OPERATION_FIELDS_SCHEMA;
      case 'suppliers':
        return SUPPLIER_FIELDS_SCHEMA;
      case 'students':
        return STUDENT_FIELDS_SCHEMA;
      case 'movements':
        return MOVEMENT_FIELDS_SCHEMA;
      case 'fixed_expenses':
        return FIXED_EXPENSE_FIELDS_SCHEMA;
      default:
        return OPERATION_FIELDS_SCHEMA;
    }
  }, [activeCategory]);

  const handleCategoryChange = (cat: ImportCategory) => {
    setActiveCategory(cat);
    setImportCenterCategory(cat);
    // Reset file and steps
    setFile(null);
    setRawHeaders([]);
    setRawRows([]);
    setColumnMapping({});
    setCurrentStep('upload');
  };

  // Download template for active category
  const handleDownloadTemplate = () => {
    let buffer: Uint8Array;
    let filename = '';

    switch (activeCategory) {
      case 'operations':
        buffer = generateOperationsTemplate();
        filename = 'Plantilla_Operaciones_Viajes.xlsx';
        break;
      case 'suppliers':
        buffer = generateSuppliersTemplate();
        filename = 'Plantilla_Proveedores.xlsx';
        break;
      case 'students':
        buffer = generateStudentsTemplate();
        filename = 'Plantilla_Pasajeros_Cuotas.xlsx';
        break;
      case 'movements':
        buffer = generateMovementsTemplate();
        filename = 'Plantilla_Extractos_Bancarios.xlsx';
        break;
      case 'fixed_expenses':
        buffer = generateFixedExpensesTemplate();
        filename = 'Plantilla_Gastos_Fijos.xlsx';
        break;
    }

    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Process File Upload
  const handleFileUpload = async (selectedFile: File) => {
    setFile(selectedFile);
    setLoading(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const result = readRawFile(buffer);

      setRawHeaders(result.headers);
      setRawRows(result.rawRows);
      setSheetNames(result.sheetNames);
      setActiveSheet(result.activeSheet);

      // Auto-match columns against active schema
      const autoMap = autoMatchColumns(result.headers, activeSchema);
      setColumnMapping(autoMap);

      // If businessUnit column detected, switch buMode to 'from_column'
      if (activeCategory === 'operations' && autoMap.businessUnit) {
        setBuMode('from_column');
      }

      setCurrentStep('mapping');
    } catch (err: any) {
      alert(`Error al abrir el archivo: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleFileUpload(selectedFile);
  };

  // Generate preview from current mapping
  const handleGeneratePreview = () => {
    if (rawRows.length === 0) return;

    if (activeCategory === 'operations') {
      const parsed = parseOperationsWithMapping(
        rawRows,
        columnMapping,
        {
          businessUnitMode: buMode,
          fixedBusinessUnit: fixedBU,
          defaultClient,
          defaultResponsible
        },
        operations
      );
      setOpPreviews(parsed);
    } else if (activeCategory === 'suppliers') {
      const parsed = parseSuppliersWithMapping(rawRows, columnMapping, suppliers);
      setSupplierPreviews(parsed);
    } else if (activeCategory === 'students') {
      const parsed = parseStudentsWithMapping(rawRows, columnMapping, operations);
      setStudentPreviews(parsed);
    } else if (activeCategory === 'movements') {
      const parsed = parseMovementsWithMapping(rawRows, columnMapping, accounts);
      setMovementPreviews(parsed);
    } else if (activeCategory === 'fixed_expenses') {
      const parsed = parseFixedExpensesWithMapping(rawRows, columnMapping, accounts);
      setFixedExpensePreviews(parsed);
    }

    setCurrentStep('preview');
  };

  // Confirm and Commit Import
  const handleCommitImport = () => {
    if (activeCategory === 'operations') {
      const valid = opPreviews.filter(r => r.status !== 'error' && r.status !== 'duplicate_in_file');
      if (valid.length === 0) {
        alert('No hay operaciones válidas para importar.');
        return;
      }
      const { created, updated } = batchImportOperations(valid);
      alert(`Importación completada:\n• ${created} nuevas operaciones creadas\n• ${updated} operaciones existentes actualizadas.`);
      onClose();
    } else if (activeCategory === 'suppliers') {
      const valid = supplierPreviews.filter(r => r.status !== 'error');
      if (valid.length === 0) {
        alert('No hay proveedores válidos para importar.');
        return;
      }
      const { created, updated } = batchImportSuppliers(
        valid.map(s => ({
          name: s.name,
          category: s.category,
          mpAlias: s.mpAlias,
          cbu: s.cbu,
          contactName: s.contactName,
          phone: s.phone,
          email: s.email,
          serviceDescription: s.serviceDescription,
          active: true
        }))
      );
      alert(`Proveedores importados:\n• ${created} proveedores nuevos agregados\n• ${updated} proveedores actualizados.`);
      onClose();
    } else if (activeCategory === 'students') {
      const valid = studentPreviews.filter(r => r.status !== 'error');
      if (valid.length === 0) {
        alert('No hay pasajeros válidos para importar.');
        return;
      }
      const { created } = batchImportStudents(valid);
      alert(`Pasajeros importados:\n• ${created} registros vinculados a operaciones exitosamente.`);
      onClose();
    } else if (activeCategory === 'movements') {
      const valid = movementPreviews.filter(r => r.status !== 'error');
      if (valid.length === 0) {
        alert('No hay movimientos válidos para importar.');
        return;
      }
      const count = batchImportMovements(
        valid.map(m => ({
          date: m.date,
          amount: m.amount,
          type: m.type,
          description: m.description,
          rawPayerOrAlias: m.rawPayerOrAlias,
          accountId: m.matchedAccountId,
          category: m.category
        }))
      );
      alert(`Extractos importados:\n• ${count} movimientos financieros registrados y listos para conciliar.`);
      onClose();
    } else if (activeCategory === 'fixed_expenses') {
      const valid = fixedExpensePreviews.filter(r => r.status !== 'error');
      if (valid.length === 0) {
        alert('No hay gastos fijos válidos para importar.');
        return;
      }
      const { created } = batchImportFixedExpenses(
        valid.map(f => ({
          provider: f.provider,
          category: f.category,
          amount: f.amount,
          currency: 'ARS',
          frequency: 'mensual',
          dueDay: f.dueDay,
          paidFromAccountId: f.paidFromAccountId,
          description: f.description,
          status: 'activo'
        }))
      );
      alert(`Gastos Fijos importados:\n• ${created} conceptos mensuales añadidos a la estructura operativa.`);
      onClose();
    }
  };

  // Compute stats for current preview
  const previewStats = useMemo(() => {
    let total = 0;
    let valid = 0;
    let warning = 0;
    let errors = 0;
    let updates = 0;

    if (activeCategory === 'operations') {
      total = opPreviews.length;
      opPreviews.forEach(r => {
        if (r.status === 'error' || r.status === 'duplicate_in_file') errors++;
        else if (r.status === 'update') { updates++; valid++; }
        else if (r.status === 'warning') { warning++; valid++; }
        else valid++;
      });
    } else if (activeCategory === 'suppliers') {
      total = supplierPreviews.length;
      supplierPreviews.forEach(r => {
        if (r.status === 'error') errors++;
        else if (r.status === 'update') { updates++; valid++; }
        else valid++;
      });
    } else if (activeCategory === 'students') {
      total = studentPreviews.length;
      studentPreviews.forEach(r => {
        if (r.status === 'error') errors++;
        else if (r.status === 'warning') { warning++; valid++; }
        else valid++;
      });
    } else if (activeCategory === 'movements') {
      total = movementPreviews.length;
      movementPreviews.forEach(r => {
        if (r.status === 'error') errors++;
        else valid++;
      });
    } else if (activeCategory === 'fixed_expenses') {
      total = fixedExpensePreviews.length;
      fixedExpensePreviews.forEach(r => {
        if (r.status === 'error') errors++;
        else valid++;
      });
    }

    return { total, valid, warning, errors, updates };
  }, [activeCategory, opPreviews, supplierPreviews, studentPreviews, movementPreviews, fixedExpensePreviews]);

  // Detected missing required and optional fields
  const missingSummary = useMemo(() => {
    const missingRequired: string[] = [];
    const missingOptional: string[] = [];

    activeSchema.forEach(field => {
      const mappedCol = columnMapping[field.key];
      if (!mappedCol) {
        if (field.required && field.key !== 'businessUnit') {
          missingRequired.push(field.label);
        } else if (field.key !== 'businessUnit') {
          missingOptional.push(field.label);
        }
      }
    });

    return { missingRequired, missingOptional };
  }, [activeSchema, columnMapping]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-xs">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50/90 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Centro de Importación & Plantillas Especializadas</h2>
              <p className="text-xs text-gray-500">
                Carga flexible de datos con mapeo inteligente de columnas y detección de campos faltantes
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

        {/* Category Navigation Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-2.5 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">Módulo:</span>
          
          <button
            onClick={() => handleCategoryChange('operations')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeCategory === 'operations'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Operaciones & Viajes</span>
          </button>

          <button
            onClick={() => handleCategoryChange('suppliers')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeCategory === 'suppliers'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Proveedores & Prestadores</span>
          </button>

          <button
            onClick={() => handleCategoryChange('students')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeCategory === 'students'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Pasajeros & Cuotas</span>
          </button>

          <button
            onClick={() => handleCategoryChange('movements')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeCategory === 'movements'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Extractos Bancarios / MP</span>
          </button>

          <button
            onClick={() => handleCategoryChange('fixed_expenses')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 whitespace-nowrap transition-all ${
              activeCategory === 'fixed_expenses'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Gastos Fijos</span>
          </button>
        </div>

        {/* Steps Breadcrumbs Indicator */}
        <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-2 flex items-center justify-between text-[11px] text-gray-500">
          <div className="flex items-center gap-3">
            <span className={`font-semibold flex items-center gap-1 ${currentStep === 'upload' ? 'text-indigo-600' : 'text-gray-400'}`}>
              <span className="w-4 h-4 rounded-full bg-current text-white flex items-center justify-center text-[9px] font-bold">1</span>
              <span>Cargar Archivo Excel / CSV</span>
            </span>
            <ArrowRight className="w-3 h-3 text-gray-300" />
            <span className={`font-semibold flex items-center gap-1 ${currentStep === 'mapping' ? 'text-indigo-600' : 'text-gray-400'}`}>
              <span className="w-4 h-4 rounded-full bg-current text-white flex items-center justify-center text-[9px] font-bold">2</span>
              <span>Mapeo de Columnas & Unidad</span>
            </span>
            <ArrowRight className="w-3 h-3 text-gray-300" />
            <span className={`font-semibold flex items-center gap-1 ${currentStep === 'preview' ? 'text-indigo-600' : 'text-gray-400'}`}>
              <span className="w-4 h-4 rounded-full bg-current text-white flex items-center justify-center text-[9px] font-bold">3</span>
              <span>Validación & Confirmación</span>
            </span>
          </div>

          {file && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">
                {file.name} ({rawRows.length} filas)
              </span>
              <button
                onClick={() => { setFile(null); setCurrentStep('upload'); }}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Cambiar archivo
              </button>
            </div>
          )}
        </div>

        {/* Main Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* STEP 1: UPLOAD */}
          {currentStep === 'upload' && (
            <div className="space-y-5">
              
              {/* Category-Specific Template Banner */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm">
                      Plantilla Oficial para {
                        activeCategory === 'operations' ? 'Operaciones y Viajes' :
                        activeCategory === 'suppliers' ? 'Padrón de Proveedores' :
                        activeCategory === 'students' ? 'Pasajeros y Cobranza de Cuotas' :
                        activeCategory === 'movements' ? 'Extractos Bancarios y Mercado Pago' :
                        'Gastos Fijos de Estructura'
                      }
                    </h3>
                    <p className="text-gray-600 text-[11px] mt-0.5">
                      Descarga el archivo Excel con las columnas exactas, tipos de datos y filas de ejemplo para este módulo.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleDownloadTemplate}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs whitespace-nowrap shadow-xs flex items-center gap-2 transition-all shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Plantilla Excel (.xlsx)</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-gray-200 hover:border-indigo-400 rounded-2xl p-10 text-center transition-colors bg-gray-50/50">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="font-bold text-gray-900 text-sm mb-1">
                  Arrastra tu archivo aquí o haz click para seleccionarlo
                </h3>
                <p className="text-gray-500 text-xs mb-4">
                  Soporta archivos Excel (.xlsx, .xls) y CSV. No te preocupes si los nombres de columnas son ligeramente distintos: podrás mapearlos en el siguiente paso.
                </p>

                <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-xs transition-colors">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Seleccionar Archivo</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Information Note */}
              <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-xl flex items-start gap-2.5 text-amber-900 text-[11px]">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block">Flexibilidad total en la estructura de tu archivo:</strong>
                  <span>
                    El sistema detectará automáticamente las columnas parecidas (ej. "Destino" como nombre, "Pax" como pasajeros, "Venta" como ingreso). Además, <strong>nunca se asume la Unidad de Negocio</strong> sin tu confirmación explícita.
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* STEP 2: COLUMN MAPPING & MISSING FIELDS */}
          {currentStep === 'mapping' && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* Business Unit Selector for Operations */}
              {activeCategory === 'operations' && (
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-indigo-700" />
                      <h3 className="font-bold text-indigo-950 text-xs uppercase tracking-wider">
                        Control de Unidad de Negocio
                      </h3>
                    </div>
                    <span className="text-[11px] text-indigo-800 font-medium">
                      El sistema NO asume la unidad automáticamente
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <label className={`p-3 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-all ${
                      buMode === 'fixed' ? 'bg-white border-indigo-500 shadow-2xs' : 'bg-indigo-50/50 border-indigo-200'
                    }`}>
                      <input
                        type="radio"
                        name="buMode"
                        checked={buMode === 'fixed'}
                        onChange={() => setBuMode('fixed')}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="space-y-1.5 flex-1">
                        <span className="font-semibold text-gray-900 block">Asignar Unidad Global a todo el archivo:</span>
                        <select
                          value={fixedBU}
                          onChange={(e) => setFixedBU(e.target.value as BusinessUnit)}
                          disabled={buMode !== 'fixed'}
                          className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value="receptivo">Turismo Receptivo</option>
                          <option value="salidas">Salidas Educativas</option>
                          <option value="viajes">Viajes Educativos</option>
                        </select>
                      </div>
                    </label>

                    <label className={`p-3 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-all ${
                      buMode === 'from_column' ? 'bg-white border-indigo-500 shadow-2xs' : 'bg-indigo-50/50 border-indigo-200'
                    }`}>
                      <input
                        type="radio"
                        name="buMode"
                        checked={buMode === 'from_column'}
                        onChange={() => setBuMode('from_column')}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="space-y-1.5 flex-1">
                        <span className="font-semibold text-gray-900 block">Leer Unidad desde una columna del archivo:</span>
                        <select
                          value={columnMapping.businessUnit || ''}
                          onChange={(e) => setColumnMapping(prev => ({ ...prev, businessUnit: e.target.value }))}
                          disabled={buMode !== 'from_column'}
                          className="w-full bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        >
                          <option value="">-- Seleccionar columna de Unidad --</option>
                          {rawHeaders.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Missing Fields Warning Alert */}
              {(missingSummary.missingRequired.length > 0 || missingSummary.missingOptional.length > 0) && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Detección de Columnas y Campos Faltantes</span>
                  </div>
                  <p className="text-amber-800 text-[11px]">
                    Tu archivo no incluye algunas columnas estándar. No te preocupes: puedes mapear columnas existentes o el sistema completará los faltantes con valores por defecto inteligentes sin trabar la importación.
                  </p>
                  {missingSummary.missingRequired.length > 0 && (
                    <div className="text-[11px] text-rose-700 font-medium">
                      ⚠️ Campos obligatorios sin mapear: {missingSummary.missingRequired.join(', ')}. Por favor asigna una columna en la tabla abajo.
                    </div>
                  )}
                </div>
              )}

              {/* Mapping Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Mapeo de Campos del Sistema vs. Columnas de tu Archivo</span>
                  </h3>
                  <span className="text-gray-500 text-[11px]">
                    Columnas detectadas en tu archivo: <strong className="text-gray-800 font-mono">{rawHeaders.length}</strong>
                  </span>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200 uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-4 w-1/3">Campo del Sistema</th>
                        <th className="py-2.5 px-4 w-1/3">Columna en tu Archivo</th>
                        <th className="py-2.5 px-4 w-1/3">Comportamiento / Valor por Defecto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {activeSchema.map((field) => {
                        const isMapped = !!columnMapping[field.key];
                        if (field.key === 'businessUnit' && buMode === 'fixed') {
                          return null; // Handled in top card
                        }

                        return (
                          <tr key={field.key} className={field.required && !isMapped ? 'bg-rose-50/50' : 'hover:bg-gray-50/70'}>
                            <td className="py-2.5 px-4 font-medium text-gray-900">
                              <div className="flex items-center gap-1.5">
                                <span>{field.label}</span>
                                {field.required && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-semibold">
                                    Obligatorio
                                  </span>
                                )}
                              </div>
                              {field.description && (
                                <p className="text-[10px] text-gray-400 font-normal">{field.description}</p>
                              )}
                            </td>

                            <td className="py-2.5 px-4">
                              <select
                                value={columnMapping[field.key] || ''}
                                onChange={(e) => setColumnMapping(prev => ({ ...prev, [field.key]: e.target.value }))}
                                className={`w-full border rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none ${
                                  isMapped
                                    ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900'
                                    : field.required
                                    ? 'bg-white border-rose-300 text-rose-800'
                                    : 'bg-white border-gray-200 text-gray-500'
                                }`}
                              >
                                <option value="">-- No mapear / Usar valor por defecto --</option>
                                {rawHeaders.map(h => (
                                  <option key={h} value={h}>{h}</option>
                                ))}
                              </select>
                            </td>

                            <td className="py-2.5 px-4 text-gray-500 text-[11px]">
                              {isMapped ? (
                                <span className="text-emerald-700 flex items-center gap-1 font-medium">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Mapeado desde columna "{columnMapping[field.key]}"</span>
                                </span>
                              ) : (
                                <span className="text-gray-400 italic">
                                  {field.defaultValue !== undefined
                                    ? `Se asignará "${field.defaultValue}"`
                                    : field.type === 'date'
                                    ? 'Se asignará fecha actual'
                                    : 'Se dejará vacío'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* STEP 3: PREVIEW & VALIDATION */}
          {currentStep === 'preview' && (
            <div className="space-y-4 animate-in fade-in">
              
              {/* Summary Badges Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-gray-700 mr-1">
                    Resumen del Procesamiento:
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-700 font-mono font-medium">
                    Total: {previewStats.total}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{previewStats.valid} Listos</span>
                  </span>
                  {previewStats.updates > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-mono font-medium flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 text-amber-600" />
                      <span>{previewStats.updates} Actualizaciones</span>
                    </span>
                  )}
                  {previewStats.errors > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 font-mono font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      <span>{previewStats.errors} Errores</span>
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setCurrentStep('mapping')}
                  className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-xs font-medium"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ajustar Mapeo de Columnas</span>
                </button>
              </div>

              {/* Preview Table for Operations */}
              {activeCategory === 'operations' && (
                <div className="overflow-x-auto rounded-xl border border-gray-200 max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 text-[10px] sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Fila</th>
                        <th className="py-2 px-3">Código</th>
                        <th className="py-2 px-3">Operación / Viaje</th>
                        <th className="py-2 px-3">Unidad</th>
                        <th className="py-2 px-3">Cliente / Colegio</th>
                        <th className="py-2 px-3">Fecha</th>
                        <th className="py-2 px-3 text-right">Ingreso Esp.</th>
                        <th className="py-2 px-3 text-right">Costo Esp.</th>
                        <th className="py-2 px-3 text-center">Acción</th>
                        <th className="py-2 px-3">Detalle / Validación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono">
                      {opPreviews.map((row, idx) => {
                        const hasErr = row.status === 'error' || row.status === 'duplicate_in_file';

                        return (
                          <tr key={idx} className={hasErr ? 'bg-rose-50/40' : 'hover:bg-gray-50/60'}>
                            <td className="py-2 px-3 text-gray-400">{row.rowNumber}</td>
                            <td className="py-2 px-3 text-indigo-700 font-bold">{row.code}</td>
                            <td className="py-2 px-3 font-sans text-gray-900 font-medium">{row.name}</td>
                            <td className="py-2 px-3 font-sans text-gray-600 capitalize">
                              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800 text-[10px]">
                                {row.businessUnit}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-sans text-gray-600">{row.clientOrSchool}</td>
                            <td className="py-2 px-3 text-gray-600">{row.date}</td>
                            <td className="py-2 px-3 text-right text-emerald-700">{formatCurrency(row.expectedRevenue)}</td>
                            <td className="py-2 px-3 text-right text-rose-700">{formatCurrency(row.expectedCost)}</td>
                            <td className="py-2 px-3 text-center font-sans">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                row.status === 'update'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : row.status === 'new'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : row.status === 'warning'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}>
                                {row.status === 'update' ? 'Actualizar' : row.status === 'new' ? 'Nueva' : row.status === 'warning' ? 'Con defaults' : 'Error'}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-sans">
                              {hasErr ? (
                                <span className="text-rose-600 flex items-center gap-1 text-[11px]">
                                  <AlertTriangle className="w-3 h-3 shrink-0" />
                                  <span>{row.errorMessage}</span>
                                </span>
                              ) : row.missingFields && row.missingFields.length > 0 ? (
                                <span className="text-blue-700 text-[10px]" title={row.missingFields.join(', ')}>
                                  Faltantes: {row.missingFields.slice(0, 2).join(', ')}...
                                </span>
                              ) : (
                                <span className="text-emerald-700 flex items-center gap-1 text-[11px]">
                                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                                  <span>OK</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Preview Table for Suppliers */}
              {activeCategory === 'suppliers' && (
                <div className="overflow-x-auto rounded-xl border border-gray-200 max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 text-[10px] sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Fila</th>
                        <th className="py-2 px-3">Proveedor</th>
                        <th className="py-2 px-3">Rubro</th>
                        <th className="py-2 px-3">Alias MP</th>
                        <th className="py-2 px-3">CBU</th>
                        <th className="py-2 px-3">Contacto / Tel</th>
                        <th className="py-2 px-3 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono">
                      {supplierPreviews.map((s, idx) => (
                        <tr key={idx} className={s.status === 'error' ? 'bg-rose-50' : 'hover:bg-gray-50'}>
                          <td className="py-2 px-3 text-gray-400">{s.rowNumber}</td>
                          <td className="py-2 px-3 font-sans font-bold text-gray-900">{s.name}</td>
                          <td className="py-2 px-3 font-sans text-gray-600">{s.category}</td>
                          <td className="py-2 px-3 text-indigo-700">{s.mpAlias || '-'}</td>
                          <td className="py-2 px-3 text-gray-500">{s.cbu || '-'}</td>
                          <td className="py-2 px-3 font-sans text-gray-600">{s.contactName} {s.phone ? `(${s.phone})` : ''}</td>
                          <td className="py-2 px-3 text-center font-sans">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              s.status === 'update'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : s.status === 'new'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {s.status === 'update' ? 'Actualizar' : s.status === 'new' ? 'Nuevo' : 'Error'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Preview Table for Students */}
              {activeCategory === 'students' && (
                <div className="overflow-x-auto rounded-xl border border-gray-200 max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 text-[10px] sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Fila</th>
                        <th className="py-2 px-3">Viaje / Operación</th>
                        <th className="py-2 px-3">Pasajero / Alumno</th>
                        <th className="py-2 px-3">Pagador / Tutor</th>
                        <th className="py-2 px-3 text-right">Monto Total</th>
                        <th className="py-2 px-3 text-right">Ya Pagado</th>
                        <th className="py-2 px-3 text-center">Estado Vinculación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono">
                      {studentPreviews.map((st, idx) => (
                        <tr key={idx} className={st.status === 'error' ? 'bg-rose-50' : 'hover:bg-gray-50'}>
                          <td className="py-2 px-3 text-gray-400">{st.rowNumber}</td>
                          <td className="py-2 px-3 text-indigo-700 font-bold">{st.operationCodeOrName}</td>
                          <td className="py-2 px-3 font-sans text-gray-900 font-medium">{st.studentName}</td>
                          <td className="py-2 px-3 font-sans text-gray-600">{st.payerName}</td>
                          <td className="py-2 px-3 text-right text-gray-900">{formatCurrency(st.expectedAmount)}</td>
                          <td className="py-2 px-3 text-right text-emerald-700">{formatCurrency(st.paidAmount)}</td>
                          <td className="py-2 px-3 text-center font-sans">
                            {st.matchedOperation ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                                Vinculado a {st.matchedOperation.code}
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium" title={st.errorMessage}>
                                Viaje pendiente de vincular
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Preview Table for Movements */}
              {activeCategory === 'movements' && (
                <div className="overflow-x-auto rounded-xl border border-gray-200 max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 text-[10px] sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Fila</th>
                        <th className="py-2 px-3">Fecha</th>
                        <th className="py-2 px-3">Tipo</th>
                        <th className="py-2 px-3">Descripción</th>
                        <th className="py-2 px-3">Pagador / Alias</th>
                        <th className="py-2 px-3">Cuenta Destino</th>
                        <th className="py-2 px-3 text-right">Importe</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono">
                      {movementPreviews.map((m, idx) => (
                        <tr key={idx} className={m.status === 'error' ? 'bg-rose-50' : 'hover:bg-gray-50'}>
                          <td className="py-2 px-3 text-gray-400">{m.rowNumber}</td>
                          <td className="py-2 px-3 text-gray-600">{m.date}</td>
                          <td className="py-2 px-3 font-sans">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              m.type === 'ingreso' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {m.type === 'ingreso' ? '+ Ingreso' : '- Egreso'}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-sans text-gray-900">{m.description}</td>
                          <td className="py-2 px-3 text-indigo-700">{m.rawPayerOrAlias || '-'}</td>
                          <td className="py-2 px-3 font-sans text-gray-600">{m.accountNameOrId}</td>
                          <td className="py-2 px-3 text-right font-bold text-gray-900">{formatCurrency(m.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Preview Table for Fixed Expenses */}
              {activeCategory === 'fixed_expenses' && (
                <div className="overflow-x-auto rounded-xl border border-gray-200 max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 text-[10px] sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Fila</th>
                        <th className="py-2 px-3">Concepto / Proveedor</th>
                        <th className="py-2 px-3">Rubro</th>
                        <th className="py-2 px-3 text-center">Día de Pago</th>
                        <th className="py-2 px-3 text-right">Monto Mensual</th>
                        <th className="py-2 px-3">Detalle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono">
                      {fixedExpensePreviews.map((f, idx) => (
                        <tr key={idx} className={f.status === 'error' ? 'bg-rose-50' : 'hover:bg-gray-50'}>
                          <td className="py-2 px-3 text-gray-400">{f.rowNumber}</td>
                          <td className="py-2 px-3 font-sans font-bold text-gray-900">{f.provider}</td>
                          <td className="py-2 px-3 font-sans text-gray-600 capitalize">{f.category}</td>
                          <td className="py-2 px-3 text-center text-indigo-700 font-bold">Día {f.dueDay}</td>
                          <td className="py-2 px-3 text-right text-rose-700 font-bold">{formatCurrency(f.amount)}</td>
                          <td className="py-2 px-3 font-sans text-gray-500">{f.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between">
          <div className="text-gray-500 text-xs">
            {currentStep === 'mapping' && (
              <span>Revisa el mapeo de columnas y haz click en <strong>Generar Vista Previa</strong> para validar los registros.</span>
            )}
            {currentStep === 'preview' && (
              <span>Se procesarán <strong className="text-gray-900">{previewStats.valid}</strong> registros en la base de datos.</span>
            )}
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium text-xs transition-colors"
            >
              Cancelar
            </button>

            {currentStep === 'mapping' && (
              <button
                onClick={handleGeneratePreview}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <span>Generar Vista Previa</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {currentStep === 'preview' && (
              <button
                onClick={handleCommitImport}
                disabled={previewStats.valid === 0}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <FileCheck className="w-4 h-4" />
                <span>Confirmar e Importar ({previewStats.valid})</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
