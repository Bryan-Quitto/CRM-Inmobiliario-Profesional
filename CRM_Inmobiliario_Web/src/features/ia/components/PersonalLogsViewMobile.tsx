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

export const PersonalLogsViewMobile = ({ logic }: Props) => {
  const {
    editingId, setEditingId, editTitle, setEditTitle,
    conversations, isLoading, error, search, setSearch,
    sortBy, setSortBy, sortDirection, setSortDirection,
    confirmDeleteId, setConfirmDeleteId,
    isSortOpen, setIsSortOpen, sortRef,
    handleEditSubmit, handleOptimisticDelete, loadConversation
  } = logic;

  if (error) return (
    <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl text-center w-full my-6 shadow-xl shadow-rose-500/5 animate-in zoom-in-95 duration-500">
      <div className="bg-white h-16 w-16 rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="h-8 w-8 text-rose-500" />
      </div>
      <h3 className="text-xl font-black text-rose-900 uppercase tracking-tight mb-2">Error de Conexión</h3>
      <p className="text-rose-600/80 font-bold text-sm mb-4">
        No se pudo obtener el historial.
      </p>
    </div>
  );

  return (
    <div className="flex flex-col w-full space-y-6">
      <PersonalTokenUsagePanel />
      
      {/* Controles en una sola columna vertical */}
      <div className="flex flex-col w-full gap-4 mb-6">
        <div className="flex flex-col gap-1.5 w-full">
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
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Ordenar por</label>
          <div className="relative w-full" ref={sortRef}>
            <div className="flex w-full bg-white border-2 border-slate-100 rounded-2xl shadow-sm hover:border-slate-200 transition-all h-[52px]">
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center justify-between pl-4 pr-2 py-2 text-sm font-bold text-slate-600 transition-all cursor-pointer border-r-2 border-slate-100 flex-1 min-w-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ArrowUpDown className="h-4 w-4 text-slate-500 shrink-0" />
                  <span className="break-words whitespace-normal text-left line-clamp-2 min-w-0">{SORT_LABELS[sortBy as keyof typeof SORT_LABELS]}</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-300 shrink-0 transition-transform duration-300 ${isSortOpen ? 'rotate-180' : ''}`} />
              </button>
              <button
                title={sortDirection === 'asc' ? 'Orden Ascendente' : 'Orden Descendente'}
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-2 text-slate-500 hover:text-indigo-600 transition-colors flex items-center justify-center cursor-pointer shrink-0"
              >
                {sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              </button>
            </div>

            {isSortOpen && (
              <div className="absolute right-0 left-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in duration-200 origin-top backdrop-blur-xl bg-white/95">
                {(['createdAt', 'updatedAt'] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => { setSortBy(option); setIsSortOpen(false); }}
                    className={`cursor-pointer w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between gap-2 transition-all hover:bg-slate-50 ${
                      sortBy === option ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-600'
                    }`}
                  >
                    <span className="break-words whitespace-normal text-left line-clamp-2 flex-1 min-w-0">{SORT_LABELS[option]}</span>
                    {sortBy === option && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col w-full gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-white border-2 border-slate-50 rounded-3xl animate-pulse"></div>
          ))
        ) : conversations.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-100 rounded-3xl py-6 text-center w-full">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 shrink-0">
              <MessageSquare className="h-8 w-8 text-slate-200 shrink-0" />
            </div>
            <p className="text-slate-400 font-black uppercase text-xs tracking-widest break-words px-4">No hay conversaciones</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div key={conv.id} className="bg-white border-2 border-slate-50 rounded-3xl p-4 flex flex-col gap-4 hover:border-blue-100 hover:shadow-lg transition-all">
              <div className="flex flex-col flex-1 min-w-0">
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
                    className="font-bold text-slate-900 border-b-2 border-blue-500 outline-none bg-transparent pb-0.5 w-full break-all"
                  />
                ) : (
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <span className="font-bold text-slate-900 break-words flex-1 min-w-0">{conv.title || 'Conversación sin título'}</span>
                    <button
                      title="Editar título"
                      onClick={() => {
                        setEditingId(conv.id);
                        setEditTitle(conv.title || 'Conversación sin título');
                      }}
                      className="text-slate-400 hover:text-blue-500 cursor-pointer p-1 shrink-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-2">
                  {new Date(conv.updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="flex items-center justify-end border-t border-slate-50 pt-2">
                {confirmDeleteId === conv.id ? (
                  <div className="flex items-center gap-2 w-full justify-between animate-in slide-in-from-right-4 duration-300">
                    <span className="text-xs font-bold text-rose-500 uppercase shrink-0">¿Eliminar?</span>
                    <div className="flex gap-2 flex-1">
                      <button 
                        title="Confirmar"
                        onClick={() => handleOptimisticDelete(conv.id)}
                        className="cursor-pointer p-2 bg-rose-100 text-rose-600 rounded-xl hover:bg-rose-200 transition-colors flex-1 flex justify-center shrink-0"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                      <button 
                        title="Cancelar"
                        onClick={() => setConfirmDeleteId(null)}
                        className="cursor-pointer p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors flex-1 flex justify-center shrink-0"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 w-full">
                      <button 
                        title="Continuar"
                        onClick={() => loadConversation(conv.id)}
                        className="cursor-pointer flex-1 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase"
                      >
                        <ExternalLink className="h-4 w-4 shrink-0" />
                        <span className="break-words whitespace-normal">Abrir</span>
                      </button>
                      <button 
                        title="Eliminar"
                        onClick={() => setConfirmDeleteId(conv.id)}
                        className="cursor-pointer px-4 py-2 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-xl transition-all flex items-center justify-center shrink-0"
                      >
                        <Trash2 className="h-4 w-4 shrink-0" />
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
