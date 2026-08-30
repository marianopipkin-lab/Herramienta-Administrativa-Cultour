import {
  FinancialAccount,
  Supplier,
  Operation,
  FinancialMovement,
  FixedExpense,
  HistoricalPeriod,
  MonthlyClosing,
  ClassificationRule,
  CutoffConfig,
  Client
} from '../types';

export const INITIAL_CUTOFF_CONFIG: CutoffConfig = {
  cutoffDate: '2026-08-31',
  description: 'Corte inicial de saldos y arranque de sistema unificado',
  accountsInitialBalances: {
    mp_gaston: 4850000,
    mp_maria: 3420000,
    banco_santander: 14600000,
    banco_galicia: 6200000,
    caja_efectivo: 1150000,
    plazo_fijo: 12000000,
    paypal_cultour: 3200,
    wetravel_cultour: 4500,
    caja_usd: 2500,
  },
  initialFixedCostsMonthly: 4180000,
};

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli_1',
    type: 'escuela',
    name: 'Colegio San Andrés',
    documentId: '30-65481239-4',
    email: 'administracion@sanandres.edu.ar',
    phone: '+54 11 4744-1234',
    address: 'Olivos, Buenos Aires',
    notes: 'Cliente recurrente de Viajes de Egresados y Salidas Educativas',
    createdAt: '2026-01-10T10:00:00Z'
  },
  {
    id: 'cli_2',
    type: 'escuela',
    name: 'Instituto Santa María',
    documentId: '30-58912345-8',
    email: 'contacto@santamaria.edu.ar',
    phone: '+54 11 4822-5566',
    address: 'Recoleta, CABA',
    notes: 'Viajes de Estudio y Salidas Culturales',
    createdAt: '2026-02-15T11:00:00Z'
  },
  {
    id: 'cli_3',
    type: 'escuela',
    name: 'Colegio Belgrano Day School',
    documentId: '30-71029384-2',
    email: 'rectoria@bds.edu.ar',
    phone: '+54 11 4781-9900',
    address: 'Belgrano, CABA',
    createdAt: '2026-03-01T09:00:00Z'
  },
  {
    id: 'cli_4',
    type: 'escuela',
    name: 'Colegio San Martín de Tours',
    documentId: '30-66442211-7',
    email: 'primaria@smt.edu.ar',
    phone: '+54 11 4802-1122',
    address: 'Palermo, CABA',
    createdAt: '2026-03-12T14:00:00Z'
  },
  {
    id: 'cli_5',
    type: 'turista',
    name: 'Brasil Conexao Turismo Eireli',
    documentId: 'BR-14.283.912/0001-44',
    email: 'operacoes@brasilconexao.com.br',
    phone: '+55 11 98822-3344',
    country: 'Brasil',
    address: 'São Paulo, SP, Brasil',
    notes: 'Operador receptivo emisor de grupos corporativos y familiares',
    createdAt: '2026-04-05T10:00:00Z'
  },
  {
    id: 'cli_6',
    type: 'turista',
    name: 'Familia Smith (USA) - Private Group',
    email: 'john.smith.ny@gmail.com',
    phone: '+1 212 555-0198',
    country: 'Estados Unidos',
    notes: 'Turismo receptivo premium - Pagos con WeTravel / PayPal',
    createdAt: '2026-07-20T16:00:00Z'
  },
  {
    id: 'cli_7',
    type: 'alumno',
    name: 'Sofía Almada',
    institutionName: 'Colegio San Andrés',
    gradeOrGroup: '7mo Grado A',
    parentOrGuardianName: 'Mariano Almada (Padre)',
    parentPhone: '11-4411-2233',
    parentEmail: 'mariano.almada@gmail.com',
    notes: 'Cuota 100% saldada',
    createdAt: '2026-06-10T10:00:00Z'
  },
  {
    id: 'cli_8',
    type: 'alumno',
    name: 'Zoe Vázquez',
    institutionName: 'Colegio San Andrés',
    gradeOrGroup: '7mo Grado A',
    parentOrGuardianName: 'Pablo Vázquez (Padre)',
    parentPhone: '11-5599-0011',
    parentEmail: 'pablo.vazquez@live.com',
    notes: 'Saldo parcial adeudado ($90.000)',
    createdAt: '2026-06-10T10:00:00Z'
  },
  {
    id: 'cli_9',
    type: 'alumno',
    name: 'Bautista Zapata',
    institutionName: 'Colegio San Andrés',
    gradeOrGroup: '7mo Grado A',
    parentOrGuardianName: 'Lorena Zapata (Madre)',
    parentPhone: '11-6600-1122',
    notes: 'Cuota vencida adeudada ($180.000)',
    createdAt: '2026-06-10T10:00:00Z'
  }
];

