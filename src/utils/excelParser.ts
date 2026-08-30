import * as XLSX from 'xlsx';
import {
  Operation,
  BusinessUnit,
  OperationStatus,
  Supplier,
  FixedExpense,
  FinancialMovement,
  FinancialAccount,
  AccountId
} from '../types';

export interface FieldDefinition {
  key: string;
  label: string;
  required: boolean;
  type: 'string' | 'number' | 'date' | 'select' | 'business_unit';
  description?: string;
  defaultValue?: any;
  options?: { value: string; label: string }[];
  synonyms: string[];
}

export interface RawFileResult {
  sheetNames: string[];
  activeSheet: string;
  headers: string[];
  rawRows: Record<string, any>[];
}

// ----------------------------------------------------
// Schemas for Column Mapping
// ----------------------------------------------------
export const OPERATION_FIELDS_SCHEMA: FieldDefinition[] = [
  {
    key: 'name',
    label: 'Nombre de la Operación / Destino',
    required: true,
    type: 'string',
    description: 'Nombre del viaje o servicio (ej: Egresados Córdoba, City Tour)',
    synonyms: ['nombre', 'operacion', 'operación', 'servicio', 'destino', 'viaje', 'nombre viaje', 'descripcion', 'concepto', 'paquete', 'itinerario', 'tour', 'name']
  },
  {
    key: 'businessUnit',
    label: 'Unidad de Negocio',
    required: false, // Can be provided via global dropdown
    type: 'business_unit',
    description: 'Turismo Receptivo, Salidas Educativas o Viajes Educativos',
    options: [
      { value: 'receptivo', label: 'Turismo Receptivo' },
      { value: 'salidas', label: 'Salidas Educativas' },
      { value: 'viajes', label: 'Viajes Educativos' }
    ],
    synonyms: ['unidad', 'unidad de negocio', 'unidad negocio', 'bu', 'business unit', 'tipo de negocio', 'tipo viaje', 'categoria', 'rubro']
  },
  {
    key: 'code',
    label: 'Código de Operación / ID',
    required: false,
    type: 'string',
    description: 'Identificador único (ej: OP-2026-084). Si no existe, se autogenera.',
    synonyms: ['codigo', 'código', 'id', 'code', 'identificador', 'nro operacion', 'nro viaje', 'legajo', 'num']
  },
  {
    key: 'clientOrSchool',
    label: 'Cliente / Colegio / Agencia',
    required: false,
    type: 'string',
    defaultValue: 'Cliente General',
    synonyms: ['cliente', 'colegio', 'escuela', 'institucion', 'institución', 'agencia', 'empresa', 'solicitante', 'contratante', 'client', 'school']
  },
  {
    key: 'date',
    label: 'Fecha de Realización / Inicio',
    required: false,
    type: 'date',
    synonyms: ['fecha', 'fecha inicio', 'fecha viaje', 'salida', 'fecha salida', 'inicio', 'date', 'start date']
  },
  {
    key: 'endDate',
    label: 'Fecha de Regreso / Fin',
    required: false,
    type: 'date',
    synonyms: ['fecha fin', 'fecha regreso', 'fin', 'regreso', 'llegada', 'end date']
  },
  {
    key: 'passengerCount',
    label: 'Cantidad de Pasajeros (Pax / Alumnos)',
    required: false,
    type: 'number',
    defaultValue: 1,
    synonyms: ['pasajeros', 'pax', 'alumnos', 'cantidad', 'cant pax', 'cant pasajeros', 'personas', 'cupo', 'asientos', 'passengers']
  },
  {
    key: 'serviceType',
    label: 'Tipo / Modalidad de Servicio',
    required: false,
    type: 'string',
    defaultValue: 'Servicio Turístico',
    synonyms: ['tipo de servicio', 'tipo servicio', 'subtipo', 'modalidad', 'servicio', 'tipo']
  },
  {
    key: 'expectedRevenue',
    label: 'Ingreso Total Presupuestado / Venta ($)',
    required: false,
    type: 'number',
    defaultValue: 0,
    synonyms: ['ingreso esperado', 'ingreso total', 'venta total', 'total venta', 'precio total', 'total cobrar', 'facturacion', 'monto total', 'presupuesto venta', 'revenue', 'total price']
  },
  {
    key: 'receivedRevenue',
    label: 'Ingreso Ya Cobrado ($)',
    required: false,
    type: 'number',
    defaultValue: 0,
    synonyms: ['ingreso cobrado', 'cobrado', 'total cobrado', 'pagado cliente', 'ingresos reales', 'senia cobrada', 'cobranza', 'received']
  },
  {
    key: 'expectedCost',
    label: 'Costo Total de Proveedores Presupuestado ($)',
    required: false,
    type: 'number',
    defaultValue: 0,
    synonyms: ['costo esperado', 'costo total', 'costos previstos', 'presupuesto costos', 'costo proveedores', 'costo presupuestado', 'gastos previstos', 'cost', 'expected cost']
  },
  {
    key: 'paidCost',
    label: 'Costo Ya Pagado a Proveedores ($)',
    required: false,
    type: 'number',
    defaultValue: 0,
    synonyms: ['costo pagado', 'pagado proveedores', 'anticipos pagados', 'costos abonados', 'pagado', 'egresos reales', 'paid cost']
  },
  {
    key: 'responsiblePerson',
    label: 'Responsable / Coordinador',
    required: false,
    type: 'string',
    defaultValue: 'Administración',
    synonyms: ['responsable', 'coordinador', 'vendedor', 'encargado', 'guia principal', 'organizador', 'responsible']
  },
  {
    key: 'status',
    label: 'Estado de la Operación',
    required: false,
    type: 'select',
    defaultValue: 'confirmada',
    options: [
      { value: 'confirmada', label: 'Confirmada' },
      { value: 'en_curso', label: 'En Curso' },
      { value: 'realizada', label: 'Realizada' },
      { value: 'presupuesto', label: 'Presupuesto' },
      { value: 'cancelada', label: 'Cancelada' }
    ],
    synonyms: ['estado', 'status', 'situacion', 'etapa']
  },
  {
    key: 'observations',
    label: 'Observaciones / Notas',
    required: false,
    type: 'string',
    defaultValue: '',
    synonyms: ['observaciones', 'notas', 'comentarios', 'detalle', 'descripcion adicional', 'notes', 'comments']
  }
];

