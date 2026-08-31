import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  fetchOperationsFromSupabase,
  saveOperationToSupabase,
  deleteOperationFromSupabase,
  fetchClientsFromSupabase,
  saveClientToSupabase,
  deleteClientFromSupabase,
  fetchSuppliersFromSupabase,
  saveSupplierToSupabase,
  deleteSupplierFromSupabase,
  fetchAccountsFromSupabase,
  saveAccountToSupabase,
  updateAccountBalanceInSupabase,
  fetchMovementsFromSupabase,
  saveMovementToSupabase,
  batchSaveMovementsToSupabase,
  deleteMovementFromSupabase,
  clearMovementsInSupabase,
  fetchFixedExpensesFromSupabase,
  saveFixedExpenseToSupabase,
  deleteFixedExpenseFromSupabase,
  fetchMonthlyClosingsFromSupabase,
  saveMonthlyClosingToSupabase,
  fetchClassificationRulesFromSupabase,
  saveClassificationRuleToSupabase,
  deleteClassificationRuleFromSupabase,
  seedInitialDataToSupabase,
  fetchUserProfile,
  upsertUserProfile
} from '../services/supabaseService';

const STORAGE_PREFIX = 'turismo_gestion_prod_clean_v3_';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

interface AppContextType {
  // Roles, Auth & Profile
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  isLoadingData: boolean;
  supabaseStatus: 'connected' | 'connecting' | 'local';
  logout: () => Promise<void>;
  syncFromSupabase: () => Promise<void>;
  seedSupabaseDatabase: () => Promise<{ success: boolean; message: string }>;

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
  saveCutoffAndBalances: (cutoffDate: string, description: string, balancesMap: Record<AccountId, number>) => void;

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
  // Helper for localStorage fallback
  const loadStored = <T,>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  };

  // Helper for immediate synchronous localStorage persistence
  const persistLocal = <T,>(key: string, data: T): void => {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
    } catch (e) {
      console.error(`[Storage] Error persisting ${key}:`, e);
    }
  };

  // 1. Roles & Auth State
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => loadStored('userProfile', null));
  const [currentRole, setCurrentRole] = useState<UserRole>(() => loadStored('currentRole', 'socio'));
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [supabaseStatus, setSupabaseStatus] = useState<'connected' | 'connecting' | 'local'>(
    isSupabaseConfigured() ? 'connecting' : 'local'
  );

  // 2. Navigation & UI state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(null);
  const [selectedStudentOpId, setSelectedStudentOpId] = useState<string | null>(null);
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

  // Synchronization with Supabase Database
  const syncFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setSupabaseStatus('local');
      return;
    }

    setIsLoadingData(true);
    setSupabaseStatus('connecting');

    try {
      const [
        remoteOps,
        remoteClients,
        remoteSuppliers,
        remoteAccounts,
        remoteMovements,
        remoteFixedExpenses,
        remoteClosings,
        remoteRules
      ] = await Promise.all([
        fetchOperationsFromSupabase(),
        fetchClientsFromSupabase(),
        fetchSuppliersFromSupabase(),
        fetchAccountsFromSupabase(),
        fetchMovementsFromSupabase(),
        fetchFixedExpensesFromSupabase(),
        fetchMonthlyClosingsFromSupabase(),
        fetchClassificationRulesFromSupabase()
      ]);

      if (remoteOps) setOperations(remoteOps);
      if (remoteClients) setClients(remoteClients);
      if (remoteSuppliers) setSuppliers(remoteSuppliers);
      if (remoteAccounts && remoteAccounts.length > 0) setAccounts(remoteAccounts);
      if (remoteMovements) setMovements(remoteMovements);
      if (remoteFixedExpenses) setFixedExpenses(remoteFixedExpenses);
      if (remoteClosings) setMonthlyClosings(remoteClosings);
      if (remoteRules) setRules(remoteRules);

      setSupabaseStatus('connected');
    } catch (err) {
      console.warn('Could not sync with Supabase tables, keeping local data:', err);
      setSupabaseStatus('local');
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Supabase Seed Method
  const seedSupabaseDatabase = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Supabase no está configurado.' };
    }
    setIsLoadingData(true);
    try {
      const result = await seedInitialDataToSupabase(
        accounts,
        suppliers,
        clients,
        operations,
        fixedExpenses,
        movements
      );
      if (result.success) {
        await syncFromSupabase();
      }
      return result;
    } finally {
      setIsLoadingData(false);
    }
  }, [accounts, suppliers, clients, operations, fixedExpenses, movements, syncFromSupabase]);

  // Auth Initialization Effect
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      setIsLoadingAuth(true);

      if (isSupabaseConfigured()) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && isMounted) {
            const profile = await fetchUserProfile(session.user.id);
            const userRole = profile?.role || (session.user.user_metadata?.role as UserRole) || 'socio';
            const fullName = profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario';

            const uProf: UserProfile = {
              id: session.user.id,
              email: session.user.email || '',
              fullName,
              role: userRole
            };
            setUserProfile(uProf);
            setCurrentRole(userRole);
          }
        } catch (err) {
          console.error('Error fetching Supabase session:', err);
        }
      }

      if (isMounted) {
        setIsLoadingAuth(false);
      }
    };

    initAuth();

    // Listen to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        const userRole = profile?.role || (session.user.user_metadata?.role as UserRole) || 'socio';
        const fullName = profile?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuario';

        const uProf: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          fullName,
          role: userRole
        };
        setUserProfile(uProf);
        setCurrentRole(userRole);
      } else if (event === 'SIGNED_OUT') {
        setUserProfile(null);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Initial Data Fetch on Mount
  useEffect(() => {
    if (isSupabaseConfigured()) {
      syncFromSupabase();
    }
  }, [syncFromSupabase]);

  // Persisted state setters
  const setPersistedUserProfile = (profile: UserProfile | null | ((prev: UserProfile | null) => UserProfile | null)) => {
    setUserProfile(prev => {
      const next = typeof profile === 'function' ? profile(prev) : profile;
      persistLocal('userProfile', next);
      return next;
    });
  };

  const setPersistedCurrentRole = (role: UserRole | ((prev: UserRole) => UserRole)) => {
    setCurrentRole(prev => {
      const next = typeof role === 'function' ? role(prev) : role;
      persistLocal('currentRole', next);
      return next;
    });
  };

  const setPersistedExchangeRate = (rate: ExchangeRateConfig | ((prev: ExchangeRateConfig) => ExchangeRateConfig)) => {
    setExchangeRate(prev => {
      const next = typeof rate === 'function' ? rate(prev) : rate;
      persistLocal('exchangeRate', next);
      return next;
    });
  };

  // Logout method
  const logout = async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUserProfile(null);
    localStorage.removeItem(STORAGE_PREFIX + 'userProfile');
  };

  // Derived Operational KPIs
  const kpis = useMemo(() => {
    return calculateKPIs(operations, accounts, fixedExpenses, movements, exchangeRate);
  }, [operations, accounts, fixedExpenses, movements, exchangeRate]);

  // Derived Cultour Financial Position
  const financialPosition = useMemo(() => {
    return calculateCultourFinancialPosition(operations, accounts, fixedExpenses, exchangeRate);
  }, [operations, accounts, fixedExpenses, exchangeRate]);

  // Derived Monthly Cash Projection
  const monthlyProjection = useMemo(() => {
    return generateMonthlyCashProjection(
      financialPosition.cashARS,
      financialPosition.cashUSD,
      operations,
      fixedExpenses,
      historicalPeriods,
      monthlyClosings,
      movements
    );
  }, [financialPosition.cashARS, financialPosition.cashUSD, operations, fixedExpenses, historicalPeriods, monthlyClosings, movements]);

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
      preparationChecklist: opData.preparationChecklist || {},
      passengers: opData.passengers || [],
      itinerary: opData.itinerary || [],
      createdAt: now,
      updatedAt: now
    };

    setOperations(prev => {
      const next = [newOp, ...prev];
      persistLocal('operations', next);
      return next;
    });

    // Persist to Supabase
    if (isSupabaseConfigured()) {
      saveOperationToSupabase(newOp).catch(err => console.error('Error saving operation to Supabase:', err));
    }

    return newOp;
  };

  const updateOperation = (id: string, updates: Partial<Operation>) => {
    let savedTargetOp: Operation | null = null;

    setOperations(prev => {
      const next = prev.map(op => {
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

        savedTargetOp = updated;
        return updated;
      });

      persistLocal('operations', next);
      return next;
    });

    if (isSupabaseConfigured()) {
      const target = savedTargetOp || operations.find(o => o.id === id);
      if (target) {
        const merged = { ...target, ...updates, updatedAt: new Date().toISOString() };
        saveOperationToSupabase(merged).catch(err => console.error('Error updating operation in Supabase:', err));
      }
    }
  };

  const deleteOperation = (id: string) => {
    setOperations(prev => {
      const next = prev.filter(op => op.id !== id);
      persistLocal('operations', next);
      return next;
    });
    if (selectedOperationId === id) setSelectedOperationId(null);

    if (isSupabaseConfigured()) {
      deleteOperationFromSupabase(id).catch(err => console.error('Error deleting operation from Supabase:', err));
    }
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
          quotas: [],
          collections: [],
          supplierContracts: [],
          supplierPayments: [],
          preparationChecklist: {},
          passengers: [],
          itinerary: [],
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
      const combined = [...opsToCreate, ...next];
      persistLocal('operations', combined);
      return combined;
    });

    // Save batch to Supabase
    if (isSupabaseConfigured()) {
      opsToCreate.forEach(op => saveOperationToSupabase(op).catch(console.error));
    }

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
    setClients(prev => {
      const next = [...prev, newClient];
      persistLocal('clients', next);
      return next;
    });

    if (isSupabaseConfigured()) {
      saveClientToSupabase(newClient).catch(err => console.error('Error saving client to Supabase:', err));
    }

    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    let savedClient: Client | null = null;
    setClients(prev => {
      const next = prev.map(c => {
        if (c.id === id) {
          const updated = { ...c, ...updates, updatedAt: new Date().toISOString() };
          savedClient = updated;
          return updated;
        }
        return c;
      });
      persistLocal('clients', next);
      return next;
    });

    if (isSupabaseConfigured()) {
      const target = savedClient || clients.find(c => c.id === id);
      if (target) {
        const merged = { ...target, ...updates };
        saveClientToSupabase(merged).catch(err => console.error('Error updating client in Supabase:', err));
      }
    }
  };

  const deleteClient = (id: string) => {
    setClients(prev => {
      const next = prev.filter(c => c.id !== id);
      persistLocal('clients', next);
      return next;
    });
    if (isSupabaseConfigured()) {
      deleteClientFromSupabase(id).catch(err => console.error('Error deleting client from Supabase:', err));
    }
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
      const finalClients = [...merged, ...toAdd];
      persistLocal('clients', finalClients);
      return finalClients;
    });

    if (isSupabaseConfigured()) {
      toAdd.forEach(cl => saveClientToSupabase(cl).catch(console.error));
    }

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

    // 1. Create and persist Financial Movement
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

    setMovements(prev => {
      const next = [newMov, ...prev];
      persistLocal('movements', next);
      return next;
    });

    if (isSupabaseConfigured()) {
      saveMovementToSupabase(newMov).catch(err => console.error('Error saving movement in Supabase:', err));
    }

    // 2. Update Account Balance atomically
    setAccounts(prev => {
      const next = prev.map(acc => {
        if (acc.id === col.destinationAccountId) {
          const nextBal = (acc.currentBalance || 0) + col.amount;
          if (isSupabaseConfigured()) {
            updateAccountBalanceInSupabase(acc.id, nextBal).catch(err => console.error('Error updating balance in Supabase:', err));
          }
          return { ...acc, currentBalance: nextBal };
        }
        return acc;
      });
      persistLocal('accounts', next);
      return next;
    });

    // 3. Update Operation Received Revenue & Collections
    setOperations(prev => {
      const next = prev.map(op => {
        if (op.id !== col.operationId) return op;
        const currentCols = op.collections || [];
        const updatedCols = [...currentCols, { ...newCollection, movementId: newMovementId }];
        const newReceived = (op.receivedRevenue || 0) + col.amount;

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

        const updatedOp = {
          ...op,
          collections: updatedCols,
          incomes: [...(op.incomes || []), newIncomeEntry],
          receivedRevenue: newReceived,
          updatedAt: now
        };

        if (isSupabaseConfigured()) {
          saveOperationToSupabase(updatedOp).catch(err => console.error('Error saving operation in Supabase:', err));
        }

        return updatedOp;
      });
      persistLocal('operations', next);
      return next;
    });
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

    // 1. Create and persist Financial Movement
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

    setMovements(prev => {
      const next = [newMov, ...prev];
      persistLocal('movements', next);
      return next;
    });

    if (isSupabaseConfigured()) {
      saveMovementToSupabase(newMov).catch(err => console.error('Error saving movement in Supabase:', err));
    }

    // 2. Update Account Balance atomically
    setAccounts(prev => {
      const next = prev.map(acc => {
        if (acc.id === pay.sourceAccountId) {
          const nextBal = (acc.currentBalance || 0) - pay.amount;
          if (isSupabaseConfigured()) {
            updateAccountBalanceInSupabase(acc.id, nextBal).catch(err => console.error('Error updating balance in Supabase:', err));
          }
          return { ...acc, currentBalance: nextBal };
        }
        return acc;
      });
      persistLocal('accounts', next);
      return next;
    });

    // 3. Update Operation Paid Cost
    setOperations(prev => {
      const next = prev.map(op => {
        if (op.id !== pay.operationId) return op;
        const currentPayments = op.supplierPayments || [];
        const updatedPayments = [...currentPayments, { ...newPaymentRecord, movementId: newMovementId }];
        const newPaidCost = (op.paidCost || 0) + pay.amount;

        const updatedSuppliers = (op.suppliers || []).map(s => {
          if (s.supplierId === pay.supplierId || s.supplierName.toLowerCase() === pay.supplierName.toLowerCase()) {
            const nextPaid = (s.paidCost || 0) + pay.amount;
            const status = nextPaid >= s.expectedCost ? 'pagado' : nextPaid > 0 ? 'parcial' : 'pendiente';
            return { ...s, paidCost: nextPaid, status: status as any };
          }
          return s;
        });

        const updatedOp = {
          ...op,
          supplierPayments: updatedPayments,
          suppliers: updatedSuppliers,
          paidCost: newPaidCost,
          updatedAt: now
        };

        if (isSupabaseConfigured()) {
          saveOperationToSupabase(updatedOp).catch(err => console.error('Error saving operation in Supabase:', err));
        }

        return updatedOp;
      });
      persistLocal('operations', next);
      return next;
    });
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
    setOperations(prev => {
      const next = prev.map(op => {
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

        const updatedOp = {
          ...op,
          students: updatedStudents,
          receivedRevenue: totalStudentPaid,
          updatedAt: new Date().toISOString()
        };

        if (isSupabaseConfigured()) {
          saveOperationToSupabase(updatedOp).catch(console.error);
        }

        return updatedOp;
      });
      persistLocal('operations', next);
      return next;
    });
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
    setOperations(prev => {
      const next = prev.map(op => {
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

        const updatedOp = {
          ...op,
          passengerCount: updatedStudents.length,
          expectedRevenue: newExpectedRev,
          receivedRevenue: newReceivedRev,
          students: updatedStudents,
          updatedAt: new Date().toISOString()
        };

        if (isSupabaseConfigured()) {
          saveOperationToSupabase(updatedOp).catch(console.error);
        }

        return updatedOp;
      });
      persistLocal('operations', next);
      return next;
    });
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
      const next = prev.map(op => {
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

        const updatedOp = {
          ...op,
          students: mergedStudents,
          passengerCount: mergedStudents.length,
          expectedRevenue: totalExpected > 0 ? totalExpected : op.expectedRevenue,
          receivedRevenue: totalPaid > 0 ? totalPaid : op.receivedRevenue,
          updatedAt: new Date().toISOString()
        };

        if (isSupabaseConfigured()) {
          saveOperationToSupabase(updatedOp).catch(console.error);
        }

        return updatedOp;
      });

      persistLocal('operations', next);
      return next;
    });

    return { created, errors };
  };

  // ==========================================
  // SUPPLIERS CRUD
  // ==========================================
  const addSupplier = (sup: Omit<Supplier, 'id'>): Supplier => {
    const newId = `sup_${Date.now()}`;
    const newSup: Supplier = { ...sup, id: newId };
    setSuppliers(prev => {
      const next = [...prev, newSup];
      persistLocal('suppliers', next);
      return next;
    });

    if (sup.mpAlias) {
      learnRule({
        pattern: sup.mpAlias.trim(),
        ruleType: 'alias',
        targetSupplierId: newId,
        targetCategory: sup.category
      });
    }

    if (isSupabaseConfigured()) {
      saveSupplierToSupabase(newSup).catch(err => console.error('Error saving supplier to Supabase:', err));
    }

    return newSup;
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    let savedSup: Supplier | null = null;
    setSuppliers(prev => {
      const next = prev.map(s => {
        if (s.id === id) {
          const updated = { ...s, ...updates };
          savedSup = updated;
          return updated;
        }
        return s;
      });
      persistLocal('suppliers', next);
      return next;
    });

    if (isSupabaseConfigured()) {
      const target = savedSup || suppliers.find(s => s.id === id);
      if (target) {
        const merged = { ...target, ...updates };
        saveSupplierToSupabase(merged).catch(err => console.error('Error updating supplier in Supabase:', err));
      }
    }
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(prev => {
      const next = prev.filter(s => s.id !== id);
      persistLocal('suppliers', next);
      return next;
    });
    if (isSupabaseConfigured()) {
      deleteSupplierFromSupabase(id).catch(err => console.error('Error deleting supplier from Supabase:', err));
    }
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
      const finalSuppliers = [...merged, ...newSuppliersToAdd];
      persistLocal('suppliers', finalSuppliers);
      return finalSuppliers;
    });

    if (isSupabaseConfigured()) {
      newSuppliersToAdd.forEach(s => saveSupplierToSupabase(s).catch(console.error));
    }

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
      currentBalance: acc.currentBalance || 0,
      initialBalance: acc.initialBalance || 0,
      alias: acc.alias,
      cbu: acc.cbu,
      holder: acc.holder || 'Mariano Pipkin',
      description: acc.description,
      active: true
    };

    setAccounts(prev => {
      const next = [...prev, newAccount];
      persistLocal('accounts', next);
      return next;
    });

    if (isSupabaseConfigured()) {
      saveAccountToSupabase(newAccount).catch(err => console.error('Error saving account to Supabase:', err));
    }

    return newAccount;
  };

  const updateAccount = (id: AccountId, updates: Partial<FinancialAccount>) => {
    let savedAcc: FinancialAccount | null = null;
    setAccounts(prev => {
      const next = prev.map(a => {
        if (a.id === id) {
          const updated = { ...a, ...updates };
          savedAcc = updated;
          return updated;
        }
        return a;
      });
      persistLocal('accounts', next);
      return next;
    });

    if (isSupabaseConfigured()) {
      const target = savedAcc || accounts.find(a => a.id === id);
      if (target) {
        const merged = { ...target, ...updates };
        saveAccountToSupabase(merged as FinancialAccount).catch(err => console.error('Error updating account in Supabase:', err));
      }
    }
  };

  const deleteAccount = (id: AccountId) => {
    setAccounts(prev => {
      const next = prev.filter(a => a.id !== id);
      persistLocal('accounts', next);
      return next;
    });
  };

  const updateAccountBalance = (accountId: AccountId, currentBalance: number) => {
    setAccounts(prev => {
      const next = prev.map(acc => (acc.id === accountId ? { ...acc, currentBalance } : acc));
      persistLocal('accounts', next);
      return next;
    });

    if (isSupabaseConfigured()) {
      updateAccountBalanceInSupabase(accountId, currentBalance).catch(err => console.error('Error updating balance in Supabase:', err));
    }
  };

  const updateCutoffConfig = (config: CutoffConfig) => {
    setCutoffConfig(config);
    persistLocal('cutoff', config);
  };

  const saveCutoffAndBalances = (
    cutoffDate: string,
    description: string,
    balancesMap: Record<AccountId, number>
  ) => {
    // 1. Update and persist cutoffConfig
    setCutoffConfig(prev => {
      const nextConfig: CutoffConfig = {
        ...prev,
        cutoffDate,
        description,
        accountsInitialBalances: balancesMap
      };
      persistLocal('cutoff', nextConfig);
      return nextConfig;
    });

    // 2. Update and persist accounts in a single atomic transaction
    setAccounts(prev => {
      const nextAccounts = prev.map(acc => {
        if (balancesMap[acc.id] !== undefined) {
          const newBal = balancesMap[acc.id];
          return {
            ...acc,
            currentBalance: newBal,
            initialBalance: newBal
          };
        }
        return acc;
      });
      persistLocal('accounts', nextAccounts);

      if (isSupabaseConfigured()) {
        nextAccounts.forEach(acc => {
          if (balancesMap[acc.id] !== undefined) {
            saveAccountToSupabase(acc).catch(console.error);
          }
        });
      }

      return nextAccounts;
    });
  };

  // ==========================================
  // MOVEMENTS (LEDGER)
  // ==========================================
  const addMovement = (mov: Partial<FinancialMovement>) => {
    const newId = mov.id || `mov_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newMovement: FinancialMovement = {
      id: newId,
      date: mov.date || new Date().toISOString().split('T')[0],
      amount: mov.amount || 0,
      currency: mov.currency || 'ARS',
      type: mov.type || 'egreso',
      description: mov.description || '',
      rawPayerOrAlias: mov.rawPayerOrAlias,
      accountId: mov.accountId || accounts[0]?.id || 'acc_mp_mariano',
      targetAccountId: mov.targetAccountId,
      category: mov.category,
      operationId: mov.operationId,
      supplierId: mov.supplierId,
      matchStatus: mov.matchStatus || 'rojo',
      matchConfidence: mov.matchConfidence,
      matchReason: mov.matchReason,
      isInternalTransfer: mov.isInternalTransfer || false,
      notes: mov.notes,
      importedAt: new Date().toISOString()
    };

    setMovements(prev => {
      const next = [newMovement, ...prev];
      persistLocal('movements', next);
      return next;
    });

    if (isSupabaseConfigured()) {
      saveMovementToSupabase(newMovement).catch(err => console.error('Error saving movement to Supabase:', err));
    }
  };

  const batchImportMovements = (newMovs: Partial<FinancialMovement>[]): number => {
    const fullMovs: FinancialMovement[] = newMovs.map((m, idx) => ({
      id: m.id || `mov_imp_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
      date: m.date || new Date().toISOString().split('T')[0],
      amount: m.amount || 0,
      currency: m.currency || 'ARS',
      type: m.type || 'egreso',
      description: m.description || '',
      rawPayerOrAlias: m.rawPayerOrAlias,
      accountId: m.accountId || accounts[0]?.id || 'acc_mp_mariano',
      targetAccountId: m.targetAccountId,
      category: m.category,
      operationId: m.operationId,
      supplierId: m.supplierId,
      matchStatus: m.matchStatus || 'rojo',
      matchConfidence: m.matchConfidence,
      matchReason: m.matchReason,
      isInternalTransfer: m.isInternalTransfer || false,
      notes: m.notes,
      importedAt: new Date().toISOString()
    }));

    setMovements(prev => {
      const next = [...fullMovs, ...prev];
      persistLocal('movements', next);
      return next;
    });

    if (isSupabaseConfigured()) {
      batchSaveMovementsToSupabase(fullMovs).catch(err => console.error('Error batch saving movements to Supabase:', err));
    }

    return fullMovs.length;
  };

  const updateMovement = (id: string, updates: Partial<FinancialMovement>) => {
    let savedMov: FinancialMovement | null = null;
    setMovements(prev => {
      const next = prev.map(m => {
        if (m.id === id) {
          const updated = { ...m, ...updates };
          savedMov = updated;
          return updated;
        }
        return m;
      });
      persistLocal('movements', next);
      return next;
    });

    if (isSupabaseConfigured()) {
      const target = savedMov || movements.find(m => m.id === id);
      if (target) {
        const merged = { ...target, ...updates };
        saveMovementToSupabase(merged).catch(err => console.error('Error updating movement in Supabase:', err));
      }
    }
  };

  const deleteMovement = (id: string) => {
    setMovements(prev => {
      const next = prev.filter(m => m.id !== id);
      persistLocal('movements', next);
      return next;
    });
    if (isSupabaseConfigured()) {
      deleteMovementFromSupabase(id).catch(err => console.error('Error deleting movement from Supabase:', err));
    }
  };

  const clearMovementsOnly = () => {
    setMovements([]);
    persistLocal('movements', []);
    if (isSupabaseConfigured()) {
      clearMovementsInSupabase().catch(err => console.error('Error clearing movements in Supabase:', err));
    }
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
    let updatedMovObj: FinancialMovement | null = null;
    setMovements(prev => {
      const next = prev.map(m => {
        if (m.id !== movementId) return m;

        const updated: FinancialMovement = {
          ...m,
          operationId: target.operationId || m.operationId,
          supplierId: target.supplierId || m.supplierId,
          category: target.category || m.category,
          isInternalTransfer: target.isInternalTransfer !== undefined ? target.isInternalTransfer : m.isInternalTransfer,
          targetAccountId: target.targetAccountId || m.targetAccountId,
          matchStatus: 'verde',
          matchConfidence: 100,
          matchReason: 'Conciliación manual confirmada por usuario'
        };
        updatedMovObj = updated;
        return updated;
      });
      persistLocal('movements', next);
      return next;
    });

    if (isSupabaseConfigured() && updatedMovObj) {
      saveMovementToSupabase(updatedMovObj).catch(err => console.error('Error saving reconciled movement to Supabase:', err));
    }
  };

  const learnRule = (ruleData: Omit<ClassificationRule, 'id' | 'createdAt'>) => {
    const newId = `rule_${Date.now()}`;
    const newRule: ClassificationRule = {
      ...ruleData,
      id: newId,
      createdAt: new Date().toISOString()
    };
    setRules(prev => {
      const next = [...prev, newRule];
      persistLocal('rules', next);
      return next;
    });

    if (isSupabaseConfigured()) {
      saveClassificationRuleToSupabase(ruleData).catch(err => console.error('Error saving rule to Supabase:', err));
    }
  };

  const deleteRule = (id: string) => {
    setRules(prev => {
      const next = prev.filter(r => r.id !== id);
      persistLocal('rules', next);
      return next;
    });
    if (isSupabaseConfigured()) {
      deleteClassificationRuleFromSupabase(id).catch(err => console.error('Error deleting rule from Supabase:', err));
    }
  };

  // ==========================================
  // FIXED EXPENSES
  // ==========================================
  const addFixedExpense = (exp: Omit<FixedExpense, 'id'>) => {
    const newId = `fe_${Date.now()}`;
    const newExp: FixedExpense = { ...exp, id: newId };
    setFixedExpenses(prev => {
      const next = [...prev, newExp];
      persistLocal('fixedExpenses', next);
      return next;
    });

    if (isSupabaseConfigured()) {
      saveFixedExpenseToSupabase(newExp).catch(err => console.error('Error saving fixed expense to Supabase:', err));
    }
  };

  const updateFixedExpense = (id: string, updates: Partial<FixedExpense>) => {
    let savedExp: FixedExpense | null = null;
    setFixedExpenses(prev => {
      const next = prev.map(e => {
        if (e.id === id) {
          const updated = { ...e, ...updates };
          savedExp = updated;
          return updated;
        }
        return e;
      });
      persistLocal('fixedExpenses', next);
      return next;
    });

    if (isSupabaseConfigured()) {
      const target = savedExp || fixedExpenses.find(f => f.id === id);
      if (target) {
        const merged = { ...target, ...updates };
        saveFixedExpenseToSupabase(merged).catch(err => console.error('Error updating fixed expense in Supabase:', err));
      }
    }
  };

  const deleteFixedExpense = (id: string) => {
    setFixedExpenses(prev => {
      const next = prev.filter(e => e.id !== id);
      persistLocal('fixedExpenses', next);
      return next;
    });
    if (isSupabaseConfigured()) {
      deleteFixedExpenseFromSupabase(id).catch(err => console.error('Error deleting fixed expense from Supabase:', err));
    }
  };

  const toggleFixedExpensePayment = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    setFixedExpenses(prev => {
      const next = prev.map(e => {
        if (e.id !== id) return e;
        const nextStatus = e.status === 'activo' ? 'pagado' : 'activo';
        return {
          ...e,
          status: nextStatus,
          lastPaidDate: nextStatus === 'pagado' ? today : e.lastPaidDate
        };
      });
      persistLocal('fixedExpenses', next);
      return next;
    });
  };

  const batchImportFixedExpenses = (expensesList: Array<Omit<FixedExpense, 'id'>>) => {
    let created = 0;
    const toAdd: FixedExpense[] = expensesList.map((e, idx) => ({
      ...e,
      id: `fe_imp_${Date.now()}_${idx}`
    }));

    setFixedExpenses(prev => {
      const next = [...prev, ...toAdd];
      persistLocal('fixedExpenses', next);
      return next;
    });
    created = toAdd.length;

    if (isSupabaseConfigured()) {
      toAdd.forEach(fe => saveFixedExpenseToSupabase(fe).catch(console.error));
    }

    return { created };
  };

  // ==========================================
  // MONTHLY CLOSING
  // ==========================================
  const performMonthlyClosing = (yearMonth: string, notes?: string, actualCash?: number) => {
    const now = new Date().toISOString();
    const existing = monthlyClosings.find(c => c.yearMonth === yearMonth);
    const initialCash = financialPosition.cashARS;
    const finalCash = actualCash !== undefined ? actualCash : initialCash;

    const closingRecord: MonthlyClosing = {
      id: existing ? existing.id : `close_${yearMonth}`,
      yearMonth,
      closedAt: now,
      status: 'cerrado',
      initialCash,
      totalIncome: kpis.totalRevenue,
      totalExpense: kpis.totalCost + kpis.fixedExpensesMonthly,
      internalTransfersSum: 0,
      calculatedFinalCash: initialCash,
      actualAccountCash: finalCash,
      reconciliationDifference: finalCash - initialCash,
      operationsCount: operations.length,
      closedBy: userProfile?.fullName || 'Mariano Pipkin',
      notes
    };

    setMonthlyClosings(prev => {
      const next = [closingRecord, ...prev.filter(c => c.yearMonth !== yearMonth)];
      persistLocal('closings', next);
      return next;
    });

    if (isSupabaseConfigured()) {
      saveMonthlyClosingToSupabase(closingRecord).catch(err => console.error('Error saving closing to Supabase:', err));
    }
  };

  const reopenMonthlyClosing = (id: string) => {
    setMonthlyClosings(prev => {
      const next = prev.map(c => (c.id === id ? { ...c, status: 'abierto', closedAt: undefined } : c));
      persistLocal('closings', next);
      return next;
    });
  };

  // ==========================================
  // RESET & BACKUPS
  // ==========================================
  const clearAllData = (options?: { resetBalancesToZero?: boolean }) => {
    setOperations([]);
    setClients([]);
    setSuppliers([]);
    setMovements([]);
    setFixedExpenses([]);
    setMonthlyClosings([]);
    setRules([]);

    persistLocal('operations', []);
    persistLocal('clients', []);
    persistLocal('suppliers', []);
    persistLocal('movements', []);
    persistLocal('fixedExpenses', []);
    persistLocal('closings', []);
    persistLocal('rules', []);

    if (options?.resetBalancesToZero) {
      setAccounts(prev => {
        const next = prev.map(a => ({ ...a, currentBalance: 0, initialBalance: 0 }));
        persistLocal('accounts', next);
        return next;
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

    persistLocal('operations', INITIAL_OPERATIONS);
    persistLocal('clients', INITIAL_CLIENTS);
    persistLocal('suppliers', INITIAL_SUPPLIERS);
    persistLocal('accounts', INITIAL_ACCOUNTS);
    persistLocal('movements', INITIAL_MOVEMENTS);
    persistLocal('fixedExpenses', INITIAL_FIXED_EXPENSES);
    persistLocal('rules', INITIAL_RULES);
    persistLocal('closings', INITIAL_MONTHLY_CLOSINGS);
    persistLocal('cutoff', INITIAL_CUTOFF_CONFIG);
  };

  const exportDatabaseJSON = (): string => {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        version: '3.0_supabase',
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
      if (data.operations) {
        setOperations(data.operations);
        persistLocal('operations', data.operations);
      }
      if (data.clients) {
        setClients(data.clients);
        persistLocal('clients', data.clients);
      }
      if (data.suppliers) {
        setSuppliers(data.suppliers);
        persistLocal('suppliers', data.suppliers);
      }
      if (data.accounts) {
        setAccounts(data.accounts);
        persistLocal('accounts', data.accounts);
      }
      if (data.movements) {
        setMovements(data.movements);
        persistLocal('movements', data.movements);
      }
      if (data.fixedExpenses) {
        setFixedExpenses(data.fixedExpenses);
        persistLocal('fixedExpenses', data.fixedExpenses);
      }
      if (data.rules) {
        setRules(data.rules);
        persistLocal('rules', data.rules);
      }
      if (data.monthlyClosings) {
        setMonthlyClosings(data.monthlyClosings);
        persistLocal('closings', data.monthlyClosings);
      }
      if (data.cutoffConfig) {
        setCutoffConfig(data.cutoffConfig);
        persistLocal('cutoff', data.cutoffConfig);
      }
      if (data.exchangeRate) {
        setExchangeRate(data.exchangeRate);
        persistLocal('exchangeRate', data.exchangeRate);
      }
      return true;
    } catch {
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole: setPersistedCurrentRole,
        userProfile,
        setUserProfile: setPersistedUserProfile,
        isAuthenticated: Boolean(userProfile),
        isLoadingAuth,
        isLoadingData,
        supabaseStatus,
        logout,
        syncFromSupabase,
        seedSupabaseDatabase,

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
        setExchangeRate: setPersistedExchangeRate,

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
        saveCutoffAndBalances,

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
