import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  MinusCircle,
  RefreshCw,
  Info,
  ShieldCheck,
  Users,
  Building2,
  DollarSign,
  Compass
} from 'lucide-react';
import { Operation, PreparationItemStatus } from '../../types';
import {
  PREPARATION_CHECKLIST_DEFINITIONS,
  calculateOperationPreparationScore
} from '../../utils/checklistDefinitions';
import { useApp } from '../../context/AppContext';

interface Props {
  operation: Operation;
}

export const OperationPreparationChecklistView: React.FC<Props> = ({ operation }) => {
  const { updateOperation } = useApp();
  const checklistMap = operation.preparationChecklist || {};

  const score = calculateOperationPreparationScore(checklistMap);

  const handleStatusChange = (key: string, newStatus: PreparationItemStatus) => {
    const updatedMap = {
      ...checklistMap,
      [key]: newStatus
    };
    updateOperation(operation.id, {
      preparationChecklist: updatedMap
    });
  };

  const categories = [
    {
      id: 'pasajeros',
      title: '1. Dimensión Pasajeros & Documentación',
      icon: Users,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-950/40 border-indigo-800/60',
      desc: 'Nóminas, datos personales, autorizaciones y fichas médicas.'
    },
    {
      id: 'proveedores',
      title: '2. Dimensión Proveedores & Servicios',
      icon: Building2,
      color: 'text-sky-400',
      bgColor: 'bg-sky-950/40 border-sky-800/60',
      desc: 'Confirmaciones de buses, hoteles, guías y excursiones.'
    },
    {
      id: 'finanzas',
      title: '3. Dimensión Finanzas & Tesorería',
      icon: DollarSign,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-950/40 border-emerald-800/60',
      desc: 'Cobranza auditada, anticipos pagados y saldos presupuestados.'
    },
    {
      id: 'operacion',
      title: '4. Dimensión Operación & Logística en Campo',
      icon: Compass,
      color: 'text-amber-400',
      bgColor: 'bg-amber-950/40 border-amber-800/60',
      desc: 'Itinerario cerrado, choferes habilitados y comunicación al cliente.'
    }
  ];

  const getProgressColor = (pct: number) => {
    if (pct >= 85) return 'bg-emerald-500 text-emerald-300';
    if (pct >= 50) return 'bg-amber-500 text-amber-300';
    return 'bg-rose-500 text-rose-300';
  };

  return (
    <div className="space-y-6">
      {/* Header & Percentage Meter */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
              <h3 className="text-lg font-bold text-white">
                Checklist Contextual de Preparación del File (18 Ítems)
              </h3>
            </div>
            <p className="text-xs text-[#a1a1aa] mt-1 max-w-2xl">
              Auditoría operativa y financiera integral. Los ítems marcados como <strong>"No aplica"</strong> se excluyen automáticamente del porcentaje de preparación para reflejar la realidad del servicio.
            </p>
          </div>

          {/* Score Badge */}
          <div className="flex items-center gap-4 bg-[#111113] border border-[#27272a] px-5 py-3 rounded-xl">
            <div className="text-right">
              <span className="text-xs uppercase tracking-wider font-semibold text-[#a1a1aa] block">
                Nivel de Preparación
              </span>
              <span className="text-2xl font-black text-white">
                {score.percentage}%
              </span>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-[#27272a] flex items-center justify-center relative">
              <div
                className={`absolute inset-0 rounded-full border-4 ${
                  score.percentage >= 85
                    ? 'border-emerald-500'
                    : score.percentage >= 50
                    ? 'border-amber-500'
                    : 'border-rose-500'
                }`}
                style={{
                  clipPath: `polygon(0 0, 100% 0, 100% ${score.percentage}%, 0 ${score.percentage}%)`
                }}
              />
              <span className="text-xs font-bold text-white">
                {score.completedItems}/{score.applicableItems}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="w-full bg-[#27272a] h-3 rounded-full overflow-hidden flex">
            <div
              className={`h-full transition-all duration-500 ${
                score.percentage >= 85
                  ? 'bg-emerald-500'
                  : score.percentage >= 50
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${score.percentage}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between text-xs text-[#a1a1aa] mt-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> {score.completedItems} Completados
              </span>
              <span className="flex items-center gap-1 text-blue-400">
                <RefreshCw className="w-3.5 h-3.5" /> {score.inProgressItems} En proceso
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <Clock className="w-3.5 h-3.5" /> {score.pendingItems} Pendientes
              </span>
              {score.problemItems > 0 && (
                <span className="flex items-center gap-1 text-rose-400 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" /> {score.problemItems} Con problema
                </span>
              )}
            </div>
            <span className="text-zinc-400 italic">
              {score.totalItems - score.applicableItems} ítems marcados como no aplicables (excluidos)
            </span>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="space-y-6">
        {categories.map(cat => {
          const items = PREPARATION_CHECKLIST_DEFINITIONS.filter(def => def.category === cat.id);
          const CatIcon = cat.icon;

          return (
            <div
              key={cat.id}
              className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden shadow-sm"
            >
              {/* Category Header */}
              <div className="px-5 py-3.5 bg-[#202024] border-b border-[#27272a] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${cat.bgColor}`}>
                    <CatIcon className={`w-4 h-4 ${cat.color}`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{cat.title}</h4>
                    <p className="text-xs text-[#a1a1aa]">{cat.desc}</p>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-[#27272a]">
                {items.map(item => {
                  const currentStatus = checklistMap[item.key] || 'pendiente';

                  return (
                    <div
                      key={item.key}
                      className={`p-4 transition-colors ${
                        currentStatus === 'no_aplica'
                          ? 'bg-[#141416]/50 opacity-60'
                          : currentStatus === 'con_problema'
                          ? 'bg-rose-950/20'
                          : 'hover:bg-[#202024]/40'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        {/* Description */}
                        <div className="flex-1 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">
                              {item.label}
                            </span>
                            {currentStatus === 'no_aplica' && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium">
                                No aplica a este File
                              </span>
                            )}
                            {currentStatus === 'con_problema' && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Atención Requerida
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#a1a1aa] mt-0.5">
                            {item.description}
                          </p>
                        </div>

                        {/* Status Selectors */}
                        <div className="flex flex-wrap items-center gap-1.5 bg-[#111113] p-1 rounded-lg border border-[#27272a]">
                          {/* No aplica */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.key, 'no_aplica')}
                            className={`px-2.5 py-1 text-xs font-medium rounded transition-all flex items-center gap-1 ${
                              currentStatus === 'no_aplica'
                                ? 'bg-zinc-700 text-white shadow-sm'
                                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                            }`}
                            title="No aplica a esta operación (se excluye del cálculo de avance)"
                          >
                            <MinusCircle className="w-3.5 h-3.5" />
                            No aplica
                          </button>

                          {/* Pendiente */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.key, 'pendiente')}
                            className={`px-2.5 py-1 text-xs font-medium rounded transition-all flex items-center gap-1 ${
                              currentStatus === 'pendiente'
                                ? 'bg-amber-900/60 text-amber-200 border border-amber-700/60 shadow-sm'
                                : 'text-zinc-400 hover:text-amber-300 hover:bg-amber-950/40'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            Pendiente
                          </button>

                          {/* En proceso */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.key, 'en_proceso')}
                            className={`px-2.5 py-1 text-xs font-medium rounded transition-all flex items-center gap-1 ${
                              currentStatus === 'en_proceso'
                                ? 'bg-blue-900/60 text-blue-200 border border-blue-700/60 shadow-sm'
                                : 'text-zinc-400 hover:text-blue-300 hover:bg-blue-950/40'
                            }`}
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            En proceso
                          </button>

                          {/* Completado */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.key, 'completado')}
                            className={`px-2.5 py-1 text-xs font-medium rounded transition-all flex items-center gap-1 ${
                              currentStatus === 'completado'
                                ? 'bg-emerald-900/70 text-emerald-200 border border-emerald-700/60 shadow-sm'
                                : 'text-zinc-400 hover:text-emerald-300 hover:bg-emerald-950/40'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Completado
                          </button>

                          {/* Con problema */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.key, 'con_problema')}
                            className={`px-2.5 py-1 text-xs font-medium rounded transition-all flex items-center gap-1 ${
                              currentStatus === 'con_problema'
                                ? 'bg-rose-900/80 text-rose-200 border border-rose-700 shadow-sm'
                                : 'text-zinc-400 hover:text-rose-300 hover:bg-rose-950/40'
                            }`}
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Problema
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
