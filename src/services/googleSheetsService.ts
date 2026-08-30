import { getAccessToken } from './googleAuth';
import { Operation, FinancialMovement, Supplier, FixedExpense, StudentPayer, AccountId } from '../types';
import { MonthlyCashEvolution } from '../utils/financialCalculations';

export interface DriveSpreadsheetFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface SheetTabInfo {
  sheetId: number;
  title: string;
  index: number;
}

export interface GoogleSpreadsheetMetadata {
  spreadsheetId: string;
  title: string;
  sheets: SheetTabInfo[];
  spreadsheetUrl?: string;
}

// Helper to make authenticated requests to Google APIs
async function googleFetch<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No hay sesión activa con Google. Inicie sesión para continuar.');
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errMessage = `Error ${response.status}: ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData.error?.message) {
        errMessage = errData.error.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errMessage);
  }

  return response.json();
}

/**
 * List Google Sheets spreadsheets from user's Google Drive
 */
export async function listSpreadsheets(): Promise<DriveSpreadsheetFile[]> {
  const q = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const fields = encodeURIComponent('files(id,name,modifiedTime,webViewLink)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&orderBy=modifiedTime desc&pageSize=30`;

  const data = await googleFetch<{ files: DriveSpreadsheetFile[] }>(url);
  return data.files || [];
}

/**
 * Get spreadsheet details and list of sheet tabs
 */
export async function getSpreadsheetMetadata(spreadsheetId: string): Promise<GoogleSpreadsheetMetadata> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title,spreadsheetUrl,sheets.properties(sheetId,title,index)`;
  const data = await googleFetch<any>(url);

  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title || 'Sin Título',
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    sheets: (data.sheets || []).map((s: any) => ({
      sheetId: s.properties.sheetId,
      title: s.properties.title,
      index: s.properties.index
    }))
  };
}

/**
 * Read values from a given sheet range (e.g., "Operaciones!A1:Z100")
 */
export async function readSheetRange(spreadsheetId: string, range: string): Promise<any[][]> {
  const encodedRange = encodeURIComponent(range);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}`;
  const data = await googleFetch<{ values?: any[][] }>(url);
  return data.values || [];
}

/**
 * Write values to a sheet range
 */
