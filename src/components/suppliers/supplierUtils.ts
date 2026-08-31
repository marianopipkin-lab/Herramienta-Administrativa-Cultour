import { Supplier, Operation, Currency, BusinessUnit } from '../../types';

export interface SupplierItemBreakdown {
  id: string;
  operationId: string;
  operationCode: string;
  operationName: string;
  operationDate: string; // Fecha de servicio
  clientOrSchool: string;
  businessUnit: BusinessUnit;
  destination?: string;
  serviceCategory: string;
  serviceDescription?: string;
  expectedCost: number;
  paidCost: number;
  balance: number;
  dueDate: string; // Fecha de vencimiento
  currency: Currency;
  status: 'pagado' | 'parcial' | 'pendiente' | 'vencido';
  alertStatus: 'vencido' | 'urgente_15d' | 'en_fecha' | 'pagado';
  daysDifference: number; // Negativo = días vencido, Positivo = días restantes
  notes?: string;
}

export interface SupplierSummaryStats {
  supplierId: string;
  totalContracted: number;
  totalPaid: number;
  totalBalance: number;
  operationsCount: number;
  operationIds: string[];
  itemsCount: number;
  hasExpired: boolean;
  hasUrgent15d: boolean;
  expiredCount: number;
  urgent15dCount: number;
  expiredAmount: number;
  urgent15dAmount: number;
  overallAlert: 'vencido' | 'urgente_15d' | 'al_dia';
}

/**
 * Calculates day difference from today to a given date string (YYYY-MM-DD)
 * Returns negative if date is in the past, 0 for today, positive for future
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
 * Extracts and consolidates all individual supplier contract/service rows across all operations
 * Ordered chronologically by operation service date.
 */
export function getSupplierBreakdown(supplier: Supplier, operations: Operation[]): SupplierItemBreakdown[] {
  const items: SupplierItemBreakdown[] = [];
  const sNameLower = supplier.name.trim().toLowerCase();
  const sId = supplier.id;

  operations.forEach(op => {
    // 1. Check op.supplierContracts
    if (op.supplierContracts && op.supplierContracts.length > 0) {
      op.supplierContracts.forEach(sc => {
        if (sc.supplierId === sId || (sc.supplierName && sc.supplierName.trim().toLowerCase() === sNameLower)) {
          const expected = Number(sc.expectedCost) || 0;
          let paid = Number(sc.paidAmount) || 0;
          
          if (op.supplierPayments && op.supplierPayments.length > 0) {
            const specificPays = op.supplierPayments
              .filter(p => p.contractId === sc.id || (p.supplierId === sId && !p.contractId))
              .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            if (specificPays > paid) paid = specificPays;
          }
          
          const balance = Math.max(0, expected - paid);
          const dueDate = sc.dueDate || op.date;
          const daysDiff = getDaysDifference(dueDate);
          
          let alertStatus: SupplierItemBreakdown['alertStatus'] = 'en_fecha';
          if (balance <= 0) {
            alertStatus = 'pagado';
          } else if (daysDiff < 0) {
            alertStatus = 'vencido';
          } else if (daysDiff <= 15) {
            alertStatus = 'urgente_15d';
          }

          items.push({
            id: sc.id || `sc_${op.id}_${items.length}`,
            operationId: op.id,
            operationCode: op.code,
            operationName: op.name,
            operationDate: op.date,
            clientOrSchool: op.clientOrSchool,
            businessUnit: op.businessUnit,
            destination: op.destination,
            serviceCategory: sc.serviceCategory || supplier.category,
            serviceDescription: sc.serviceDescription,
            expectedCost: expected,
            paidCost: paid,
            balance,
            dueDate,
            currency: sc.currency || op.currency || 'ARS',
            status: balance <= 0 ? 'pagado' : paid > 0 ? 'parcial' : daysDiff < 0 ? 'vencido' : 'pendiente',
            alertStatus,
            daysDifference: daysDiff,
            notes: sc.notes
          });
        }
      });
    }

    // 2. Check op.suppliers (SupplierCostRecord)
    if (op.suppliers && op.suppliers.length > 0) {
      op.suppliers.forEach(s => {
        if (s.supplierId === sId || (s.supplierName && s.supplierName.trim().toLowerCase() === sNameLower)) {
          // Check if already covered in items for this operation
          const alreadyAdded = items.some(
            it => it.operationId === op.id && 
            it.serviceCategory === s.serviceCategory && 
            Math.abs(it.expectedCost - s.expectedCost) < 0.01
          );
          
          if (!alreadyAdded) {
            const expected = Number(s.expectedCost) || 0;
            const paid = Number(s.paidCost) || 0;
            const balance = Math.max(0, expected - paid);
            const dueDate = s.expectedPaymentDate || op.date;
            const daysDiff = getDaysDifference(dueDate);
            
            let alertStatus: SupplierItemBreakdown['alertStatus'] = 'en_fecha';
            if (balance <= 0) {
              alertStatus = 'pagado';
            } else if (daysDiff < 0) {
              alertStatus = 'vencido';
            } else if (daysDiff <= 15) {
              alertStatus = 'urgente_15d';
            }

            items.push({
              id: s.id || `supc_${op.id}_${items.length}`,
              operationId: op.id,
              operationCode: op.code,
              operationName: op.name,
              operationDate: op.date,
              clientOrSchool: op.clientOrSchool,
              businessUnit: op.businessUnit,
              destination: op.destination,
              serviceCategory: s.serviceCategory || supplier.category,
              serviceDescription: s.notes,
              expectedCost: expected,
              paidCost: paid,
              balance,
              dueDate,
              currency: s.currency || op.currency || 'ARS',
              status: balance <= 0 ? 'pagado' : paid > 0 ? 'parcial' : daysDiff < 0 ? 'vencido' : 'pendiente',
              alertStatus,
              daysDifference: daysDiff,
              notes: s.notes
            });
          }
        }
      });
    }

    // 3. Check op.itinerary items (if not already matched)
    if (op.itinerary && op.itinerary.length > 0) {
      op.itinerary.forEach(it => {
        if (it.supplierId === sId || (it.supplierName && it.supplierName.trim().toLowerCase() === sNameLower)) {
          const alreadyAdded = items.some(
            item => item.operationId === op.id && 
            (item.serviceCategory === (it.serviceCategory || supplier.category) || item.id === it.id)
          );
          
          if (!alreadyAdded) {
            const expected = Number(it.totalCost) || 0;
            const paid = Number(it.depositPaid) || 0;
            const balance = Math.max(0, expected - paid);
            const dueDate = it.date || op.date;
            const daysDiff = getDaysDifference(dueDate);
            
            let alertStatus: SupplierItemBreakdown['alertStatus'] = 'en_fecha';
            if (balance <= 0) {
              alertStatus = 'pagado';
            } else if (daysDiff < 0) {
              alertStatus = 'vencido';
            } else if (daysDiff <= 15) {
              alertStatus = 'urgente_15d';
            }

            items.push({
              id: it.id || `itin_${op.id}_${items.length}`,
              operationId: op.id,
              operationCode: op.code,
              operationName: op.name,
              operationDate: it.date || op.date,
              clientOrSchool: op.clientOrSchool,
              businessUnit: op.businessUnit,
              destination: op.destination,
              serviceCategory: it.serviceCategory || supplier.category,
              serviceDescription: it.locationOrActivity,
              expectedCost: expected,
              paidCost: paid,
              balance,
              dueDate,
              currency: it.currency || op.currency || 'ARS',
              status: balance <= 0 ? 'pagado' : paid > 0 ? 'parcial' : daysDiff < 0 ? 'vencido' : 'pendiente',
              alertStatus,
              daysDifference: daysDiff,
              notes: it.notes
            });
          }
        }
      });
    }
  });

  // Sort strictly by operation service date chronologically
  return items.sort((a, b) => a.operationDate.localeCompare(b.operationDate));
}