export const SUPPLIER_FIELDS_SCHEMA: FieldDefinition[] = [
  {
    key: 'name',
    label: 'Razón Social / Proveedor',
    required: true,
    type: 'string',
    synonyms: ['proveedor', 'nombre', 'razon social', 'razón social', 'prestador', 'empresa', 'supplier', 'nombre proveedor']
  },
  {
    key: 'category',
    label: 'Rubro / Categoría de Servicio',
    required: false,
    type: 'string',
    defaultValue: 'Otros',
    synonyms: ['rubro', 'categoria', 'categoría', 'tipo', 'servicio', 'sector', 'category']
  },
  {
    key: 'mpAlias',
    label: 'Alias Mercado Pago / CVU',
    required: false,
    type: 'string',
    synonyms: ['alias', 'alias mp', 'alias mercadopago', 'cvu', 'alias mercado pago', 'alias transferencia']
  },
  {
    key: 'cbu',
    label: 'CBU / Cuenta Bancaria',
    required: false,
    type: 'string',
    synonyms: ['cbu', 'cuenta bancaria', 'nro cuenta', 'cbu bancario', 'banco']
  },
  {
    key: 'contactName',
    label: 'Persona de Contacto',
    required: false,
    type: 'string',
    synonyms: ['contacto', 'nombre contacto', 'atencion', 'referente', 'contact']
  },
  {
    key: 'phone',
    label: 'Teléfono / WhatsApp',
    required: false,
    type: 'string',
    synonyms: ['telefono', 'teléfono', 'celular', 'whatsapp', 'movil', 'phone']
  },
  {
    key: 'email',
    label: 'Correo Electrónico',
    required: false,
    type: 'string',
    synonyms: ['email', 'correo', 'mail', 'e-mail']
  },
  {
    key: 'serviceDescription',
    label: 'Descripción de Servicios / Tarifas',
    required: false,
    type: 'string',
    synonyms: ['descripcion', 'descripción', 'servicios', 'detalle', 'notas']
  }
];

export const STUDENT_FIELDS_SCHEMA: FieldDefinition[] = [
  {
    key: 'operationCodeOrName',
    label: 'Código o Nombre del Viaje / Operación',
    required: true,
    type: 'string',
    synonyms: ['viaje', 'codigo viaje', 'nombre viaje', 'operacion', 'codigo operacion', 'destino', 'colegio', 'contrato', 'trip']
  },
  {
    key: 'studentName',
    label: 'Nombre y Apellido del Pasajero / Alumno',
    required: true,
    type: 'string',
    synonyms: ['alumno', 'pasajero', 'estudiante', 'nombre alumno', 'nombre pasajero', 'pax', 'nombre y apellido', 'nombre', 'student']
  },
  {
    key: 'studentDni',
    label: 'DNI del Pasajero / Alumno',
    required: false,
    type: 'string',
    synonyms: ['dni', 'dni alumno', 'documento', 'pasaporte', 'dni pasajero', 'id']
  },
  {
    key: 'payerName',
    label: 'Nombre Padre / Madre / Tutor / Pagador',
    required: false,
    type: 'string',
    synonyms: ['pagador', 'tutor', 'padre', 'madre', 'nombre pagador', 'responsable de pago', 'titular pago', 'payer']
  },
  {
    key: 'payerPhone',
    label: 'Teléfono del Pagador',
    required: false,
    type: 'string',
    synonyms: ['telefono tutor', 'telefono pagador', 'celular pagador', 'whatsapp tutor', 'telefono']
  },
  {
    key: 'payerDni',
    label: 'DNI / CUIT Pagador',
    required: false,
    type: 'string',
    synonyms: ['cuit pagador', 'dni pagador', 'dni tutor', 'cuit']
  },
  {
    key: 'expectedAmount',
    label: 'Monto Total Contratado ($)',
    required: false,
    type: 'number',
    defaultValue: 0,
    synonyms: ['monto', 'total', 'precio pasaje', 'cuota total', 'monto esperado', 'arancel', 'total pactado']
  },
  {
    key: 'paidAmount',
    label: 'Monto Ya Pagado ($)',
    required: false,
    type: 'number',
    defaultValue: 0,
    synonyms: ['pagado', 'abonado', 'monto pagado', 'cobrado', 'anticipo', 'total abonado']
  },
  {
    key: 'paymentDueDate',
    label: 'Fecha Vencimiento Cuota',
    required: false,
    type: 'date',
    synonyms: ['vencimiento', 'fecha vencimiento', 'vto', 'fecha limite', 'due date']
  },
  {
    key: 'notes',
    label: 'Observaciones / Beca / Descuento',
    required: false,
    type: 'string',
    synonyms: ['observaciones', 'notas', 'descuento', 'comentarios']
  }
];

