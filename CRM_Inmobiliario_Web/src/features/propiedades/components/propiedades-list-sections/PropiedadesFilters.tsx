import { Search, Filter as FilterIcon, ChevronDown, Check, Plus } from 'lucide-react';
import { ESTADOS } from '../../constants/propiedades';

interface PropiedadesFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterEstado: string;
  setFilterEstado: (estado: string) => void;
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
  setIsModalOpen: (open: boolean) => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}

export const PropiedadesFilters = ({
  searchQuery,
  setSearchQuery,
  filterEstado,
  setFilterEstado,
  openDropdownId,
  setOpenDropdownId,
  setIsModalOpen,
  dropdownRef
}: PropiedadesFiltersProps) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Catálogo de Inmuebles</h2>
        <p className="text-slate-600 mt-1 font-medium italic">Explora y gestiona el inventario de propiedades.</p>
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:min-w-[300px]">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título, sector o ciudad..." 
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-sm"
          />
        </div>

        <div className="relative" ref={openDropdownId === 'filter' ? dropdownRef : null}>
          <button 
            onClick={() => setOpenDropdownId(openDropdownId === 'filter' ? null : 'filter')}
            className="flex items-center gap-3 pl-4 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-slate-300 transition-all shadow-sm cursor-pointer"
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

        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          <span>Nueva Propiedad</span>
        </button>
      </div>
    </div>
  );
};
