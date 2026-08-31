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
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 border-indigo-200',
      desc: 'Nóminas, datos personales, autorizaciones y fichas médicas.'
    },
    {
      id: 'proveedores',
      title: '2. Dimensión Proveedores & Servicios',
      icon: Building2,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50 border-sky-200',
      desc: 'Confirmaciones de buses, hoteles, guías y excursiones.'
    },
    {
      id: 'finanzas',
      title: '3. Dimensión Finanzas & Tesorería',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 border-emerald-200',
      desc: 'Cobranza auditada, anticipos pagados y saldos presupuestados.'
    },
    {
      id: 'operacion',
      title: '4. Dimensión Operación & Logística en Campo',
      icon: Compass,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 border-amber-200',
      desc: 'Itinerario cerrado, choferes habilitados y comunicación al cliente.'
    }
  ];

  const getProgressColor = (pct: number) => {
    if (pct >= 85) return 'bg-emerald-600 text-emerald-700';
    if (pct >= 50) return 'bg-amber-500 text-amber-700';
    return 'bg-rose-600 text-rose-700';
  };

  return (
    <div className="space-y-6">
      {/* Header & Percentage Meter */}
      <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-[#4F46E5]" />
              <h3 className="text-lg font-bold text-[#1A1A1A] font-serif">
                Checklist Contextual de Preparación del File (18 Ítems)
              </h3>
            </div>
            <p className="text-xs text-[#666666] mt-1 max-w-2xl">
              Auditoría operativa y financiera integral. Los ítems marcados como <strong>"No aplica"</strong> se excluyen automáticamente del porcentaje de preparación para reflejar la realidad del servicio.
            </p>
          </div>

          {/* Score Badge */}
          <div className="flex items-center gap-4 bg-[#F9F9F7] border border-[#E5E5E1] px-5 py-3 rounded-xl">
            <div className="text-right">
              <span className="text-xs uppercase tracking-wider font-semibold text-[#666666] block">
                Nivel de Preparación
              </span>
              <span className="text-2xl font-black text-[#1A1A1A] font-mono">
                {score.percentage}%
              </span>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-[#E5E5E1] flex items-center justify-center relative">
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
              <span className="text-xs font-bold text-[#1A1A1A] font-mono">
                {score.completedItems}/{score.applicableItems}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="w-full bg-[#F4F4F0] h-3 rounded-full overflow-hidden flex border border-[#E5E5E1]">
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
          <div className="flex flex-wrap items-center justify-between text-xs text-[#666666] mt-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[#059669] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> {score.completedItems} Completados
              </span>
              <span className="flex items-center gap-1 text-blue-600 font-medium">
                <RefreshCw className="w-3.5 h-3.5" /> {score.inProgressItems} En proceso
              </span>
              <span className="flex items-center gap-1 text-amber-600 font-medium">
                <Clock className="w-3.5 h-3.5" /> {score.pendingItems} Pendientes
              </span>
              {score.problemItems > 0 && (
                <span className="flex items-center gap-1 text-rose-600 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" /> {score.problemItems} Con problema
                </span>
              )}
            </div>
            <span className="text-[#888888] italic">
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
              className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-2xl overflow-hidden shadow-xs"
            >
              {/* Category Header */}
              <div className="px-5 py-3.5 bg-[#F9F9F7] border-b border-[#E5E5E1] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg border ${cat.bgColor}`}>
                    <CatIcon className={`w-4 h-4 ${cat.color}`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1A1A1A] font-serif">{cat.title}</h4>
                    <p className="text-xs text-[#666666]">{cat.desc}</p>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-[#E5E5E1]">
                {items.map(item => {
                  const currentStatus = checklistMap[item.key] || 'pendiente';

                  return (
                    <div
                      key={item.key}
                      className={`p-4 transition-colors ${
                        currentStatus === 'no_aplica'
                          ? 'bg-[#F9F9F7]/70 opacity-60'
                          : currentStatus === 'con_problema'
                          ? 'bg-rose-50/50'
                          : 'hover:bg-[#F9F9F7]/60'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        {/* Description */}
                        <div className="flex-1 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[#1A1A1A]">
                              {item.label}
                            </span>
                            {currentStatus === 'no_aplica' && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
                                No aplica a este File
                              </span>
                            )}
                            {currentStatus === 'con_problema' && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 font-bold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Atención Requerida
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#666666] mt-0.5">
                            {item.description}
                          </p>
                        </div>

                        {/* Status Selectors */}
                        <div className="flex flex-wrap items-center gap-1.5 bg-[#F4F4F0] p-1 rounded-lg border border-[#E5E5E1]">
                          {/* No aplica */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.key, 'no_aplica')}
                            className={`px-2.5 py-1 text-xs font-medium rounded transition-all flex items-center gap-1 cursor-pointer ${
                              currentStatus === 'no_aplica'
                                ? 'bg-[#1A1A1A] text-white shadow-xs'
                                : 'text-[#666666] hover:text-[#1A1A1A] hover:bg-[#FFFFFF]'
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
                            className={`px-2.5 py-1 text-xs font-medium rounded transition-all flex items-center gap-1 cursor-pointer ${
                              currentStatus === 'pendiente'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-xs font-bold'
                                : 'text-[#666666] hover:text-amber-700 hover:bg-[#FFFFFF]'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            Pendiente
                          </button>

                          {/* En proceso */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.key, 'en_proceso')}
                            className={`px-2.5 py-1 text-xs font-medium rounded transition-all flex items-center gap-1 cursor-pointer ${
                              currentStatus === 'en_proceso'
                                ? 'bg-blue-100 text-blue-800 border border-blue-300 shadow-xs font-bold'
                                : 'text-[#666666] hover:text-blue-700 hover:bg-[#FFFFFF]'
                            }`}
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            En proceso
                          </button>

                          {/* Completado */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.key, 'completado')}
                            className={`px-2.5 py-1 text-xs font-medium rounded transition-all flex items-center gap-1 cursor-pointer ${
                              currentStatus === 'completado'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs font-bold'
                                : 'text-[#666666] hover:text-emerald-700 hover:bg-[#FFFFFF]'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Completado
                          </button>

                          {/* Con problema */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.key, 'con_problema')}
                            className={`px-2.5 py-1 text-xs font-medium rounded transition-all flex items-center gap-1 cursor-pointer ${
                              currentStatus === 'con_problema'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300 shadow-xs font-bold'
                                : 'text-[#666666] hover:text-rose-700 hover:bg-[#FFFFFF]'
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
