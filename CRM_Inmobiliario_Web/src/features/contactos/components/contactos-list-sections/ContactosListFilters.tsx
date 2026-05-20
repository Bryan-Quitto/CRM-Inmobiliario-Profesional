import { useState, useRef, useEffect } from 'react';
import { Search, Plus, List, LayoutGrid, ChevronDown, Check, SlidersHorizontal, Globe, Users, Briefcase, ArrowUp, ArrowDown, ArrowUpDown, Eye } from 'lucide-react';
import { ETAPAS, ETAPAS_PROPIETARIO, ORIGENES } from '../../constants/contactos';
import type { SortOptionContacto, SortDirectionContacto } from '../../hooks/useContactosFiltering';

const SORT_OPTIONS: { value: SortOptionContacto; label: string }[] = [
  { value: 'fechaCreacion', label: 'Fecha de Ingreso' },
  { value: 'nombre', label: 'Nombre (A-Z)' },
  { value: 'intereses', label: 'Nivel de Interés' },
  { value: 'propiedades', label: 'Volumen de Captación' },
  { value: 'interacciones', label: 'Interacciones' }
];

interface ContactosListFiltersProps {
  activeSegment: 'todos' | 'clientes' | 'propietarios';
  setActiveSegment: (segment: 'todos' | 'clientes' | 'propietarios') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterVisibilidad: string;
  setFilterVisibilidad: (val: string) => void;
  filterOrigen: string;
  setFilterOrigen: (val: string) => void;
  filterEstadoCliente: string;
  setFilterEstadoCliente: (val: string) => void;
  filterEstadoPropietario: string;
  setFilterEstadoPropietario: (val: string) => void;
  viewMode: 'list' | 'kanban';
  setViewMode: (mode: 'list' | 'kanban') => void;
  onOpenCreateModal: () => void;
  onOpenAdvancedFilters: () => void;
  advancedFiltersCount: number;
  sortBy: SortOptionContacto;
  setSortBy: (sort: SortOptionContacto) => void;
  sortDirection: SortDirectionContacto;
  setSortDirection: (dir: SortDirectionContacto) => void;
}

