import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Operation,
  Client,
  Supplier,
  FinancialAccount,
  FinancialMovement,
  FixedExpense,
  ClassificationRule,
  MonthlyClosing,
  PaymentQuota,
  CollectionRecord,
  SupplierContract,
  SupplierPaymentRecord,
  OperationPassenger,
  OperationItineraryItem,
  PreparationChecklistMap,
  UserRole,
  PaymentMethod,
  Currency
} from '../types';

// ==========================================
// 1. AUTH & PROFILE
// ==========================================
export interface SupabaseUserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

export const fetchUserProfile = async (userId: string): Promise<SupabaseUserProfile | null> => {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // Profile might not exist yet if created without trigger
      return null;
    }
    return data as SupabaseUserProfile;
  } catch (err) {
    console.error('Error fetching user profile from Supabase:', err);
    return null;
  }
};

export const upsertUserProfile = async (profile: {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}): Promise<void> => {
  if (!isSupabaseConfigured()) return;
  try {
    const { error } = await supabase
      .from('user_profiles')
      .upsert(profile, { onConflict: 'id' });
    if (error) throw error;
  } catch (err) {
    console.error('Error saving user profile to Supabase:', err);
  }
};

// ==========================================
// 2. CLIENTS
// ==========================================
export const fetchClientsFromSupabase = async (): Promise<Client[]> => {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    type: row.type || 'turista',
    name: row.name,
    documentId: row.document_id || undefined,
    email: row.email || undefined,
    phone: row.phone || undefined,
    address: row.address || undefined,
    country: row.country || 'Argentina',
    agencyCommercialName: row.agency_commercial_name || undefined,
    agencyContactPerson: row.agency_contact_person || undefined,
    agencyCountry: row.agency_country || undefined,
    commissionRate: row.commission_rate != null ? Number(row.commission_rate) : undefined,
    commercialConditions: row.commercial_conditions || undefined,
    paymentTerms: row.payment_terms || undefined,
    institutionName: row.institution_name || undefined,
    gradeOrGroup: row.grade_or_group || undefined,
    parentOrGuardianName: row.parent_guardian_name || undefined,
    parentPhone: row.parent_phone || undefined,
    parentEmail: row.parent_email || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at || new Date().toISOString()
  }));
};

export const saveClientToSupabase = async (client: Omit<Client, 'id' | 'createdAt'> & { id?: string }): Promise<Client> => {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const payload = {
    ...(client.id ? { id: client.id } : {}),
    type: client.type,
    name: client.name,
    document_id: client.documentId || null,
    email: client.email || null,
    phone: client.phone || null,
    address: client.address || null,
    country: client.country || 'Argentina',
    agency_commercial_name: client.agencyCommercialName || null,
    agency_contact_person: client.agencyContactPerson || null,
    agency_country: client.agencyCountry || null,
    commission_rate: client.commissionRate ?? null,
    commercial_conditions: client.commercialConditions || null,
    payment_terms: client.paymentTerms || null,
    institution_name: client.institutionName || null,
    grade_or_group: client.gradeOrGroup || null,
    parent_guardian_name: client.parentOrGuardianName || null,
    parent_phone: client.parentPhone || null,
    parent_email: client.parentEmail || null,
    notes: client.notes || null
  };

  const { data, error } = await supabase
    .from('clients')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    type: data.type,
    name: data.name,
    documentId: data.document_id || undefined,
    email: data.email || undefined,
    phone: data.phone || undefined,
    address: data.address || undefined,
    country: data.country,
    agencyCommercialName: data.agency_commercial_name || undefined,
    agencyContactPerson: data.agency_contact_person || undefined,
    agencyCountry: data.agency_country || undefined,
    commissionRate: data.commission_rate != null ? Number(data.commission_rate) : undefined,
    commercialConditions: data.commercial_conditions || undefined,
    paymentTerms: data.payment_terms || undefined,
    institutionName: data.institution_name || undefined,
    gradeOrGroup: data.grade_or_group || undefined,
    parentOrGuardianName: data.parent_guardian_name || undefined,
    parentPhone: data.parent_phone || undefined,
    parentEmail: data.parent_email || undefined,
    notes: data.notes || undefined,
    createdAt: data.created_at
  };
};

export const deleteClientFromSupabase = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw error;
};

// ==========================================
// 3. SUPPLIERS
// ==========================================
export const fetchSuppliersFromSupabase = async (): Promise<Supplier[]> => {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    mpAlias: row.mp_alias || undefined,
    cbu: row.cbu || undefined,
    bankAccount: row.bank_account || undefined,
    category: row.category,
    serviceDescription: row.service_description || undefined,
    contactName: row.contact_name || undefined,
    phone: row.phone || undefined,
    email: row.email || undefined,
    currency: row.currency || 'ARS',
    defaultAccountId: row.default_account_id || undefined,
    active: row.active ?? true
  }));
};

