import { Operation, CollectionRecord, PaymentQuota, StudentPayer, Currency, BusinessUnit, PaymentMethod, AccountId } from '../../types';

export type PeriodType = 'all' | 'day' | 'week' | 'fortnight' | 'month' | 'quarter' | 'year' | 'custom';
export type ClientCategory = 'all' | 'escuela' | 'agencia' | 'turista';

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  label: string;
}

export interface ClientQuotaItem {
  id: string;
  operationId: string;
  operationCode: string;
  operationName: string;
  operationDate: string;
  destination?: string;
  businessUnit: BusinessUnit;
  clientType: 'escuela' | 'agencia' | 'turista' | 'empresa' | 'otro';
  clientId: string;
  clientName: string;
  studentId?: string;
  studentName?: string;
  payerName?: string;
  payerPhone?: string;
  isLiberated?: boolean;
  concept: string;
  amount: number;
  paidAmount: number;
  balance: number;
  dueDate: string;
  currency: Currency;
  status: 'al_dia' | 'pago_parcial' | 'pendiente' | 'vencida' | 'liberado';
  alertStatus: 'vencido' | 'urgente_15d' | 'en_fecha' | 'pagado' | 'liberado';
  daysDifference: number;
  notes?: string;
}

export interface ClientCollectionItem {
  id: string;
  operationId: string;
  operationCode: string;
  operationName: string;
  operationDate: string;
  clientType: 'escuela' | 'agencia' | 'turista' | 'empresa' | 'otro';
  clientId?: string;
  clientName: string;
  studentId?: string;
  studentName?: string;
  payerName?: string;
  concept: string;
  date: string; // YYYY-MM-DD
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  destinationAccountId: AccountId;
  voucherOrReference?: string;
  notes?: string;
  createdAt?: string;
}

export interface ClientCollectionSummary {
  clientId: string;
  clientName: string;
  clientType: 'escuela' | 'agencia' | 'turista' | 'empresa' | 'otro';
  businessUnit: BusinessUnit;
  currency: Currency;
  
  // Operations involved
  operationIds: string[];
  operationsCount: number;
  operations: Array<{
    id: string;
    code: string;
    name: string;
    date: string;
    destination?: string;
    businessUnit: BusinessUnit;
    currency: Currency;
  }>;

  // Aggregate financial metrics
  totalContracted: number; // For school: sum of non-liberated student assigned prices. For others: sum of expected revenue.
  totalCollected: number;  // Sum of registered payments / receipts.
  totalPending: number;    // Difference (Contracted - Collected)
  
  // Student specific metrics (for schools)
  studentsCount: number;
  liberatedCount: number;
  payingStudentsCount: number;
  debtorStudentsCount: number;
  fullyPaidStudentsCount: number;
  partialStudentsCount: number;

  // Due dates & alerts
  nextDueDate: string | null;
  daysToNextDueDate: number | null;
  expiredQuotasCount: number;
  expiredQuotasAmount: number;
  urgent15dQuotasCount: number;
  urgent15dQuotasAmount: number;
  overallAlert: 'vencido' | 'urgente_15d' | 'en_fecha' | 'al_dia';

  // Period specific metrics (computed based on current active range)
  periodCollectedAmount: number;
  periodDueAmount: number;
  periodDueCount: number;

  // Breakdown items
  quotas: ClientQuotaItem[];
  collections: ClientCollectionItem[];
}

/**
 * Calculates day difference from today to targetDate (YYYY-MM-DD)
 * Negative = overdue by N days
 * 0 = due today
 * Positive = due in N days
 */
export function getDaysDifference(targetDateStr: string, baseDateStr?: string): number {
  if (!targetDateStr) return 999;
  const today = baseDateStr ? new Date(baseDateStr + 'T00:00:00') : new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDateStr + 'T00:00:00');
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Generates ISO date range for period selector
 */