export const MOVEMENT_FIELDS_SCHEMA: FieldDefinition[] = [
  {
    key: 'date',
    label: 'Fecha del Movimiento',
    required: true,
    type: 'date',
    synonyms: ['fecha', 'fecha operacion', 'fecha valor', 'date', 'fec']
  },
  {
    key: 'amount',
    label: 'Importe / Monto ($)',
    required: true,
    type: 'number',
    synonyms: ['importe', 'monto', 'monto neto', 'valor', 'total', 'amount', 'debito/credito']
  },
  {
    key: 'type',
    label: 'Tipo (Ingreso / Egreso)',
    required: false,
    type: 'select',
    defaultValue: 'ingreso',
    options: [
      { value: 'ingreso', label: 'Ingreso (+)' },
      { value: 'egreso', label: 'Egreso (-)' },
      { value: 'transferencia_interna', label: 'Transferencia Interna' }
    ],
    synonyms: ['tipo', 'tipo movimiento', 'ingreso/egreso', 'credito/debito', 'movimiento', 'sentido']
  },
  {
    key: 'description',
    label: 'Descripción / Concepto Bancario',
    required: false,
    type: 'string',
    defaultValue: 'Movimiento bancario',
    synonyms: ['descripcion', 'concepto', 'detalle', 'motivo', 'referencia', 'description', 'movimiento']
  },
  {
    key: 'rawPayerOrAlias',
    label: 'Pagador / Alias MP / Titular',
    required: false,
    type: 'string',
    synonyms: ['pagador', 'alias', 'titular', 'originante', 'contraparte', 'origen/destino', 'nombre pagador', 'alias mp']
  },
  {
    key: 'accountNameOrId',
    label: 'Cuenta Bancaria / Billetera',
    required: false,
    type: 'string',
    synonyms: ['cuenta', 'banco', 'billetera', 'cuenta destino', 'cuenta bancaria', 'account']
  },
  {
    key: 'category',
    label: 'Categoría',
    required: false,
    type: 'string',
    synonyms: ['categoria', 'categoría', 'rubro', 'imputacion', 'centro de costo']
  }
];

export const FIXED_EXPENSE_FIELDS_SCHEMA: FieldDefinition[] = [
  {
    key: 'provider',
    label: 'Proveedor / Concepto Fijo',
    required: true,
    type: 'string',
    synonyms: ['proveedor', 'concepto', 'servicio', 'nombre', 'beneficiario', 'gasto']
  },
  {
    key: 'category',
    label: 'Rubro del Gasto Fijo',
    required: false,
    type: 'select',
    defaultValue: 'administracion',
    options: [
      { value: 'empleados', label: 'Sueldos / RRHH' },
      { value: 'marketing', label: 'Marketing & Publicidad' },
      { value: 'tecnologia', label: 'Tecnología / Software' },
      { value: 'administracion', label: 'Administración & Legal' },
      { value: 'otros', label: 'Otros Gastos Fijos' }
    ],
    synonyms: ['rubro', 'categoria', 'categoría', 'tipo', 'clasificacion']
  },
  {
    key: 'amount',
    label: 'Monto Mensual ($)',
    required: true,
    type: 'number',
    synonyms: ['monto', 'monto mensual', 'importe', 'costo mensual', 'valor']
  },
  {
    key: 'dueDay',
    label: 'Día de Vencimiento / Pago (1 a 31)',
    required: false,
    type: 'number',
    defaultValue: 10,
    synonyms: ['dia', 'día', 'vencimiento', 'dia pago', 'dia de pago', 'fecha vto']
  },
  {
    key: 'paidFromAccount',
    label: 'Cuenta Habitual de Pago',
    required: false,
    type: 'string',
    synonyms: ['cuenta', 'banco', 'pagado desde', 'cuenta pago']
  },
  {
    key: 'description',
    label: 'Descripción / Detalle',
    required: false,
    type: 'string',
    defaultValue: '',
    synonyms: ['descripcion', 'descripción', 'detalle', 'observaciones', 'notas']
  }
];

// ----------------------------------------------------
// Universal Raw File Reader
// ----------------------------------------------------
export function readRawFile(fileData: ArrayBuffer | string): RawFileResult {
  let workbook: XLSX.WorkBook;
  try {
    if (typeof fileData === 'string') {
      workbook = XLSX.read(fileData, { type: 'string' });
    } else {
      workbook = XLSX.read(new Uint8Array(fileData), { type: 'array' });
    }
  } catch (err: any) {
    throw new Error('No se pudo leer el archivo. Asegúrese de que sea un archivo Excel (.xlsx, .xls) o CSV válido.');
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('El archivo no contiene hojas de cálculo con datos.');
  }

  const activeSheet = workbook.SheetNames[0];
  const sheet = workbook.Sheets[activeSheet];
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });

  if (rawRows.length === 0) {
    // Try raw without strings
    const rawNumRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if (rawNumRows.length === 0) {
      throw new Error('La planilla seleccionada está vacía.');
    }
  }

  // Extract all unique headers across all rows (case preserved)
  const headerSet = new Set<string>();
  rawRows.forEach(row => {
    Object.keys(row).forEach(k => {
      if (k && k.trim() && !k.startsWith('__EMPTY')) {
        headerSet.add(k.trim());
      }
    });
  });

  return {
    sheetNames: workbook.SheetNames,
    activeSheet,
    headers: Array.from(headerSet),
    rawRows
  };
}

// ----------------------------------------------------
// Smart Column Auto-Matching Engine
// ----------------------------------------------------
export function autoMatchColumns(detectedHeaders: string[], schemaFields: FieldDefinition[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const normalizedFileHeaders = detectedHeaders.map(h => ({
    original: h,
    clean: h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  }));

  schemaFields.forEach(field => {
    // 1. Exact match on field key or label
    const cleanKey = field.key.toLowerCase();
    const cleanLabel = field.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    let found = normalizedFileHeaders.find(h => h.clean === cleanKey || h.clean === cleanLabel);

    // 2. Try synonyms
    if (!found) {
      for (const syn of field.synonyms) {
        const cleanSyn = syn.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        found = normalizedFileHeaders.find(h => h.clean === cleanSyn || h.clean.includes(cleanSyn) || cleanSyn.includes(h.clean));
        if (found) break;
      }
    }

    if (found) {
      mapping[field.key] = found.original;
    } else {
      mapping[field.key] = '';
    }
  });

  return mapping;
}

// Helper to sanitize numeric values (currencies, amounts, counts)
export function parseNumberValue(val: any, fallback = 0): number {
  if (val === null || val === undefined || val === '') return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  const str = String(val).replace(/[$€\s]/g, '').replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]+/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? fallback : num;
}

