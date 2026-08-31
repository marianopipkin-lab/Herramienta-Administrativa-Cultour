import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Building,
  Plane,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  FileText,
  Trash2,
  Edit2,
  DollarSign,
  Upload,
  Layers,
  CheckCircle2,
  AlertCircle,
  Percent,
  Calendar,
  ArrowUpRight,
  ExternalLink,
  Wallet,
  Clock,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Client, ClientType, Operation, OperationStatus, Currency } from '../../types';
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
    setActiveTab,
    currentRole
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  // Only three tabs: 'turista' | 'agencia' | 'escuela' (default 'turista')
  const [selectedType, setSelectedType] = useState<'turista' | 'agencia' | 'escuela'>('turista');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  // Form State restricted to the three valid client types
  const [formData, setFormData] = useState<{
    name: string;
    type: 'turista' | 'agencia' | 'escuela';
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
    notes: string;
  }>({
    name: '',
    type: 'turista',
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
    notes: ''
  });

  // Calculate client historical relations and financial aggregates per currency
  const clientOperationsData = useMemo(() => {
    const dataMap = new Map<
      string,
      {
        totalOps: number;
        ops: Operation[];
        invoicedARS: number;
        collectedARS: number;
        pendingARS: number;
        invoicedUSD: number;
        collectedUSD: number;
        pendingUSD: number;
        hasARS: boolean;
        hasUSD: boolean;
      }
    >();

    clients.forEach(c => {
      // Match operations for this client
      const matchedOps = operations.filter(op => {
        // Direct ID links
        if (op.clientId === c.id || op.agencyId === c.id || op.schoolId === c.id) {
          return true;
        }

        // Direct Name match
        const clientNameClean = c.name.trim().toLowerCase();
        const opClientClean = (op.clientOrSchool || '').trim().toLowerCase();
        if (opClientClean && (opClientClean === clientNameClean || opClientClean.includes(clientNameClean) || clientNameClean.includes(opClientClean))) {
          return true;
        }

        // Agency match
        if (c.agencyCommercialName) {
          const commName = c.agencyCommercialName.trim().toLowerCase();
          if (opClientClean && (opClientClean === commName || opClientClean.includes(commName))) {
            return true;
          }
          if (op.agencyName && op.agencyName.trim().toLowerCase() === commName) {
            return true;
          }
        }

        // School match
        if (c.institutionName) {
          const instName = c.institutionName.trim().toLowerCase();
          if (opClientClean && (opClientClean === instName || opClientClean.includes(instName))) {
            return true;
          }
          if (op.schoolName && op.schoolName.trim().toLowerCase() === instName) {
            return true;
          }
        }

        if (op.agencyName && op.agencyName.trim().toLowerCase() === clientNameClean) {
          return true;
        }
        if (op.schoolName && op.schoolName.trim().toLowerCase() === clientNameClean) {
          return true;
        }

        return false;
      });

      // Sort files ordered from newest to oldest by date
      const sortedOps = [...matchedOps].sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        return dateB.localeCompare(dateA);
      });

      let invoicedARS = 0;
      let collectedARS = 0;
      let invoicedUSD = 0;
      let collectedUSD = 0;
      let hasARS = false;
      let hasUSD = false;

      sortedOps.forEach(op => {
        const curr: Currency = op.currency === 'USD' ? 'USD' : 'ARS';
        let opInvoiced = 0;
        let opCollected = 0;

        if ((op.businessUnit === 'salidas' || op.businessUnit === 'viajes' || c.type === 'escuela') && op.students && op.students.length > 0) {
          const nonLiberated = op.students.filter(s => !s.isLiberated);
          opInvoiced = nonLiberated.reduce((sum, s) => sum + (s.expectedAmount || 0), 0);
          opCollected = nonLiberated.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
          if (opInvoiced === 0 && op.expectedRevenue) {
            opInvoiced = op.expectedRevenue;
            opCollected = op.receivedRevenue || 0;
          }
        } else {
          opInvoiced = op.expectedRevenue || 0;
          opCollected = op.receivedRevenue || 0;
        }

        if (curr === 'USD') {
          hasUSD = true;
          invoicedUSD += opInvoiced;
          collectedUSD += opCollected;
        } else {
          hasARS = true;
          invoicedARS += opInvoiced;
          collectedARS += opCollected;
        }
      });

      const pendingARS = Math.max(0, invoicedARS - collectedARS);
      const pendingUSD = Math.max(0, invoicedUSD - collectedUSD);

      dataMap.set(c.id, {
        totalOps: sortedOps.length,
        ops: sortedOps,
        invoicedARS,
        collectedARS,
        pendingARS,
        invoicedUSD,
        collectedUSD,
        pendingUSD,
        hasARS,
        hasUSD
      });
    });

    return dataMap;
  }, [operations, clients]);

  // Filter clients by search and selected tab (Turistas, Agencias B2B, Escuelas & Colegios)
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      // Exclude legacy 'alumno' records as clients
      if ((c.type as string) === 'alumno') return false;

      const matchesType = c.type === selectedType;

      const term不易 = searchTerm.trim().toLowerCase();
      if (!term不易) return matchesType;

      const matchesSearch =
        c.name.toLowerCase().includes(term不易) ||
        (c.documentId && c.documentId.toLowerCase().includes(term不易)) ||
        (c.agencyCommercialName && c.agencyCommercialName.toLowerCase().includes(term不易)) ||
        (c.institutionName && c.institutionName.toLowerCase().includes(term不易)) ||
        (c.email && c.email.toLowerCase().includes(term不易)) ||
        (c.phone && c.phone.toLowerCase().includes(term不易)) ||
        (c.country && c.country.toLowerCase().includes(term不易));

      return matchesType && matchesSearch;
    });
  }, [clients, searchTerm, selectedType]);

  // Counts per tab (excluding 'alumno')
  const counts = useMemo(() => {
    const valid = clients.filter(c => (c.type as string) !== 'alumno');
    return {
      turistas: valid.filter(c => c.type === 'turista').length,
      agencias: valid.filter(c => c.type === 'agencia').length,
      escuelas: valid.filter(c => c.type === 'escuela').length,
      total: valid.length
    };
  }, [clients]);

  const handleOpenCreate = () => {
    setEditingClientId(null);
    setFormData({
      name: '',
      type: selectedType,
      documentId: '',
      email: '',
      phone: '',
      address: '',
      country: selectedType === 'turista' ? 'Brasil' : 'Argentina',
      agencyCommercialName: '',
      agencyContactPerson: '',
      agencyCountry: 'Argentina',
      commissionRate: 15,
      commercialConditions: '',
      paymentTerms: 'Pago total 7 días antes del servicio',
      institutionName: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Client) => {
    setEditingClientId(c.id);
    setFormData({
      name: c.name,
      type: (c.type === 'agencia' || c.type === 'escuela') ? c.type : 'turista',
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

  const getStatusBadge = (status: OperationStatus) => {
    switch (status) {
      case 'confirmada':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Confirmada
          </span>
        );
      case 'en_curso':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
            En Curso
          </span>
        );
      case 'realizada':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Realizada
          </span>
        );
      case 'cancelada':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Cancelada
          </span>
        );
      case 'presupuesto':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-100 text-zinc-700 border border-zinc-300">
            Presupuesto
          </span>
        );
    }
  };

  const getOperationFinancials = (op: Operation, clientType: ClientType) => {
    const curr: Currency = op.currency === 'USD' ? 'USD' : 'ARS';
    let invoiced = 0;
    let collected = 0;

    if ((op.businessUnit === 'salidas' || op.businessUnit === 'viajes' || clientType === 'escuela') && op.students && op.students.length > 0) {
      const nonLiberated = op.students.filter(s => !s.isLiberated);
      invoiced = nonLiberated.reduce((sum, s) => sum + (s.expectedAmount || 0), 0);
      collected = nonLiberated.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
      if (invoiced === 0 && op.expectedRevenue) {
        invoiced = op.expectedRevenue;
        collected = op.receivedRevenue || 0;
      }
    } else {
      invoiced = op.expectedRevenue || 0;
      collected = op.receivedRevenue || 0;
    }

    const pending = Math.max(0, invoiced - collected);
    return { invoiced, collected, pending, currency: curr };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-[#E5E5E1]">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#1A1A1A] leading-[1.15]">
            Clientes & Cuentas Comerciales<br />
            <span className="italic font-normal">Directorio Maestro de Contratantes</span>
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#666666]">
            <span className="text-[#4F46E5] font-medium font-mono">[ Maestro Comercial ]</span>
            <span className="text-[#D0D0CC]">•</span>
            <span>Turistas Directos, Agencias B2B y Escuelas con trazabilidad histórica de files</span>
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
              <span>
                {selectedType === 'turista' && 'Nuevo Turista Directo'}
                {selectedType === 'agencia' && 'Nueva Agencia B2B'}
                {selectedType === 'escuela' && 'Nueva Escuela / Colegio'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 3 Main Tabs & Search Bar */}
      <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E5E5E1] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Exactly 3 Tabs: Turistas, Agencias B2B, Escuelas & Colegios */}
        <div className="grid grid-cols-3 sm:flex items-center bg-[#F4F4F0] p-1.5 rounded-lg border border-[#E5E5E1] gap-1.5">
          {/* Tab 1: Turistas */}
          <button
            onClick={() => setSelectedType('turista')}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              selectedType === 'turista'
                ? 'bg-[#FFFFFF] text-cyan-800 shadow-xs border border-cyan-200 font-bold'
                : 'text-[#666666] hover:text-[#1A1A1A] hover:bg-[#FFFFFF]/60'
            }`}
          >
            <Plane className={`w-4 h-4 ${selectedType === 'turista' ? 'text-cyan-600' : 'text-[#888888]'}`} />
            <span>Turistas</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              selectedType === 'turista' ? 'bg-cyan-100 text-cyan-800' : 'bg-[#E5E5E1] text-[#666666]'
            }`}>
              {counts.turistas}
            </span>
          </button>

          {/* Tab 2: Agencias B2B */}
          <button
            onClick={() => setSelectedType('agencia')}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              selectedType === 'agencia'
                ? 'bg-[#FFFFFF] text-purple-800 shadow-xs border border-purple-200 font-bold'
                : 'text-[#666666] hover:text-[#1A1A1A] hover:bg-[#FFFFFF]/60'
            }`}
          >
            <Briefcase className={`w-4 h-4 ${selectedType === 'agencia' ? 'text-purple-600' : 'text-[#888888]'}`} />
            <span>Agencias B2B</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              selectedType === 'agencia' ? 'bg-purple-100 text-purple-800' : 'bg-[#E5E5E1] text-[#666666]'
            }`}>
              {counts.agencias}
            </span>
          </button>

          {/* Tab 3: Escuelas & Colegios */}
          <button
            onClick={() => setSelectedType('escuela')}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              selectedType === 'escuela'
                ? 'bg-[#FFFFFF] text-emerald-800 shadow-xs border border-emerald-200 font-bold'
                : 'text-[#666666] hover:text-[#1A1A1A] hover:bg-[#FFFFFF]/60'
            }`}
          >
            <Building className={`w-4 h-4 ${selectedType === 'escuela' ? 'text-emerald-600' : 'text-[#888888]'}`} />
            <span>Escuelas & Colegios</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              selectedType === 'escuela' ? 'bg-emerald-100 text-emerald-800' : 'bg-[#E5E5E1] text-[#666666]'
            }`}>
              {counts.escuelas}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
          <input
            type="text"
            placeholder={`Buscar en ${selectedType === 'turista' ? 'Turistas' : selectedType === 'agencia' ? 'Agencias B2B' : 'Escuelas'} por nombre, CUIT, país...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg pl-9 pr-3 py-2 text-xs text-[#1A1A1A] placeholder-[#888888] focus:outline-none focus:border-[#4F46E5] transition-colors"
          />
        </div>
      </div>

      {/* Main Clients Table */}
      <div className="bg-[#FFFFFF] rounded-xl border border-[#E5E5E1] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E5E1] bg-[#F9F9F7] text-[#666666] font-mono text-[11px] uppercase">
                <th className="py-3 px-4 font-semibold">Cliente / Razón Social</th>
                <th className="py-3 px-4 font-semibold">Contacto & Ubicación</th>
                {selectedType === 'agencia' && (
                  <th className="py-3 px-4 font-semibold">Condiciones B2B</th>
                )}
                <th className="py-3 px-4 font-semibold text-center">Operaciones</th>
                <th className="py-3 px-4 font-semibold text-right">Total Facturado</th>
                <th className="py-3 px-4 font-semibold text-right">Total Cobrado</th>
                <th className="py-3 px-4 font-semibold text-right">Saldo Pendiente</th>
                <th className="py-3 px-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E1]">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={selectedType === 'agencia' ? 8 : 7} className="py-12 text-center text-[#888888] font-mono text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-[#D0D0CC]" />
                      <p>No se encontraron clientes en la categoría de {selectedType === 'turista' ? 'Turistas Directos' : selectedType === 'agencia' ? 'Agencias B2B' : 'Escuelas & Colegios'}.</p>
                      <button
                        onClick={handleOpenCreate}
                        className="mt-2 text-xs text-[#4F46E5] hover:underline font-mono font-bold"
                      >
                        + Registrar nuevo cliente
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map(c => {
                  const fin = clientOperationsData.get(c.id) || {
                    totalOps: 0,
                    ops: [],
                    invoicedARS: 0,
                    collectedARS: 0,
                    pendingARS: 0,
                    invoicedUSD: 0,
                    collectedUSD: 0,
                    pendingUSD: 0,
                    hasARS: false,
                    hasUSD: false
                  };

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-[#F4F4F0]/60 transition-colors group cursor-pointer"
                      onClick={() => setSelectedClient(c)}
                    >
                      {/* Name & Identifiers */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#1A1A1A] flex items-center gap-2 text-sm">
                          {c.type === 'turista' && <Plane className="w-4 h-4 text-cyan-600 shrink-0" />}
                          {c.type === 'agencia' && <Briefcase className="w-4 h-4 text-purple-600 shrink-0" />}
                          {c.type === 'escuela' && <Building className="w-4 h-4 text-emerald-600 shrink-0" />}
                          <span>{c.name}</span>
                        </div>
                        {c.agencyCommercialName && (
                          <div className="text-[11px] text-purple-700 font-medium mt-0.5">
                            Comercial: {c.agencyCommercialName}
                          </div>
                        )}
                        {c.institutionName && c.institutionName !== c.name && (
                          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                            Institución: {c.institutionName}
                          </div>
                        )}
                        {c.documentId && (
                          <div className="text-[11px] text-[#666666] font-mono mt-0.5">
                            Doc/CUIT: {c.documentId}
                          </div>
                        )}
                      </td>

                      {/* Contact & Country */}
                      <td className="py-3.5 px-4 text-[#1A1A1A]">
                        {c.email && (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <Mail className="w-3 h-3 text-[#888888] shrink-0" />
                            <span className="font-mono text-[#666666] truncate max-w-[180px]">{c.email}</span>
                          </div>
                        )}
                        {c.phone && (
                          <div className="flex items-center gap-1.5 text-[11px] text-[#666666] mt-0.5">
                            <Phone className="w-3 h-3 text-[#888888] shrink-0" />
                            <span className="font-mono">{c.phone}</span>
                          </div>
                        )}
                        {c.country && (
                          <div className="flex items-center gap-1.5 text-[11px] text-[#888888] mt-0.5">
                            <MapPin className="w-3 h-3 text-[#888888] shrink-0" />
                            <span>{c.country}</span>
                          </div>
                        )}
                      </td>

                      {/* Agency Specific */}
                      {selectedType === 'agencia' && (
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            {c.commissionRate !== undefined && (
                              <span className="inline-block px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-mono text-[10px] font-bold border border-purple-200">
                                Comisión: {c.commissionRate}%
                              </span>
                            )}
                            {c.paymentTerms && (
                              <p className="text-[11px] text-[#666666] truncate max-w-[160px]">{c.paymentTerms}</p>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Total Files count */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F4F4F0] text-[#1A1A1A] font-mono font-bold text-xs border border-[#E5E5E1]">
                          <Layers className="w-3 h-3 text-[#666666]" />
                          <span>{fin.totalOps} {fin.totalOps === 1 ? 'file' : 'files'}</span>
                        </span>
                      </td>

                      {/* Total Invoiced (Currency Separated) */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        {fin.totalOps === 0 ? (
                          <span className="text-[#888888] text-xs">-</span>
                        ) : (
                          <div className="space-y-0.5">
                            {fin.hasARS && (
                              <div className="font-bold text-[#1A1A1A] text-xs">
                                {formatCurrency(fin.invoicedARS, 'ARS')}
                              </div>
                            )}
                            {fin.hasUSD && (
                              <div className="font-bold text-blue-900 text-xs">
                                {formatCurrency(fin.invoicedUSD, 'USD')}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Total Collected (Currency Separated) */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        {fin.totalOps === 0 ? (
                          <span className="text-[#888888] text-xs">-</span>
                        ) : (
                          <div className="space-y-0.5">
                            {fin.hasARS && (
                              <div className="font-bold text-[#059669] text-xs">
                                {formatCurrency(fin.collectedARS, 'ARS')}
                              </div>
                            )}
                            {fin.hasUSD && (
                              <div className="font-bold text-emerald-700 text-xs">
                                {formatCurrency(fin.collectedUSD, 'USD')}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Pending Balance (Currency Separated) */}
                      <td className="py-3.5 px-4 text-right font-mono">
                        {fin.totalOps === 0 ? (
                          <span className="text-[#888888] text-xs">-</span>
                        ) : (
                          <div className="space-y-0.5">
                            {fin.hasARS && (
                              <div>
                                {fin.pendingARS > 0 ? (
                                  <span className="inline-block font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 text-xs">
                                    {formatCurrency(fin.pendingARS, 'ARS')}
                                  </span>
                                ) : (
                                  <span className="text-emerald-700 text-xs font-semibold">
                                    $ 0
                                  </span>
                                )}
                              </div>
                            )}
                            {fin.hasUSD && (
                              <div>
                                {fin.pendingUSD > 0 ? (
                                  <span className="inline-block font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 text-xs">
                                    {formatCurrency(fin.pendingUSD, 'USD')}
                                  </span>
                                ) : (
                                  <span className="text-emerald-700 text-xs font-semibold">
                                    USD 0
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedClient(c)}
                            className="px-2 py-1 rounded bg-[#F4F4F0] hover:bg-[#E5E5E1] text-[#1A1A1A] font-mono text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                            title="Ver Files y Detalle"
                          >
                            <span>Ver files</span>
                            <ChevronRight className="w-3 h-3 text-[#666666]" />
                          </button>
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
                                if (confirm(`¿Eliminar cliente "${c.name}"?`)) {
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

      {/* Client Detail Modal: Files Drill-Down Ordered Newest to Oldest with Currency Separation */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Top Bar */}
            <div className="flex items-start justify-between border-b border-[#E5E5E1] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#F4F4F0] border border-[#E5E5E1]">
                  {selectedClient.type === 'turista' && <Plane className="w-6 h-6 text-cyan-600" />}
                  {selectedClient.type === 'agencia' && <Briefcase className="w-6 h-6 text-purple-600" />}
                  {selectedClient.type === 'escuela' && <Building className="w-6 h-6 text-emerald-600" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-[#1A1A1A] font-serif">{selectedClient.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                      selectedClient.type === 'turista'
                        ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                        : selectedClient.type === 'agencia'
                        ? 'bg-purple-50 text-purple-800 border-purple-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {selectedClient.type === 'turista' && 'Turista Directo'}
                      {selectedClient.type === 'agencia' && 'Agencia B2B'}
                      {selectedClient.type === 'escuela' && 'Escuela & Colegio'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#666666] font-mono mt-1">
                    {selectedClient.documentId && <span>Doc/CUIT: {selectedClient.documentId}</span>}
                    {selectedClient.country && <span>• {selectedClient.country}</span>}
                    {selectedClient.email && <span>• {selectedClient.email}</span>}
                    {selectedClient.phone && <span>• {selectedClient.phone}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleOpenEdit(selectedClient);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#F4F4F0] hover:bg-[#E5E5E1] text-[#1A1A1A] text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#666666]" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="p-1.5 rounded-lg hover:bg-[#F4F4F0] text-[#888888] hover:text-[#1A1A1A] font-mono text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Historical Summary Cards (Currency Separated) */}
            {(() => {
              const fin = clientOperationsData.get(selectedClient.id) || {
                totalOps: 0,
                ops: [],
                invoicedARS: 0,
                collectedARS: 0,
                pendingARS: 0,
                invoicedUSD: 0,
                collectedUSD: 0,
                pendingUSD: 0,
                hasARS: false,
                hasUSD: false
              };

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[#F9F9F7] p-3.5 rounded-xl border border-[#E5E5E1]">
                    <span className="text-[10px] font-mono uppercase text-[#666666] block">Total Operaciones</span>
                    <span className="text-xl font-bold font-mono text-[#1A1A1A] mt-1 block">
                      {fin.totalOps} files
                    </span>
                  </div>

                  <div className="bg-[#F9F9F7] p-3.5 rounded-xl border border-[#E5E5E1]">
                    <span className="text-[10px] font-mono uppercase text-[#666666] block">Total Facturado</span>
                    <div className="mt-1 space-y-0.5">
                      {fin.hasARS && (
                        <div className="text-sm font-bold font-mono text-[#1A1A1A]">
                          {formatCurrency(fin.invoicedARS, 'ARS')}
                        </div>
                      )}
                      {fin.hasUSD && (
                        <div className="text-sm font-bold font-mono text-blue-900">
                          {formatCurrency(fin.invoicedUSD, 'USD')}
                        </div>
                      )}
                      {!fin.hasARS && !fin.hasUSD && (
                        <span className="text-sm font-mono text-[#888888]">$ 0</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200">
                    <span className="text-[10px] font-mono uppercase text-emerald-800 block">Total Cobrado</span>
                    <div className="mt-1 space-y-0.5">
                      {fin.hasARS && (
                        <div className="text-sm font-bold font-mono text-[#059669]">
                          {formatCurrency(fin.collectedARS, 'ARS')}
                        </div>
                      )}
                      {fin.hasUSD && (
                        <div className="text-sm font-bold font-mono text-emerald-700">
                          {formatCurrency(fin.collectedUSD, 'USD')}
                        </div>
                      )}
                      {!fin.hasARS && !fin.hasUSD && (
                        <span className="text-sm font-mono text-[#888888]">$ 0</span>
                      )}
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border ${
                    (fin.pendingARS > 0 || fin.pendingUSD > 0)
                      ? 'bg-rose-50/60 border-rose-200'
                      : 'bg-[#F9F9F7] border-[#E5E5E1]'
                  }`}>
                    <span className={`text-[10px] font-mono uppercase block ${
                      (fin.pendingARS > 0 || fin.pendingUSD > 0) ? 'text-rose-800 font-bold' : 'text-[#666666]'
                    }`}>
                      Saldo Pendiente
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {fin.hasARS && (
                        <div className={`text-sm font-bold font-mono ${fin.pendingARS > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                          {formatCurrency(fin.pendingARS, 'ARS')}
                        </div>
                      )}
                      {fin.hasUSD && (
                        <div className={`text-sm font-bold font-mono ${fin.pendingUSD > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                          {formatCurrency(fin.pendingUSD, 'USD')}
                        </div>
                      )}
                      {!fin.hasARS && !fin.hasUSD && (
                        <span className="text-sm font-mono text-emerald-700 font-semibold">$ 0</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Agency commercial conditions banner if applicable */}
            {selectedClient.type === 'agencia' && (
              <div className="bg-purple-50/60 p-3.5 rounded-xl border border-purple-200 text-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-purple-800 font-mono text-[10px] uppercase font-bold block">Nombre Comercial</span>
                  <span className="text-[#1A1A1A] font-semibold">{selectedClient.agencyCommercialName || selectedClient.name}</span>
                </div>
                <div>
                  <span className="text-purple-800 font-mono text-[10px] uppercase font-bold block">Comisión Acordada</span>
                  <span className="text-purple-900 font-mono font-bold">{selectedClient.commissionRate || 0}%</span>
                </div>
                <div>
                  <span className="text-purple-800 font-mono text-[10px] uppercase font-bold block">Términos de Pago</span>
                  <span className="text-[#666666]">{selectedClient.paymentTerms || 'Estándar'}</span>
                </div>
              </div>
            )}

            {/* Files List: Ordered from Newest to Oldest */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#1A1A1A] font-mono uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#4F46E5]" />
                  <span>Historial de Operaciones / Files</span>
                  <span className="text-[#666666] font-normal">
                    ({(clientOperationsData.get(selectedClient.id)?.ops || []).length} registrados)
                  </span>
                </h4>
                <span className="text-[11px] text-[#888888] font-mono">Ordenado del más reciente al más antiguo</span>
              </div>

              <div className="border border-[#E5E5E1] rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E5E1] bg-[#F9F9F7] text-[#666666] font-mono text-[11px] uppercase">
                      <th className="py-2.5 px-3 font-semibold">Código</th>
                      <th className="py-2.5 px-3 font-semibold">Título / Servicio</th>
                      <th className="py-2.5 px-3 font-semibold">Fecha</th>
                      <th className="py-2.5 px-3 font-semibold">Estado</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Ingreso Facturado</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Cobrado</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Saldo Pendiente</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E1]">
                    {(clientOperationsData.get(selectedClient.id)?.ops || []).length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-[#888888] font-mono text-xs">
                          No hay operaciones asociadas a este cliente todavía.
                        </td>
                      </tr>
                    ) : (
                      (clientOperationsData.get(selectedClient.id)?.ops || []).map(op => {
                        const opFin = getOperationFinancials(op, selectedClient.type);

                        return (
                          <tr
                            key={op.id}
                            className="hover:bg-[#F4F4F0]/60 transition-colors group cursor-pointer"
                            onClick={() => {
                              setSelectedClient(null);
                              setSelectedOperationId(op.id);
                              setActiveTab('operations');
                            }}
                          >
                            {/* Code */}
                            <td className="py-3 px-3 font-mono font-bold text-[#4F46E5]">
                              {op.code}
                            </td>

                            {/* Title / Service */}
                            <td className="py-3 px-3">
                              <p className="font-semibold text-[#1A1A1A] text-xs group-hover:text-[#4F46E5] transition-colors">
                                {op.name}
                              </p>
                              {op.serviceType && (
                                <span className="text-[10px] text-[#888888] font-mono block">
                                  {op.serviceType} • {op.passengerCount} pax
                                </span>
                              )}
                            </td>

                            {/* Date */}
                            <td className="py-3 px-3 font-mono text-[#666666] whitespace-nowrap">
                              {op.date || '-'}
                            </td>

                            {/* Status */}
                            <td className="py-3 px-3">
                              {getStatusBadge(op.status)}
                            </td>

                            {/* Invoiced */}
                            <td className="py-3 px-3 text-right font-mono font-bold text-[#1A1A1A]">
                              {formatCurrency(opFin.invoiced, opFin.currency)}
                            </td>

                            {/* Collected */}
                            <td className="py-3 px-3 text-right font-mono font-bold text-[#059669]">
                              {formatCurrency(opFin.collected, opFin.currency)}
                            </td>

                            {/* Pending Balance */}
                            <td className="py-3 px-3 text-right font-mono">
                              {opFin.pending > 0 ? (
                                <span className="inline-block font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 text-xs">
                                  {formatCurrency(opFin.pending, opFin.currency)}
                                </span>
                              ) : (
                                <span className="text-emerald-700 font-semibold text-xs">
                                  {formatCurrency(0, opFin.currency)}
                                </span>
                              )}
                            </td>

                            {/* Action Link */}
                            <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setSelectedClient(null);
                                  setSelectedOperationId(op.id);
                                  setActiveTab('operations');
                                }}
                                className="px-2 py-1 rounded bg-[#F4F4F0] hover:bg-[#E5E5E1] text-[#1A1A1A] font-mono text-[10px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <span>Abrir file</span>
                                <ExternalLink className="w-3 h-3 text-[#666666]" />
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

            {/* Notes if any */}
            {selectedClient.notes && (
              <div className="bg-[#F9F9F7] p-3 rounded-xl border border-[#E5E5E1] text-xs">
                <span className="font-mono text-[10px] text-[#888888] uppercase block mb-1">Observaciones</span>
                <p className="text-[#666666]">{selectedClient.notes}</p>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="flex justify-end pt-3 border-t border-[#E5E5E1]">
              <button
                onClick={() => setSelectedClient(null)}
                className="px-4 py-2 rounded-lg bg-[#F4F4F0] hover:bg-[#E5E5E1] text-[#1A1A1A] text-xs font-mono font-semibold cursor-pointer transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create / Edit Client (Only Turista, Agencia, Escuela) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[#FFFFFF] border border-[#E5E5E1] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E5E5E1] pb-3">
              <h3 className="text-base font-bold text-[#1A1A1A] font-serif">
                {editingClientId ? 'Editar Cliente / Cuenta' : 'Registrar Nuevo Cliente'}
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
                  <label className="block text-[11px] font-mono uppercase text-[#666666] mb-1 font-semibold">
                    Categoría de Cliente
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'turista' })}
                      className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                        formData.type === 'turista'
                          ? 'bg-cyan-50 border-cyan-400 text-cyan-900 font-bold'
                          : 'bg-[#F9F9F7] border-[#E5E5E1] text-[#666666] hover:bg-[#F4F4F0]'
                      }`}
                    >
                      <Plane className="w-4 h-4 text-cyan-600" />
                      <span>Turista Directo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'agencia' })}
                      className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                        formData.type === 'agencia'
                          ? 'bg-purple-50 border-purple-400 text-purple-900 font-bold'
                          : 'bg-[#F9F9F7] border-[#E5E5E1] text-[#666666] hover:bg-[#F4F4F0]'
                      }`}
                    >
                      <Briefcase className="w-4 h-4 text-purple-600" />
                      <span>Agencia B2B</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'escuela' })}
                      className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                        formData.type === 'escuela'
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                          : 'bg-[#F9F9F7] border-[#E5E5E1] text-[#666666] hover:bg-[#F4F4F0]'
                      }`}
                    >
                      <Building className="w-4 h-4 text-emerald-600" />
                      <span>Escuela / Colegio</span>
                    </button>
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-mono uppercase text-[#666666] mb-1 font-semibold">
                    {formData.type === 'turista' && 'Nombre Completo del Turista'}
                    {formData.type === 'agencia' && 'Razón Social de la Agencia'}
                    {formData.type === 'escuela' && 'Nombre de la Escuela / Colegio'}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
                    placeholder={
                      formData.type === 'turista'
                        ? 'Ej: John Miller'
                        : formData.type === 'agencia'
                        ? 'Ej: Tangol Viajes SRL'
                        : 'Ej: Colegio San Andrés'
                    }
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

                <div className="col-span-2">
                  <label className="block text-[11px] font-mono uppercase text-[#666666] mb-1">
                    Dirección / Sede
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-[#F9F9F7] border border-[#E5E5E1] rounded-lg px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:border-[#4F46E5]"
                    placeholder="Calle, Ciudad, Provincia"
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
                        Nombre Comercial / Fantasía
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
                        Comisión Acordada (%)
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
                        Persona o Contacto de Operaciones
                      </label>
                      <input
                        type="text"
                        value={formData.agencyContactPerson}
                        onChange={(e) => setFormData({ ...formData, agencyContactPerson: e.target.value })}
                        className="w-full bg-[#FFFFFF] border border-purple-200 rounded px-2 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-purple-500"
                        placeholder="Ej: Laura Gómez (Resp. Emisivo)"
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

              {/* School specific inputs */}
              {formData.type === 'escuela' && (
                <div className="bg-[#ECFDF5] p-3.5 rounded-xl border border-emerald-200 space-y-3">
                  <div className="text-[11px] font-mono font-bold text-emerald-700 uppercase">
                    Configuración de Institución Educativa
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#666666] mb-1">
                      Nombre Oficial de la Institución / Nivel
                    </label>
                    <input
                      type="text"
                      value={formData.institutionName}
                      onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                      className="w-full bg-[#FFFFFF] border border-emerald-200 rounded px-2 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:border-emerald-500"
                      placeholder="Ej: Instituto Santa María - Nivel Primario y Secundario"
                    />
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
                  placeholder="Notas comerciales internas..."
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