export const INITIAL_ACCOUNTS: FinancialAccount[] = [
  {
    id: 'mp_gaston',
    name: 'Mercado Pago - Gastón',
    type: 'mercado_pago',
    currency: 'ARS',
    currentBalance: 5120000,
    initialBalance: 4850000,
    alias: 'gaston.turismo.mp',
    holder: 'Gastón Rodríguez (Titular)',
    description: 'Cobros principales de turismo receptivo y salidas educativas'
  },
  {
    id: 'mp_maria',
    name: 'Mercado Pago - Mariano / María',
    type: 'mercado_pago',
    currency: 'ARS',
    currentBalance: 3890000,
    initialBalance: 3420000,
    alias: 'maria.operaciones.mp',
    holder: 'María Elena Rossi (Socia)',
    description: 'Cobros de cuotas de padres en viajes educativos y pagos menores'
  },
  {
    id: 'paypal_cultour',
    name: 'PayPal - Cultour Oficial (USD)',
    type: 'paypal',
    currency: 'USD',
    currentBalance: 4850,
    initialBalance: 3200,
    holder: 'Cultour Trips LLC / Mariano',
    description: 'Cobros internacionales en USD de turistas extranjeros'
  },
  {
    id: 'wetravel_cultour',
    name: 'WeTravel - Cultour Receptivo (USD)',
    type: 'wetravel',
    currency: 'USD',
    currentBalance: 6200,
    initialBalance: 4500,
    holder: 'Cultour Trips WeTravel Account',
    description: 'Pasarela internacional de pagos para tours receptivos y grupos'
  },
  {
    id: 'banco_santander',
    name: 'Banco Santander - CC Operativa (ARS)',
    type: 'banco',
    currency: 'ARS',
    currentBalance: 15840000,
    initialBalance: 14600000,
    cbu: '0720182620000049281723',
    holder: 'Cultour SRL',
    description: 'Cuenta corriente empresarial para pagos a grandes proveedores y transferencias'
  },
  {
    id: 'banco_galicia',
    name: 'Banco Galicia - Cuenta Reserva (ARS)',
    type: 'banco',
    currency: 'ARS',
    currentBalance: 6450000,
    initialBalance: 6200000,
    cbu: '0070089120000031894562',
    holder: 'Cultour SRL',
    description: 'Fondo de respaldo operativo y pago de sueldos'
  },
  {
    id: 'caja_efectivo',
    name: 'Caja Chica Efectivo (ARS)',
    type: 'efectivo',
    currency: 'ARS',
    currentBalance: 1280000,
    initialBalance: 1150000,
    holder: 'Administración Oficina',
    description: 'Efectivo en bóveda para propinas, peajes, guías en mano y gastos inmediatos'
  },
  {
    id: 'caja_usd',
    name: 'Bóveda Dólares Efectivo (USD)',
    type: 'efectivo',
    currency: 'USD',
    currentBalance: 3100,
    initialBalance: 2500,
    holder: 'Tesorería Socios',
    description: 'Dólares billete recibidos de turistas y resguardo de reservas'
  },
  {
    id: 'plazo_fijo',
    name: 'Plazo Fijo / Inversión de Liquidez ARS',
    type: 'inversion',
    currency: 'ARS',
    currentBalance: 12000000,
    initialBalance: 12000000,
    holder: 'Banco Santander',
    description: 'Colocación transitoria con vencimiento a 30 días para no desvalorizar caja'
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup_1',
    name: 'Buses Sierras del Sur SRL',
    mpAlias: 'buses.sierras.mp',
    cbu: '0720023420000019283741',
    category: 'Transporte',
    serviceDescription: 'Micros de larga distancia doble piso y minibuses de turismo',
    contactName: 'Carlos Mendizábal',
    phone: '+54 9 11 4455-8899',
    email: 'administracion@sierrasdelsur.com.ar',
    defaultAccountId: 'banco_santander',
    active: true
  },
  {
    id: 'sup_2',
    name: 'Hotel Parque & Spa Carlos Paz',
    mpAlias: 'hotelparque.carlospaz',
    cbu: '0200341820000088712345',
    category: 'Alojamiento',
    serviceDescription: 'Pensión completa para contingentes estudiantiles y receptivo',
    contactName: 'Laura Benítez',
    phone: '+54 9 3541 42-9900',
    email: 'reservas@hotelparquecp.com.ar',
    defaultAccountId: 'banco_santander',
    active: true
  },
  {
    id: 'sup_3',
    name: 'Complejo Turístico Tandil Aventura',
    mpAlias: 'tandil.aventura.mp',
    category: 'Entradas',
    serviceDescription: 'Tirolesa, escalada, laberinto y almuerzos campestres',
    contactName: 'Mariano Ocampo',
    phone: '+54 9 2293 45-1234',
    defaultAccountId: 'mp_gaston',
    active: true
  },
  {
    id: 'sup_4',
    name: 'Guías de Turismo Receptivo Asociados',
    mpAlias: 'guias.turismo.ba',
    category: 'Guías',
    serviceDescription: 'Guías bilingües inglés/portugués/español para CABA y Tigre',
    contactName: 'Florencia Varela',
    phone: '+54 9 11 6789-0123',
    defaultAccountId: 'mp_gaston',
    active: true
  },
  {
    id: 'sup_5',
    name: 'Catering Escolar La Huerta',
    mpAlias: 'catering.lahuerta.mp',
    category: 'Gastronomía',
    serviceDescription: 'Viandas nutritivas, desayunos y meriendas para salidas educativas',
    contactName: 'Esteban Suárez',
    phone: '+54 9 11 5566-7788',
    defaultAccountId: 'mp_maria',
    active: true
  },
  {
    id: 'sup_6',
    name: 'Universal Assistance Grupos',
    mpAlias: 'asistencia.viajes.mp',
    cbu: '0140023420000099128374',
    category: 'Seguros',
    serviceDescription: 'Cobertura médica integral y seguro de accidentes personales',
    contactName: 'Gerencia Comercial',
    email: 'grupos@universal-assistance.com',
    defaultAccountId: 'banco_santander',
    active: true
  },
  {
    id: 'sup_7',
    name: 'Catamarán Sturla Delta Tigre',
    mpAlias: 'sturla.delta.viajes',
    category: 'Transporte',
    serviceDescription: 'Paseos fluviales por 5 ríos del Delta',
    contactName: 'Ventas Corporativas',
    defaultAccountId: 'mp_gaston',
    active: true
  }
];

// Sample students for Viaje Educativo 1 (Colegio San Andrés - 20 estudiantes)
const SAN_ANDRES_STUDENTS = [
  { student: 'Sofía Almada', payer: 'Mariano Almada (Padre)', phone: '11-4411-2233', expected: 180000, paid: 180000, status: 'al_dia' as const, date: '2026-08-15', method: 'mercado_pago' as const },
  { student: 'Lucas Benítez', payer: 'Valeria Gómez (Madre)', phone: '11-5522-3344', expected: 180000, paid: 180000, status: 'al_dia' as const, date: '2026-08-18', method: 'transferencia' as const },
  { student: 'Valentina Cabrera', payer: 'Jorge Cabrera (Padre)', phone: '11-6633-4455', expected: 180000, paid: 180000, status: 'al_dia' as const, date: '2026-08-20', method: 'mercado_pago' as const },
  { student: 'Mateo Domínguez', payer: 'Patricia Domínguez (Madre)', phone: '11-7744-5566', expected: 180000, paid: 180000, status: 'al_dia' as const, date: '2026-08-22', method: 'mercado_pago' as const },
  { student: 'Emma Fernández', payer: 'Roberto Fernández (Padre)', phone: '11-8855-6677', expected: 180000, paid: 180000, status: 'al_dia' as const, date: '2026-08-25', method: 'mercado_pago' as const },
  { student: 'Joaquín García', payer: 'Silvia Rossi (Madre)', phone: '11-9966-7788', expected: 180000, paid: 180000, status: 'al_dia' as const, date: '2026-08-26', method: 'transferencia' as const },
  { student: 'Mía Herrera', payer: 'Gonzalo Herrera (Padre)', phone: '11-2277-8899', expected: 180000, paid: 180000, status: 'al_dia' as const, date: '2026-08-27', method: 'mercado_pago' as const },
  { student: 'Santiago Ibarra', payer: 'Clara Medina (Madre)', phone: '11-3388-9900', expected: 180000, paid: 180000, status: 'al_dia' as const, date: '2026-08-28', method: 'mercado_pago' as const },
  { student: 'Camila Juárez', payer: 'Eduardo Juárez (Padre)', phone: '11-4499-0011', expected: 180000, paid: 180000, status: 'al_dia' as const, date: '2026-08-29', method: 'mercado_pago' as const },
  { student: 'Benjamín López', payer: 'Mónica López (Madre)', phone: '11-5500-1122', expected: 180000, paid: 180000, status: 'al_dia' as const, date: '2026-08-29', method: 'mercado_pago' as const },
  { student: 'Martina Morales', payer: 'Alejandro Morales (Padre)', phone: '11-6611-2233', expected: 180000, paid: 180000, status: 'al_dia' as const, date: '2026-08-30', method: 'mercado_pago' as const },
  { student: 'Felipe Navarro', payer: 'Daniela Castro (Madre)', phone: '11-7722-3344', expected: 180000, paid: 180000, status: 'al_dia' as const, date: '2026-08-30', method: 'transferencia' as const },
  { student: 'Lucía Ortiz', payer: 'Marcelo Ortiz (Padre)', phone: '11-8833-4455', expected: 180000, paid: 180000, status: 'al_dia' as const, date: '2026-08-30', method: 'mercado_pago' as const },
  { student: 'Tomás Pereyra', payer: 'Beatriz Pereyra (Madre)', phone: '11-9944-5566', expected: 180000, paid: 180000, status: 'al_dia' as const, date: '2026-08-30', method: 'mercado_pago' as const },
  { student: 'Julieta Quiroga', payer: 'Gabriel Quiroga (Padre)', phone: '11-1155-6677', expected: 180000, paid: 180000, status: 'al_dia' as const, date: '2026-08-31', method: 'mercado_pago' as const },
  { student: 'Santino Ríos', payer: 'Elena Ríos (Madre)', phone: '11-2266-7788', expected: 180000, paid: 180000, status: 'al_dia' as const, date: '2026-08-31', method: 'transferencia' as const },
  { student: 'Delfina Silva', payer: 'Hugo Silva (Padre)', phone: '11-3377-8899', expected: 180000, paid: 180000, status: 'al_dia' as const, date: '2026-08-31', method: 'mercado_pago' as const },
  { student: 'Ignacio Torres', payer: 'Romina Torres (Madre)', phone: '11-4488-9900', expected: 180000, paid: 180000, status: 'al_dia' as const, date: '2026-08-31', method: 'mercado_pago' as const },
  // 2 pending students as described in prompt:
  { student: 'Zoe Vázquez', payer: 'Pablo Vázquez (Padre)', phone: '11-5599-0011', expected: 180000, paid: 90000, status: 'pago_parcial' as const, date: '2026-08-20', method: 'mercado_pago' as const, notes: 'Prometió cancelar saldo restante el 05/09' },
  { student: 'Bautista Zapata', payer: 'Lorena Zapata (Madre)', phone: '11-6600-1122', expected: 180000, paid: 0, status: 'pendiente' as const, notes: 'Reclamado por WhatsApp. Segundo aviso enviado.' }
];