// Helper to sanitize dates to YYYY-MM-DD
export function parseDateValue(val: any, fallback?: string): string {
  if (!val) return fallback || new Date().toISOString().split('T')[0];
  if (typeof val === 'number') {
    try {
      const d = XLSX.SSF.parse_date_code(val);
      if (d && d.y && d.m && d.d) {
        return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
      }
    } catch {
      // fallback
    }
  }

  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const p0 = parts[0].padStart(2, '0');
      const p1 = parts[1].padStart(2, '0');
      const p2 = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      // Format DD/MM/YYYY to YYYY-MM-DD
      return `${p2}-${p1}-${p0}`;
    }
  }
  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 3 && parts[0].length === 2) {
      // DD-MM-YYYY to YYYY-MM-DD
      const p2 = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${p2}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return fallback || new Date().toISOString().split('T')[0];
}

// Helper to normalize Business Unit
export function normalizeBusinessUnit(val: any, defaultBU: BusinessUnit = 'receptivo'): BusinessUnit {
  if (!val) return defaultBU;
  const str = String(val).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (str.includes('salida') || str.includes('educativ') && (str.includes('corta') || str.includes('jornada') || str.includes('dia'))) {
    return 'salidas';
  }
  if (str.includes('salida')) {
    return 'salidas';
  }
  if (str.includes('viaje') || str.includes('egresad') || str.includes('estudio') || str.includes('larga')) {
    return 'viajes';
  }
  if (str.includes('receptiv') || str.includes('turism') || str.includes('tour') || str.includes('privado')) {
    return 'receptivo';
  }
  return defaultBU;
}

// ----------------------------------------------------
// Specialized Import Processors with Dynamic Mapping
// ----------------------------------------------------

export interface ImportPreviewRow {
  rowNumber: number;
  code: string;
  name: string;
  businessUnit: BusinessUnit;
  serviceType: string;
  clientOrSchool: string;
  date: string;
  endDate?: string;
  passengerCount: number;
  expectedRevenue: number;
  receivedRevenue: number;
  expectedCost: number;
  paidCost: number;
  responsiblePerson: string;
  observations: string;
  status: 'new' | 'update' | 'warning' | 'error' | 'duplicate_in_file';
  existingOperationId?: string;
  modifiedFields?: string[];
  missingFields?: string[];
  errorMessage?: string;
}

export function parseOperationsWithMapping(
  rawRows: Record<string, any>[],
  columnMapping: Record<string, string>,
  globalConfig: {
    businessUnitMode: 'from_column' | 'fixed';
    fixedBusinessUnit: BusinessUnit;
    defaultClient?: string;
    defaultResponsible?: string;
  },
  existingOperations: Operation[]
): ImportPreviewRow[] {
  const existingMapByCode = new Map<string, Operation>();
  const existingMapByNameDate = new Map<string, Operation>();

  existingOperations.forEach(op => {
    if (op.code) existingMapByCode.set(op.code.trim().toUpperCase(), op);
    const key = `${op.name.trim().toLowerCase()}_${op.date}`;
    existingMapByNameDate.set(key, op);
  });

  const seenCodes = new Set<string>();
  const results: ImportPreviewRow[] = [];

  rawRows.forEach((row, idx) => {
    const rowNumber = idx + 2;
    const missing: string[] = [];

    // Extract fields based on mapping
    const getVal = (fieldKey: string) => {
      const col = columnMapping[fieldKey];
      return col && row[col] !== undefined ? row[col] : '';
    };

    const rawName = String(getVal('name')).trim();
    const rawCode = String(getVal('code')).trim();
    const rawClient = String(getVal('clientOrSchool')).trim();
    const rawDate = getVal('date');
    const rawEndDate = getVal('endDate');
    const rawPax = getVal('passengerCount');
    const rawServiceType = String(getVal('serviceType')).trim();
    const rawExpRev = getVal('expectedRevenue');
    const rawRecRev = getVal('receivedRevenue');
    const rawExpCost = getVal('expectedCost');
    const rawPaidCost = getVal('paidCost');
    const rawResponsible = String(getVal('responsiblePerson')).trim();
    const rawObs = String(getVal('observations')).trim();

    // Determine Business Unit
    let businessUnit: BusinessUnit;
    if (globalConfig.businessUnitMode === 'fixed') {
      businessUnit = globalConfig.fixedBusinessUnit;
    } else {
      const rawBU = getVal('businessUnit');
      if (rawBU) {
        businessUnit = normalizeBusinessUnit(rawBU, globalConfig.fixedBusinessUnit);
      } else {
        businessUnit = globalConfig.fixedBusinessUnit;
        missing.push('Unidad de Negocio (asignada según configuración general)');
      }
    }

    // Name Validation
    if (!rawName) {
      results.push({
        rowNumber,
        code: rawCode || `ROW-${rowNumber}`,
        name: 'Sin nombre especificado',
        businessUnit,
        serviceType: rawServiceType || 'Servicio Turístico',
        clientOrSchool: rawClient || globalConfig.defaultClient || 'Cliente General',
        date: parseDateValue(rawDate),
        passengerCount: 1,
        expectedRevenue: 0,
        receivedRevenue: 0,
        expectedCost: 0,
        paidCost: 0,
        responsiblePerson: rawResponsible || globalConfig.defaultResponsible || 'Administración',
        observations: rawObs,
        status: 'error',
        errorMessage: 'El Nombre de la Operación / Viaje es obligatorio.'
      });
      return;
    }

    if (!rawDate) missing.push('Fecha de Viaje (usando fecha actual)');
    if (!rawClient) missing.push('Cliente / Colegio');
    if (!rawExpRev) missing.push('Ingreso Presupuestado ($0)');
    if (!rawExpCost) missing.push('Costo Presupuestado ($0)');

    const date = parseDateValue(rawDate);
    const endDate = rawEndDate ? parseDateValue(rawEndDate) : undefined;
    const passengerCount = Math.max(1, parseInt(String(rawPax), 10) || 1);
    const expectedRevenue = parseNumberValue(rawExpRev, 0);
    const receivedRevenue = parseNumberValue(rawRecRev, 0);
    const expectedCost = parseNumberValue(rawExpCost, 0);
    const paidCost = parseNumberValue(rawPaidCost, 0);
    const clientOrSchool = rawClient || globalConfig.defaultClient || 'Cliente General';
    const responsiblePerson = rawResponsible || globalConfig.defaultResponsible || 'Administración';
    const serviceType = rawServiceType || (businessUnit === 'salidas' ? 'Salida Educativa' : businessUnit === 'viajes' ? 'Viaje de Estudios' : 'Tour Privado');

    // Code deduplication
    if (rawCode && seenCodes.has(rawCode.toUpperCase())) {
      results.push({
        rowNumber,
        code: rawCode,
        name: rawName,
        businessUnit,
        serviceType,
        clientOrSchool,
        date,
        endDate,
        passengerCount,
        expectedRevenue,
        receivedRevenue,
        expectedCost,
        paidCost,
        responsiblePerson,
        observations: rawObs,
        status: 'duplicate_in_file',
        errorMessage: `El código "${rawCode}" está duplicado en el mismo archivo.`
      });
      return;
    }
    if (rawCode) seenCodes.add(rawCode.toUpperCase());

    // Match with existing
    let existing: Operation | undefined;
    if (rawCode && existingMapByCode.has(rawCode.toUpperCase())) {
      existing = existingMapByCode.get(rawCode.toUpperCase());
    } else {
      const key = `${rawName.toLowerCase()}_${date}`;
      if (existingMapByNameDate.has(key)) {
        existing = existingMapByNameDate.get(key);
      }
    }

    if (existing) {
      const diffs: string[] = [];
      if (existing.name !== rawName) diffs.push('Nombre');
      if (existing.clientOrSchool !== clientOrSchool) diffs.push('Cliente');
      if (existing.date !== date) diffs.push('Fecha');
      if (existing.passengerCount !== passengerCount) diffs.push('Pax');
      if (expectedRevenue > 0 && existing.expectedRevenue !== expectedRevenue) diffs.push('Ingreso Esp.');
      if (receivedRevenue > 0 && existing.receivedRevenue !== receivedRevenue) diffs.push('Ingreso Cobrado');
      if (expectedCost > 0 && existing.expectedCost !== expectedCost) diffs.push('Costo Esp.');
      if (paidCost > 0 && existing.paidCost !== paidCost) diffs.push('Costo Pagado');

      results.push({
        rowNumber,
        code: existing.code,
        name: rawName,
        businessUnit: existing.businessUnit || businessUnit,
        serviceType: serviceType || existing.serviceType,
        clientOrSchool: clientOrSchool || existing.clientOrSchool,
        date: date || existing.date,
        endDate: endDate || existing.endDate,
        passengerCount: passengerCount || existing.passengerCount,
        expectedRevenue: expectedRevenue || existing.expectedRevenue,
        receivedRevenue: receivedRevenue >= 0 ? receivedRevenue : existing.receivedRevenue,
        expectedCost: expectedCost || existing.expectedCost,
        paidCost: paidCost >= 0 ? paidCost : existing.paidCost,
        responsiblePerson: responsiblePerson || existing.responsiblePerson,
        observations: rawObs || existing.observations,
        status: 'update',
        existingOperationId: existing.id,
        modifiedFields: diffs,
        missingFields: missing
      });
    } else {
      const prefix = businessUnit === 'receptivo' ? 'TR' : businessUnit === 'salidas' ? 'SE' : 'VE';
      const autoCode = rawCode || `${prefix}-2026-IMP${String(idx + 1).padStart(3, '0')}`;

      results.push({
        rowNumber,
        code: autoCode,
        name: rawName,
        businessUnit,
        serviceType,
        clientOrSchool,
        date,
        endDate,
        passengerCount,
        expectedRevenue,
        receivedRevenue,
        expectedCost,
        paidCost,
        responsiblePerson,
        observations: rawObs,
        status: missing.length > 0 ? 'warning' : 'new',
        missingFields: missing
      });
    }
  });

  return results;
}

