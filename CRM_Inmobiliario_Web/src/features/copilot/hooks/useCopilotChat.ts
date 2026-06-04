// Removed unused import
import { useNavigate } from 'react-router-dom';
import { useCopilotStore } from '../store/useCopilotStore';

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
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Incluimos Authorization por buena práctica si aplica (el interceptor de axios no lo cubre)
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ message: content }),
      });

      if (!response.body) {
        throw new Error('No readable stream in response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let fullBuffer = '';

      setTyping(false);

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          
          const redirectRegex = /\[SystemAction:\s*RedirectTo=(.*?)\]/g;
          let match;
          let cleanChunk = chunk;
          
          while ((match = redirectRegex.exec(chunk)) !== null) {
            const path = match[1];
            navigate(path);
            cleanChunk = cleanChunk.replace(match[0], '');
          }

          fullBuffer += chunk;

          // Verificación de seguridad por si el tag llegó fragmentado en varios chunks
          let hasFragmentedMatch = false;
          let cleanBuffer = fullBuffer;
          const globalRegex = /\[SystemAction:\s*RedirectTo=(.*?)\]/g;
          
          while ((match = globalRegex.exec(fullBuffer)) !== null) {
            const path = match[1];
            navigate(path);
            cleanBuffer = cleanBuffer.replace(match[0], '');
            hasFragmentedMatch = true;
          }

          if (hasFragmentedMatch) {
            fullBuffer = cleanBuffer;
            overwriteLastMessage(cleanBuffer);
          } else if (cleanChunk) {
            updateLastMessage(cleanChunk);
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
