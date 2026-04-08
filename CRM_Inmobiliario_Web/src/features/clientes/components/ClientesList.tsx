import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR, { SWRConfig } from 'swr';
import { Mail, Phone, Loader2, AlertCircle, Plus, Search, Filter as FilterIcon, X, CheckCircle2, ChevronDown, Check, Clock, LayoutGrid, List, Pencil } from 'lucide-react';
import Fuse from 'fuse.js';
import { getClientes } from '../api/getClientes';
import { actualizarEtapaCliente } from '../api/actualizarEtapaCliente';
import { CrearClienteForm } from './CrearClienteForm';
import { ClientesKanban } from './ClientesKanban';
import { localStorageProvider, swrDefaultConfig } from '@/lib/swr';
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

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm animate-pulse">
    <div className="flex justify-between items-start mb-5">
      <div className="h-12 w-12 bg-slate-100 rounded-xl"></div>
      <div className="h-6 w-24 bg-slate-50 rounded-full"></div>
    </div>
    <div className="mb-6 space-y-2">
      <div className="h-5 w-3/4 bg-slate-100 rounded-md"></div>
      <div className="h-3 w-1/2 bg-slate-50 rounded-md"></div>
    </div>
    <div className="space-y-3 pt-5 border-t border-slate-50">
      <div className="h-4 w-full bg-slate-50 rounded-md"></div>
      <div className="h-4 w-2/3 bg-slate-50 rounded-md"></div>
    </div>
  </div>
);

