import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FolderDown,
  Layers,
  Users,
  Compass,
  Building2,
  DollarSign,
  Receipt,
  CreditCard,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import {
  OFFICIAL_TEMPLATES,
  ImportTemplateDefinition,
  TemplateColumn,
  downloadTemplateXLSX,
  downloadTemplateCSV
} from '../../utils/templateDefinitions';
import { useApp } from '../../context/AppContext';

interface Props {
  onOpenImportModal: (categoryKey: string) => void;
}

export const TemplatesCatalogView: React.FC<Props> = ({ onOpenImportModal }) => {
  const { setImportCenterCategory } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'Todas las Plantillas (12)' },
    { id: 'operaciones', label: 'Operaciones & Clientes' },
    { id: 'pasajeros', label: 'Pasajeros & Cuotas' },
    { id: 'proveedores', label: 'Proveedores & Costos' },
    { id: 'finanzas', label: 'Finanzas & Cobranzas' },
    { id: 'conciliacion', label: 'Extractos & Conciliación' }
  ];

  const filteredTemplates = useMemo(() => {
    return OFFICIAL_TEMPLATES.filter(tpl => {
      const matchSearch =
        tpl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tpl.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tpl.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tpl.columns.some(c =>
          c.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.description.toLowerCase().includes(searchTerm.toLowerCase())
        );

      if (!matchSearch) return false;

      if (selectedCategory !== 'all') {
        return tpl.category === selectedCategory;
      }

      return true;
    });
  }, [searchTerm, selectedCategory]);

  const handleDownloadAll = () => {
    OFFICIAL_TEMPLATES.forEach((tpl, idx) => {
      setTimeout(() => {
        downloadTemplateXLSX(tpl);
      }, idx * 250);
    });
  };

  const handleStartImport = (templateId: string) => {
    let catKey = 'operations';
    if (templateId === 'clients') catKey = 'clients';
    else if (templateId === 'operations') catKey = 'operations';
    else if (templateId === 'passengers') catKey = 'students';
    else if (templateId === 'quotas') catKey = 'quotas';
    else if (templateId === 'collections') catKey = 'collections';
    else if (templateId === 'suppliers') catKey = 'suppliers';
    else if (templateId === 'supplier_costs') catKey = 'supplier_costs';
    else if (templateId === 'supplier_payments') catKey = 'supplier_payments';
    else if (templateId === 'mercadopago') catKey = 'movements';
    else if (templateId === 'bank_statements') catKey = 'movements';
    else if (templateId === 'paypal_wetravel') catKey = 'movements';
    else if (templateId === 'itinerary') catKey = 'itinerary';
    else if (templateId === 'fixed_expenses') catKey = 'fixed_expenses';

    if (setImportCenterCategory) {
      setImportCenterCategory(catKey as any);
    }
    onOpenImportModal(catKey);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#18181b] via-[#1f1f26] to-[#18181b] border border-[#27272a] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-xs font-semibold">
              <FileSpreadsheet className="w-4 h-4" />
              SISTEMA OFICIAL DE IMPORTACIÓN CULTOUR
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Catálogo Oficial de Plantillas Excel / CSV
            </h2>
            <p className="text-xs text-[#a1a1aa] max-w-2xl leading-relaxed">
              Descargue las plantillas estandarizadas por proceso operativo y financiero. Cada archivo incluye columnas validadas, ejemplos precargados y reglas de consistencia contable para evitar errores en la importación.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadAll}
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-950 transition-all shrink-0 hover:scale-105 active:scale-95"
          >
            <FolderDown className="w-4 h-4" />
            Descargar Todas las Plantillas (.XLSX)
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#111113] text-zinc-400 hover:text-white hover:bg-[#202024] border border-[#27272a]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por plantilla o columna..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#111113] border border-[#27272a] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTemplates.map(tpl => {
          const isExpanded = expandedTemplateId === tpl.id;
          const requiredCount = tpl.columns.filter(c => c.required).length;
          const optionalCount = tpl.columns.length - requiredCount;

          return (
            <div
              key={tpl.id}
              className="bg-[#18181b] border border-[#27272a] rounded-2xl overflow-hidden shadow-md hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              {/* Card Header */}
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {tpl.category}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">
                    {tpl.columns.length} columnas
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300">
                    {tpl.name}
                  </h3>
                  <p className="text-xs text-[#a1a1aa] mt-1 line-clamp-2">
                    {tpl.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs pt-1">
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {requiredCount} obligatorias
                  </span>
                  <span className="text-zinc-500">
                    {optionalCount} opcionales
                  </span>
                </div>
              </div>

              {/* Column Structure Drawer / Preview if expanded */}
              {isExpanded && (
                <div className="px-5 pb-4 pt-2 bg-[#121214] border-t border-b border-[#27272a] space-y-3 text-xs">
                  <h4 className="font-bold text-zinc-300 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-indigo-400" /> Estructura de Columnas:
                  </h4>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1 divide-y divide-zinc-800">
                    {tpl.columns.map(c => (
                      <div key={c.key} className="pt-2 first:pt-0">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-white text-[11px]">
                            {c.label} ({c.key})
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                              c.required
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {c.required ? 'Obligatoria' : 'Opcional'}
                          </span>
                        </div>
                        <p className="text-zinc-400 text-[11px] mt-0.5">{c.description}</p>
                        {c.example && (
                          <div className="text-[10px] text-indigo-300/80 font-mono mt-0.5">
                            Ejemplo: {String(c.example)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {tpl.instructions && tpl.instructions.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-[#18181b] border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                      <strong className="text-zinc-300 block">Instrucciones de Carga:</strong>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {tpl.instructions.map((inst, i) => (
                          <li key={i}>{inst}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Actions Footer */}
              <div className="p-4 bg-[#141416] border-t border-[#27272a] flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  {/* Download XLSX */}
                  <button
                    type="button"
                    onClick={() => downloadTemplateXLSX(tpl)}
                    className="flex-1 py-2 px-3 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar .XLSX
                  </button>

                  {/* Download CSV */}
                  <button
                    type="button"
                    onClick={() => downloadTemplateCSV(tpl)}
                    className="py-2 px-3 rounded-lg bg-[#202024] hover:bg-[#27272a] border border-[#27272a] text-zinc-300 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                    title="Descargar versión CSV delimitada por comas"
                  >
                    .CSV
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  {/* Toggle structure preview */}
                  <button
                    type="button"
                    onClick={() => setExpandedTemplateId(isExpanded ? null : tpl.id)}
                    className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 py-1"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" /> Ocultar Columnas
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" /> Ver Columnas ({tpl.columns.length})
                      </>
                    )}
                  </button>

                  {/* Direct Import Shortcut */}
                  <button
                    type="button"
                    onClick={() => handleStartImport(tpl.id)}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 py-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Cargar Archivo
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