// ----------------------------------------------------
// Suppliers Parser with Dynamic Mapping
// ----------------------------------------------------
export interface SupplierImportPreviewRow {
  rowNumber: number;
  name: string;
  category: string;
  mpAlias?: string;
  cbu?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  serviceDescription: string;
  status: 'new' | 'update' | 'error';
  existingSupplierId?: string;
  errorMessage?: string;
}

export function parseSuppliersWithMapping(
  rawRows: Record<string, any>[],
  columnMapping: Record<string, string>,
  existingSuppliers: Supplier[]
): SupplierImportPreviewRow[] {
  const existingMap = new Map<string, Supplier>();
  existingSuppliers.forEach(s => existingMap.set(s.name.trim().toLowerCase(), s));

  return rawRows.map((row, idx) => {
    const rowNumber = idx + 2;
    const getVal = (k: string) => (columnMapping[k] && row[columnMapping[k]] !== undefined ? String(row[columnMapping[k]]).trim() : '');

    const name = getVal('name');
    if (!name) {
      return {
        rowNumber,
        name: 'Sin nombre',
        category: 'Otros',
        serviceDescription: '',
        status: 'error',
        errorMessage: 'El nombre del proveedor o prestador es obligatorio.'
      };
    }

    const category = getVal('category') || 'Otros';
    const mpAlias = getVal('mpAlias');
    const cbu = getVal('cbu');
    const contactName = getVal('contactName');
    const phone = getVal('phone');
    const email = getVal('email');
    const serviceDescription = getVal('serviceDescription') || `Prestador de ${category}`;

    const existing = existingMap.get(name.toLowerCase());

    return {
      rowNumber,
      name,
      category,
      mpAlias,
      cbu,
      contactName,
      phone,
      email,
      serviceDescription,
      status: existing ? 'update' : 'new',
      existingSupplierId: existing?.id
    };
  });
}

// ----------------------------------------------------
// Students / Passengers Parser with Dynamic Mapping
// ----------------------------------------------------
export interface StudentImportPreviewRow {
  rowNumber: number;
  operationCodeOrName: string;
  matchedOperation?: Operation;
  studentName: string;
  studentDni?: string;
  payerName: string;
  payerPhone?: string;
  payerDni?: string;
  expectedAmount: number;
  paidAmount: number;
  paymentDueDate: string;
  notes?: string;
  status: 'new' | 'warning' | 'error';
  errorMessage?: string;
}

