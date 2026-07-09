import React from 'react';
import { Plus, Filter, ChevronDown, LayoutGrid, List, X } from 'lucide-react';
import { SearchInput } from '../../../../components/ui/SearchInput';
import { ORIGENES, ESTADOS_IA } from '../../constants/contactos';
import { HelpButton } from '../../../../components/ui/HelpButton';
import type { ContactosListLogic } from '../../hooks/useContactosListLogic';

interface MobileFiltersProps {
  logic: ContactosListLogic;
}

export const ContactosListMobileFilters: React.FC<MobileFiltersProps> = ({ logic }) => {
  const hasActiveFilters = logic.searchQuery !== '' || logic.filterVisibilidad !== 'Todos' || logic.filterOrigen !== 'Todos' || logic.filterEstadoIA_WA !== 'Todos' || logic.filterEstadoIA_FB !== 'Todos' || logic.activeAdvancedCount > 0;

  return (
    <div className="w-full flex flex-col space-y-4 mb-6 min-w-0">
      <div className="w-full flex justify-between items-start gap-4 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight break-words">Directorio</h2>
            <div className="pt-1 shrink-0">
              <HelpButton title="Contactos y CRM" path="/docs/manuales/manual_contactos.md" />
            </div>
          </div>
          <p className="text-sm text-slate-600 font-medium italic break-words mt-1">Gestión de contactos.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {'contacts' in navigator && (
            <button
              onClick={logic.handleOpenMigrarModal}
              className="flex items-center justify-center p-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 cursor-pointer"
              title="Importar desde Agenda"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </button>
          )}
          <button 
            onClick={() => logic.handleOpenCreateModal('create', { isOwnersView: logic.isOwnersView })}
            className="flex items-center justify-center p-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 cursor-pointer"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
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
            className={`w-full py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
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
          className={`w-full py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            !logic.isArchived ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Principal
        </button>
        <div className={`w-full flex items-center justify-center gap-1 rounded-lg transition-all ${
            logic.isArchived ? 'bg-white shadow-sm' : ''
          }`}>
          <button 
            onClick={() => logic.setIsArchived(true)}
            className={`py-2 text-xs font-bold transition-all cursor-pointer ${
              logic.isArchived ? 'text-blue-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Archivados
          </button>
          {logic.isArchived && <HelpButton title="Registro Archivado" path="/docs/manuales/manual_consecuencias_archivado_contacto.md" iconSize={14} />}
        </div>
      </div>

      <SearchInput 
        value={logic.searchQuery}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => logic.setSearchQuery(e.target.value)}
        placeholder="Buscar contacto..." 
        className="py-3"
      />

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

        <div className="flex flex-col gap-1 w-full relative">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">IA WhatsApp</label>
          <select 
            value={logic.filterEstadoIA_WA}
            onChange={(e) => logic.setFilterEstadoIA_WA(e.target.value)}
            className="w-full pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none appearance-none shadow-sm"
          >
            <option value="Todos">Todos</option>
            {ESTADOS_IA.filter(o => o.value !== 'Inactivo (Global)').map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <ChevronDown className="h-4 w-4 absolute right-3 bottom-3 text-slate-400 pointer-events-none" />
        </div>

        <div className="flex flex-col gap-1 w-full relative">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">IA Facebook</label>
          <select 
            value={logic.filterEstadoIA_FB}
            onChange={(e) => logic.setFilterEstadoIA_FB(e.target.value)}
            className="w-full pl-3 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none appearance-none shadow-sm"
          >
            <option value="Todos">Todos</option>
            {ESTADOS_IA.filter(o => o.value !== 'Inactivo (Global)').map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <ChevronDown className="h-4 w-4 absolute right-3 bottom-3 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="w-full flex flex-col gap-3 min-w-0">
        <div className="flex gap-2 w-full">
          <button 
            onClick={() => logic.setIsAdvancedFiltersOpen(true)}
            className="flex items-center justify-center gap-2 flex-1 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl font-bold shadow-sm cursor-pointer"
          >
            <Filter className="h-4 w-4 shrink-0" />
            Filtros {logic.activeAdvancedCount > 0 && `(${logic.activeAdvancedCount})`}
          </button>
          
          {hasActiveFilters && (
            <button
              onClick={() => logic.clearAllFilters()}
              className="flex items-center justify-center w-[44px] shrink-0 py-2.5 bg-red-50 border border-red-200 text-red-500 rounded-xl hover:bg-red-100 transition-all shadow-sm cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {logic.activeSegment !== 'todos' && !logic.isArchived && (
          <button 
            onClick={() => logic.setViewMode(logic.viewMode === 'list' ? 'kanban' : 'list')}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
          >
            {logic.viewMode === 'list' ? <LayoutGrid className="h-4 w-4 shrink-0" /> : <List className="h-4 w-4 shrink-0" />}
            <span>{logic.viewMode === 'list' ? 'Vista Kanban' : 'Vista Lista'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
