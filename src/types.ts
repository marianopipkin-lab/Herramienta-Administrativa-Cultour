export type BusinessUnit = 'receptivo' | 'salidas' | 'viajes';

export type OperationStatus = 'confirmada' | 'en_curso' | 'realizada' | 'cancelada' | 'presupuesto';

export type Currency = 'ARS' | 'USD';

export type PaymentMethod = 
  | 'mercado_pago' 
  | 'wetravel' 
  | 'paypal' 
  | 'transferencia' 
  | 'efectivo' 
  | 'tarjeta' 
  | 'cheque' 
  | 'otro';

export type AccountId = string;

export type UserRole = 'socio' | 'administrativo' | 'operativo';

export type ClientType = 'turista' | 'agencia' | 'escuela' | 'alumno' | 'empresa' | 'otro';

export type QuotaType = 'seña' | 'cuota_1' | 'cuota_2' | 'cuota_3' | 'saldo' | 'pago_unico';

export type QuotaStatus = 'pendiente' | 'parcial' | 'pagada' | 'vencida';

// ==========================================
// 1. CLIENTES Y PAGADORES (Maestro Unificado)
// ==========================================
export interface Client {
  id: string;
  type: ClientType; // 'turista' | 'agencia' | 'escuela' | 'alumno' | 'empresa'
  name: string;
  documentId?: string; // DNI / CUIT / Pasaporte / Tax ID
  email?: string;
  phone?: string;
  address?: string;
  country?: string; // e.g. 'Argentina', 'Brasil', 'USA', 'Uruguay'
  
  // Específico para Agencias de Viajes (B2B)
  agencyCommercialName?: string;
  agencyContactPerson?: string;
  agencyCountry?: string;
  commissionRate?: number; // Porcentaje de comisión ej: 15
  commercialConditions?: string;
  paymentTerms?: string; // ej: 'Pago total 7 días antes de la operación'

  // Específico para Alumnos / Escuelas
  institutionName?: string; // Para alumnos: nombre de la escuela/institución
  gradeOrGroup?: string; // Para alumnos: ej. '7mo Grado A'
  parentOrGuardianName?: string; // Para alumnos: Padre/Madre/Tutor
  parentPhone?: string;
  parentEmail?: string;
  
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// ==========================================
// 2. CUOTAS Y OBLIGACIONES DE PAGO
// ==========================================
export interface PaymentQuota {
  id: string;
  operationId: string;
  clientId?: string; // Vinculado al cliente / pagador específico
  clientName: string;
  quotaType: QuotaType;
  quotaNumber?: number; // 1, 2, 3...
  amount: number;
  currency: Currency; // ARS o USD original
  dueDate: string; // YYYY-MM-DD
  status: QuotaStatus;
  paidAmount: number;
  balance: number;
  expectedPaymentMethod?: PaymentMethod;
  destinationAccountId?: AccountId; // Cuenta real esperada
  notes?: string;
}

// ==========================================
// 3. COBROS REALIZADOS (Ingresos Registrados)
// ==========================================
export interface CollectionRecord {
  id: string;
  operationId: string;
  operationCode?: string;
  clientId?: string;
  clientName: string;
  quotaId?: string;
  concept: string; // ej. 'Seña', 'Cuota 1', 'Pago total'
  date: string; // YYYY-MM-DD
  amount: number;
  currency: Currency; // ARS o USD original
  paymentMethod: PaymentMethod; // ej. 'mercado_pago', 'paypal', 'wetravel'
  destinationAccountId: AccountId; // Cuenta destino real ej. 'mp_mariano', 'paypal_cultour'
  destinationAccountName?: string;
  voucherOrReference?: string;
  movementId?: string; // Vinculado a extracto
  notes?: string;
  createdAt: string;
}

// ==========================================
// 4. SERVICIOS Y COSTOS DE PROVEEDORES
// ==========================================
export interface SupplierContract {
  id: string;
  operationId: string;
  supplierId: string;
  supplierName: string;
  serviceCategory: string; // 'Transporte', 'Alojamiento', 'Gastronomía', 'Guías', 'Seguros', 'Entradas', 'Otros'
  serviceDescription?: string;
  expectedCost: number;
  currency: Currency; // ARS o USD
  dueDate: string; // Fecha límite de pago
  paidAmount: number;
  balance: number;
  status: 'pendiente' | 'parcial' | 'pagado' | 'vencido';
  sourceAccountId?: AccountId; // Cuenta desde la que se paga
  movementId?: string;
  notes?: string;
}

export interface SupplierPaymentRecord {
  id: string;
  operationId: string;
  supplierId: string;
  supplierName: string;
  contractId?: string;
  concept: string;
  date: string;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  sourceAccountId: AccountId;
  sourceAccountName?: string;
  reference?: string;
  movementId?: string;
  notes?: string;
  createdAt: string;
}

// ==========================================
// 5. OPERACIÓN / FILE (Núcleo del Sistema)
// ==========================================
export interface OperationIncomeRecord {
  id: string;
  operationId: string;
  date: string;
  amount: number;
  currency?: Currency;
  payerName: string;
  paymentMethod: PaymentMethod;
  accountId: AccountId;
  status: 'cobrado' | 'pendiente' | 'vencido';
  studentId?: string;
  reference?: string;
  movementId?: string;
}

export interface SupplierCostRecord {
  id: string;
  operationId: string;
  supplierId: string;
  supplierName: string;
  serviceCategory: string;
  mpAlias?: string;
  expectedCost: number;
  paidCost: number;
  currency?: Currency;
  expectedPaymentDate: string;
  actualPaymentDate?: string;
  paidFromAccountId?: AccountId;
  paymentMethod?: PaymentMethod;
  status: 'pagado' | 'parcial' | 'pendiente' | 'vencido';
  movementId?: string;
  notes?: string;
}

export interface StudentPayer {
  id: string;
  operationId: string;
  studentName: string;
  studentDni?: string;
  payerName: string;
  payerDni?: string;
  payerPhone?: string;
  payerEmail?: string;
  expectedAmount: number;
  paidAmount: number;
  currency?: Currency;
  paymentDueDate: string;
  lastPaymentDate?: string;
  paymentMethod?: PaymentMethod;
  destinationAccountId?: AccountId;
  notes?: string;
  status: 'al_dia' | 'pago_parcial' | 'pendiente' | 'vencido';
}

export interface OperationPassenger {
  id: string;
  name: string;
  documentId?: string;
  country?: string;
  email?: string;
  phone?: string;
  isPayer?: boolean;
  dietaryRestrictions?: string;
  notes?: string;
}

export interface OperationChecklist {
  transportConfirmed: boolean;
  guideAssigned: boolean;
  ticketsAcquired: boolean;
  insuranceEmitted: boolean;
  itinerarySent: boolean;
}

export interface Operation {
  id: string;
  code: string; // e.g. TR-2026-042, SE-2026-015, VE-2026-001
  name: string;
  businessUnit: BusinessUnit; // 'receptivo' | 'salidas' | 'viajes'
  receptiveChannel?: 'directo' | 'agencia'; // Para Turismo Receptivo
  educationalModality?: 'salidas' | 'viajes'; // Para Turismo Educativo
  serviceType: string; // e.g. 'Tour Privado Receptivo', 'Salida Museo', 'Viaje Egresados'
  clientOrSchool: string;
  clientId?: string; // Vinculación a Maestro de Clientes
  agencyId?: string; // Si canal es 'agencia'
  agencyName?: string;
  schoolId?: string; // Si es educativo
  schoolName?: string;
  destination?: string; // ej: 'Buenos Aires / Tigre', 'Bariloche', 'Mendoza'
  date: string; // YYYY-MM-DD
  endDate?: string;
  passengerCount: number;
  status: OperationStatus;
  responsiblePerson: string;
  observations: string;
  currency: Currency; // Divisa operativa de la operación (ARS o USD)