export const saveSupplierToSupabase = async (sup: Partial<Supplier> & { name: string; category: string }): Promise<Supplier> => {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const payload = {
    ...(sup.id ? { id: sup.id } : {}),
    name: sup.name,
    mp_alias: sup.mpAlias || null,
    cbu: sup.cbu || null,
    bank_account: sup.bankAccount || null,
    category: sup.category,
    service_description: sup.serviceDescription || null,
    contact_name: sup.contactName || null,
    phone: sup.phone || null,
    email: sup.email || null,
    currency: sup.currency || 'ARS',
    default_account_id: sup.defaultAccountId || null,
    active: sup.active ?? true
  };

  const { data, error } = await supabase
    .from('suppliers')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    mpAlias: data.mp_alias || undefined,
    cbu: data.cbu || undefined,
    bankAccount: data.bank_account || undefined,
    category: data.category,
    serviceDescription: data.service_description || undefined,
    contactName: data.contact_name || undefined,
    phone: data.phone || undefined,
    email: data.email || undefined,
    currency: data.currency || 'ARS',
    defaultAccountId: data.default_account_id || undefined,
    active: data.active
  };
};

export const deleteSupplierFromSupabase = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('suppliers').delete().eq('id', id);
  if (error) throw error;
};

// ==========================================
// 4. FINANCIAL ACCOUNTS
// ==========================================
export const fetchAccountsFromSupabase = async (): Promise<FinancialAccount[]> => {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('financial_accounts')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    type: row.type,
    currency: row.currency,
    currentBalance: Number(row.current_balance || 0),
    initialBalance: Number(row.initial_balance || 0),
    alias: row.alias || undefined,
    cbu: row.cbu || undefined,
    holder: row.holder,
    description: row.description || undefined,
    active: row.active ?? true
  }));
};

export const saveAccountToSupabase = async (acc: FinancialAccount): Promise<FinancialAccount> => {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const payload = {
    id: acc.id,
    name: acc.name,
    type: acc.type,
    currency: acc.currency,
    current_balance: acc.currentBalance,
    initial_balance: acc.initialBalance,
    alias: acc.alias || null,
    cbu: acc.cbu || null,
    holder: acc.holder,
    description: acc.description || null,
    active: acc.active ?? true
  };

  const { data, error } = await supabase
    .from('financial_accounts')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    type: data.type,
    currency: data.currency,
    currentBalance: Number(data.current_balance),
    initialBalance: Number(data.initial_balance),
    alias: data.alias || undefined,
    cbu: data.cbu || undefined,
    holder: data.holder,
    description: data.description || undefined,
    active: data.active
  };
};

export const updateAccountBalanceInSupabase = async (accountId: string, newBalance: number): Promise<void> => {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase
    .from('financial_accounts')
    .update({ current_balance: newBalance })
    .eq('id', accountId);
  if (error) throw error;
};

