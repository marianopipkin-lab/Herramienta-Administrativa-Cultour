import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Operation,
  Supplier,
  FinancialAccount,
  FinancialMovement,
  FixedExpense,
  ClassificationRule,
  HistoricalPeriod,
  MonthlyClosing,
  CutoffConfig,
  AccountId,
  PaymentMethod,
  UserRole,
  Client,
  PaymentQuota,
  CollectionRecord,
  SupplierContract,
  SupplierPaymentRecord,
  ExchangeRateConfig,
  CultourFinancialPosition,
  Currency
} from '../types';
import {
  INITIAL_OPERATIONS,
  INITIAL_SUPPLIERS,
  INITIAL_ACCOUNTS,
  INITIAL_MOVEMENTS,
  INITIAL_FIXED_EXPENSES,
  INITIAL_RULES,
  INITIAL_HISTORICAL_PERIODS,
  INITIAL_MONTHLY_CLOSINGS,
  INITIAL_CUTOFF_CONFIG,
  INITIAL_CLIENTS
} from '../data/initialData';
import {
  calculateKPIs,
  calculateCultourFinancialPosition,
  generateMonthlyCashProjection,
  FinancialKPIs,
  MonthlyCashEvolution,
  DEFAULT_EXCHANGE_RATE
} from '../utils/financialCalculations';
import { ImportPreviewRow } from '../utils/excelParser';

const STORAGE_PREFIX = 'turismo_gestion_v2_';

interface AppContextType {
  // Roles & Permissions
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;

  // Navigation & UI state
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedOperationId: string | null;
  setSelectedOperationId: (id: string | null) => void;
  isNewOpModalOpen: boolean;
  setIsNewOpModalOpen: (open: boolean) => void;
  isImportModalOpen: boolean;
  setIsImportModalOpen: (open: boolean) => void;
  importCenterCategory: 'operations' | 'suppliers' | 'students' | 'movements' | 'fixed_expenses' | 'clients';
  setImportCenterCategory: (cat: 'operations' | 'suppliers' | 'students' | 'movements' | 'fixed_expenses' | 'clients') => void;
  openImportCenter: (category?: 'operations' | 'suppliers' | 'students' | 'movements' | 'fixed_expenses' | 'clients') => void;
  selectedStudentOpId: string | null;
  setSelectedStudentOpId: (id: string | null) => void;

  // Exchange rate config
  exchangeRate: ExchangeRateConfig;
  setExchangeRate: React.Dispatch<React.SetStateAction<ExchangeRateConfig>>;

  // Data Collections
  operations: Operation[];
  clients: Client[];
  suppliers: Supplier[];
  accounts: FinancialAccount[];
  movements: FinancialMovement[];
  fixedExpenses: FixedExpense[];
  rules: ClassificationRule[];
  historicalPeriods: HistoricalPeriod[];
  monthlyClosings: MonthlyClosing[];
  cutoffConfig: CutoffConfig;

  // Calculated properties
  kpis: FinancialKPIs;
  financialPosition: CultourFinancialPosition;
  monthlyProjection: MonthlyCashEvolution[];

  // Operation Actions
  addOperation: (opData: Partial<Operation>) => Operation;
  updateOperation: (id: string, updates: Partial<Operation>) => void;
  deleteOperation: (id: string) => void;
  batchImportOperations: (rows: ImportPreviewRow[]) => { created: number; updated: number; errors: number };

  // Client Actions
  addClient: (clientData: Omit<Client, 'id' | 'createdAt'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  batchImportClients: (newClients: Array<Omit<Client, 'id' | 'createdAt'>>) => { created: number; updated: number };

  // Collection & Quota Actions
  recordCollection: (col: {
    operationId: string;
    clientId?: string;
    clientName: string;
    quotaId?: string;
    concept: string;
    amount: number;
    currency?: Currency;
    paymentMethod: PaymentMethod;
    destinationAccountId: AccountId;
    notes?: string;
    voucherOrReference?: string;
  }) => void;

  recordSupplierPayment: (pay: {
    operationId: string;
    supplierId: string;
    supplierName: string;
    contractId?: string;
    concept: string;
    amount: number;
    currency?: Currency;
    paymentMethod: PaymentMethod;
    sourceAccountId: AccountId;
    notes?: string;
    reference?: string;
  }) => void;

  // Student Actions (Legacy & Direct)
  updateStudentPayment: (
    operationId: string,
    studentId: string,
    paidAmount: number,
    paymentMethod?: PaymentMethod,
    notes?: string
  ) => void;
  addStudentToOperation: (
    operationId: string,
    student: {
      studentName: string;
      payerName: string;
      payerPhone?: string;
      payerDni?: string;
      expectedAmount: number;
      paidAmount: number;
      paymentDueDate: string;
      paymentMethod?: PaymentMethod;
      notes?: string;
    }
  ) => void;
  batchImportStudents: (studentsList: Array<{
    operationCodeOrName: string;
    studentName: string;
    studentDni?: string;
    payerName?: string;
    payerPhone?: string;
    payerDni?: string;
    expectedAmount?: number;
    paidAmount?: number;
    paymentDueDate?: string;
    notes?: string;
  }>) => { created: number; errors: number };

  // Supplier Actions
  addSupplier: (sup: Omit<Supplier, 'id'>) => Supplier;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  batchImportSuppliers: (sups: Array<Omit<Supplier, 'id'>>) => { created: number; updated: number };

  // Account Actions
  addAccount: (acc: Partial<FinancialAccount>) => FinancialAccount;
  updateAccount: (id: AccountId, updates: Partial<FinancialAccount>) => void;
  deleteAccount: (id: AccountId) => void;
  updateAccountBalance: (accountId: AccountId, currentBalance: number) => void;
  updateCutoffConfig: (config: CutoffConfig) => void;

  // Movement & Reconciliation Actions
  addMovement: (mov: Partial<FinancialMovement>) => void;
  batchImportMovements: (newMovs: Partial<FinancialMovement>[]) => number;
  updateMovement: (id: string, updates: Partial<FinancialMovement>) => void;
  deleteMovement: (id: string) => void;
  clearMovementsOnly: () => void;
  reconcileMovement: (
    movementId: string,
    target: {
      operationId?: string;
      supplierId?: string;
      studentId?: string;
      category?: string;
      isInternalTransfer?: boolean;
      targetAccountId?: AccountId;
    }
  ) => void;
  learnRule: (rule: Omit<ClassificationRule, 'id' | 'createdAt'>) => void;
  deleteRule: (id: string) => void;

  // Fixed Expense Actions
  addFixedExpense: (exp: Omit<FixedExpense, 'id'>) => void;
  updateFixedExpense: (id: string, updates: Partial<FixedExpense>) => void;
  deleteFixedExpense: (id: string) => void;
  toggleFixedExpensePayment: (id: string) => void;
  batchImportFixedExpenses: (expenses: Array<Omit<FixedExpense, 'id'>>) => { created: number };

  // Monthly Closing Actions
  performMonthlyClosing: (yearMonth: string, notes?: string, actualCash?: number) => void;
  reopenMonthlyClosing: (id: string) => void;

  // Backup, Reset & Start From Scratch
  clearAllData: (options?: { resetBalancesToZero?: boolean }) => void;
  resetToDemoData: () => void;
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonStr: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Helper for localStorage
  const loadStored = <T,>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  };