  // Financieros
  expectedRevenue: number;
  receivedRevenue: number;
  expectedCost: number;
  paidCost: number;

  // Pasajeros y checklist operativo
  passengers?: OperationPassenger[];
  checklist?: OperationChecklist;

  // Colecciones operativas y cuotas
  quotas?: PaymentQuota[];
  collections?: CollectionRecord[];
  supplierContracts?: SupplierContract[];
  supplierPayments?: SupplierPaymentRecord[];

  // Compatibilidad con registros existentes
  incomes: OperationIncomeRecord[];
  suppliers: SupplierCostRecord[];
  students?: StudentPayer[];

  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 6. PROVEEDORES (Maestro Único)
// ==========================================
export interface Supplier {
  id: string;
  name: string;
  mpAlias?: string;
  cbu?: string;
  bankAccount?: string;
  category: string; // 'Transporte', 'Alojamiento', 'Gastronomía', 'Guías', 'Seguros', 'Entradas', 'Otros'
  serviceDescription: string;
  contactName?: string;
  phone?: string;
  email?: string;
  currency?: Currency;
  defaultAccountId?: AccountId;
  active: boolean;
}

// ==========================================
// 7. CUENTAS & TESORERÍA
// ==========================================
export interface FinancialAccount {
  id: AccountId;
  name: string; // ej. 'Mercado Pago Mariano', 'PayPal Cultour', 'Banco Santander'
  type: 'mercado_pago' | 'banco' | 'paypal' | 'wetravel' | 'efectivo' | 'inversion';
  currency: Currency; // 'ARS' | 'USD'
  currentBalance: number;
  initialBalance: number;
  alias?: string;
  cbu?: string;
  holder: string;
  description: string;
  active?: boolean;
}

export type MovementType = 'ingreso' | 'egreso' | 'transferencia_interna';
export type MatchStatus = 'verde' | 'amarillo' | 'rojo';

export interface FinancialMovement {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  currency?: Currency;
  type: MovementType;
  description: string;
  rawPayerOrAlias?: string;
  accountId: AccountId;
  targetAccountId?: AccountId; // Para transferencias internas
  category?: string;
  operationId?: string;
  supplierId?: string;
  studentId?: string;
  clientId?: string;
  matchStatus: MatchStatus;
  matchConfidence?: number;
  matchReason?: string;
  isInternalTransfer: boolean;
  notes?: string;
  importedAt: string;
}

// ==========================================
// 8. CONCILIACIÓN DE PLATAFORMAS
// ==========================================
export interface PlatformReconciliation {
  id: string;
  platform: 'mercado_pago' | 'paypal' | 'wetravel' | 'banco';
  accountId: AccountId;
  accountName: string;
  periodMonth: string; // '2026-08'
  currency: Currency;
  systemRegisteredTotal: number;
  platformImportedTotal: number;
  difference: number;
  status: 'conciliado' | 'con_diferencias' | 'pendiente';
  reconciledAt?: string;
  notes?: string;
}

// ==========================================
// 9. CONFIGURACIÓN Y FINANZAS
// ==========================================
export interface ClassificationRule {
  id: string;
  pattern: string;
  ruleType: 'alias' | 'payer_name' | 'keyword' | 'internal_transfer';
  targetSupplierId?: string;
  targetCategory?: string;
  targetOperationId?: string;
  isInternalTransfer?: boolean;
  sourceAccountId?: AccountId;
  destinationAccountId?: AccountId;
  createdAt: string;
}

export type FixedExpenseCategory = 'empleados' | 'marketing' | 'tecnologia' | 'administracion' | 'otros';

export interface FixedExpense {
  id: string;
  category: FixedExpenseCategory;
  provider: string;
  description: string;
  amount: number;
  currency: Currency;
  frequency: 'mensual' | 'anual' | 'quincenal' | 'trimestral';
  dueDay: number;
  paidFromAccountId: AccountId;
  status: 'activo' | 'pausado';
  lastPaidDate?: string;
  isPaidCurrentMonth?: boolean;
}

export interface HistoricalPeriod {
  id: string;
  yearMonth: string;
  businessUnit: BusinessUnit;
  revenue: number;
  expenses: number;
  result: number;
  operationsCount: number;
  notes?: string;
}

export interface MonthlyClosing {
  id: string;
  yearMonth: string;
  closedAt?: string;
  status: 'cerrado' | 'pendiente' | 'en_revision';
  initialCash: number;
  totalIncome: number;
  totalExpense: number;
  internalTransfersSum: number;
  calculatedFinalCash: number;
  actualAccountCash: number;
  reconciliationDifference: number;
  operationsCount: number;
  closedBy?: string;
  notes?: string;
}

export interface CutoffConfig {
  cutoffDate: string;
  description: string;
  accountsInitialBalances: Record<AccountId, number>;
  initialFixedCostsMonthly: number;
}

export interface ExchangeRateConfig {
  usdToArsRate: number; // e.g. 1320
  rateDate: string; // YYYY-MM-DD
  sourceLabel: string; // e.g. 'Dólar MEP / Referencia Cultour'
}

// ==========================================
// 10. MODELO FINANCIERO RIGUROSO (SOCIOS)
// ==========================================
export interface CultourFinancialPosition {
  // 1. Dinero actualmente existente en cuentas
  cashARS: number;
  cashUSD: number;
  cashEquivalentUSD: number;

