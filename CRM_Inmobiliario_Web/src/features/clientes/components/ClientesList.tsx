import { useEffect, useState, useCallback, useMemo } from 'react';
import { Mail, Phone, User, Loader2, AlertCircle, Plus, Search, Filter as FilterIcon, X } from 'lucide-react';
import { getClientes } from '../api/getClientes';
import { CrearClienteForm } from './CrearClienteForm';
import type { Cliente } from '../types';

export const ClientesList = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados para búsqueda y filtrado
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
      setError('No se pudo establecer conexión con el CRM. Verifica que el servidor esté activo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  // Lógica de filtrado dinámico
  const filteredClientes = useMemo(() => {
    return clientes.filter(cliente => {
      const fullName = `${cliente.nombre} ${cliente.apellido || ''}`.toLowerCase();
      const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || 
                           cliente.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesEtapa = filterEtapa === 'Todas' || cliente.etapaEmbudo === filterEtapa;
      
      return matchesSearch && matchesEtapa;
    });
  }, [clientes, searchQuery, filterEtapa]);

  const handleCreateSuccess = () => {
    setIsModalOpen(false);
    fetchClientes();
  };

  const getEtapaStyles = (etapa: string) => {
    const styles: Record<string, string> = {
      'Nuevo': 'bg-blue-50 text-blue-700 border-blue-100',
      'Contacto Realizado': 'bg-amber-50 text-amber-700 border-amber-100',
      'Propuesta': 'bg-indigo-50 text-indigo-700 border-indigo-100',
      'Cerrado': 'bg-emerald-50 text-emerald-700 border-emerald-100',
      'Perdido': 'bg-rose-50 text-rose-700 border-rose-100',
    };
    return styles[etapa] || 'bg-gray-50 text-gray-600 border-gray-100';
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
    <div className="bg-slate-50 min-h-screen relative">
      {/* Modal de Creación */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <CrearClienteForm 
            onSuccess={handleCreateSuccess} 
            onCancel={() => setIsModalOpen(false)} 
          />
        </div>
      )}

      {/* Cabecera Corporativa */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Cartera de Clientes</h2>
          <p className="text-gray-500 mt-1 font-medium italic">Gestión integral de prospectos e interesados.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Buscador Funcional */}
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
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filtro de Etapa */}
          <div className="relative">
            <FilterIcon className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <select 
              value={filterEtapa}
              onChange={(e) => setFilterEtapa(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-sm appearance-none cursor-pointer"
            >
              <option value="Todas">Todas las etapas</option>
              <option value="Nuevo">Nuevos</option>
              <option value="Contacto Realizado">Contactados</option>
              <option value="Propuesta">En Propuesta</option>
              <option value="Cerrado">Cerrados</option>
              <option value="Perdido">Perdidos</option>
            </select>
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

      {/* Grid de Tarjetas Filtrado */}
      {filteredClientes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 py-24 text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="h-10 w-10 text-slate-200" />
          </div>
          <p className="text-xl font-bold text-slate-400">No se encontraron resultados</p>
          <p className="text-slate-400 text-sm mt-1">Prueba ajustando tu búsqueda o los filtros actuales.</p>
          {(searchQuery || filterEtapa !== 'Todas') && (
            <button 
              onClick={() => { setSearchQuery(''); setFilterEtapa('Todas'); }}
              className="mt-6 text-sm font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Limpiar todos los filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {filteredClientes.map((cliente) => (
            <div 
              key={cliente.id} 
              className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all duration-300 group"
            >
              {/* Card Header: Iniciales + Badge */}
              <div className="flex justify-between items-start mb-5">
                <div className="h-12 w-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg shadow-slate-900/10 group-hover:bg-blue-600 group-hover:shadow-blue-600/20 transition-all">
                  {cliente.nombre[0]}{cliente.apellido?.[0] || ''}
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${getEtapaStyles(cliente.etapaEmbudo)}`}>
                  {cliente.etapaEmbudo}
                </span>
              </div>

              {/* Card Body: Info de Cliente */}
              <div className="mb-6">
                <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                  {cliente.nombre} {cliente.apellido}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100 tracking-tight">
                    REF: {cliente.id.substring(0, 8).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Card Footer: Contacto */}
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

      {/* Footer / Info de Resultados */}
      <div className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm font-bold text-slate-400">
        <div className="flex items-center gap-2">
          <FilterIcon className="h-4 w-4" />
          Mostrando {filteredClientes.length} de {clientes.length} prospectos
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
          Base de Datos Actualizada
        </div>
      </div>
    </div>
  );
};