export const INITIAL_OPERATIONS: Operation[] = [
  // VIAJES EDUCATIVOS
  {
    id: 'op_viaje_1',
    code: 'VE-2026-001',
    name: 'Viaje Egresados Primaria Tandil 4D/3N',
    businessUnit: 'viajes',
    currency: 'ARS',
    serviceType: 'Viaje Educativo & Aventura',
    clientOrSchool: 'Colegio San Andrés - 7mo Grado',
    date: '2026-09-14',
    endDate: '2026-09-17',
    passengerCount: 20,
    status: 'confirmada',
    responsiblePerson: 'Gastón Rodríguez',
    observations: '20 estudiantes inscriptos. 18 cuotas totales saldadas, 1 saldo parcial ($90.000) y 1 cuota pendiente ($180.000). Alojamiento señado al 50%.',
    expectedRevenue: 3600000, // 20 * 180,000
    receivedRevenue: 3330000, // 18 * 180k + 90k
    expectedCost: 2420000,
    paidCost: 1350000,
    incomes: [
      {
        id: 'inc_v1_1',
        operationId: 'op_viaje_1',
        date: '2026-08-31',
        amount: 3330000,
        payerName: 'Padres 7mo Grado Col. San Andrés (18 totales + 1 parcial)',
        paymentMethod: 'mercado_pago',
        accountId: 'mp_maria',
        status: 'cobrado',
        reference: 'MP-BATCH-SANANDRES'
      },
      {
        id: 'inc_v1_2',
        operationId: 'op_viaje_1',
        date: '2026-09-05',
        amount: 270000,
        payerName: 'Pablo Vázquez ($90k) + Lorena Zapata ($180k)',
        paymentMethod: 'mercado_pago',
        accountId: 'mp_maria',
        status: 'pendiente',
        reference: 'Saldo restante cuotas 7mo'
      }
    ],
    suppliers: [
      {
        id: 'supc_v1_1',
        operationId: 'op_viaje_1',
        supplierId: 'sup_1',
        supplierName: 'Buses Sierras del Sur SRL',
        serviceCategory: 'Transporte',
        mpAlias: 'buses.sierras.mp',
        expectedCost: 1100000,
        paidCost: 550000,
        expectedPaymentDate: '2026-09-10',
        actualPaymentDate: '2026-08-20',
        paidFromAccountId: 'banco_santander',
        paymentMethod: 'transferencia',
        status: 'parcial',
        notes: '50% de anticipo pagado. 50% restante a pagar 4 días antes de salir.'
      },
      {
        id: 'supc_v1_2',
        operationId: 'op_viaje_1',
        supplierId: 'sup_3',
        supplierName: 'Complejo Turístico Tandil Aventura',
        serviceCategory: 'Alojamiento y Actividades',
        mpAlias: 'tandil.aventura.mp',
        expectedCost: 980000,
        paidCost: 500000,
        expectedPaymentDate: '2026-09-12',
        actualPaymentDate: '2026-08-22',
        paidFromAccountId: 'mp_gaston',
        paymentMethod: 'mercado_pago',
        status: 'parcial',
        notes: 'Seña pagada. Saldo $480.000 contra ingreso al predio.'
      },
      {
        id: 'supc_v1_3',
        operationId: 'op_viaje_1',
        supplierId: 'sup_6',
        supplierName: 'Universal Assistance Grupos',
        serviceCategory: 'Seguros',
        expectedCost: 180000,
        paidCost: 180000,
        expectedPaymentDate: '2026-08-25',
        actualPaymentDate: '2026-08-25',
        paidFromAccountId: 'banco_santander',
        paymentMethod: 'transferencia',
        status: 'pagado',
        notes: 'Póliza colectiva N° 98124 cancelada al 100%.'
      },
      {
        id: 'supc_v1_4',
        operationId: 'op_viaje_1',
        supplierId: 'sup_4',
        supplierName: 'Guías de Turismo Receptivo Asociados',
        serviceCategory: 'Coordinación & Guías',
        expectedCost: 160000,
        paidCost: 120000,
        expectedPaymentDate: '2026-09-15',
        actualPaymentDate: '2026-08-28',
        paidFromAccountId: 'mp_gaston',
        paymentMethod: 'mercado_pago',
        status: 'parcial',
        notes: '2 coordinadores permanentes. Saldo $40.000 al regreso.'
      }
    ],
    students: SAN_ANDRES_STUDENTS.map((s, idx) => ({
      id: `std_sa_${idx + 1}`,
      operationId: 'op_viaje_1',
      studentName: s.student,
      payerName: s.payer,
      payerPhone: s.phone,
      expectedAmount: s.expected,
      paidAmount: s.paid,
      paymentDueDate: '2026-08-31',
      lastPaymentDate: s.date,
      paymentMethod: s.method,
      notes: s.notes,
      status: s.status
    })),
    createdAt: '2026-06-10T10:00:00Z',
    updatedAt: '2026-08-31T15:00:00Z'
  },
  {
    id: 'op_viaje_2',
    code: 'VE-2026-002',
    name: 'Viaje de Estudios Villa Carlos Paz & Sierras 6D/5N',
    businessUnit: 'viajes',
    currency: 'ARS',
    serviceType: 'Viaje de Estudios',
    clientOrSchool: 'Instituto Santa María - 5to Año',
    date: '2026-10-05',
    endDate: '2026-10-10',
    passengerCount: 34,
    status: 'confirmada',
    responsiblePerson: 'María Elena Rossi',
    observations: '34 pasajeros. Cobrado 85% de la recaudación total. Transporte señado, hotel al 60%.',
    expectedRevenue: 8500000,
    receivedRevenue: 7225000,
    expectedCost: 5600000,
    paidCost: 3200000,
    incomes: [
      {
        id: 'inc_v2_1',
        operationId: 'op_viaje_2',
        date: '2026-08-28',
        amount: 7225000,
        payerName: 'Comisión Padres 5to Año Santa María (30 cuotas completas)',
        paymentMethod: 'mercado_pago',
        accountId: 'mp_maria',
        status: 'cobrado',
        reference: 'MP-SANTA-MARIA-L1'
      },
      {
        id: 'inc_v2_2',
        operationId: 'op_viaje_2',
        date: '2026-09-20',
        amount: 1275000,
        payerName: '4 Alumnos pendientes cuota final',
        paymentMethod: 'transferencia',
        accountId: 'banco_santander',
        status: 'pendiente',
        reference: 'Cuota 3 final'
      }
    ],
    suppliers: [
      {
        id: 'supc_v2_1',
        operationId: 'op_viaje_2',
        supplierId: 'sup_1',
        supplierName: 'Buses Sierras del Sur SRL',
        serviceCategory: 'Transporte',
        mpAlias: 'buses.sierras.mp',
        expectedCost: 2600000,
        paidCost: 1300000,
        expectedPaymentDate: '2026-09-25',
        actualPaymentDate: '2026-08-15',
        paidFromAccountId: 'banco_santander',
        paymentMethod: 'transferencia',
        status: 'parcial'
      },
      {
        id: 'supc_v2_2',
        operationId: 'op_viaje_2',
        supplierId: 'sup_2',
        supplierName: 'Hotel Parque & Spa Carlos Paz',
        serviceCategory: 'Alojamiento',
        mpAlias: 'hotelparque.carlospaz',
        expectedCost: 2400000,
        paidCost: 1600000,
        expectedPaymentDate: '2026-09-28',
        actualPaymentDate: '2026-08-19',
        paidFromAccountId: 'banco_santander',
        paymentMethod: 'transferencia',
        status: 'parcial'
      },
      {
        id: 'supc_v2_3',
        operationId: 'op_viaje_2',
        supplierId: 'sup_6',
        supplierName: 'Universal Assistance Grupos',
        serviceCategory: 'Seguros',
        expectedCost: 300000,
        paidCost: 300000,
        expectedPaymentDate: '2026-08-20',
        actualPaymentDate: '2026-08-20',
        paidFromAccountId: 'banco_santander',
        paymentMethod: 'transferencia',
        status: 'pagado'
      },
      {
        id: 'supc_v2_4',
        operationId: 'op_viaje_2',
        supplierId: 'sup_4',
        supplierName: 'Guías de Turismo Receptivo Asociados',
        serviceCategory: 'Guías & Excursiones',
        expectedCost: 300000,
        paidCost: 0,
        expectedPaymentDate: '2026-10-02',
        paidFromAccountId: 'mp_gaston',
        paymentMethod: 'mercado_pago',
        status: 'pendiente'
      }
    ],
    createdAt: '2026-05-15T12:00:00Z',
    updatedAt: '2026-08-30T18:00:00Z'
  },

  // SALIDAS EDUCATIVAS
  {
    id: 'op_salida_1',
    code: 'SE-2026-015',
    name: 'Visita Museo de Ciencias Naturales La Plata',
    businessUnit: 'salidas',
    currency: 'ARS',
    serviceType: 'Salida Educativa de 1 Día',
    clientOrSchool: 'Colegio Belgrano Day School - 4to Grado',
    date: '2026-09-08',
    passengerCount: 45,
    status: 'confirmada',
    responsiblePerson: 'Gastón Rodríguez',
    observations: 'Salida de jornada completa. Incluye transporte en 1 bus doble piso, entradas guiadas al Museo de La Plata y viandas.',
    expectedRevenue: 1350000,
    receivedRevenue: 1350000,
    expectedCost: 890000,
    paidCost: 650000,
    incomes: [
      {
        id: 'inc_s1_1',
        operationId: 'op_salida_1',
        date: '2026-08-24',
        amount: 1350000,
        payerName: 'Asociación Padres Belgrano Day',
        paymentMethod: 'transferencia',
        accountId: 'banco_santander',
        status: 'cobrado',
        reference: 'TRANSF-BDS-9912'
      }
    ],
    suppliers: [
      {
        id: 'supc_s1_1',
        operationId: 'op_salida_1',
        supplierId: 'sup_1',
        supplierName: 'Buses Sierras del Sur SRL',
        serviceCategory: 'Transporte',
        mpAlias: 'buses.sierras.mp',
        expectedCost: 450000,
        paidCost: 450000,
        expectedPaymentDate: '2026-08-26',
        actualPaymentDate: '2026-08-26',
        paidFromAccountId: 'banco_santander',
        paymentMethod: 'transferencia',
        status: 'pagado'
      },
      {
        id: 'supc_s1_2',
        operationId: 'op_salida_1',
        supplierId: 'sup_5',
        supplierName: 'Catering Escolar La Huerta',
        serviceCategory: 'Gastronomía',
        mpAlias: 'catering.lahuerta.mp',
        expectedCost: 280000,
        paidCost: 200000,
        expectedPaymentDate: '2026-09-06',
        actualPaymentDate: '2026-08-27',
        paidFromAccountId: 'mp_gaston',
        paymentMethod: 'mercado_pago',
        status: 'parcial',
        notes: 'Saldo $80.000 al entregar viandas en el colegio'
      },
      {
        id: 'supc_s1_3',
        operationId: 'op_salida_1',
        supplierId: 'sup_4',
        supplierName: 'Guías de Turismo Receptivo Asociados',
        serviceCategory: 'Guías',
        expectedCost: 160000,
        paidCost: 0,
        expectedPaymentDate: '2026-09-08',
        paidFromAccountId: 'mp_gaston',
        paymentMethod: 'mercado_pago',
        status: 'pendiente'
      }
    ],
    createdAt: '2026-08-01T11:00:00Z',
    updatedAt: '2026-08-29T14:00:00Z'
  },
  {
    id: 'op_salida_2',
    code: 'SE-2026-016',
    name: 'Día de Campo y Granja Don Silvano',
    businessUnit: 'salidas',
    currency: 'ARS',
    serviceType: 'Salida de Campo & Tradición',
    clientOrSchool: 'Colegio San Martín de Tours - 2do Grado',
    date: '2026-09-22',
    passengerCount: 52,
    status: 'confirmada',
    responsiblePerson: 'María Elena Rossi',
    observations: 'Salida rural educativa con show folclórico, almuerzo campestre y actividades de granja.',
    expectedRevenue: 1820000,
    receivedRevenue: 910000,
    expectedCost: 1240000,
    paidCost: 500000,
    incomes: [
      {
        id: 'inc_s2_1',
        operationId: 'op_salida_2',
        date: '2026-08-26',
        amount: 910000,
        payerName: 'Colegio San Martín de Tours (Anticipo 50%)',
        paymentMethod: 'mercado_pago',
        accountId: 'mp_gaston',
        status: 'cobrado',
        reference: 'MP-SMT-ANT'
      },
      {
        id: 'inc_s2_2',
        operationId: 'op_salida_2',
        date: '2026-09-18',
        amount: 910000,
        payerName: 'Colegio San Martín de Tours (Saldo 50%)',
        paymentMethod: 'mercado_pago',
        accountId: 'mp_gaston',
        status: 'pendiente',
        reference: 'Saldo previo a salida'
      }
    ],
    suppliers: [
      {
        id: 'supc_s2_1',
        operationId: 'op_salida_2',
        supplierId: 'sup_1',
        supplierName: 'Buses Sierras del Sur SRL',
        serviceCategory: 'Transporte',
        mpAlias: 'buses.sierras.mp',
        expectedCost: 520000,
        paidCost: 260000,
        expectedPaymentDate: '2026-09-18',
        actualPaymentDate: '2026-08-26',
        paidFromAccountId: 'mp_gaston',
        paymentMethod: 'mercado_pago',
        status: 'parcial'
      },
      {
        id: 'supc_s2_2',
        operationId: 'op_salida_2',
        supplierId: 'sup_3',
        supplierName: 'Estancia Don Silvano (Capilla del Señor)',
        serviceCategory: 'Entradas & Gastronomía',
        expectedCost: 720000,
        paidCost: 240000,
        expectedPaymentDate: '2026-09-20',
        actualPaymentDate: '2026-08-27',
        paidFromAccountId: 'mp_gaston',
        paymentMethod: 'mercado_pago',
        status: 'parcial'
      }
    ],
    createdAt: '2026-08-05T09:00:00Z',
    updatedAt: '2026-08-28T16:00:00Z'
  },

  // TURISMO RECEPTIVO
  {
    id: 'op_rec_1',
    code: 'TR-2026-042',
    name: 'City Tour Arquitectónico + Navegación Delta Tigre Premium',
    businessUnit: 'receptivo',
    currency: 'ARS',
    serviceType: 'Tour Receptivo Exclusivo',
    clientOrSchool: 'Agencia Turismo Brasil Conexao (18 pax)',
    date: '2026-09-02',
    passengerCount: 18,
    status: 'confirmada',
    responsiblePerson: 'Gastón Rodríguez',
    observations: 'Grupo privado de San Pablo. Guía portugués, catamarán privado y almuerzo en Puerto de Frutos.',
    expectedRevenue: 2400000,
    receivedRevenue: 2400000,
    expectedCost: 1450000,
    paidCost: 1100000,
    incomes: [
      {
        id: 'inc_r1_1',
        operationId: 'op_rec_1',
        date: '2026-08-22',
        amount: 2400000,
        payerName: 'Brasil Conexao Turismo Eireli',
        paymentMethod: 'transferencia',
        accountId: 'banco_santander',
        status: 'cobrado',
        reference: 'SWIFT-BRCON-0822'
      }
    ],
    suppliers: [
      {
        id: 'supc_r1_1',
        operationId: 'op_rec_1',
        supplierId: 'sup_7',
        supplierName: 'Catamarán Sturla Delta Tigre',
        serviceCategory: 'Transporte Fluvial',
        mpAlias: 'sturla.delta.viajes',
        expectedCost: 480000,
        paidCost: 480000,
        expectedPaymentDate: '2026-08-25',
        actualPaymentDate: '2026-08-25',
        paidFromAccountId: 'mp_gaston',
        paymentMethod: 'mercado_pago',
        status: 'pagado'
      },
      {
        id: 'supc_r1_2',
        operationId: 'op_rec_1',
        supplierId: 'sup_1',
        supplierName: 'Buses Sierras del Sur SRL (Minibús Mercedes)',
        serviceCategory: 'Transporte Terrestre',
        mpAlias: 'buses.sierras.mp',
        expectedCost: 420000,
        paidCost: 420000,
        expectedPaymentDate: '2026-08-26',
        actualPaymentDate: '2026-08-26',
        paidFromAccountId: 'banco_santander',
        paymentMethod: 'transferencia',
        status: 'pagado'
      },
      {
        id: 'supc_r1_3',
        operationId: 'op_rec_1',
        supplierId: 'sup_4',
        supplierName: 'Guías de Turismo Receptivo Asociados (Guía Portugués)',
        serviceCategory: 'Guías',
        mpAlias: 'guias.turismo.ba',
        expectedCost: 200000,
        paidCost: 200000,
        expectedPaymentDate: '2026-08-28',
        actualPaymentDate: '2026-08-28',
        paidFromAccountId: 'mp_gaston',
        paymentMethod: 'mercado_pago',
        status: 'pagado'
      },
      {
        id: 'supc_r1_4',
        operationId: 'op_rec_1',
        supplierId: 'sup_5',
        supplierName: 'Restaurante El Muelle Tigre',
        serviceCategory: 'Gastronomía',
        expectedCost: 350000,
        paidCost: 0,
        expectedPaymentDate: '2026-09-02',
        paidFromAccountId: 'caja_efectivo',
        paymentMethod: 'efectivo',
        status: 'pendiente',
        notes: 'Pago en mano al finalizar el almuerzo'
      }
    ],
    createdAt: '2026-08-10T14:00:00Z',
    updatedAt: '2026-08-28T19:00:00Z'
  },
  {
    id: 'op_rec_2',
    code: 'TR-2026-043',
    name: 'Paquete Experiencia Cataratas del Iguazú 4D/3N',
    businessUnit: 'receptivo',
    currency: 'ARS',
    serviceType: 'Paquete Nacional Receptivo',
    clientOrSchool: 'Familia Henderson (USA - 6 pax)',
    date: '2026-09-18',
    endDate: '2026-09-21',
    passengerCount: 6,
    status: 'confirmada',
    responsiblePerson: 'Gastón Rodríguez',
    observations: 'Vuelos, hotel Loi Suites Iguazú, Gran Aventura y traslados privados.',
    expectedRevenue: 3800000,
    receivedRevenue: 1900000,
    expectedCost: 2750000,
    paidCost: 1400000,
    incomes: [
      {
        id: 'inc_r2_1',
        operationId: 'op_rec_2',
        date: '2026-08-18',
        amount: 1900000,
        payerName: 'David Henderson (Seña 50%)',
        paymentMethod: 'tarjeta',
        accountId: 'banco_santander',
        status: 'cobrado',
        reference: 'STRIPE-PAY-8821'
      },
      {
        id: 'inc_r2_2',
        operationId: 'op_rec_2',
        date: '2026-09-10',
        amount: 1900000,
        payerName: 'David Henderson (Saldo 50%)',
        paymentMethod: 'transferencia',
        accountId: 'banco_santander',
        status: 'pendiente',
        reference: 'Saldo 8 días antes'
      }
    ],
    suppliers: [
      {
        id: 'supc_r2_1',
        operationId: 'op_rec_2',
        supplierId: 'sup_2',
        supplierName: 'Hotel Loi Suites Iguazú',
        serviceCategory: 'Alojamiento',
        expectedCost: 1600000,
        paidCost: 800000,
        expectedPaymentDate: '2026-09-12',
        actualPaymentDate: '2026-08-20',
        paidFromAccountId: 'banco_santander',
        paymentMethod: 'transferencia',
        status: 'parcial'
      },
      {
        id: 'supc_r2_2',
        operationId: 'op_rec_2',
        supplierId: 'sup_1',
        supplierName: 'Iguazú Transfers & Excursiones',
        serviceCategory: 'Transporte & Guías',
        expectedCost: 1150000,
        paidCost: 600000,
        expectedPaymentDate: '2026-09-14',
        actualPaymentDate: '2026-08-22',
        paidFromAccountId: 'mp_gaston',
        paymentMethod: 'mercado_pago',
        status: 'parcial'
      }
    ],
    createdAt: '2026-08-12T16:00:00Z',
    updatedAt: '2026-08-29T10:00:00Z'
  },
  // OPERACIÓN HISTÓRICA RECIENTE
  {
    id: 'op_rec_old',
    code: 'TR-2026-039',
    name: 'Tour San Antonio de Areco & Fiesta Gaucha',
    businessUnit: 'receptivo',
    currency: 'ARS',
    serviceType: 'Tour de Campo',
    clientOrSchool: 'Grupo Turistas Franceses (12 pax)',
    date: '2026-08-16',
    passengerCount: 12,
    status: 'realizada',
    responsiblePerson: 'Gastón Rodríguez',
    observations: 'Operación cerrada y ejecutada exitosamente. 100% cobrada y 100% pagada.',
    expectedRevenue: 1600000,
    receivedRevenue: 1600000,
    expectedCost: 980000,
    paidCost: 980000,
    incomes: [
      {
        id: 'inc_ro_1',
        operationId: 'op_rec_old',
        date: '2026-08-12',
        amount: 1600000,
        payerName: 'Agence Voyages Paris',
        paymentMethod: 'transferencia',
        accountId: 'banco_santander',
        status: 'cobrado'
      }
    ],
    suppliers: [
      {
        id: 'supc_ro_1',
        operationId: 'op_rec_old',
        supplierId: 'sup_1',
        supplierName: 'Buses Sierras del Sur SRL',
        serviceCategory: 'Transporte',
        expectedCost: 520000,
        paidCost: 520000,
        expectedPaymentDate: '2026-08-14',
        actualPaymentDate: '2026-08-14',
        paidFromAccountId: 'banco_santander',
        paymentMethod: 'transferencia',
        status: 'pagado'
      },
      {
        id: 'supc_ro_2',
        operationId: 'op_rec_old',
        supplierId: 'sup_4',
        supplierName: 'Guías de Turismo Receptivo Asociados',
        serviceCategory: 'Guías',
        expectedCost: 460000,
        paidCost: 460000,
        expectedPaymentDate: '2026-08-16',
        actualPaymentDate: '2026-08-16',
        paidFromAccountId: 'mp_gaston',
        paymentMethod: 'mercado_pago',
        status: 'pagado'
      }
    ],
    createdAt: '2026-07-20T10:00:00Z',
    updatedAt: '2026-08-17T11:00:00Z'
  }
];