  // 2. Dinero cobrado correspondiente a operaciones futuras (anticipos / pasivo)
  futureOpsCollectedARS: number;
  futureOpsCollectedUSD: number;
  futureOpsCollectedEquivalentUSD: number;

  // 3. Costos / pagos pendientes de operaciones futuras
  futureOpsPendingCostsARS: number;
  futureOpsPendingCostsUSD: number;
  futureOpsPendingCostsEquivalentUSD: number;

  // 4. Dinero comprometido total (Costos pendientes futuras + Gastos fijos mes)
  committedFundsARS: number;
  committedFundsUSD: number;
  committedFundsEquivalentUSD: number;

  // 5. Resultado / ganancia de operaciones ya realizadas
  pastOpsRealizedProfitARS: number;
  pastOpsRealizedProfitUSD: number;
  pastOpsRealizedProfitEquivalentUSD: number;

  // 6. Resultado proyectado de operaciones futuras
  futureOpsProjectedProfitARS: number;
  futureOpsProjectedProfitUSD: number;
  futureOpsProjectedProfitEquivalentUSD: number;

  // 7. Ganancia disponible real
  availableProfitARS: number;
  availableProfitUSD: number;
  availableProfitEquivalentUSD: number;

  // Rendimiento por Unidad de Negocio
  byBusinessUnit: {
    receptivo: { revenue: number; costs: number; profit: number; margin: number; opsCount: number; currency: Currency };
    salidas: { revenue: number; costs: number; profit: number; margin: number; opsCount: number; currency: Currency };
    viajes: { revenue: number; costs: number; profit: number; margin: number; opsCount: number; currency: Currency };
  };
}

export interface FilterOptions {
  businessUnit: string;
  status: string;
  dateRange: 'all' | 'past' | 'future' | 'this_month' | 'next_month' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
  paymentStatus: 'all' | 'cobrado_total' | 'cobro_pendiente' | 'pagado_total' | 'pago_pendiente';
  searchQuery: string;
  clientQuery: string;
}