export function getDateRangeForPeriod(
  period: PeriodType,
  customStart?: string,
  customEnd?: string,
  baseDate: Date = new Date()
): DateRange {
  const pad = (n: number) => String(n).padStart(2, '0');
  const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (period === 'custom' && customStart && customEnd) {
    return {
      start: customStart,
      end: customEnd,
      label: `Personalizado: ${customStart} al ${customEnd}`
    };
  }

  const y = baseDate.getFullYear();
  const m = baseDate.getMonth(); // 0-indexed
  const d = baseDate.getDate();

  switch (period) {
    case 'day': {
      const todayISO = toISO(baseDate);
      return {
        start: todayISO,
        end: todayISO,
        label: `Hoy (${todayISO})`
      };
    }
    case 'week': {
      // Monday to Sunday
      const dayOfWeek = baseDate.getDay(); // 0 is Sunday
      const distanceToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(y, m, d + distanceToMon);
      const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
      return {
        start: toISO(monday),
        end: toISO(sunday),
        label: `Esta Semana (${toISO(monday)} al ${toISO(sunday)})`
      };
    }
    case 'fortnight': {
      if (d <= 15) {
        const start = `${y}-${pad(m + 1)}-01`;
        const end = `${y}-${pad(m + 1)}-15`;
        return {
          start,
          end,
          label: `1ra Quincena (${start} al ${end})`
        };
      } else {
        const lastDay = new Date(y, m + 1, 0).getDate();
        const start = `${y}-${pad(m + 1)}-16`;
        const end = `${y}-${pad(m + 1)}-${pad(lastDay)}`;
        return {
          start,
          end,
          label: `2da Quincena (${start} al ${end})`
        };
      }
    }
    case 'month': {
      const lastDay = new Date(y, m + 1, 0).getDate();
      const start = `${y}-${pad(m + 1)}-01`;
      const end = `${y}-${pad(m + 1)}-${pad(lastDay)}`;
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      return {
        start,
        end,
        label: `${monthNames[m]} ${y}`
      };
    }
    case 'quarter': {
      const q = Math.floor(m / 3); // 0, 1, 2, 3
      const startMonth = q * 3;
      const endMonth = startMonth + 2;
      const lastDay = new Date(y, endMonth + 1, 0).getDate();
      const start = `${y}-${pad(startMonth + 1)}-01`;
      const end = `${y}-${pad(endMonth + 1)}-${pad(lastDay)}`;
      return {
        start,
        end,
        label: `Q${q + 1} ${y} (${start} al ${end})`
      };
    }
    case 'year': {
      const start = `${y}-01-01`;
      const end = `${y}-12-31`;
      return {
        start,
        end,
        label: `Año ${y}`
      };
    }
    case 'all':
    default: {
      return {
        start: '2020-01-01',
        end: '2030-12-31',
        label: 'Histórico Completo'
      };
    }
  }
}

/**
 * Checks if date falls within [start, end] inclusive
 */
export function isDateInRange(dateStr: string, start: string, end: string): boolean {
  if (!dateStr) return false;
  return dateStr >= start && dateStr <= end;
}

/**
 * Infers client type based on operation attributes
 */
export function inferClientType(op: Operation): 'escuela' | 'agencia' | 'turista' | 'empresa' {
  if (op.businessUnit === 'viajes' || op.educationalModality || (op.students && op.students.length > 0)) {
    return 'escuela';
  }
  if (op.businessUnit === 'salidas') {
    return 'escuela';
  }
  if (op.receptiveChannel === 'agencia' || op.agencyId || op.agencyName) {
    return 'agencia';
  }
  return 'turista';
}

/**
 * Aggregates all operations into client-level summaries.
 * Strict rules:
 * - For Schools:
 *   - totalContracted = Sum of assigned prices of all non-liberated students
 *   - totalCollected = Sum of registered collections/payments for these students or operation
 *   - totalPending = totalContracted - totalCollected
 *   - Liberated students sum zero and are not counted as debtors
 * - For Agencies / Tourists:
 *   - Aggregated from operation expected revenue and registered collections
 */
