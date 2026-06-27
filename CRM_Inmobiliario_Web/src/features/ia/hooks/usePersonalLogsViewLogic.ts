import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import { usePersonalLogs } from './usePersonalLogs';
import { useCopilotChat } from '../../copilot/hooks/useCopilotChat';

export const usePersonalLogsViewLogic = () => {
  const [searchParams] = useSearchParams();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  
  const {
    conversations,
    isLoading,
    error,
    search,
    setSearch,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    confirmDeleteId,
    setConfirmDeleteId,
    mutate
  } = usePersonalLogs();

  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    if (isSortOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortOpen]);

  const { loadConversation } = useCopilotChat();
  const lastLoadedRef = useRef<string | null>(null);

  useEffect(() => {
    const convId = searchParams.get('convId');
    if (convId && convId !== lastLoadedRef.current) {
      lastLoadedRef.current = convId;
      loadConversation(convId);
    }
  }, [searchParams, loadConversation]);

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

  return {
    editingId,
    setEditingId,
    editTitle,
    setEditTitle,
    conversations,
    isLoading,
    error,
    search,
    setSearch,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    confirmDeleteId,
    setConfirmDeleteId,
    isSortOpen,
    setIsSortOpen,
    sortRef,
    handleEditSubmit,
    handleOptimisticDelete,
    loadConversation
  };
};

export type PersonalLogsViewLogic = ReturnType<typeof usePersonalLogsViewLogic>;
