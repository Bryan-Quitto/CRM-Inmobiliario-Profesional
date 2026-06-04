import { usePersonalLogs } from '../hooks/usePersonalLogs';
import { Search, MessageSquare, Trash2, Check, X, AlertCircle, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import { useState } from 'react';

export const PersonalLogsView = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const {
    conversations,
    isLoading,
    error,
    search,
    setSearch,
    confirmDeleteId,
    setConfirmDeleteId,
    mutate
  } = usePersonalLogs();

  const handleEditSubmit = async (id: string, originalTitle: string) => {
    if (!editTitle.trim() || editTitle.trim() === originalTitle) {
      setEditingId(null);
      return;
    }

    const previousConversations = conversations;
    const newTitle = editTitle.trim();

    // Optimistic UI update
    mutate(
      (current) => current ? current.map(c => c.id === id ? { ...c, title: newTitle } : c) : [],
      false
    );
    setEditingId(null);

    try {
      await api.put(`/conversations/${id}`, { title: newTitle });
      mutate();
    } catch {
      toast.error('Error al actualizar el título');
      mutate(previousConversations, false);
    }
  };

  const handleOptimisticDelete = async (id: string) => {
    const itemToDelete = conversations.find(c => c.id === id);
    if (!itemToDelete) return;

    // Remove optimism
    mutate((current) => current ? current.filter(c => c.id !== id) : [], false);
    setConfirmDeleteId(null);

    let undo = false;

    toast.success('Conversación eliminada', {
      duration: 5000,
      action: {
        label: 'Deshacer',
        onClick: () => {
          undo = true;
          // Revert optimism
          mutate((current) => current ? [itemToDelete, ...current].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) : [itemToDelete], false);
        }
      },
      onAutoClose: async () => {
        if (!undo) {
          try {
            await api.delete(`/conversations/${id}`);
            mutate(); // sync with server
          } catch {
            toast.error('Error al eliminar la conversación en el servidor');
            // Revert optimism
            mutate((current) => current ? [itemToDelete, ...current].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) : [itemToDelete], false);
          }
        }
      },
      onDismiss: async () => {
        if (!undo) {
          try {
            await api.delete(`/conversations/${id}`);
            mutate(); // sync with server
          } catch {
            toast.error('Error al eliminar la conversación en el servidor');
            mutate((current) => current ? [itemToDelete, ...current].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()) : [itemToDelete], false);
          }
        }
      }
    });
  };

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div className="relative w-full max-w-sm group">
          <Search className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar en el historial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-8 focus:ring-blue-50 focus:border-blue-200 transition-all outline-none shadow-sm placeholder:text-slate-300"
          />
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
              <div className="flex flex-col flex-1 mr-4">
                {editingId === conv.id ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleEditSubmit(conv.id, conv.title)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditSubmit(conv.id, conv.title);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                    className="font-bold text-slate-900 border-b-2 border-blue-500 outline-none bg-transparent pb-0.5"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{conv.title || 'Conversación sin título'}</span>
                    <button
                      onClick={() => {
                        setEditingId(conv.id);
                        setEditTitle(conv.title || 'Conversación sin título');
                      }}
                      className="opacity-0 group-hover/row:opacity-100 transition-opacity text-slate-400 hover:text-blue-500 cursor-pointer p-1"
                      title="Editar título"
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
                      onClick={() => handleOptimisticDelete(conv.id)}
                      className="cursor-pointer p-2 bg-rose-100 text-rose-600 rounded-xl hover:bg-rose-200 transition-colors"
                      title="Confirmar"
                    >
                      <Check className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => setConfirmDeleteId(null)}
                      className="cursor-pointer p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
                      title="Cancelar"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setConfirmDeleteId(conv.id)}
                    className="cursor-pointer p-3 text-slate-300 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all"
                    title="Eliminar"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
