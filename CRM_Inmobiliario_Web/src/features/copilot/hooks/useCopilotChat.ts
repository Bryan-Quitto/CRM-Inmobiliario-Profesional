// Removed unused import
import { useNavigate } from 'react-router-dom';
import { useCopilotStore } from '../store/useCopilotStore';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/axios';

export const useCopilotChat = () => {
  const { addMessage, updateLastMessage, overwriteLastMessage, setTyping } = useCopilotStore();
  const navigate = useNavigate();

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

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      const baseUrl = api.defaults.baseURL || 'https://localhost:7046/api';

      const response = await fetch(`${baseUrl}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: content }),
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
      let fullText = '';
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
              
              const redirectRegex = /\[SystemAction:\s*RedirectTo=(.*?)\]/g;
              let match;
              let cleanChunk = textChunk;
              
              while ((match = redirectRegex.exec(textChunk)) !== null) {
                const path = match[1];
                navigate(path);
                cleanChunk = cleanChunk.replace(match[0], '');
              }

              fullText += cleanChunk;
              overwriteLastMessage(fullText);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in useCopilotChat stream:', error);
      updateLastMessage('\n\n*(Error conectando con el servidor)*');
    } finally {
      setTyping(false);
    }
  };

  return { sendMessage };
};
