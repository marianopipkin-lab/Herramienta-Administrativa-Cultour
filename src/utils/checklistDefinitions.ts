import { PreparationItemDef, PreparationItemStatus, Operation } from '../types';

export const PREPARATION_CHECKLIST_DEFINITIONS: PreparationItemDef[] = [
  // 1. Pasajeros
  {
    key: 'passengerListComplete',
    label: 'Lista de Pasajeros Completa',
    category: 'pasajeros',
    description: 'Nómina nominal y cantidad final de pasajeros confirmada con el cliente.'
  },
  {
    key: 'passengerDataComplete',
    label: 'Datos Personales y Contacto',
    category: 'pasajeros',
    description: 'DNI / Pasaporte, fechas de nacimiento, tutores y teléfonos registrados.'
  },
  {
    key: 'passengerDocComplete',
    label: 'Documentación y Fichas Médicas',
    category: 'pasajeros',
    description: 'Autorizaciones firmadas, fichas de salud y restricciones dietarias cargadas.'
  },
  {
    key: 'passengerPaymentsAudited',
    label: 'Cobranzas de Pasajeros Auditadas',
    category: 'pasajeros',
    description: 'Control de cuotas al día y señas acreditadas en cuentas de destino.'
  },

  // 2. Proveedores
  {
    key: 'transportConfirmed',
    label: 'Transporte Confirmado',
    category: 'proveedores',
    description: 'Buses, traslados o vuelos reservados y reconfirmados con la empresa.'
  },
  {
    key: 'accommodationConfirmed',
    label: 'Alojamiento Confirmado',
    category: 'proveedores',
    description: 'Hoteles / cabañas con voucher emitido y rooming list asignado.'
  },
  {
    key: 'guidesConfirmed',
    label: 'Guías y Coordinadores Asignados',
    category: 'proveedores',
    description: 'Personal de campo contactado y briefing de servicio enviado.'
  },
  {
    key: 'excursionsConfirmed',
    label: 'Excursiones y Entradas Contratadas',
    category: 'proveedores',
    description: 'Tickets de parques, museos y actividades con cupo asegurado.'
  },
  {
    key: 'allServicesContracted',
    label: 'Todos los Servicios Contratados',
    category: 'proveedores',
    description: '100% de la cadena de proveedores con contrato o presupuesto aceptado.'
  },

  // 3. Finanzas
  {
    key: 'collectionsAudited',
    label: 'Cobranza 100% Auditada',
    category: 'finanzas',
    description: 'Verificación de que el ingreso total facturado coincide con lo cobrado.'
  },
  {
    key: 'suppliersContracted',
    label: 'Costos de Proveedores Presupuestados',
    category: 'finanzas',
    description: 'Costo total de la operación cargado y desglosado por proveedor.'
  },
  {
    key: 'advancesPaid',
    label: 'Anticipos de Proveedores Realizados',
    category: 'finanzas',
    description: 'Señas y pagos parciales exigibles transferidos a los prestadores.'
  },
  {
    key: 'supplierBalancesAudited',
    label: 'Saldos de Proveedores Controlados',
    category: 'finanzas',
    description: 'Cronograma de pagos de saldos conciliado con la tesorería.'
  },

  // 4. Operación
  {
    key: 'itineraryFinalized',
    label: 'Itinerario Operativo Finalizado',
    category: 'operacion',
    description: 'Cronograma minuto a minuto cerrado y validado con los guías.'
  },
  {
    key: 'guidesAssigned',
    label: 'Guías y Coordinadores en Sitio',
    category: 'operacion',
    description: 'Roles de guías, teléfonos de guardia y logística de bienvenida listos.'
  },
  {
    key: 'driversAssigned',
    label: 'Choferes y Vehículos Reconfirmados',
    category: 'operacion',
    description: 'Datos de unidades, patentes y choferes con habilitación al día.'
  },
  {
    key: 'schedulesConfirmed',
    label: 'Horarios Reconfirmados con Prestadores',
    category: 'operacion',
    description: 'Reconfirmación telefónica/WhatsApp 48-72h antes del inicio.'
  },
  {
    key: 'infoSentToClient',
    label: 'Información de Salida Enviada al Cliente',
    category: 'operacion',
    description: 'Punto de encuentro, recomendaciones y contactos enviados a pasajeros/colegio.'
  }
];