  // 1. Roles & Permissions State (default: 'socio' for full testability)
  const [currentRole, setCurrentRole] = useState<UserRole>(() => loadStored('currentRole', 'socio'));

  // 2. Navigation & UI state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(null);
  const [selectedStudentOpId, setSelectedStudentOpId] = useState<string | null>('op_viaje_1');
  const [isNewOpModalOpen, setIsNewOpModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importCenterCategory, setImportCenterCategory] = useState<'operations' | 'suppliers' | 'students' | 'movements' | 'fixed_expenses' | 'clients'>('operations');

  const openImportCenter = (category?: 'operations' | 'suppliers' | 'students' | 'movements' | 'fixed_expenses' | 'clients') => {
    if (category) {
      setImportCenterCategory(category);
    }
    setIsImportModalOpen(true);
  };

  // 3. Exchange Rate Config
  const [exchangeRate, setExchangeRate] = useState<ExchangeRateConfig>(() => loadStored('exchangeRate', DEFAULT_EXCHANGE_RATE));

  // 4. Data State
  const [operations, setOperations] = useState<Operation[]>(() => loadStored('operations', INITIAL_OPERATIONS));
  const [clients, setClients] = useState<Client[]>(() => loadStored('clients', INITIAL_CLIENTS));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadStored('suppliers', INITIAL_SUPPLIERS));
  const [accounts, setAccounts] = useState<FinancialAccount[]>(() => loadStored('accounts', INITIAL_ACCOUNTS));
  const [movements, setMovements] = useState<FinancialMovement[]>(() => loadStored('movements', INITIAL_MOVEMENTS));
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>(() => loadStored('fixedExpenses', INITIAL_FIXED_EXPENSES));
  const [rules, setRules] = useState<ClassificationRule[]>(() => loadStored('rules', INITIAL_RULES));
  const [historicalPeriods] = useState<HistoricalPeriod[]>(() => loadStored('historical', INITIAL_HISTORICAL_PERIODS));
  const [monthlyClosings, setMonthlyClosings] = useState<MonthlyClosing[]>(() => loadStored('closings', INITIAL_MONTHLY_CLOSINGS));
  const [cutoffConfig, setCutoffConfig] = useState<CutoffConfig>(() => loadStored('cutoff', INITIAL_CUTOFF_CONFIG));

  // Persistence to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'currentRole', JSON.stringify(currentRole));
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'exchangeRate', JSON.stringify(exchangeRate));
  }, [exchangeRate]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'operations', JSON.stringify(operations));
  }, [operations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'movements', JSON.stringify(movements));
  }, [movements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'fixedExpenses', JSON.stringify(fixedExpenses));
  }, [fixedExpenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'rules', JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'closings', JSON.stringify(monthlyClosings));
  }, [monthlyClosings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'cutoff', JSON.stringify(cutoffConfig));
  }, [cutoffConfig]);

  // Derived Operational KPIs
  const kpis = useMemo(() => {
    return calculateKPIs(operations, accounts, fixedExpenses, movements);
  }, [operations, accounts, fixedExpenses, movements]);

  // Derived Cultour Financial Position (Strict Model for Socios)
  const financialPosition = useMemo(() => {
    return calculateCultourFinancialPosition(operations, accounts, fixedExpenses, exchangeRate);
  }, [operations, accounts, fixedExpenses, exchangeRate]);

  // Derived Monthly Cash Projection
  const monthlyProjection = useMemo(() => {
    return generateMonthlyCashProjection(
      kpis.currentCash,
      operations,
      fixedExpenses,
      historicalPeriods,
      monthlyClosings
    );
  }, [kpis.currentCash, operations, fixedExpenses, historicalPeriods, monthlyClosings]);

  // ==========================================
  // OPERACIONES CRUD & BATCH
  // ==========================================
  const addOperation = (opData: Partial<Operation>): Operation => {
    const now = new Date().toISOString();
    const newId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const prefix = opData.businessUnit === 'receptivo' ? 'TR' : opData.businessUnit === 'salidas' ? 'SE' : 'VE';
    const code = opData.code || `${prefix}-2026-${String(operations.length + 1).padStart(3, '0')}`;

    const newOp: Operation = {
      id: newId,
      code,
      name: opData.name || 'Nueva Operación',
      businessUnit: opData.businessUnit || 'receptivo',
      serviceType: opData.serviceType || 'Servicio Turístico',
      clientOrSchool: opData.clientOrSchool || 'Cliente General',
      clientId: opData.clientId,
      date: opData.date || now.split('T')[0],
      endDate: opData.endDate,
      passengerCount: opData.passengerCount || 1,
      status: opData.status || 'confirmada',
      responsiblePerson: opData.responsiblePerson || 'Administración',
      observations: opData.observations || '',
      currency: opData.currency || 'ARS',
      expectedRevenue: opData.expectedRevenue || 0,
      receivedRevenue: opData.receivedRevenue || 0,
      expectedCost: opData.expectedCost || 0,
      paidCost: opData.paidCost || 0,
      incomes: opData.incomes || [],
      suppliers: opData.suppliers || [],
      students: opData.students || [],
      quotas: opData.quotas || [],
      collections: opData.collections || [],
      supplierContracts: opData.supplierContracts || [],
      supplierPayments: opData.supplierPayments || [],
      createdAt: now,
      updatedAt: now
    };

    setOperations(prev => [newOp, ...prev]);
    return newOp;
  };

  const updateOperation = (id: string, updates: Partial<Operation>) => {
    setOperations(prev =>
      prev.map(op => {
        if (op.id !== id) return op;
        const now = new Date().toISOString();
        const updated = { ...op, ...updates, updatedAt: now };

        // Recalculate aggregates if items updated
        if (updates.incomes) {
          updated.receivedRevenue = updates.incomes
            .filter(inc => inc.status === 'cobrado')
            .reduce((sum, inc) => sum + inc.amount, 0);
        }
        if (updates.suppliers) {
          updated.paidCost = updates.suppliers.reduce((sum, sup) => sum + (sup.paidCost || 0), 0);
        }
        if (updates.students && updates.students.length > 0) {
          const studentPaidTotal = updates.students.reduce((sum, st) => sum + (st.paidAmount || 0), 0);
          if (studentPaidTotal > 0 && (!updates.receivedRevenue || updates.receivedRevenue < studentPaidTotal)) {
            updated.receivedRevenue = studentPaidTotal;
          }
        }

        return updated;
      })
    );
  };

  const deleteOperation = (id: string) => {
    setOperations(prev => prev.filter(op => op.id !== id));
    if (selectedOperationId === id) setSelectedOperationId(null);
  };

  const batchImportOperations = (rows: ImportPreviewRow[]) => {
    let created = 0;
    let updated = 0;
    let errors = 0;

    const opsToUpdateMap = new Map<string, Partial<Operation>>();
    const opsToCreate: Operation[] = [];
    const now = new Date().toISOString();

    rows.forEach(row => {
      if (row.status === 'error' || row.status === 'duplicate_in_file') {
        errors++;
        return;
      }

      if (row.status === 'update' && row.existingOperationId) {
        opsToUpdateMap.set(row.existingOperationId, {
          name: row.name,
          clientOrSchool: row.clientOrSchool,
          date: row.date,
          passengerCount: row.passengerCount,
          expectedRevenue: row.expectedRevenue,
          receivedRevenue: row.receivedRevenue,
          expectedCost: row.expectedCost,
          paidCost: row.paidCost,
          responsiblePerson: row.responsiblePerson,
          observations: row.observations,
        });
        updated++;
      } else if (row.status === 'new') {
        const newOp: Operation = {
          id: `op_imp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          code: row.code,
          name: row.name,
          businessUnit: row.businessUnit,
          currency: 'ARS',
          serviceType: row.serviceType,
          clientOrSchool: row.clientOrSchool,
          date: row.date,
          passengerCount: row.passengerCount,
          status: 'confirmada',
          responsiblePerson: row.responsiblePerson,
          observations: row.observations,
          expectedRevenue: row.expectedRevenue,
          receivedRevenue: row.receivedRevenue,
          expectedCost: row.expectedCost,
          paidCost: row.paidCost,
          incomes: [],
          suppliers: [],
          students: [],
          createdAt: now,
          updatedAt: now
        };
        opsToCreate.push(newOp);
        created++;
      }
    });

    setOperations(prev => {
      const next = prev.map(op => {
        if (opsToUpdateMap.has(op.id)) {
          return { ...op, ...opsToUpdateMap.get(op.id), updatedAt: now };
        }
        return op;
      });
      return [...opsToCreate, ...next];
    });

    return { created, updated, errors };
  };

  // ==========================================
  // CLIENTES Y PAGADORES CRUD & BATCH
  // ==========================================
  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>): Client => {
    const newId = `cli_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newClient: Client = {
      ...clientData,
      id: newId,
      createdAt: new Date().toISOString()
    };
    setClients(prev => [...prev, newClient]);
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(c => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c)));
  };

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const batchImportClients = (newClients: Array<Omit<Client, 'id' | 'createdAt'>>) => {
    let created = 0;
    let updated = 0;
    const existingMap = new Map<string, Client>();
    clients.forEach(c => existingMap.set(c.name.trim().toLowerCase(), c));

    const toAdd: Client[] = [];
    const updatesMap = new Map<string, Partial<Client>>();

    newClients.forEach(c => {
      const key = c.name.trim().toLowerCase();
      const existing = existingMap.get(key);
      if (existing) {
        updatesMap.set(existing.id, {
          email: c.email || existing.email,
          phone: c.phone || existing.phone,
          documentId: c.documentId || existing.documentId,
          institutionName: c.institutionName || existing.institutionName,
          parentOrGuardianName: c.parentOrGuardianName || existing.parentOrGuardianName,
          parentPhone: c.parentPhone || existing.parentPhone,
          notes: c.notes || existing.notes
        });
        updated++;
      } else {
        toAdd.push({
          ...c,
          id: `cli_imp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          createdAt: new Date().toISOString()
        });
        created++;
      }
    });

    setClients(prev => {
      const merged = prev.map(item => {
        if (updatesMap.has(item.id)) {
          return { ...item, ...updatesMap.get(item.id), updatedAt: new Date().toISOString() };
        }
        return item;
      });
      return [...merged, ...toAdd];
    });

    return { created, updated };
  };

  // ==========================================
  // COBRANZAS REALES & REGISTROS
  // ==========================================
  const recordCollection = (col: {
    operationId: string;
    clientId?: string;
    clientName: string;
    quotaId?: string;
    concept: string;
    amount: number;
    currency?: Currency;
    paymentMethod: PaymentMethod;
    destinationAccountId: AccountId;
    notes?: string;
    voucherOrReference?: string;
  }) => {
    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const newCollectionId = `col_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const targetAccount = accounts.find(a => a.id === col.destinationAccountId);
    const targetAccountName = targetAccount ? targetAccount.name : col.destinationAccountId;
    const colCurrency = col.currency || targetAccount?.currency || 'ARS';

    const newCollection: CollectionRecord = {
      id: newCollectionId,
      operationId: col.operationId,
      clientId: col.clientId,
      clientName: col.clientName,
      quotaId: col.quotaId,
      concept: col.concept,
      date: today,
      amount: col.amount,
      currency: colCurrency,
      paymentMethod: col.paymentMethod,
      destinationAccountId: col.destinationAccountId,
      destinationAccountName: targetAccountName,
      voucherOrReference: col.voucherOrReference,
      notes: col.notes,
      createdAt: now
    };

    // 1. Create corresponding Financial Movement
    const newMovementId = `mov_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newMov: FinancialMovement = {
      id: newMovementId,
      date: today,
      amount: col.amount,
      currency: colCurrency,
      type: 'ingreso',
      description: `Cobro: ${col.clientName} - ${col.concept}`,
      rawPayerOrAlias: col.clientName,
      accountId: col.destinationAccountId,
      category: 'Cobranza Operativa',
      operationId: col.operationId,
      clientId: col.clientId,
      matchStatus: 'verde',
      matchConfidence: 100,
      matchReason: `Cobro registrado en operación #${col.operationId}`,
      isInternalTransfer: false,
      importedAt: now
    };

    setMovements(prev => [newMov, ...prev]);

    // 2. Update Account Balance
    updateAccountBalance(col.destinationAccountId, (targetAccount?.currentBalance || 0) + col.amount);

    // 3. Update Operation Received Revenue
    setOperations(prev =>
      prev.map(op => {
        if (op.id !== col.operationId) return op;
        const currentCols = op.collections || [];
        const updatedCols = [...currentCols, { ...newCollection, movementId: newMovementId }];
        const newReceived = (op.receivedRevenue || 0) + col.amount;

        // Also add legacy income entry for backwards compatibility
        const newIncomeEntry = {
          id: `inc_${newCollectionId}`,
          operationId: op.id,
          date: today,
          amount: col.amount,
          currency: colCurrency,
          payerName: col.clientName,
          paymentMethod: col.paymentMethod,
          accountId: col.destinationAccountId,
          status: 'cobrado' as const,
          reference: col.voucherOrReference,
          movementId: newMovementId
        };

        return {
          ...op,
          collections: updatedCols,
          incomes: [...(op.incomes || []), newIncomeEntry],
          receivedRevenue: newReceived,
          updatedAt: now
        };
      })
    );
  };

  const recordSupplierPayment = (pay: {
    operationId: string;
    supplierId: string;
    supplierName: string;
    contractId?: string;
    concept: string;
    amount: number;
    currency?: Currency;
    paymentMethod: PaymentMethod;
    sourceAccountId: AccountId;
    notes?: string;
    reference?: string;
  }) => {
    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const newPaymentId = `spay_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    const sourceAccount = accounts.find(a => a.id === pay.sourceAccountId);
    const sourceAccountName = sourceAccount ? sourceAccount.name : pay.sourceAccountId;
    const payCurrency = pay.currency || sourceAccount?.currency || 'ARS';

    const newPaymentRecord: SupplierPaymentRecord = {
      id: newPaymentId,
      operationId: pay.operationId,
      supplierId: pay.supplierId,
      supplierName: pay.supplierName,
      contractId: pay.contractId,
      concept: pay.concept,
      date: today,
      amount: pay.amount,
      currency: payCurrency,
      paymentMethod: pay.paymentMethod,
      sourceAccountId: pay.sourceAccountId,
      sourceAccountName: sourceAccountName,
      reference: pay.reference,
      notes: pay.notes,
      createdAt: now
    };

    // 1. Create corresponding Financial Movement
    const newMovementId = `mov_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newMov: FinancialMovement = {
      id: newMovementId,
      date: today,
      amount: pay.amount,
      currency: payCurrency,
      type: 'egreso',
      description: `Pago Proveedor: ${pay.supplierName} - ${pay.concept}`,
      rawPayerOrAlias: pay.supplierName,
      accountId: pay.sourceAccountId,
      category: 'Pago Proveedor',
      operationId: pay.operationId,
      supplierId: pay.supplierId,
      matchStatus: 'verde',
      matchConfidence: 100,
      matchReason: `Pago registrado a proveedor ${pay.supplierName}`,
      isInternalTransfer: false,
      importedAt: now
    };

    setMovements(prev => [newMov, ...prev]);

    // 2. Update Account Balance
    updateAccountBalance(pay.sourceAccountId, (sourceAccount?.currentBalance || 0) - pay.amount);

    // 3. Update Operation Paid Cost
    setOperations(prev =>
      prev.map(op => {
        if (op.id !== pay.operationId) return op;
        const currentPayments = op.supplierPayments || [];
        const updatedPayments = [...currentPayments, { ...newPaymentRecord, movementId: newMovementId }];
        const newPaidCost = (op.paidCost || 0) + pay.amount;

        // Also update supplier cost record status if matching
        const updatedSuppliers = (op.suppliers || []).map(s => {
          if (s.supplierId === pay.supplierId || s.supplierName.toLowerCase() === pay.supplierName.toLowerCase()) {
            const nextPaid = (s.paidCost || 0) + pay.amount;
            const status = nextPaid >= s.expectedCost ? 'pagado' : nextPaid > 0 ? 'parcial' : 'pendiente';
            return { ...s, paidCost: nextPaid, status: status as any };
          }
          return s;
        });

        return {
          ...op,
          supplierPayments: updatedPayments,
          suppliers: updatedSuppliers,
          paidCost: newPaidCost,
          updatedAt: now
        };
      })
    );
  };

  // ==========================================
  // STUDENTS / PAGADORES
  // ==========================================
  const updateStudentPayment = (
    operationId: string,
    studentId: string,
    paidAmount: number,
    paymentMethod: PaymentMethod = 'mercado_pago',
    notes?: string
  ) => {
    setOperations(prev =>
      prev.map(op => {
        if (op.id !== operationId || !op.students) return op;

        const updatedStudents = op.students.map(st => {
          if (st.id !== studentId) return st;

          const isFullyPaid = paidAmount >= st.expectedAmount;
          const isPartial = paidAmount > 0 && paidAmount < st.expectedAmount;
          const status = isFullyPaid ? 'al_dia' : isPartial ? 'pago_parcial' : 'pendiente';

          return {
            ...st,
            paidAmount,
            status,
            paymentMethod,
            lastPaymentDate: new Date().toISOString().split('T')[0],
            notes: notes !== undefined ? notes : st.notes
          };
        });

        const totalStudentPaid = updatedStudents.reduce((sum, s) => sum + s.paidAmount, 0);

        return {
          ...op,
          students: updatedStudents,
          receivedRevenue: totalStudentPaid,
          updatedAt: new Date().toISOString()
        };
      })
    );
  };

  const addStudentToOperation = (
    operationId: string,
    studentData: {
      studentName: string;
      payerName: string;
      payerPhone?: string;
      payerDni?: string;
      expectedAmount: number;
      paidAmount: number;
      paymentDueDate: string;
      paymentMethod?: PaymentMethod;
      notes?: string;
    }
  ) => {
    setOperations(prev =>
      prev.map(op => {
        if (op.id !== operationId) return op;
        const currentStudents = op.students || [];
        const isFullyPaid = studentData.paidAmount >= studentData.expectedAmount;
        const isPartial = studentData.paidAmount > 0 && !isFullyPaid;
        const status = isFullyPaid ? 'al_dia' : isPartial ? 'pago_parcial' : 'pendiente';

        const newStudent = {
          id: `std_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          operationId,
          studentName: studentData.studentName,
          payerName: studentData.payerName,
          payerPhone: studentData.payerPhone,
          payerDni: studentData.payerDni,
          expectedAmount: studentData.expectedAmount,
          paidAmount: studentData.paidAmount,
          paymentDueDate: studentData.paymentDueDate,
          lastPaymentDate: studentData.paidAmount > 0 ? new Date().toISOString().split('T')[0] : undefined,
          paymentMethod: studentData.paymentMethod || 'mercado_pago',
          notes: studentData.notes,
          status
        };

        const updatedStudents = [...currentStudents, newStudent];
        const newExpectedRev = updatedStudents.reduce((sum, s) => sum + s.expectedAmount, 0);
        const newReceivedRev = updatedStudents.reduce((sum, s) => sum + s.paidAmount, 0);

        return {
          ...op,
          passengerCount: updatedStudents.length,
          expectedRevenue: newExpectedRev,
          receivedRevenue: newReceivedRev,
          students: updatedStudents,
          updatedAt: new Date().toISOString()
        };
      })
    );
  };

  const batchImportStudents = (studentsList: Array<{
    operationCodeOrName: string;
    studentName: string;
    studentDni?: string;
    payerName?: string;
    payerPhone?: string;
    payerDni?: string;
    expectedAmount?: number;
    paidAmount?: number;
    paymentDueDate?: string;
    notes?: string;
  }>) => {
    let created = 0;
    let errors = 0;

    setOperations(prev => {
      return prev.map(op => {
        const matchingStudents = studentsList.filter(s => {
          const target = (s.operationCodeOrName || '').toLowerCase().trim();
          return (
            target === op.code.toLowerCase().trim() ||
            op.name.toLowerCase().includes(target) ||
            (target && op.clientOrSchool.toLowerCase().includes(target))
          );
        });

        if (matchingStudents.length === 0) return op;

        const currentStudents = op.students || [];
        const newStudentRecords = matchingStudents.map((st, idx) => {
          const expected = st.expectedAmount || 0;
          const paid = st.paidAmount || 0;
          const isFullyPaid = paid >= expected && expected > 0;
          const isPartial = paid > 0 && !isFullyPaid;
          const status: 'al_dia' | 'pago_parcial' | 'pendiente' = isFullyPaid ? 'al_dia' : isPartial ? 'pago_parcial' : 'pendiente';

          return {
            id: `std_imp_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
            operationId: op.id,
            studentName: st.studentName,
            studentDni: st.studentDni,
            payerName: st.payerName || st.studentName,
            payerPhone: st.payerPhone,
            payerDni: st.payerDni,
            expectedAmount: expected,
            paidAmount: paid,
            paymentDueDate: st.paymentDueDate || op.date,
            lastPaymentDate: paid > 0 ? new Date().toISOString().split('T')[0] : undefined,
            paymentMethod: 'mercado_pago' as PaymentMethod,
            notes: st.notes,
            status
          };
        });

        const mergedStudents = [...currentStudents, ...newStudentRecords];
        created += newStudentRecords.length;

        const totalExpected = mergedStudents.reduce((sum, s) => sum + s.expectedAmount, 0);
        const totalPaid = mergedStudents.reduce((sum, s) => sum + s.paidAmount, 0);

        return {
          ...op,
          students: mergedStudents,
          passengerCount: mergedStudents.length,
          expectedRevenue: totalExpected > 0 ? totalExpected : op.expectedRevenue,
          receivedRevenue: totalPaid > 0 ? totalPaid : op.receivedRevenue,
          updatedAt: new Date().toISOString()
        };
      });
    });

    return { created, errors };
  };

  // ==========================================
  // SUPPLIERS CRUD
  // ==========================================
  const addSupplier = (sup: Omit<Supplier, 'id'>): Supplier => {
    const newId = `sup_${Date.now()}`;
    const newSup: Supplier = { ...sup, id: newId };
    setSuppliers(prev => [...prev, newSup]);

    if (sup.mpAlias) {
      learnRule({
        pattern: sup.mpAlias.trim(),
        ruleType: 'alias',
        targetSupplierId: newId,
        targetCategory: sup.category
      });
    }

    return newSup;
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  const batchImportSuppliers = (sups: Array<Omit<Supplier, 'id'>>) => {
    let created = 0;
    let updated = 0;
    const existingMap = new Map<string, Supplier>();
    suppliers.forEach(s => existingMap.set(s.name.trim().toLowerCase(), s));

    const newSuppliersToAdd: Supplier[] = [];
    const updatesMap = new Map<string, Partial<Supplier>>();

    sups.forEach((s, idx) => {
      const existing = existingMap.get(s.name.trim().toLowerCase());
      if (existing) {
        updatesMap.set(existing.id, {
          category: s.category || existing.category,
          mpAlias: s.mpAlias || existing.mpAlias,
          cbu: s.cbu || existing.cbu,
          contactName: s.contactName || existing.contactName,
          phone: s.phone || existing.phone,
          email: s.email || existing.email,
          serviceDescription: s.serviceDescription || existing.serviceDescription
        });
        updated++;
      } else {
        const newId = `sup_imp_${Date.now()}_${idx}`;
        newSuppliersToAdd.push({
          id: newId,
          name: s.name,
          category: s.category || 'Otros',
          mpAlias: s.mpAlias || '',
          cbu: s.cbu || '',
          contactName: s.contactName || '',
          phone: s.phone || '',
          email: s.email || '',
          serviceDescription: s.serviceDescription || '',
          active: true
        });
        created++;
      }
    });

    setSuppliers(prev => {
      const merged = prev.map(item => {
        if (updatesMap.has(item.id)) {
          return { ...item, ...updatesMap.get(item.id) };
        }
        return item;
      });
      return [...merged, ...newSuppliersToAdd];
    });

    return { created, updated };
  };

  // ==========================================
  // ACCOUNTS
  // ==========================================
  const addAccount = (acc: Partial<FinancialAccount>): FinancialAccount => {
    const newId = acc.id || `acc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newAccount: FinancialAccount = {
      id: newId,
      name: acc.name || 'Nueva Cuenta',
      type: acc.type || 'banco',
      currency: acc.currency || 'ARS',
      currentBalance: Number(acc.currentBalance) || 0,
      initialBalance: Number(acc.initialBalance ?? acc.currentBalance) || 0,
      alias: acc.alias || '',
      cbu: acc.cbu || '',
      holder: acc.holder || 'Titular',
      description: acc.description || ''
    };

    setAccounts(prev => [...prev, newAccount]);
    return newAccount;
  };

  const updateAccount = (id: AccountId, updates: Partial<FinancialAccount>) => {
    setAccounts(prev =>
      prev.map(acc => (acc.id === id ? { ...acc, ...updates } : acc))
    );
  };

  const deleteAccount = (id: AccountId) => {
    setAccounts(prev => prev.filter(acc => acc.id !== id));
  };

  const updateAccountBalance = (accountId: AccountId, currentBalance: number) => {
    setAccounts(prev =>
      prev.map(acc => (acc.id === accountId ? { ...acc, currentBalance } : acc))
    );
  };

  const updateCutoffConfig = (config: CutoffConfig) => {
    setCutoffConfig(config);
  };

  // ==========================================
  // MOVEMENTS & RECONCILIATION
  // ==========================================
  const addMovement = (mov: Partial<FinancialMovement>) => {
    const newId = `mov_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newMov: FinancialMovement = {
      id: newId,
      date: mov.date || new Date().toISOString().split('T')[0],
      amount: Math.abs(mov.amount || 0),
      currency: mov.currency || 'ARS',
      type: mov.type || 'ingreso',
      description: mov.description || 'Movimiento manual',
      rawPayerOrAlias: mov.rawPayerOrAlias,
      accountId: mov.accountId || 'mp_gaston',
      targetAccountId: mov.targetAccountId,
      category: mov.category,
      operationId: mov.operationId,
      supplierId: mov.supplierId,
      studentId: mov.studentId,
      clientId: mov.clientId,
      matchStatus: mov.matchStatus || (mov.operationId || mov.supplierId || mov.isInternalTransfer ? 'verde' : 'rojo'),
      matchConfidence: mov.matchConfidence || (mov.operationId ? 95 : 0),
      matchReason: mov.matchReason || (mov.isInternalTransfer ? 'Transferencia interna' : undefined),
      isInternalTransfer: !!mov.isInternalTransfer,
      notes: mov.notes,
      importedAt: new Date().toISOString()
    };

    setMovements(prev => [newMov, ...prev]);

    // Update account balances
    if (newMov.type === 'ingreso') {
      updateAccountBalance(newMov.accountId, (accounts.find(a => a.id === newMov.accountId)?.currentBalance || 0) + newMov.amount);
    } else if (newMov.type === 'egreso') {
      updateAccountBalance(newMov.accountId, (accounts.find(a => a.id === newMov.accountId)?.currentBalance || 0) - newMov.amount);
    } else if (newMov.type === 'transferencia_interna' && newMov.targetAccountId) {
      updateAccountBalance(newMov.accountId, (accounts.find(a => a.id === newMov.accountId)?.currentBalance || 0) - newMov.amount);
      updateAccountBalance(newMov.targetAccountId, (accounts.find(a => a.id === newMov.targetAccountId)?.currentBalance || 0) + newMov.amount);
    }
  };

  const batchImportMovements = (newMovs: Partial<FinancialMovement>[]): number => {
    let imported = 0;
    const processed: FinancialMovement[] = [];

    newMovs.forEach(raw => {
      const amount = Math.abs(raw.amount || 0);
      if (!amount) return;

      const desc = raw.description || '';
      const alias = raw.rawPayerOrAlias || '';
      const combinedText = `${desc} ${alias}`.toLowerCase();

      let matchedSupplierId: string | undefined = raw.supplierId;
      let matchedCategory: string | undefined = raw.category;
      let isInternal = !!raw.isInternalTransfer;
      let targetAcc = raw.targetAccountId;
      let matchStatus: 'verde' | 'amarillo' | 'rojo' = 'rojo';
      let confidence = 0;
      let reason = 'Movimiento no reconocido';

      if (
        combinedText.includes('transferencia entre cuentas') ||
        combinedText.includes('traspaso') ||
        (combinedText.includes('santander') && combinedText.includes('gaston')) ||
        (combinedText.includes('gaston') && combinedText.includes('maria'))
      ) {
        isInternal = true;
        matchStatus = 'verde';
        confidence = 100;
        reason = 'Transferencia interna detectada automáticamente';
      }

      if (!isInternal) {
        suppliers.forEach(s => {
          if (s.mpAlias && combinedText.includes(s.mpAlias.toLowerCase())) {
            matchedSupplierId = s.id;
            matchedCategory = s.category;
            matchStatus = 'verde';
            confidence = 100;
            reason = `Alias coincide con proveedor: ${s.name}`;
          }
        });
      }

      rules.forEach(rule => {
        if (rule.pattern && combinedText.includes(rule.pattern.toLowerCase())) {
          if (rule.targetSupplierId) matchedSupplierId = rule.targetSupplierId;
          if (rule.targetCategory) matchedCategory = rule.targetCategory;
          if (rule.isInternalTransfer) {
            isInternal = true;
            targetAcc = rule.destinationAccountId;
          }
          matchStatus = 'verde';
          confidence = 95;
          reason = `Regla aprendida aplicada: "${rule.pattern}"`;
        }
      });

      processed.push({
        id: `mov_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        date: raw.date || new Date().toISOString().split('T')[0],
        amount,
        currency: raw.currency || 'ARS',
        type: isInternal ? 'transferencia_interna' : (raw.type || 'ingreso'),
        description: desc || 'Movimiento importado',
        rawPayerOrAlias: alias,
        accountId: raw.accountId || 'mp_gaston',
        targetAccountId: targetAcc,
        category: matchedCategory,
        operationId: raw.operationId,
        supplierId: matchedSupplierId,
        studentId: raw.studentId,
        clientId: raw.clientId,
        matchStatus,
        matchConfidence: confidence,
        matchReason: reason,
        isInternalTransfer: isInternal,
        importedAt: new Date().toISOString()
      });
      imported++;
    });

    setMovements(prev => [...processed, ...prev]);
    return imported;
  };

  const updateMovement = (id: string, updates: Partial<FinancialMovement>) => {
    setMovements(prev => prev.map(m => (m.id === id ? { ...m, ...updates } : m)));
  };

  const deleteMovement = (id: string) => {
    setMovements(prev => prev.filter(m => m.id !== id));
  };

  const clearMovementsOnly = () => {
    setMovements([]);
  };

  const reconcileMovement = (
    movementId: string,
    target: {
      operationId?: string;
      supplierId?: string;
      studentId?: string;
      category?: string;
      isInternalTransfer?: boolean;
      targetAccountId?: AccountId;
    }
  ) => {
    setMovements(prev =>
      prev.map(m => {
        if (m.id !== movementId) return m;

        const isInternal = !!target.isInternalTransfer;
        return {
          ...m,
          operationId: target.operationId,
          supplierId: target.supplierId,
          studentId: target.studentId,
          category: target.category || m.category,
          isInternalTransfer: isInternal,
          type: isInternal ? 'transferencia_interna' : m.type,
          targetAccountId: target.targetAccountId,
          matchStatus: 'verde',
          matchConfidence: 100,
          matchReason: isInternal
            ? 'Transferencia interna conciliada'
            : target.operationId
            ? 'Conciliado manualmente con operación'
            : target.supplierId
            ? 'Conciliado manualmente con proveedor'
            : 'Conciliado manualmente'
        };
      })
    );
  };

  const learnRule = (rule: Omit<ClassificationRule, 'id' | 'createdAt'>) => {
    const newRule: ClassificationRule = {
      ...rule,
      id: `rule_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setRules(prev => [newRule, ...prev]);
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  // ==========================================
  // FIXED EXPENSES
  // ==========================================
  const addFixedExpense = (exp: Omit<FixedExpense, 'id'>) => {
    const newId = `fix_${Date.now()}`;
    setFixedExpenses(prev => [...prev, { ...exp, id: newId }]);
  };

  const updateFixedExpense = (id: string, updates: Partial<FixedExpense>) => {
    setFixedExpenses(prev => prev.map(f => (f.id === id ? { ...f, ...updates } : f)));
  };

  const deleteFixedExpense = (id: string) => {
    setFixedExpenses(prev => prev.filter(f => f.id !== id));
  };

  const toggleFixedExpensePayment = (id: string) => {
    setFixedExpenses(prev =>
      prev.map(f => {
        if (f.id !== id) return f;
        const willBePaid = !f.isPaidCurrentMonth;
        return {
          ...f,
          isPaidCurrentMonth: willBePaid,
          lastPaidDate: willBePaid ? new Date().toISOString().split('T')[0] : f.lastPaidDate
        };
      })
    );
  };

  const batchImportFixedExpenses = (expenses: Array<Omit<FixedExpense, 'id'>>) => {
    let created = 0;
    const newItems: FixedExpense[] = expenses.map((exp, idx) => ({
      ...exp,
      id: `fix_imp_${Date.now()}_${idx}`
    }));

    setFixedExpenses(prev => [...prev, ...newItems]);
    created = newItems.length;
    return { created };
  };

  // ==========================================
  // MONTHLY CLOSING
  // ==========================================
  const performMonthlyClosing = (yearMonth: string, notes?: string, actualCashInput?: number) => {
    const actualCash = actualCashInput !== undefined ? actualCashInput : kpis.currentCash;

    const monthMovs = movements.filter(m => m.date.startsWith(yearMonth));
    const income = monthMovs.filter(m => m.type === 'ingreso').reduce((sum, m) => sum + m.amount, 0);
    const expense = monthMovs.filter(m => m.type === 'egreso').reduce((sum, m) => sum + m.amount, 0);
    const internal = monthMovs.filter(m => m.type === 'transferencia_interna').reduce((sum, m) => sum + m.amount, 0);

    const initialCash: number = cutoffConfig.accountsInitialBalances
      ? (Object.values(cutoffConfig.accountsInitialBalances) as number[]).reduce((a: number, b: number) => a + b, 0)
      : 42270000;
    const calculatedFinalCash = initialCash + income - expense;
    const diff = actualCash - calculatedFinalCash;

    const closing: MonthlyClosing = {
      id: `close_${yearMonth.replace('-', '_')}`,
      yearMonth,
      closedAt: new Date().toISOString(),
      status: Math.abs(diff) < 1000 ? 'cerrado' : 'en_revision',
      initialCash,
      totalIncome: income,
      totalExpense: expense,
      internalTransfersSum: internal,
      calculatedFinalCash,
      actualAccountCash: actualCash,
      reconciliationDifference: diff,
      operationsCount: operations.filter(op => op.date.startsWith(yearMonth)).length,
      closedBy: 'Administración',
      notes: notes || 'Cierre mensual procesado desde panel'
    };

    setMonthlyClosings(prev => {
      const filtered = prev.filter(c => c.yearMonth !== yearMonth);
      return [closing, ...filtered];
    });
  };

  const reopenMonthlyClosing = (id: string) => {
    setMonthlyClosings(prev =>
      prev.map(c => (c.id === id ? { ...c, status: 'en_revision', closedAt: undefined } : c))
    );
  };

  // ==========================================
  // RESET & EXPORT/IMPORT & START FROM SCRATCH
  // ==========================================
  const clearAllData = (options?: { resetBalancesToZero?: boolean }) => {
    setOperations([]);
    setClients([]);
    setSuppliers([]);
    setMovements([]);
    setFixedExpenses([]);
    setRules([]);
    setMonthlyClosings([]);
    setSelectedOperationId(null);
    setSelectedStudentOpId(null);

    if (options?.resetBalancesToZero) {
      setAccounts(prev =>
        prev.map(acc => ({
          ...acc,
          currentBalance: 0,
          initialBalance: 0
        }))
      );
      setCutoffConfig({
        cutoffDate: new Date().toISOString().split('T')[0],
        description: 'Base limpia iniciada con saldos en cero.',
        accountsInitialBalances: {},
        initialFixedCostsMonthly: 0
      });
    }
  };

  const resetToDemoData = () => {
    setOperations(INITIAL_OPERATIONS);
    setClients(INITIAL_CLIENTS);
    setSuppliers(INITIAL_SUPPLIERS);
    setAccounts(INITIAL_ACCOUNTS);
    setMovements(INITIAL_MOVEMENTS);
    setFixedExpenses(INITIAL_FIXED_EXPENSES);
    setRules(INITIAL_RULES);
    setMonthlyClosings(INITIAL_MONTHLY_CLOSINGS);
    setCutoffConfig(INITIAL_CUTOFF_CONFIG);
  };

  const exportDatabaseJSON = (): string => {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        version: '2.0',
        currentRole,
        exchangeRate,
        operations,
        clients,
        suppliers,
        accounts,
        movements,
        fixedExpenses,
        rules,
        monthlyClosings,
        cutoffConfig
      },
      null,
      2
    );
  };

  const importDatabaseJSON = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.operations) setOperations(data.operations);
      if (data.clients) setClients(data.clients);
      if (data.suppliers) setSuppliers(data.suppliers);
      if (data.accounts) setAccounts(data.accounts);
      if (data.movements) setMovements(data.movements);
      if (data.fixedExpenses) setFixedExpenses(data.fixedExpenses);
      if (data.rules) setRules(data.rules);
      if (data.monthlyClosings) setMonthlyClosings(data.monthlyClosings);
      if (data.cutoffConfig) setCutoffConfig(data.cutoffConfig);
      if (data.exchangeRate) setExchangeRate(data.exchangeRate);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole,

        activeTab,
        setActiveTab,
        selectedOperationId,
        setSelectedOperationId,
        isNewOpModalOpen,
        setIsNewOpModalOpen,
        isImportModalOpen,
        setIsImportModalOpen,
        importCenterCategory,
        setImportCenterCategory,
        openImportCenter,
        selectedStudentOpId,
        setSelectedStudentOpId,

        exchangeRate,
        setExchangeRate,

        operations,
        clients,
        suppliers,
        accounts,
        movements,
        fixedExpenses,
        rules,
        historicalPeriods,
        monthlyClosings,
        cutoffConfig,

        kpis,
        financialPosition,
        monthlyProjection,

        addOperation,
        updateOperation,
        deleteOperation,
        batchImportOperations,

        addClient,
        updateClient,
        deleteClient,
        batchImportClients,

        recordCollection,
        recordSupplierPayment,

        updateStudentPayment,
        addStudentToOperation,
        batchImportStudents,

        addSupplier,
        updateSupplier,
        deleteSupplier,
        batchImportSuppliers,

        addAccount,
        updateAccount,
        deleteAccount,
        updateAccountBalance,
        updateCutoffConfig,

        addMovement,
        batchImportMovements,
        updateMovement,
        deleteMovement,
        clearMovementsOnly,
        reconcileMovement,
        learnRule,
        deleteRule,

        addFixedExpense,
        updateFixedExpense,
        deleteFixedExpense,
        toggleFixedExpensePayment,
        batchImportFixedExpenses,

        performMonthlyClosing,
        reopenMonthlyClosing,

        clearAllData,
        resetToDemoData,
        exportDatabaseJSON,
        importDatabaseJSON
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