export const INITIAL_FIXED_EXPENSES: FixedExpense[] = [
  // EMPLEADOS
  {
    id: 'fix_1',
    category: 'empleados',
    provider: 'Equipo Coordinación & Operaciones',
    description: 'Sueldos fijos de personal de oficina y atención comercial (3 empleados)',
    amount: 1950000,
    currency: 'ARS',
    frequency: 'mensual',
    dueDay: 5,
    paidFromAccountId: 'banco_galicia',
    status: 'activo',
    lastPaidDate: '2026-08-05',
    isPaidCurrentMonth: true
  },
  {
    id: 'fix_2',
    category: 'empleados',
    provider: 'AFIP / Cargas Sociales & ART',
    description: 'Aportes, contribuciones patronales y ART Federación Patronal',
    amount: 720000,
    currency: 'ARS',
    frequency: 'mensual',
    dueDay: 15,
    paidFromAccountId: 'banco_santander',
    status: 'activo',
    lastPaidDate: '2026-08-15',
    isPaidCurrentMonth: true
  },
  // MARKETING
  {
    id: 'fix_3',
    category: 'marketing',
    provider: 'Google Ireland Ltd (Google Ads)',
    description: 'Campañas de búsqueda y display para turismo receptivo y salidas escolares',
    amount: 380000,
    currency: 'ARS',
    frequency: 'mensual',
    dueDay: 20,
    paidFromAccountId: 'banco_santander',
    status: 'activo',
    lastPaidDate: '2026-08-20',
    isPaidCurrentMonth: true
  },
  {
    id: 'fix_4',
    category: 'marketing',
    provider: 'Meta Platforms (Instagram & Facebook Ads)',
    description: 'Pauta publicitaria orientada a directivos de colegios y padres',
    amount: 260000,
    currency: 'ARS',
    frequency: 'mensual',
    dueDay: 22,
    paidFromAccountId: 'mp_gaston',
    status: 'activo',
    lastPaidDate: '2026-08-22',
    isPaidCurrentMonth: true
  },
  {
    id: 'fix_5',
    category: 'marketing',
    provider: 'Agencia Digital Impulso',
    description: 'Gestión de redes sociales, diseño de folletería digital y piezas comerciales',
    amount: 220000,
    currency: 'ARS',
    frequency: 'mensual',
    dueDay: 10,
    paidFromAccountId: 'mp_gaston',
    status: 'activo',
    lastPaidDate: '2026-08-10',
    isPaidCurrentMonth: true
  },
  // TECNOLOGÍA
  {
    id: 'fix_6',
    category: 'tecnologia',
    provider: 'Google Workspace & Cloud Storage',
    description: 'Cuentas corporativas de correo, Google Drive 2TB y backup de contratos',
    amount: 95000,
    currency: 'ARS',
    frequency: 'mensual',
    dueDay: 12,
    paidFromAccountId: 'banco_santander',
    status: 'activo',
    lastPaidDate: '2026-08-12',
    isPaidCurrentMonth: true
  },
  {
    id: 'fix_7',
    category: 'tecnologia',
    provider: 'Software de Facturación & Web Hosting',
    description: 'Licencia SaaS facturación electrónica AFIP y servidor web',
    amount: 85000,
    currency: 'ARS',
    frequency: 'mensual',
    dueDay: 18,
    paidFromAccountId: 'mp_gaston',
    status: 'activo',
    lastPaidDate: '2026-08-18',
    isPaidCurrentMonth: true
  },
  // ADMINISTRACIÓN
  {
    id: 'fix_8',
    category: 'administracion',
    provider: 'Estudio Contable & Jurídico Méndez',
    description: 'Asesoramiento impositivo mensual, liquidación de IVA, IIBB y balances',
    amount: 280000,
    currency: 'ARS',
    frequency: 'mensual',
    dueDay: 10,
    paidFromAccountId: 'banco_santander',
    status: 'activo',
    lastPaidDate: '2026-08-10',
    isPaidCurrentMonth: true
  },
  {
    id: 'fix_9',
    category: 'administracion',
    provider: 'Comisiones y Mantenimiento Bancario',
    description: 'Paquetes de cuenta corriente, mantenimiento cheques y terminales',
    amount: 110000,
    currency: 'ARS',
    frequency: 'mensual',
    dueDay: 28,
    paidFromAccountId: 'banco_santander',
    status: 'activo',
    lastPaidDate: '2026-08-28',
    isPaidCurrentMonth: true
  },
  {
    id: 'fix_10',
    category: 'otros',
    provider: 'Alquiler y Expensas Oficina Central',
    description: 'Alquiler comercial oficina Belgrano + expensas ordinarias y luz/fibra óptica',
    amount: 380000,
    currency: 'ARS',
    frequency: 'mensual',
    dueDay: 8,
    paidFromAccountId: 'banco_santander',
    status: 'activo',
    lastPaidDate: '2026-08-08',
    isPaidCurrentMonth: true
  }
];

