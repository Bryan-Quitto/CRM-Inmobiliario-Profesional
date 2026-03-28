import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Mail, Phone, Loader2, AlertCircle, Plus, Search, Filter as FilterIcon, X, CheckCircle2, ChevronDown, Check } from 'lucide-react';
import { getClientes } from '../api/getClientes';
import { actualizarEtapaCliente } from '../api/actualizarEtapaCliente';
import { CrearClienteForm } from './CrearClienteForm';
import type { Cliente } from '../types';

const ETAPAS = [
  { label: 'Nuevo', value: 'Nuevo', color: 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100' },
  { label: 'Contactado', value: 'Contactado', color: 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100' },
  { label: 'En Negociación', value: 'En Negociación', color: 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100' },
  { label: 'Cerrado', value: 'Cerrado', color: 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' },
  { label: 'Perdido', value: 'Perdido', color: 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100' },
];

const FILTER_OPTIONS = [
  { label: 'Todas las etapas', value: 'Todas' },
  ...ETAPAS
];

export const ClientesList = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null); // 'filter' o id de cliente
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEtapa, setFilterEtapa] = useState('Todas');

  const fetchClientes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getClientes();
      setClientes(data);
      setError(null);
    } catch (err) {
      console.error('Error al cargar clientes:', err);
      setError('No se pudo establecer conexión con el CRM.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const filteredClientes = useMemo(() => {
    return clientes.filter(cliente => {
      const fullName = `${cliente.nombre} ${cliente.apellido || ''}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || 
                           cliente.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesEtapa = filterEtapa === 'Todas' || cliente.etapaEmbudo === filterEtapa;
      return matchesSearch && matchesEtapa;
    });
  }, [clientes, searchQuery, filterEtapa]);

  const handleStageChange = async (id: string, nuevaEtapa: string) => {
    setOpenDropdownId(null);
    if (clientes.find(c => c.id === id)?.etapaEmbudo === nuevaEtapa) return;

    try {
      setUpdatingId(id);
      await actualizarEtapaCliente(id, nuevaEtapa);
      setClientes(prev => prev.map(c => c.id === id ? { ...c, etapaEmbudo: nuevaEtapa } : c));
      setNotification({ type: 'success', message: 'Etapa actualizada correctamente.' });
    } catch (err: any) {
      const msg = err.response?.data?.Message || 'No se pudo actualizar el estado.';
      setNotification({ type: 'error', message: msg });
    } finally {
      setUpdatingId(null);
    }
  };

  const getEtapaStyles = (etapa: string) => {
    const found = ETAPAS.find(e => e.value === etapa);
    return found?.color || 'bg-gray-50 text-gray-600 border-gray-100';
  };

  if (loading && clientes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl border border-gray-100 shadow-sm min-h-[400px]">
        <div className="relative">
          <div className="h-12 w-12 border-4 border-blue-50 rounded-full"></div>
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin absolute top-0 left-0 border-t-4 border-transparent rounded-full" />
        </div>
        <p className="mt-4 text-slate-400 font-bold text-sm animate-pulse uppercase tracking-widest">Sincronizando...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen relative font-sans antialiased">
      {notification && (
        <div className={`fixed bottom-8 right-8 z-[200] px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-bottom-10 duration-300 ${
          notification.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-rose-600 border-rose-500 text-white'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span className="font-bold text-sm tracking-tight">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 hover:bg-black/10 rounded-lg p-1 transition-all cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <CrearClienteForm 
            onSuccess={() => { setIsModalOpen(false); fetchClientes(); setNotification({ type: 'success', message: 'Prospecto registrado.' }); }} 
            onCancel={() => setIsModalOpen(false)} 
          />
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Cartera de Clientes</h2>
          <p className="text-gray-500 mt-1 font-medium italic">Gestión integral de prospectos e interesados.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:min-w-[300px]">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o email..." 
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filtro de Etapa CUSTOM */}
          <div className="relative" ref={openDropdownId === 'filter' ? dropdownRef : null}>
            <button 
              onClick={() => setOpenDropdownId(openDropdownId === 'filter' ? null : 'filter')}
              className="flex items-center gap-3 pl-4 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-sm cursor-pointer"
            >
              <FilterIcon className="h-4 w-4 text-slate-400" />
              <span>{filterEtapa === 'Todas' ? 'Todas las etapas' : filterEtapa}</span>
              <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform duration-300 ${openDropdownId === 'filter' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdownId === 'filter' && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[50] py-2 animate-in fade-in zoom-in duration-200 origin-top-right backdrop-blur-xl bg-white/95">
                <div className="px-4 py-2 mb-1 border-b border-slate-50">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtrar por estado</span>
                </div>
                {FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { setFilterEtapa(option.value); setOpenDropdownId(null); }}
                    className={`w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 ${
                      filterEtapa === option.value ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                    }`}
                  >
                    {option.label}
                    {filterEtapa === option.value && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">Nuevo Prospecto</span>
            <span className="sm:hidden">Nuevo</span>
          </button>
        </div>
      </div>

      {filteredClientes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 py-24 text-center shadow-sm">
          <Search className="h-10 w-10 text-slate-200 mx-auto mb-4" />
          <p className="text-xl font-bold text-slate-400">Sin resultados</p>
          <button 
            onClick={() => { setSearchQuery(''); setFilterEtapa('Todas'); }}
            className="mt-4 text-sm font-bold text-blue-600 hover:underline cursor-pointer"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {filteredClientes.map((cliente) => (
            <div key={cliente.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 group">
              <div className="flex justify-between items-start mb-5">
                <div className="h-12 w-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-slate-900/10 group-hover:bg-blue-600 group-hover:shadow-blue-600/20 transition-all">
                  {cliente.nombre[0]}{cliente.apellido?.[0] || ''}
                </div>
                
                <div className="relative" ref={openDropdownId === cliente.id ? dropdownRef : null}>
                  {updatingId === cliente.id ? (
                    <div className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                      <span className="text-[10px] font-black text-slate-400">SYNC...</span>
                    </div>
                  ) : (
                    <>
                      <button 
                        onClick={() => setOpenDropdownId(openDropdownId === cliente.id ? null : cliente.id)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm cursor-pointer transition-all flex items-center gap-2 group/btn ${getEtapaStyles(cliente.etapaEmbudo)}`}
                      >
                        {cliente.etapaEmbudo}
                        <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${openDropdownId === cliente.id ? 'rotate-180' : ''}`} />
                      </button>

                      {openDropdownId === cliente.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[50] py-2 animate-in fade-in zoom-in duration-200 origin-top-right backdrop-blur-xl bg-white/95">
                          {ETAPAS.map((etapa) => (
                            <button
                              key={etapa.value}
                              onClick={() => handleStageChange(cliente.id, etapa.value)}
                              className={`w-full px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide flex items-center justify-between transition-colors hover:bg-slate-50 ${
                                cliente.etapaEmbudo === etapa.value ? 'text-blue-600' : 'text-slate-600'
                              }`}
                            >
                              {etapa.label}
                              {cliente.etapaEmbudo === etapa.value && <Check className="h-3.5 w-3.5" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                  {cliente.nombre} {cliente.apellido}
                </h3>
                <div className="mt-1">
                  <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                    REF: {cliente.id.substring(0, 8).toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-5 border-t border-slate-50">
                {cliente.email && (
                  <div className="flex items-center gap-3 text-sm text-slate-500 font-medium group-hover:text-slate-900 transition-colors">
                    <Mail className="h-4 w-4 text-slate-300 group-hover:text-blue-500" />
                    <span className="truncate">{cliente.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm text-slate-500 font-medium group-hover:text-slate-900 transition-colors">
                  <Phone className="h-4 w-4 text-slate-300 group-hover:text-blue-500" />
                  <span>{cliente.telefono}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
