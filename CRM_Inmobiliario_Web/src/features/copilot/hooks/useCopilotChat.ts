import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCopilotStore } from '../store/useCopilotStore';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/axios';
import { mutate } from 'swr';

export const useCopilotChat = () => {
  const { addMessage, updateLastMessage, overwriteLastMessage, setTyping, setConversationId, setMessages, setOpen, conversationId, focusedContext } = useCopilotStore();
  const navigate = useNavigate();
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const loadConversation = async (id: string) => {
    try {
      const response = await api.get(`/conversations/${id}/messages`);
      const data = response.data.map((m: { id: string; role: string; content: string; createdAt: string }) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.createdAt,
      }));
      setMessages(data);
      setConversationId(id);
      setOpen(true);
    } catch (error) {
      console.error('Error loading conversation:', error);
      // Fallback for UI if error
    }
  };

  const sendMessage = async (content: string) => {
    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    });

    setTyping(true);

    const assistantMsgId = (Date.now() + 1).toString();
    addMessage({
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    });

    let fullText = '';

    try {
      abortControllerRef.current = new AbortController();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      const baseUrl = api.defaults.baseURL || 'https://localhost:7046/api';

      const response = await fetch(`${baseUrl}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: content, conversationId, focusedContext }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No readable stream in response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let buffer = '';

      setTyping(false);

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          buffer += decoder.decode(value, { stream: true });
          
          let eventEndIndex;
          while ((eventEndIndex = buffer.indexOf('\n\n')) >= 0) {
            const eventString = buffer.slice(0, eventEndIndex);
            buffer = buffer.slice(eventEndIndex + 2);

            if (eventString.startsWith('data: ')) {
              const dataValue = eventString.slice(6);
              
              if (dataValue === '[DONE]') {
                continue;
              }

              const textChunk = dataValue.replace(/\\n/g, '\n');
              fullText += textChunk;
              
              const redirectRegex = /[`\\]*\[SystemAction:\s*RedirectTo=([^\]\\]+)[`\\]*\][`\\]*/gi;
              let match;
              while ((match = redirectRegex.exec(fullText)) !== null) {
                const path = match[1].trim();
                navigate(path);
                fullText = fullText.replace(match[0], '');
              }

              const convRegex = /[`\\]*\[SystemAction:\s*ConversationId=([^\]\\]+)[`\\]*\][`\\]*/gi;
              let matchConv;
              while ((matchConv = convRegex.exec(fullText)) !== null) {
                const id = matchConv[1].trim();
                setConversationId(id);
                fullText = fullText.replace(matchConv[0], '');
              }

              const invalidateRegex = /[`\\]*\[SystemAction:\s*InvalidateCache=([^\]\\]+)[`\\]*\][`\\]*/gi;
              let matchInvalidate;
              while ((matchInvalidate = invalidateRegex.exec(fullText)) !== null) {
                const cacheKey = matchInvalidate[1].trim();
                mutate(cacheKey);
                window.dispatchEvent(new CustomEvent('swr-invalidate', { detail: { key: cacheKey } }));
                fullText = fullText.replace(matchInvalidate[0], '');
              }

              overwriteLastMessage(fullText);
            }
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Generación de IA abortada por el usuario');
        if (!fullText.trim()) {
          overwriteLastMessage('*(Generación cancelada)*');
        } else {
          updateLastMessage('\n\n*(Generación cancelada)*');
        }
      } else {
        console.error('Error in useCopilotChat stream:', error);
        updateLastMessage('\n\n*(Error conectando con el servidor)*');
      }
    } finally {
      setTyping(false);
      abortControllerRef.current = null;
    }
  };

  return { sendMessage, loadConversation, stopGeneration };
};
