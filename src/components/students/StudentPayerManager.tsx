import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Phone,
  MessageSquare,
  Copy,
  Plus,
  ArrowRight,
  Filter,
  FileSpreadsheet,
  Calendar,
  X,
  CreditCard
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatPercent } from '../../utils/financialCalculations';
import { StudentPayer, PaymentMethod } from '../../types';
import { getDaysDifference } from '../collections/collectionUtils';

interface StudentPayerManagerProps {
  initialOperationId?: string;
  onBack?: () => void;
}

export const StudentPayerManager: React.FC<StudentPayerManagerProps> = ({
  initialOperationId,
  onBack
}) => {
  const {
    operations,
    accounts,
    updateStudentPayment,
    addStudentToOperation,
    setSelectedOperationId,
    openImportCenter
  } = useApp();

  // Find educational trips (or operations with students)
  const educationalTrips = useMemo(() => {
    return operations.filter(op => op.businessUnit === 'viajes' || op.businessUnit === 'salidas' || (op.students && op.students.length > 0));
  }, [operations]);

  const [selectedOpId, setSelectedOpId] = useState<string>(
    initialOperationId && operations.some(o => o.id === initialOperationId)
      ? initialOperationId
      : educationalTrips[0]?.id || ''
  );
  const [statusFilter, setStatusFilter] = useState<'all' | 'al_dia' | 'pago_parcial' | 'sin_pago' | 'liberado' | 'vencido'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Quick collection modal state
  const [collectingStudent, setCollectingStudent] = useState<StudentPayer | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('mercado_pago');
  const [payAccountId, setPayAccountId] = useState<string>('mp_mariano');
  const [payNotes, setPayNotes] = useState<string>('');

  const selectedTrip = operations.find(op => op.id === selectedOpId) || educationalTrips[0];
  const studentsList = selectedTrip?.students || [];

  // Summary for selected trip with strict rules:
  // - Liberated students sum zero and do not count as debtors
  const tripStats = useMemo(() => {
    if (!studentsList.length) {
      return {
        totalStudents: 0,
        liberatedStudents: 0,
        payingStudents: 0,
        paidStudents: 0,
        partialStudents: 0,
        debtStudents: 0,
        expiredCount: 0,
        urgent15dCount: 0,
        totalExpected: 0,
        totalPaid: 0,
        totalDebt: 0
      };
    }

    let liberatedStudents = 0;
    let payingStudents = 0;
    let paidStudents = 0;
    let partialStudents = 0;
    let debtStudents = 0;
    let expiredCount = 0;
    let urgent15dCount = 0;
    let totalExpected = 0;
    let totalPaid = 0;

    studentsList.forEach(st => {
      const isLiberated = st.isLiberated === true ||
        (st.notes && st.notes.toLowerCase().includes('liberado')) ||
        (st.notes && st.notes.toLowerCase().includes('becado')) ||
        (st.expectedAmount === 0);

      if (isLiberated) {
        liberatedStudents++;
      } else {
        payingStudents++;
        const exp = Number(st.expectedAmount) || 0;
        const paid = Number(st.paidAmount) || 0;
        const debt = Math.max(0, exp - paid);
        const daysDiff = getDaysDifference(st.paymentDueDate || selectedTrip?.date || '');

        totalExpected += exp;
        totalPaid += paid;

        if (debt <= 0) {
          paidStudents++;
        } else {
          debtStudents++;
          if (paid > 0) {
            partialStudents++;
          }
          if (daysDiff < 0) {
            expiredCount++;
          } else if (daysDiff <= 15) {
            urgent15dCount++;
          }
        }
      }
    });

    const totalDebt = Math.max(0, totalExpected - totalPaid);

    return {
      totalStudents: studentsList.length,
      liberatedStudents,
      payingStudents,
      paidStudents,
      partialStudents,
      debtStudents,
      expiredCount,
      urgent15dCount,
      totalExpected,
      totalPaid,
      totalDebt
    };
  }, [studentsList, selectedTrip]);

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return studentsList.filter(st => {
      const isLiberated = st.isLiberated === true ||
        (st.notes && st.notes.toLowerCase().includes('liberado')) ||
        (st.notes && st.notes.toLowerCase().includes('becado')) ||
        (st.expectedAmount === 0);

      const debt = isLiberated ? 0 : Math.max(0, (st.expectedAmount || 0) - (st.paidAmount || 0));
      const daysDiff = getDaysDifference(st.paymentDueDate || selectedTrip?.date || '');

      if (statusFilter === 'liberado' && !isLiberated) return false;
      if (statusFilter === 'al_dia' && (isLiberated || debt > 0)) return false;
      if (statusFilter === 'pago_parcial' && (isLiberated || st.paidAmount === 0 || debt <= 0)) return false;
      if (statusFilter === 'sin_pago' && (isLiberated || st.paidAmount > 0)) return false;
      if (statusFilter === 'vencido' && (isLiberated || debt <= 0 || daysDiff >= 0)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          st.studentName.toLowerCase().includes(q) ||
          st.payerName.toLowerCase().includes(q) ||
          (st.payerPhone && st.payerPhone.toLowerCase().includes(q)) ||
          (st.studentDni && st.studentDni.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [studentsList, statusFilter, searchQuery, selectedTrip]);

  // Copy WhatsApp Reminder
  const handleCopyWhatsApp = (student: StudentPayer) => {
    const debt = student.expectedAmount - student.paidAmount;
    const text = `Hola ${student.payerName}, te escribimos desde Cultour respecto al viaje de ${student.studentName} (${selectedTrip?.name}). Les recordamos que el saldo pendiente es de ${formatCurrency(debt, selectedTrip?.currency)} con fecha límite el ${student.paymentDueDate}. Ante cualquier consulta o para enviar el comprobante de transferencia, estamos a disposición. ¡Muchas gracias!`;
    
    navigator.clipboard.writeText(text);
    setCopiedId(student.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenCollectModal = (student: StudentPayer) => {
    const debt = Math.max(0, student.expectedAmount - student.paidAmount);
    setCollectingStudent(student);
    setPayAmount(debt);
    setPayMethod('mercado_pago');
    setPayAccountId(accounts[0]?.id || 'mp_mariano');
    setPayNotes('');
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingStudent || !selectedTrip) return;
    const newPaid = (collectingStudent.paidAmount || 0) + Number(payAmount);
    updateStudentPayment(selectedTrip.id, collectingStudent.id, newPaid, payMethod, payNotes);
    setCollectingStudent(null);
  };

  if (educationalTrips.length === 0) {
    return (
      <div className="space-y-8 pb-16 animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-[#E5E5E1]">
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1A1A1A] leading-[1.15]">
              Viajes Educativos<br />
              <span className="italic font-normal">& Nómina de Pagadores</span>
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#666666]">
              <span className="text-[#4F46E5] font-medium font-mono">[ Turismo Educativo ]</span>
              <span className="text-[#D0D0CC]">•</span>
              <span>Control nominal de cuotas por alumno: Estudiante ↔ Tutor / Padre ↔ Escuela ↔ Cobranza</span>
            </div>
          </div>
          <button
            onClick={() => openImportCenter('students')}
            className="px-3.5 py-2 rounded-lg bg-[#FFFFFF] hover:bg-[#F4F4F0] text-[#1A1A1A] border border-[#E5E5E1] font-mono font-bold text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#059669]" />
            <span>Importar Pasajeros</span>
          </button>
        </div>

        <div className="bg-[#FFFFFF] border border-dashed border-[#E5E5E1] rounded-2xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 bg-indigo-50 text-[#4F46E5] border border-indigo-200 rounded-2xl flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-base font-bold text-[#1A1A1A] font-serif">Sin Viajes Educativos Cargados</h3>
            <p className="text-xs text-[#666666]">
              Para gestionar estudiantes, tutores y cuotas individualizadas, primero crea una operación de tipo "Viajes Educativos" o importa la nómina de pasajeros desde Excel.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => openImportCenter('operations')}
              className="px-4 py-2 bg-[#1A1A1A] hover:bg-black text-white rounded-lg text-xs font-mono font-bold transition-colors shadow-xs cursor-pointer"
            >
              Crear o Importar Operación
            </button>
            <button
              onClick={() => openImportCenter('students')}
              className="px-4 py-2 bg-[#FFFFFF] hover:bg-[#F4F4F0] text-[#1A1A1A] border border-[#E5E5E1] rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer"
            >
              Importar Lista de Pasajeros
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-[#E5E5E1]">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="mb-3 text-xs font-mono font-bold text-[#4F46E5] hover:text-[#3730A3] flex items-center gap-1.5 transition-colors cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 w-fit"
            >
              <span>← Volver a la Vista Consolidada de Cobranzas</span>
            </button>
          )}
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1A1A1A] leading-[1.15]">
            Nómina de Alumnos & Cuotas<br />
            <span className="italic font-normal">Desglose Nominal por Escuela</span>
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#666666]">
            <span className="text-[#4F46E5] font-medium font-mono">[ Desglose de Cobranzas ]</span>
            <span className="text-[#D0D0CC]">•</span>
            <span>Cada alumno con precio asignado, cuotas, cuánto pagó, cuánto le falta y próximo vencimiento</span>
          </div>
        </div>

        {/* Trip Selector Dropdown & Import */}
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => openImportCenter('students')}
            className="px-3.5 py-2 rounded-lg bg-[#FFFFFF] hover:bg-[#F4F4F0] text-[#1A1A1A] border border-[#E5E5E1] font-mono font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#059669]" />
            <span>Importar Pasajeros</span>
          </button>

          <select
            value={selectedTrip?.id || ''}
            onChange={(e) => setSelectedOpId(e.target.value)}
            className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-lg px-3 py-2 text-xs font-mono text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5] shadow-xs cursor-pointer font-bold"
          >
            {educationalTrips.map(trip => (
              <option key={trip.id} value={trip.id} className="bg-white text-[#1A1A1A]">
                {trip.code} - {trip.clientOrSchool} ({trip.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Trip Snapshot Banner */}
      {selectedTrip && (
        <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-[#E5E5E1]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-[#1A1A1A] font-serif">{selectedTrip.clientOrSchool}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                  {selectedTrip.code}
                </span>
                <span className="text-xs text-[#666666] font-mono">
                  {selectedTrip.name}
                </span>
              </div>
              <p className="text-xs text-[#666666] mt-0.5">
                Destino: <strong className="text-[#1A1A1A]">{selectedTrip.destination || 'N/D'}</strong> • Fecha de viaje: <span className="font-mono text-[#1A1A1A]">{selectedTrip.date}</span>
                {tripStats.liberatedStudents > 0 && (
                  <span className="ml-2 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px] font-mono font-bold">
                    {tripStats.liberatedStudents} {tripStats.liberatedStudents === 1 ? 'Alumno Liberado (Costo $0)' : 'Alumnos Liberados (Costo $0)'}
                  </span>
                )}
              </p>
            </div>

            <button
              onClick={() => setSelectedOperationId(selectedTrip.id)}
              className="text-xs text-[#4F46E5] hover:underline font-mono font-bold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <span>Abrir Ficha del File</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* KPI Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-[#F9F9F7] p-3.5 rounded-xl border border-[#E5E5E1]">
              <span className="text-[10px] font-mono uppercase font-bold text-[#666666] block">Nómina Total</span>
              <span className="text-xl font-bold text-[#1A1A1A] font-mono">{tripStats.totalStudents}</span>
              <span className="text-[10px] text-[#888888] font-mono block">
                {tripStats.payingStudents} pagantes {tripStats.liberatedStudents > 0 ? `+ ${tripStats.liberatedStudents} lib.` : ''}
              </span>
            </div>

            <div className="bg-[#F9F9F7] p-3.5 rounded-xl border border-[#E5E5E1]">
              <span className="text-[10px] font-mono uppercase font-bold text-[#666666] block">Total Contratado</span>
              <span className="text-base font-bold text-[#1A1A1A] font-mono">{formatCurrency(tripStats.totalExpected, selectedTrip.currency)}</span>
              <span className="text-[10px] text-[#888888] font-mono block">Suma precios asignados</span>
            </div>

            <div className="bg-[#F9F9F7] p-3.5 rounded-xl border border-[#E5E5E1]">
              <span className="text-[10px] font-mono uppercase font-bold text-[#059669] block">Total Cobrado</span>
              <span className="text-base font-bold text-[#059669] font-mono">{formatCurrency(tripStats.totalPaid, selectedTrip.currency)}</span>
              <span className="text-[10px] text-[#059669]/80 font-mono block">
                {formatPercent(tripStats.totalExpected > 0 ? (tripStats.totalPaid / tripStats.totalExpected) * 100 : 0)} recaudado
              </span>
            </div>

            <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200">
              <span className="text-[10px] font-mono uppercase font-bold text-[#E11D48] block">Saldo Pendiente</span>
              <span className="text-base font-extrabold text-[#E11D48] font-mono">{formatCurrency(tripStats.totalDebt, selectedTrip.currency)}</span>
              <span className="text-[10px] text-[#E11D48]/80 font-mono block">Resta por cobrar</span>
            </div>

            <div className="bg-[#F9F9F7] p-3.5 rounded-xl border border-[#E5E5E1]">
              <span className="text-[10px] font-mono uppercase font-bold text-[#D97706] block">Alumnos Deudores</span>
              <span className="text-xl font-bold text-[#D97706] font-mono">{tripStats.debtStudents}</span>
              <span className="text-[10px] text-[#D97706]/80 font-mono block">Con saldo pendiente</span>
            </div>

            <div className="bg-[#F9F9F7] p-3.5 rounded-xl border border-[#E5E5E1]">
              <span className="text-[10px] font-mono uppercase font-bold text-[#E11D48] block">Alertas Vencimiento</span>
              <div className="flex items-center gap-2 mt-1">
                {tripStats.expiredCount > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-mono font-bold border border-rose-300">
                    🔴 {tripStats.expiredCount} vencidas
                  </span>
                )}
                {tripStats.urgent15dCount > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-mono font-bold border border-amber-300">
                    🟡 {tripStats.urgent15dCount} ≤15d
                  </span>
                )}
                {tripStats.expiredCount === 0 && tripStats.urgent15dCount === 0 && (
                  <span className="text-xs text-[#059669] font-mono font-bold">🟢 En fecha</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          {/* Search box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar estudiante, tutor o DNI..."
              className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg pl-8 pr-3 py-2 text-[#1A1A1A] placeholder-[#888888] focus:outline-none focus:border-[#4F46E5] text-xs font-mono transition-colors"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1 bg-[#F4F4F0] p-1 rounded-lg border border-[#E5E5E1] font-mono text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                statusFilter === 'all' ? 'bg-[#1A1A1A] text-white font-bold shadow-xs' : 'text-[#666666] hover:text-[#1A1A1A]'
              }`}
            >
              Todos ({studentsList.length})
            </button>
            <button
              onClick={() => setStatusFilter('vencido')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                statusFilter === 'vencido' ? 'bg-rose-600 text-white font-bold' : 'text-[#E11D48] hover:bg-rose-50'
              }`}
            >
              🔴 Vencidos ({tripStats.expiredCount})
            </button>
            <button
              onClick={() => setStatusFilter('pago_parcial')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                statusFilter === 'pago_parcial' ? 'bg-amber-50 text-amber-800 font-bold border border-amber-300' : 'text-[#666666] hover:text-[#1A1A1A]'
              }`}
            >
              Parcial ({tripStats.partialStudents})
            </button>
            <button
              onClick={() => setStatusFilter('sin_pago')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                statusFilter === 'sin_pago' ? 'bg-rose-50 text-rose-800 font-bold border border-rose-300' : 'text-[#666666] hover:text-[#1A1A1A]'
              }`}
            >
              Sin Pago ({studentsList.filter(s => !s.isLiberated && s.paidAmount === 0 && (s.expectedAmount || 0) > 0).length})
            </button>
            <button
              onClick={() => setStatusFilter('al_dia')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                statusFilter === 'al_dia' ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-300' : 'text-[#666666] hover:text-[#1A1A1A]'
              }`}
            >
              Al Día ({tripStats.paidStudents})
            </button>
            {tripStats.liberatedStudents > 0 && (
              <button
                onClick={() => setStatusFilter('liberado')}
                className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                  statusFilter === 'liberado' ? 'bg-indigo-600 text-white font-bold' : 'text-indigo-700 hover:bg-indigo-50'
                }`}
              >
                Liberados ({tripStats.liberatedStudents})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nominal Student Table */}
      <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F9F9F7] text-[#666666] uppercase font-mono border-b border-[#E5E5E1] text-[10px]">
              <tr>
                <th className="py-3 px-3.5 font-semibold">Estudiante / Pasajero</th>
                <th className="py-3 px-3 font-semibold">Padre / Madre / Pagador</th>
                <th className="py-3 px-3 text-right font-semibold">Precio Asignado</th>
                <th className="py-3 px-3 text-right text-[#059669] font-semibold">Pagado</th>
                <th className="py-3 px-3 text-right text-[#E11D48] font-semibold">Falta / Saldo</th>
                <th className="py-3 px-3 font-semibold">Próximo Vencimiento</th>
                <th className="py-3 px-3 text-center font-semibold">Estado de Cuota</th>
                <th className="py-3 px-3 text-center font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E1] font-mono">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[#888888] font-sans">
                    No se encontraron estudiantes para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => {
                  const isLiberated = st.isLiberated === true ||
                    (st.notes && st.notes.toLowerCase().includes('liberado')) ||
                    (st.notes && st.notes.toLowerCase().includes('becado')) ||
                    (st.expectedAmount === 0);

                  const expected = isLiberated ? 0 : (Number(st.expectedAmount) || 0);
                  const paid = isLiberated ? 0 : (Number(st.paidAmount) || 0);
                  const debt = isLiberated ? 0 : Math.max(0, expected - paid);
                  const dueDate = st.paymentDueDate || selectedTrip?.date || '';
                  const daysDiff = getDaysDifference(dueDate);
                  const isPaid = !isLiberated && debt <= 0;

                  // Determine alert styling
                  let alertBadge = null;
                  if (isLiberated) {
                    alertBadge = (
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Liberado ($0)
                      </span>
                    );
                  } else if (isPaid) {
                    alertBadge = (
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Al Día
                      </span>
                    );
                  } else if (daysDiff < 0) {
                    alertBadge = (
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        🔴 Vencido hace {Math.abs(daysDiff)}d
                      </span>
                    );
                  } else if (daysDiff <= 15) {
                    alertBadge = (
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        🟡 Vence en {daysDiff}d
                      </span>
                    );
                  } else {
                    alertBadge = (
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        En Fecha ({daysDiff}d)
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={st.id}
                      className={`hover:bg-[#F4F4F0]/60 transition-colors ${
                        !isLiberated && daysDiff < 0 && debt > 0 ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      {/* Student Name */}
                      <td className="py-3 px-3.5 font-sans">
                        <div className="font-bold text-[#1A1A1A]">{st.studentName}</div>
                        {st.studentDni && (
                          <div className="text-[11px] text-[#888888] font-mono">DNI: {st.studentDni}</div>
                        )}
                      </td>

                      {/* Payer Name & Contact */}
                      <td className="py-3 px-3 font-sans">
                        <div className="text-[#1A1A1A] font-medium">{st.payerName}</div>
                        {st.payerPhone && (
                          <div className="text-[11px] text-[#666666] font-mono flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#888888]" />
                            <span>{st.payerPhone}</span>
                          </div>
                        )}
                      </td>

                      {/* Expected / Assigned Price */}
                      <td className="py-3 px-3 text-right">
                        {isLiberated ? (
                          <span className="text-[#888888] italic">$ 0 (Liberado)</span>
                        ) : (
                          <span className="text-[#1A1A1A] font-medium">
                            {formatCurrency(expected, selectedTrip?.currency)}
                          </span>
                        )}
                      </td>

                      {/* Paid */}
                      <td className="py-3 px-3 text-right text-[#059669] font-bold">
                        {isLiberated ? (
                          <span className="text-[#888888]">-</span>
                        ) : (
                          formatCurrency(paid, selectedTrip?.currency)
                        )}
                      </td>

                      {/* Remaining / Debt */}
                      <td className="py-3 px-3 text-right font-bold">
                        {isLiberated ? (
                          <span className="text-[#888888]">$ 0</span>
                        ) : debt > 0 ? (
                          <span className={`${daysDiff < 0 ? 'text-[#E11D48]' : 'text-[#D97706]'}`}>
                            {formatCurrency(debt, selectedTrip?.currency)}
                          </span>
                        ) : (
                          <span className="text-[#059669]">$ 0</span>
                        )}
                      </td>

                      {/* Due Date & Urgency Indicator */}
                      <td className="py-3 px-3">
                        {isLiberated ? (
                          <span className="text-[#888888] text-[11px]">-</span>
                        ) : (
                          <div className="flex flex-col">
                            <span className={`text-[11px] font-bold ${
                              daysDiff < 0 && debt > 0 ? 'text-[#E11D48]' : daysDiff <= 15 && debt > 0 ? 'text-[#D97706]' : 'text-[#1A1A1A]'
                            }`}>
                              {dueDate}
                            </span>
                            {debt > 0 && (
                              <span className="text-[10px] text-[#888888]">
                                {daysDiff < 0 ? `Retraso: ${Math.abs(daysDiff)} días` : `Faltan ${daysDiff} días`}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3 text-center font-sans">
                        {alertBadge}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center font-sans">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isLiberated && debt > 0 && (
                            <>
                              <button
                                onClick={() => handleCopyWhatsApp(st)}
                                title="Copiar mensaje de recordatorio para WhatsApp"
                                className="p-1.5 rounded bg-[#F4F4F0] hover:bg-[#E5E5E1] text-[#059669] transition-colors border border-[#E5E5E1] cursor-pointer"
                              >
                                {copiedId === st.id ? <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" /> : <MessageSquare className="w-3.5 h-3.5 text-[#059669]" />}
                              </button>

                              <button
                                onClick={() => handleOpenCollectModal(st)}
                                className="px-2.5 py-1 rounded bg-[#1A1A1A] hover:bg-black text-white text-[11px] font-mono font-bold transition-colors shadow-xs cursor-pointer"
                              >
                                Cobrar
                              </button>
                            </>
                          )}
                          {!isLiberated && isPaid && (
                            <span className="text-[11px] text-[#059669] flex items-center gap-1 font-mono font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                              <span>Saldado</span>
                            </span>
                          )}
                          {isLiberated && (
                            <span className="text-[11px] text-[#888888] font-mono">
                              Beca
                            </span>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Collect Modal */}
      {collectingStudent && selectedTrip && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E1]">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#4F46E5]" />
                <h3 className="font-serif text-lg font-bold text-[#1A1A1A]">Registrar Cobro de Alumno</h3>
              </div>
              <button
                onClick={() => setCollectingStudent(null)}
                className="text-[#888888] hover:text-[#1A1A1A] p-1 rounded-lg hover:bg-[#F4F4F0] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#F9F9F7] p-3.5 rounded-xl border border-[#E5E5E1] space-y-1 text-xs font-mono">
              <div>Estudiante: <strong className="text-[#1A1A1A] font-sans">{collectingStudent.studentName}</strong></div>
              <div>Tutor / Pagador: <strong className="text-[#1A1A1A] font-sans">{collectingStudent.payerName}</strong></div>
              <div>Colegio / File: <span className="text-[#4F46E5] font-bold">{selectedTrip.clientOrSchool} ({selectedTrip.code})</span></div>
              <div className="pt-1 text-[#E11D48] font-bold">
                Saldo pendiente actual: {formatCurrency(Math.max(0, collectingStudent.expectedAmount - collectingStudent.paidAmount), selectedTrip.currency)}
              </div>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#666666] font-mono font-bold mb-1 uppercase text-[10px]">
                  Monto a Cobrar ({selectedTrip.currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-[#1A1A1A] font-mono font-bold text-sm focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div>
                <label className="block text-[#666666] font-mono font-bold mb-1 uppercase text-[10px]">
                  Medio de Pago *
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-[#1A1A1A] font-mono focus:outline-none focus:border-[#4F46E5]"
                >
                  <option value="mercado_pago">Mercado Pago</option>
                  <option value="transferencia">Transferencia Bancaria</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="paypal">PayPal</option>
                  <option value="wetravel">WeTravel</option>
                  <option value="tarjeta">Tarjeta de Débito/Crédito</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-[#666666] font-mono font-bold mb-1 uppercase text-[10px]">
                  Cuenta Destino Real *
                </label>
                <select
                  value={payAccountId}
                  onChange={(e) => setPayAccountId(e.target.value)}
                  className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-[#1A1A1A] font-mono focus:outline-none focus:border-[#4F46E5]"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#666666] font-mono font-bold mb-1 uppercase text-[10px]">
                  Observaciones / Nro Comprobante
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Ej: Transferencia Santander #49120"
                  className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-[#1A1A1A] placeholder-[#888888] focus:outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#E5E5E1]">
                <button
                  type="button"
                  onClick={() => setCollectingStudent(null)}
                  className="px-4 py-2 rounded-lg bg-[#F4F4F0] hover:bg-[#E5E5E1] text-[#1A1A1A] font-mono text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#1A1A1A] hover:bg-black text-white font-mono text-xs font-bold transition-colors shadow-xs cursor-pointer"
                >
                  Confirmar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