// ==========================================
// 5. OPERATIONS & SUB-COLLECTIONS
// ==========================================
export const fetchOperationsFromSupabase = async (): Promise<Operation[]> => {
  if (!isSupabaseConfigured()) return [];

  // Fetch parent operations
  const { data: opRows, error: opError } = await supabase
    .from('operations')
    .select('*')
    .order('date', { ascending: false });

  if (opError) throw opError;
  if (!opRows || opRows.length === 0) return [];

  // Fetch all related sub-tables in parallel for rich hydration
  const opIds = opRows.map(o => o.id);

  const [
    { data: checklistRows },
    { data: passengerRows },
    { data: itineraryRows },
    { data: quotaRows },
    { data: collectionRows },
    { data: contractRows },
    { data: paymentRows }
  ] = await Promise.all([
    supabase.from('operation_preparation_checklists').select('*').in('operation_id', opIds),
    supabase.from('operation_passengers').select('*').in('operation_id', opIds),
    supabase.from('operation_itinerary_items').select('*').in('operation_id', opIds).order('day_number', { ascending: true }),
    supabase.from('payment_quotas').select('*').in('operation_id', opIds).order('due_date', { ascending: true }),
    supabase.from('collections').select('*').in('operation_id', opIds).order('date', { ascending: false }),
    supabase.from('supplier_contracts').select('*').in('operation_id', opIds),
    supabase.from('supplier_payments').select('*').in('operation_id', opIds).order('date', { ascending: false })
  ]);

  return opRows.map(row => {
    // 1. Preparation checklist map
    const prepsForOp = (checklistRows || []).filter(c => c.operation_id === row.id);
    const preparationChecklist: PreparationChecklistMap = {};
    prepsForOp.forEach(p => {
      preparationChecklist[p.item_key] = p.status;
    });

    // 2. Passengers
    const passengersForOp = (passengerRows || []).filter(p => p.operation_id === row.id);
    const passengers: OperationPassenger[] = passengersForOp.map(p => ({
      id: p.id,
      name: p.name,
      lastName: p.last_name || undefined,
      documentId: p.document_id || undefined,
      birthDate: p.birth_date || undefined,
      country: p.country || undefined,
      email: p.email || undefined,
      phone: p.phone || undefined,
      isPayer: p.is_payer ?? false,
      totalPrice: p.total_price != null ? Number(p.total_price) : undefined,
      currency: p.currency || 'ARS',
      dietaryRestrictions: p.dietary_restrictions || undefined,
      participationStatus: p.participation_status || 'confirmado',
      checklist: {
        docComplete: p.doc_complete ?? false,
        authSigned: p.auth_signed ?? false,
        medicalForm: p.medical_form ?? false,
        notes: p.notes || undefined
      },
      notes: p.notes || undefined
    }));

    // 3. Itinerary Items
    const itineraryForOp = (itineraryRows || []).filter(i => i.operation_id === row.id);
    const itinerary: OperationItineraryItem[] = itineraryForOp.map(i => ({
      id: i.id,
      operationId: i.operation_id,
      dayNumber: Number(i.day_number || 1),
      date: i.date,
      time: i.time || '09:00',
      locationOrActivity: i.location_or_activity,
      supplierId: i.supplier_id || undefined,
      supplierName: i.supplier_name,
      serviceCategory: i.service_category || undefined,
      guideOrContact: i.guide_or_contact || undefined,
      totalCost: Number(i.total_cost || 0),
      currency: i.currency || 'ARS',
      depositPaid: Number(i.deposit_paid || 0),
      balance: Number(i.balance || 0),
      supplierStatus: i.supplier_status || 'pendiente',
      notes: i.notes || undefined
    }));

    // 4. Payment Quotas
    const quotasForOp = (quotaRows || []).filter(q => q.operation_id === row.id);
    const paymentQuotas: PaymentQuota[] = quotasForOp.map(q => ({
      id: q.id,
      operationId: q.operation_id,
      clientId: q.client_id || undefined,
      clientName: q.client_name,
      quotaType: q.quota_type,
      quotaNumber: q.quota_number != null ? Number(q.quota_number) : undefined,
      amount: Number(q.amount || 0),
      currency: q.currency,
      dueDate: q.due_date,
      status: q.status,
      paidAmount: Number(q.paid_amount || 0),
      balance: Number(q.balance || 0),
      expectedPaymentMethod: q.expected_payment_method || undefined,
      destinationAccountId: q.destination_account_id || undefined,
      notes: q.notes || undefined
    }));

    // 5. Collections
    const colsForOp = (collectionRows || []).filter(c => c.operation_id === row.id);
    const collections: CollectionRecord[] = colsForOp.map(c => ({
      id: c.id,
      operationId: c.operation_id,
      operationCode: row.code,
      clientId: c.client_id || undefined,
      clientName: c.client_name,
      quotaId: c.quota_id || undefined,
      concept: c.concept,
      date: c.date,
      amount: Number(c.amount || 0),
      currency: c.currency,
      paymentMethod: c.payment_method,
      destinationAccountId: c.destination_account_id,
      voucherOrReference: c.voucher_or_reference || undefined,
      movementId: c.movement_id || undefined,
      notes: c.notes || undefined,
      createdAt: c.created_at || new Date().toISOString()
    }));

    // 6. Supplier Contracts
    const contractsForOp = (contractRows || []).filter(c => c.operation_id === row.id);
    const supplierContracts: SupplierContract[] = contractsForOp.map(c => ({
      id: c.id,
      operationId: c.operation_id,
      supplierId: c.supplier_id,
      supplierName: c.supplier_name,
      serviceCategory: c.service_category,
      serviceDescription: c.service_description || undefined,
      expectedCost: Number(c.expected_cost || 0),
      currency: c.currency,
      dueDate: c.due_date,
      paidAmount: Number(c.paid_amount || 0),
      balance: Number(c.balance || 0),
      status: c.status,
      sourceAccountId: c.source_account_id || undefined,
      notes: c.notes || undefined
    }));

    // 7. Supplier Payments
    const paymentsForOp = (paymentRows || []).filter(p => p.operation_id === row.id);
    const supplierPayments: SupplierPaymentRecord[] = paymentsForOp.map(p => ({
      id: p.id,
      operationId: p.operation_id,
      supplierId: p.supplier_id,
      supplierName: p.supplier_name,
      contractId: p.contract_id || undefined,
      concept: p.concept,
      date: p.date,
      amount: Number(p.amount || 0),
      currency: p.currency,
      paymentMethod: p.payment_method,
      sourceAccountId: p.source_account_id,
      reference: p.reference || undefined,
      movementId: p.movement_id || undefined,
      notes: p.notes || undefined,
      createdAt: p.created_at || new Date().toISOString()
    }));

    return {
      id: row.id,
      code: row.code,
      name: row.name,
      businessUnit: row.business_unit,
      receptiveChannel: row.receptive_channel || undefined,
      educationalModality: row.educational_modality || undefined,
      serviceType: row.service_type,
      clientOrSchool: row.client_or_school,
      clientId: row.client_id || undefined,
      agencyId: row.agency_id || undefined,
      destination: row.destination || undefined,
      date: row.date,
      endDate: row.end_date || undefined,
      passengerCount: Number(row.passenger_count || 1),
      expectedRevenue: Number(row.expected_revenue || 0),
      receivedRevenue: Number(row.received_revenue || 0),
      expectedCost: Number(row.expected_cost || 0),
      paidCost: Number(row.paid_cost || 0),
      grossCommercialValue: row.gross_commercial_value != null ? Number(row.gross_commercial_value) : undefined,
      agencyCommission: row.agency_commission != null ? Number(row.agency_commission) : undefined,
      status: row.status,
      responsiblePerson: row.responsible_person,
      observations: row.observations || undefined,
      currency: row.currency || 'ARS',
      
      // Enriched properties
      preparationChecklist,
      passengers,
      itinerary,
      paymentQuotas,
      collections,
      supplierContracts,
      supplierPayments,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
      incomes: collections.map(c => ({
        id: c.id,
        operationId: c.operationId,
        date: c.date,
        amount: c.amount,
        currency: c.currency,
        payerName: c.clientName,
        paymentMethod: c.paymentMethod,
        accountId: c.destinationAccountId,
        status: 'cobrado',
        reference: c.voucherOrReference,
        movementId: c.movementId
      })),
      suppliers: supplierContracts.map(s => ({
        id: s.id,
        operationId: s.operationId,
        supplierId: s.supplierId,
        supplierName: s.supplierName,
        serviceCategory: s.serviceCategory,
        expectedCost: s.expectedCost,
        paidCost: s.paidAmount,
        currency: s.currency,
        expectedPaymentDate: s.dueDate,
        status: s.status,
        notes: s.notes
      }))
    };
  });
};

