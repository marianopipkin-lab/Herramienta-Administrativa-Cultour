export type BusinessUnit = 'receptivo' | 'salidas' | 'viajes';

export type OperationStatus = 'confirmada' | 'en_curso' | 'realizada' | 'cancelada' | 'presupuesto';

export type PaymentMethod = 'mercado_pago' | 'transferencia' | 'efectivo' | 'tarjeta' | 'cheque' | 'otro';

export type AccountId = string;

export interface FinancialAccount {
  id: AccountId;
  name: string;
  type: 'mercado_pago' | 'banco' | 'efectivo' | 'inversion';
  currency: 'ARS' | 'USD';
  currentBalance: number;
  initialBalance: number; // At cutoff date
  alias?: string;
  cbu?: string;
  holder: string;
  description: string;
}

export interface StudentPayer {
  id: string;
  operationId: string;
  studentName: string;
  studentDni?: string;
  payerName: string; // Padre/Madre/Tutor
  payerDni?: string;
  payerPhone?: string;
  payerEmail?: string;
  expectedAmount: number;
  paidAmount: number;
  paymentDueDate: string;
  lastPaymentDate?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  status: 'al_dia' | 'pago_parcial' | 'pendiente' | 'vencido';
}

export interface OperationIncomeRecord {
  id: string;
  operationId: string;
  date: string;
  amount: number;
  payerName: string;
  paymentMethod: PaymentMethod;
  accountId: AccountId;
  status: 'cobrado' | 'pendiente' | 'vencido';
  studentId?: string;
  reference?: string;
  movementId?: string; // Linked financial movement
}

export interface SupplierCostRecord {
  id: string;
  operationId: string;
  supplierId: string;
  supplierName: string;
  serviceCategory: string; // 'Transporte', 'Alojamiento', 'Guía', 'Gastronomía', 'Entradas', 'Seguros', 'Otros'
  mpAlias?: string;
  expectedCost: number;
  paidCost: number;
  expectedPaymentDate: string;
  actualPaymentDate?: string;
  paidFromAccountId?: AccountId;
  paymentMethod?: PaymentMethod;
  status: 'pagado' | 'parcial' | 'pendiente' | 'vencido';
  movementId?: string; // Linked financial movement
  notes?: string;
}

export interface Operation {
  id: string;
  code: string; // e.g. OP-2026-084
  name: string;
  businessUnit: BusinessUnit;
  serviceType: string; // e.g., 'Tour Privado', 'Visita Museo & Fábrica', 'Viaje Egresados Villa Carlos Paz'
  clientOrSchool: string;
  date: string; // Main date or start date (YYYY-MM-DD)
  endDate?: string;
  passengerCount: number;
  status: OperationStatus;
  responsiblePerson: string;
  observations: string;

  // Financial aggregates
  expectedRevenue: number;
  receivedRevenue: number;
  expectedCost: number;
  paidCost: number;

  // Collections
  incomes: OperationIncomeRecord[];
  suppliers: SupplierCostRecord[];
  students?: StudentPayer[];

  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  mpAlias?: string;
  cbu?: string;
  bankAccount?: string;
  category: string; // 'Transporte', 'Alojamiento', 'Gastronomía', 'Guías', 'Seguros', 'Entradas', 'Coordinación', 'Otros'
  serviceDescription: string;
  contactName?: string;
  phone?: string;
  email?: string;
  defaultAccountId?: AccountId;
  active: boolean;
}

export type MovementType = 'ingreso' | 'egreso' | 'transferencia_interna';
export type MatchStatus = 'verde' | 'amarillo' | 'rojo'; // verde=auto/confirmado, amarillo=probable, rojo=sin_asignar

export interface FinancialMovement {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number; // Always positive
  type: MovementType;
  description: string;
  rawPayerOrAlias?: string;
  accountId: AccountId;
  targetAccountId?: AccountId; // If transferencia_interna
  category?: string;
  operationId?: string;
  supplierId?: string;
  studentId?: string;
  matchStatus: MatchStatus;
  matchConfidence?: number; // 0 to 100
  matchReason?: string;
  isInternalTransfer: boolean;
  notes?: string;
  importedAt: string;
}

export interface ClassificationRule {
  id: string;
  pattern: string; // regex or keyword in description / alias / rawPayer
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
  currency: 'ARS' | 'USD';
  frequency: 'mensual' | 'anual' | 'quincenal' | 'trimestral';
  dueDay: number; // Day of month 1-31
  paidFromAccountId: AccountId;
  status: 'activo' | 'pausado';
  lastPaidDate?: string;
  isPaidCurrentMonth?: boolean;
}

export interface HistoricalPeriod {
  id: string;
  yearMonth: string; // e.g. '2026-06', '2026-07'
  businessUnit: BusinessUnit;
  revenue: number;
  expenses: number;
  result: number; // revenue - expenses
  operationsCount: number;
  notes?: string;
}

export interface MonthlyClosing {
  id: string;
  yearMonth: string; // e.g. '2026-08'
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
  cutoffDate: string; // e.g. '2026-08-31'
  description: string;
  accountsInitialBalances: Record<AccountId, number>;
  initialFixedCostsMonthly: number;
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