export const INITIAL_MOVEMENTS: FinancialMovement[] = [
  // TRANSFERENCIA INTERNA DETECTADA 1: Banco -> MP Gastón
  {
    id: 'mov_1',
    date: '2026-08-15',
    amount: 1500000,
    type: 'transferencia_interna',
    description: 'Transferencia entre cuentas propias: Santander -> MP Gastón para fondeo',
    accountId: 'banco_santander',
    targetAccountId: 'mp_gaston',
    isInternalTransfer: true,
    matchStatus: 'verde',
    matchConfidence: 100,
    matchReason: 'Transferencia interna detectada entre cuentas de la empresa (No impacta ganancia ni gasto)',
    importedAt: '2026-08-31T09:00:00Z'
  },
  // TRANSFERENCIA INTERNA DETECTADA 2: MP Gastón -> MP María
  {
    id: 'mov_2',
    date: '2026-08-20',
    amount: 600000,
    type: 'transferencia_interna',
    description: 'Traspaso de fondos MP Gastón a MP María para pagos menores',
    accountId: 'mp_gaston',
    targetAccountId: 'mp_maria',
    isInternalTransfer: true,
    matchStatus: 'verde',
    matchConfidence: 100,
    matchReason: 'Transferencia interna reconocida entre cuentas MP registradas',
    importedAt: '2026-08-31T09:00:00Z'
  },

  // INGRESOS CONCILIADOS (VERDE)
  {
    id: 'mov_3',
    date: '2026-08-24',
    amount: 1350000,
    type: 'ingreso',
    description: 'TRANSF COLEGIO BELGRANO ASOC PADRES SALIDA LA PLATA',
    rawPayerOrAlias: 'ASOC COLEGIO BELGRANO',
    accountId: 'banco_santander',
    operationId: 'op_salida_1',
    category: 'Ingreso Operativo - Salidas Educativas',
    isInternalTransfer: false,
    matchStatus: 'verde',
    matchConfidence: 100,
    matchReason: 'Coincidencia exacta con recaudación esperada y cliente de SE-2026-015',
    importedAt: '2026-08-31T09:00:00Z'
  },
  {
    id: 'mov_4',
    date: '2026-08-22',
    amount: 2400000,
    type: 'ingreso',
    description: 'ORDEN DE PAGO EXTERIOR BRASIL CONEXAO TURISMO EIRELI',
    rawPayerOrAlias: 'BRASIL CONEXAO',
    accountId: 'banco_santander',
    operationId: 'op_rec_1',
    category: 'Ingreso Operativo - Turismo Receptivo',
    isInternalTransfer: false,
    matchStatus: 'verde',
    matchConfidence: 100,
    matchReason: 'Coincidencia con cliente y monto total de City Tour Tigre TR-2026-042',
    importedAt: '2026-08-31T09:00:00Z'
  },
  {
    id: 'mov_5',
    date: '2026-08-26',
    amount: 910000,
    type: 'ingreso',
    description: 'Cobro recibido vía MP de Colegio San Martín de Tours (Seña 50%)',
    rawPayerOrAlias: 'sanmartin.tours.mp',
    accountId: 'mp_gaston',
    operationId: 'op_salida_2',
    category: 'Ingreso Operativo - Salidas Educativas',
    isInternalTransfer: false,
    matchStatus: 'verde',
    matchConfidence: 98,
    matchReason: 'Coincidencia con seña esperada de SE-2026-016',
    importedAt: '2026-08-31T09:00:00Z'
  },
  {
    id: 'mov_6',
    date: '2026-08-31',
    amount: 3330000,
    type: 'ingreso',
    description: 'Lote consolidado cuotas Viaje Tandil 7mo San Andrés (18 padres + 1 parcial)',
    rawPayerOrAlias: 'LOTE PADRES SAN ANDRES',
    accountId: 'mp_maria',
    operationId: 'op_viaje_1',
    category: 'Ingreso Operativo - Viajes Educativos',
    isInternalTransfer: false,
    matchStatus: 'verde',
    matchConfidence: 95,
    matchReason: 'Total consolidado de 19 pagos de padres para VE-2026-001',
    importedAt: '2026-08-31T09:00:00Z'
  },

  // EGRESOS A PROVEEDORES CONCILIADOS (VERDE)
  {
    id: 'mov_7',
    date: '2026-08-20',
    amount: 550000,
    type: 'egreso',
    description: 'PAGO TRANSFERENCIA A BUSES SIERRAS DEL SUR SRL SEÑA TANDIL',
    rawPayerOrAlias: 'buses.sierras.mp',
    accountId: 'banco_santander',
    supplierId: 'sup_1',
    operationId: 'op_viaje_1',
    category: 'Costo Operativo - Transporte',
    isInternalTransfer: false,
    matchStatus: 'verde',
    matchConfidence: 100,
    matchReason: 'Proveedor reconocido por CBU y Alias. Vinculado a VE-2026-001',
    importedAt: '2026-08-31T09:00:00Z'
  },
  {
    id: 'mov_8',
    date: '2026-08-22',
    amount: 500000,
    type: 'egreso',
    description: 'Envío de dinero MP a tandil.aventura.mp seña complejo',
    rawPayerOrAlias: 'tandil.aventura.mp',
    accountId: 'mp_gaston',
    supplierId: 'sup_3',
    operationId: 'op_viaje_1',
    category: 'Costo Operativo - Alojamiento',
    isInternalTransfer: false,
    matchStatus: 'verde',
    matchConfidence: 100,
    matchReason: 'Alias coincide exactamente con Proveedor Complejo Tandil Aventura',
    importedAt: '2026-08-31T09:00:00Z'
  },
  {
    id: 'mov_9',
    date: '2026-08-25',
    amount: 480000,
    type: 'egreso',
    description: 'Pago MP a sturla.delta.viajes catamarán privado grupo Brasil',
    rawPayerOrAlias: 'sturla.delta.viajes',
    accountId: 'mp_gaston',
    supplierId: 'sup_7',
    operationId: 'op_rec_1',
    category: 'Costo Operativo - Transporte Fluvial',
    isInternalTransfer: false,
    matchStatus: 'verde',
    matchConfidence: 100,
    matchReason: 'Alias coincide exactamente con Catamarán Sturla Delta',
    importedAt: '2026-08-31T09:00:00Z'
  },

  // MOVIMIENTO AMARILLO (PROBABLE - REQUIERE CONFIRMACIÓN)
  {
    id: 'mov_10',
    date: '2026-08-29',
    amount: 180000,
    type: 'ingreso',
    description: 'Transferencia recibida de JUAREZ EDUARDO DARIO',
    rawPayerOrAlias: 'JUAREZ EDUARDO',
    accountId: 'mp_maria',
    category: 'Ingreso Potencial - Cuota Alumno',
    operationId: 'op_viaje_1',
    isInternalTransfer: false,
    matchStatus: 'amarillo',
    matchConfidence: 85,
    matchReason: 'Nombre del pagador coincide con Padre de Camila Juárez (Colegio San Andrés). Requiere validación.',
    importedAt: '2026-08-31T09:00:00Z'
  },
  {
    id: 'mov_11',
    date: '2026-08-28',
    amount: 80000,
    type: 'egreso',
    description: 'Envío de dinero a guias.asoc.ba por servicios de coordinación',
    rawPayerOrAlias: 'guias.asoc.ba',
    accountId: 'mp_gaston',
    supplierId: 'sup_4',
    category: 'Costo Operativo - Guías',
    isInternalTransfer: false,
    matchStatus: 'amarillo',
    matchConfidence: 75,
    matchReason: 'Alias similar a guias.turismo.ba. Posible anticipo de honorarios guías.',
    importedAt: '2026-08-31T09:00:00Z'
  },

  // MOVIMIENTOS ROJOS (NO IDENTIFICADOS / SIN ASIGNAR)
  {
    id: 'mov_12',
    date: '2026-08-29',
    amount: 145000,
    type: 'ingreso',
    description: 'TRANSFERENCIA LINK 998124 DE NOVOA FEDERICO',
    rawPayerOrAlias: 'NOVOA FEDERICO',
    accountId: 'mp_gaston',
    category: 'No clasificado',
    isInternalTransfer: false,
    matchStatus: 'rojo',
    matchConfidence: 0,
    matchReason: 'Pagador no coincide con ningún estudiante ni cliente registrado. Verificar con administración.',
    importedAt: '2026-08-31T09:00:00Z'
  },
  {
    id: 'mov_13',
    date: '2026-08-30',
    amount: 92000,
    type: 'egreso',
    description: 'DEBITO DIRECTO SERVICIOS VARIOS MP*COMERCIO784',
    rawPayerOrAlias: 'COMERCIO784',
    accountId: 'mp_maria',
    category: 'No clasificado',
    isInternalTransfer: false,
    matchStatus: 'rojo',
    matchConfidence: 0,
    matchReason: 'Gasto sin proveedor ni operación asociada.',
    importedAt: '2026-08-31T09:00:00Z'
  }
];

