import React, { useState, useMemo } from 'react';
import {
  Users,
  FileCheck,
  HeartPulse,
  PenTool,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Receipt,
  CreditCard,
  X,
  Search,
  Filter,
  DollarSign
} from 'lucide-react';
import {
  Operation,
  OperationPassenger,
  StudentPayer,
  PaymentQuota,
  CollectionRecord,
  PaymentMethod,
  AccountId
} from '../../types';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/financialCalculations';

interface Props {
  operation: Operation;
}

export const PassengerChecklistGrid: React.FC<Props> = ({ operation }) => {
  const {
    updateOperation,
    accounts,
    recordCollection
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'debt'>('all');

  // Collection modal state (Rule 2: Derivative financial UI)
  const [collectionModalData, setCollectionModalData] = useState<{
    passenger: OperationPassenger | StudentPayer;
    defaultAmount: number;
    quotaConcept: string;
  } | null>(null);

  const [collectionForm, setCollectionForm] = useState<{
    amount: number;
    paymentMethod: PaymentMethod;
    destinationAccountId: AccountId;
    concept: string;
    reference: string;
    notes: string;
  }>({
    amount: 0,
    paymentMethod: 'mercado_pago',
    destinationAccountId: 'mp_mariano',
    concept: 'Cobro de Cuota',
    reference: '',
    notes: ''
  });

  // Passengers list (unify operation.passengers and operation.students)
  const passengersList = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      documentId?: string;
      parentName?: string;
      parentPhone?: string;
      totalPrice: number;
      paidAmount: number;
      balance: number;
      checklist: {
        docComplete: boolean;
        authSigned: boolean;
        medicalForm: boolean;
        dietaryRestrictions?: string;
      };
      status: 'al_dia' | 'pago_parcial' | 'pendiente';
      rawPassenger?: OperationPassenger;
      rawStudent?: StudentPayer;
    }> = [];

    // If operation has students
    if (operation.students && operation.students.length > 0) {
      operation.students.forEach(st => {
        const expected = st.expectedAmount || 0;
        const paid = st.paidAmount || 0;
        const balance = Math.max(0, expected - paid);
        const isPaid = paid >= expected && expected > 0;
        const isPartial = paid > 0 && !isPaid;

        // Check if there's passenger checklist
        const passMatch = (operation.passengers || []).find(
          p => p.id === st.id || p.documentId === st.studentDni || p.name.toLowerCase() === st.studentName.toLowerCase()
        );

        list.push({
          id: st.id,
          name: st.studentName,
          documentId: st.studentDni || passMatch?.documentId,
          parentName: st.payerName || passMatch?.parentName,
          parentPhone: st.payerPhone || passMatch?.parentPhone,
          totalPrice: expected,
          paidAmount: paid,
          balance,
          checklist: {
            docComplete: passMatch?.checklist?.docComplete ?? false,
            authSigned: passMatch?.checklist?.authSigned ?? false,
            medicalForm: passMatch?.checklist?.medicalForm ?? false,
            dietaryRestrictions: passMatch?.dietaryRestrictions
          },
          status: isPaid ? 'al_dia' : isPartial ? 'pago_parcial' : 'pendiente',
          rawStudent: st,
          rawPassenger: passMatch
        });
      });
    } else if (operation.passengers && operation.passengers.length > 0) {
      operation.passengers.forEach(p => {
        const price = p.totalPrice || (operation.expectedRevenue / (operation.passengerCount || 1));
        // Calculate paid from collections
        const passengerCols = (operation.collections || []).filter(
          c => c.clientName.toLowerCase() === p.name.toLowerCase() || (p.documentId && c.clientName.includes(p.documentId))
        );
        const paid = passengerCols.reduce((sum, c) => sum + c.amount, 0);
        const balance = Math.max(0, price - paid);
        const isPaid = paid >= price && price > 0;
        const isPartial = paid > 0 && !isPaid;

        list.push({
          id: p.id,
          name: p.name,
          documentId: p.documentId,
          parentName: p.parentName,
          parentPhone: p.parentPhone,
          totalPrice: price,
          paidAmount: paid,
          balance,
          checklist: {
            docComplete: p.checklist?.docComplete ?? false,
            authSigned: p.checklist?.authSigned ?? false,
            medicalForm: p.checklist?.medicalForm ?? false,
            dietaryRestrictions: p.dietaryRestrictions
          },
          status: isPaid ? 'al_dia' : isPartial ? 'pago_parcial' : 'pendiente',
          rawPassenger: p
        });
      });
    }

    return list;
  }, [operation.students, operation.passengers, operation.collections, operation.expectedRevenue, operation.passengerCount]);

  // Filtered list
  const filteredPassengers = useMemo(() => {
    return passengersList.filter(p => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.documentId && p.documentId.includes(searchTerm)) ||
        (p.parentName && p.parentName.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      if (filterStatus === 'completed') {
        return p.checklist.docComplete && p.checklist.authSigned && p.checklist.medicalForm && p.status === 'al_dia';
      }
      if (filterStatus === 'pending') {
        return !p.checklist.docComplete || !p.checklist.authSigned || !p.checklist.medicalForm;
      }
      if (filterStatus === 'debt') {
        return p.balance > 0;
      }
      return true;
    });
  }, [passengersList, searchTerm, filterStatus]);

  // Toggle Operative Checklist (Rule: Allow direct modification for purely operative checks)
  const handleToggleOperativeCheck = (
    passengerId: string,
    field: 'docComplete' | 'authSigned' | 'medicalForm'
  ) => {
    // 1. Update passengers in operation
    const currentPassengers = operation.passengers || [];
    let updatedPassengers: OperationPassenger[];

    const exists = currentPassengers.some(p => p.id === passengerId);
    if (exists) {
      updatedPassengers = currentPassengers.map(p => {
        if (p.id !== passengerId) return p;
        const currentChecklist = p.checklist || { docComplete: false, authSigned: false, medicalForm: false };
        return {
          ...p,
          checklist: {
            ...currentChecklist,
            [field]: !currentChecklist[field]
          }
        };
      });
    } else {
      // Create passenger record if it only existed in students
      const st = (operation.students || []).find(s => s.id === passengerId);
      const newPassenger: OperationPassenger = {
        id: passengerId,
        name: st ? st.studentName : 'Pasajero',
        documentId: st?.studentDni,
        parentName: st?.payerName,
        parentPhone: st?.payerPhone,
        totalPrice: st?.expectedAmount,
        checklist: {
          docComplete: field === 'docComplete',
          authSigned: field === 'authSigned',
          medicalForm: field === 'medicalForm'
        }
      };
      updatedPassengers = [...currentPassengers, newPassenger];
    }

    updateOperation(operation.id, { passengers: updatedPassengers });
  };

  // Open Collection Modal (Rule 2: Traceable accounting action)
  const handleOpenCollectionModal = (p: typeof passengersList[0]) => {
    setCollectionModalData({
      passenger: (p.rawPassenger || p.rawStudent) as any,
      defaultAmount: p.balance > 0 ? p.balance : p.totalPrice,
      quotaConcept: p.paidAmount === 0 ? 'Seña / Cuota 1' : 'Saldo de Viaje'
    });
    setCollectionForm({
      amount: p.balance > 0 ? p.balance : p.totalPrice,
      paymentMethod: 'mercado_pago',
      destinationAccountId: 'mp_mariano',
      concept: `Cobro Cuota - ${p.name}`,
      reference: '',
      notes: `Acreditación de ${p.name} (${operation.code})`
    });
  };

  // Confirm Formal Collection Record
  const handleConfirmCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectionModalData || collectionForm.amount <= 0) {
      alert('Ingrese un monto válido.');
      return;
    }

    // Record formal collection
    recordCollection({
      operationId: operation.id,
      clientName: collectionModalData.passenger.name || (collectionModalData.passenger as any).studentName,
      concept: collectionForm.concept,
      amount: collectionForm.amount,
      currency: operation.currency,
      paymentMethod: collectionForm.paymentMethod,
      destinationAccountId: collectionForm.destinationAccountId,
      notes: collectionForm.notes,
      voucherOrReference: collectionForm.reference
    });

    // Also update student if present
    if (operation.students) {
      const studentId = collectionModalData.passenger.id;
      const st = operation.students.find(s => s.id === studentId);
      if (st) {
        const nextPaid = (st.paidAmount || 0) + collectionForm.amount;
        const isFullyPaid = nextPaid >= st.expectedAmount;
        const isPartial = nextPaid > 0 && !isFullyPaid;
        const status = isFullyPaid ? 'al_dia' : isPartial ? 'pago_parcial' : 'pendiente';

        const updatedStudents = operation.students.map(s => {
          if (s.id !== studentId) return s;
          return {
            ...s,
            paidAmount: nextPaid,
            status: status as any,
            lastPaymentDate: new Date().toISOString().split('T')[0]
          };
        });

        const newReceived = updatedStudents.reduce((sum, s) => sum + s.paidAmount, 0);
        updateOperation(operation.id, {
          students: updatedStudents,
          receivedRevenue: newReceived
        });
      }
    }

    setCollectionModalData(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Checklist Individual de Alumnos & Pasajeros
          </h3>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            Control de documentación, autorizaciones notariales, ficha médica y grilla financiera de cuotas con trazabilidad contable.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por alumno, DNI o tutor..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#111113] border border-[#27272a] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#111113] p-1 rounded-lg border border-[#27272a]">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                filterStatus === 'all' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todos ({passengersList.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('pending')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                filterStatus === 'pending' ? 'bg-amber-900/60 text-amber-200 border border-amber-700/60' : 'text-zinc-400 hover:text-amber-300'
              }`}
            >
              Doc. Pendiente
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('debt')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                filterStatus === 'debt' ? 'bg-rose-900/60 text-rose-200 border border-rose-700/60' : 'text-zinc-400 hover:text-rose-300'
              }`}
            >
              Con Saldo
            </button>
          </div>
        </div>
      </div>

      {/* Passengers Table */}
      {passengersList.length === 0 ? (
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-10 text-center space-y-3">
          <Users className="w-10 h-10 text-zinc-600 mx-auto" />
          <h4 className="text-base font-semibold text-white">No hay alumnos o pasajeros cargados en este File</h4>
          <p className="text-xs text-[#a1a1aa] max-w-md mx-auto">
            Utilice la función de importación masiva de alumnos o agregue pasajeros en la sección correspondiente.
          </p>
        </div>
      ) : (
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#a1a1aa]">
              <thead className="bg-[#202024] text-zinc-300 uppercase tracking-wider font-semibold border-b border-[#27272a]">
                <tr>
                  <th className="py-3 px-4">Alumno / Pasajero</th>
                  <th className="py-3 px-4">Tutor & Contacto</th>
                  <th className="py-3 px-3 text-center">Doc / DNI</th>
                  <th className="py-3 px-3 text-center">Autorización</th>
                  <th className="py-3 px-3 text-center">Ficha Médica</th>
                  <th className="py-3 px-3 text-right">Precio Total</th>
                  <th className="py-3 px-3 text-right">Pagado</th>
                  <th className="py-3 px-3 text-right">Saldo</th>
                  <th className="py-3 px-3 text-center">Estado Financiero</th>
                  <th className="py-3 px-3 text-center w-24">Cobranza</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {filteredPassengers.map(p => {
                  return (
                    <tr key={p.id} className="hover:bg-[#202024]/50 transition-colors">
                      {/* Alumno */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{p.name}</div>
                        {p.documentId && (
                          <span className="text-[11px] text-zinc-400 font-mono">DNI: {p.documentId}</span>
                        )}
                        {p.checklist.dietaryRestrictions && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-medium block mt-0.5 w-max">
                            {p.checklist.dietaryRestrictions}
                          </span>
                        )}
                      </td>

                      {/* Tutor & Contacto */}
                      <td className="py-3 px-4">
                        {p.parentName ? (
                          <>
                            <div className="text-zinc-200">{p.parentName}</div>
                            {p.parentPhone && (
                              <div className="text-[11px] text-indigo-300 font-mono">{p.parentPhone}</div>
                            )}
                          </>
                        ) : (
                          <span className="text-zinc-500 italic">No informado</span>
                        )}
                      </td>

                      {/* Check Documento */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleOperativeCheck(p.id, 'docComplete')}
                          className={`p-1.5 rounded-lg border transition-all ${
                            p.checklist.docComplete
                              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-400 hover:bg-emerald-900'
                              : 'bg-[#111113] border-zinc-700 text-zinc-600 hover:text-zinc-400 hover:border-zinc-500'
                          }`}
                          title={p.checklist.docComplete ? 'Documento presentado (Click para desmarcar)' : 'Marcar Documento Presentado'}
                        >
                          <FileCheck className="w-4 h-4" />
                        </button>
                      </td>

                      {/* Check Autorización */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleOperativeCheck(p.id, 'authSigned')}
                          className={`p-1.5 rounded-lg border transition-all ${
                            p.checklist.authSigned
                              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-400 hover:bg-emerald-900'
                              : 'bg-[#111113] border-zinc-700 text-zinc-600 hover:text-zinc-400 hover:border-zinc-500'
                          }`}
                          title={p.checklist.authSigned ? 'Autorización firmada (Click para desmarcar)' : 'Marcar Autorización Firmada'}
                        >
                          <PenTool className="w-4 h-4" />
                        </button>
                      </td>

                      {/* Check Ficha Médica */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleOperativeCheck(p.id, 'medicalForm')}
                          className={`p-1.5 rounded-lg border transition-all ${
                            p.checklist.medicalForm
                              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-400 hover:bg-emerald-900'
                              : 'bg-[#111113] border-zinc-700 text-zinc-600 hover:text-zinc-400 hover:border-zinc-500'
                          }`}
                          title={p.checklist.medicalForm ? 'Ficha médica completa (Click para desmarcar)' : 'Marcar Ficha Médica Completa'}
                        >
                          <HeartPulse className="w-4 h-4" />
                        </button>
                      </td>

                      {/* Precio Total */}
                      <td className="py-3 px-3 text-right font-mono font-medium text-white">
                        {formatCurrency(p.totalPrice, operation.currency)}
                      </td>

                      {/* Pagado */}
                      <td className="py-3 px-3 text-right font-mono text-emerald-400 font-medium">
                        {formatCurrency(p.paidAmount, operation.currency)}
                      </td>

                      {/* Saldo */}
                      <td className="py-3 px-3 text-right font-mono">
                        {p.balance > 0 ? (
                          <span className="text-amber-400 font-bold">
                            {formatCurrency(p.balance, operation.currency)}
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-medium flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Al día
                          </span>
                        )}
                      </td>

                      {/* Estado Financiero Derivado */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            p.status === 'al_dia'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : p.status === 'pago_parcial'
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : 'bg-rose-950 text-rose-300 border-rose-800'
                          }`}
                        >
                          {p.status === 'al_dia' && <CheckCircle2 className="w-3 h-3" />}
                          {p.status === 'pago_parcial' && <Clock className="w-3 h-3" />}
                          {p.status === 'pendiente' && <AlertCircle className="w-3 h-3" />}
                          {p.status === 'al_dia' ? 'Pagado 100%' : p.status === 'pago_parcial' ? 'Pago Parcial' : 'Impago'}
                        </span>
                      </td>

                      {/* Cobranza Inteligente (Rule 2) */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenCollectionModal(p)}
                          className="px-2.5 py-1 rounded bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 text-xs font-semibold flex items-center gap-1 mx-auto transition-colors"
                          title="Registrar Cobranza Contable"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          Cobrar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FORMAL COLLECTION MODAL (Rule 2: Derivative UI, Traceable action) */}
      {collectionModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-[#202024] border-b border-[#27272a] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Registrar Cobranza de Alumno / Pasajero</h3>
              </div>
              <button
                type="button"
                onClick={() => setCollectionModalData(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCollection} className="p-6 space-y-4">
              <div className="bg-[#111113] p-3.5 rounded-xl border border-[#27272a] space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#a1a1aa]">Alumno / Pasajero:</span>
                  <span className="font-semibold text-white">
                    {collectionModalData.passenger.name || (collectionModalData.passenger as any).studentName}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#a1a1aa]">Operación:</span>
                  <span className="font-mono text-indigo-300">{operation.code} - {operation.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#a1a1aa]">Saldo Pendiente:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {formatCurrency(collectionModalData.defaultAmount, operation.currency)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a1a1aa] mb-1">
                  Monto a Cobrar ({operation.currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={collectionForm.amount}
                  onChange={e => setCollectionForm({ ...collectionForm, amount: Number(e.target.value) })}
                  className="w-full bg-[#111113] border border-[#27272a] rounded-xl px-4 py-2.5 text-sm text-white font-mono font-bold focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#a1a1aa] mb-1">Medio de Pago *</label>
                  <select
                    value={collectionForm.paymentMethod}
                    onChange={e => setCollectionForm({ ...collectionForm, paymentMethod: e.target.value as any })}
                    className="w-full bg-[#111113] border border-[#27272a] rounded-xl px-3 py-2.5 text-xs text-white"
                  >
                    <option value="mercado_pago">Mercado Pago / Link / QR</option>
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="paypal">PayPal</option>
                    <option value="wetravel">WeTravel</option>
                    <option value="tarjeta">Tarjeta de Crédito/Débito</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#a1a1aa] mb-1">Cuenta Destino (Acreditación) *</label>
                  <select
                    value={collectionForm.destinationAccountId}
                    onChange={e => setCollectionForm({ ...collectionForm, destinationAccountId: e.target.value })}
                    className="w-full bg-[#111113] border border-[#27272a] rounded-xl px-3 py-2.5 text-xs text-white"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.currency})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a1a1aa] mb-1">N° Comprobante / Transacción</label>
                <input
                  type="text"
                  placeholder="Ej. MP-OP-8849201"
                  value={collectionForm.reference}
                  onChange={e => setCollectionForm({ ...collectionForm, reference: e.target.value })}
                  className="w-full bg-[#111113] border border-[#27272a] rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a1a1aa] mb-1">Concepto</label>
                <input
                  type="text"
                  value={collectionForm.concept}
                  onChange={e => setCollectionForm({ ...collectionForm, concept: e.target.value })}
                  className="w-full bg-[#111113] border border-[#27272a] rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setCollectionModalData(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#202024] hover:bg-[#27272a] text-zinc-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-950"
                >
                  Confirmar y Acreditar en Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
