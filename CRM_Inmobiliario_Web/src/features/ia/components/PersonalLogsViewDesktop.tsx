import { MessageSquare, Trash2, Check, X, AlertCircle, Pencil, ExternalLink, ArrowUp, ArrowDown, ArrowUpDown, ChevronDown } from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';
import { PersonalTokenUsagePanel } from './PersonalTokenUsagePanel';
import type { PersonalLogsViewLogic } from '../hooks/usePersonalLogsViewLogic';

const SORT_LABELS = {
  createdAt: 'Fecha de creación',
  updatedAt: 'Fecha de modificación'
};

interface Props {
  logic: PersonalLogsViewLogic;
}

export const PersonalLogsViewDesktop = ({ logic }: Props) => {
  const {
    editingId, setEditingId, editTitle, setEditTitle,
    conversations, isLoading, error, search, setSearch,
    sortBy, setSortBy, sortDirection, setSortDirection,
    confirmDeleteId, setConfirmDeleteId,
    isSortOpen, setIsSortOpen, sortRef,
    handleEditSubmit, handleOptimisticDelete, loadConversation
  } = logic;

  if (error) return (
    <div className="bg-rose-50 border border-rose-100 p-12 rounded-[2rem] text-center max-w-2xl mx-auto mt-10 shadow-xl shadow-rose-500/5 animate-in zoom-in-95 duration-500">
      <div className="bg-white h-20 w-20 rounded-3xl shadow-lg flex items-center justify-center mx-auto mb-6">
        <AlertCircle className="h-10 w-10 text-rose-500" />
      </div>
      <h3 className="text-2xl font-black text-rose-900 uppercase tracking-tight mb-2">Error de Conexión</h3>
      <p className="text-rose-600/80 font-bold text-sm mb-8 px-10">
        No se pudo obtener el historial de conversaciones.
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <PersonalTokenUsagePanel />
      <div className="flex flex-row items-end justify-between gap-6 mb-6">
        <div className="flex-1 flex flex-col gap-1.5 w-full max-w-sm">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Búsqueda rápida</label>
          <SearchInput 
            placeholder="Buscar en el historial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white border-2 border-slate-100 rounded-2xl py-3.5 pl-12 focus:ring-8 focus:ring-indigo-50 focus:border-indigo-200 shadow-sm placeholder:text-slate-300"
            iconClassName="left-4 h-5 w-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors"
          />
        </div>

        {/* Dropdown de Ordenamiento */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Ordenar por</label>
          <div className="relative" ref={sortRef}>
            <div className="flex bg-white border-2 border-slate-100 rounded-2xl shadow-sm hover:border-slate-200 transition-all h-[52px]">
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-2 pl-4 pr-2 py-2 text-sm font-bold text-slate-600 transition-all cursor-pointer border-r-2 border-slate-100 w-[190px]"
              >
                <ArrowUpDown className="h-4 w-4 text-slate-500 shrink-0" />
                <span className="truncate flex-1 text-left">{SORT_LABELS[sortBy as keyof typeof SORT_LABELS]}</span>
                <ChevronDown className={`h-4 w-4 text-slate-300 shrink-0 transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`} />
              </button>
              <button
                title={sortDirection === 'asc' ? 'Orden Ascendente' : 'Orden Descendente'}
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-2 text-slate-500 hover:text-indigo-600 transition-colors flex items-center justify-center cursor-pointer"
              >
                {sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              </button>
            </div>

            {isSortOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in duration-200 origin-top-right backdrop-blur-xl bg-white/95">
                {(['createdAt', 'updatedAt'] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => { setSortBy(option); setIsSortOpen(false); }}
                    className={`cursor-pointer w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 ${
                      sortBy === option ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-600'
                    }`}
                  >
                    {SORT_LABELS[option]}
                    {sortBy === option && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-white border-2 border-slate-50 rounded-[2rem] animate-pulse"></div>
          ))
        ) : conversations.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-100 rounded-[3rem] py-24 text-center">
            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="h-10 w-10 text-slate-200" />
            </div>
            <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No hay conversaciones</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div key={conv.id} className="bg-white border-2 border-slate-50 rounded-[2rem] p-5 flex items-center justify-between hover:border-blue-100 hover:shadow-lg hover:shadow-blue-500/5 transition-all group/row">
              <div className="flex flex-col flex-1 min-w-0 mr-4">
                {editingId === conv.id ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleEditSubmit(conv.id, conv.title || '')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditSubmit(conv.id, conv.title || '');
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                    className="font-bold text-slate-900 border-b-2 border-blue-500 outline-none bg-transparent pb-0.5"
                  />
                ) : (
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-slate-900 truncate">{conv.title || 'Conversación sin título'}</span>
                    <button
                      title="Editar título"
                      onClick={() => {
                        setEditingId(conv.id);
                        setEditTitle(conv.title || 'Conversación sin título');
                      }}
                      className="opacity-0 group-hover/row:opacity-100 transition-opacity text-slate-400 hover:text-blue-500 cursor-pointer p-1"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                  {new Date(conv.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="flex items-center">
                {confirmDeleteId === conv.id ? (
                  <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
                      <button 
                        title="Confirmar"
                        onClick={() => handleOptimisticDelete(conv.id)}
                        className="cursor-pointer p-2 bg-rose-100 text-rose-600 rounded-xl hover:bg-rose-200 transition-colors"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                      <button 
                        title="Cancelar"
                        onClick={() => setConfirmDeleteId(null)}
                        className="cursor-pointer p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                      <button 
                        title="Continuar"
                        onClick={() => loadConversation(conv.id)}
                        className="cursor-pointer p-3 text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </button>
                      <button 
                        title="Eliminar"
                        onClick={() => setConfirmDeleteId(conv.id)}
                        className="cursor-pointer p-3 text-slate-300 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
