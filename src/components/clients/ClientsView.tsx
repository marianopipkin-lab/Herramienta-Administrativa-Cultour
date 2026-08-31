import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Building,
  GraduationCap,
  Plane,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  FileText,
  Trash2,
  Edit2,
  DollarSign,
  Download,
  Upload,
  Layers,
  CheckCircle2,
  AlertCircle,
  Percent,
  Compass,
  ArrowUpRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Client, ClientType } from '../../types';
import { formatCurrency } from '../../utils/financialCalculations';

export const ClientsView: React.FC = () => {
  const {
    clients,
    addClient,
    updateClient,
    deleteClient,
    operations,
    openImportCenter,
    setSelectedOperationId,
    currentRole
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | ClientType>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    type: ClientType;
    documentId: string;
    email: string;
    phone: string;
    address: string;
    country: string;
    agencyCommercialName: string;
    agencyContactPerson: string;
    agencyCountry: string;
    commissionRate: number;
    commercialConditions: string;
    paymentTerms: string;
    institutionName: string;
    gradeOrGroup: string;
    parentOrGuardianName: string;
    parentPhone: string;
    parentEmail: string;
    notes: string;
  }>({
    name: '',
    type: 'agencia',
    documentId: '',
    email: '',
    phone: '',
    address: '',
    country: 'Argentina',
    agencyCommercialName: '',
    agencyContactPerson: '',
    agencyCountry: 'Argentina',
    commissionRate: 15,
    commercialConditions: '',
    paymentTerms: '',
    institutionName: '',
    gradeOrGroup: '',
    parentOrGuardianName: '',
    parentPhone: '',
    parentEmail: '',
    notes: ''
  });

  // Calculate client financial relations
  const clientOperationsMap = useMemo(() => {
    const map = new Map<string, { totalOps: number; totalExpected: number; totalReceived: number; ops: typeof operations }>();
    
    operations.forEach(op => {
      // match by clientId, agencyId, or exact name
      const matchedClient = clients.find(
        c => c.id === op.clientId || c.id === op.agencyId || c.name.toLowerCase() === op.clientOrSchool.toLowerCase()
      );
      const key = matchedClient ? matchedClient.id : (op.clientId || op.clientOrSchool.toLowerCase());
      
      const current = map.get(key) || { totalOps: 0, totalExpected: 0, totalReceived: 0, ops: [] };
      current.totalOps += 1;
      current.totalExpected += op.expectedRevenue || 0;
      current.totalReceived += op.receivedRevenue || 0;
      current.ops.push(op);
      map.set(key, current);
    });

    return map;
  }, [operations, clients]);

  // Filtered Clients
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        c.name.toLowerCase().includes(term) ||
        (c.documentId && c.documentId.toLowerCase().includes(term)) ||
        (c.agencyCommercialName && c.agencyCommercialName.toLowerCase().includes(term)) ||
        (c.institutionName && c.institutionName.toLowerCase().includes(term)) ||
        (c.parentOrGuardianName && c.parentOrGuardianName.toLowerCase().includes(term)) ||
        (c.email && c.email.toLowerCase().includes(term));

      const matchesType = selectedType === 'all' || c.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [clients, searchTerm, selectedType]);

  const handleOpenCreate = () => {
    setEditingClientId(null);
    setFormData({
      name: '',
      type: 'agencia',
      documentId: '',
      email: '',
      phone: '',
      address: '',
      country: 'Argentina',
      agencyCommercialName: '',
      agencyContactPerson: '',
      agencyCountry: 'Argentina',
      commissionRate: 15,
      commercialConditions: '',
      paymentTerms: 'Pago total 7 días antes del servicio',
      institutionName: '',
      gradeOrGroup: '',
      parentOrGuardianName: '',
      parentPhone: '',
      parentEmail: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Client) => {
    setEditingClientId(c.id);
    setFormData({
      name: c.name,
      type: c.type,
      documentId: c.documentId || '',
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
      country: c.country || 'Argentina',
      agencyCommercialName: c.agencyCommercialName || '',
      agencyContactPerson: c.agencyContactPerson || '',
      agencyCountry: c.agencyCountry || c.country || 'Argentina',
      commissionRate: c.commissionRate || 0,
      commercialConditions: c.commercialConditions || '',
      paymentTerms: c.paymentTerms || '',
      institutionName: c.institutionName || '',
      gradeOrGroup: c.gradeOrGroup || '',
      parentOrGuardianName: c.parentOrGuardianName || '',
      parentPhone: c.parentPhone || '',
      parentEmail: c.parentEmail || '',
      notes: c.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingClientId) {
      updateClient(editingClientId, formData);
    } else {
      addClient(formData);
    }
    setIsModalOpen(false);
  };

  const getTypeIcon = (type: ClientType) => {
    switch (type) {
      case 'agencia':
        return <Briefcase className="w-4 h-4 text-purple-600" />;
      case 'escuela':
        return <Building className="w-4 h-4 text-emerald-600" />;
      case 'turista':
        return <Plane className="w-4 h-4 text-cyan-600" />;
      case 'alumno':
        return <GraduationCap className="w-4 h-4 text-[#4F46E5]" />;
      case 'empresa':
        return <Briefcase className="w-4 h-4 text-amber-600" />;
      default:
        return <Users className="w-4 h-4 text-[#666666]" />;
    }
  };

  const getTypeBadge = (type: ClientType) => {
    switch (type) {
      case 'agencia':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">Agencia B2B</span>;
      case 'escuela':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Escuela / Colegio</span>;
      case 'turista':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">Turista Directo</span>;
      case 'alumno':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Alumno / Pagador</span>;
      case 'empresa':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">Corporativo</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">General</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-[#E5E5E1]">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1A1A1A] leading-[1.15]">
            Clientes & Agencias B2B<br />
            <span className="italic font-normal">Directorio Comercial Unificado</span>
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#666666]">
            <span className="text-[#4F46E5] font-medium font-mono">[ Maestro Comercial ]</span>
            <span className="text-[#D0D0CC]">•</span>
            <span>Gestión de Agencias, Colegios, Turistas Directos y Pagadores</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openImportCenter('clients')}
            className="px-3.5 py-2 rounded-lg bg-[#FFFFFF] hover:bg-[#F4F4F0] text-[#1A1A1A] border border-[#E5E5E1] text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-[#666666]" />
            <span>Importar Clientes</span>
          </button>

          {currentRole !== 'operativo' && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-lg bg-[#1A1A1A] hover:bg-black text-white text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-sm uppercase tracking-wider cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Cliente / Agencia</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E5E5E1] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Type selection pills */}
        <div className="flex flex-wrap items-center bg-[#F4F4F0] p-1 rounded-lg border border-[#E5E5E1] text-xs gap-1">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
              selectedType === 'all' ? 'bg-[#1A1A1A] text-white shadow-xs' : 'text-[#666666] hover:text-[#1A1A1A]'
            }`}
          >
            Todos ({clients.length})
          </button>
          <button
            onClick={() => setSelectedType('agencia')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
              selectedType === 'agencia' ? 'bg-purple-100 text-purple-800 font-bold border border-purple-300' : 'text-[#666666] hover:text-[#1A1A1A]'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Agencias B2B ({clients.filter(c => c.type === 'agencia').length})</span>
          </button>
          <button
            onClick={() => setSelectedType('escuela')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
              selectedType === 'escuela' ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300' : 'text-[#666666] hover:text-[#1A1A1A]'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Escuelas & Colegios ({clients.filter(c => c.type === 'escuela').length})</span>
          </button>
          <button
            onClick={() => setSelectedType('turista')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
              selectedType === 'turista' ? 'bg-cyan-100 text-cyan-800 font-bold border border-cyan-300' : 'text-[#666666] hover:text-[#1A1A1A]'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Turistas Receptivo ({clients.filter(c => c.type === 'turista').length})</span>
          </button>
          <button
            onClick={() => setSelectedType('alumno')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
              selectedType === 'alumno' ? 'bg-indigo-100 text-indigo-800 font-bold border border-indigo-300' : 'text-[#666666] hover:text-[#1A1A1A]'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Alumnos ({clients.filter(c => c.type === 'alumno').length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
          <input
            type="text"
            placeholder="Buscar por nombre, documento, contacto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg pl-9 pr-3 py-2 text-xs text-[#1A1A1A] placeholder-[#888888] focus:outline-none focus:border-[#4F46E5] transition-colors"
          />
        </div>
      </div>

      {/* Main Clients Grid / Table */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#E5E5E1] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E5E1] bg-[#F9F9F7] text-[#666666] font-mono text-[11px] uppercase">
                <th className="py-3 px-4 font-semibold">Cliente / Razón Social</th>
                <th className="py-3 px-4 font-semibold">Tipo & Categoría</th>
                <th className="py-3 px-4 font-semibold">Contacto & Ubicación</th>
                <th className="py-3 px-4 font-semibold">Condiciones / Comisiones</th>
                <th className="py-3 px-4 font-semibold text-center">Operaciones</th>
                <th className="py-3 px-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E1]">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#888888] font-mono text-xs">
                    No se encontraron clientes con el filtro seleccionado.
                  </td>
                </tr>
              ) : (
                filteredClients.map(c => {
                  const opsData = clientOperationsMap.get(c.id) || { totalOps: 0, totalExpected: 0, totalReceived: 0, ops: [] };

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-[#F4F4F0]/60 transition-colors group cursor-pointer"
                      onClick={() => setSelectedClient(c)}
                    >
                      {/* Name & Doc */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#1A1A1A] flex items-center gap-2">
                          {getTypeIcon(c.type)}
                          <span>{c.name}</span>
                        </div>
                        {c.agencyCommercialName && (
                          <div className="text-[11px] text-purple-700 font-medium mt-0.5">
                            Comercial: {c.agencyCommercialName}
                          </div>
                        )}
                        {c.documentId && (
                          <div className="text-[11px] text-[#666666] font-mono mt-0.5">
                            Doc: {c.documentId}
                          </div>
                        )}
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-4">
                        {getTypeBadge(c.type)}
                        {c.institutionName && (
                          <div className="text-[11px] text-[#666666] mt-1 truncate max-w-xs">
                            Inst: {c.institutionName}
                          </div>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4 text-[#1A1A1A]">
                        {c.email && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <Mail className="w-3 h-3 text-[#888888]" />
                            <span className="font-mono text-[#666666]">{c.email}</span>
                          </div>
                        )}
                        {c.phone && (
                          <div className="flex items-center gap-1 text-[11px] text-[#666666] mt-0.5">
                            <Phone className="w-3 h-3 text-[#888888]" />
                            <span className="font-mono">{c.phone}</span>
                          </div>
                        )}
                        {c.country && (
                          <div className="flex items-center gap-1 text-[11px] text-[#888888] mt-0.5">
                            <MapPin className="w-3 h-3 text-[#888888]" />
                            <span>{c.country}</span>
                          </div>
                        )}
                      </td>

                      {/* Commercial Conditions */}
                      <td className="py-3 px-4">
                        {c.type === 'agencia' ? (
                          <div className="space-y-0.5">
                            {c.commissionRate !== undefined && (
                              <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-mono text-[10px] font-bold border border-purple-200">
                                Comisión: {c.commissionRate}%
                              </span>
                            )}
                            {c.paymentTerms && (
                              <p className="text-[11px] text-[#666666] truncate max-w-xs">{c.paymentTerms}</p>
                            )}
                          </div>
                        ) : c.type === 'alumno' ? (
                          <div className="text-[11px] text-[#666666]">
                            {c.parentOrGuardianName && <div>Tutor: {c.parentOrGuardianName}</div>}
                            {c.gradeOrGroup && <div className="font-mono text-[#888888]">Curso: {c.gradeOrGroup}</div>}
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#888888] font-mono">{c.notes || '-'}</span>
                        )}
                      </td>

                      {/* Associated Operations */}
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-[#F4F4F0] text-[#4F46E5] font-mono font-bold text-xs border border-[#E5E5E1]">
                          {opsData.totalOps} files
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 rounded hover:bg-[#F4F4F0] text-[#666666] hover:text-[#1A1A1A] transition-colors cursor-pointer"
                            title="Editar Cliente"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {currentRole === 'socio' && (
                            <button
                              onClick={() => {
                                if (confirm(`¿Eliminar cliente ${c.name}?`)) {
                                  deleteClient(c.id);
                                }
                              }}
                              className="p-1.5 rounded hover:bg-rose-50 text-[#888888] hover:text-rose-600 transition-colors cursor-pointer"
                              title="Eliminar Cliente"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

      {/* Client Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E5E5E1] pb-3">
              <div className="flex items-center gap-2.5">
                {getTypeIcon(selectedClient.type)}
                <div>
                  <h3 className="text-base font-bold text-[#1A1A1A] font-serif">{selectedClient.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {getTypeBadge(selectedClient.type)}
                    {selectedClient.country && (
                      <span className="text-xs text-[#666666] font-mono">{selectedClient.country}</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="text-[#888888] hover:text-[#1A1A1A] font-mono text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 bg-[#F9F9F7] p-4 rounded-xl border border-[#E5E5E1] text-xs">
              <div>
                <span className="text-[#888888] font-mono uppercase text-[10px] block">Documento / CUIT / ID</span>
                <span className="text-[#1A1A1A] font-mono font-semibold">{selectedClient.documentId || 'No registrado'}</span>
              </div>
              <div>
                <span className="text-[#888888] font-mono uppercase text-[10px] block">Email Principal</span>
                <span className="text-[#1A1A1A] font-mono">{selectedClient.email || 'Sin email'}</span>
              </div>
              <div>
                <span className="text-[#888888] font-mono uppercase text-[10px] block">Teléfono / WhatsApp</span>
                <span className="text-[#1A1A1A] font-mono">{selectedClient.phone || 'Sin teléfono'}</span>
              </div>
              <div>
                <span className="text-[#888888] font-mono uppercase text-[10px] block">Dirección</span>
                <span className="text-[#1A1A1A]">{selectedClient.address || 'No informada'}</span>
              </div>

              {selectedClient.type === 'agencia' && (
                <>
                  <div className="col-span-2 border-t border-[#E5E5E1] pt-2 mt-2">
                    <span className="text-[#4F46E5] font-mono font-bold uppercase text-[10px] block">
                      Condiciones Comerciales B2B
                    </span>
                  </div>
                  <div>
                    <span className="text-[#888888] font-mono uppercase text-[10px] block">Comisión Acordada</span>
                    <span className="text-purple-700 font-mono font-bold">{selectedClient.commissionRate || 0}%</span>
                  </div>
                  <div>
                    <span className="text-[#888888] font-mono uppercase text-[10px] block">Persona de Contacto</span>
                    <span className="text-[#1A1A1A]">{selectedClient.agencyContactPerson || 'Sin contacto directo'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#888888] font-mono uppercase text-[10px] block">Términos de Pago</span>
                    <span className="text-[#666666]">{selectedClient.paymentTerms || 'Estándar'}</span>
                  </div>
                </>
              )}
            </div>

            {/* Associated Operations List */}
            <div>
              <h4 className="text-xs font-bold text-[#1A1A1A] font-mono uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Operaciones / Files Relacionados</span>
                <span className="text-[#666666]">
                  {clientOperationsMap.get(selectedClient.id)?.totalOps || 0} operaciones
                </span>
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(clientOperationsMap.get(selectedClient.id)?.ops || []).map(op => (
                  <div
                    key={op.id}
                    onClick={() => {
                      setSelectedClient(null);
                      setSelectedOperationId(op.id);
                    }}
                    className="p-2.5 bg-[#F9F9F7] hover:bg-[#F4F4F0] rounded-lg border border-[#E5E5E1] flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="font-mono font-bold text-[#4F46E5] text-xs">{op.code}</span>
                      <p className="text-xs text-[#1A1A1A] font-medium">{op.name}</p>
                      <span className="text-[10px] text-[#888888] font-mono">{op.date} • {op.passengerCount} pax</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-xs font-bold text-[#059669]">
                        {formatCurrency(op.receivedRevenue, op.currency)}
                      </span>
                      <span className="text-[10px] text-[#888888] block">
                        / {formatCurrency(op.expectedRevenue, op.currency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#E5E5E1]">
              <button
                onClick={() => setSelectedClient(null)}
                className="px-4 py-1.5 rounded-lg bg-[#F4F4F0] hover:bg-[#E5E5E1] text-[#1A1A1A] text-xs font-mono cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create / Edit Client */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E5E5E1] pb-3">
              <h3 className="text-base font-bold text-[#1A1A1A] font-serif">
                {editingClientId ? 'Editar Cliente / Agencia' : 'Registrar Nuevo Cliente o Agencia'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#888888] hover:text-[#1A1A1A] font-mono text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-mono uppercase text-[#666666] mb-1">
                    Tipo de Cliente
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ClientType })}
                    className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
                  >
                    <option value="agencia">Agencia de Viajes (B2B)</option>
                    <option value="escuela">Escuela / Colegio</option>
                    <option value="turista">Turista Receptivo (Directo)</option>
                    <option value="alumno">Alumno / Tutor Pagador</option>
                    <option value="empresa">Empresa / Corporativo</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-mono uppercase text-[#666666] mb-1">
                    Nombre o Razón Social
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
                    placeholder="Ej: Tangol Viajes / Colegio San Andrés / John Miller"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#666666] mb-1">
                    Documento / CUIT / ID Fiscal
                  </label>
                  <input
                    type="text"
                    value={formData.documentId}
                    onChange={(e) => setFormData({ ...formData, documentId: e.target.value })}
                    className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] font-mono focus:outline-none focus:border-[#4F46E5]"
                    placeholder="30-..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#666666] mb-1">
                    País de Origen
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
                    placeholder="Argentina / Brasil / USA"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#666666] mb-1">
                    Email de Contacto
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
                    placeholder="contacto@..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-[#666666] mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
                    placeholder="+54 11 ..."
                  />
                </div>
              </div>

              {/* Agency specific inputs */}
              {formData.type === 'agencia' && (
                <div className="bg-[#FAF5FF] p-3.5 rounded-xl border border-purple-200 space-y-3">
                  <div className="text-[11px] font-mono font-bold text-purple-700 uppercase">
                    Configuración B2B Agencia
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-[#666666] mb-1">
                        Nombre Comercial
                      </label>
                      <input
                        type="text"
                        value={formData.agencyCommercialName}
                        onChange={(e) => setFormData({ ...formData, agencyCommercialName: e.target.value })}
                        className="w-full bg-[#FFFFFF] border border-purple-200 rounded px-2 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-purple-500"
                        placeholder="Ej: Tangol Tours"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-[#666666] mb-1">
                        Comisión (%)
                      </label>
                      <input
                        type="number"
                        value={formData.commissionRate}
                        onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-[#FFFFFF] border border-purple-200 rounded px-2 py-1.5 text-xs text-[#1A1A1A] font-mono focus:outline-none focus:border-purple-500"
                        placeholder="15"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-mono uppercase text-[#666666] mb-1">
                        Términos de Pago / Liquidación
                      </label>
                      <input
                        type="text"
                        value={formData.paymentTerms}
                        onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                        className="w-full bg-[#FFFFFF] border border-purple-200 rounded px-2 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-purple-500"
                        placeholder="Ej: 100% 7 días antes de la operación"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Student specific inputs */}
              {formData.type === 'alumno' && (
                <div className="bg-[#EEF2FF] p-3.5 rounded-xl border border-indigo-200 space-y-3">
                  <div className="text-[11px] font-mono font-bold text-[#4F46E5] uppercase">
                    Datos del Alumno & Tutor
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-[#666666] mb-1">
                        Colegio / Institución
                      </label>
                      <input
                        type="text"
                        value={formData.institutionName}
                        onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                        className="w-full bg-[#FFFFFF] border border-indigo-200 rounded px-2 py-1.5 text-xs text-[#1A1A1A] focus:outline-none"
                        placeholder="Colegio San Martín"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-[#666666] mb-1">
                        Curso / División
                      </label>
                      <input
                        type="text"
                        value={formData.gradeOrGroup}
                        onChange={(e) => setFormData({ ...formData, gradeOrGroup: e.target.value })}
                        className="w-full bg-[#FFFFFF] border border-indigo-200 rounded px-2 py-1.5 text-xs text-[#1A1A1A] focus:outline-none"
                        placeholder="7mo A"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-mono uppercase text-[#666666] mb-1">
                        Nombre del Padre / Madre / Tutor
                      </label>
                      <input
                        type="text"
                        value={formData.parentOrGuardianName}
                        onChange={(e) => setFormData({ ...formData, parentOrGuardianName: e.target.value })}
                        className="w-full bg-[#FFFFFF] border border-indigo-200 rounded px-2 py-1.5 text-xs text-[#1A1A1A] focus:outline-none"
                        placeholder="Mariano Almada (Padre)"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono uppercase text-[#666666] mb-1">
                  Observaciones Generales
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
                  placeholder="Notas internas..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E5E1]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#F4F4F0] hover:bg-[#E5E5E1] text-[#1A1A1A] text-xs font-mono cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#1A1A1A] hover:bg-black text-white font-bold text-xs font-mono uppercase shadow-sm cursor-pointer"
                >
                  {editingClientId ? 'Guardar Cambios' : 'Crear Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
