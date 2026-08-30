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
  PaymentMethod
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
  INITIAL_CUTOFF_CONFIG
} from '../data/initialData';
import {
  calculateKPIs,
  generateMonthlyCashProjection,
  FinancialKPIs,
  MonthlyCashEvolution
} from '../utils/financialCalculations';
import { ImportPreviewRow } from '../utils/excelParser';

const STORAGE_PREFIX = 'turismo_gestion_v1_';

interface AppContextType {
  // Navigation & UI state
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedOperationId: string | null;
  setSelectedOperationId: (id: string | null) => void;
  isNewOpModalOpen: boolean;
  setIsNewOpModalOpen: (open: boolean) => void;
  isImportModalOpen: boolean;
  setIsImportModalOpen: (open: boolean) => void;
  importCenterCategory: 'operations' | 'suppliers' | 'students' | 'movements' | 'fixed_expenses';
  setImportCenterCategory: (cat: 'operations' | 'suppliers' | 'students' | 'movements' | 'fixed_expenses') => void;
  openImportCenter: (category?: 'operations' | 'suppliers' | 'students' | 'movements' | 'fixed_expenses') => void;
  selectedStudentOpId: string | null;
  setSelectedStudentOpId: (id: string | null) => void;

  // Data
  operations: Operation[];
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
  monthlyProjection: MonthlyCashEvolution[];

  // Operation Actions
  addOperation: (opData: Partial<Operation>) => Operation;
  updateOperation: (id: string, updates: Partial<Operation>) => void;
  deleteOperation: (id: string) => void;
  batchImportOperations: (rows: ImportPreviewRow[]) => { created: number; updated: number; errors: number };

  // Student Actions
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
  // Load initial from localStorage or fall back to demo
  const loadStored = <T,>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  };

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(null);
  const [selectedStudentOpId, setSelectedStudentOpId] = useState<string | null>('op_viaje_1');
  const [isNewOpModalOpen, setIsNewOpModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [importCenterCategory, setImportCenterCategory] = useState<'operations' | 'suppliers' | 'students' | 'movements' | 'fixed_expenses'>('operations');

  const openImportCenter = (category?: 'operations' | 'suppliers' | 'students' | 'movements' | 'fixed_expenses') => {
    if (category) {
      setImportCenterCategory(category);
    }
    setIsImportModalOpen(true);
  };

  const [operations, setOperations] = useState<Operation[]>(() => loadStored('operations', INITIAL_OPERATIONS));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadStored('suppliers', INITIAL_SUPPLIERS));
  const [accounts, setAccounts] = useState<FinancialAccount[]>(() => loadStored('accounts', INITIAL_ACCOUNTS));
  const [movements, setMovements] = useState<FinancialMovement[]>(() => loadStored('movements', INITIAL_MOVEMENTS));
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>(() => loadStored('fixedExpenses', INITIAL_FIXED_EXPENSES));
  const [rules, setRules] = useState<ClassificationRule[]>(() => loadStored('rules', INITIAL_RULES));
  const [historicalPeriods] = useState<HistoricalPeriod[]>(() => loadStored('historical', INITIAL_HISTORICAL_PERIODS));
  const [monthlyClosings, setMonthlyClosings] = useState<MonthlyClosing[]>(() => loadStored('closings', INITIAL_MONTHLY_CLOSINGS));
  const [cutoffConfig, setCutoffConfig] = useState<CutoffConfig>(() => loadStored('cutoff', INITIAL_CUTOFF_CONFIG));

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_PREFIX + 'operations', JSON.stringify(operations));
  }, [operations]);

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

  // Derived KPIs
  const kpis = useMemo(() => {
    return calculateKPIs(operations, accounts, fixedExpenses, movements);
  }, [operations, accounts, fixedExpenses, movements]);

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
      date: opData.date || now.split('T')[0],
      endDate: opData.endDate,
      passengerCount: opData.passengerCount || 1,
      status: opData.status || 'confirmada',
      responsiblePerson: opData.responsiblePerson || 'Administración',
      observations: opData.observations || '',
      expectedRevenue: opData.expectedRevenue || 0,
      receivedRevenue: opData.receivedRevenue || 0,
      expectedCost: opData.expectedCost || 0,
      paidCost: opData.paidCost || 0,
      incomes: opData.incomes || [],
      suppliers: opData.suppliers || [],
      students: opData.students || [],
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
          // Sync student payments with receivedRevenue if applicable
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
        // Find matching students for this operation
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

    // If alias is provided, auto-learn alias rule
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
      type: mov.type || 'ingreso',
      description: mov.description || 'Movimiento manual',
      rawPayerOrAlias: mov.rawPayerOrAlias,
      accountId: mov.accountId || 'mp_gaston',
      targetAccountId: mov.targetAccountId,
      category: mov.category,
      operationId: mov.operationId,
      supplierId: mov.supplierId,
      studentId: mov.studentId,
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

      // Check rules for auto-matching
      let matchedSupplierId: string | undefined = raw.supplierId;
      let matchedCategory: string | undefined = raw.category;
      let isInternal = !!raw.isInternalTransfer;
      let targetAcc = raw.targetAccountId;
      let matchStatus: 'verde' | 'amarillo' | 'rojo' = 'rojo';
      let confidence = 0;
      let reason = 'Movimiento no reconocido';

      // Check internal transfers
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

      // Check supplier aliases
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

      // Check learned rules
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
        type: isInternal ? 'transferencia_interna' : (raw.type || 'ingreso'),
        description: desc || 'Movimiento importado',
        rawPayerOrAlias: alias,
        accountId: raw.accountId || 'mp_gaston',
        targetAccountId: targetAcc,
        category: matchedCategory,
        operationId: raw.operationId,
        supplierId: matchedSupplierId,
        studentId: raw.studentId,
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

    // Filter movements belonging to this month
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
        version: '1.0',
        operations,
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
      if (data.suppliers) setSuppliers(data.suppliers);
      if (data.accounts) setAccounts(data.accounts);
      if (data.movements) setMovements(data.movements);
      if (data.fixedExpenses) setFixedExpenses(data.fixedExpenses);
      if (data.rules) setRules(data.rules);
      if (data.monthlyClosings) setMonthlyClosings(data.monthlyClosings);
      if (data.cutoffConfig) setCutoffConfig(data.cutoffConfig);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
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

        operations,
        suppliers,
        accounts,
        movements,
        fixedExpenses,
        rules,
        historicalPeriods,
        monthlyClosings,
        cutoffConfig,

        kpis,
        monthlyProjection,

        addOperation,
        updateOperation,
        deleteOperation,
        batchImportOperations,

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