export const saveOperationToSupabase = async (op: Partial<Operation>): Promise<Operation> => {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  const payload = {
    ...(op.id ? { id: op.id } : {}),
    code: op.code,
    name: op.name,
    business_unit: op.businessUnit,
    receptive_channel: op.receptiveChannel || null,
    educational_modality: op.educationalModality || null,
    service_type: op.serviceType || 'Paquete Completo',
    client_or_school: op.clientOrSchool,
    client_id: op.clientId || null,
    agency_id: op.agencyId || null,
    destination: op.destination || null,
    date: op.date,
    end_date: op.endDate || null,
    passenger_count: op.passengerCount ?? 1,
    expected_revenue: op.expectedRevenue ?? 0,
    received_revenue: op.receivedRevenue ?? 0,
    expected_cost: op.expectedCost ?? 0,
    paid_cost: op.paidCost ?? 0,
    gross_commercial_value: op.grossCommercialValue ?? null,
    agency_commission: op.agencyCommission ?? 0,
    status: op.status || 'confirmada',
    responsible_person: op.responsiblePerson || 'Operaciones',
    observations: op.observations || null,
    currency: op.currency || 'ARS'
  };

  const { data: savedOp, error: opError } = await supabase
    .from('operations')
    .upsert(payload)
    .select()
    .single();

  if (opError) throw opError;

  const operationId = savedOp.id;

  // Save preparation checklist if provided
  if (op.preparationChecklist && Object.keys(op.preparationChecklist).length > 0) {
    const checklistEntries = Object.entries(op.preparationChecklist).map(([key, status]) => {
      let category = 'operacion';
      if (key.includes('pasajero') || key.includes('medica') || key.includes('autoriza') || key.includes('dni')) category = 'pasajeros';
      else if (key.includes('transporte') || key.includes('hotel') || key.includes('guia') || key.includes('seguro')) category = 'proveedores';
      else if (key.includes('cobranza') || key.includes('anticipo') || key.includes('saldo')) category = 'finanzas';

      return {
        operation_id: operationId,
        item_key: key,
        category,
        status: status || 'pendiente'
      };
    });

    await supabase
      .from('operation_preparation_checklists')
      .upsert(checklistEntries, { onConflict: 'operation_id,item_key' });
  }

  // Save passengers if provided
  if (op.passengers && op.passengers.length > 0) {
    const passengerRows = op.passengers.map(p => ({
      ...(p.id && !p.id.startsWith('temp_') ? { id: p.id } : {}),
      operation_id: operationId,
      name: p.name,
      last_name: p.lastName || null,
      document_id: p.documentId || null,
      birth_date: p.birthDate || null,
      country: p.country || null,
      email: p.email || null,
      phone: p.phone || null,
      is_payer: p.isPayer ?? false,
      total_price: p.totalPrice ?? 0,
      currency: p.currency || 'ARS',
      dietary_restrictions: p.dietaryRestrictions || null,
      participation_status: p.participationStatus || 'confirmado',
      doc_complete: p.checklist?.docComplete ?? false,
      auth_signed: p.checklist?.authSigned ?? false,
      medical_form: p.checklist?.medicalForm ?? false,
      notes: p.notes || null
    }));

    await supabase.from('operation_passengers').upsert(passengerRows);
  }

  // Save itinerary items if provided
  if (op.itinerary && op.itinerary.length > 0) {
    const itineraryRows = op.itinerary.map(i => ({
      ...(i.id && !i.id.startsWith('temp_') ? { id: i.id } : {}),
      operation_id: operationId,
      day_number: i.dayNumber,
      date: i.date,
      time: i.time,
      location_or_activity: i.locationOrActivity,
      supplier_id: i.supplierId || null,
      supplier_name: i.supplierName,
      service_category: i.serviceCategory || null,
      guide_or_contact: i.guideOrContact || null,
      total_cost: i.totalCost,
      currency: i.currency,
      deposit_paid: i.depositPaid,
      balance: i.balance,
      supplier_status: i.supplierStatus,
      notes: i.notes || null
    }));

    await supabase.from('operation_itinerary_items').upsert(itineraryRows);
  }

  // Save payment quotas if provided
  if (op.quotas && op.quotas.length > 0) {
    const quotaRows = op.quotas.map(q => ({
      ...(q.id && !q.id.startsWith('temp_') ? { id: q.id } : {}),
      operation_id: operationId,
      client_id: q.clientId || null,
      client_name: q.clientName,
      quota_type: q.quotaType,
      quota_number: q.quotaNumber ?? 1,
      amount: q.amount,
      currency: q.currency,
      due_date: q.dueDate,
      status: q.status,
      paid_amount: q.paidAmount,
      balance: q.balance,
      expected_payment_method: q.expectedPaymentMethod || null,
      destination_account_id: q.destinationAccountId || null,
      notes: q.notes || null
    }));

    await supabase.from('payment_quotas').upsert(quotaRows);
  }

  return {
    ...op,
    id: operationId,
    code: savedOp.code,
    name: savedOp.name,
    businessUnit: savedOp.business_unit,
    receptiveChannel: savedOp.receptive_channel || undefined,
    educationalModality: savedOp.educational_modality || undefined,
    serviceType: savedOp.service_type,
    clientOrSchool: savedOp.client_or_school,
    destination: savedOp.destination || undefined,
    date: savedOp.date,
    endDate: savedOp.end_date || undefined,
    passengerCount: Number(savedOp.passenger_count),
    expectedRevenue: Number(savedOp.expected_revenue),
    receivedRevenue: Number(savedOp.received_revenue),
    expectedCost: Number(savedOp.expected_cost),
    paidCost: Number(savedOp.paid_cost),
    status: savedOp.status,
    responsiblePerson: savedOp.responsible_person,
    currency: savedOp.currency
  } as Operation;
};

