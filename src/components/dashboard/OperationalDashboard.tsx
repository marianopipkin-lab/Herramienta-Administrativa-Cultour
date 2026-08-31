import React, { useState, useMemo } from 'react';
import {
  Compass,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Bus,
  UserCheck,
  Ticket,
  ShieldCheck,
  Send,
  Search,
  Filter,
  ArrowUpRight,
  Sparkles,
  MapPin,
  Eye,
  Plus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Operation, BusinessUnit } from '../../types';

export const OperationalDashboard: React.FC = () => {
  const {
    operations,
    setSelectedOperationId,
    setIsNewOpModalOpen,
    setActiveTab,
    currentRole
  } = useApp();

  const [filterUnit, setFilterUnit] = useState<'all' | BusinessUnit>('all');
  const [filterTimeframe, setFilterTimeframe] = useState<'all' | 'today' | 'next_7' | 'this_month'>('next_7');
  const [searchTerm, setSearchTerm] = useState('');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Filter operations for operational tracking
  const filteredOps = useMemo(() => {
    return operations.filter(op => {
      if (filterUnit !== 'all' && op.businessUnit !== filterUnit) return false;

      // Timeframe logic
      if (filterTimeframe === 'today') {
        if (op.date !== todayStr) return false;
      } else if (filterTimeframe === 'next_7') {
        const opDate = new Date(op.date);
        const today = new Date();
        const diffDays = Math.ceil((opDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0 || diffDays > 7) return false;
      } else if (filterTimeframe === 'this_month') {
        const opMonth = op.date.substring(0, 7);
        const currentMonth = todayStr.substring(0, 7);
        if (opMonth !== currentMonth) return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchCode = op.code.toLowerCase().includes(term);
        const matchName = op.name.toLowerCase().includes(term);
        const matchClient = op.clientOrSchool.toLowerCase().includes(term);
        const matchResp = (op.responsiblePerson || '').toLowerCase().includes(term);
        const matchDest = (op.destination || '').toLowerCase().includes(term);
        if (!matchCode && !matchName && !matchClient && !matchResp && !matchDest) return false;
      }

      return true;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [operations, filterUnit, filterTimeframe, searchTerm, todayStr]);

  // Operational metrics
  const stats = useMemo(() => {
    const totalOps = operations.filter(o => o.status !== 'cancelada').length;
    const upcomingOps = operations.filter(o => o.date >= todayStr && o.status !== 'cancelada');
    const totalPassengers = upcomingOps.reduce((sum, o) => sum + (o.passengerCount || 0), 0);
    const inCourseOps = operations.filter(o => o.status === 'en_curso').length;
    
    // Checklist pending
    let pendingTransports = 0;
    let pendingGuides = 0;
    upcomingOps.forEach(o => {
      if (o.checklist && !o.checklist.transportConfirmed) pendingTransports++;
      if (o.checklist && !o.checklist.guideAssigned) pendingGuides++;
    });

    return {
      totalOps,
      upcomingCount: upcomingOps.length,
      totalPassengers,
      inCourseOps,
      pendingTransports,
      pendingGuides
    };
  }, [operations, todayStr]);

  const getUnitBadge = (unit: Operation['businessUnit']) => {
    switch (unit) {
      case 'receptivo':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#06B6D4]/10 text-[#0891B2] border border-[#06B6D4]/20">RECEPTIVO</span>;
      case 'salidas':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#10B981]/10 text-[#059669] border border-[#10B981]/20">SALIDA ED.</span>;
      case 'viajes':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#4F46E5]/10 text-[#4F46E5] border border-[#4F46E5]/20">VIAJE ED.</span>;
    }
  };

  const getStatusBadge = (status: Operation['status']) => {
    switch (status) {
      case 'confirmada':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">Confirmada</span>;
      case 'en_curso':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold animate-pulse">En Curso</span>;
      case 'realizada':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 text-zinc-600 border border-zinc-200">Realizada</span>;
      case 'presupuesto':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-50 text-amber-700 border border-amber-200">Presupuesto</span>;
      case 'cancelada':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-50 text-rose-700 border border-rose-200">Cancelada</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-[#E5E5E1]">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1A1A1A] leading-[1.15]">
            Dashboard Operativo<br />
            <span className="italic font-normal">Despacho & Logística Diaria</span>
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#666666]">
            <span className="text-[#4F46E5] font-medium font-mono">[ Control en Tiempo Real ]</span>
            <span className="text-[#D0D0CC]">•</span>
            <span>Rol actual: <strong className="text-[#1A1A1A] uppercase font-mono">{currentRole}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNewOpModalOpen(true)}
            className="px-4 py-2 bg-[#1A1A1A] hover:bg-black text-white rounded-lg font-bold text-xs flex items-center gap-2 transition-all shadow-sm font-mono uppercase cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo File / Operación</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] border border-[#E5E5E1] p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#666666] mb-1">
            <span className="text-[11px] font-mono uppercase font-bold text-[#666666]">Próximas Salidas</span>
            <Calendar className="w-4 h-4 text-[#4F46E5]" />
          </div>
          <div className="text-2xl font-mono font-normal text-[#1A1A1A]">{stats.upcomingCount}</div>
          <p className="text-[11px] text-[#888888] font-mono mt-1">Files activos programados</p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5E5E1] p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#666666] mb-1">
            <span className="text-[11px] font-mono uppercase font-bold text-[#666666]">Pasajeros Previstos</span>
            <Users className="w-4 h-4 text-[#059669]" />
          </div>
          <div className="text-2xl font-mono font-normal text-[#059669]">{stats.totalPassengers}</div>
          <p className="text-[11px] text-[#888888] font-mono mt-1">Turistas y alumnos a transportar</p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5E5E1] p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#666666] mb-1">
            <span className="text-[11px] font-mono uppercase font-bold text-[#666666]">En Ejecución</span>
            <Clock className="w-4 h-4 text-[#0891B2]" />
          </div>
          <div className="text-2xl font-mono font-normal text-[#0891B2]">{stats.inCourseOps}</div>
          <p className="text-[11px] text-[#888888] font-mono mt-1">Operaciones ocurriendo hoy</p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E5E5E1] p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-[#666666] mb-1">
            <span className="text-[11px] font-mono uppercase font-bold text-[#666666]">Logística Pendiente</span>
            <AlertTriangle className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="text-2xl font-mono font-normal text-[#D97706]">
            {stats.pendingTransports + stats.pendingGuides}
          </div>
          <p className="text-[11px] text-[#888888] font-mono mt-1">
            {stats.pendingTransports} transp. / {stats.pendingGuides} guías
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E5E5E1] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
          <input
            type="text"
            placeholder="Buscar por código (TR-...), cliente, escuela, guía..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg pl-9 pr-3 py-2 text-xs text-[#1A1A1A] placeholder-[#888888] focus:outline-none focus:border-[#4F46E5] transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex items-center bg-[#F4F4F0] p-1 rounded-lg border border-[#E5E5E1] text-xs">
            <button
              onClick={() => setFilterTimeframe('all')}
              className={`px-3 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                filterTimeframe === 'all' ? 'bg-[#1A1A1A] text-white font-bold shadow-xs' : 'text-[#666666] hover:text-[#1A1A1A]'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterTimeframe('today')}
              className={`px-3 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                filterTimeframe === 'today' ? 'bg-[#1A1A1A] text-white font-bold shadow-xs' : 'text-[#666666] hover:text-[#1A1A1A]'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setFilterTimeframe('next_7')}
              className={`px-3 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                filterTimeframe === 'next_7' ? 'bg-[#1A1A1A] text-white font-bold shadow-xs' : 'text-[#666666] hover:text-[#1A1A1A]'
              }`}
            >
              Próx 7 Días
            </button>
            <button
              onClick={() => setFilterTimeframe('this_month')}
              className={`px-3 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                filterTimeframe === 'this_month' ? 'bg-[#1A1A1A] text-white font-bold shadow-xs' : 'text-[#666666] hover:text-[#1A1A1A]'
              }`}
            >
              Este Mes
            </button>
          </div>

          {/* Unit selector */}
          <div className="flex items-center bg-[#F4F4F0] p-1 rounded-lg border border-[#E5E5E1] text-xs">
            <button
              onClick={() => setFilterUnit('all')}
              className={`px-3 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                filterUnit === 'all' ? 'bg-[#1A1A1A] text-white font-bold shadow-xs' : 'text-[#666666] hover:text-[#1A1A1A]'
              }`}
            >
              Unidades: Todas
            </button>
            <button
              onClick={() => setFilterUnit('receptivo')}
              className={`px-3 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                filterUnit === 'receptivo' ? 'bg-[#06B6D4]/15 text-[#0891B2] font-bold border border-[#06B6D4]/30' : 'text-[#666666] hover:text-[#1A1A1A]'
              }`}
            >
              Receptivo
            </button>
            <button
              onClick={() => setFilterUnit('salidas')}
              className={`px-3 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                filterUnit === 'salidas' ? 'bg-[#10B981]/15 text-[#059669] font-bold border border-[#10B981]/30' : 'text-[#666666] hover:text-[#1A1A1A]'
              }`}
            >
              Salidas
            </button>
            <button
              onClick={() => setFilterUnit('viajes')}
              className={`px-3 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                filterUnit === 'viajes' ? 'bg-[#4F46E5]/15 text-[#4F46E5] font-bold border border-[#4F46E5]/30' : 'text-[#666666] hover:text-[#1A1A1A]'
              }`}
            >
              Viajes
            </button>
          </div>
        </div>
      </div>

      {/* Operational Dispatch Table */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#E5E5E1] overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#E5E5E1] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#4F46E5]" />
            <h3 className="text-sm font-bold text-[#1A1A1A] uppercase font-mono tracking-wide">
              Cronograma & Despacho Logístico
            </h3>
            <span className="text-xs text-[#666666] font-mono">({filteredOps.length} operaciones)</span>
          </div>
          <button
            onClick={() => setActiveTab('operations')}
            className="text-xs text-[#4F46E5] hover:underline flex items-center gap-1 font-medium cursor-pointer"
          >
            <span>Ver todas las operaciones</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E5E1] bg-[#F9F9F7] text-[#666666] font-mono text-[11px] uppercase">
                <th className="py-3 px-4 font-semibold">Fecha / File</th>
                <th className="py-3 px-4 font-semibold">Unidad / Canal</th>
                <th className="py-3 px-4 font-semibold">Servicio / Destino</th>
                <th className="py-3 px-4 font-semibold">Cliente / Pax</th>
                <th className="py-3 px-4 font-semibold">Checklist Logística</th>
                <th className="py-3 px-4 font-semibold">Estado</th>
                <th className="py-3 px-4 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E1]">
              {filteredOps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#888888] font-mono text-xs">
                    No se encontraron operaciones con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredOps.map(op => {
                  const checklist = op.checklist || {
                    transportConfirmed: true,
                    guideAssigned: true,
                    ticketsAcquired: true,
                    insuranceEmitted: true,
                    itinerarySent: true
                  };

                  return (
                    <tr
                      key={op.id}
                      className="hover:bg-[#F4F4F0]/60 transition-colors group cursor-pointer"
                      onClick={() => setSelectedOperationId(op.id)}
                    >
                      {/* Date & Code */}
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-[#1A1A1A]">{op.date}</div>
                        <div className="text-[11px] text-[#4F46E5] font-semibold">{op.code}</div>
                      </td>

                      {/* Unit & Channel */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <div>{getUnitBadge(op.businessUnit)}</div>
                          {op.receptiveChannel && (
                            <span className="text-[10px] font-mono text-[#666666]">
                              Canal: <strong className="text-[#1A1A1A]">{op.receptiveChannel === 'agencia' ? 'Agencia B2B' : 'Directo'}</strong>
                            </span>
                          )}
                          {op.educationalModality && (
                            <span className="text-[10px] font-mono text-[#666666]">
                              Mod.: <strong className="text-[#1A1A1A]">{op.educationalModality === 'salidas' ? 'Salida puntual' : 'Viaje completo'}</strong>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Service & Destination */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#1A1A1A]">{op.name}</div>
                        <div className="text-[11px] text-[#666666] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#888888]" />
                          <span>{op.destination || op.serviceType}</span>
                        </div>
                      </td>

                      {/* Client / Pax */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#1A1A1A]">{op.clientOrSchool}</div>
                        <div className="text-[11px] text-[#666666] font-mono flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.2 rounded bg-[#F4F4F0] text-[#059669] font-bold border border-[#E5E5E1]">
                            {op.passengerCount} pax
                          </span>
                          <span className="text-[#888888]">Resp: {op.responsiblePerson}</span>
                        </div>
                      </td>

                      {/* Checklist Icons */}
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2 text-[#888888]">
                          <span
                            title={checklist.transportConfirmed ? 'Transporte Confirmado' : 'Transporte Pendiente'}
                            className={`p-1 rounded ${checklist.transportConfirmed ? 'text-[#059669] bg-emerald-50' : 'text-[#D97706] bg-amber-50'}`}
                          >
                            <Bus className="w-3.5 h-3.5" />
                          </span>
                          <span
                            title={checklist.guideAssigned ? 'Guía Asignado' : 'Guía Pendiente'}
                            className={`p-1 rounded ${checklist.guideAssigned ? 'text-[#059669] bg-emerald-50' : 'text-[#D97706] bg-amber-50'}`}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </span>
                          <span
                            title={checklist.ticketsAcquired ? 'Entradas Emitidas' : 'Entradas Pendientes'}
                            className={`p-1 rounded ${checklist.ticketsAcquired ? 'text-[#059669] bg-emerald-50' : 'text-[#CCCCCC] bg-zinc-50'}`}
                          >
                            <Ticket className="w-3.5 h-3.5" />
                          </span>
                          <span
                            title={checklist.insuranceEmitted ? 'Seguros al día' : 'Seguro Pendiente'}
                            className={`p-1 rounded ${checklist.insuranceEmitted ? 'text-[#059669] bg-emerald-50' : 'text-[#CCCCCC] bg-zinc-50'}`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {getStatusBadge(op.status)}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOperationId(op.id);
                          }}
                          className="px-2.5 py-1 rounded bg-[#F4F4F0] hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] font-medium transition-colors text-xs flex items-center gap-1 ml-auto font-mono border border-[#E5E5E1] cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver File</span>
                        </button>
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
