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

  const getUnitBadge = (unit: BusinessUnit) => {
    switch (unit) {
      case 'receptivo':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">RECEPTIVO</span>;
      case 'salidas':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">SALIDA ED.</span>;
      case 'viajes':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">VIAJE ED.</span>;
    }
  };

  const getStatusBadge = (status: Operation['status']) => {
    switch (status) {
      case 'confirmada':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">Confirmada</span>;
      case 'en_curso':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold animate-pulse">En Curso</span>;
      case 'realizada':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-700/50 text-zinc-300 border border-white/10">Realizada</span>;
      case 'presupuesto':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">Presupuesto</span>;
      case 'cancelada':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">Cancelada</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#18181a] p-5 rounded-xl border border-white/10 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#a5b4fc] bg-[#222224] px-2 py-0.5 rounded border border-white/10">
              Despacho & Logística Diaria
            </span>
            <span className="text-xs text-zinc-400 font-mono">Rol actual: <strong className="text-white uppercase">{currentRole}</strong></span>
          </div>
          <h2 className="text-2xl font-syne font-extrabold text-white tracking-tight">
            Dashboard Operativo Cultour
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Monitoreo en tiempo real de salidas próximas, pasajeros en tránsito, asignación de guías y transportes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewOpModalOpen(true)}
            className="px-3.5 py-2 bg-[#a5b4fc] hover:bg-[#c7d2fe] text-[#111113] rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm font-mono uppercase"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo File / Operación</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#18181a] border border-white/10 p-4 rounded-xl">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-mono uppercase font-bold text-zinc-400">Próximas Salidas</span>
            <Calendar className="w-4 h-4 text-[#a5b4fc]" />
          </div>
          <div className="text-2xl font-syne font-extrabold text-white">{stats.upcomingCount}</div>
          <p className="text-[11px] text-zinc-500 font-mono mt-1">Files activos programados</p>
        </div>

        <div className="bg-[#18181a] border border-white/10 p-4 rounded-xl">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-mono uppercase font-bold text-zinc-400">Pasajeros Previstos</span>
            <Users className="w-4 h-4 text-[#34d399]" />
          </div>
          <div className="text-2xl font-syne font-extrabold text-[#34d399]">{stats.totalPassengers}</div>
          <p className="text-[11px] text-zinc-500 font-mono mt-1">Turistas y alumnos a transportar</p>
        </div>

        <div className="bg-[#18181a] border border-white/10 p-4 rounded-xl">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-mono uppercase font-bold text-zinc-400">En Ejecución</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-syne font-extrabold text-cyan-400">{stats.inCourseOps}</div>
          <p className="text-[11px] text-zinc-500 font-mono mt-1">Operaciones ocurriendo hoy</p>
        </div>

        <div className="bg-[#18181a] border border-white/10 p-4 rounded-xl">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-[11px] font-mono uppercase font-bold text-zinc-400">Logística Pendiente</span>
            <AlertTriangle className="w-4 h-4 text-[#fbbf24]" />
          </div>
          <div className="text-2xl font-syne font-extrabold text-[#fbbf24]">
            {stats.pendingTransports + stats.pendingGuides}
          </div>
          <p className="text-[11px] text-zinc-500 font-mono mt-1">
            {stats.pendingTransports} transp. / {stats.pendingGuides} guías
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#18181a] p-3.5 rounded-xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por código (TR-...), cliente, escuela, guía..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#222224] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#a5b4fc]"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex items-center bg-[#222224] p-1 rounded-lg border border-white/10 text-xs">
            <button
              onClick={() => setFilterTimeframe('all')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                filterTimeframe === 'all' ? 'bg-[#a5b4fc] text-[#111113] font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterTimeframe('today')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                filterTimeframe === 'today' ? 'bg-[#a5b4fc] text-[#111113] font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setFilterTimeframe('next_7')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                filterTimeframe === 'next_7' ? 'bg-[#a5b4fc] text-[#111113] font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Próx 7 Días
            </button>
            <button
              onClick={() => setFilterTimeframe('this_month')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                filterTimeframe === 'this_month' ? 'bg-[#a5b4fc] text-[#111113] font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Este Mes
            </button>
          </div>

          {/* Unit selector */}
          <div className="flex items-center bg-[#222224] p-1 rounded-lg border border-white/10 text-xs">
            <button
              onClick={() => setFilterUnit('all')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                filterUnit === 'all' ? 'bg-[#18181a] text-white font-bold border border-white/10' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Unidades: Todas
            </button>
            <button
              onClick={() => setFilterUnit('receptivo')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                filterUnit === 'receptivo' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Receptivo
            </button>
            <button
              onClick={() => setFilterUnit('salidas')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                filterUnit === 'salidas' ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-800' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Salidas
            </button>
            <button
              onClick={() => setFilterUnit('viajes')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                filterUnit === 'viajes' ? 'bg-indigo-950 text-indigo-300 font-bold border border-indigo-800' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Viajes
            </button>
          </div>
        </div>
      </div>

      {/* Operational Dispatch Table */}
      <div className="bg-[#18181a] rounded-xl border border-white/10 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#a5b4fc]" />
            <h3 className="text-sm font-bold text-white uppercase font-syne tracking-wide">
              Cronograma & Despacho Logístico
            </h3>
            <span className="text-xs text-zinc-400 font-mono">({filteredOps.length} operaciones)</span>
          </div>
          <button
            onClick={() => setActiveTab('operations')}
            className="text-xs text-[#a5b4fc] hover:underline flex items-center gap-1 font-medium"
          >
            <span>Ver todas las operaciones</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#141416] text-zinc-400 font-mono text-[11px] uppercase">
                <th className="py-3 px-4 font-semibold">Fecha / File</th>
                <th className="py-3 px-4 font-semibold">Unidad / Canal</th>
                <th className="py-3 px-4 font-semibold">Servicio / Destino</th>
                <th className="py-3 px-4 font-semibold">Cliente / Pax</th>
                <th className="py-3 px-4 font-semibold">Checklist Logística</th>
                <th className="py-3 px-4 font-semibold">Estado</th>
                <th className="py-3 px-4 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500 font-mono text-xs">
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
                      className="hover:bg-[#222224]/50 transition-colors group cursor-pointer"
                      onClick={() => setSelectedOperationId(op.id)}
                    >
                      {/* Date & Code */}
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-white">{op.date}</div>
                        <div className="text-[11px] text-[#a5b4fc] font-semibold">{op.code}</div>
                      </td>

                      {/* Unit & Channel */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <div>{getUnitBadge(op.businessUnit)}</div>
                          {op.receptiveChannel && (
                            <span className="text-[10px] font-mono text-zinc-400">
                              Canal: <strong className="text-zinc-300">{op.receptiveChannel === 'agencia' ? 'Agencia B2B' : 'Directo'}</strong>
                            </span>
                          )}
                          {op.educationalModality && (
                            <span className="text-[10px] font-mono text-zinc-400">
                              Mod.: <strong className="text-zinc-300">{op.educationalModality === 'salidas' ? 'Salida puntual' : 'Viaje completo'}</strong>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Service & Destination */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-200">{op.name}</div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-zinc-500" />
                          <span>{op.destination || op.serviceType}</span>
                        </div>
                      </td>

                      {/* Client / Pax */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-white">{op.clientOrSchool}</div>
                        <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.2 rounded bg-[#222224] text-[#34d399] font-bold border border-white/5">
                            {op.passengerCount} pax
                          </span>
                          <span className="text-zinc-500">Resp: {op.responsiblePerson}</span>
                        </div>
                      </td>

                      {/* Checklist Icons */}
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2 text-zinc-400">
                          <span
                            title={checklist.transportConfirmed ? 'Transporte Confirmado' : 'Transporte Pendiente'}
                            className={`p-1 rounded ${checklist.transportConfirmed ? 'text-[#34d399] bg-[#34d399]/10' : 'text-[#fbbf24] bg-[#fbbf24]/10'}`}
                          >
                            <Bus className="w-3.5 h-3.5" />
                          </span>
                          <span
                            title={checklist.guideAssigned ? 'Guía Asignado' : 'Guía Pendiente'}
                            className={`p-1 rounded ${checklist.guideAssigned ? 'text-[#34d399] bg-[#34d399]/10' : 'text-[#fbbf24] bg-[#fbbf24]/10'}`}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </span>
                          <span
                            title={checklist.ticketsAcquired ? 'Entradas Emitidas' : 'Entradas Pendientes'}
                            className={`p-1 rounded ${checklist.ticketsAcquired ? 'text-[#34d399] bg-[#34d399]/10' : 'text-zinc-600 bg-white/5'}`}
                          >
                            <Ticket className="w-3.5 h-3.5" />
                          </span>
                          <span
                            title={checklist.insuranceEmitted ? 'Seguros al día' : 'Seguro Pendiente'}
                            className={`p-1 rounded ${checklist.insuranceEmitted ? 'text-[#34d399] bg-[#34d399]/10' : 'text-zinc-600 bg-white/5'}`}
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
                          className="px-2.5 py-1 rounded bg-[#222224] hover:bg-[#a5b4fc] hover:text-[#111113] text-zinc-300 font-medium transition-colors text-xs flex items-center gap-1 ml-auto font-mono"
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