export function aggregateClientCollections(
  operations: Operation[],
  range: DateRange
): ClientCollectionSummary[] {
  const clientMap = new Map<string, {
    clientKey: string;
    clientName: string;
    clientType: 'escuela' | 'agencia' | 'turista' | 'empresa' | 'otro';
    businessUnit: BusinessUnit;
    currency: Currency;
    operations: Map<string, {
      id: string;
      code: string;
      name: string;
      date: string;
      destination?: string;
      businessUnit: BusinessUnit;
      currency: Currency;
    }>;
    quotas: ClientQuotaItem[];
    collections: ClientCollectionItem[];
    // Financial sums
    totalContracted: number;
    totalCollected: number;
    // Student counters
    studentsCount: number;
    liberatedCount: number;
    payingStudentsCount: number;
    debtorStudentsCount: number;
    fullyPaidStudentsCount: number;
    partialStudentsCount: number;
  }>();

  operations.forEach(op => {
    const rawClientName = (op.clientOrSchool || op.name || 'Cliente sin nombre').trim();
    const clientType = inferClientType(op);
    const clientKey = `${clientType}_${rawClientName.toLowerCase()}`;
    const opCurrency = op.currency || 'ARS';

    if (!clientMap.has(clientKey)) {
      clientMap.set(clientKey, {
        clientKey,
        clientName: rawClientName,
        clientType,
        businessUnit: op.businessUnit,
        currency: opCurrency,
        operations: new Map(),
        quotas: [],
        collections: [],
        totalContracted: 0,
        totalCollected: 0,
        studentsCount: 0,
        liberatedCount: 0,
        payingStudentsCount: 0,
        debtorStudentsCount: 0,
        fullyPaidStudentsCount: 0,
        partialStudentsCount: 0
      });
    }

    const clientEntry = clientMap.get(clientKey)!;

    // Track operation
    if (!clientEntry.operations.has(op.id)) {
      clientEntry.operations.set(op.id, {
        id: op.id,
        code: op.code,
        name: op.name,
        date: op.date,
        destination: op.destination,
        businessUnit: op.businessUnit,
        currency: opCurrency
      });
    }

    // Process Students (for Schools / Educational Trips)
    if (op.students && op.students.length > 0) {
      op.students.forEach((st: StudentPayer) => {
        clientEntry.studentsCount++;

        // Determine if student is liberated
        const isLiberated = st.isLiberated === true ||
          (st.notes && st.notes.toLowerCase().includes('liberado')) ||
          (st.notes && st.notes.toLowerCase().includes('becado')) ||
          (st.expectedAmount === 0);

        if (isLiberated) {
          clientEntry.liberatedCount++;
          // Liberated students add 0 to contracted, 0 to paid, 0 debt
          const quotaItem: ClientQuotaItem = {
            id: `st_${st.id}`,
            operationId: op.id,
            operationCode: op.code,
            operationName: op.name,
            operationDate: op.date,
            destination: op.destination,
            businessUnit: op.businessUnit,
            clientType: 'escuela',
            clientId: clientKey,
            clientName: rawClientName,
            studentId: st.id,
            studentName: st.studentName,
            payerName: st.payerName,
            payerPhone: st.payerPhone,
            isLiberated: true,
            concept: `Pasaje Liberado / Beca - ${st.studentName}`,
            amount: 0,
            paidAmount: 0,
            balance: 0,
            dueDate: st.paymentDueDate || op.date,
            currency: st.currency || opCurrency,
            status: 'liberado',
            alertStatus: 'liberado',
            daysDifference: 999,
            notes: st.notes || 'Alumno Liberado (Costo $0)'
          };
          clientEntry.quotas.push(quotaItem);
        } else {
          // Paying student
          clientEntry.payingStudentsCount++;
          const expected = Number(st.expectedAmount) || 0;
          const paid = Number(st.paidAmount) || 0;
          const balance = Math.max(0, expected - paid);
          const dueDate = st.paymentDueDate || op.date;
          const daysDiff = getDaysDifference(dueDate);

          clientEntry.totalContracted += expected;
          clientEntry.totalCollected += paid;

          if (balance <= 0) {
            clientEntry.fullyPaidStudentsCount++;
          } else if (paid > 0) {
            clientEntry.partialStudentsCount++;
            clientEntry.debtorStudentsCount++;
          } else {
            clientEntry.debtorStudentsCount++;
          }

          let alertStatus: ClientQuotaItem['alertStatus'] = 'en_fecha';
          let quotaStatus: ClientQuotaItem['status'] = 'pendiente';

          if (balance <= 0) {
            alertStatus = 'pagado';
            quotaStatus = 'al_dia';
          } else if (daysDiff < 0) {
            alertStatus = 'vencido';
            quotaStatus = 'vencida';
          } else if (daysDiff <= 15) {
            alertStatus = 'urgente_15d';
            quotaStatus = paid > 0 ? 'pago_parcial' : 'pendiente';
          } else {
            alertStatus = 'en_fecha';
            quotaStatus = paid > 0 ? 'pago_parcial' : 'pendiente';
          }

          const quotaItem: ClientQuotaItem = {
            id: `st_${st.id}`,
            operationId: op.id,
            operationCode: op.code,
            operationName: op.name,
            operationDate: op.date,
            destination: op.destination,
            businessUnit: op.businessUnit,
            clientType: 'escuela',
            clientId: clientKey,
            clientName: rawClientName,
            studentId: st.id,
            studentName: st.studentName,
            payerName: st.payerName,
            payerPhone: st.payerPhone,
            isLiberated: false,
            concept: `Cuota Alumno: ${st.studentName} (${st.payerName})`,
            amount: expected,
            paidAmount: paid,
            balance,
            dueDate,
            currency: st.currency || opCurrency,
            status: quotaStatus,
            alertStatus,
            daysDifference: daysDiff,
            notes: st.notes
          };
          clientEntry.quotas.push(quotaItem);
        }
      });
    } else if (op.quotas && op.quotas.length > 0) {
      // Operation has explicit quotas (e.g. Agency or Direct Tourist installments)
      op.quotas.forEach(q => {
        const expected = Number(q.amount) || 0;
        const paid = Number(q.paidAmount) || 0;
        const balance = Math.max(0, expected - paid);
        const dueDate = q.dueDate || op.date;
        const daysDiff = getDaysDifference(dueDate);

        clientEntry.totalContracted += expected;
        clientEntry.totalCollected += paid;

        if (balance > 0) {
          clientEntry.debtorStudentsCount++;
        } else {
          clientEntry.fullyPaidStudentsCount++;
        }

        let alertStatus: ClientQuotaItem['alertStatus'] = 'en_fecha';
        let quotaStatus: ClientQuotaItem['status'] = 'pendiente';

        if (balance <= 0) {
          alertStatus = 'pagado';
          quotaStatus = 'al_dia';
        } else if (daysDiff < 0) {
          alertStatus = 'vencido';
          quotaStatus = 'vencida';
        } else if (daysDiff <= 15) {
          alertStatus = 'urgente_15d';
          quotaStatus = paid > 0 ? 'pago_parcial' : 'pendiente';
        } else {
          alertStatus = 'en_fecha';
          quotaStatus = paid > 0 ? 'pago_parcial' : 'pendiente';
        }

        const quotaItem: ClientQuotaItem = {
          id: q.id,
          operationId: op.id,
          operationCode: op.code,
          operationName: op.name,
          operationDate: op.date,
          destination: op.destination,
          businessUnit: op.businessUnit,
          clientType,
          clientId: clientKey,
          clientName: rawClientName,
          concept: `Cuota ${q.quotaType.replace('_', ' ').toUpperCase()} (${op.code})`,
          amount: expected,
          paidAmount: paid,
          balance,
          dueDate,
          currency: q.currency || opCurrency,
          status: quotaStatus,
          alertStatus,
          daysDifference: daysDiff,
          notes: q.notes
        };
        clientEntry.quotas.push(quotaItem);
      });
    } else {
      // General operation without students or quotas (e.g. single service contract)
      const expected = Number(op.expectedRevenue) || 0;
      const paid = Number(op.receivedRevenue) || 0;
      const balance = Math.max(0, expected - paid);
      const dueDate = op.date;
      const daysDiff = getDaysDifference(dueDate);

      clientEntry.totalContracted += expected;
      clientEntry.totalCollected += paid;

      if (balance > 0) {
        clientEntry.debtorStudentsCount++;
      } else {
        clientEntry.fullyPaidStudentsCount++;
      }

      let alertStatus: ClientQuotaItem['alertStatus'] = 'en_fecha';
      let quotaStatus: ClientQuotaItem['status'] = 'pendiente';

      if (balance <= 0) {
        alertStatus = 'pagado';
        quotaStatus = 'al_dia';
      } else if (daysDiff < 0) {
        alertStatus = 'vencido';
        quotaStatus = 'vencida';
      } else if (daysDiff <= 15) {
        alertStatus = 'urgente_15d';
        quotaStatus = paid > 0 ? 'pago_parcial' : 'pendiente';
      } else {
        alertStatus = 'en_fecha';
        quotaStatus = paid > 0 ? 'pago_parcial' : 'pendiente';
      }

      const quotaItem: ClientQuotaItem = {
        id: `op_quota_${op.id}`,
        operationId: op.id,
        operationCode: op.code,
        operationName: op.name,
        operationDate: op.date,
        destination: op.destination,
        businessUnit: op.businessUnit,
        clientType,
        clientId: clientKey,
        clientName: rawClientName,
        concept: `Saldo de Operación: ${op.name} (${op.code})`,
        amount: expected,
        paidAmount: paid,
        balance,
        dueDate,
        currency: opCurrency,
        status: quotaStatus,
        alertStatus,
        daysDifference: daysDiff,
        notes: op.observations
      };
      clientEntry.quotas.push(quotaItem);
    }

    // Process Registered Collections (from op.collections or op.incomes)
    if (op.collections && op.collections.length > 0) {
      op.collections.forEach(col => {
        const colItem: ClientCollectionItem = {
          id: col.id,
          operationId: op.id,
          operationCode: op.code,
          operationName: op.name,
          operationDate: op.date,
          clientType,
          clientId: clientKey,
          clientName: col.clientName || rawClientName,
          concept: col.concept || `Cobro ${op.code}`,
          date: col.date,
          amount: Number(col.amount) || 0,
          currency: col.currency || opCurrency,
          paymentMethod: col.paymentMethod || 'mercado_pago',
          destinationAccountId: col.destinationAccountId || 'mp_mariano',
          voucherOrReference: col.voucherOrReference,
          notes: col.notes,
          createdAt: col.createdAt || col.date
        };
        clientEntry.collections.push(colItem);
      });
    } else if (op.incomes && op.incomes.length > 0) {
      op.incomes.forEach(inc => {
        const colItem: ClientCollectionItem = {
          id: inc.id,
          operationId: op.id,
          operationCode: op.code,
          operationName: op.name,
          operationDate: op.date,
          clientType,
          clientId: clientKey,
          clientName: inc.payerName || rawClientName,
          studentId: inc.studentId,
          concept: `Cobro Ingreso Operativo (${op.code})`,
          date: inc.date,
          amount: Number(inc.amount) || 0,
          currency: inc.currency || opCurrency,
          paymentMethod: inc.paymentMethod || 'mercado_pago',
          destinationAccountId: inc.accountId || 'mp_mariano',
          voucherOrReference: inc.reference,
          createdAt: inc.date
        };
        clientEntry.collections.push(colItem);
      });
    }
  });

  // Convert map to summaries
  const summaries: ClientCollectionSummary[] = [];

  clientMap.forEach(entry => {
    const totalPending = Math.max(0, entry.totalContracted - entry.totalCollected);

    // Calculate next due date and alert counts
    let nextDueDate: string | null = null;
    let daysToNextDueDate: number | null = null;
    let expiredQuotasCount = 0;
    let expiredQuotasAmount = 0;
    let urgent15dQuotasCount = 0;
    let urgent15dQuotasAmount = 0;

    // Filter pending quotas for due date tracking
    const pendingQuotas = entry.quotas
      .filter(q => q.balance > 0 && !q.isLiberated)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    if (pendingQuotas.length > 0) {
      nextDueDate = pendingQuotas[0].dueDate;
      daysToNextDueDate = pendingQuotas[0].daysDifference;
    }

    pendingQuotas.forEach(q => {
      if (q.alertStatus === 'vencido') {
        expiredQuotasCount++;
        expiredQuotasAmount += q.balance;
      } else if (q.alertStatus === 'urgente_15d') {
        urgent15dQuotasCount++;
        urgent15dQuotasAmount += q.balance;
      }
    });

    let overallAlert: ClientCollectionSummary['overallAlert'] = 'al_dia';
    if (expiredQuotasCount > 0) {
      overallAlert = 'vencido';
    } else if (urgent15dQuotasCount > 0) {
      overallAlert = 'urgente_15d';
    } else if (totalPending > 0) {
      overallAlert = 'en_fecha';
    }

    // Calculate period-specific metrics based on current active date range
    let periodCollectedAmount = 0;
    entry.collections.forEach(col => {
      if (isDateInRange(col.date, range.start, range.end)) {
        periodCollectedAmount += col.amount;
      }
    });

    let periodDueAmount = 0;
    let periodDueCount = 0;
    entry.quotas.forEach(q => {
      if (!q.isLiberated && isDateInRange(q.dueDate, range.start, range.end)) {
        periodDueAmount += q.balance;
        if (q.balance > 0) {
          periodDueCount++;
        }
      }
    });

    summaries.push({
      clientId: entry.clientKey,
      clientName: entry.clientName,
      clientType: entry.clientType,
      businessUnit: entry.businessUnit,
      currency: entry.currency,
      operationIds: Array.from(entry.operations.keys()),
      operationsCount: entry.operations.size,
      operations: Array.from(entry.operations.values()),
      totalContracted: entry.totalContracted,
      totalCollected: entry.totalCollected,
      totalPending,
      studentsCount: entry.studentsCount,
      liberatedCount: entry.liberatedCount,
      payingStudentsCount: entry.payingStudentsCount,
      debtorStudentsCount: entry.debtorStudentsCount,
      fullyPaidStudentsCount: entry.fullyPaidStudentsCount,
      partialStudentsCount: entry.partialStudentsCount,
      nextDueDate,
      daysToNextDueDate,
      expiredQuotasCount,
      expiredQuotasAmount,
      urgent15dQuotasCount,
      urgent15dQuotasAmount,
      overallAlert,
      periodCollectedAmount,
      periodDueAmount,
      periodDueCount,
      quotas: entry.quotas.sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
      collections: entry.collections.sort((a, b) => b.date.localeCompare(a.date))
    });
  });

  // Sort by overdue first, then balance descending, then client name
  return summaries.sort((a, b) => {
    if (a.overallAlert === 'vencido' && b.overallAlert !== 'vencido') return -1;
    if (b.overallAlert === 'vencido' && a.overallAlert !== 'vencido') return 1;
    if (a.overallAlert === 'urgente_15d' && b.overallAlert !== 'urgente_15d') return -1;
    if (b.overallAlert === 'urgente_15d' && a.overallAlert !== 'urgente_15d') return 1;
    if (b.totalPending !== a.totalPending) return b.totalPending - a.totalPending;
    return a.clientName.localeCompare(b.clientName);
  });
}
