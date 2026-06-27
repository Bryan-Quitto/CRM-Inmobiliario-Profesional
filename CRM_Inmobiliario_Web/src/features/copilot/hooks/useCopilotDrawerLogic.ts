import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCopilotStore } from '../store/useCopilotStore';
import { useCopilotChat } from '../hooks/useCopilotChat';
import { useConfiguracionIA } from '../../configuracion/hooks/useConfiguracionIA';
import { useDraggableResizable } from '../hooks/useDraggableResizable';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { toast } from 'sonner';

export const useCopilotDrawerLogic = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const msgIdToHighlight = searchParams.get('msgId');

  const { isOpen, toggleOpen, messages, clearConversation, isTyping } = useCopilotStore();

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    toggleOpen();
    clearCopilotUrlParams();
  };

  const handleClearConversation = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    clearConversation();
    clearCopilotUrlParams();
  };

  const clearCopilotUrlParams = () => {
    if (searchParams.has('convId') || searchParams.has('msgId')) {
      searchParams.delete('convId');
      searchParams.delete('msgId');
      setSearchParams(searchParams, { replace: true });
    }
  };

  const { sendMessage } = useCopilotChat();
  const [inputValue, setInputValue] = useState('');

  const { isListening, toggleListening } = useSpeechRecognition({
    onResult: (transcript) => {
      setInputValue(prev => prev ? `${prev.trim()} ${transcript} ` : `${transcript} `);
    }
  });

  const { settings, resetPersonalTokens } = useConfiguracionIA();
  const isPersonalAiEnabled = settings?.isPersonalAiEnabled ?? true;
  
  const isLimitReached = (settings?.tokensUsedToday ?? 0) >= (settings?.dailyTokenLimitPersonal ?? 500000);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Minimized state
  const [isMinimized, setIsMinimized] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const defaultWidth = 380;
  const defaultHeight = 600;
  const defaultX = typeof window !== 'undefined' ? window.innerWidth - 420 : 0;
  const defaultY = typeof window !== 'undefined' ? window.innerHeight - 640 : 0;

  const { position, size, onDragStart, onResizeStart } = useDraggableResizable({
    defaultX,
    defaultY,
    defaultWidth,
    defaultHeight,
    minWidth: 320,
    minHeight: 400
  });

  useEffect(() => {
    if (msgIdToHighlight) {
      const el = document.getElementById(`msg-${msgIdToHighlight}`);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
        return;
      }
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isTyping, msgIdToHighlight]);

  useEffect(() => {
    if (!isOpen) {
      setIsMinimized(false);
    }
  }, [isOpen]);

  const handleResetTokens = async () => {
    setIsResetting(true);
    try {
      await resetPersonalTokens();
      setIsResetModalOpen(false);
      toast.success('Contador de tokens reiniciado exitosamente');
    } catch (e) {
      console.error('Error reset tokens:', e);
      toast.error('Ocurrió un error al reiniciar el contador de tokens');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;
    const message = inputValue;
    setInputValue('');
    try {
      await sendMessage(message);
    } catch (e) {
      console.error('Error sending message:', e);
      toast.error('Ocurrió un error al enviar el mensaje.');
      setInputValue(message);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return {
    isOpen,
    isMinimized,
    setIsMinimized,
    messages,
    isTyping,
    inputValue,
    setInputValue,
    handleSend,
    handleKeyDown,
    handleClose,
    handleClearConversation,
    messagesEndRef,
    msgIdToHighlight,
    isListening,
    toggleListening,
    isPersonalAiEnabled,
    isLimitReached,
    isResetModalOpen,
    setIsResetModalOpen,
    isResetting,
    handleResetTokens,
    position,
    size,
    onDragStart,
    onResizeStart,
    toggleOpen
  };
};
