import { useState, useRef, useEffect } from 'react';
import { Filter as FilterIcon, ChevronDown, Check, Plus, ArrowUp, ArrowDown, ArrowUpDown, Building2, SlidersHorizontal, X } from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';
import { ESTADOS, OPERACIONES } from '../../constants/propiedades';
import { TIPOS_PROPIEDAD } from '../../constants/propertyForm';
import type { SortOption, SortDirection, AdvancedFiltersState } from '../../hooks/usePropiedadesList/usePropiedadesFiltering';
import { AdvancedFiltersDrawer } from './AdvancedFiltersDrawer';
import { HelpButton } from '../../../../components/ui/HelpButton';
import type { Propiedad } from '../../types';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'fechaIngreso', label: 'Fecha de Ingreso' },
  { value: 'precio', label: 'Precio' },
  { value: 'areaTotal', label: 'Área Total' },
  { value: 'habitaciones', label: 'Habitaciones' },
  { value: 'aniosAntiguedad', label: 'Antigüedad' }
];

interface PropiedadesFiltersProps {
  propiedades: Propiedad[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterEstado: string;
  setFilterEstado: (estado: string) => void;
  filterTipo: string;
  setFilterTipo: (tipo: string) => void;
  isArchived: boolean;
  setIsArchived: (val: boolean) => void;
  advancedFilters: AdvancedFiltersState;
  setAdvancedFilters: React.Dispatch<React.SetStateAction<AdvancedFiltersState>>;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  sortDirection: SortDirection;
  setSortDirection: (dir: SortDirection) => void;
  setIsModalOpen: (open: boolean) => void;
  clearAllFilters: () => void;
}

export const PropiedadesFilters = ({
  propiedades,
  searchQuery,
  setSearchQuery,
  filterEstado,
  setFilterEstado,
  filterTipo,
  setFilterTipo,
  isArchived,
  setIsArchived,
  advancedFilters,
  setAdvancedFilters,
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection,
  setIsModalOpen,
  clearAllFilters
}: PropiedadesFiltersProps) => {

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

  const handleTipoChange = (tipo: string) => {
    setFilterTipo(tipo);
    setOpenDropdownId(null);
    
    // Auto-corregir ordenamiento inválido si cambia el tipo
    if (tipo === 'Terreno' && (sortBy === 'habitaciones' || sortBy === 'aniosAntiguedad')) {
      setSortBy('fechaIngreso');
    } else if (['Oficina', 'Local Comercial', 'Galpón', 'Bodega'].includes(tipo) && sortBy === 'habitaciones') {
      setSortBy('fechaIngreso');
    }
  };

  const getDynamicSortOptions = () => {
    let options = SORT_OPTIONS;
    if (filterTipo === 'Terreno') {
      options = options.filter(o => o.value !== 'habitaciones' && o.value !== 'aniosAntiguedad');
    } else if (['Oficina', 'Local Comercial', 'Galpón', 'Bodega'].includes(filterTipo)) {
      options = options.filter(o => o.value !== 'habitaciones');
    }
    return options;
  };

  const dynamicSortOptions = getDynamicSortOptions();

  // Calcular filtros avanzados activos
  const activeAdvancedFiltersCount = Object.keys(advancedFilters).reduce((count, key) => {
    const value = advancedFilters[key];
    if (value === '' || value === null || value === undefined) return count;
    if (key === 'operacion' && value === 'Todas') return count;
    return count + 1;
  }, 0);

  const hasActiveFilters = searchQuery !== '' || filterEstado !== 'Todos' || filterTipo !== 'Todos' || activeAdvancedFiltersCount > 0 || advancedFilters.operacion !== 'Todas';

  return (
    <>
      <div className="flex flex-col gap-6 mb-10">
        {/* Primera Línea: Títulos y Acción Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Catálogo de Inmuebles</h2>
                <div className="pt-0.5">
                  <HelpButton title="Propiedades e Inventario" path="/docs/manuales/manual_propiedades.md" />
                </div>
              </div>
              <p className="text-slate-600 mt-1 font-medium italic">Explora y gestiona el inventario de propiedades.</p>
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
                <HelpButton title="Registro Archivado" path="/docs/manuales/manual_consecuencias_archivado_propiedad.md" iconSize={16} />
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 cursor-pointer h-[42px] shrink-0"
          >
            <Plus className="h-5 w-5" />
            <span>Nueva Propiedad</span>
          </button>
        </div>
        
        {/* Segunda Línea: Filtros y Ordenamiento */}
        <div className="flex flex-wrap items-end gap-3" ref={dropdownRef}>
          {/* Búsqueda */}
          <div className="flex flex-col gap-1.5 flex-1 sm:min-w-[240px]">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Búsqueda rápida</label>
            <SearchInput 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar título, sector..." 
              className="focus:ring-4"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Estado</label>
            <div className="relative">
              <button 
                onClick={() => setOpenDropdownId(openDropdownId === 'filter' ? null : 'filter')}
                className="flex items-center gap-3 pl-4 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-slate-300 transition-all shadow-sm cursor-pointer h-[42px]"
              >
                <FilterIcon className="h-4 w-4 text-slate-500" />
                <span>{filterEstado === 'Todos' ? 'Todos los estados' : filterEstado}</span>
                <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform duration-300 ${openDropdownId === 'filter' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdownId === 'filter' && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] py-2 animate-in fade-in zoom-in duration-200 origin-top-right backdrop-blur-xl bg-white/95">
                  <button
                    onClick={() => { setFilterEstado('Todos'); setOpenDropdownId(null); }}
                    className={`cursor-pointer w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 ${
                      filterEstado === 'Todos' ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                    }`}
                  >
                    Todos los estados
                    {filterEstado === 'Todos' && <Check className="h-4 w-4" />}
                  </button>
                  {ESTADOS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => { setFilterEstado(option.value); setOpenDropdownId(null); }}
                      className={`cursor-pointer w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 ${
                        filterEstado === option.value ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                      }`}
                    >
                      {option.label}
                      {filterEstado === option.value && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Tipo de inmueble</label>
            <div className="relative">
              <button 
                onClick={() => setOpenDropdownId(openDropdownId === 'tipo' ? null : 'tipo')}
                className="flex items-center gap-3 pl-4 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-slate-300 transition-all shadow-sm cursor-pointer h-[42px]"
              >
                <Building2 className="h-4 w-4 text-slate-500" />
                <span>{filterTipo === 'Todos' ? 'Todos los tipos' : filterTipo}</span>
                <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform duration-300 ${openDropdownId === 'tipo' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdownId === 'tipo' && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] py-2 animate-in fade-in zoom-in duration-200 origin-top-right backdrop-blur-xl bg-white/95 max-h-[300px] overflow-y-auto">
                  <button
                    onClick={() => handleTipoChange('Todos')}
                    className={`cursor-pointer w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 ${
                      filterTipo === 'Todos' ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                    }`}
                  >
                    Todos los tipos
                    {filterTipo === 'Todos' && <Check className="h-4 w-4" />}
                  </button>
                  {TIPOS_PROPIEDAD.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleTipoChange(option.value)}
                      className={`cursor-pointer w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 ${
                        filterTipo === option.value ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                      }`}
                    >
                      {option.label}
                      {filterTipo === option.value && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dropdown Operación */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Operación</label>
            <div className="relative">
              <button 
                onClick={() => setOpenDropdownId(openDropdownId === 'operacion' ? null : 'operacion')}
                className="flex items-center gap-3 pl-4 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-slate-300 transition-all shadow-sm cursor-pointer h-[42px]"
              >
                <span>{advancedFilters.operacion === 'Todas' ? 'Cualquiera' : advancedFilters.operacion}</span>
                <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform duration-300 ${openDropdownId === 'operacion' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdownId === 'operacion' && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] py-2 animate-in fade-in zoom-in duration-200 origin-top-right backdrop-blur-xl bg-white/95">
                  <button
                    onClick={() => { 
                      setAdvancedFilters(prev => ({ ...prev, operacion: 'Todas' })); 
                      setOpenDropdownId(null); 
                    }}
                    className={`cursor-pointer w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 ${
                      advancedFilters.operacion === 'Todas' ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                    }`}
                  >
                    Cualquiera
                    {advancedFilters.operacion === 'Todas' && <Check className="h-4 w-4" />}
                  </button>
                  {OPERACIONES.map((op) => (
                    <button
                      key={op.value}
                      onClick={() => { 
                        setAdvancedFilters(prev => ({ ...prev, operacion: op.value })); 
                        setOpenDropdownId(null); 
                      }}
                      className={`cursor-pointer w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 ${
                        advancedFilters.operacion === op.value ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                      }`}
                    >
                      {op.label}
                      {advancedFilters.operacion === op.value && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

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
                  <span>{dynamicSortOptions.find(o => o.value === sortBy)?.label || 'Seleccionar...'}</span>
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
                  {dynamicSortOptions.map((option) => (
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
                  onClick={() => setIsDrawerOpen(true)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer h-[42px] border ${activeAdvancedFiltersCount > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">Filtros {activeAdvancedFiltersCount > 0 ? `(${activeAdvancedFiltersCount})` : ''}</span>
                </button>
                {activeAdvancedFiltersCount > 0 && (
                  <span className="sm:hidden absolute -top-1.5 -right-1.5 h-4 w-4 flex items-center justify-center bg-blue-600 text-white text-[9px] font-black rounded-full shadow-sm pointer-events-none">
                    {activeAdvancedFiltersCount}
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
      </div>

      {/* Drawer */}
      <AdvancedFiltersDrawer 
        propiedades={propiedades}
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        filters={advancedFilters}
        setFilters={setAdvancedFilters}
        activeCount={activeAdvancedFiltersCount}
      />
    </>
  );
};