export function calculateOperationPreparationScore(checklistMap?: Record<string, PreparationItemStatus>): {
  totalItems: number;
  applicableItems: number;
  completedItems: number;
  inProgressItems: number;
  problemItems: number;
  pendingItems: number;
  percentage: number;
} {
  const map = checklistMap || {};
  let applicable = 0;
  let completed = 0;
  let inProgress = 0;
  let problem = 0;
  let pending = 0;

  PREPARATION_CHECKLIST_DEFINITIONS.forEach(def => {
    const status = map[def.key] || 'pendiente';
    if (status === 'no_aplica') {
      return; // Excluded from calculation per user rule!
    }
    applicable++;
    if (status === 'completado') {
      completed++;
    } else if (status === 'en_proceso') {
      inProgress++;
    } else if (status === 'con_problema') {
      problem++;
    } else {
      pending++;
    }
  });

  const percentage = applicable > 0 ? Math.round(((completed + (inProgress * 0.5)) / applicable) * 100) : 100;

  return {
    totalItems: PREPARATION_CHECKLIST_DEFINITIONS.length,
    applicableItems: applicable,
    completedItems: completed,
    inProgressItems: inProgress,
    problemItems: problem,
    pendingItems: pending,
    percentage: Math.min(100, Math.max(0, percentage))
  };
}

export interface OperationAlert {
  id: string;
  operationId: string;
  operationCode: string;
  operationName: string;
  daysUntilStart: number;
  startDate: string;
  type: 'unconfirmed_supplier' | 'pending_supplier_balance' | 'critical_preparation';
  severity: 'alta' | 'media' | 'baja';
  title: string;
  description: string;
  itemRef?: string;
}

export function checkOperationFifteenDayAlerts(operations: Operation[]): OperationAlert[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const alerts: OperationAlert[] = [];

  operations.forEach(op => {
    if (op.status === 'cancelada' || op.status === 'realizada') return;
    if (!op.date) return;

    const opDate = new Date(op.date + 'T00:00:00');
    const diffMs = opDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Regla de los 15 días: Si el File inicia en 15 días o menos
    if (diffDays >= -2 && diffDays <= 15) {
      // 1. Itinerario operativo
      if (op.itinerary && op.itinerary.length > 0) {
        op.itinerary.forEach((item, idx) => {
          if (item.supplierStatus !== 'reserva_confirmada' && item.supplierStatus !== 'reconfirmado_48h') {
            alerts.push({
              id: `${op.id}-itin-unconfirmed-${item.id || idx}`,
              operationId: op.id,
              operationCode: op.code,
              operationName: op.name || op.clientOrSchool,
              daysUntilStart: diffDays,
              startDate: op.date,
              type: 'unconfirmed_supplier',
              severity: diffDays <= 5 ? 'alta' : 'media',
              title: `Proveedor no confirmado a ${diffDays} días: ${item.supplierName || 'Sin asignar'}`,
              description: `Día ${item.dayNumber} (${item.date || op.date}) - ${item.locationOrActivity}. Estado actual: ${item.supplierStatus}.`,
              itemRef: item.id
            });
          }

          if (item.balance > 0) {
            alerts.push({
              id: `${op.id}-itin-balance-${item.id || idx}`,
              operationId: op.id,
              operationCode: op.code,
              operationName: op.name || op.clientOrSchool,
              daysUntilStart: diffDays,
              startDate: op.date,
              type: 'pending_supplier_balance',
              severity: diffDays <= 3 ? 'alta' : 'media',
              title: `Saldo a pagar a ${diffDays} días: ${item.supplierName} ($${item.balance.toLocaleString('es-AR')} ${item.currency})`,
              description: `Actividad: ${item.locationOrActivity}. Costo total: $${item.totalCost.toLocaleString('es-AR')}, Pagado: $${item.depositPaid.toLocaleString('es-AR')}.`,
              itemRef: item.id
            });
          }
        });
      }

      // 2. Score de preparación
      const prep = calculateOperationPreparationScore(op.preparationChecklist);
      if (prep.percentage < 70 && diffDays <= 10) {
        alerts.push({
          id: `${op.id}-prep-low`,
          operationId: op.id,
          operationCode: op.code,
          operationName: op.name || op.clientOrSchool,
          daysUntilStart: diffDays,
          startDate: op.date,
          type: 'critical_preparation',
          severity: 'alta',
          title: `Preparación al ${prep.percentage}% a ${diffDays} días de la salida`,
          description: `El File tiene ${prep.pendingItems + prep.inProgressItems} ítems pendientes en su checklist operativo.`,
        });
      }
    }
  });

  return alerts;
}
