import { Search, Filter as FilterIcon, ChevronDown, Check, Plus, List, LayoutGrid } from 'lucide-react';
import { ETAPAS, ETAPAS_PROPIETARIO } from '../../constants/contactos';

interface ContactosListFiltersProps {
  activeSegment: 'todos' | 'clientes' | 'propietarios';
  setActiveSegment: (segment: 'todos' | 'clientes' | 'propietarios') => void;
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

export const ContactosListFilters = ({
  activeSegment,
  setActiveSegment,
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
}: ContactosListFiltersProps) => {
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

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, email o teléfono..." 
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-sm"
          />
        </div>

        <div className="relative" ref={isFilterOpen ? dropdownRef : null}>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-3 pl-4 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-slate-300 transition-all shadow-sm cursor-pointer"
          >
            <FilterIcon className="h-4 w-4 text-slate-500" />
            <span>{filterEtapa === 'Todas' ? 'Todas las etapas' : filterEtapa}</span>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[50] py-2 animate-in fade-in zoom-in duration-200 origin-top-right">
              <button
                onClick={() => { setFilterEtapa('Todas'); setIsFilterOpen(false); }}
                className={`cursor-pointer w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 ${
                  filterEtapa === 'Todas' ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                }`}
              >
                Todas las etapas
                {filterEtapa === 'Todas' && <Check className="h-4 w-4" />}
              </button>

              {(activeSegment === 'clientes' || activeSegment === 'todos') && (
                <>
                  <div className="px-4 py-2 mt-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</span>
                  </div>
                  {ETAPAS.map((option) => (
                    <button
                      key={`p-${option.value}`}
                      onClick={() => { setFilterEtapa(option.value); setIsFilterOpen(false); }}
                      className={`cursor-pointer w-full px-6 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 ${
                        filterEtapa === option.value ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                      }`}
                    >
                      {option.label}
                      {filterEtapa === option.value && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </>
              )}

              {(activeSegment === 'propietarios' || activeSegment === 'todos') && (
                <>
                  <div className="px-4 py-2 mt-2 border-t border-slate-50">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Propietario</span>
                  </div>
                  {ETAPAS_PROPIETARIO.map((option) => (
                    <button
                      key={`o-${option.value}`}
                      onClick={() => { setFilterEtapa(option.value); setIsFilterOpen(false); }}
                      className={`cursor-pointer w-full px-6 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 ${
                        filterEtapa === option.value ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                      }`}
                    >
                      {option.label}
                      {filterEtapa === option.value && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>    </div>
  );
};