export const ContactosListFilters = ({
  activeSegment,
  setActiveSegment,
  searchQuery,
  setSearchQuery,
  filterVisibilidad,
  setFilterVisibilidad,
  filterOrigen,
  setFilterOrigen,
  filterEstadoCliente,
  setFilterEstadoCliente,
  filterEstadoPropietario,
  setFilterEstadoPropietario,
  viewMode,
  setViewMode,
  onOpenCreateModal,
  onOpenAdvancedFilters,
  advancedFiltersCount,
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection
}: ContactosListFiltersProps) => {

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    if (openDropdownId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  return (
    <div className="flex flex-col space-y-6 mb-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Directorio de Contactos</h2>
          <p className="text-slate-600 mt-1 font-medium italic">Gestión integral de la base de datos inmobiliaria.</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            <span>Nuevo Contacto</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'clientes', label: 'Clientes' },
            { id: 'propietarios', label: 'Propietarios' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSegment(tab.id as 'todos' | 'clientes' | 'propietarios')}
              className={`cursor-pointer px-4 py-2.5 text-sm font-bold transition-all relative ${
                activeSegment === tab.id 
                  ? 'text-blue-600' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
              {activeSegment === tab.id && (
                <div className="absolute bottom-[-9px] left-0 right-0 h-1 bg-blue-600 rounded-t-full shadow-[0_-2px_10px_rgba(37,99,235,0.3)]" />
              )}
            </button>
          ))}
        </div>

        {activeSegment !== 'todos' && (
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('list')}
              className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <List className="h-4 w-4" />
              Lista
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Tablero
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3" ref={dropdownRef}>
        
        {/* Búsqueda rápida */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[250px]">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Búsqueda rápida</label>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, email o teléfono..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Dropdown Visibilidad */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Visibilidad</label>
          <div className="relative">
            <button 
              onClick={() => setOpenDropdownId(openDropdownId === 'visibilidad' ? null : 'visibilidad')}
              className="flex items-center gap-3 pl-4 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-slate-300 transition-all shadow-sm cursor-pointer h-[42px] min-w-[150px]"
            >
              <Eye className="h-4 w-4 text-slate-500" />
              <span>{filterVisibilidad}</span>
              <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform duration-300 ${openDropdownId === 'visibilidad' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdownId === 'visibilidad' && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] py-2 animate-in fade-in zoom-in duration-200 origin-top-right backdrop-blur-xl bg-white/95">
                {['Todos', 'Propios', 'Compartidos'].map((option) => (
                  <button
                    key={option}
                    onClick={() => { setFilterVisibilidad(option); setOpenDropdownId(null); }}
                    className={`cursor-pointer w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 ${
                      filterVisibilidad === option ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                    }`}
                  >
                    {option}
                    {filterVisibilidad === option && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dropdown Origen */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Origen</label>
          <div className="relative">
            <button 
              onClick={() => setOpenDropdownId(openDropdownId === 'origen' ? null : 'origen')}
              className="flex items-center gap-3 pl-4 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-slate-300 transition-all shadow-sm cursor-pointer h-[42px] min-w-[170px]"
            >
              <Globe className="h-4 w-4 text-slate-500" />
              <span>{filterOrigen === 'Todos' ? 'Todos los orígenes' : filterOrigen}</span>
              <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform duration-300 ${openDropdownId === 'origen' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdownId === 'origen' && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] py-2 animate-in fade-in zoom-in duration-200 origin-top-right backdrop-blur-xl bg-white/95">
                <button
                  onClick={() => { setFilterOrigen('Todos'); setOpenDropdownId(null); }}
                  className={`cursor-pointer w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 ${
                    filterOrigen === 'Todos' ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                  }`}
                >
                  Todos los orígenes
                  {filterOrigen === 'Todos' && <Check className="h-4 w-4" />}
                </button>
                {ORIGENES.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { setFilterOrigen(option.value); setOpenDropdownId(null); }}
                    className={`cursor-pointer w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 ${
                      filterOrigen === option.value ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                    }`}
                  >
                    {option.label}
                    {filterOrigen === option.value && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dropdown Estado Cliente */}
        {(activeSegment === 'clientes' || activeSegment === 'todos') && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Estado de Cliente</label>
            <div className="relative">
              <button 
                onClick={() => setOpenDropdownId(openDropdownId === 'estado_cliente' ? null : 'estado_cliente')}
                className="flex items-center gap-3 pl-4 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-slate-300 transition-all shadow-sm cursor-pointer h-[42px] min-w-[170px]"
              >
                <Users className="h-4 w-4 text-slate-500" />
                <span>{filterEstadoCliente === 'Todos' ? 'Todos los estados' : filterEstadoCliente}</span>
                <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform duration-300 ${openDropdownId === 'estado_cliente' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdownId === 'estado_cliente' && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] py-2 animate-in fade-in zoom-in duration-200 origin-top-right backdrop-blur-xl bg-white/95">
                  <button
                    onClick={() => { setFilterEstadoCliente('Todos'); setOpenDropdownId(null); }}
                    className={`cursor-pointer w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 ${
                      filterEstadoCliente === 'Todos' ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                    }`}
                  >
                    Todos los estados
                    {filterEstadoCliente === 'Todos' && <Check className="h-4 w-4" />}
                  </button>
                  {ETAPAS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => { setFilterEstadoCliente(option.value); setOpenDropdownId(null); }}
                      className={`cursor-pointer w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 ${
                        filterEstadoCliente === option.value ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                      }`}
                    >
                      {option.label}
                      {filterEstadoCliente === option.value && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dropdown Estado Propietario */}
        {(activeSegment === 'propietarios' || activeSegment === 'todos') && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Estado Propietario</label>
            <div className="relative">
              <button 
                onClick={() => setOpenDropdownId(openDropdownId === 'estado_propietario' ? null : 'estado_propietario')}
                className="flex items-center gap-3 pl-4 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-slate-300 transition-all shadow-sm cursor-pointer h-[42px] min-w-[170px]"
              >
                <Briefcase className="h-4 w-4 text-slate-500" />
                <span>{filterEstadoPropietario === 'Todos' ? 'Todos los estados' : filterEstadoPropietario}</span>
                <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform duration-300 ${openDropdownId === 'estado_propietario' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdownId === 'estado_propietario' && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] py-2 animate-in fade-in zoom-in duration-200 origin-top-right backdrop-blur-xl bg-white/95">
                  <button
                    onClick={() => { setFilterEstadoPropietario('Todos'); setOpenDropdownId(null); }}
                    className={`cursor-pointer w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 ${
                      filterEstadoPropietario === 'Todos' ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                    }`}
                  >
                    Todos los estados
                    {filterEstadoPropietario === 'Todos' && <Check className="h-4 w-4" />}
                  </button>
                  {ETAPAS_PROPIETARIO.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => { setFilterEstadoPropietario(option.value); setOpenDropdownId(null); }}
                      className={`cursor-pointer w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 ${
                        filterEstadoPropietario === option.value ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                      }`}
                    >
                      {option.label}
                      {filterEstadoPropietario === option.value && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dropdown de Ordenamiento */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Ordenar por</label>
          <div className="relative">
            <div className="flex bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-all h-[42px]">
              <button 
                onClick={() => setOpenDropdownId(openDropdownId === 'sort' ? null : 'sort')}
                className="flex items-center gap-2 pl-4 pr-2 py-2.5 text-sm font-bold text-slate-600 transition-all cursor-pointer border-r border-slate-100"
              >
                <ArrowUpDown className="h-4 w-4 text-slate-500" />
                <span>{SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Seleccionar...'}</span>
                <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform duration-300 ${openDropdownId === 'sort' ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2.5 text-slate-500 hover:text-blue-600 transition-colors flex items-center justify-center cursor-pointer"
                title={sortDirection === 'asc' ? 'Orden Ascendente' : 'Orden Descendente'}
              >
                {sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              </button>
            </div>

            {openDropdownId === 'sort' && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] py-2 animate-in fade-in zoom-in duration-200 origin-top-right backdrop-blur-xl bg-white/95">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { setSortBy(option.value); setOpenDropdownId(null); }}
                    className={`cursor-pointer w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 ${
                      sortBy === option.value ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                    }`}
                  >
                    {option.label}
                    {sortBy === option.value && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Botón Filtros Avanzados */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-transparent select-none ml-1">Filtros</label>
          <button 
            onClick={onOpenAdvancedFilters}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer h-[42px] border ${
              advancedFiltersCount > 0 
                ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filtros {advancedFiltersCount > 0 ? `(${advancedFiltersCount})` : ''}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