export const deleteOperationFromSupabase = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('operations').delete().eq('id', id);
  if (error) throw error;
};

// ==========================================
// 6. COLLECTIONS & PAYMENTS
// ==========================================
export const recordCollectionInSupabase = async (col: {
  operationId: string;
  clientId?: string;
  clientName: string;
  quotaId?: string;
  concept: string;
  date: string;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  destinationAccountId: string;
  voucherOrReference?: string;
  movementId?: string;
  notes?: string;
}): Promise<CollectionRecord> => {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  // 1. Insert collection record
  const { data, error } = await supabase
    .from('collections')
    .insert({
      operation_id: col.operationId,
      client_id: col.clientId || null,
      client_name: col.clientName,
      quota_id: col.quotaId || null,
      concept: col.concept,
      date: col.date,
      amount: col.amount,
      currency: col.currency,
      payment_method: col.paymentMethod,
      destination_account_id: col.destinationAccountId,
      voucher_or_reference: col.voucherOrReference || null,
      movement_id: col.movementId || null,
      notes: col.notes || null
    })
    .select()
    .single();

  if (error) throw error;

  // 2. If quota specified, update quota paid amount
  if (col.quotaId) {
    const { data: qData } = await supabase.from('payment_quotas').select('*').eq('id', col.quotaId).single();
    if (qData) {
      const newPaid = Number(qData.paid_amount || 0) + col.amount;
      const newBalance = Math.max(0, Number(qData.amount) - newPaid);
      const newStatus = newBalance === 0 ? 'pagada' : newPaid > 0 ? 'parcial' : 'pendiente';
      await supabase.from('payment_quotas').update({
        paid_amount: newPaid,
        balance: newBalance,
        status: newStatus
      }).eq('id', col.quotaId);
    }
  }

  // 3. Update operation received_revenue
  const { data: opData } = await supabase.from('operations').select('received_revenue').eq('id', col.operationId).single();
  if (opData) {
    await supabase.from('operations').update({
      received_revenue: Number(opData.received_revenue || 0) + col.amount
    }).eq('id', col.operationId);
  }

  // 4. Update account balance
  const { data: accData } = await supabase.from('financial_accounts').select('current_balance').eq('id', col.destinationAccountId).single();
  if (accData) {
    await supabase.from('financial_accounts').update({
      current_balance: Number(accData.current_balance || 0) + col.amount
    }).eq('id', col.destinationAccountId);
  }

  return {
    id: data.id,
    operationId: data.operation_id,
    clientId: data.client_id || undefined,
    clientName: data.client_name,
    quotaId: data.quota_id || undefined,
    concept: data.concept,
    date: data.date,
    amount: Number(data.amount),
    currency: data.currency,
    paymentMethod: data.payment_method,
    destinationAccountId: data.destination_account_id,
    voucherOrReference: data.voucher_or_reference || undefined,
    movementId: data.movement_id || undefined,
    notes: data.notes || undefined,
    createdAt: data.created_at
  };
};