export const INITIAL_RULES: ClassificationRule[] = [
  {
    id: 'rule_1',
    pattern: 'buses.sierras.mp',
    ruleType: 'alias',
    targetSupplierId: 'sup_1',
    targetCategory: 'Transporte',
    createdAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'rule_2',
    pattern: 'hotelparque.carlospaz',
    ruleType: 'alias',
    targetSupplierId: 'sup_2',
    targetCategory: 'Alojamiento',
    createdAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'rule_3',
    pattern: 'tandil.aventura.mp',
    ruleType: 'alias',
    targetSupplierId: 'sup_3',
    targetCategory: 'Entradas & Alojamiento',
    createdAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'rule_4',
    pattern: 'guias.turismo.ba',
    ruleType: 'alias',
    targetSupplierId: 'sup_4',
    targetCategory: 'Guías',
    createdAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'rule_5',
    pattern: 'catering.lahuerta.mp',
    ruleType: 'alias',
    targetSupplierId: 'sup_5',
    targetCategory: 'Gastronomía',
    createdAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'rule_6',
    pattern: 'sturla.delta.viajes',
    ruleType: 'alias',
    targetSupplierId: 'sup_7',
    targetCategory: 'Transporte Fluvial',
    createdAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'rule_7',
    pattern: 'Santander -> MP Gastón',
    ruleType: 'internal_transfer',
    isInternalTransfer: true,
    sourceAccountId: 'banco_santander',
    destinationAccountId: 'mp_gaston',
    createdAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'rule_8',
    pattern: 'MP Gastón a MP María',
    ruleType: 'internal_transfer',
    isInternalTransfer: true,
    sourceAccountId: 'mp_gaston',
    destinationAccountId: 'mp_maria',
    createdAt: '2026-08-01T00:00:00Z'
  }
];