export async function writeSheetValues(
  spreadsheetId: string,
  range: string,
  values: any[][]
): Promise<any> {
  const encodedRange = encodeURIComponent(range);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueInputOption=USER_ENTERED`;
  return googleFetch(url, {
    method: 'PUT',
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values
    })
  });
}

/**
 * Append values to a sheet
 */
export async function appendSheetValues(
  spreadsheetId: string,
  range: string,
  values: any[][]
): Promise<any> {
  const encodedRange = encodeURIComponent(range);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  return googleFetch(url, {
    method: 'POST',
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values
    })
  });
}

/**
 * Create a comprehensive multi-sheet Google Spreadsheet with formatted financial data
 */
export async function exportAllToGoogleSpreadsheet(
  title: string,
  payload: {
    operations: Operation[];
    movements: FinancialMovement[];
    suppliers: Supplier[];
    fixedExpenses: FixedExpense[];
    monthlyProjection: MonthlyCashEvolution[];
  }
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  // 1. Create empty spreadsheet with tabs
  const createUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
  const initialSheetData = {
    properties: {
      title: title || `Turismo & Finanzas - Exportación ${new Date().toISOString().split('T')[0]}`
    },
    sheets: [
      { properties: { title: 'Resumen y Proyecciones', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Operaciones', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Movimientos y Extractos', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Proveedores', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Gastos Fijos', gridProperties: { frozenRowCount: 1 } } },
      { properties: { title: 'Estudiantes y Pagadores', gridProperties: { frozenRowCount: 1 } } }
    ]
  };

  const createdSheet = await googleFetch<any>(createUrl, {
    method: 'POST',
    body: JSON.stringify(initialSheetData)
  });

  const spreadsheetId = createdSheet.spreadsheetId;
  const spreadsheetUrl = createdSheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Prepare tabular data for each tab
  // Tab 1: Proyecciones
  const projectionHeaders = ['Mes', 'Caja Inicial ($)', 'Cobros Esperados ($)', 'Pagos Proveedores ($)', 'Gastos Fijos ($)', 'Caja Final ($)', 'Flujo Neto ($)', 'Estado'];
  const projectionRows = payload.monthlyProjection.map(p => [
    p.monthLabel,
    p.initialCash,
    p.projectedIncome,
    p.projectedSupplierPayments,
    p.projectedFixedExpenses,
    p.finalProjectedCash,
    p.projectedIncome - p.projectedSupplierPayments - p.projectedFixedExpenses,
    p.isProjected ? 'Proyectado' : 'Real'
  ]);
  const projectionData = [projectionHeaders, ...projectionRows];

  // Tab 2: Operaciones
  const opHeaders = [
    'Código',
    'Nombre Operación',
    'Unidad de Negocio',
    'Fecha',
    'Estado Operativo',
    'Cliente / Colegio',
    'Pasajeros / Alumnos',
    'Venta Esperada ($)',
    'Costo Esperado ($)',
    'Margen Bruto ($)',
    'Rentabilidad %',
    'Cobrado ($)',
    'Saldo por Cobrar ($)',
    'Pagado Proveedores ($)',
    'Deuda Proveedores ($)'
  ];
  const opRows = payload.operations.map(op => {
    const totalCost = op.expectedCost || (op.suppliers || []).reduce((sum, c) => sum + (c.expectedCost || 0), 0);
    const totalRevenue = op.expectedRevenue || 0;
    const profit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    const debtClients = Math.max(0, totalRevenue - (op.receivedRevenue || 0));
    const paidSuppliers = op.paidCost || (op.suppliers || []).reduce((sum, c) => sum + (c.paidCost || 0), 0);
    const debtSuppliers = Math.max(0, totalCost - paidSuppliers);

    return [
      op.code,
      op.name,
      op.businessUnit === 'receptivo' ? 'Turismo Receptivo' : op.businessUnit === 'salidas' ? 'Salidas Educativas' : 'Viajes Educativos',
      op.date,
      op.status,
      op.clientOrSchool || '-',
      op.passengerCount || 0,
      totalRevenue,
      totalCost,
      profit,
      `${margin.toFixed(1)}%`,
      op.receivedRevenue || 0,
      debtClients,
      paidSuppliers,
      debtSuppliers
    ];
  });
  const opData = [opHeaders, ...opRows];

  // Tab 3: Movimientos
  const movHeaders = [
    'ID',
    'Fecha',
    'Cuenta / Billetera',
    'Tipo',
    'Descripción',
    'Alias / Pagador MP',
    'Monto ($)',
    'Estado Conciliación',
    'Categoría',
    'ID Operación',
    'ID Proveedor'
  ];
  const movRows = payload.movements.map(m => [
    m.id,
    m.date,
    m.accountId,
    m.type,
    m.description,
    m.rawPayerOrAlias || '',
    m.amount,
    m.matchStatus === 'verde' ? 'Conciliado' : m.matchStatus === 'amarillo' ? 'Sugerido' : 'Sin Asignar',
    m.category || '',
    m.operationId || '',
    m.supplierId || ''
  ]);
  const movData = [movHeaders, ...movRows];

  // Tab 4: Proveedores
  const supHeaders = [
    'Nombre Proveedor',
    'Categoría',
    'Alias MP',
    'CBU / Banco',
    'Contacto / Teléfono',
    'Total Contratado ($)',
    'Total Pagado ($)',
    'Saldo Pendiente ($)'
  ];
  const supRows = payload.suppliers.map(s => {
    // calculate contracted and paid from operations
    let contracted = 0;
    let paid = 0;
    payload.operations.forEach(op => {
      (op.suppliers || []).forEach(c => {
        if (c.supplierId === s.id) {
          contracted += c.expectedCost || 0;
          paid += c.paidCost || 0;
        }
      });
    });
    return [
      s.name,
      s.category,
      s.mpAlias || '',
      s.cbu || s.bankAccount || '',
      s.phone || s.contactName || '',
      contracted,
      paid,
      Math.max(0, contracted - paid)
    ];
  });
  const supData = [supHeaders, ...supRows];

  // Tab 5: Gastos Fijos
  const fixHeaders = [
    'Proveedor / Concepto',
    'Descripción',
    'Categoría',
    'Monto ($)',
    'Frecuencia',
    'Día de Vencimiento',
    'Cuenta de Pago',
    'Estado'
  ];
  const fixRows = payload.fixedExpenses.map(f => [
    f.provider,
    f.description,
    f.category,
    f.amount,
    f.frequency,
    `Día ${f.dueDay}`,
    f.paidFromAccountId || 'Cuenta Principal',
    f.isPaidCurrentMonth ? 'Pagado este mes' : 'Pendiente'
  ]);
  const fixData = [fixHeaders, ...fixRows];

  // Tab 6: Estudiantes
  const stuHeaders = [
    'Operación / Viaje',
    'Colegio',
    'Nombre Estudiante',
    'Nombre Padre/Madre/Pagador',
    'Teléfono Contacto',
    'Cuota Total ($)',
    'Monto Pagado ($)',
    'Saldo Pendiente ($)',
    'Fecha Límite Pago',
    'Estado Cuota'
  ];
  const stuRows: any[][] = [];
  payload.operations.forEach(op => {
    (op.students || []).forEach(st => {
      stuRows.push([
        `${op.code} - ${op.name}`,
        op.clientOrSchool || '-',
        st.studentName,
        st.payerName,
        st.payerPhone || '',
        st.expectedAmount,
        st.paidAmount,
        Math.max(0, st.expectedAmount - st.paidAmount),
        st.paymentDueDate,
        st.status === 'al_dia' ? 'Al Día' : st.status === 'pago_parcial' ? 'Pago Parcial' : 'Sin Pago'
      ]);
    });
  });
  const stuData = [stuHeaders, ...stuRows];

  // 3. Batch update values to all sheets
  const batchData = [
    { range: 'Resumen y Proyecciones!A1', values: projectionData },
    { range: 'Operaciones!A1', values: opData },
    { range: 'Movimientos y Extractos!A1', values: movData },
    { range: 'Proveedores!A1', values: supData },
    { range: 'Gastos Fijos!A1', values: fixData },
    { range: 'Estudiantes y Pagadores!A1', values: stuData }
  ];

  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  await googleFetch(updateUrl, {
    method: 'POST',
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: batchData
    })
  });

  return { spreadsheetId, spreadsheetUrl };
}
