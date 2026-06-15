import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import type { MensajeChat } from '../types/auditoria';

export const useConversacionIA = (telefono: string | null, isActive: boolean) => {
  const [mensajesRaw, setMensajesRaw] = useState<MensajeChat[]>([]);
  const [totalMensajes, setTotalMensajes] = useState(0);
  const [loadingChat, setLoadingChat] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversation = useCallback(async (skip = 0, isMore = false) => {
    if (!telefono) return;
    
    if (isMore) setLoadingMore(true);
    else setLoadingChat(true);

    try {
      const res = await api.get(`/ia/conversacion/${telefono}?skip=${skip}&take=10`);
      if (isMore) {
        setMensajesRaw(prev => [...res.data.mensajes, ...prev]);
      } else {
        setMensajesRaw(res.data.mensajes);
        setTotalMensajes(res.data.total);
      }
    } catch {
      toast.error('No se pudo cargar el historial de conversación.');
    } finally {
      setLoadingChat(false);
      setLoadingMore(false);
    }
  }, [telefono]);

  useEffect(() => {
    if (isActive && telefono) {
      loadConversation();
    }
  }, [isActive, telefono, loadConversation]);

  const totalCost = 0; // Removed local estimation

  useEffect(() => {
    if (isActive && !loadingMore && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajesRaw, isActive, loadingMore]);

  return {
    mensajes: mensajesRaw,
    totalMensajes,
    totalCost,
    loadingChat,
    loadingMore,
    scrollRef,
    loadMore: () => loadConversation(mensajesRaw.length, true)
  };
};
