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

  const { isOpen, toggleOpen, messages, clearConversation, isTyping, focusedContext, setFocusedContext } = useCopilotStore();

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

  const { sendMessage, stopGeneration } = useCopilotChat();
  const [inputValue, setInputValue] = useState('');

  const { isListening, toggleListening } = useSpeechRecognition({
    onResult: (transcript) => {
      setInputValue(prev => prev ? `${prev.trim()} ${transcript} ` : `${transcript} `);
    }
  });

  const { settings, resetPersonalTokens } = useConfiguracionIA();
  const isPersonalAiEnabled = settings?.isPersonalAiEnabled ?? true;
  const isByokExhausted = settings?.byokKeyStatus === 'QuotaExhausted';
  
  const isLimitReached = (settings?.tokensUsedToday ?? 0) >= (settings?.dailyTokenLimitPersonal ?? 500000);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Minimized state
  const [isMinimized, setIsMinimized] = useState(false);

  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollPositionRef = useRef<number | null>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    scrollPositionRef.current = target.scrollTop;
    const isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 50;
    setShowScrollButton(!isAtBottom);
  };

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

  const prevMessagesLengthRef = useRef(messages.length);
  const prevConvIdRef = useRef(searchParams.get('convId'));

  // 1. Auto-scroll to bottom only when new messages arrive or a new conversation is loaded
  useEffect(() => {
    const currentConvId = searchParams.get('convId');
    const isNewConversation = currentConvId !== prevConvIdRef.current;
    const isNewMessage = messages.length !== prevMessagesLengthRef.current;
    
    prevConvIdRef.current = currentConvId;
    prevMessagesLengthRef.current = messages.length;

    if (msgIdToHighlight) {
      const el = document.getElementById(`msg-${msgIdToHighlight}`);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
        return;
      }
    }

    if (isNewConversation || isNewMessage || isTyping) {
      setTimeout(() => {
        const desktopContainer = document.getElementById('copilot-messages-container');
        const mobileContainer = document.getElementById('copilot-messages-container-mobile');
        
        if (desktopContainer) desktopContainer.scrollTo({ top: desktopContainer.scrollHeight, behavior: 'smooth' });
        if (mobileContainer) mobileContainer.scrollTo({ top: mobileContainer.scrollHeight, behavior: 'smooth' });
      }, 150);
    }
  }, [messages, isTyping, msgIdToHighlight, searchParams]);

  // 2. Restore exact scroll position when opening or un-minimizing the drawer
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        const desktopContainer = document.getElementById('copilot-messages-container');
        const mobileContainer = document.getElementById('copilot-messages-container-mobile');
        
        if (scrollPositionRef.current !== null) {
          // Restore exact position instantly (no animation)
          if (desktopContainer) desktopContainer.scrollTop = scrollPositionRef.current;
          if (mobileContainer) mobileContainer.scrollTop = scrollPositionRef.current;
        } else {
          // First time opening: go to bottom
          if (desktopContainer) desktopContainer.scrollTop = desktopContainer.scrollHeight;
          if (mobileContainer) mobileContainer.scrollTop = mobileContainer.scrollHeight;
        }
      }, 50);
    }
  }, [isOpen, isMinimized]);

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
    focusedContext,
    setFocusedContext,
    inputValue,
    setInputValue,
    handleSend,
    stopGeneration,
    handleKeyDown,
    handleClose,
    handleClearConversation,
    messagesEndRef,
    msgIdToHighlight,
    isListening,
    toggleListening,
    isPersonalAiEnabled,
    isByokExhausted,
    isLimitReached,
    isResetModalOpen,
    setIsResetModalOpen,
    isResetting,
    handleResetTokens,
    position,
    size,
    onDragStart,
    onResizeStart,
    toggleOpen,
    showScrollButton,
    handleScroll
  };
};
