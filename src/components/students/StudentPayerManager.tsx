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
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatPercent } from '../../utils/financialCalculations';
import { StudentPayer } from '../../types';

interface StudentPayerManagerProps {
  initialOperationId?: string;
  onBack?: () => void;
}

export const StudentPayerManager: React.FC<StudentPayerManagerProps> = ({
  initialOperationId,
  onBack
}) => {
  const { operations, updateStudentPayment, addStudentToOperation, setSelectedOperationId, openImportCenter } = useApp();

  // Find educational trips (or operations with students)
  const educationalTrips = useMemo(() => {
    return operations.filter(op => op.businessUnit === 'viajes' || (op.students && op.students.length > 0));
  }, [operations]);

  const [selectedOpId, setSelectedOpId] = useState<string>(
    initialOperationId && operations.some(o => o.id === initialOperationId)
      ? initialOperationId
      : educationalTrips[0]?.id || ''
  );
  const [statusFilter, setStatusFilter] = useState<'all' | 'al_dia' | 'pago_parcial' | 'sin_pago'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const selectedTrip = operations.find(op => op.id === selectedOpId) || educationalTrips[0];
  const studentsList = selectedTrip?.students || [];

  // Summary for selected trip
  const tripStats = useMemo(() => {
    if (!studentsList.length) {
      return {
        totalStudents: 0,
        paidStudents: 0,
        partialStudents: 0,
        debtStudents: 0,
        totalExpected: 0,
        totalPaid: 0,
        totalDebt: 0
      };
    }

    const totalStudents = studentsList.length;
    const paidStudents = studentsList.filter(s => s.status === 'al_dia').length;
    const partialStudents = studentsList.filter(s => s.status === 'pago_parcial').length;
    const debtStudents = studentsList.filter(s => s.status !== 'al_dia').length;

    const totalExpected = studentsList.reduce((sum, s) => sum + s.expectedAmount, 0);
    const totalPaid = studentsList.reduce((sum, s) => sum + s.paidAmount, 0);
    const totalDebt = Math.max(0, totalExpected - totalPaid);

    return {
      totalStudents,
      paidStudents,
      partialStudents,
      debtStudents,
      totalExpected,
      totalPaid,
      totalDebt
    };
  }, [studentsList]);

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return studentsList.filter(st => {
      if (statusFilter !== 'all' && st.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          st.studentName.toLowerCase().includes(q) ||
          st.payerName.toLowerCase().includes(q) ||
          (st.payerPhone && st.payerPhone.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [studentsList, statusFilter, searchQuery]);

  // Copy WhatsApp Reminder
  const handleCopyWhatsApp = (student: StudentPayer) => {
    const debt = student.expectedAmount - student.paidAmount;
    const text = `Hola ${student.payerName}, te escribimos desde Cultour respecto al viaje de ${student.studentName} (${selectedTrip?.name}). Les recordamos que el saldo pendiente es de ${formatCurrency(debt, selectedTrip?.currency)} con vencimiento el ${student.paymentDueDate}. Ante cualquier consulta o para enviar el comprobante de transferencia, estamos a disposición. ¡Muchas gracias!`;
    
    navigator.clipboard.writeText(text);
    setCopiedId(student.id);
    setTimeout(() => setCopiedId(null), 2500);
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
              <span>Control nominal de cuotas por alumno: Estudiante ↔ Tutor / Padre ↔ Viaje ↔ Cobranza</span>
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
              className="mb-2 text-xs font-mono text-[#4F46E5] hover:underline flex items-center gap-1 cursor-pointer"
            >
              ← Volver al Panel de Cobranzas
            </button>
          )}
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1A1A1A] leading-[1.15]">
            Viajes Educativos & Escuelas<br />
            <span className="italic font-normal">Nómina de Alumnos & Cuotas</span>
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#666666]">
            <span className="text-[#4F46E5] font-medium font-mono">[ Turismo Educativo ]</span>
            <span className="text-[#D0D0CC]">•</span>
            <span>Control nominal de cuotas por alumno: Estudiante ↔ Tutor / Padre ↔ Escuela ↔ Cobranza</span>
          </div>
        </div>

        {/* Trip Selector Dropdown & Import */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
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
            className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-lg px-3 py-2 text-xs font-mono text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5] shadow-xs cursor-pointer"
          >
            {educationalTrips.map(trip => (
              <option key={trip.id} value={trip.id} className="bg-white text-[#1A1A1A]">
                {trip.code} - {trip.name} ({trip.clientOrSchool})
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
                <span className="text-base font-bold text-[#1A1A1A] font-serif">{selectedTrip.name}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                  {selectedTrip.code}
                </span>
              </div>
              <p className="text-xs text-[#666666] mt-0.5">
                Colegio: <strong className="text-[#1A1A1A]">{selectedTrip.clientOrSchool}</strong> • Fecha de viaje: <span className="font-mono text-[#1A1A1A]">{selectedTrip.date}</span>
              </p>
            </div>

            <button
              onClick={() => setSelectedOperationId(selectedTrip.id)}
              className="text-xs text-[#4F46E5] hover:underline font-mono font-bold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <span>Abrir Ficha de la Operación</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* KPI Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="bg-[#F9F9F7] p-3.5 rounded-xl border border-[#E5E5E1]">
              <span className="text-[10px] font-mono uppercase font-bold text-[#666666] block">Total Estudiantes</span>
              <span className="text-xl font-bold text-[#1A1A1A] font-mono">{tripStats.totalStudents}</span>
              <span className="text-[10px] text-[#888888] font-mono block">Inscriptos</span>
            </div>

            <div className="bg-[#F9F9F7] p-3.5 rounded-xl border border-[#E5E5E1]">
              <span className="text-[10px] font-mono uppercase font-bold text-[#059669] block">Pagaron Total (Al Día)</span>
              <span className="text-xl font-bold text-[#059669] font-mono">{tripStats.paidStudents}</span>
              <span className="text-[10px] text-[#059669]/80 font-mono block">
                {formatPercent(tripStats.totalStudents > 0 ? (tripStats.paidStudents / tripStats.totalStudents) * 100 : 0)}
              </span>
            </div>

            <div className="bg-[#F9F9F7] p-3.5 rounded-xl border border-[#E5E5E1]">
              <span className="text-[10px] font-mono uppercase font-bold text-[#D97706] block">Pagos Parciales</span>
              <span className="text-xl font-bold text-[#D97706] font-mono">{tripStats.partialStudents}</span>
              <span className="text-[10px] text-[#D97706]/80 font-mono block">Con saldo pendiente</span>
            </div>

            <div className="bg-[#F9F9F7] p-3.5 rounded-xl border border-[#E5E5E1]">
              <span className="text-[10px] font-mono uppercase font-bold text-[#E11D48] block">Deudores Totales</span>
              <span className="text-xl font-bold text-[#E11D48] font-mono">{tripStats.debtStudents}</span>
              <span className="text-[10px] text-[#E11D48]/80 font-mono block">Alumnos con deuda</span>
            </div>

            <div className="bg-[#F9F9F7] p-3.5 rounded-xl border border-[#E5E5E1]">
              <span className="text-[10px] font-mono uppercase font-bold text-[#666666] block">Cobrado Efectivo</span>
              <span className="text-base font-bold text-[#059669] font-mono">{formatCurrency(tripStats.totalPaid, selectedTrip.currency)}</span>
              <span className="text-[10px] text-[#888888] font-mono block">Total en cuentas</span>
            </div>

            <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200">
              <span className="text-[10px] font-mono uppercase font-bold text-[#E11D48] block">Falta Cobrar</span>
              <span className="text-base font-extrabold text-[#E11D48] font-mono">{formatCurrency(tripStats.totalDebt, selectedTrip.currency)}</span>
              <span className="text-[10px] text-[#E11D48]/80 font-mono block">Saldo por recaudar</span>
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
              placeholder="Buscar estudiante o pagador..."
              className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg pl-8 pr-3 py-2 text-[#1A1A1A] placeholder-[#888888] focus:outline-none focus:border-[#4F46E5] text-xs font-mono transition-colors"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 bg-[#F4F4F0] p-1 rounded-lg border border-[#E5E5E1] font-mono text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                statusFilter === 'all' ? 'bg-[#1A1A1A] text-white font-bold shadow-xs' : 'text-[#666666] hover:text-[#1A1A1A]'
              }`}
            >
              Todos ({studentsList.length})
            </button>
            <button
              onClick={() => setStatusFilter('al_dia')}
              className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                statusFilter === 'al_dia' ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-300' : 'text-[#666666] hover:text-[#1A1A1A]'
              }`}
            >
              Al Día ({tripStats.paidStudents})
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
              Sin Pago ({studentsList.filter(s => s.status === 'sin_pago').length})
            </button>
          </div>
        </div>
      </div>

      {/* Nominal Student Table */}
      <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F9F9F7] text-[#666666] uppercase font-mono border-b border-[#E5E5E1] text-[10px]">
              <tr>
                <th className="py-3 px-3.5 font-semibold">Estudiante</th>
                <th className="py-3 px-3 font-semibold">Padre / Madre / Pagador</th>
                <th className="py-3 px-3 font-semibold">Contacto</th>
                <th className="py-3 px-3 text-right font-semibold">Cuota Total</th>
                <th className="py-3 px-3 text-right text-[#059669] font-semibold">Pagado</th>
                <th className="py-3 px-3 text-right text-[#E11D48] font-semibold">Saldo Adeudado</th>
                <th className="py-3 px-3 font-semibold">Vencimiento</th>
                <th className="py-3 px-3 text-center font-semibold">Estado</th>
                <th className="py-3 px-3 text-center font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E1] font-mono">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-[#888888] font-sans">
                    No se encontraron estudiantes para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => {
                  const debt = Math.max(0, st.expectedAmount - st.paidAmount);
                  const isPaid = st.status === 'al_dia';

                  return (
                    <tr key={st.id} className="hover:bg-[#F4F4F0]/60 transition-colors">
                      
                      {/* Student Name */}
                      <td className="py-3 px-3.5 font-sans font-bold text-[#1A1A1A]">
                        {st.studentName}
                      </td>

                      {/* Payer Name */}
                      <td className="py-3 px-3 font-sans text-[#1A1A1A] font-medium">
                        {st.payerName}
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-3 font-sans text-[#666666] text-[11px]">
                        {st.payerPhone || '-'}
                      </td>

                      {/* Expected */}
                      <td className="py-3 px-3 text-right text-[#666666]">
                        {formatCurrency(st.expectedAmount, selectedTrip?.currency)}
                      </td>

                      {/* Paid */}
                      <td className="py-3 px-3 text-right text-[#059669] font-bold">
                        {formatCurrency(st.paidAmount, selectedTrip?.currency)}
                      </td>

                      {/* Debt */}
                      <td className="py-3 px-3 text-right font-bold">
                        {debt > 0 ? (
                          <span className="text-[#E11D48]">{formatCurrency(debt, selectedTrip?.currency)}</span>
                        ) : (
                          <span className="text-[#059669]">$ 0</span>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-3 text-[#666666] text-[11px]">
                        {st.paymentDueDate}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center font-sans">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded font-mono font-bold ${
                          st.status === 'al_dia'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : st.status === 'pago_parcial'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {st.status === 'al_dia' ? 'Al Día' : st.status === 'pago_parcial' ? 'Parcial' : 'Sin Pago'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center font-sans">
                        <div className="flex items-center justify-center gap-1.5">
                          {debt > 0 && (
                            <>
                              <button
                                onClick={() => handleCopyWhatsApp(st)}
                                title="Copiar mensaje de recordatorio para WhatsApp"
                                className="p-1.5 rounded bg-[#F4F4F0] hover:bg-[#E5E5E1] text-[#059669] transition-colors border border-[#E5E5E1] cursor-pointer"
                              >
                                {copiedId === st.id ? <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" /> : <MessageSquare className="w-3.5 h-3.5" />}
                              </button>

                              <button
                                onClick={() => {
                                  const amountStr = prompt(
                                    `Registrar cobro para ${st.studentName} (Saldo adeudado: ${formatCurrency(debt, selectedTrip?.currency)}):`,
                                    String(debt)
                                  );
                                  if (amountStr) {
                                    const newPaid = st.paidAmount + (parseFloat(amountStr) || 0);
                                    updateStudentPayment(selectedTrip.id, st.id, newPaid);
                                  }
                                }}
                                className="px-2.5 py-1 rounded bg-[#1A1A1A] hover:bg-black text-white text-[11px] font-mono font-bold transition-colors shadow-xs cursor-pointer"
                              >
                                Cobrar
                              </button>
                            </>
                          )}
                          {isPaid && (
                            <span className="text-[11px] text-[#059669] flex items-center gap-1 font-mono font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                              <span>Saldado</span>
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

    </div>
  );
};