export const recordSupplierPaymentInSupabase = async (pay: {
  operationId: string;
  supplierId: string;
  supplierName: string;
  contractId?: string;
  concept: string;
  date: string;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  sourceAccountId: string;
  reference?: string;
  movementId?: string;
  notes?: string;
}): Promise<SupplierPaymentRecord> => {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  // 1. Insert payment record
  const { data, error } = await supabase
    .from('supplier_payments')
    .insert({
      operation_id: pay.operationId,
      supplier_id: pay.supplierId,
      supplier_name: pay.supplierName,
      contract_id: pay.contractId || null,
      concept: pay.concept,
      date: pay.date,
      amount: pay.amount,
      currency: pay.currency,
      payment_method: pay.paymentMethod,
      source_account_id: pay.sourceAccountId,
      reference: pay.reference || null,
      movement_id: pay.movementId || null,
      notes: pay.notes || null
    })
    .select()
    .single();

  if (error) throw error;

  // 2. If contract specified, update contract paid amount
  if (pay.contractId) {
    const { data: cData } = await supabase.from('supplier_contracts').select('*').eq('id', pay.contractId).single();
    if (cData) {
      const newPaid = Number(cData.paid_amount || 0) + pay.amount;
      const newBalance = Math.max(0, Number(cData.expected_cost) - newPaid);
      const newStatus = newBalance === 0 ? 'pagado' : newPaid > 0 ? 'parcial' : 'pendiente';
      await supabase.from('supplier_contracts').update({
        paid_amount: newPaid,
        balance: newBalance,
        status: newStatus
      }).eq('id', pay.contractId);
    }
  }

  // 3. Update operation paid_cost
  const { data: opData } = await supabase.from('operations').select('paid_cost').eq('id', pay.operationId).single();
  if (opData) {
    await supabase.from('operations').update({
      paid_cost: Number(opData.paid_cost || 0) + pay.amount
    }).eq('id', pay.operationId);
  }

  // 4. Update account balance (decrease)
  const { data: accData } = await supabase.from('financial_accounts').select('current_balance').eq('id', pay.sourceAccountId).single();
  if (accData) {
    await supabase.from('financial_accounts').update({
      current_balance: Number(accData.current_balance || 0) - pay.amount
    }).eq('id', pay.sourceAccountId);
  }

  return {
    id: data.id,
    operationId: data.operation_id,
    supplierId: data.supplier_id,
    supplierName: data.supplier_name,
    contractId: data.contract_id || undefined,
    concept: data.concept,
    date: data.date,
    amount: Number(data.amount),
    currency: data.currency,
    paymentMethod: data.payment_method,
    sourceAccountId: data.source_account_id,
    reference: data.reference || undefined,
    movementId: data.movement_id || undefined,
    notes: data.notes || undefined,
    createdAt: data.created_at
  };
};

// ==========================================
// 7. FINANCIAL MOVEMENTS (Ledger)
// ==========================================
export const fetchMovementsFromSupabase = async (): Promise<FinancialMovement[]> => {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('financial_movements')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    date: row.date,
    amount: Number(row.amount),
    currency: row.currency || 'ARS',
    type: row.type,
    description: row.description,
    rawPayerOrAlias: row.raw_payer_or_alias || undefined,
    accountId: row.account_id,
    targetAccountId: row.target_account_id || undefined,
    category: row.category || undefined,
    operationId: row.operation_id || undefined,
    supplierId: row.supplier_id || undefined,
    matchStatus: row.match_status || 'rojo',
    matchConfidence: row.match_confidence != null ? Number(row.match_confidence) : undefined,
    matchReason: row.match_reason || undefined,
    isInternalTransfer: row.is_internal_transfer ?? false,
    notes: row.notes || undefined,
    importedAt: row.imported_at || row.created_at || new Date().toISOString()
  }));
};

