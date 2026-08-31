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

export const StudentPayerManager: React.FC = () => {
  const { operations, updateStudentPayment, addStudentToOperation, setSelectedOperationId, openImportCenter } = useApp();

  // Find educational trips (or operations with students)
  const educationalTrips = useMemo(() => {
    return operations.filter(op => op.businessUnit === 'viajes' || (op.students && op.students.length > 0));
  }, [operations]);

  const [selectedOpId, setSelectedOpId] = useState<string>(educationalTrips[0]?.id || '');
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
      <div className="space-y-6 pb-12 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#18181a] border border-white/10 rounded-xl p-5 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-300 bg-[#222224] px-2 py-0.5 rounded border border-white/10">
                Turismo Educativo
              </span>
              <span className="text-xs text-zinc-400 font-mono">Control de Pasajeros & Cuotas</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white font-syne flex items-center gap-2.5">
              <GraduationCap className="w-6 h-6 text-[#a5b4fc]" />
              <span>Viajes Educativos & Pagadores</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Control nominal de cuotas por alumno: Estudiante ↔ Tutor / Padre ↔ Viaje ↔ Cobranza.
            </p>
          </div>
          <button
            onClick={() => openImportCenter('students')}
            className="px-3 py-2 rounded-lg bg-[#222224] hover:bg-[#28282b] text-zinc-200 border border-white/10 font-mono font-bold text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#34d399]" />
            <span>Importar Pasajeros</span>
          </button>
        </div>

        <div className="bg-[#18181a] border border-dashed border-white/10 rounded-xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 bg-indigo-950/60 text-[#a5b4fc] border border-indigo-800/50 rounded-2xl flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-base font-bold text-white font-syne">Sin Viajes Educativos Cargados</h3>
            <p className="text-xs text-zinc-400">
              Para gestionar estudiantes, tutores y cuotas individualizadas, primero crea una operación de tipo "Viajes Educativos" o importa la nómina de pasajeros desde Excel.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => openImportCenter('operations')}
              className="px-4 py-2 bg-[#a5b4fc] hover:bg-[#c7d2fe] text-[#111113] rounded-lg text-xs font-mono font-bold transition-colors shadow-sm"
            >
              Crear o Importar Operación
            </button>
            <button
              onClick={() => openImportCenter('students')}
              className="px-4 py-2 bg-[#222224] hover:bg-[#28282b] text-zinc-200 border border-white/10 rounded-lg text-xs font-mono font-bold transition-colors"
            >
              Importar Lista de Pasajeros
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#18181a] border border-white/10 rounded-xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-300 bg-[#222224] px-2 py-0.5 rounded border border-white/10">
              Turismo Educativo
            </span>
            <span className="text-xs text-zinc-400 font-mono">Control de Pasajeros & Cuotas</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white font-syne flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-[#a5b4fc]" />
            <span>Viajes Educativos & Pagadores</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Control nominal de cuotas por alumno: Estudiante ↔ Tutor / Padre ↔ Viaje ↔ Cobranza.
          </p>
        </div>

        {/* Trip Selector Dropdown & Import */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => openImportCenter('students')}
            className="px-3 py-2 rounded-lg bg-[#222224] hover:bg-[#28282b] text-zinc-200 border border-white/10 font-mono font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#34d399]" />
            <span>Importar Pasajeros</span>
          </button>

          <select
            value={selectedTrip?.id || ''}
            onChange={(e) => setSelectedOpId(e.target.value)}
            className="bg-[#222224] border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#a5b4fc]"
          >
            {educationalTrips.map(trip => (
              <option key={trip.id} value={trip.id} className="bg-[#18181a] text-white">
                {trip.code} - {trip.name} ({trip.clientOrSchool})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Trip Snapshot Banner */}
      {selectedTrip && (
        <div className="bg-[#18181a] border border-white/10 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white font-syne">{selectedTrip.name}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                  {selectedTrip.code}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Colegio: <strong className="text-zinc-200">{selectedTrip.clientOrSchool}</strong> • Fecha de viaje: <span className="font-mono text-zinc-300">{selectedTrip.date}</span>
              </p>
            </div>

            <button
              onClick={() => setSelectedOperationId(selectedTrip.id)}
              className="text-xs text-[#a5b4fc] hover:underline font-mono font-bold flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Abrir Ficha de la Operación</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* KPI Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="bg-[#222224] p-3.5 rounded-lg border border-white/10">
              <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block">Total Estudiantes</span>
              <span className="text-xl font-bold text-white font-mono">{tripStats.totalStudents}</span>
              <span className="text-[10px] text-zinc-500 font-mono block">Inscriptos</span>
            </div>

            <div className="bg-[#222224] p-3.5 rounded-lg border border-white/10">
              <span className="text-[10px] font-mono uppercase font-bold text-[#34d399] block">Pagaron Total (Al Día)</span>
              <span className="text-xl font-bold text-[#34d399] font-mono">{tripStats.paidStudents}</span>
              <span className="text-[10px] text-[#34d399]/80 font-mono block">
                {formatPercent(tripStats.totalStudents > 0 ? (tripStats.paidStudents / tripStats.totalStudents) * 100 : 0)}
              </span>
            </div>

            <div className="bg-[#222224] p-3.5 rounded-lg border border-white/10">
              <span className="text-[10px] font-mono uppercase font-bold text-[#fbbf24] block">Pagos Parciales</span>
              <span className="text-xl font-bold text-[#fbbf24] font-mono">{tripStats.partialStudents}</span>
              <span className="text-[10px] text-[#fbbf24]/80 font-mono block">Con saldo pendiente</span>
            </div>

            <div className="bg-[#222224] p-3.5 rounded-lg border border-white/10">
              <span className="text-[10px] font-mono uppercase font-bold text-[#fb7185] block">Deudores Totales</span>
              <span className="text-xl font-bold text-[#fb7185] font-mono">{tripStats.debtStudents}</span>
              <span className="text-[10px] text-[#fb7185]/80 font-mono block">Alumnos con deuda</span>
            </div>

            <div className="bg-[#222224] p-3.5 rounded-lg border border-white/10">
              <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block">Cobrado Efectivo</span>
              <span className="text-base font-bold text-[#34d399] font-mono">{formatCurrency(tripStats.totalPaid, selectedTrip.currency)}</span>
              <span className="text-[10px] text-zinc-500 font-mono block">Total en cuentas</span>
            </div>

            <div className="bg-rose-950/30 p-3.5 rounded-lg border border-rose-800/40">
              <span className="text-[10px] font-mono uppercase font-bold text-[#fb7185] block">Falta Cobrar</span>
              <span className="text-base font-extrabold text-[#fb7185] font-mono">{formatCurrency(tripStats.totalDebt, selectedTrip.currency)}</span>
              <span className="text-[10px] text-[#fb7185]/80 font-mono block">Saldo por recaudar</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#18181a] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          {/* Search box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar estudiante o pagador..."
              className="w-full bg-[#222224] border border-white/10 rounded-lg pl-8 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-[#a5b4fc] text-xs font-mono"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 bg-[#222224] p-1 rounded-lg border border-white/10 font-mono text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded transition-all ${
                statusFilter === 'all' ? 'bg-[#a5b4fc] text-[#111113] font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todos ({studentsList.length})
            </button>
            <button
              onClick={() => setStatusFilter('al_dia')}
              className={`px-2.5 py-1 rounded transition-all ${
                statusFilter === 'al_dia' ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-800' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Al Día ({tripStats.paidStudents})
            </button>
            <button
              onClick={() => setStatusFilter('pago_parcial')}
              className={`px-2.5 py-1 rounded transition-all ${
                statusFilter === 'pago_parcial' ? 'bg-amber-950 text-amber-300 font-bold border border-amber-800' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Parcial ({tripStats.partialStudents})
            </button>
            <button
              onClick={() => setStatusFilter('sin_pago')}
              className={`px-2.5 py-1 rounded transition-all ${
                statusFilter === 'sin_pago' ? 'bg-rose-950 text-rose-300 font-bold border border-rose-800' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sin Pago ({studentsList.filter(s => s.status === 'sin_pago').length})
            </button>
          </div>
        </div>
      </div>

      {/* Nominal Student Table */}
      <div className="bg-[#18181a] border border-white/10 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#141416] text-zinc-400 uppercase font-mono border-b border-white/10 text-[10px]">
              <tr>
                <th className="py-3 px-3.5">Estudiante</th>
                <th className="py-3 px-3">Padre / Madre / Pagador</th>
                <th className="py-3 px-3">Contacto</th>
                <th className="py-3 px-3 text-right">Cuota Total</th>
                <th className="py-3 px-3 text-right text-[#34d399]">Pagado</th>
                <th className="py-3 px-3 text-right text-[#fb7185]">Saldo Adeudado</th>
                <th className="py-3 px-3">Vencimiento</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-zinc-500 font-sans">
                    No se encontraron estudiantes para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => {
                  const debt = Math.max(0, st.expectedAmount - st.paidAmount);
                  const isPaid = st.status === 'al_dia';

                  return (
                    <tr key={st.id} className="hover:bg-[#222224]/50 transition-colors">
                      
                      {/* Student Name */}
                      <td className="py-3 px-3.5 font-sans font-bold text-white">
                        {st.studentName}
                      </td>

                      {/* Payer Name */}
                      <td className="py-3 px-3 font-sans text-zinc-300 font-medium">
                        {st.payerName}
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-3 font-sans text-zinc-400 text-[11px]">
                        {st.payerPhone || '-'}
                      </td>

                      {/* Expected */}
                      <td className="py-3 px-3 text-right text-zinc-400">
                        {formatCurrency(st.expectedAmount, selectedTrip?.currency)}
                      </td>

                      {/* Paid */}
                      <td className="py-3 px-3 text-right text-[#34d399] font-bold">
                        {formatCurrency(st.paidAmount, selectedTrip?.currency)}
                      </td>

                      {/* Debt */}
                      <td className="py-3 px-3 text-right font-bold">
                        {debt > 0 ? (
                          <span className="text-[#fb7185]">{formatCurrency(debt, selectedTrip?.currency)}</span>
                        ) : (
                          <span className="text-[#34d399]">$ 0</span>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-3 text-zinc-400 text-[11px]">
                        {st.paymentDueDate}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center font-sans">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded font-mono font-bold ${
                          st.status === 'al_dia'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : st.status === 'pago_parcial'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
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
                                className="p-1.5 rounded bg-[#222224] hover:bg-[#28282b] text-[#34d399] transition-colors border border-white/10"
                              >
                                {copiedId === st.id ? <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399]" /> : <MessageSquare className="w-3.5 h-3.5" />}
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
                                className="px-2.5 py-1 rounded bg-[#a5b4fc] hover:bg-[#c7d2fe] text-[#111113] text-[11px] font-mono font-bold transition-colors shadow-sm"
                              >
                                Cobrar
                              </button>
                            </>
                          )}
                          {isPaid && (
                            <span className="text-[11px] text-[#34d399] flex items-center gap-1 font-mono font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#34d399]" />
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