export function parseStudentsWithMapping(
  rawRows: Record<string, any>[],
  columnMapping: Record<string, string>,
  operations: Operation[]
): StudentImportPreviewRow[] {
  return rawRows.map((row, idx) => {
    const rowNumber = idx + 2;
    const getVal = (k: string) => (columnMapping[k] && row[columnMapping[k]] !== undefined ? row[columnMapping[k]] : '');

    const studentName = String(getVal('studentName')).trim();
    const opTarget = String(getVal('operationCodeOrName')).trim();

    if (!studentName) {
      return {
        rowNumber,
        operationCodeOrName: opTarget,
        studentName: 'Sin nombre',
        payerName: '',
        expectedAmount: 0,
        paidAmount: 0,
        paymentDueDate: '',
        status: 'error',
        errorMessage: 'El nombre del alumno/pasajero es obligatorio.'
      };
    }

    // Match operation by code or by name
    const matchedOp = operations.find(
      op =>
        op.code.toLowerCase() === opTarget.toLowerCase() ||
        op.name.toLowerCase().includes(opTarget.toLowerCase()) ||
        (opTarget && op.clientOrSchool.toLowerCase().includes(opTarget.toLowerCase()))
    );

    const payerName = String(getVal('payerName')).trim() || studentName;
    const studentDni = String(getVal('studentDni')).trim();
    const payerPhone = String(getVal('payerPhone')).trim();
    const payerDni = String(getVal('payerDni')).trim();
    const expectedAmount = parseNumberValue(getVal('expectedAmount'), 0);
    const paidAmount = parseNumberValue(getVal('paidAmount'), 0);
    const paymentDueDate = parseDateValue(getVal('paymentDueDate'), matchedOp?.date || new Date().toISOString().split('T')[0]);
    const notes = String(getVal('notes')).trim();

    return {
      rowNumber,
      operationCodeOrName: opTarget || (matchedOp ? matchedOp.code : 'Sin viaje asignado'),
      matchedOperation: matchedOp,
      studentName,
      studentDni,
      payerName,
      payerPhone,
      payerDni,
      expectedAmount,
      paidAmount,
      paymentDueDate,
      notes,
      status: matchedOp ? 'new' : 'warning',
      errorMessage: !matchedOp ? `No se encontró la operación "${opTarget}". Se vinculará a la primera operación activa o requerirá selección.` : undefined
    };
  });
}

// ----------------------------------------------------
// Financial Movements / Bank Statements Parser
// ----------------------------------------------------
export interface MovementImportPreviewRow {
  rowNumber: number;
  date: string;
  amount: number;
  type: 'ingreso' | 'egreso' | 'transferencia_interna';
  description: string;
  rawPayerOrAlias?: string;
  accountNameOrId?: string;
  matchedAccountId?: AccountId;
  category?: string;
  status: 'new' | 'error';
  errorMessage?: string;
}

export function parseMovementsWithMapping(
  rawRows: Record<string, any>[],
  columnMapping: Record<string, string>,
  accounts: FinancialAccount[],
  defaultAccountId: AccountId = 'mp_gaston'
): MovementImportPreviewRow[] {
  return rawRows.map((row, idx) => {
    const rowNumber = idx + 2;
    const getVal = (k: string) => (columnMapping[k] && row[columnMapping[k]] !== undefined ? row[columnMapping[k]] : '');

    const rawAmount = getVal('amount');
    const amount = Math.abs(parseNumberValue(rawAmount, 0));

    if (!amount) {
      return {
        rowNumber,
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        type: 'ingreso',
        description: 'Sin monto',
        status: 'error',
        errorMessage: 'El importe del movimiento no es válido o es cero.'
      };
    }

    const date = parseDateValue(getVal('date'));
    const desc = String(getVal('description')).trim() || 'Movimiento extracto bancario';
    const alias = String(getVal('rawPayerOrAlias')).trim();
    const rawType = String(getVal('type')).toLowerCase();

    let type: 'ingreso' | 'egreso' | 'transferencia_interna' = 'ingreso';
    if (rawType.includes('egreso') || rawType.includes('debito') || rawType.includes('salida') || rawType.includes('gasto') || (typeof rawAmount === 'number' && rawAmount < 0)) {
      type = 'egreso';
    } else if (rawType.includes('transferencia interna') || rawType.includes('traspaso')) {
      type = 'transferencia_interna';
    }

    const rawAcc = String(getVal('accountNameOrId')).toLowerCase();
    let matchedAccountId = defaultAccountId;
    if (rawAcc) {
      const found = accounts.find(a => a.id.toLowerCase().includes(rawAcc) || a.name.toLowerCase().includes(rawAcc) || (a.alias && a.alias.toLowerCase().includes(rawAcc)));
      if (found) matchedAccountId = found.id;
    }

    return {
      rowNumber,
      date,
      amount,
      type,
      description: desc,
      rawPayerOrAlias: alias,
      accountNameOrId: rawAcc || accounts.find(a => a.id === matchedAccountId)?.name,
      matchedAccountId,
      category: String(getVal('category')).trim(),
      status: 'new'
    };
  });
}

// ----------------------------------------------------
// Fixed Expenses Parser
// ----------------------------------------------------
export interface FixedExpenseImportPreviewRow {
  rowNumber: number;
  provider: string;
  category: any;
  amount: number;
  dueDay: number;
  paidFromAccountId: AccountId;
  description: string;
  status: 'new' | 'error';
  errorMessage?: string;
}