export const saveMovementToSupabase = async (mov: Partial<FinancialMovement>): Promise<FinancialMovement> => {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');

  const payload = {
    ...(mov.id ? { id: mov.id } : {}),
    date: mov.date,
    amount: mov.amount,
    currency: mov.currency || 'ARS',
    type: mov.type,
    description: mov.description,
    raw_payer_or_alias: mov.rawPayerOrAlias || null,
    account_id: mov.accountId,
    target_account_id: mov.targetAccountId || null,
    category: mov.category || null,
    operation_id: mov.operationId || null,
    supplier_id: mov.supplierId || null,
    match_status: mov.matchStatus || 'rojo',
    match_confidence: mov.matchConfidence ?? null,
    match_reason: mov.matchReason || null,
    is_internal_transfer: mov.isInternalTransfer ?? false,
    notes: mov.notes || null
  };

  const { data, error } = await supabase
    .from('financial_movements')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    date: data.date,
    amount: Number(data.amount),
    currency: data.currency,
    type: data.type,
    description: data.description,
    rawPayerOrAlias: data.raw_payer_or_alias || undefined,
    accountId: data.account_id,
    targetAccountId: data.target_account_id || undefined,
    category: data.category || undefined,
    operationId: data.operation_id || undefined,
    supplierId: data.supplier_id || undefined,
    matchStatus: data.match_status,
    matchConfidence: data.match_confidence != null ? Number(data.match_confidence) : undefined,
    matchReason: data.match_reason || undefined,
    isInternalTransfer: data.is_internal_transfer,
    notes: data.notes || undefined,
    importedAt: data.imported_at || data.created_at || new Date().toISOString()
  };
};

export const batchSaveMovementsToSupabase = async (movs: Partial<FinancialMovement>[]): Promise<number> => {
  if (!isSupabaseConfigured() || movs.length === 0) return 0;

  const payloads = movs.map(mov => ({
    date: mov.date,
    amount: mov.amount,
    currency: mov.currency || 'ARS',
    type: mov.type,
    description: mov.description,
    raw_payer_or_alias: mov.rawPayerOrAlias || null,
    account_id: mov.accountId,
    target_account_id: mov.targetAccountId || null,
    category: mov.category || null,
    operation_id: mov.operationId || null,
    supplier_id: mov.supplierId || null,
    match_status: mov.matchStatus || 'rojo',
    match_confidence: mov.matchConfidence ?? null,
    match_reason: mov.matchReason || null,
    is_internal_transfer: mov.isInternalTransfer ?? false,
    notes: mov.notes || null
  }));

  const { data, error } = await supabase
    .from('financial_movements')
    .insert(payloads)
    .select('id');

  if (error) throw error;
  return data ? data.length : 0;
};

export const deleteMovementFromSupabase = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('financial_movements').delete().eq('id', id);
  if (error) throw error;
};

export const clearMovementsInSupabase = async (): Promise<void> => {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('financial_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
};

// ==========================================
// 8. FIXED EXPENSES
// ==========================================
export const fetchFixedExpensesFromSupabase = async (): Promise<FixedExpense[]> => {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('fixed_expenses')
    .select('*')
    .order('due_day', { ascending: true });

  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    category: row.category,
    provider: row.provider,
    description: row.description,
    amount: Number(row.amount),
    currency: row.currency || 'ARS',
    frequency: row.frequency || 'mensual',
    dueDay: Number(row.due_day),
    paidFromAccountId: row.paid_from_account_id,
    status: row.status || 'activo',
    lastPaidDate: row.last_paid_date || undefined
  }));
};

export const saveFixedExpenseToSupabase = async (exp: Omit<FixedExpense, 'id'> & { id?: string }): Promise<FixedExpense> => {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const payload = {
    ...(exp.id ? { id: exp.id } : {}),
    category: exp.category,
    provider: exp.provider,
    description: exp.description,
    amount: exp.amount,
    currency: exp.currency || 'ARS',
    frequency: exp.frequency || 'mensual',
    due_day: exp.dueDay,
    paid_from_account_id: exp.paidFromAccountId,
    status: exp.status || 'activo',
    last_paid_date: exp.lastPaidDate || null
  };

  const { data, error } = await supabase
    .from('fixed_expenses')
    .upsert(payload)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    category: data.category,
    provider: data.provider,
    description: data.description,
    amount: Number(data.amount),
    currency: data.currency,
    frequency: data.frequency,
    dueDay: Number(data.due_day),
    paidFromAccountId: data.paid_from_account_id,
    status: data.status,
    lastPaidDate: data.last_paid_date || undefined
  };
};

export const deleteFixedExpenseFromSupabase = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('fixed_expenses').delete().eq('id', id);
  if (error) throw error;
};

