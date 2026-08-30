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
  AlertCircle
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
    currentRole
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | ClientType>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'escuela' as ClientType,
    documentId: '',
    email: '',
    phone: '',
    institutionName: '',
    gradeOrGroup: '',
    parentOrGuardianName: '',
    parentPhone: '',
    parentEmail: '',
    address: '',
    country: 'Argentina',
    notes: ''
  });

  // Calculate client financial relations
  const clientOperationsMap = useMemo(() => {
    const map = new Map<string, { totalOps: number; totalExpected: number; totalReceived: number; ops: typeof operations }>();
    
    operations.forEach(op => {
      // match by clientId or exact name or school name
      const matchedClient = clients.find(
        c => c.id === op.clientId || c.name.toLowerCase() === op.clientOrSchool.toLowerCase()
      );
      const key = matchedClient ? matchedClient.id : op.clientOrSchool.toLowerCase();
      
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
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.documentId && c.documentId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.institutionName && c.institutionName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.parentOrGuardianName && c.parentOrGuardianName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = selectedType === 'all' || c.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [clients, searchTerm, selectedType]);

  const handleOpenCreate = () => {
    setEditingClientId(null);
    setFormData({
      name: '',
      type: 'escuela',
      documentId: '',
      email: '',
      phone: '',
      institutionName: '',
      gradeOrGroup: '',
      parentOrGuardianName: '',
      parentPhone: '',
      parentEmail: '',
      address: '',
      country: 'Argentina',
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
      institutionName: c.institutionName || '',
      gradeOrGroup: c.gradeOrGroup || '',
      parentOrGuardianName: c.parentOrGuardianName || '',
      parentPhone: c.parentPhone || '',
      parentEmail: c.parentEmail || '',
      address: c.address || '',
      country: c.country || 'Argentina',
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
      case 'escuela':
        return <Building className="w-4 h-4 text-emerald-600" />;
      case 'turista':
        return <Plane className="w-4 h-4 text-cyan-600" />;
      case 'alumno':
        return <GraduationCap className="w-4 h-4 text-indigo-600" />;
      case 'empresa':
        return <Briefcase className="w-4 h-4 text-purple-600" />;
      default:
        return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeBadge = (type: ClientType) => {
    switch (type) {
      case 'escuela':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Escuela / Colegio</span>;
      case 'turista':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">Turista Receptivo</span>;
      case 'alumno':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">Alumno / Pagador</span>;
      case 'empresa':
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">Corporativo</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">General</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Directorio de Clientes & Pagadores</h1>
              <p className="text-xs text-gray-500">
                Gestión unificada de Colegios, Turistas Receptivos, Empresas y Tutores de alumnos.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => openImportCenter('clients')}
            className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-gray-500" />
            <span>Importar Clientes</span>
          </button>

          {currentRole !== 'operativo' && (
            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Cliente</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, CUIT/DNI, colegio, email o tutor..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Type pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'escuela', 'turista', 'alumno', 'empresa'] as const).map(t => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedType === t
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {t === 'all' ? 'Todos los Clientes' : t === 'escuela' ? 'Escuelas' : t === 'turista' ? 'Receptivo' : t === 'alumno' ? 'Alumnos / Familias' : 'Empresas'}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map(client => {
          const stats = clientOperationsMap.get(client.id) || clientOperationsMap.get(client.name.toLowerCase()) || {
            totalOps: 0,
            totalExpected: 0,
            totalReceived: 0,
            ops: []
          };
          const pendingBalance = Math.max(0, stats.totalExpected - stats.totalReceived);

          return (
            <div
              key={client.id}
              className="bg-white border border-[#E5E7EB] rounded-xl p-5 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
                      {getTypeIcon(client.type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-900 line-clamp-1">{client.name}</h3>
                      {client.documentId && (
                        <span className="text-[11px] text-gray-500 font-mono">ID: {client.documentId}</span>
                      )}
                    </div>
                  </div>
                  {getTypeBadge(client.type)}
                </div>

                {/* Specific details */}
                <div className="space-y-1.5 text-xs text-gray-600 my-3 bg-gray-50/70 p-3 rounded-lg border border-gray-100">
                  {client.institutionName && (
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-gray-700">Colegio: <strong>{client.institutionName}</strong></span>
                    </div>
                  )}

                  {client.parentOrGuardianName && (
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>Tutor: <strong>{client.parentOrGuardianName}</strong></span>
                    </div>
                  )}

                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}

                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}

                  {client.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{client.address}</span>
                    </div>
                  )}

                  {client.notes && (
                    <p className="text-[11px] text-gray-500 italic mt-1 border-t border-gray-200/50 pt-1">
                      "{client.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Operations & Balances Snapshot */}
              <div className="border-t border-gray-100 pt-3 mt-2">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{stats.totalOps} Operaciones</span>
                  </span>
                  {pendingBalance > 0 ? (
                    <span className="text-rose-700 font-semibold font-mono text-xs">
                      Deuda: {formatCurrency(pendingBalance)}
                    </span>
                  ) : stats.totalExpected > 0 ? (
                    <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Al día
                    </span>
                  ) : (
                    <span className="text-gray-400 text-[11px]">Sin operaciones activas</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1.5 pt-2">
                  <button
                    onClick={() => handleOpenEdit(client)}
                    className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                    title="Editar Cliente"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {currentRole === 'socio' && (
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar al cliente "${client.name}"?`)) {
                          deleteClient(client.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                      title="Eliminar Cliente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredClients.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white border border-dashed border-gray-300 rounded-xl p-8">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-gray-700">No se encontraron clientes</h4>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
              Podés registrar nuevos clientes manualmente o importar un listado masivo desde Excel.
            </p>
            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Primer Cliente</span>
            </button>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-gray-900 mb-4">
              {editingClientId ? 'Editar Cliente / Pagador' : 'Registrar Nuevo Cliente'}
            </h3>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nombre / Razón Social <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ej: Colegio Belgrano Day School / Brasil Conexao"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo de Cliente</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as ClientType })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="escuela">Escuela / Colegio</option>
                    <option value="turista">Turista / Receptivo</option>
                    <option value="alumno">Alumno / Pagador</option>
                    <option value="empresa">Empresa / Corporativo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">CUIT / DNI / Tax ID</label>
                  <input
                    type="text"
                    value={formData.documentId}
                    onChange={e => setFormData({ ...formData, documentId: e.target.value })}
                    placeholder="30-71029384-2"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              {formData.type === 'alumno' && (
                <div className="grid grid-cols-2 gap-3 bg-indigo-50/50 p-3 rounded-lg border border-indigo-100">
                  <div>
                    <label className="block text-xs font-semibold text-indigo-900 mb-1">Colegio / Institución</label>
                    <input
                      type="text"
                      value={formData.institutionName}
                      onChange={e => setFormData({ ...formData, institutionName: e.target.value })}
                      placeholder="Colegio San Andrés"
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-indigo-900 mb-1">Nombre Padre / Tutor</label>
                    <input
                      type="text"
                      value={formData.parentOrGuardianName}
                      onChange={e => setFormData({ ...formData, parentOrGuardianName: e.target.value })}
                      placeholder="Mariano Almada"
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+54 11 4455-6677"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contacto@colegio.edu.ar"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Dirección / Localidad / País</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="ej: Belgrano, CABA"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notas / Observaciones</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Detalles sobre acuerdos comerciales o preferencias del cliente..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
                >
                  {editingClientId ? 'Guardar Cambios' : 'Registrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