export function parseFixedExpensesWithMapping(
  rawRows: Record<string, any>[],
  columnMapping: Record<string, string>,
  accounts: FinancialAccount[]
): FixedExpenseImportPreviewRow[] {
  return rawRows.map((row, idx) => {
    const rowNumber = idx + 2;
    const getVal = (k: string) => (columnMapping[k] && row[columnMapping[k]] !== undefined ? row[columnMapping[k]] : '');

    const provider = String(getVal('provider')).trim();
    const amount = parseNumberValue(getVal('amount'), 0);

    if (!provider || amount <= 0) {
      return {
        rowNumber,
        provider: provider || 'Sin nombre',
        category: 'administracion',
        amount: amount || 0,
        dueDay: 10,
        paidFromAccountId: accounts[0]?.id || 'mp_gaston',
        description: '',
        status: 'error',
        errorMessage: 'El concepto y el monto mensual mayor a 0 son obligatorios.'
      };
    }

    const rawCat = String(getVal('category')).toLowerCase();
    let category = 'administracion';
    if (rawCat.includes('sueldo') || rawCat.includes('emplead') || rawCat.includes('honorario')) category = 'empleados';
    else if (rawCat.includes('market') || rawCat.includes('publicid') || rawCat.includes('meta')) category = 'marketing';
    else if (rawCat.includes('tecno') || rawCat.includes('soft') || rawCat.includes('suscrip')) category = 'tecnologia';
    else if (rawCat.includes('otro')) category = 'otros';

    const dueDay = Math.min(31, Math.max(1, parseInt(String(getVal('dueDay')), 10) || 10));
    const desc = String(getVal('description')).trim() || `Gasto fijo mensual: ${provider}`;

    return {
      rowNumber,
      provider,
      category,
      amount,
      dueDay,
      paidFromAccountId: accounts[0]?.id || 'mp_gaston',
      description: desc,
      status: 'new'
    };
  });
}

// ----------------------------------------------------
// Specific Excel Template Generators
// ----------------------------------------------------

