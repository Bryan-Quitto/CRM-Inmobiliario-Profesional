import React from 'react';
import { Search, Plus, Filter, ChevronDown, LayoutGrid, List } from 'lucide-react';
import { ORIGENES } from '../../constants/contactos';
import type { ContactosListLogic } from '../../hooks/useContactosListLogic';

interface MobileFiltersProps {
  logic: ContactosListLogic;
}

export const ContactosListMobileFilters: React.FC<MobileFiltersProps> = ({ logic }) => {
  return (
    <div className="w-full flex flex-col space-y-4 mb-6 min-w-0">
      <div className="w-full flex justify-between items-start gap-4 min-w-0">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight break-words">Directorio</h2>
          <p className="text-sm text-slate-600 font-medium italic break-words">Gestión de contactos.</p>
        </div>
        <button 
          onClick={() => logic.handleOpenCreateModal('create', { isOwnersView: logic.isOwnersView })}
          className="flex items-center gap-2 p-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-col gap-1 w-full bg-slate-100 p-1 rounded-xl">
        {[
          { id: 'todos', label: 'Todos' },
          { id: 'clientes', label: 'Clientes' },
          { id: 'propietarios', label: 'Propietarios' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => logic.setActiveSegment(tab.id as 'todos' | 'clientes' | 'propietarios')}
            className={`w-full py-2 text-xs font-bold rounded-lg transition-all ${
              logic.activeSegment === tab.id 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1 w-full bg-slate-100 p-1 rounded-xl mt-2">
        <button 
          onClick={() => logic.setIsArchived(false)}
          className={`w-full py-2 text-xs font-bold rounded-lg transition-all ${
            !logic.isArchived ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Principal
        </button>
        <button 
          onClick={() => logic.setIsArchived(true)}
          className={`w-full py-2 text-xs font-bold rounded-lg transition-all ${
            logic.isArchived ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Archivados
        </button>
      </div>

      <div className="relative w-full">
        <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input 
          type="text" 
          value={logic.searchQuery}
          onChange={(e) => logic.setSearchQuery(e.target.value)}
          placeholder="Buscar contacto..." 
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-sm"
        />
      </div>

      <div className="w-full flex flex-col gap-3 min-w-0">
        <div className="flex flex-col gap-1 w-full relative">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Visibilidad</label>
          <select 
            value={logic.filterVisibilidad}
            onChange={(e) => logic.setFilterVisibilidad(e.target.value)}
            className="w-full pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none appearance-none shadow-sm"
          >
            {['Todos', 'Propios', 'Compartidos'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <ChevronDown className="h-4 w-4 absolute right-3 bottom-3 text-slate-400 pointer-events-none" />
        </div>

        <div className="flex flex-col gap-1 w-full relative">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Origen</label>
          <select 
            value={logic.filterOrigen}
            onChange={(e) => logic.setFilterOrigen(e.target.value)}
            className="w-full pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none appearance-none shadow-sm"
          >
            <option value="Todos">Todos</option>
            {ORIGENES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <ChevronDown className="h-4 w-4 absolute right-3 bottom-3 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="w-full flex flex-col gap-3 min-w-0">
        <button 
          onClick={() => logic.setIsAdvancedFiltersOpen(true)}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl font-bold shadow-sm"
        >
          <Filter className="h-4 w-4 shrink-0" />
          Filtros {logic.activeAdvancedCount > 0 && `(${logic.activeAdvancedCount})`}
        </button>

        {logic.activeSegment !== 'todos' && !logic.isArchived && (
          <button 
            onClick={() => logic.setViewMode(logic.viewMode === 'list' ? 'kanban' : 'list')}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            {logic.viewMode === 'list' ? <LayoutGrid className="h-4 w-4 shrink-0" /> : <List className="h-4 w-4 shrink-0" />}
            <span>{logic.viewMode === 'list' ? 'Vista Kanban' : 'Vista Lista'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
