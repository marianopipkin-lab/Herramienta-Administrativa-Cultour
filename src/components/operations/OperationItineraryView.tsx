import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  UserCheck,
  DollarSign,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  CheckCircle2,
  ShieldAlert,
  ArrowUpDown,
  CreditCard,
  X,
  FileSpreadsheet
} from 'lucide-react';
import {
  Operation,
  OperationItineraryItem,
  PaymentMethod,
  AccountId
} from '../../types';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/financialCalculations';
import * as XLSX from 'xlsx';

interface Props {
  operation: Operation;
  onOpenSupplierPaymentModal?: (item: OperationItineraryItem) => void;
}

export const OperationItineraryView: React.FC<Props> = ({ operation, onOpenSupplierPaymentModal }) => {
  const { updateOperation, suppliers, accounts, recordSupplierPayment } = useApp();

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [paymentModalItem, setPaymentModalItem] = useState<OperationItineraryItem | null>(null);

  // Supplier payment form inside itinerary
  const [paymentForm, setPaymentForm] = useState<{
    amount: number;
    paymentMethod: PaymentMethod;
    sourceAccountId: AccountId;
    concept: string;
    reference: string;
    notes: string;
  }>({
    amount: 0,
    paymentMethod: 'transferencia',
    sourceAccountId: 'galicia_ars',
    concept: 'Pago Anticipo Itinerario',
    reference: '',
    notes: ''
  });

  // New item form
  const [itemForm, setItemForm] = useState<Omit<OperationItineraryItem, 'id' | 'operationId' | 'balance'>>({
    dayNumber: 1,
    date: operation.date || new Date().toISOString().split('T')[0],
    time: '09:00',
    locationOrActivity: '',
    supplierId: suppliers[0]?.id || '',
    supplierName: suppliers[0]?.name || '',
    serviceCategory: 'Transporte',
    guideOrContact: '',
    totalCost: 0,
    currency: operation.currency || 'ARS',
    depositPaid: 0,
    supplierStatus: 'presupuestado',
    notes: ''
  });

  const itinerary: OperationItineraryItem[] = useMemo(() => {
    return (operation.itinerary || []).sort((a, b) => {
      if (a.dayNumber !== b.dayNumber) return a.dayNumber - b.dayNumber;
      return (a.time || '').localeCompare(b.time || '');
    });
  }, [operation.itinerary]);

  // 15-Day Alert calculation for this operation
  const fifteenDayAlerts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!operation.date) return { isWithin15Days: false, daysLeft: 999, unconfirmed: [], withBalance: [] };

    const opDate = new Date(operation.date + 'T00:00:00');
    const diffMs = opDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const isWithin15Days = daysLeft >= -1 && daysLeft <= 15;
    if (!isWithin15Days) return { isWithin15Days: false, daysLeft, unconfirmed: [], withBalance: [] };

    const unconfirmed = itinerary.filter(
      item => item.supplierStatus !== 'reserva_confirmada' && item.supplierStatus !== 'reconfirmado_48h'
    );
    const withBalance = itinerary.filter(item => item.balance > 0);

    return { isWithin15Days: true, daysLeft, unconfirmed, withBalance };
  }, [operation.date, itinerary]);

  // Handle Save New Item
  const handleSaveItem = () => {
    if (!itemForm.locationOrActivity.trim()) {
      alert('Por favor ingrese el lugar o actividad.');
      return;
    }

    const calculatedBalance = Math.max(0, itemForm.totalCost - itemForm.depositPaid);
    const newItem: OperationItineraryItem = {
      ...itemForm,
      id: `itin_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      operationId: operation.id,
      balance: calculatedBalance
    };

    const updatedItinerary = [...(operation.itinerary || []), newItem];
    updateOperation(operation.id, { itinerary: updatedItinerary });

    setIsAddingItem(false);
    setItemForm({
      dayNumber: 1,
      date: operation.date || new Date().toISOString().split('T')[0],
      time: '09:00',
      locationOrActivity: '',
      supplierId: suppliers[0]?.id || '',
      supplierName: suppliers[0]?.name || '',
      serviceCategory: 'Transporte',
      guideOrContact: '',
      totalCost: 0,
      currency: operation.currency || 'ARS',
      depositPaid: 0,
      supplierStatus: 'presupuestado',
      notes: ''
    });
  };

  // Handle Update Item
  const handleUpdateItem = (id: string, updates: Partial<OperationItineraryItem>) => {
    const updatedItinerary = (operation.itinerary || []).map(item => {
      if (item.id !== id) return item;
      const next = { ...item, ...updates };
      next.balance = Math.max(0, (next.totalCost || 0) - (next.depositPaid || 0));
      return next;
    });
    updateOperation(operation.id, { itinerary: updatedItinerary });
  };

  // Handle Delete Item
  const handleDeleteItem = (id: string) => {
    if (!confirm('¿Eliminar este ítem del itinerario?')) return;
    const updatedItinerary = (operation.itinerary || []).filter(item => item.id !== id);
    updateOperation(operation.id, { itinerary: updatedItinerary });
  };

  // Open Payment Registration Modal (Rule 2: Traceable accounting action)
  const handleOpenPayment = (item: OperationItineraryItem) => {
    setPaymentModalItem(item);
    setPaymentForm({
      amount: item.balance > 0 ? item.balance : item.totalCost,
      paymentMethod: 'transferencia',
      sourceAccountId: 'galicia_ars',
      concept: `Pago ${item.depositPaid === 0 ? 'Anticipo' : 'Saldo'} Itinerario - ${item.locationOrActivity}`,
      reference: '',
      notes: `Día ${item.dayNumber} - ${item.supplierName}`
    });
  };

  // Confirm Financial Payment (Updates Itinerary + Creates SupplierPaymentRecord + FinancialMovement + Account Balance)
  const handleConfirmFinancialPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalItem || paymentForm.amount <= 0) {
      alert('Ingrese un monto válido mayor a 0.');
      return;
    }

    // 1. Record formal supplier payment
    recordSupplierPayment({
      operationId: operation.id,
      supplierId: paymentModalItem.supplierId || 'sup_general',
      supplierName: paymentModalItem.supplierName || 'Proveedor Itinerario',
      concept: paymentForm.concept,
      amount: paymentForm.amount,
      currency: paymentModalItem.currency || operation.currency,
      paymentMethod: paymentForm.paymentMethod,
      sourceAccountId: paymentForm.sourceAccountId,
      notes: paymentForm.notes,
      reference: paymentForm.reference
    });

    // 2. Update deposit paid and balance in the itinerary item
    const newDepositPaid = (paymentModalItem.depositPaid || 0) + paymentForm.amount;
    handleUpdateItem(paymentModalItem.id, {
      depositPaid: newDepositPaid,
      supplierStatus: newDepositPaid >= paymentModalItem.totalCost ? 'reserva_confirmada' : paymentModalItem.supplierStatus
    });

    setPaymentModalItem(null);
  };

  // Export Itinerary to XLSX
  const handleExportXLSX = () => {
    if (itinerary.length === 0) {
      alert('No hay ítems en el itinerario para exportar.');
      return;
    }

    const rows = itinerary.map(item => ({
      'Día': item.dayNumber,
      'Fecha': item.date,
      'Hora': item.time,
      'Actividad_Lugar': item.locationOrActivity,
      'Proveedor': item.supplierName,
      'Categoría': item.serviceCategory || '',
      'Guía_Contacto': item.guideOrContact || '',
      'Costo_Total': item.totalCost,
      'Moneda': item.currency,
      'Anticipo_Pagado': item.depositPaid,
      'Saldo_Pendiente': item.balance,
      'Estado_Proveedor': item.supplierStatus,
      'Notas': item.notes || ''
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, `Itinerario_${operation.code}`);
    XLSX.writeFile(wb, `Itinerario_${operation.code}.xlsx`);
  };

  // Import Itinerary from File
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          alert('El archivo no contiene filas válidas.');
          return;
        }

        const importedItems: OperationItineraryItem[] = data.map((r, idx) => {
          const cost = Number(r.Costo_Total || r.costo_total || r.Costo || 0);
          const paid = Number(r.Anticipo_Pagado || r.pago_reserva || r.Pagado || 0);
          return {
            id: `itin_imp_${Date.now()}_${idx}`,
            operationId: operation.id,
            dayNumber: Number(r.Día || r.dia_numero || r.dia || 1),
            date: String(r.Fecha || r.fecha || operation.date || ''),
            time: String(r.Hora || r.hora || '09:00'),
            locationOrActivity: String(r.Actividad_Lugar || r.lugar_actividad || r.actividad || r.lugar || 'Actividad'),
            supplierName: String(r.Proveedor || r.proveedor_asignado || r.proveedor || ''),
            serviceCategory: String(r.Categoría || r.categoria_servicio || r.categoria || 'Otros'),
            guideOrContact: String(r.Guía_Contacto || r.guia_contacto || r.guia || ''),
            totalCost: cost,
            currency: (r.Moneda || r.moneda || operation.currency || 'ARS') as any,
            depositPaid: paid,
            balance: Math.max(0, cost - paid),
            supplierStatus: (r.Estado_Proveedor || r.estado_proveedor || 'presupuestado') as any,
            notes: String(r.Notas || r.observaciones || '')
          };
        });

        updateOperation(operation.id, {
          itinerary: [...(operation.itinerary || []), ...importedItems]
        });
        alert(`Se importaron exitosamente ${importedItems.length} actividades al itinerario.`);
      } catch (err: any) {
        alert('Error al leer el archivo: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6">
      {/* 15-DAY OPERATIONAL ALERT BANNER (Regla de los 15 días) */}
      {fifteenDayAlerts.isWithin15Days && (fifteenDayAlerts.unconfirmed.length > 0 || fifteenDayAlerts.withBalance.length > 0) && (
        <div className="bg-rose-950/40 border-2 border-rose-600 rounded-xl p-5 shadow-2xl relative overflow-hidden animate-pulse">
          <div className="flex items-start gap-3.5">
            <div className="p-2 bg-rose-600/20 text-rose-400 rounded-lg border border-rose-500/50 mt-0.5">
              <ShieldAlert className="w-7 h-7 text-rose-400" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-base font-black text-rose-200 tracking-wide flex items-center gap-2">
                  <span>ALERTA OPERATIVA CRÍTICA (REGLA DE LOS 15 DÍAS)</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-xs font-black">
                    FALTAN {fifteenDayAlerts.daysLeft} DÍAS
                  </span>
                </h4>
              </div>
              <p className="text-xs text-rose-300/90 mt-1">
                La fecha de salida del File <strong>{operation.code}</strong> es el <strong>{operation.date}</strong>. Existen servicios con reservas sin reconfirmar o saldos pendientes de pago que requieren acción inmediata del equipo de operaciones.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                {fifteenDayAlerts.unconfirmed.length > 0 && (
                  <div className="bg-[#111113]/80 border border-rose-800/80 rounded-lg p-3">
                    <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      {fifteenDayAlerts.unconfirmed.length} Proveedores Sin Confirmación:
                    </span>
                    <ul className="text-xs text-zinc-300 mt-1.5 space-y-1 pl-4 list-disc">
                      {fifteenDayAlerts.unconfirmed.map(u => (
                        <li key={u.id}>
                          <strong>Día {u.dayNumber}:</strong> {u.locationOrActivity} ({u.supplierName || 'Sin asignar'}) - <em>Estado: {u.supplierStatus}</em>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {fifteenDayAlerts.withBalance.length > 0 && (
                  <div className="bg-[#111113]/80 border border-amber-800/80 rounded-lg p-3">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-amber-400" />
                      {fifteenDayAlerts.withBalance.length} Proveedores Con Saldo Pendiente:
                    </span>
                    <ul className="text-xs text-zinc-300 mt-1.5 space-y-1 pl-4 list-disc">
                      {fifteenDayAlerts.withBalance.map(b => (
                        <li key={b.id}>
                          <strong>{b.supplierName}:</strong> Saldo de {formatCurrency(b.balance, b.currency)} (Total: {formatCurrency(b.totalCost, b.currency)})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Toolbar */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            Itinerario Operativo Integrado del File
          </h3>
          <p className="text-xs text-[#a1a1aa] mt-0.5">
            Cronograma cronológico de actividades, prestadores, costos pactados, anticipos y confirmaciones en tiempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Import Button */}
          <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-[#202024] hover:bg-[#27272a] border border-[#27272a] text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors">
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            Importar
            <input
              type="file"
              accept=".xlsx,.csv,.xls"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>

          {/* Export Button */}
          <button
            type="button"
            onClick={handleExportXLSX}
            className="px-3 py-1.5 rounded-lg bg-[#202024] hover:bg-[#27272a] border border-[#27272a] text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Exportar Excel
          </button>

          {/* Add Activity Button */}
          <button
            type="button"
            onClick={() => setIsAddingItem(true)}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-950 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Actividad
          </button>
        </div>
      </div>

      {/* Add New Item Inline Form Modal / Box */}
      {isAddingItem && (
        <div className="bg-[#1c1c21] border border-indigo-900/60 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              Agregar Servicio / Tarea al Itinerario
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingItem(false)}
              className="p-1 text-zinc-400 hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1">N° de Día *</label>
              <input
                type="number"
                min="1"
                value={itemForm.dayNumber}
                onChange={e => setItemForm({ ...itemForm, dayNumber: Number(e.target.value) })}
                className="w-full bg-[#111113] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Fecha *</label>
              <input
                type="date"
                value={itemForm.date}
                onChange={e => setItemForm({ ...itemForm, date: e.target.value })}
                className="w-full bg-[#111113] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Hora *</label>
              <input
                type="time"
                value={itemForm.time}
                onChange={e => setItemForm({ ...itemForm, time: e.target.value })}
                className="w-full bg-[#111113] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Categoría</label>
              <select
                value={itemForm.serviceCategory}
                onChange={e => setItemForm({ ...itemForm, serviceCategory: e.target.value })}
                className="w-full bg-[#111113] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="Transporte">Transporte</option>
                <option value="Alojamiento">Alojamiento</option>
                <option value="Gastronomía">Gastronomía</option>
                <option value="Guías">Guías / Coordinación</option>
                <option value="Entradas">Entradas & Parques</option>
                <option value="Seguros">Seguros</option>
                <option value="Otros">Otros Servicios</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Lugar / Actividad *</label>
              <input
                type="text"
                placeholder="Ej. Salida en Bus hacia Bariloche / City Tour Histórico"
                value={itemForm.locationOrActivity}
                onChange={e => setItemForm({ ...itemForm, locationOrActivity: e.target.value })}
                className="w-full bg-[#111113] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Proveedor Asignado</label>
              <input
                type="text"
                placeholder="Ej. Transportes Andes del Sur SRL"
                value={itemForm.supplierName}
                onChange={e => setItemForm({ ...itemForm, supplierName: e.target.value })}
                className="w-full bg-[#111113] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Guía / Contacto en Sitio</label>
              <input
                type="text"
                placeholder="Ej. Esteban Gómez (+54 9 11...)"
                value={itemForm.guideOrContact}
                onChange={e => setItemForm({ ...itemForm, guideOrContact: e.target.value })}
                className="w-full bg-[#111113] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Costo Total Pactado</label>
              <input
                type="number"
                min="0"
                value={itemForm.totalCost}
                onChange={e => setItemForm({ ...itemForm, totalCost: Number(e.target.value) })}
                className="w-full bg-[#111113] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Anticipo / Reserva Ya Pagada</label>
              <input
                type="number"
                min="0"
                value={itemForm.depositPaid}
                onChange={e => setItemForm({ ...itemForm, depositPaid: Number(e.target.value) })}
                className="w-full bg-[#111113] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#a1a1aa] mb-1">Estado del Proveedor</label>
              <select
                value={itemForm.supplierStatus}
                onChange={e => setItemForm({ ...itemForm, supplierStatus: e.target.value as any })}
                className="w-full bg-[#111113] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="presupuestado">Presupuestado</option>
                <option value="contactado">Contactado</option>
                <option value="reserva_confirmada">Reserva Confirmada</option>
                <option value="reconfirmado_48h">Reconfirmado (48h)</option>
                <option value="pendiente">Pendiente</option>
                <option value="con_problema">Con Problema</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#27272a]">
            <button
              type="button"
              onClick={() => setIsAddingItem(false)}
              className="px-4 py-2 rounded-lg bg-[#202024] hover:bg-[#27272a] text-zinc-300 text-xs font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveItem}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md"
            >
              Guardar en Itinerario
            </button>
          </div>
        </div>
      )}

      {/* Itinerary Chronological Table */}
      {itinerary.length === 0 ? (
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-10 text-center space-y-3">
          <Calendar className="w-10 h-10 text-zinc-600 mx-auto" />
          <h4 className="text-base font-semibold text-white">El Itinerario Operativo está vacío</h4>
          <p className="text-xs text-[#a1a1aa] max-w-md mx-auto">
            Comience cargando las actividades cronológicas del viaje o importe directamente una planilla de itinerario en formato Excel/CSV.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAddingItem(true)}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Agregar Primer Servicio
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#a1a1aa]">
              <thead className="bg-[#202024] text-zinc-300 uppercase tracking-wider font-semibold border-b border-[#27272a]">
                <tr>
                  <th className="py-3 px-3 text-center w-16">Día</th>
                  <th className="py-3 px-3 w-24">Hora</th>
                  <th className="py-3 px-4">Actividad & Lugar</th>
                  <th className="py-3 px-4">Proveedor / Guía</th>
                  <th className="py-3 px-3 text-right">Costo Total</th>
                  <th className="py-3 px-3 text-right">Anticipo</th>
                  <th className="py-3 px-3 text-right">Saldo</th>
                  <th className="py-3 px-3 text-center">Estado Proveedor</th>
                  <th className="py-3 px-3 text-center w-28">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {itinerary.map(item => {
                  const isUnconfirmed = item.supplierStatus !== 'reserva_confirmada' && item.supplierStatus !== 'reconfirmado_48h';
                  const hasPendingBalance = item.balance > 0;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#202024]/60 transition-colors ${
                        fifteenDayAlerts.isWithin15Days && (isUnconfirmed || hasPendingBalance)
                          ? 'bg-rose-950/10'
                          : ''
                      }`}
                    >
                      {/* Día */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2.5 py-1 rounded bg-indigo-950 text-indigo-300 font-black text-xs border border-indigo-800">
                          Día {item.dayNumber}
                        </span>
                      </td>

                      {/* Hora */}
                      <td className="py-3 px-3 font-mono text-zinc-200">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <span>{item.time} hs</span>
                        </div>
                        {item.date && (
                          <span className="text-[10px] text-zinc-500 block">{item.date}</span>
                        )}
                      </td>

                      {/* Actividad */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{item.locationOrActivity}</div>
                        {item.serviceCategory && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium mr-2">
                            {item.serviceCategory}
                          </span>
                        )}
                        {item.notes && (
                          <span className="text-[11px] text-zinc-400 italic block mt-0.5">{item.notes}</span>
                        )}
                      </td>

                      {/* Proveedor / Guía */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-zinc-200 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{item.supplierName || 'Sin asignar'}</span>
                        </div>
                        {item.guideOrContact && (
                          <div className="flex items-center gap-1 text-[11px] text-indigo-300 mt-0.5">
                            <UserCheck className="w-3 h-3" />
                            <span>{item.guideOrContact}</span>
                          </div>
                        )}
                      </td>

                      {/* Costo Total */}
                      <td className="py-3 px-3 text-right font-mono font-medium text-white">
                        {formatCurrency(item.totalCost, item.currency)}
                      </td>

                      {/* Anticipo Pagado */}
                      <td className="py-3 px-3 text-right font-mono text-emerald-400 font-medium">
                        {formatCurrency(item.depositPaid, item.currency)}
                      </td>

                      {/* Saldo Pendiente */}
                      <td className="py-3 px-3 text-right font-mono">
                        {item.balance > 0 ? (
                          <span className="text-amber-400 font-bold">
                            {formatCurrency(item.balance, item.currency)}
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-medium flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Saldado
                          </span>
                        )}
                      </td>

                      {/* Estado del Proveedor */}
                      <td className="py-3 px-3 text-center">
                        <select
                          value={item.supplierStatus}
                          onChange={e => handleUpdateItem(item.id, { supplierStatus: e.target.value as any })}
                          className={`text-xs font-semibold px-2 py-1 rounded border ${
                            item.supplierStatus === 'reconfirmado_48h'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : item.supplierStatus === 'reserva_confirmada'
                              ? 'bg-sky-950 text-sky-300 border-sky-800'
                              : item.supplierStatus === 'con_problema'
                              ? 'bg-rose-950 text-rose-300 border-rose-800'
                              : 'bg-amber-950 text-amber-300 border-amber-800'
                          }`}
                        >
                          <option value="reserva_confirmada">Reserva Confirmada</option>
                          <option value="reconfirmado_48h">Reconfirmado 48h</option>
                          <option value="presupuestado">Presupuestado</option>
                          <option value="contactado">Contactado</option>
                          <option value="pendiente">Pendiente</option>
                          <option value="con_problema">Con Problema</option>
                        </select>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Financial payment button (Rule 2: Opens formal payment popup) */}
                          <button
                            type="button"
                            onClick={() => handleOpenPayment(item)}
                            className="p-1.5 rounded hover:bg-emerald-950/60 text-emerald-400 hover:text-emerald-300 border border-emerald-900/60 transition-colors"
                            title="Registrar Pago Contable de Anticipo o Saldo"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 rounded hover:bg-rose-950/60 text-zinc-500 hover:text-rose-400 transition-colors"
                            title="Eliminar ítem"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FINANCIAL SUPPLIER PAYMENT MODAL (Rule 2: Derivative UI, Traceable action) */}
      {paymentModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-[#202024] border-b border-[#27272a] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Registrar Pago a Proveedor (Itinerario)</h3>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalItem(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmFinancialPayment} className="p-6 space-y-4">
              <div className="bg-[#111113] p-3.5 rounded-xl border border-[#27272a] space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#a1a1aa]">Servicio:</span>
                  <span className="font-semibold text-white">{paymentModalItem.locationOrActivity}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#a1a1aa]">Proveedor:</span>
                  <span className="font-semibold text-indigo-300">{paymentModalItem.supplierName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#a1a1aa]">Costo Total:</span>
                  <span className="font-mono text-white">{formatCurrency(paymentModalItem.totalCost, paymentModalItem.currency)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#a1a1aa]">Saldo Restante:</span>
                  <span className="font-mono font-bold text-amber-400">{formatCurrency(paymentModalItem.balance, paymentModalItem.currency)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a1a1aa] mb-1">
                  Monto a Pagar ({paymentModalItem.currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                  className="w-full bg-[#111113] border border-[#27272a] rounded-xl px-4 py-2.5 text-sm text-white font-mono font-bold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#a1a1aa] mb-1">Medio de Pago *</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
                    className="w-full bg-[#111113] border border-[#27272a] rounded-xl px-3 py-2.5 text-xs text-white"
                  >
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="mercado_pago">Mercado Pago / CVU</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="paypal">PayPal</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#a1a1aa] mb-1">Cuenta Origen (Débito) *</label>
                  <select
                    value={paymentForm.sourceAccountId}
                    onChange={e => setPaymentForm({ ...paymentForm, sourceAccountId: e.target.value })}
                    className="w-full bg-[#111113] border border-[#27272a] rounded-xl px-3 py-2.5 text-xs text-white"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.currency} - Saldo: {formatCurrency(acc.currentBalance, acc.currency)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a1a1aa] mb-1">N° Comprobante / Transferencia</label>
                <input
                  type="text"
                  placeholder="Ej. TRANSF-GAL-884129"
                  value={paymentForm.reference}
                  onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  className="w-full bg-[#111113] border border-[#27272a] rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#a1a1aa] mb-1">Concepto / Glosa</label>
                <input
                  type="text"
                  value={paymentForm.concept}
                  onChange={e => setPaymentForm({ ...paymentForm, concept: e.target.value })}
                  className="w-full bg-[#111113] border border-[#27272a] rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#27272a]">
                <button
                  type="button"
                  onClick={() => setPaymentModalItem(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#202024] hover:bg-[#27272a] text-zinc-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950"
                >
                  Confirmar y Debitar de Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