export function generateOperationsTemplate(): Uint8Array {
  const data = [
    {
      'Codigo': 'VE-2026-101',
      'Nombre': 'Viaje Egresados Córdoba 5D/4N',
      'Unidad de Negocio': 'Viajes Educativos',
      'Cliente': 'Colegio Belgrano - 5to Año',
      'Fecha': '2026-10-15',
      'Fecha Fin': '2026-10-20',
      'Pasajeros': 30,
      'Tipo de Servicio': 'Viaje de Estudios',
      'Ingreso Esperado': 6000000,
      'Ingreso Cobrado': 4500000,
      'Costo Esperado': 4100000,
      'Costo Pagado': 2200000,
      'Responsable': 'Gastón Rodríguez',
      'Estado': 'Confirmada',
      'Observaciones': 'Transporte señado al 50%'
    },
    {
      'Codigo': 'SE-2026-088',
      'Nombre': 'Visita Bioparque Temaikèn',
      'Unidad de Negocio': 'Salidas Educativas',
      'Cliente': 'Instituto San Jorge - 3er Grado',
      'Fecha': '2026-09-28',
      'Fecha Fin': '2026-09-28',
      'Pasajeros': 40,
      'Tipo de Servicio': 'Salida Jornada Completa',
      'Ingreso Esperado': 1200000,
      'Ingreso Cobrado': 1200000,
      'Costo Esperado': 780000,
      'Costo Pagado': 400000,
      'Responsable': 'María Elena Rossi',
      'Estado': 'Confirmada',
      'Observaciones': 'Entradas y viandas contratadas'
    },
    {
      'Codigo': 'TR-2026-055',
      'Nombre': 'Tour Privado Bodegas & Andes Mendoza',
      'Unidad de Negocio': 'Turismo Receptivo',
      'Cliente': 'Agencia Latin America Tours',
      'Fecha': '2026-10-02',
      'Fecha Fin': '2026-10-04',
      'Pasajeros': 8,
      'Tipo de Servicio': 'Paquete Privado',
      'Ingreso Esperado': 3200000,
      'Ingreso Cobrado': 1600000,
      'Costo Esperado': 2100000,
      'Costo Pagado': 1050000,
      'Responsable': 'Gastón Rodríguez',
      'Estado': 'Confirmada',
      'Observaciones': 'Guía sommelier bilingüe'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Operaciones');
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

export function generateSuppliersTemplate(): Uint8Array {
  const data = [
    {
      'Proveedor / Razón Social': 'Transportes del Sur SRL',
      'Rubro': 'Transporte',
      'Alias MP / CVU': 'transur.viajes.mp',
      'CBU': '0720123488000012345678',
      'Contacto': 'Carlos Domínguez',
      'Teléfono': '+54 9 11 4455-8899',
      'Email': 'reservas@transur.com.ar',
      'Servicios y Tarifas': 'Buses semicama y ejecutivos 45/60 pax'
    },
    {
      'Proveedor / Razón Social': 'Hotel Sierras & Spa',
      'Rubro': 'Alojamiento',
      'Alias MP / CVU': 'hotel.sierras.cordoba',
      'CBU': '0110456788000098765432',
      'Contacto': 'Lucía Martínez',
      'Teléfono': '+54 9 351 556-7788',
      'Email': 'grupos@hotelsierras.com.ar',
      'Servicios y Tarifas': 'Pensión completa para grupos educativos'
    },
    {
      'Proveedor / Razón Social': 'Guías Especializados Buenos Aires',
      'Rubro': 'Guías',
      'Alias MP / CVU': 'guias.baires.tours',
      'CBU': '0070112233445566778899',
      'Contacto': 'Esteban Morales',
      'Teléfono': '+54 9 11 6789-0123',
      'Email': 'contacto@guiasbaires.com',
      'Servicios y Tarifas': 'Circuitos históricos bilingües'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Proveedores');
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

export function generateStudentsTemplate(): Uint8Array {
  const data = [
    {
      'Código o Nombre Viaje': 'VE-2026-101',
      'Nombre Alumno / Pasajero': 'Mateo Fernández',
      'DNI Alumno': '48.912.345',
      'Nombre Padre / Tutor': 'Gonzalo Fernández',
      'Teléfono Tutor': '+54 9 11 5544-3322',
      'CUIT Tutor': '20-28912345-8',
      'Monto Total ($)': 200000,
      'Monto Pagado ($)': 150000,
      'Fecha Vencimiento Cuota': '2026-09-10',
      'Observaciones': 'Abonó cuotas 1, 2 y 3'
    },
    {
      'Código o Nombre Viaje': 'VE-2026-101',
      'Nombre Alumno / Pasajero': 'Sofía Benítez',
      'DNI Alumno': '49.123.456',
      'Nombre Padre / Tutor': 'Claudia Méndez',
      'Teléfono Tutor': '+54 9 11 6677-8899',
      'CUIT Tutor': '27-26123456-4',
      'Monto Total ($)': 200000,
      'Monto Pagado ($)': 200000,
      'Fecha Vencimiento Cuota': '2026-08-15',
      'Observaciones': 'Pago total completado'
    },
    {
      'Código o Nombre Viaje': 'SE-2026-088',
      'Nombre Alumno / Pasajero': 'Joaquín Rossi',
      'DNI Alumno': '52.334.556',
      'Nombre Padre / Tutor': 'Silvia Rossi',
      'Teléfono Tutor': '+54 9 11 4433-2211',
      'CUIT Tutor': '27-24334556-9',
      'Monto Total ($)': 30000,
      'Monto Pagado ($)': 30000,
      'Fecha Vencimiento Cuota': '2026-09-20',
      'Observaciones': 'Autorización firmada'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Pasajeros y Cuotas');
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

export function generateMovementsTemplate(): Uint8Array {
  const data = [
    {
      'Fecha': '2026-08-25',
      'Importe ($)': 150000,
      'Tipo': 'Ingreso',
      'Descripción': 'Cobro Cuota Viaje Córdoba - Gonzalo Fernández',
      'Alias / Pagador': 'gonzalo.fernandez.mp',
      'Cuenta': 'Mercado Pago Gastón',
      'Categoría': 'Cobro Pasaje'
    },
    {
      'Fecha': '2026-08-26',
      'Importe ($)': 450000,
      'Tipo': 'Egreso',
      'Descripción': 'Pago Anticipo Bus - Transportes del Sur',
      'Alias / Pagador': 'transur.viajes.mp',
      'Cuenta': 'Banco Santander Turismo',
      'Categoría': 'Transporte'
    },
    {
      'Fecha': '2026-08-27',
      'Importe ($)': 200000,
      'Tipo': 'Transferencia Interna',
      'Descripción': 'Traspaso de MP Gastón a Santander',
      'Alias / Pagador': 'Transferencia Propia',
      'Cuenta': 'Mercado Pago Gastón',
      'Categoría': 'Transferencia Interna'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Extractos');
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

export function generateFixedExpensesTemplate(): Uint8Array {
  const data = [
    {
      'Concepto / Proveedor': 'Sueldo Administración',
      'Rubro': 'Sueldos / RRHH',
      'Monto Mensual ($)': 850000,
      'Día de Pago': 5,
      'Cuenta Habitual': 'Banco Santander Turismo',
      'Descripción': 'Liquidación mensual administración central'
    },
    {
      'Concepto / Proveedor': 'Publicidad Meta Ads & Google',
      'Rubro': 'Marketing & Publicidad',
      'Monto Mensual ($)': 180000,
      'Día de Pago': 10,
      'Cuenta Habitual': 'Mercado Pago Gastón',
      'Descripción': 'Campañas captación salidas educativas'
    },
    {
      'Concepto / Proveedor': 'Suscripciones Software & CRM',
      'Rubro': 'Tecnología / Software',
      'Monto Mensual ($)': 45000,
      'Día de Pago': 15,
      'Cuenta Habitual': 'Mercado Pago Gastón',
      'Descripción': 'Google Workspace, Canva y herramientas operativas'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla Gastos Fijos');
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

// Backward compatibility alias
export function generateTemplateWorkbook(): Uint8Array {
  return generateOperationsTemplate();
}

export function parseOperationsFile(fileData: ArrayBuffer | string, existingOperations: Operation[]): ImportPreviewRow[] {
  const { rawRows } = readRawFile(fileData);
  const autoMap = autoMatchColumns(Object.keys(rawRows[0] || {}), OPERATION_FIELDS_SCHEMA);
  return parseOperationsWithMapping(
    rawRows,
    autoMap,
    {
      businessUnitMode: autoMap.businessUnit ? 'from_column' : 'fixed',
      fixedBusinessUnit: 'receptivo',
      defaultClient: 'Cliente General',
      defaultResponsible: 'Administración'
    },
    existingOperations
  );
}

export function exportOperationsToExcel(operations: Operation[]): Uint8Array {
  const data = operations.map(op => ({
    'Código': op.code,
    'Nombre Operación': op.name,
    'Unidad de Negocio': op.businessUnit === 'receptivo' ? 'Turismo Receptivo' : op.businessUnit === 'salidas' ? 'Salidas Educativas' : 'Viajes Educativos',
    'Tipo de Servicio': op.serviceType,
    'Cliente / Colegio': op.clientOrSchool,
    'Fecha': op.date,
    'Fecha Fin': op.endDate || '',
    'Pasajeros': op.passengerCount,
    'Estado': op.status.toUpperCase(),
    'Ingreso Esperado ($)': op.expectedRevenue,
    'Ingreso Cobrado ($)': op.receivedRevenue,
    'Ingreso Pendiente ($)': Math.max(0, op.expectedRevenue - op.receivedRevenue),
    'Costo Esperado ($)': op.expectedCost,
    'Costo Pagado ($)': op.paidCost,
    'Costo Pendiente ($)': Math.max(0, op.expectedCost - op.paidCost),
    'Ganancia Esperada ($)': op.expectedRevenue - op.expectedCost,
    'Resultado a la Fecha ($)': op.receivedRevenue - op.paidCost,
    'Margen Esperado (%)': op.expectedRevenue > 0 ? Number(((op.expectedRevenue - op.expectedCost) / op.expectedRevenue * 100).toFixed(1)) : 0,
    'Responsable': op.responsiblePerson,
    'Observaciones': op.observations
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Master Operaciones');
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}