// ==========================================
// 9. MONTHLY CLOSINGS & RULES
// ==========================================
export const fetchMonthlyClosingsFromSupabase = async (): Promise<MonthlyClosing[]> => {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('monthly_closings')
    .select('*')
    .order('year_month', { ascending: false });

  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    yearMonth: row.year_month,
    closedAt: row.closed_at || undefined,
    status: row.status,
    initialCash: Number(row.initial_cash || 0),
    totalIncome: Number(row.total_income || 0),
    totalExpense: Number(row.total_expense || 0),
    internalTransfersSum: Number(row.internal_transfers_sum || 0),
    calculatedFinalCash: Number(row.calculated_final_cash || 0),
    actualAccountCash: Number(row.actual_account_cash || 0),
    reconciliationDifference: Number(row.reconciliation_difference || 0),
    operationsCount: Number(row.operations_count || 0),
    closedBy: row.closed_by || undefined,
    notes: row.notes || undefined
  }));
};

export const saveMonthlyClosingToSupabase = async (closing: MonthlyClosing): Promise<void> => {
  if (!isSupabaseConfigured()) return;
  const payload = {
    id: closing.id,
    year_month: closing.yearMonth,
    closed_at: closing.closedAt || null,
    status: closing.status,
    initial_cash: closing.initialCash,
    total_income: closing.totalIncome,
    total_expense: closing.totalExpense,
    internal_transfers_sum: closing.internalTransfersSum,
    calculated_final_cash: closing.calculatedFinalCash,
    actual_account_cash: closing.actualAccountCash,
    reconciliation_difference: closing.reconciliationDifference,
    operations_count: closing.operationsCount,
    closed_by: closing.closedBy || null,
    notes: closing.notes || null
  };

  const { error } = await supabase.from('monthly_closings').upsert(payload);
  if (error) throw error;
};

export const fetchClassificationRulesFromSupabase = async (): Promise<ClassificationRule[]> => {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('classification_rules')
    .select('*');

  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    pattern: row.pattern,
    ruleType: row.rule_type,
    targetSupplierId: row.target_supplier_id || undefined,
    targetCategory: row.target_category || undefined,
    targetOperationId: row.target_operation_id || undefined,
    isInternalTransfer: row.is_internal_transfer ?? false,
    sourceAccountId: row.source_account_id || undefined,
    destinationAccountId: row.destination_account_id || undefined,
    createdAt: row.created_at || new Date().toISOString()
  }));
};

export const saveClassificationRuleToSupabase = async (rule: Omit<ClassificationRule, 'id' | 'createdAt'>): Promise<ClassificationRule> => {
  if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
  const payload = {
    pattern: rule.pattern,
    rule_type: rule.ruleType,
    target_supplier_id: rule.targetSupplierId || null,
    target_category: rule.targetCategory || null,
    target_operation_id: rule.targetOperationId || null,
    is_internal_transfer: rule.isInternalTransfer ?? false,
    source_account_id: rule.sourceAccountId || null,
    destination_account_id: rule.destinationAccountId || null
  };

  const { data, error } = await supabase
    .from('classification_rules')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  return {
    id: data.id,
    pattern: data.pattern,
    ruleType: data.rule_type,
    targetSupplierId: data.target_supplier_id || undefined,
    targetCategory: data.target_category || undefined,
    targetOperationId: data.target_operation_id || undefined,
    isInternalTransfer: data.is_internal_transfer,
    sourceAccountId: data.source_account_id || undefined,
    destinationAccountId: data.destination_account_id || undefined,
    createdAt: data.created_at
  };
};

export const deleteClassificationRuleFromSupabase = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.from('classification_rules').delete().eq('id', id);
  if (error) throw error;
};

// ==========================================
// 10. SEED INITIAL DATA TO SUPABASE
// ==========================================
export const seedInitialDataToSupabase = async (
  accounts: FinancialAccount[],
  suppliers: Supplier[],
  clients: Client[],
  operations: Operation[],
  fixedExpenses: FixedExpense[],
  movements: FinancialMovement[]
): Promise<{ success: boolean; message: string }> => {
  if (!isSupabaseConfigured()) {
    return { success: false, message: 'Supabase no está configurado con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY' };
  }

  try {
    // 1. Accounts
    for (const acc of accounts) {
      await saveAccountToSupabase(acc);
    }

    // 2. Suppliers
    for (const sup of suppliers) {
      await saveSupplierToSupabase(sup);
    }

    // 3. Clients
    for (const cl of clients) {
      await saveClientToSupabase(cl);
    }

    // 4. Operations (with sub-records)
    for (const op of operations) {
      await saveOperationToSupabase(op);
    }

    // 5. Fixed Expenses
    for (const fx of fixedExpenses) {
      await saveFixedExpenseToSupabase(fx);
    }

    // 6. Movements
    if (movements.length > 0) {
      await batchSaveMovementsToSupabase(movements);
    }

    return { success: true, message: 'Datos semilla insertados correctamente en Supabase.' };
  } catch (err: any) {
    console.error('Error seeding data to Supabase:', err);
    return { success: false, message: `Error al insertar datos en Supabase: ${err.message || err}` };
  }
};
