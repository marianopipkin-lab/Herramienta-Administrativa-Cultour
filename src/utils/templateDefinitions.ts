import * as XLSX from 'xlsx';

export interface TemplateColumn {
  key: string;
  label: string;
  required: boolean;
  type: 'string' | 'number' | 'date' | 'enum' | 'email' | 'phone';
  allowedValues?: string[];
  example: string | number;
  description: string;
  validationRule: string;
}

export interface ImportTemplateDefinition {
  id: string;
  name: string;
  category: 'operaciones' | 'pasajeros' | 'proveedores' | 'finanzas' | 'conciliacion';
  description: string;
  fileName: string;
  columns: TemplateColumn[];
  sampleRows: Record<string, any>[];
  instructions: string[];
}

export const OFFICIAL_TEMPLATES: ImportTemplateDefinition[] = [
  // 1. CLIENTES
  {
    id: 'clients',
    name: 'Maestro de Clientes & Agencias',
    category: 'operaciones',
    description: 'Importación de turistas particulares, agencias B2B, colegios e instituciones y empresas contratantes.',
    fileName: 'cultour_plantilla_clientes.xlsx',
    instructions: [
      'Identifica unívocamente por Documento/CUIT o Nombre para actualizar sin duplicar.',
      'Para Agencias B2B, el campo "canal" debe ser "Agencias B2B" y especificar porcentaje de comisión si aplica.',
      'Para Colegios, especificar "tipo_cliente: escuela" y datos de contacto de autoridades.'
    ],
    columns: [
      { key: 'nombre_razon_social', label: 'Nombre / Razón Social', required: true, type: 'string', example: 'Colegio San Martín de Tours', description: 'Nombre completo del cliente, agencia o colegio', validationRule: 'Obligatorio. Mínimo 3 caracteres.' },
      { key: 'tipo_cliente', label: 'Tipo de Cliente', required: true, type: 'enum', allowedValues: ['turista', 'agencia', 'escuela', 'alumno', 'empresa'], example: 'escuela', description: 'Tipo de cliente según la unidad de negocio', validationRule: 'Debe ser turista, agencia, escuela, alumno o empresa.' },
      { key: 'contacto', label: 'Persona de Contacto', required: false, type: 'string', example: 'Prof. Marcos Benítez', description: 'Nombre del referente principal o coordinador', validationRule: 'Texto libre.' },
      { key: 'email', label: 'Email', required: false, type: 'email', example: 'contacto@sanmartintours.edu.ar', description: 'Correo electrónico de contacto', validationRule: 'Formato de email válido.' },
      { key: 'telefono', label: 'Teléfono', required: false, type: 'phone', example: '+54 9 11 4455-8899', description: 'Teléfono o WhatsApp con código de área', validationRule: 'Numérico / formato telefónico.' },
      { key: 'documento_cuit', label: 'DNI / CUIT / Tax ID', required: false, type: 'string', example: '30-71448899-8', description: 'Identificación fiscal o tributaria', validationRule: 'Clave única de prevención de duplicados.' },
      { key: 'pais', label: 'País', required: false, type: 'string', example: 'Argentina', description: 'País de origen', validationRule: 'Texto.' },
      { key: 'ciudad', label: 'Ciudad', required: false, type: 'string', example: 'Buenos Aires', description: 'Ciudad o localidad', validationRule: 'Texto.' },
      { key: 'unidad_negocio', label: 'Unidad de Negocio', required: true, type: 'enum', allowedValues: ['receptivo', 'salidas', 'viajes'], example: 'viajes', description: 'Unidad de negocio principal', validationRule: 'receptivo, salidas o viajes.' },
      { key: 'canal', label: 'Canal Comercial', required: true, type: 'enum', allowedValues: ['Venta Directa', 'Agencias B2B', 'Salidas Educativas', 'Viajes Educativos'], example: 'Viajes Educativos', description: 'Canal específico para reportes de rentabilidad', validationRule: 'Uno de los 4 canales oficiales.' },
      { key: 'comision_agencia', label: '% Comisión Agencia', required: false, type: 'number', example: 15, description: 'Porcentaje de comisión para agencias B2B', validationRule: 'Número entre 0 y 100.' },
      { key: 'observaciones', label: 'Observaciones', required: false, type: 'string', example: 'Contacto preferente por WhatsApp turno mañana.', description: 'Condiciones comerciales o notas', validationRule: 'Texto libre.' }
    ],
    sampleRows: [
      {
        nombre_razon_social: 'Colegio San Martín de Tours',
        tipo_cliente: 'escuela',
        contacto: 'Prof. Marcos Benítez',
        email: 'coordinacion@sanmartintours.edu.ar',
        telefono: '+54 9 11 4455-8899',
        documento_cuit: '30-71448899-8',
        pais: 'Argentina',
        ciudad: 'Buenos Aires',
        unidad_negocio: 'viajes',
        canal: 'Viajes Educativos',
        comision_agencia: 0,
        observaciones: 'Egresados Bariloche 2026'
      },
      {
        nombre_razon_social: 'Andes Horizon Travel B2B',
        tipo_cliente: 'agencia',
        contacto: 'Carolina Rossi',
        email: 'ops@andeshorizon.com',
        telefono: '+54 9 261 422-3344',
        documento_cuit: '30-65998877-4',
        pais: 'Argentina',
        ciudad: 'Mendoza',
        unidad_negocio: 'receptivo',
        canal: 'Agencias B2B',
        comision_agencia: 15,
        observaciones: 'Operador receptivo enoturismo'
      }
    ]
  },

  // 2. OPERACIONES / FILES
  {
    id: 'operations',
    name: 'Operaciones & Files',
    category: 'operaciones',
    description: 'Creación masiva de Files operativos y presupuestos con canal, fechas y metas financieras.',
    fileName: 'cultour_plantilla_operaciones.xlsx',
    instructions: [
      'El "file_code" es el identificador único del File (ej. VE-2026-004, TR-2026-050).',
      'El canal debe ser exacto: "Venta Directa", "Agencias B2B", "Salidas Educativas" o "Viajes Educativos".',
      'Las fechas deben estar en formato YYYY-MM-DD.',
      'La moneda debe ser "ARS" o "USD".'
    ],
    columns: [
      { key: 'file_code', label: 'Código de File', required: true, type: 'string', example: 'VE-2026-004', description: 'Código identificador único del viaje o servicio', validationRule: 'Obligatorio y único.' },
      { key: 'titulo', label: 'Título / Nombre del File', required: true, type: 'string', example: 'Bariloche Egresados - Colegio San Martín', description: 'Descripción clara del servicio', validationRule: 'Obligatorio. Mínimo 4 caracteres.' },
      { key: 'tipo_operacion', label: 'Tipo de Servicio', required: true, type: 'string', example: 'Viaje Educativo Bariloche', description: 'Tipo específico de itinerario', validationRule: 'Texto descriptivo.' },
      { key: 'canal', label: 'Canal', required: true, type: 'enum', allowedValues: ['Venta Directa', 'Agencias B2B', 'Salidas Educativas', 'Viajes Educativos'], example: 'Viajes Educativos', description: 'Canal de comercialización', validationRule: 'Uno de los 4 canales.' },
      { key: 'cliente', label: 'Cliente / Institución', required: true, type: 'string', example: 'Colegio San Martín de Tours', description: 'Nombre del contratante principal', validationRule: 'Obligatorio.' },
      { key: 'fecha_salida', label: 'Fecha de Salida', required: true, type: 'date', example: '2026-09-15', description: 'Fecha de inicio del servicio (YYYY-MM-DD)', validationRule: 'Fecha válida YYYY-MM-DD.' },
      { key: 'fecha_regreso', label: 'Fecha de Regreso', required: false, type: 'date', example: '2026-09-22', description: 'Fecha de fin del servicio (YYYY-MM-DD)', validationRule: 'Fecha válida YYYY-MM-DD posterior a salida.' },
      { key: 'moneda', label: 'Moneda', required: true, type: 'enum', allowedValues: ['ARS', 'USD'], example: 'ARS', description: 'Divisa contractual del File', validationRule: 'ARS o USD.' },
      { key: 'pasajeros_cantidad', label: 'Cant. Pasajeros', required: true, type: 'number', example: 42, description: 'Número total de pasajeros esperados', validationRule: 'Entero positivo mayor a 0.' },
      { key: 'ingreso_esperado', label: 'Ingreso Esperado Total', required: true, type: 'number', example: 35000000, description: 'Monto total a cobrar a los pasajeros/cliente', validationRule: 'Número mayor a 0.' },
      { key: 'costo_esperado', label: 'Costo Esperado Total', required: false, type: 'number', example: 24500000, description: 'Presupuesto total estimado a pagar a prestadores', validationRule: 'Número mayor o igual a 0.' },
      { key: 'estado', label: 'Estado', required: true, type: 'enum', allowedValues: ['confirmada', 'en_curso', 'realizada', 'presupuesto', 'cancelada'], example: 'confirmada', description: 'Estado actual del file', validationRule: 'Uno de los estados válidos.' },
      { key: 'observaciones', label: 'Observaciones', required: false, type: 'string', example: 'Incluye 3 liberados por grupo de 40.', description: 'Notas operativas', validationRule: 'Texto libre.' }
    ],
    sampleRows: [
      {
        file_code: 'VE-2026-004',
        titulo: 'Bariloche Egresados - Colegio San Martín',
        tipo_operacion: 'Viaje Educativo Bariloche',
        canal: 'Viajes Educativos',
        cliente: 'Colegio San Martín de Tours',
        fecha_salida: '2026-09-15',
        fecha_regreso: '2026-09-22',
        moneda: 'ARS',
        pasajeros_cantidad: 42,
        ingreso_esperado: 35000000,
        costo_esperado: 24500000,
        estado: 'confirmada',
        observaciones: 'Incluye 3 liberados docentes.'
      },
      {
        file_code: 'TR-2026-050',
        titulo: 'Mendoza Wine Experience VIP',
        tipo_operacion: 'Tour Privado Enológico',
        canal: 'Venta Directa',
        cliente: 'Family Smith Tour',
        fecha_salida: '2026-09-10',
        fecha_regreso: '2026-09-13',
        moneda: 'USD',
        pasajeros_cantidad: 4,
        ingreso_esperado: 4800,
        costo_esperado: 2900,
        estado: 'confirmada',
        observaciones: 'Vehículo Mercedes Sprinter VIP.'
      }
    ]
  },

  // 3. ALUMNOS / PASAJEROS
  {
    id: 'passengers',
    name: 'Nómina de Alumnos & Pasajeros',
    category: 'pasajeros',
    description: 'Carga de nómina nominal de alumnos, tutores, contactos, precio asignado y ficha médica.',
    fileName: 'cultour_plantilla_alumnos_pasajeros.xlsx',
    instructions: [
      'Debe indicar el "file_code" existente al que pertenece el pasajero.',
      'El DNI/Pasaporte previene duplicados en la misma operación.',
      'El estado de participación puede ser: "confirmado", "condicional" o "cancelado".'
    ],
    columns: [
      { key: 'operation_file_code', label: 'Código de File', required: true, type: 'string', example: 'VE-2026-004', description: 'Código del File al que pertenece', validationRule: 'Debe coincidir con un File existente.' },
      { key: 'nombre', label: 'Nombre', required: true, type: 'string', example: 'Juan', description: 'Nombre de pila del pasajero', validationRule: 'Obligatorio.' },
      { key: 'apellido', label: 'Apellido', required: true, type: 'string', example: 'Pérez', description: 'Apellido del pasajero', validationRule: 'Obligatorio.' },
      { key: 'documento', label: 'DNI / Pasaporte', required: true, type: 'string', example: '48999888', description: 'Número de documento de identidad', validationRule: 'Obligatorio y único por File.' },
      { key: 'fecha_nacimiento', label: 'Fecha Nacimiento', required: false, type: 'date', example: '2009-04-12', description: 'Fecha de nacimiento (YYYY-MM-DD)', validationRule: 'Fecha YYYY-MM-DD.' },
      { key: 'tutor_responsable', label: 'Tutor / Responsable', required: false, type: 'string', example: 'Carlos Pérez', description: 'Nombre del padre, madre o tutor pagador', validationRule: 'Texto libre.' },
      { key: 'telefono_tutor', label: 'Teléfono Tutor', required: false, type: 'phone', example: '+54 9 11 5566-7788', description: 'Teléfono de contacto del tutor', validationRule: 'Teléfono.' },
      { key: 'email_tutor', label: 'Email Tutor', required: false, type: 'email', example: 'carlos.perez@gmail.com', description: 'Email para envío de recibos y avisos', validationRule: 'Email válido.' },
      { key: 'telefono_alumno', label: 'Teléfono Alumno', required: false, type: 'phone', example: '+54 9 11 3322-1100', description: 'Teléfono directo del alumno', validationRule: 'Teléfono.' },
      { key: 'email_alumno', label: 'Email Alumno', required: false, type: 'email', example: 'juan.perez@alumnos.edu.ar', description: 'Email del alumno', validationRule: 'Email válido.' },
      { key: 'precio_total', label: 'Precio Total Asignado', required: true, type: 'number', example: 850000, description: 'Tarifa total que debe abonar el pasajero', validationRule: 'Número mayor a 0.' },
      { key: 'moneda', label: 'Moneda', required: true, type: 'enum', allowedValues: ['ARS', 'USD'], example: 'ARS', description: 'Moneda del precio', validationRule: 'ARS o USD.' },
      { key: 'restricciones_dietarias', label: 'Restricciones Dietarias', required: false, type: 'string', example: 'Celíaco / Sin TACC', description: 'Dietas especiales, alergias o celiaquía', validationRule: 'Texto libre.' },
      { key: 'estado_participacion', label: 'Estado de Participación', required: false, type: 'enum', allowedValues: ['confirmado', 'condicional', 'cancelado'], example: 'confirmado', description: 'Estado en el contingente', validationRule: 'confirmado, condicional o cancelado.' },
      { key: 'observaciones', label: 'Observaciones', required: false, type: 'string', example: 'Viaja con autorización notarial adjunta.', description: 'Notas especiales', validationRule: 'Texto libre.' }
    ],
    sampleRows: [
      {
        operation_file_code: 'VE-2026-004',
        nombre: 'Juan',
        apellido: 'Pérez',
        documento: '48999888',
        fecha_nacimiento: '2009-04-12',
        tutor_responsable: 'Carlos Pérez',
        telefono_tutor: '+54 9 11 5566-7788',
        email_tutor: 'carlos.perez@gmail.com',
        telefono_alumno: '+54 9 11 3322-1100',
        email_alumno: 'juan.perez@alumnos.edu.ar',
        precio_total: 850000,
        moneda: 'ARS',
        restricciones_dietarias: 'Celíaco (Sin TACC)',
        estado_participacion: 'confirmado',
        observaciones: 'Asignar menú celíaco en todos los hoteles.'
      },
      {
        operation_file_code: 'VE-2026-004',
        nombre: 'Lucía',
        apellido: 'Fernández',
        documento: '49111222',
        fecha_nacimiento: '2009-08-25',
        tutor_responsable: 'Mariana Gómez',
        telefono_tutor: '+54 9 11 9988-7766',
        email_tutor: 'mariana.gomez@gmail.com',
        telefono_alumno: '+54 9 11 4455-6677',
        email_alumno: 'lucia.f@alumnos.edu.ar',
        precio_total: 850000,
        moneda: 'ARS',
        restricciones_dietarias: 'Vegetariana',
        estado_participacion: 'confirmado',
        observaciones: 'Ficha médica completa.'
      }
    ]
  },

  // 4. PLAN DE CUOTAS
  {
    id: 'quotas',
    name: 'Plan de Cuotas (Compromisos Exigibles)',
    category: 'pasajeros',
    description: 'Cronograma de vencimientos y montos exigibles por alumno o por File.',
    fileName: 'cultour_plantilla_plan_cuotas.xlsx',
    instructions: [
      'Define el compromiso de pago futuro (no el cobro real).',
      'Conceptos estándar: "Seña", "Cuota 1", "Cuota 2", "Cuota 3", "Saldo", "Pago Único".',
      'El sistema calcula automáticamente lo adeudado, lo cobrado y los vencimientos.'
    ],
    columns: [
      { key: 'operation_file_code', label: 'Código de File', required: true, type: 'string', example: 'VE-2026-004', description: 'Código del File', validationRule: 'Debe existir el File.' },
      { key: 'alumno_pasajero', label: 'Alumno / Pasajero o DNI', required: true, type: 'string', example: 'Juan Pérez (48999888)', description: 'Nombre completo o DNI del alumno', validationRule: 'Obligatorio.' },
      { key: 'numero_cuota', label: 'N° Cuota', required: true, type: 'number', example: 1, description: 'Número de cuota (0 para seña, 1, 2, 3...)', validationRule: 'Entero >= 0.' },
      { key: 'concepto', label: 'Concepto', required: true, type: 'enum', allowedValues: ['Seña', 'Cuota 1', 'Cuota 2', 'Cuota 3', 'Saldo', 'Pago Único'], example: 'Cuota 1', description: 'Concepto de la cuota', validationRule: 'Concepto válido.' },
      { key: 'fecha_vencimiento', label: 'Fecha Vencimiento', required: true, type: 'date', example: '2026-07-15', description: 'Fecha límite de pago (YYYY-MM-DD)', validationRule: 'Fecha YYYY-MM-DD.' },
      { key: 'importe_esperado', label: 'Importe Esperado', required: true, type: 'number', example: 250000, description: 'Monto de la cuota en su moneda', validationRule: 'Número mayor a 0.' },
      { key: 'moneda', label: 'Moneda', required: true, type: 'enum', allowedValues: ['ARS', 'USD'], example: 'ARS', description: 'Moneda de la cuota', validationRule: 'ARS o USD.' },
      { key: 'cuenta_destino_esperada', label: 'Cuenta Destino Prevista', required: false, type: 'string', example: 'mp_mariano', description: 'Cuenta donde se espera recaudar (ej. mp_mariano, galicia_ars)', validationRule: 'ID de cuenta válido.' },
      { key: 'observaciones', label: 'Observaciones', required: false, type: 'string', example: 'Cuota ajustable por índice si se paga después del 15.', description: 'Condiciones de pago', validationRule: 'Texto libre.' }
    ],
    sampleRows: [
      {
        operation_file_code: 'VE-2026-004',
        alumno_pasajero: 'Juan Pérez',
        numero_cuota: 0,
        concepto: 'Seña',
        fecha_vencimiento: '2026-05-15',
        importe_esperado: 150000,
        moneda: 'ARS',
        cuenta_destino_esperada: 'mp_mariano',
        observaciones: 'Seña para confirmación de plaza'
      },
      {
        operation_file_code: 'VE-2026-004',
        alumno_pasajero: 'Juan Pérez',
        numero_cuota: 1,
        concepto: 'Cuota 1',
        fecha_vencimiento: '2026-06-15',
        importe_esperado: 250000,
        moneda: 'ARS',
        cuenta_destino_esperada: 'mp_mariano',
        observaciones: 'Primera cuota de plan de viaje'
      }
    ]
  },

  // 5. COBRANZAS REALIZADAS
  {
    id: 'collections',
    name: 'Cobranzas Realizadas (Ingresos Contables)',
    category: 'finanzas',
    description: 'Carga de cobros efectivamente acreditados. Genera CollectionRecord y FinancialMovement en la cuenta destino.',
    fileName: 'cultour_plantilla_cobranzas_reales.xlsx',
    instructions: [
      'Solo importar pagos acreditados realmente.',
      'Si faltan datos financieros (cuenta destino o medio de pago), se emitirá una advertencia y no se generará movimiento financiero ficticio.',
      'Cuentas válidas: mp_mariano, mp_gaston, galicia_ars, galicia_usd, paypal_cultour, wetravel_cultour, boveda_efectivo_ars, boveda_efectivo_usd.'
    ],
    columns: [
      { key: 'operation_file_code', label: 'Código de File', required: true, type: 'string', example: 'VE-2026-004', description: 'Código del File', validationRule: 'Debe existir el File.' },
      { key: 'alumno_pagador', label: 'Alumno / Pagador', required: true, type: 'string', example: 'Juan Pérez', description: 'Nombre de quien pagó o por quién se pagó', validationRule: 'Obligatorio.' },
      { key: 'cuota_concepto', label: 'Cuota / Concepto', required: true, type: 'string', example: 'Cuota 1', description: 'Concepto o cuota a la que imputar', validationRule: 'Obligatorio.' },
      { key: 'fecha_pago', label: 'Fecha de Pago', required: true, type: 'date', example: '2026-06-14', description: 'Fecha real de acreditación (YYYY-MM-DD)', validationRule: 'Fecha YYYY-MM-DD.' },
      { key: 'importe', label: 'Importe Cobrado', required: true, type: 'number', example: 250000, description: 'Monto neto cobrado en su moneda', validationRule: 'Número mayor a 0.' },
      { key: 'moneda', label: 'Moneda', required: true, type: 'enum', allowedValues: ['ARS', 'USD'], example: 'ARS', description: 'Moneda cobrada', validationRule: 'ARS o USD.' },
      { key: 'medio_pago', label: 'Medio de Pago', required: true, type: 'enum', allowedValues: ['mercado_pago', 'transferencia', 'paypal', 'wetravel', 'efectivo', 'tarjeta'], example: 'mercado_pago', description: 'Canal de cobro utilizado', validationRule: 'Medio válido.' },
      { key: 'cuenta_destino', label: 'Cuenta Destino Real', required: true, type: 'string', example: 'mp_mariano', description: 'ID de la cuenta financiera receptora', validationRule: 'mp_mariano, mp_gaston, galicia_ars, etc.' },
      { key: 'numero_comprobante', label: 'N° Comprobante / Referencia', required: false, type: 'string', example: 'MP-TR-8849201', description: 'ID de transacción o número de transferencia', validationRule: 'Referencia bancaria/pasarela.' },
      { key: 'observaciones', label: 'Observaciones', required: false, type: 'string', example: 'Acreditado vía link de pago con tarjeta de débito.', description: 'Notas del cobro', validationRule: 'Texto libre.' }
    ],
    sampleRows: [
      {
        operation_file_code: 'VE-2026-004',
        alumno_pagador: 'Juan Pérez',
        cuota_concepto: 'Seña',
        fecha_pago: '2026-05-12',
        importe: 150000,
        moneda: 'ARS',
        medio_pago: 'mercado_pago',
        cuenta_destino: 'mp_mariano',
        numero_comprobante: 'MP-OP-9948201',
        observaciones: 'Pago seña acreditado'
      },
      {
        operation_file_code: 'VE-2026-004',
        alumno_pagador: 'Juan Pérez',
        cuota_concepto: 'Cuota 1',
        fecha_pago: '2026-06-14',
        importe: 250000,
        moneda: 'ARS',
        medio_pago: 'mercado_pago',
        cuenta_destino: 'mp_mariano',
        numero_comprobante: 'MP-OP-9988412',
        observaciones: 'Cuota 1 cancelada en término'
      }
    ]
  },

  // 6. PROVEEDORES (MAESTRO)
  {
    id: 'suppliers',
    name: 'Maestro de Proveedores & Alias MP',
    category: 'proveedores',
    description: 'Directorio único de prestadores (Transporte, Hoteles, Guías, Gastronomía, Seguros) con datos bancarios y Alias MP.',
    fileName: 'cultour_plantilla_proveedores.xlsx',
    instructions: [
      'El "supplier_id" o "cuit" previene duplicados.',
      'Categorías: Transporte, Alojamiento, Gastronomía, Guías, Seguros, Entradas, Otros.',
      'Especificar Alias MP y CBU para agilizar los pagos directos desde tesorería.'
    ],
    columns: [
      { key: 'supplier_id', label: 'ID Proveedor (Opcional)', required: false, type: 'string', example: 'SUP-BUS-01', description: 'Código interno opcional', validationRule: 'Texto alfanumérico.' },
      { key: 'nombre', label: 'Nombre / Razón Social', required: true, type: 'string', example: 'Transportes Andes del Sur SRL', description: 'Nombre comercial o razón social', validationRule: 'Obligatorio. Mínimo 3 caracteres.' },
      { key: 'cuit', label: 'CUIT / Tax ID', required: false, type: 'string', example: '30-70889900-3', description: 'Identificación tributaria', validationRule: 'CUIT con o sin guiones.' },
      { key: 'categoria', label: 'Categoría de Servicio', required: true, type: 'enum', allowedValues: ['Transporte', 'Alojamiento', 'Gastronomía', 'Guías', 'Seguros', 'Entradas', 'Otros'], example: 'Transporte', description: 'Rubro de actividad', validationRule: 'Categoría válida.' },
      { key: 'contacto', label: 'Persona de Contacto', required: false, type: 'string', example: 'Rodrigo Méndez', description: 'Responsable operativo o de reservas', validationRule: 'Texto libre.' },
      { key: 'telefono', label: 'Teléfono / WhatsApp', required: false, type: 'phone', example: '+54 9 294 455-6677', description: 'Teléfono de contacto directo', validationRule: 'Teléfono.' },
      { key: 'email', label: 'Email', required: false, type: 'email', example: 'reservas@andesdelsur.com.ar', description: 'Email para envío de vouchers y pagos', validationRule: 'Email válido.' },
      { key: 'moneda_habitual', label: 'Moneda Habitual', required: true, type: 'enum', allowedValues: ['ARS', 'USD'], example: 'ARS', description: 'Moneda de facturación habitual', validationRule: 'ARS o USD.' },
      { key: 'condiciones_pago', label: 'Condiciones de Pago', required: false, type: 'string', example: '30% anticipo al reservar, saldo 48h antes del viaje', description: 'Condición comercial pactada', validationRule: 'Texto libre.' },
      { key: 'alias_mp', label: 'Alias Mercado Pago', required: false, type: 'string', example: 'andesdelsur.mp', description: 'Alias de Mercado Pago para transferencias inmediatas', validationRule: 'Alias válido.' },
      { key: 'cbu_cvu', label: 'CBU / CVU Bancario', required: false, type: 'string', example: '0720111220000004587965', description: '22 dígitos de CBU/CVU para transferencias', validationRule: '22 dígitos numéricos.' },
      { key: 'observaciones', label: 'Observaciones', required: false, type: 'string', example: 'Flota con habilitación CNRT vigente.', description: 'Notas de calidad y flota', validationRule: 'Texto libre.' }
    ],
    sampleRows: [
      {
        supplier_id: 'SUP-BUS-01',
        nombre: 'Transportes Andes del Sur SRL',
        cuit: '30-70889900-3',
        categoria: 'Transporte',
        contacto: 'Rodrigo Méndez',
        telefono: '+54 9 294 455-6677',
        email: 'reservas@andesdelsur.com.ar',
        moneda_habitual: 'ARS',
        condiciones_pago: '30% anticipo al reservar, saldo 48h antes',
        alias_mp: 'andesdelsur.mp',
        cbu_cvu: '0720111220000004587965',
        observaciones: 'Unidades semicama 2024 con habilitación CNRT.'
      },
      {
        supplier_id: 'SUP-HOT-02',
        nombre: 'Hotel Patagonia Lake Resort',
        cuit: '30-66778899-1',
        categoria: 'Alojamiento',
        contacto: 'Valeria Soria',
        telefono: '+54 9 294 444-1122',
        email: 'grupos@patagonialake.com',
        moneda_habitual: 'ARS',
        condiciones_pago: '50% 30 días antes, saldo al check-in',
        alias_mp: 'hotel.patagonia.mp',
        cbu_cvu: '0110599520000014785236',
        observaciones: 'Régimen de pensión completa con merienda.'
      }
    ]
  },

  // 7. COSTOS DE PROVEEDORES POR FILE
  {
    id: 'supplier_costs',
    name: 'Costos Comprometidos de Proveedores por File',
    category: 'proveedores',
    description: 'Presupuestos y compromisos asumidos con prestadores para cada File (lo que Cultour debe pagar).',
    fileName: 'cultour_plantilla_costos_proveedores_file.xlsx',
    instructions: [
      'Indica el presupuesto pactado con el proveedor para un File.',
      'Diferencia claramente el costo presupuestado del pago efectivamente realizado.',
      'Fechas en formato YYYY-MM-DD.'
    ],
    columns: [
      { key: 'operation_file_code', label: 'Código de File', required: true, type: 'string', example: 'VE-2026-004', description: 'Código del File', validationRule: 'Debe existir el File.' },
      { key: 'proveedor', label: 'Proveedor / Razón Social', required: true, type: 'string', example: 'Transportes Andes del Sur SRL', description: 'Nombre o ID del proveedor', validationRule: 'Obligatorio.' },
      { key: 'categoria_servicio', label: 'Categoría de Servicio', required: true, type: 'enum', allowedValues: ['Transporte', 'Alojamiento', 'Gastronomía', 'Guías', 'Seguros', 'Entradas', 'Otros'], example: 'Transporte', description: 'Rubro del servicio', validationRule: 'Categoría válida.' },
      { key: 'descripcion', label: 'Descripción del Servicio', required: true, type: 'string', example: 'Bus doble piso BsAs - Bariloche ida y vuelta + traslados internos', description: 'Detalle de la contratación', validationRule: 'Obligatorio.' },
      { key: 'fecha_servicio', label: 'Fecha del Servicio', required: true, type: 'date', example: '2026-09-15', description: 'Fecha de prestación (YYYY-MM-DD)', validationRule: 'Fecha YYYY-MM-DD.' },
      { key: 'costo_esperado', label: 'Costo Esperado / Presupuesto', required: true, type: 'number', example: 8500000, description: 'Monto total a pagar acordado', validationRule: 'Número mayor a 0.' },
      { key: 'moneda', label: 'Moneda', required: true, type: 'enum', allowedValues: ['ARS', 'USD'], example: 'ARS', description: 'Moneda del contrato', validationRule: 'ARS o USD.' },
      { key: 'fecha_prevista_pago', label: 'Fecha Prevista Pago Saldo', required: false, type: 'date', example: '2026-09-10', description: 'Fecha límite exigible para el saldo (YYYY-MM-DD)', validationRule: 'Fecha YYYY-MM-DD.' },
      { key: 'condicion_pago', label: 'Condición de Pago', required: false, type: 'string', example: '30% anticipo, saldo 5 días antes', description: 'Modalidad de pago pactada', validationRule: 'Texto libre.' },
      { key: 'estado', label: 'Estado Contractual', required: false, type: 'enum', allowedValues: ['pendiente', 'parcial', 'pagado', 'vencido'], example: 'pendiente', description: 'Estado actual del contrato', validationRule: 'Estado válido.' },
      { key: 'observaciones', label: 'Observaciones', required: false, type: 'string', example: 'Incluye peajes y viáticos de 2 choferes.', description: 'Notas contractuales', validationRule: 'Texto libre.' }
    ],
    sampleRows: [
      {
        operation_file_code: 'VE-2026-004',
        proveedor: 'Transportes Andes del Sur SRL',
        categoria_servicio: 'Transporte',
        descripcion: 'Bus Doble Piso 50 asientos BsAs-Bari-BsAs',
        fecha_servicio: '2026-09-15',
        costo_esperado: 8500000,
        moneda: 'ARS',
        fecha_prevista_pago: '2026-09-10',
        condicion_pago: '30% anticipo al reservar, 70% saldo 5 días antes',
        estado: 'pendiente',
        observaciones: 'Incluye combustible, peajes y viáticos de 2 choferes.'
      },
      {
        operation_file_code: 'VE-2026-004',
        proveedor: 'Hotel Patagonia Lake Resort',
        categoria_servicio: 'Alojamiento',
        descripcion: '7 noches pensión completa 42 pax',
        fecha_servicio: '2026-09-15',
        costo_esperado: 12600000,
        moneda: 'ARS',
        fecha_prevista_pago: '2026-09-01',
        condicion_pago: '50% seña, saldo previo al check-in',
        estado: 'pendiente',
        observaciones: 'Habitaciones triples y cuádruples con baño privado.'
      }
    ]
  },

  // 8. PAGOS A PROVEEDORES
  {
    id: 'supplier_payments',
    name: 'Pagos Realizados a Proveedores',
    category: 'finanzas',
    description: 'Carga de egresos contables transferidos a prestadores. Genera SupplierPaymentRecord y debita la cuenta origen.',
    fileName: 'cultour_plantilla_pagos_proveedores.xlsx',
    instructions: [
      'Solo importar pagos efectivamente transferidos o abonados.',
      'Cuentas origen válidas: galicia_ars, galicia_usd, mp_mariano, mp_gaston, paypal_cultour, boveda_efectivo_ars, boveda_efectivo_usd.',
      'El importe debita automáticamente la cuenta financiera indicada.'
    ],
    columns: [
      { key: 'operation_file_code', label: 'Código de File', required: true, type: 'string', example: 'VE-2026-004', description: 'Código del File asociado', validationRule: 'Debe existir el File.' },
      { key: 'proveedor', label: 'Proveedor / Prestador', required: true, type: 'string', example: 'Transportes Andes del Sur SRL', description: 'Nombre o ID del proveedor beneficiario', validationRule: 'Obligatorio.' },
      { key: 'fecha_pago', label: 'Fecha de Pago', required: true, type: 'date', example: '2026-06-20', description: 'Fecha de la transferencia o entrega (YYYY-MM-DD)', validationRule: 'Fecha YYYY-MM-DD.' },
      { key: 'importe', label: 'Importe Pagado', required: true, type: 'number', example: 2550000, description: 'Monto transferido en la moneda indicada', validationRule: 'Número mayor a 0.' },
      { key: 'moneda', label: 'Moneda', required: true, type: 'enum', allowedValues: ['ARS', 'USD'], example: 'ARS', description: 'Moneda pagada', validationRule: 'ARS o USD.' },
      { key: 'medio_pago', label: 'Medio de Pago', required: true, type: 'enum', allowedValues: ['transferencia', 'mercado_pago', 'paypal', 'efectivo', 'cheque'], example: 'transferencia', description: 'Canal de pago utilizado', validationRule: 'Medio válido.' },
      { key: 'cuenta_origen', label: 'Cuenta Origen (Débito)', required: true, type: 'string', example: 'galicia_ars', description: 'ID de la cuenta financiera desde donde salió el dinero', validationRule: 'ID de cuenta bancaria/MP válido.' },
      { key: 'numero_comprobante', label: 'N° Comprobante / Transferencia', required: false, type: 'string', example: 'TRANSF-GAL-884129', description: 'Número de operación bancaria o recibo del proveedor', validationRule: 'Texto de referencia.' },
      { key: 'concepto', label: 'Concepto del Pago', required: true, type: 'string', example: 'Anticipo 30% Reserva Bus', description: 'Motivo del pago (ej. Anticipo 30%, Saldo final)', validationRule: 'Obligatorio.' },
      { key: 'observaciones', label: 'Observaciones', required: false, type: 'string', example: 'Comprobante enviado por email a reservas.', description: 'Notas adicionales', validationRule: 'Texto libre.' }
    ],
    sampleRows: [
      {
        operation_file_code: 'VE-2026-004',
        proveedor: 'Transportes Andes del Sur SRL',
        fecha_pago: '2026-06-20',
        importe: 2550000,
        moneda: 'ARS',
        medio_pago: 'transferencia',
        cuenta_origen: 'galicia_ars',
        numero_comprobante: 'TRANSF-GAL-884129',
        concepto: 'Anticipo 30% Reserva Bus',
        observaciones: 'Pago anticipo para asegurar unidades.'
      }
    ]
  },

  // 9. EXTRACTO MERCADO PAGO
  {
    id: 'mercadopago',
    name: 'Liquidación Extracto Mercado Pago',
    category: 'conciliacion',
    description: 'Importación de reportes de liquidación de Mercado Pago con desglose de comisiones, retenciones y neto acreditado.',
    fileName: 'cultour_plantilla_extracto_mercadopago.xlsx',
    instructions: [
      'Permite auditar el bruto vs neto acreditado y detectar comisiones automáticamente.',
      'Importes numéricos con punto o coma decimal.',
      'Identifica discrepancias en amarillo/rojo si la liquidación difiere de lo esperado.'
    ],
    columns: [
      { key: 'fecha', label: 'Fecha de Liberación', required: true, type: 'date', example: '2026-08-15', description: 'Fecha de acreditación real en cuenta MP', validationRule: 'YYYY-MM-DD.' },
      { key: 'descripcion', label: 'Descripción / Nombre Pagador', required: true, type: 'string', example: 'Cobro link de pago - Carlos Pérez', description: 'Detalle de la transacción', validationRule: 'Obligatorio.' },
      { key: 'referencia_externa', label: 'Referencia Externa / MP ID', required: true, type: 'string', example: 'MP-889944123', description: 'ID de operación de Mercado Pago', validationRule: 'Obligatorio.' },
      { key: 'importe_bruto', label: 'Importe Bruto', required: true, type: 'number', example: 100000, description: 'Monto total pagado por el cliente', validationRule: 'Número mayor a 0.' },
      { key: 'comision_mp', label: 'Comisión MP + IVA', required: true, type: 'number', example: 4500, description: 'Comisión descontada por la pasarela', validationRule: 'Número >= 0.' },
      { key: 'retenciones_impuestos', label: 'Retenciones / Percepciones', required: false, type: 'number', example: 500, description: 'Retenciones impositivas (IIBB/Ganancias)', validationRule: 'Número >= 0.' },
      { key: 'importe_neto', label: 'Importe Neto Acreditado', required: true, type: 'number', example: 95000, description: 'Monto efectivamente disponible en cuenta', validationRule: 'Bruto - Comisión - Retenciones.' },
      { key: 'estado_acreditacion', label: 'Estado', required: false, type: 'string', example: 'approved', description: 'Estado de la operación en MP', validationRule: 'approved, in_process, etc.' }
    ],
    sampleRows: [
      {
        fecha: '2026-08-15',
        descripcion: 'Cobro link de pago - Carlos Pérez (Bariloche 2026)',
        referencia_externa: 'MP-889944123',
        importe_bruto: 100000,
        comision_mp: 4500,
        retenciones_impuestos: 500,
        importe_neto: 95000,
        estado_acreditacion: 'approved'
      },
      {
        fecha: '2026-08-16',
        descripcion: 'Cobro QR - Mariana Gómez (Bariloche 2026)',
        referencia_externa: 'MP-889944155',
        importe_bruto: 150000,
        comision_mp: 6750,
        retenciones_impuestos: 750,
        importe_neto: 142500,
        estado_acreditacion: 'approved'
      }
    ]
  },

  // 10. EXTRACTO BANCARIO
  {
    id: 'bank_statements',
    name: 'Extracto Bancario (Galicia / Santander / Nación)',
    category: 'conciliacion',
    description: 'Importación de movimientos de cuenta corriente o caja de ahorro bancaria para conciliación automática.',
    fileName: 'cultour_plantilla_extracto_bancario.xlsx',
    instructions: [
      'Dejar "debito" en 0 para ingresos y "credito" en 0 para egresos.',
      'El saldo acumulado permite verificar el cuadre final contra el libro diario.'
    ],
    columns: [
      { key: 'fecha', label: 'Fecha de Movimiento', required: true, type: 'date', example: '2026-08-20', description: 'Fecha del asiento bancario (YYYY-MM-DD)', validationRule: 'YYYY-MM-DD.' },
      { key: 'descripcion', label: 'Concepto / Descripción Bancaria', required: true, type: 'string', example: 'TRANSF RECIBIDA DE COLEGIO SAN MARTIN', description: 'Glosa o detalle del movimiento bancario', validationRule: 'Obligatorio.' },
      { key: 'numero_referencia', label: 'N° Comprobante / Referencia', required: false, type: 'string', example: 'REF-BCO-884129', description: 'Número de transacción o cheque', validationRule: 'Texto libre.' },
      { key: 'debito', label: 'Débito / Egreso', required: false, type: 'number', example: 0, description: 'Monto egresado de la cuenta (0 si es ingreso)', validationRule: 'Número >= 0.' },
      { key: 'credito', label: 'Crédito / Ingreso', required: false, type: 'number', example: 5000000, description: 'Monto ingresado a la cuenta (0 si es egreso)', validationRule: 'Número >= 0.' },
      { key: 'saldo_cuenta', label: 'Saldo Contable Cuenta', required: true, type: 'number', example: 12500000, description: 'Saldo resultante informado por el banco', validationRule: 'Número.' }
    ],
    sampleRows: [
      {
        fecha: '2026-08-20',
        descripcion: 'TRANSF RECIBIDA COLEGIO SAN MARTIN',
        numero_referencia: 'REF-BCO-884129',
        debito: 0,
        credito: 5000000,
        saldo_cuenta: 12500000
      },
      {
        fecha: '2026-08-21',
        descripcion: 'TRANSF ENVIADA A TRANSPORTES ANDES DEL SUR',
        numero_referencia: 'REF-BCO-998822',
        debito: 2550000,
        credito: 0,
        saldo_cuenta: 9950000
      }
    ]
  },

  // 11. PAYPAL / WETRAVEL
  {
    id: 'paypal_wetravel',
    name: 'Extracto PayPal & WeTravel (USD)',
    category: 'conciliacion',
    description: 'Movimientos de plataformas de pago internacionales en USD con desglose de fees y fondos en custodia.',
    fileName: 'cultour_plantilla_paypal_wetravel_usd.xlsx',
    instructions: [
      'Moneda por defecto: USD.',
      'Registra tarifa de pasarela (Fee) para conciliar el neto disponible.'
    ],
    columns: [
      { key: 'fecha', label: 'Fecha de Transacción', required: true, type: 'date', example: '2026-08-10', description: 'Fecha del pago (YYYY-MM-DD)', validationRule: 'YYYY-MM-DD.' },
      { key: 'tipo_transaccion', label: 'Tipo de Transacción', required: true, type: 'string', example: 'Booking Payment', description: 'Categoría de la plataforma', validationRule: 'Obligatorio.' },
      { key: 'descripcion', label: 'Cliente / Descripción', required: true, type: 'string', example: 'John Smith - Buenos Aires Tour', description: 'Nombre del turista o tour', validationRule: 'Obligatorio.' },
      { key: 'referencia', label: 'Referencia / Booking ID', required: true, type: 'string', example: 'WT-2026-4481', description: 'Código de reserva en WeTravel/PayPal', validationRule: 'Obligatorio.' },
      { key: 'monto_bruto', label: 'Monto Bruto (USD)', required: true, type: 'number', example: 1200, description: 'Monto total pagado por el pasajero', validationRule: 'Número > 0.' },
      { key: 'tarifa_comision', label: 'Comisión / Fee (USD)', required: true, type: 'number', example: 42, description: 'Tarifa retenida por la plataforma', validationRule: 'Número >= 0.' },
      { key: 'monto_neto', label: 'Monto Neto (USD)', required: true, type: 'number', example: 1158, description: 'Monto neto acreditado en la cuenta', validationRule: 'Bruto - Fee.' },
      { key: 'moneda', label: 'Moneda', required: true, type: 'enum', allowedValues: ['USD'], example: 'USD', description: 'Divisa', validationRule: 'USD.' },
      { key: 'estado', label: 'Estado', required: false, type: 'string', example: 'Completed', description: 'Estado de la transacción', validationRule: 'Completed, Pending, etc.' }
    ],
    sampleRows: [
      {
        fecha: '2026-08-10',
        tipo_transaccion: 'Booking Payment',
        descripcion: 'John Smith - Buenos Aires Experience VIP',
        referencia: 'WT-2026-4481',
        monto_bruto: 1200,
        tarifa_comision: 42,
        monto_neto: 1158,
        moneda: 'USD',
        estado: 'Completed'
      }
    ]
  },

  // 12. ITINERARIO OPERATIVO
  {
    id: 'itinerary',
    name: 'Itinerario Operativo de File',
    category: 'operaciones',
    description: 'Cronograma día a día y minuto a minuto de servicios, guías, transportes, costos, anticipos y confirmaciones.',
    fileName: 'cultour_plantilla_itinerario_operativo.xlsx',
    instructions: [
      'Permite estructurar el itinerario cronológico completo de un File.',
      'Soporta el seguimiento de reserva, anticipo pagado, saldo y confirmación de cada proveedor.',
      'Alimenta el sistema automático de alertas de 15 días.'
    ],
    columns: [
      { key: 'operation_file_code', label: 'Código de File', required: true, type: 'string', example: 'VE-2026-004', description: 'Código del File', validationRule: 'Debe existir el File.' },
      { key: 'dia_numero', label: 'N° de Día', required: true, type: 'number', example: 1, description: 'Número de día del viaje (1, 2, 3...)', validationRule: 'Entero >= 1.' },
      { key: 'fecha', label: 'Fecha de Actividad', required: true, type: 'date', example: '2026-09-15', description: 'Fecha de ejecución (YYYY-MM-DD)', validationRule: 'YYYY-MM-DD.' },
      { key: 'hora', label: 'Horario', required: true, type: 'string', example: '08:30', description: 'Hora de inicio de la actividad (HH:mm)', validationRule: 'HH:mm.' },
      { key: 'lugar_actividad', label: 'Lugar / Actividad', required: true, type: 'string', example: 'Salida en Bus desde Colegio hacia Bariloche', description: 'Nombre descriptivo de la actividad o servicio', validationRule: 'Obligatorio.' },
      { key: 'proveedor_asignado', label: 'Proveedor Asignado', required: false, type: 'string', example: 'Transportes Andes del Sur SRL', description: 'Nombre del prestador', validationRule: 'Texto.' },
      { key: 'categoria_servicio', label: 'Categoría', required: false, type: 'enum', allowedValues: ['Transporte', 'Alojamiento', 'Gastronomía', 'Guías', 'Seguros', 'Entradas', 'Otros'], example: 'Transporte', description: 'Rubro del servicio', validationRule: 'Categoría válida.' },
      { key: 'guia_contacto', label: 'Guía / Contacto en Sitio', required: false, type: 'string', example: 'Coordinador: Esteban Gómez (+54 9 11 5566-1122)', description: 'Guía o contacto a cargo', validationRule: 'Texto libre.' },
      { key: 'costo_total', label: 'Costo Total', required: false, type: 'number', example: 8500000, description: 'Costo total pactado para el servicio', validationRule: 'Número >= 0.' },
      { key: 'moneda', label: 'Moneda', required: true, type: 'enum', allowedValues: ['ARS', 'USD'], example: 'ARS', description: 'Moneda del costo', validationRule: 'ARS o USD.' },
      { key: 'pago_reserva', label: 'Anticipo / Reserva Pagada', required: false, type: 'number', example: 2550000, description: 'Monto ya transferido por reserva', validationRule: 'Número >= 0.' },
      { key: 'estado_proveedor', label: 'Estado del Proveedor', required: true, type: 'enum', allowedValues: ['pendiente', 'contactado', 'presupuestado', 'reserva_confirmada', 'reconfirmado_48h', 'con_problema'], example: 'reserva_confirmada', description: 'Estado de confirmación de la prestación', validationRule: 'Estado válido.' },
      { key: 'observaciones', label: 'Observaciones / Notas', required: false, type: 'string', example: 'Presentarse con 30 minutos de antelación para carga de equipaje.', description: 'Detalles operativos', validationRule: 'Texto libre.' }
    ],
    sampleRows: [
      {
        operation_file_code: 'VE-2026-004',
        dia_numero: 1,
        fecha: '2026-09-15',
        hora: '08:00',
        lugar_actividad: 'Presentación en puerta de Colegio y carga de equipaje',
        proveedor_asignado: 'Transportes Andes del Sur SRL',
        categoria_servicio: 'Transporte',
        guia_contacto: 'Coordinador General: Esteban Gómez (+54 9 11 5566-1122)',
        costo_total: 8500000,
        moneda: 'ARS',
        pago_reserva: 2550000,
        estado_proveedor: 'reserva_confirmada',
        observaciones: 'Control de autorizaciones y fichas médicas al subir al bus.'
      },
      {
        operation_file_code: 'VE-2026-004',
        dia_numero: 2,
        fecha: '2026-09-16',
        hora: '10:30',
        lugar_actividad: 'Check-in en Hotel y almuerzo de bienvenida',
        proveedor_asignado: 'Hotel Patagonia Lake Resort',
        categoria_servicio: 'Alojamiento',
        guia_contacto: 'Recepción Hotel: Valeria Soria',
        costo_total: 12600000,
        moneda: 'ARS',
        pago_reserva: 6300000,
        estado_proveedor: 'reserva_confirmada',
        observaciones: 'Distribución de llaves por rooming list aprobado.'
      }
    ]
  }
];

