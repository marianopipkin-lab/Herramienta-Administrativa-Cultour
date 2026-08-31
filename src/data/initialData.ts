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
  cutoffDate: new Date().toISOString().split('T')[0],
  description: 'Punto de partida y saldos iniciales del sistema',
  accountsInitialBalances: {
    mp_mariano: 0,
    mp_socio2: 0,
    banco_santander: 0,
    banco_galicia: 0,
    caja_efectivo: 0,
    caja_usd: 0,
    paypal_cultour: 0,
    wetravel_cultour: 0,
  },
  initialFixedCostsMonthly: 0,
};

export const INITIAL_CLIENTS: Client[] = [];

export const INITIAL_ACCOUNTS: FinancialAccount[] = [
  {
    id: 'mp_mariano',
    name: 'Mercado Pago - Mariano Pipkin',
    type: 'mercado_pago',
    currency: 'ARS',
    currentBalance: 0,
    initialBalance: 0,
    alias: 'mariano.cultour.mp',
    holder: 'Mariano Pipkin',
    description: 'Cuenta principal para cobros de turismo y salidas educativas'
  },
  {
    id: 'mp_socio2',
    name: 'Mercado Pago - Operaciones',
    type: 'mercado_pago',
    currency: 'ARS',
    currentBalance: 0,
    initialBalance: 0,
    alias: 'cultour.operaciones.mp',
    holder: 'Cultour Operaciones',
    description: 'Cobros de cuotas y transferencias menores'
  },
  {
    id: 'banco_santander',
    name: 'Banco Santander - CC Operativa (ARS)',
    type: 'banco',
    currency: 'ARS',
    currentBalance: 0,
    initialBalance: 0,
    cbu: '0720182620000049281723',
    holder: 'Cultour SRL',
    description: 'Cuenta corriente empresarial para pagos a proveedores y transferencias'
  },
  {
    id: 'banco_galicia',
    name: 'Banco Galicia - Cuenta Reserva (ARS)',
    type: 'banco',
    currency: 'ARS',
    currentBalance: 0,
    initialBalance: 0,
    cbu: '0070089120000031894562',
    holder: 'Cultour SRL',
    description: 'Fondo de respaldo operativo y saldos de contingencia'
  },
  {
    id: 'caja_efectivo',
    name: 'Caja Chica Efectivo (ARS)',
    type: 'efectivo',
    currency: 'ARS',
    currentBalance: 0,
    initialBalance: 0,
    holder: 'Administración Oficina',
    description: 'Efectivo en mano para propinas, peajes, guías y gastos inmediatos'
  },
  {
    id: 'caja_usd',
    name: 'Bóveda Dólares Efectivo (USD)',
    type: 'efectivo',
    currency: 'USD',
    currentBalance: 0,
    initialBalance: 0,
    holder: 'Tesorería',
    description: 'Dólares billete recibidos de turistas y resguardo de reservas'
  },
  {
    id: 'paypal_cultour',
    name: 'PayPal - Cultour Oficial (USD)',
    type: 'paypal',
    currency: 'USD',
    currentBalance: 0,
    initialBalance: 0,
    holder: 'Cultour Trips LLC / Mariano',
    description: 'Cobros internacionales en USD de turistas extranjeros'
  },
  {
    id: 'wetravel_cultour',
    name: 'WeTravel - Cultour Receptivo (USD)',
    type: 'wetravel',
    currency: 'USD',
    currentBalance: 0,
    initialBalance: 0,
    holder: 'Cultour Trips WeTravel Account',
    description: 'Pasarela internacional de pagos para tours receptivos y grupos'
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [];
export const INITIAL_OPERATIONS: Operation[] = [];
export const INITIAL_FIXED_EXPENSES: FixedExpense[] = [];
export const INITIAL_MOVEMENTS: FinancialMovement[] = [];
export const INITIAL_RULES: ClassificationRule[] = [];
export const INITIAL_HISTORICAL_PERIODS: HistoricalPeriod[] = [];
export const INITIAL_MONTHLY_CLOSINGS: MonthlyClosing[] = [];

// ==========================================
// PRESETS DE DEMOSTRACIÓN (Para restaurar si el usuario lo desea)
// ==========================================
export const DEMO_CLIENTS: Client[] = [
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
    type: 'turista',
    name: 'Brasil Conexao Turismo Eireli',
    documentId: 'BR-14.283.912/0001-44',
    email: 'operacoes@brasilconexao.com.br',
    phone: '+55 11 98822-3344',
    country: 'Brasil',
    address: 'São Paulo, SP, Brasil',
    createdAt: '2026-04-05T10:00:00Z'
  }
];

export const DEMO_SUPPLIERS: Supplier[] = [
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
  }
];