export const INITIAL_HISTORICAL_PERIODS: HistoricalPeriod[] = [
  // Marzo 2026
  { id: 'hist_1', yearMonth: '2026-03', businessUnit: 'receptivo', revenue: 9800000, expenses: 6200000, result: 3600000, operationsCount: 8, notes: 'Inicio de temporada de cruceros' },
  { id: 'hist_2', yearMonth: '2026-03', businessUnit: 'salidas', revenue: 4200000, expenses: 2600000, result: 1600000, operationsCount: 5, notes: 'Apertura de ciclo lectivo' },
  { id: 'hist_3', yearMonth: '2026-03', businessUnit: 'viajes', revenue: 14500000, expenses: 9800000, result: 4700000, operationsCount: 3, notes: 'Primeras cuotas de viajes anuales' },

  // Abril 2026
  { id: 'hist_4', yearMonth: '2026-04', businessUnit: 'receptivo', revenue: 12400000, expenses: 7800000, result: 4600000, operationsCount: 11 },
  { id: 'hist_5', yearMonth: '2026-04', businessUnit: 'salidas', revenue: 6800000, expenses: 4300000, result: 2500000, operationsCount: 9 },
  { id: 'hist_6', yearMonth: '2026-04', businessUnit: 'viajes', revenue: 18200000, expenses: 12100000, result: 6100000, operationsCount: 4 },

  // Mayo 2026
  { id: 'hist_7', yearMonth: '2026-05', businessUnit: 'receptivo', revenue: 11100000, expenses: 7100000, result: 4000000, operationsCount: 9 },
  { id: 'hist_8', yearMonth: '2026-05', businessUnit: 'salidas', revenue: 8400000, expenses: 5200000, result: 3200000, operationsCount: 12 },
  { id: 'hist_9', yearMonth: '2026-05', businessUnit: 'viajes', revenue: 21500000, expenses: 14200000, result: 7300000, operationsCount: 5 },

  // Junio 2026
  { id: 'hist_10', yearMonth: '2026-06', businessUnit: 'receptivo', revenue: 13900000, expenses: 8700000, result: 5200000, operationsCount: 12 },
  { id: 'hist_11', yearMonth: '2026-06', businessUnit: 'salidas', revenue: 9600000, expenses: 5900000, result: 3700000, operationsCount: 14 },
  { id: 'hist_12', yearMonth: '2026-06', businessUnit: 'viajes', revenue: 24800000, expenses: 16500000, result: 8300000, operationsCount: 6 },

  // Julio 2026 (Vacaciones de Invierno)
  { id: 'hist_13', yearMonth: '2026-07', businessUnit: 'receptivo', revenue: 21400000, expenses: 13200000, result: 8200000, operationsCount: 19, notes: 'Pico de vacaciones de invierno' },
  { id: 'hist_14', yearMonth: '2026-07', businessUnit: 'salidas', revenue: 2100000, expenses: 1400000, result: 700000, operationsCount: 3, notes: 'Receso escolar' },
  { id: 'hist_15', yearMonth: '2026-07', businessUnit: 'viajes', revenue: 28900000, expenses: 19100000, result: 9800000, operationsCount: 7, notes: 'Viajes de nieve y Bariloche' }
];