export function getTemplateById(id: string): ImportTemplateDefinition | undefined {
  return OFFICIAL_TEMPLATES.find(t => t.id === id);
}

/**
 * Downloads a template in XLSX format with formatted headers, instructions and sample rows.
 */
export function downloadTemplateXLSX(template: ImportTemplateDefinition) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Plantilla con datos de ejemplo
  const wsData = XLSX.utils.json_to_sheet(template.sampleRows);
  XLSX.utils.book_append_sheet(wb, wsData, 'Plantilla Cultour');

  // Sheet 2: Diccionario de Columnas & Validaciones
  const dictRows = template.columns.map(c => ({
    'Columna': c.label,
    'Clave_Interna': c.key,
    'Obligatorio': c.required ? 'SÍ' : 'NO',
    'Tipo': c.type,
    'Valores_Permitidos': c.allowedValues ? c.allowedValues.join(' | ') : 'Cualquiera',
    'Ejemplo': c.example,
    'Regla_Validacion': c.validationRule,
    'Descripcion': c.description
  }));
  const wsDict = XLSX.utils.json_to_sheet(dictRows);
  XLSX.utils.book_append_sheet(wb, wsDict, 'Instrucciones y Validaciones');

  XLSX.writeFile(wb, template.fileName);
}

/**
 * Downloads a template in UTF-8 CSV format with BOM for perfect Excel compatibility.
 */
export function downloadTemplateCSV(template: ImportTemplateDefinition) {
  const headers = template.columns.map(c => c.key);
  const rows = template.sampleRows.map(r => 
    headers.map(h => {
      const val = r[h] !== undefined ? r[h] : '';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(',')
  );

  const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', template.fileName.replace('.xlsx', '.csv'));
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
