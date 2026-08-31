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
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-[#E5E5E1]">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1A1A1A] leading-[1.15]">
            Plantillas Oficiales<br />
            <span className="italic font-normal">Catálogo Excel & CSV</span>
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#666666]">
            <span className="text-[#4F46E5] font-medium font-mono">[ Sistema Oficial de Importación ]</span>
            <span className="text-[#D0D0CC]">•</span>
            <span>Estandarizadas por proceso operativo y financiero con validación previa</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadAll}
            className="px-4 py-2 rounded-lg bg-[#1A1A1A] hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all font-mono uppercase cursor-pointer"
          >
            <FolderDown className="w-4 h-4" />
            <span>Descargar Todas (.XLSX)</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-xs">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#1A1A1A] text-white shadow-xs'
                  : 'bg-[#F4F4F0] text-[#666666] hover:text-[#1A1A1A] hover:bg-[#E5E5E1] border border-[#E5E5E1]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por plantilla o columna..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg pl-9 pr-3 py-2 text-xs text-[#1A1A1A] placeholder-[#888888] focus:border-[#4F46E5] focus:outline-none transition-colors"
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
              className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-2xl overflow-hidden shadow-xs hover:border-[#D0D0CC] transition-all flex flex-col justify-between"
            >
              {/* Card Header */}
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#F4F4F0] text-[#4F46E5] border border-[#E5E5E1] font-mono">
                    {tpl.category}
                  </span>
                  <span className="text-xs text-[#888888] font-mono">
                    {tpl.columns.length} columnas
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#1A1A1A] font-serif">
                    {tpl.name}
                  </h3>
                  <p className="text-xs text-[#666666] mt-1 line-clamp-2">
                    {tpl.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs pt-1">
                  <span className="text-[#059669] font-medium flex items-center gap-1 font-mono text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {requiredCount} obligatorias
                  </span>
                  <span className="text-[#888888] font-mono text-[11px]">
                    {optionalCount} opcionales
                  </span>
                </div>
              </div>

              {/* Column Structure Drawer / Preview if expanded */}
              {isExpanded && (
                <div className="px-5 pb-4 pt-3 bg-[#F9F9F7] border-t border-b border-[#E5E5E1] space-y-3 text-xs">
                  <h4 className="font-bold text-[#1A1A1A] flex items-center gap-1.5 font-mono text-[11px] uppercase">
                    <Info className="w-3.5 h-3.5 text-[#4F46E5]" /> Estructura de Columnas:
                  </h4>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1 divide-y divide-[#E5E5E1]">
                    {tpl.columns.map(c => (
                      <div key={c.key} className="pt-2 first:pt-0">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[#1A1A1A] text-[11px]">
                            {c.label} ({c.key})
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold uppercase ${
                              c.required
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-[#F4F4F0] text-[#666666]'
                            }`}
                          >
                            {c.required ? 'Obligatoria' : 'Opcional'}
                          </span>
                        </div>
                        <p className="text-[#666666] text-[11px] mt-0.5">{c.description}</p>
                        {c.example && (
                          <div className="text-[10px] text-[#4F46E5] font-mono mt-0.5">
                            Ejemplo: {String(c.example)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {tpl.instructions && tpl.instructions.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E5E5E1] text-[11px] text-[#666666] space-y-1">
                      <strong className="text-[#1A1A1A] block font-mono uppercase text-[10px]">Instrucciones de Carga:</strong>
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
              <div className="p-4 bg-[#F9F9F7] border-t border-[#E5E5E1] flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  {/* Download XLSX */}
                  <button
                    type="button"
                    onClick={() => downloadTemplateXLSX(tpl)}
                    className="flex-1 py-2 px-3 rounded-lg bg-[#FFFFFF] hover:bg-[#F4F4F0] border border-[#E5E5E1] text-[#059669] text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar .XLSX
                  </button>

                  {/* Download CSV */}
                  <button
                    type="button"
                    onClick={() => downloadTemplateCSV(tpl)}
                    className="py-2 px-3 rounded-lg bg-[#FFFFFF] hover:bg-[#F4F4F0] border border-[#E5E5E1] text-[#666666] hover:text-[#1A1A1A] text-xs font-mono font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
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
                    className="text-xs text-[#666666] hover:text-[#1A1A1A] flex items-center gap-1 py-1 font-mono cursor-pointer"
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
                    className="text-xs font-mono font-bold text-[#4F46E5] hover:text-indigo-800 flex items-center gap-1 py-1 cursor-pointer"
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
