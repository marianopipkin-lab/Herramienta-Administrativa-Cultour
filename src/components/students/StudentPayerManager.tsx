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
    const text = `Hola ${student.payerName}, te escribimos desde la agencia respecto al viaje de ${student.studentName} (${selectedTrip?.name}). Les recordamos que el saldo pendiente es de ${formatCurrency(debt)} con vencimiento el ${student.paymentDueDate}. Ante cualquier consulta o para enviar el comprobante de transferencia, estamos a disposición. ¡Muchas gracias!`;
    
    navigator.clipboard.writeText(text);
    setCopiedId(student.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <span>Módulo de Viajes Educativos & Pagadores</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Control nominal de cuotas: Estudiante ↔ Padre/Madre ↔ Viaje ↔ Cobro.
          </p>
        </div>

        {/* Trip Selector Dropdown & Import */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => openImportCenter('students')}
            className="px-3 py-2 rounded-xl bg-white hover:bg-gray-50 text-emerald-700 border border-emerald-200 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Importar Pasajeros</span>
          </button>

          <label className="text-xs text-gray-500 whitespace-nowrap hidden sm:inline">Viaje / Operación:</label>
          <select
            value={selectedTrip?.id || ''}
            onChange={(e) => setSelectedOpId(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 focus:outline-none focus:border-indigo-500"
          >
            {educationalTrips.map(trip => (
              <option key={trip.id} value={trip.id}>
                {trip.name} ({trip.clientOrSchool})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Trip Snapshot Banner */}
      {selectedTrip && (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-gray-900">{selectedTrip.name}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold">
                  {selectedTrip.code}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Colegio: <strong className="text-gray-800">{selectedTrip.clientOrSchool}</strong> • Fecha de viaje: <span className="font-mono text-gray-700">{selectedTrip.date}</span>
              </p>
            </div>

            <button
              onClick={() => setSelectedOperationId(selectedTrip.id)}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Abrir Ficha de la Operación</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* KPI Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Estudiantes</span>
              <span className="text-xl font-bold text-gray-900 font-mono">{tripStats.totalStudents}</span>
              <span className="text-[10px] text-gray-500 block">Inscriptos</span>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Pagaron Total (Al Día)</span>
              <span className="text-xl font-bold text-emerald-700 font-mono">{tripStats.paidStudents}</span>
              <span className="text-[10px] text-emerald-600 block">
                {formatPercent(tripStats.totalStudents > 0 ? (tripStats.paidStudents / tripStats.totalStudents) * 100 : 0)}
              </span>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              <span className="text-[10px] uppercase font-bold text-amber-700 block">Pagos Parciales</span>
              <span className="text-xl font-bold text-amber-700 font-mono">{tripStats.partialStudents}</span>
              <span className="text-[10px] text-amber-600 block">Con saldo pendiente</span>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              <span className="text-[10px] uppercase font-bold text-rose-700 block">Deudores Totales</span>
              <span className="text-xl font-bold text-rose-700 font-mono">{tripStats.debtStudents}</span>
              <span className="text-[10px] text-rose-600 block">Alumnos con deuda</span>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              <span className="text-[10px] uppercase font-bold text-gray-500 block">Cobrado Efectivo</span>
              <span className="text-base font-bold text-emerald-700 font-mono">{formatCurrency(tripStats.totalPaid)}</span>
              <span className="text-[10px] text-gray-400 block">Total en cuentas</span>
            </div>

            <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200">
              <span className="text-[10px] uppercase font-bold text-rose-700 block">Falta Cobrar</span>
              <span className="text-base font-extrabold text-rose-700 font-mono">{formatCurrency(tripStats.totalDebt)}</span>
              <span className="text-[10px] text-rose-600 block">Saldo por recaudar</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
          {/* Search box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar estudiante o pagador..."
              className="w-full bg-white border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'all' ? 'bg-white text-gray-900 shadow-2xs font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Todos ({studentsList.length})
            </button>
            <button
              onClick={() => setStatusFilter('al_dia')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'al_dia' ? 'bg-white text-emerald-700 shadow-2xs font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Al Día ({tripStats.paidStudents})
            </button>
            <button
              onClick={() => setStatusFilter('pago_parcial')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'pago_parcial' ? 'bg-white text-amber-700 shadow-2xs font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Parcial ({tripStats.partialStudents})
            </button>
            <button
              onClick={() => setStatusFilter('sin_pago')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'sin_pago' ? 'bg-white text-rose-700 shadow-2xs font-semibold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sin Pago ({studentsList.filter(s => s.status === 'sin_pago').length})
            </button>
          </div>
        </div>
      </div>

      {/* Nominal Student Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200 text-[10px]">
              <tr>
                <th className="py-3 px-3.5">Estudiante</th>
                <th className="py-3 px-3">Padre / Madre / Pagador</th>
                <th className="py-3 px-3">Contacto</th>
                <th className="py-3 px-3 text-right">Cuota Total</th>
                <th className="py-3 px-3 text-right text-emerald-700">Pagado</th>
                <th className="py-3 px-3 text-right text-rose-700">Saldo Adeudado</th>
                <th className="py-3 px-3">Vencimiento</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-gray-400 font-sans">
                    No se encontraron estudiantes para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => {
                  const debt = Math.max(0, st.expectedAmount - st.paidAmount);
                  const isPaid = st.status === 'al_dia';

                  return (
                    <tr key={st.id} className="hover:bg-gray-50/60 transition-colors">
                      
                      {/* Student Name */}
                      <td className="py-3 px-3.5 font-sans font-bold text-gray-900">
                        {st.studentName}
                      </td>

                      {/* Payer Name */}
                      <td className="py-3 px-3 font-sans text-gray-700 font-medium">
                        {st.payerName}
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-3 font-sans text-gray-500 text-[11px]">
                        {st.payerPhone || '-'}
                      </td>

                      {/* Expected */}
                      <td className="py-3 px-3 text-right text-gray-600">
                        {formatCurrency(st.expectedAmount)}
                      </td>

                      {/* Paid */}
                      <td className="py-3 px-3 text-right text-emerald-700 font-bold">
                        {formatCurrency(st.paidAmount)}
                      </td>

                      {/* Debt */}
                      <td className="py-3 px-3 text-right font-bold">
                        {debt > 0 ? (
                          <span className="text-rose-700">{formatCurrency(debt)}</span>
                        ) : (
                          <span className="text-emerald-700">$ 0</span>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-3 text-gray-500 text-[11px]">
                        {st.paymentDueDate}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center font-sans">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
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
                                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-emerald-700 transition-colors"
                              >
                                {copiedId === st.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <MessageSquare className="w-3.5 h-3.5" />}
                              </button>

                              <button
                                onClick={() => {
                                  const amountStr = prompt(
                                    `Registrar cobro para ${st.studentName} (Saldo adeudado: ${formatCurrency(debt)}):`,
                                    String(debt)
                                  );
                                  if (amountStr) {
                                    const newPaid = st.paidAmount + (parseFloat(amountStr) || 0);
                                    updateStudentPayment(selectedTrip.id, st.id, newPaid);
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold transition-colors shadow-xs"
                              >
                                Cobrar
                              </button>
                            </>
                          )}
                          {isPaid && (
                            <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
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