/**
 * Computes supplier summary stats: Total Contratado, Total Pagado, Saldo, Cantidad de Files y Alertas
 */
export function getSupplierSummaryStats(supplier: Supplier, operations: Operation[]): SupplierSummaryStats {
  const breakdown = getSupplierBreakdown(supplier, operations);
  
  const opIdsSet = new Set<string>();
  let totalContracted = 0;
  let totalPaid = 0;
  let expiredCount = 0;
  let urgent15dCount = 0;
  let expiredAmount = 0;
  let urgent15dAmount = 0;

  breakdown.forEach(item => {
    opIdsSet.add(item.operationId);
    totalContracted += item.expectedCost;
    totalPaid += item.paidCost;

    if (item.alertStatus === 'vencido') {
      expiredCount++;
      expiredAmount += item.balance;
    } else if (item.alertStatus === 'urgente_15d') {
      urgent15dCount++;
      urgent15dAmount += item.balance;
    }
  });

  const totalBalance = Math.max(0, totalContracted - totalPaid);
  const hasExpired = expiredCount > 0;
  const hasUrgent15d = urgent15dCount > 0;

  let overallAlert: 'vencido' | 'urgente_15d' | 'al_dia' = 'al_dia';
  if (hasExpired) {
    overallAlert = 'vencido';
  } else if (hasUrgent15d) {
    overallAlert = 'urgente_15d';
  }

  return {
    supplierId: supplier.id,
    totalContracted,
    totalPaid,
    totalBalance,
    operationsCount: opIdsSet.size,
    operationIds: Array.from(opIdsSet),
    itemsCount: breakdown.length,
    hasExpired,
    hasUrgent15d,
    expiredCount,
    urgent15dCount,
    expiredAmount,
    urgent15dAmount,
    overallAlert
  };
}