export const INITIAL_MONTHLY_CLOSINGS: MonthlyClosing[] = [
  {
    id: 'close_2026_06',
    yearMonth: '2026-06',
    closedAt: '2026-07-04T18:00:00Z',
    status: 'cerrado',
    initialCash: 38200000,
    totalIncome: 48300000,
    totalExpense: 35280000,
    internalTransfersSum: 4200000,
    calculatedFinalCash: 51220000,
    actualAccountCash: 51220000,
    reconciliationDifference: 0,
    operationsCount: 32,
    closedBy: 'Gastón Rodríguez',
    notes: 'Cierre conforme. Todos los comprobantes y extractos bancarios conciliados al 100%.'
  },
  {
    id: 'close_2026_07',
    yearMonth: '2026-07',
    closedAt: '2026-08-05T19:30:00Z',
    status: 'cerrado',
    initialCash: 51220000,
    totalIncome: 52400000,
    totalExpense: 37880000,
    internalTransfersSum: 5800000,
    calculatedFinalCash: 65740000,
    actualAccountCash: 65740000,
    reconciliationDifference: 0,
    operationsCount: 29,
    closedBy: 'María Elena Rossi',
    notes: 'Mes de alta temporada. Conciliación cuadrada sin desvíos.'
  },
  {
    id: 'close_2026_08',
    yearMonth: '2026-08',
    status: 'en_revision',
    initialCash: 42270000,
    totalIncome: 9990000,
    totalExpense: 6240000,
    internalTransfersSum: 2100000,
    calculatedFinalCash: 46020000,
    actualAccountCash: 44570000,
    reconciliationDifference: -1450000,
    operationsCount: 6,
    notes: 'Cierre provisorio a fecha de corte 31/08/2026. Hay 2 movimientos por clasificar y conciliar.'
  }
];
