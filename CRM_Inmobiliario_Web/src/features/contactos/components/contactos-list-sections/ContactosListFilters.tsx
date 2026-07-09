import { useState, useRef, useEffect } from 'react';
import { Plus, List, LayoutGrid, ChevronDown, Check, SlidersHorizontal, Globe, Users, Briefcase, ArrowUp, ArrowDown, ArrowUpDown, Eye, Bot, X } from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';
import { ESTADOS, ESTADOS_PROPIETARIO, ORIGENES, ESTADOS_IA } from '../../constants/contactos';
import { HelpButton } from '../../../../components/ui/HelpButton';
import type { SortOptionContacto, SortDirectionContacto } from '../../hooks/useContactosFiltering';
import { TruncatedText } from '@/components/ui/TruncatedText';

const SORT_OPTIONS: { value: SortOptionContacto; label: string }[] = [
  { value: 'fechaCreacion', label: 'Fecha Ingreso' },
  { value: 'nombre', label: 'Nombre (A-Z)' },
  { value: 'intereses', label: 'Intereses' },
  { value: 'propiedades', label: 'Captaciones' },
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
  filterEstadoIA_WA: string;
  setFilterEstadoIA_WA: (val: string) => void;
  filterEstadoIA_FB: string;
  setFilterEstadoIA_FB: (val: string) => void;
  viewMode: 'list' | 'kanban';
  setViewMode: (mode: 'list' | 'kanban') => void;
  onOpenCreateModal: () => void;
  onOpenAdvancedFilters: () => void;
  advancedFiltersCount: number;
  sortBy: SortOptionContacto;
  setSortBy: (sort: SortOptionContacto) => void;
  sortDirection: SortDirectionContacto;
  setSortDirection: (dir: SortDirectionContacto) => void;
  isArchived: boolean;
  setIsArchived: (val: boolean) => void;
  clearAllFilters: () => void;
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
  filterEstadoIA_WA,
  setFilterEstadoIA_WA,
  filterEstadoIA_FB,
  setFilterEstadoIA_FB,
  viewMode,
  setViewMode,
  onOpenCreateModal,
  onOpenAdvancedFilters,
  advancedFiltersCount,
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection,
  isArchived,
  setIsArchived,
  clearAllFilters
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

  const hasActiveFilters = searchQuery !== '' || filterVisibilidad !== 'Todos' || filterOrigen !== 'Todos' || filterEstadoCliente !== 'Todos' || filterEstadoPropietario !== 'Todos' || filterEstadoIA_WA !== 'Todos' || filterEstadoIA_FB !== 'Todos' || advancedFiltersCount > 0;

  return (
    <div className="flex flex-col space-y-6 mb-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Directorio de Contactos</h2>
              <div className="pt-0.5">
                <HelpButton title="Contactos y CRM" path="/docs/manuales/manual_contactos.md" />
              </div>
            </div>
            <p className="text-slate-600 mt-1 font-medium italic">Gestión integral de la base de datos inmobiliaria.</p>
          </div>
          
          {/* Segmented Control - Inbox vs Archive */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start">
            <button 
              data-testid="tab-main"
              onClick={() => setIsArchived(false)}
              className={`cursor-pointer px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                !isArchived ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Catálogo Principal
            </button>
            <div className={`flex items-center gap-1 pr-1 pl-0.5 rounded-lg transition-all ${
                isArchived ? 'bg-white shadow-sm' : ''
              }`}>
              <button 
                data-testid="tab-archived"
                onClick={() => setIsArchived(true)}
                className={`cursor-pointer px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  isArchived ? 'text-blue-700' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Archivados
              </button>
              <HelpButton title="Registro Archivado" path="/docs/manuales/manual_consecuencias_archivado_contacto.md" iconSize={16} />
            </div>
          </div>
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

        {activeSegment !== 'todos' && !isArchived && (
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

      <div className="flex flex-col gap-4" ref={dropdownRef}>
        
        {/* Fila 1: Búsqueda, Orden y Avanzados */}
        <div className="flex flex-col sm:flex-row items-end gap-3 w-full">
        
        {/* Búsqueda rápida */}
        <div className="flex flex-col gap-1.5 w-full sm:w-[300px] md:w-[350px] lg:w-[400px]">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Búsqueda rápida</label>
          <SearchInput 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, email o teléfono..." 
            className="focus:ring-4"
          />
        </div>

        {/* Dropdown de Ordenamiento */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Ordenar por</label>
          <div className="relative">
            <div className="flex bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition-all h-[42px]">
              <button 
                onClick={() => setOpenDropdownId(openDropdownId === 'sort' ? null : 'sort')}
                className="flex items-center gap-2 pl-4 pr-2 py-2.5 text-sm font-bold text-slate-600 transition-all cursor-pointer border-r border-slate-100 w-[180px] sm:w-[200px]"
              >
                <ArrowUpDown className="h-4 w-4 text-slate-500 shrink-0" />
                <TruncatedText as="span" className="truncate flex-1 text-left">{SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Seleccionar...'}</TruncatedText>
                <ChevronDown className={`h-4 w-4 text-slate-300 shrink-0 transition-transform duration-300 ${openDropdownId === 'sort' ? 'rotate-180' : ''}`} />
              </button>
              <button
                title={sortDirection === 'asc' ? 'Orden Ascendente' : 'Orden Descendente'}
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2.5 text-slate-500 hover:text-blue-600 transition-colors flex items-center justify-center cursor-pointer"
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
          <label className="text-[10px] font-black uppercase tracking-wider text-transparent select-none ml-1">_</label>
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <button 
                title="Filtros avanzados"
                onClick={onOpenAdvancedFilters}
                className={`relative flex items-center justify-center w-[42px] h-[42px] rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer border ${
                  advancedFiltersCount > 0 
                    ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' 
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
              {advancedFiltersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center bg-blue-600 text-white text-[9px] font-black rounded-full shadow-sm pointer-events-none">
                  {advancedFiltersCount}
                </span>
              )}
            </div>

            {hasActiveFilters && (
              <button
                title="Limpiar todos los filtros"
                onClick={clearAllFilters}
                className="flex items-center justify-center w-[42px] h-[42px] rounded-xl text-red-500 bg-red-50 border border-red-200 hover:bg-red-100 transition-all shadow-sm cursor-pointer shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
        </div>

        {/* Fila 2: Filtros Rápidos Temáticos */}
        <div className="flex flex-wrap items-end gap-3 w-full border-t border-slate-100 pt-3">
        
        {/* Dropdown Visibilidad */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Visibilidad</label>
          <div className="relative">
            <button 
              onClick={() => setOpenDropdownId(openDropdownId === 'visibilidad' ? null : 'visibilidad')}
              className="flex items-center gap-3 pl-4 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-slate-300 transition-all shadow-sm cursor-pointer h-[42px] w-[130px]"
            >
              <Eye className="h-4 w-4 text-slate-500 shrink-0" />
              <TruncatedText as="span" className="truncate flex-1 text-left">{filterVisibilidad}</TruncatedText>
              <ChevronDown className={`h-4 w-4 text-slate-300 shrink-0 transition-transform duration-300 ${openDropdownId === 'visibilidad' ? 'rotate-180' : ''}`} />
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
              className="flex items-center gap-3 pl-4 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-slate-300 transition-all shadow-sm cursor-pointer h-[42px] w-[150px]"
            >
              <Globe className="h-4 w-4 text-slate-500 shrink-0" />
              <TruncatedText as="span" className="truncate flex-1 text-left">{filterOrigen}</TruncatedText>
              <ChevronDown className={`h-4 w-4 text-slate-300 shrink-0 transition-transform duration-300 ${openDropdownId === 'origen' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdownId === 'origen' && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] py-2 animate-in fade-in zoom-in duration-200 origin-top-right backdrop-blur-xl bg-white/95">
                <button
                  onClick={() => { setFilterOrigen('Todos'); setOpenDropdownId(null); }}
                  className={`cursor-pointer w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 ${
                    filterOrigen === 'Todos' ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                  }`}
                >
                  Todos
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
                className="flex items-center gap-3 pl-4 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-slate-300 transition-all shadow-sm cursor-pointer h-[42px] w-[150px]"
              >
                <Users className="h-4 w-4 text-slate-500 shrink-0" />
                <TruncatedText as="span" className="truncate flex-1 text-left">{filterEstadoCliente}</TruncatedText>
                <ChevronDown className={`h-4 w-4 text-slate-300 shrink-0 transition-transform duration-300 ${openDropdownId === 'estado_cliente' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdownId === 'estado_cliente' && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] py-2 animate-in fade-in zoom-in duration-200 origin-top-right backdrop-blur-xl bg-white/95">
                  <button
                    onClick={() => { setFilterEstadoCliente('Todos'); setOpenDropdownId(null); }}
                    className={`cursor-pointer w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 ${
                      filterEstadoCliente === 'Todos' ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                    }`}
                  >
                    Todos
                    {filterEstadoCliente === 'Todos' && <Check className="h-4 w-4" />}
                  </button>
                  {[...ESTADOS, { label: 'Escalado', value: 'Escalado' }].map((option) => (
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
                className="flex items-center gap-3 pl-4 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-slate-300 transition-all shadow-sm cursor-pointer h-[42px] w-[150px]"
              >
                <Briefcase className="h-4 w-4 text-slate-500 shrink-0" />
                <TruncatedText as="span" className="truncate flex-1 text-left">{filterEstadoPropietario}</TruncatedText>
                <ChevronDown className={`h-4 w-4 text-slate-300 shrink-0 transition-transform duration-300 ${openDropdownId === 'estado_propietario' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdownId === 'estado_propietario' && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] py-2 animate-in fade-in zoom-in duration-200 origin-top-right backdrop-blur-xl bg-white/95">
                  <button
                    onClick={() => { setFilterEstadoPropietario('Todos'); setOpenDropdownId(null); }}
                    className={`cursor-pointer w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 ${
                      filterEstadoPropietario === 'Todos' ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                    }`}
                  >
                    Todos
                    {filterEstadoPropietario === 'Todos' && <Check className="h-4 w-4" />}
                  </button>
                  {ESTADOS_PROPIETARIO.map((option) => (
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

        {/* Dropdown Estado IA WhatsApp */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">IA WhatsApp</label>
          <div className="relative">
            <button 
              onClick={() => setOpenDropdownId(openDropdownId === 'estado_ia_wa' ? null : 'estado_ia_wa')}
              className="flex items-center gap-3 pl-4 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-slate-300 transition-all shadow-sm cursor-pointer h-[42px] w-[150px]"
            >
              <Bot className="h-4 w-4 text-slate-500 shrink-0" />
              <TruncatedText as="span" className="truncate flex-1 text-left">{filterEstadoIA_WA}</TruncatedText>
              <ChevronDown className={`h-4 w-4 text-slate-300 shrink-0 transition-transform duration-300 ${openDropdownId === 'estado_ia_wa' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdownId === 'estado_ia_wa' && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] py-2 animate-in fade-in zoom-in duration-200 origin-top-right backdrop-blur-xl bg-white/95">
                <button
                  onClick={() => { setFilterEstadoIA_WA('Todos'); setOpenDropdownId(null); }}
                  className={`cursor-pointer w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 ${
                    filterEstadoIA_WA === 'Todos' ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                  }`}
                >
                  Todos
                  {filterEstadoIA_WA === 'Todos' && <Check className="h-4 w-4" />}
                </button>
                {ESTADOS_IA.filter(o => o.value !== 'Inactivo (Global)').map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { setFilterEstadoIA_WA(option.value); setOpenDropdownId(null); }}
                    className={`cursor-pointer w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 ${
                      filterEstadoIA_WA === option.value ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                    }`}
                  >
                    {option.label}
                    {filterEstadoIA_WA === option.value && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dropdown Estado IA Facebook */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">IA Facebook</label>
          <div className="relative">
            <button 
              onClick={() => setOpenDropdownId(openDropdownId === 'estado_ia_fb' ? null : 'estado_ia_fb')}
              className="flex items-center gap-3 pl-4 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-slate-300 transition-all shadow-sm cursor-pointer h-[42px] w-[150px]"
            >
              <Bot className="h-4 w-4 text-slate-500 shrink-0" />
              <TruncatedText as="span" className="truncate flex-1 text-left">{filterEstadoIA_FB}</TruncatedText>
              <ChevronDown className={`h-4 w-4 text-slate-300 shrink-0 transition-transform duration-300 ${openDropdownId === 'estado_ia_fb' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdownId === 'estado_ia_fb' && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] py-2 animate-in fade-in zoom-in duration-200 origin-top-right backdrop-blur-xl bg-white/95">
                <button
                  onClick={() => { setFilterEstadoIA_FB('Todos'); setOpenDropdownId(null); }}
                  className={`cursor-pointer w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 ${
                    filterEstadoIA_FB === 'Todos' ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                  }`}
                >
                  Todos
                  {filterEstadoIA_FB === 'Todos' && <Check className="h-4 w-4" />}
                </button>
                {ESTADOS_IA.filter(o => o.value !== 'Inactivo (Global)').map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { setFilterEstadoIA_FB(option.value); setOpenDropdownId(null); }}
                    className={`cursor-pointer w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 ${
                      filterEstadoIA_FB === option.value ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                    }`}
                  >
                    {option.label}
                    {filterEstadoIA_FB === option.value && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        </div>

      </div>
    </div>
  );
};