const StatsBar = ({ total, nuevos, negociacion }: { total: number, nuevos: number, negociacion: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-blue-100 transition-all cursor-default">
      <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-all">
        <CheckCircle2 className="h-6 w-6" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Prospectos</p>
        <p className="text-2xl font-black text-slate-900">{total}</p>
      </div>
    </div>
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-amber-100 transition-all cursor-default">
      <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-all">
        <Plus className="h-6 w-6" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">En Proceso</p>
        <p className="text-2xl font-black text-slate-900">{nuevos}</p>
      </div>
    </div>
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-indigo-100 transition-all cursor-default">
      <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-all">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">En Negociación</p>
        <p className="text-2xl font-black text-slate-900">{negociacion}</p>
      </div>
    </div>
  </div>
);

const VIEW_MODE_KEY = 'crm_clientes_view_mode';

const ClientesContent = () => {
  const navigate = useNavigate();
  const { data: clientes = [], isValidating: syncing, mutate } = useSWR<Cliente[]>(
    '/clientes',
    getClientes,
    swrDefaultConfig
  );
  
  const loading = !clientes.length && !syncing;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClienteForEdit, setSelectedClienteForEdit] = useState<Cliente | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null); // 'filter' o id de cliente
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEtapa, setFilterEtapa] = useState('Todas');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>(() => {
    const saved = localStorage.getItem(VIEW_MODE_KEY);
    return (saved as 'list' | 'kanban') || 'list';
  });

  useEffect(() => {
    localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

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

  const fuse = useMemo(() => {
    return new Fuse(clientes, {
      keys: [
        { name: 'nombre', weight: 0.7 },
        { name: 'apellido', weight: 0.7 },
        { name: 'email', weight: 0.3 }
      ],
      threshold: 0.3,
      distance: 100
    });
  }, [clientes]);

  const filteredClientes = useMemo(() => {
    let result = clientes;

    if (searchQuery.trim()) {
      result = fuse.search(searchQuery).map(r => r.item);
    }

    return result.filter(cliente => {
      const matchesEtapa = filterEtapa === 'Todas' || cliente.etapaEmbudo === filterEtapa;
      return matchesEtapa;
    });
  }, [clientes, searchQuery, filterEtapa, fuse]);

  const stats = useMemo(() => ({
    total: clientes.length,
    nuevos: clientes.filter(c => c.etapaEmbudo === 'Nuevo' || c.etapaEmbudo === 'Contactado').length,
    negociacion: clientes.filter(c => c.etapaEmbudo === 'En Negociación').length
  }), [clientes]);

  const handleStageChange = async (id: string, nuevaEtapa: string) => {
    setOpenDropdownId(null);
    const cliente = clientes.find(c => c.id === id);
    if (!cliente || cliente.etapaEmbudo === nuevaEtapa) return;

    // 1. Actualización Optimista vía SWR
    const optimisticData = clientes.map(c => c.id === id ? { ...c, etapaEmbudo: nuevaEtapa } : c);
    
    try {
      setUpdatingId(id);
      await mutate(actualizarEtapaCliente(id, nuevaEtapa).then(() => optimisticData), {
        optimisticData,
        rollbackOnError: true,
        revalidate: true
      });
      setNotification({ type: 'success', message: `Cliente movido a ${nuevaEtapa}` });
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error(err);
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
        {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen relative font-sans antialiased space-y-6 pb-20">
      {/* Indicador de Sincronización UPSP */}
      {syncing && clientes.length > 0 && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900/90 backdrop-blur-xl text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10">
            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sincronizando Leads...</span>
          </div>
        </div>
      )}

      {notification && (
        <div className={`fixed bottom-8 right-8 z-[200] px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-bottom-10 duration-300 ${
          notification.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-rose-600 border-rose-500 text-white'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span className="font-bold text-sm tracking-tight">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 hover:bg-black/10 rounded-lg p-1 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Cartera de Clientes</h2>
          <p className="text-slate-600 mt-1 font-medium italic">Gestión integral de prospectos e interesados.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white p-1 border border-slate-200 rounded-xl shadow-sm mr-2">
            <button 
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <List className="h-4 w-4" />
              Lista
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'kanban' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Tablero
            </button>
          </div>

          <div className="relative flex-1 sm:min-w-[250px]">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o email..." 
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>

          <div className="relative" ref={openDropdownId === 'filter' ? dropdownRef : null}>
            <button 
              onClick={() => setOpenDropdownId(openDropdownId === 'filter' ? null : 'filter')}
              className="flex items-center gap-3 pl-4 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-slate-300 transition-all shadow-sm cursor-pointer"
            >
              <FilterIcon className="h-4 w-4 text-slate-500" />
              <span className="hidden sm:inline">{filterEtapa === 'Todas' ? 'Todas las etapas' : filterEtapa}</span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${openDropdownId === 'filter' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdownId === 'filter' && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[50] py-2 animate-in fade-in zoom-in duration-200 origin-top-right backdrop-blur-xl bg-white/95">
                {FILTER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { setFilterEtapa(option.value); setOpenDropdownId(null); }}
                    className={`w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 cursor-pointer ${
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
          </button>
        </div>
      </div>

      <StatsBar total={stats.total} nuevos={stats.nuevos} negociacion={stats.negociacion} />

      {filteredClientes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 py-32 text-center shadow-sm flex flex-col items-center">
          <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <Search className="h-10 w-10 text-slate-200" />
          </div>
          <p className="text-xl font-bold text-slate-900">Sin resultados</p>
          <p className="text-slate-400 text-sm mt-1">No encontramos lo que buscas. Intenta con otros filtros.</p>
        </div>
      ) : viewMode === 'kanban' ? (
        <ClientesKanban 
          clientes={filteredClientes} 
          onStageChange={handleStageChange}
          onNavigate={(id) => navigate(`/prospectos/${id}`)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {filteredClientes.map((cliente) => (
            <div 
              key={cliente.id} 
              onClick={() => navigate(`/prospectos/${cliente.id}`)}
              className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 group cursor-pointer relative overflow-hidden"
            >
              {syncing && <div className="absolute inset-0 bg-white/5 backdrop-blur-[0.5px] pointer-events-none" />}
              
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
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdownId(openDropdownId === cliente.id ? null : cliente.id);
                      }}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm cursor-pointer transition-all flex items-center gap-2 ${getEtapaStyles(cliente.etapaEmbudo)}`}
                    >
                      {cliente.etapaEmbudo}
                      <ChevronDown className={`h-3 w-3 transition-transform ${openDropdownId === cliente.id ? 'rotate-180' : ''}`} />
                    </button>
                  )}

                  {openDropdownId === cliente.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[50] py-2 animate-in fade-in zoom-in duration-200 origin-top-right backdrop-blur-xl bg-white/95">
                      {ETAPAS.map((etapa) => (
                        <button
                          key={etapa.value}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStageChange(cliente.id, etapa.value);
                          }}
                          className={`w-full px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide flex items-center justify-between transition-colors hover:bg-slate-50 cursor-pointer ${
                            cliente.etapaEmbudo === etapa.value ? 'text-blue-600' : 'text-slate-600'
                          }`}
                        >
                          {etapa.label}
                          {cliente.etapaEmbudo === etapa.value && <Check className="h-3.5 w-3.5" />}
                        </button>
                      ))}
                    </div>
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

              <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Desde: {new Date(cliente.fechaCreacion!).toLocaleDateString()}
                </span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedClienteForEdit(cliente);
                  }}
                  className="h-8 w-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Editar Prospecto"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedClienteForEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <CrearClienteForm 
            initialData={selectedClienteForEdit}
            onSuccess={() => {
              mutate();
              setSelectedClienteForEdit(null);
              setNotification({ type: 'success', message: 'Prospecto actualizado con éxito.' });
            }}
            onCancel={() => setSelectedClienteForEdit(null)}
          />
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <CrearClienteForm 
            onSuccess={() => { mutate(); setIsModalOpen(false); setNotification({ type: 'success', message: 'Prospecto registrado.' }); }} 
            onCancel={() => setIsModalOpen(false)} 
          />
        </div>
      )}
    </div>
  );
};

export const ClientesList = () => {
  return (
    <SWRConfig value={{ provider: localStorageProvider }}>
      <ClientesContent />
    </SWRConfig>
  );
};
