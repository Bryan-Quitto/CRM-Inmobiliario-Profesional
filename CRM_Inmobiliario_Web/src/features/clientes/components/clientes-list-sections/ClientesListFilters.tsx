import { Search, Filter as FilterIcon, ChevronDown, Check, Plus, List, LayoutGrid } from 'lucide-react';
import { ETAPAS } from '../../constants/clientes';

const FILTER_OPTIONS = [
  { label: 'Todas las etapas', value: 'Todas' },
  ...ETAPAS
];

interface ClientesListFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterEtapa: string;
  setFilterEtapa: (etapa: string) => void;
  viewMode: 'list' | 'kanban';
  setViewMode: (mode: 'list' | 'kanban') => void;
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  onOpenCreateModal: () => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}

export const ClientesListFilters = ({
  searchQuery,
  setSearchQuery,
  filterEtapa,
  setFilterEtapa,
  viewMode,
  setViewMode,
  isFilterOpen,
  setIsFilterOpen,
  onOpenCreateModal,
  dropdownRef
}: ClientesListFiltersProps) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Cartera de Clientes</h2>
        <p className="text-slate-600 mt-1 font-medium italic">Gestión integral de prospectos e interesados.</p>
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-white p-1 border border-slate-200 rounded-xl shadow-sm mr-2">
          <button 
            onClick={() => setViewMode('list')}
            className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <List className="h-4 w-4" />
            Lista
          </button>
          <button 
            onClick={() => setViewMode('kanban')}
            className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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

        <div className="relative" ref={isFilterOpen ? dropdownRef : null}>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-3 pl-4 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-slate-300 transition-all shadow-sm cursor-pointer"
          >
            <FilterIcon className="h-4 w-4 text-slate-500" />
            <span className="hidden sm:inline">{filterEtapa === 'Todas' ? 'Todas las etapas' : filterEtapa}</span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[50] py-2 animate-in fade-in zoom-in duration-200 origin-top-right backdrop-blur-xl bg-white/95">
              {FILTER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => { setFilterEtapa(option.value); setIsFilterOpen(false); }}
                  className={`cursor-pointer w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 ${
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
          onClick={onOpenCreateModal}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">Nuevo Prospecto</span>
        </button>
      </div>
    </div>
  );
};
