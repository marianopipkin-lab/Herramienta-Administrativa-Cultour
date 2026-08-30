import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Trash2,
  Edit2,
  Mail,
  Phone,
  CreditCard,
  Building,
  CheckCircle2,
  Tag,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Supplier, AccountId } from '../../types';
import { formatCurrency } from '../../utils/financialCalculations';

export const SuppliersMaster: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, accounts, operations, openImportCenter } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [form, setForm] = useState<{
    name: string;
    mpAlias: string;
    cbu: string;
    category: string;
    serviceDescription: string;
    contactName: string;
    phone: string;
    email: string;
    defaultAccountId: AccountId;
  }>({
    name: '',
    mpAlias: '',
    cbu: '',
    category: 'Transporte',
    serviceDescription: '',
    contactName: '',
    phone: '',
    email: '',
    defaultAccountId: 'banco_santander'
  });

  const categories = [
    'Transporte',
    'Alojamiento',
    'Gastronomía',
    'Guías',
    'Seguros',
    'Entradas',
    'Coordinación',
    'Otros'
  ];

  const filteredSuppliers = suppliers.filter(s => {
    if (selectedCategory !== 'all' && s.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchAlias = s.mpAlias?.toLowerCase().includes(q);
      const matchContact = s.contactName?.toLowerCase().includes(q);
      if (!matchName && !matchAlias && !matchContact) return false;
    }
    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      alert('Por favor ingrese el nombre del proveedor.');
      return;
    }

    addSupplier({
      name: form.name,
      mpAlias: form.mpAlias || undefined,
      cbu: form.cbu || undefined,
      category: form.category,
      serviceDescription: form.serviceDescription || form.category,
      contactName: form.contactName || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      defaultAccountId: form.defaultAccountId,
      active: true
    });

    setShowAddModal(false);
    setForm({
      name: '',
      mpAlias: '',
      cbu: '',
      category: 'Transporte',
      serviceDescription: '',
      contactName: '',
      phone: '',
      email: '',
      defaultAccountId: 'banco_santander'
    });
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-[#E5E7EB] rounded-2xl p-5 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Maestro de Proveedores & Alias Mercado Pago</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Gestión de prestadores turísticos, alias de transferencia y reglas de imputación automática.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => openImportCenter('suppliers')}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 text-emerald-700 border border-emerald-200 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Importar Excel</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nuevo Proveedor</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nombre, alias MP, contacto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-3 py-1.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-gray-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Todos los Rubros</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="text-gray-500 font-mono">
          Mostrando <strong className="text-gray-900">{filteredSuppliers.length}</strong> de {suppliers.length} proveedores
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((supplier) => {
          // Count operations using this supplier
          let totalExpected = 0;
          let totalPaid = 0;
          let opCount = 0;

          operations.forEach(op => {
            const matches = op.suppliers.filter(s => s.supplierId === supplier.id || s.supplierName.toLowerCase() === supplier.name.toLowerCase());
            if (matches.length > 0) {
              opCount++;
              matches.forEach(m => {
                totalExpected += m.expectedCost;
                totalPaid += m.paidCost;
              });
            }
          });

          return (
            <div
              key={supplier.id}
              className="bg-white border border-[#E5E7EB] hover:border-gray-300 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{supplier.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold inline-block mt-1">
                      {supplier.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingSupplier(supplier)}
                      className="p-1.5 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Editar proveedor"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar al proveedor "${supplier.name}"?`)) {
                          deleteSupplier(supplier.id);
                        }
                      }}
                      className="p-1.5 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Eliminar proveedor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-600 mt-2 line-clamp-2">{supplier.serviceDescription}</p>

                {/* MP Alias and CBU Box */}
                <div className="mt-3 bg-gray-50 p-2.5 rounded-xl border border-gray-200 space-y-1 text-[11px]">
                  {supplier.mpAlias && (
                    <div className="flex items-center justify-between text-indigo-700 font-mono">
                      <span className="text-gray-500 font-sans">Alias MP:</span>
                      <span className="font-bold">{supplier.mpAlias}</span>
                    </div>
                  )}
                  {supplier.cbu && (
                    <div className="flex items-center justify-between text-gray-700 font-mono">
                      <span className="text-gray-500 font-sans">CBU/CVU:</span>
                      <span className="text-[10px]">{supplier.cbu}</span>
                    </div>
                  )}
                  {supplier.contactName && (
                    <div className="flex items-center justify-between text-gray-700">
                      <span className="text-gray-500">Contacto:</span>
                      <span>{supplier.contactName} ({supplier.phone || supplier.email || '-'})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial stats */}
              <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 block">Total Contratado:</span>
                  <span className="font-mono font-bold text-rose-700">{formatCurrency(totalExpected)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 block">Total Pagado:</span>
                  <span className="font-mono font-bold text-emerald-700">{formatCurrency(totalPaid)}</span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-xs">
            <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Nuevo Proveedor / Prestador</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-3">
              <div>
                <label className="block text-gray-600 mb-1">Razón Social / Nombre Comercial *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="ej. Empresa de Transporte Andes SRL"
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1">Rubro</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-800 focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-600 mb-1">Alias Mercado Pago</label>
                  <input
                    type="text"
                    value={form.mpAlias}
                    onChange={(e) => setForm({ ...form, mpAlias: e.target.value })}
                    placeholder="ej. andes.transporte.mp"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-indigo-700 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-1">CBU / CVU Bancario</label>
                <input
                  type="text"
                  value={form.cbu}
                  onChange={(e) => setForm({ ...form, cbu: e.target.value })}
                  placeholder="ej. 0720023420000019283741"
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Descripción del Servicio</label>
                <input
                  type="text"
                  value={form.serviceDescription}
                  onChange={(e) => setForm({ ...form, serviceDescription: e.target.value })}
                  placeholder="ej. Buses doble piso 60 pax con chofer habilitado CNRT"
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1">Contacto Persona</label>
                  <input
                    type="text"
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    placeholder="ej. Carlos Gómez"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+54 9 11 ..."
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition-colors"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingSupplier && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-xs">
            <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Editar Proveedor: {editingSupplier.name}</h2>
              <button onClick={() => setEditingSupplier(null)} className="p-1 rounded bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateSupplier(editingSupplier.id, {
                  name: editingSupplier.name,
                  category: editingSupplier.category,
                  mpAlias: editingSupplier.mpAlias || undefined,
                  cbu: editingSupplier.cbu || undefined,
                  serviceDescription: editingSupplier.serviceDescription,
                  contactName: editingSupplier.contactName || undefined,
                  phone: editingSupplier.phone || undefined,
                  email: editingSupplier.email || undefined,
                  defaultAccountId: editingSupplier.defaultAccountId
                });
                setEditingSupplier(null);
              }}
              className="p-6 space-y-3"
            >
              <div>
                <label className="block text-gray-600 mb-1">Razón Social / Nombre Comercial *</label>
                <input
                  type="text"
                  required
                  value={editingSupplier.name}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1">Rubro</label>
                  <select
                    value={editingSupplier.category}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, category: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-800 focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-600 mb-1">Alias Mercado Pago</label>
                  <input
                    type="text"
                    value={editingSupplier.mpAlias || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, mpAlias: e.target.value })}
                    placeholder="ej. andes.transporte.mp"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-indigo-700 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-1">CBU / CVU Bancario</label>
                <input
                  type="text"
                  value={editingSupplier.cbu || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, cbu: e.target.value })}
                  placeholder="ej. 0720023420000019283741"
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Descripción del Servicio</label>
                <input
                  type="text"
                  value={editingSupplier.serviceDescription}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, serviceDescription: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 mb-1">Contacto Persona</label>
                  <input
                    type="text"
                    value={editingSupplier.contactName || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, contactName: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={editingSupplier.phone || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-gray-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingSupplier(null)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
