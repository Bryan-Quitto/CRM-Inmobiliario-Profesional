import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import type { MensajeChat } from '../types/auditoria';
import { calculateMessageCost, type AIModel } from '@/entities/ai-pricing';

export interface MensajeChatWithCost extends MensajeChat {
  tokens: number;
  estimatedCost: number;
}

export const useConversacionIAFacebook = (psid: string | null, isActive: boolean, model: AIModel = (import.meta.env.VITE_DEFAULT_AI_MODEL as AIModel) || 'gemini-1.5-flash') => {
  const [mensajesRaw, setMensajesRaw] = useState<MensajeChat[]>([]);
  const [totalMensajes, setTotalMensajes] = useState(0);
  const [loadingChat, setLoadingChat] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversation = useCallback(async (skip = 0, isMore = false) => {
    if (!psid) return;
    
    if (isMore) setLoadingMore(true);
    else setLoadingChat(true);

    try {
      const encodedPsid = encodeURIComponent(psid);
      console.log(`[DEBUG] Llamando a endpoint de facebook: /ia/facebook-conversacion/${encodedPsid}?skip=${skip}&take=10`);
      const res = await api.get(`/ia/facebook-conversacion/${encodedPsid}?skip=${skip}&take=10`);
      if (isMore) {
        setMensajesRaw(prev => [...res.data.mensajes, ...prev]);
      } else {
        setMensajesRaw(res.data.mensajes);
        setTotalMensajes(res.data.total);
      }
    } catch {
      toast.error('No se pudo cargar el historial de conversación de Facebook.');
    } finally {
      setLoadingChat(false);
      setLoadingMore(false);
    }
  }, [psid]);

  useEffect(() => {
    if (isActive && psid) {
      loadConversation();
    }
  }, [isActive, psid, loadConversation]);

  // Compute costs dynamically
  const mensajes = useMemo<MensajeChatWithCost[]>(() => {
    return mensajesRaw.map(msg => {
      const isInput = msg.rol === 'contacto'; // User messages are input to AI
      const { tokens, estimatedCost } = calculateMessageCost(msg.contenido, model, isInput);
      return { ...msg, tokens, estimatedCost };
    });
  }, [mensajesRaw, model]);

  const totalCost = useMemo(() => {
    return mensajes.reduce((sum, msg) => sum + msg.estimatedCost, 0);
  }, [mensajes]);

  useEffect(() => {
    if (isActive && !loadingMore && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajesRaw, isActive, loadingMore]);

  return {
    mensajes,
    totalMensajes,
    totalCost,
    loadingChat,
    loadingMore,
    scrollRef,
    loadMore: () => loadConversation(mensajesRaw.length, true)
  };
};
