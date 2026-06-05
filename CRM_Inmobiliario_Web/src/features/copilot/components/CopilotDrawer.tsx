import React, { useState, useEffect, useRef } from 'react';
import { X, RefreshCcw, Send, Bot, Loader2, ShieldAlert, Minus, ChevronDown, Mic, MicOff } from 'lucide-react';
import { useCopilotStore } from '../store/useCopilotStore';
import { useCopilotChat } from '../hooks/useCopilotChat';
import { ChatMessageItem } from './ChatMessageItem';
import { useConfiguracionIA } from '../../configuracion/hooks/useConfiguracionIA';
import { Link } from 'react-router-dom';
import ConfirmModal from '@/components/ConfirmModal';
import { toast } from 'sonner';
import { useDraggableResizable } from '../hooks/useDraggableResizable';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useIsMobile } from '@/hooks/useIsMobile';


export const CopilotDrawer: React.FC = () => {
  const { isOpen, toggleOpen, messages, clearConversation, isTyping } = useCopilotStore();
  const { sendMessage } = useCopilotChat();
  const [inputValue, setInputValue] = useState('');
  const isMobile = useIsMobile();

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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isTyping]);

  // If closed globally, reset minimized state when reopened
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    if (isMinimized) {
      setIsMinimized(false);
    }
    return null;
  }

  return (
    <>
      {/* Minimized Bubble */}
      {isMinimized && (
        <div 
          className="fixed bottom-6 right-6 z-50 p-4 bg-indigo-600 rounded-full shadow-2xl cursor-pointer hover:bg-indigo-700 transition-all duration-300 ease-in-out hover:scale-105 flex items-center justify-center border-4 border-white/20"
          onClick={() => setIsMinimized(false)}
          title="Restaurar Copiloto"
        >
          <div className="relative">
            <Bot className="h-8 w-8 text-white" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-indigo-600"></span>
            </span>
          </div>
        </div>
      )}

      <div
        style={isMobile ? {
          position: 'fixed',
          zIndex: 50,
          display: isMinimized ? 'none' : 'flex'
        } : { 
          position: 'fixed', 
          zIndex: 50, 
          left: position.x, 
          top: position.y, 
          width: size.width, 
          height: size.height,
          display: isMinimized ? 'none' : 'flex'
        }}
        className={`transition-shadow flex-col ${isMobile ? 'inset-0 w-full h-[100dvh] rounded-none m-0' : ''}`}
      >
        <div className={`flex flex-col h-full w-full shadow-2xl overflow-hidden bg-white/90 backdrop-blur-xl border border-slate-200/60 relative ${isMobile ? 'rounded-none' : 'rounded-2xl'}`}>
        {/* Resize Handles */}
        {!isMobile && (
          <>
            <div className="absolute top-0 left-0 right-0 h-2 cursor-n-resize touch-none z-10" onPointerDown={(e) => onResizeStart(e, 'n')} />
            <div className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize touch-none z-10" onPointerDown={(e) => onResizeStart(e, 's')} />
            <div className="absolute top-0 bottom-0 left-0 w-2 cursor-w-resize touch-none z-10" onPointerDown={(e) => onResizeStart(e, 'w')} />
            <div className="absolute top-0 bottom-0 right-0 w-2 cursor-e-resize touch-none z-10" onPointerDown={(e) => onResizeStart(e, 'e')} />
            <div className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize touch-none z-20" onPointerDown={(e) => onResizeStart(e, 'nw')} />
            <div className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize touch-none z-20" onPointerDown={(e) => onResizeStart(e, 'ne')} />
            <div className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize touch-none z-20" onPointerDown={(e) => onResizeStart(e, 'sw')} />
            <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize touch-none z-20" onPointerDown={(e) => onResizeStart(e, 'se')} />
          </>
        )}

        {/* Header */}
        <div 
          onPointerDown={isMobile ? undefined : onDragStart}
          className={`flex items-center justify-between p-4 border-b border-slate-200/50 bg-white/50 select-none touch-none ${!isMobile ? 'drag-handle cursor-move' : ''}`}
        >
          <div className="flex items-center gap-2 text-slate-800">
            <div className="bg-indigo-100 p-1.5 rounded-lg">
              <Bot className="h-5 w-5 text-indigo-600" />
            </div>
            <h2 className="text-base font-semibold">Asistente de IA</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={clearConversation}
              onPointerDown={(e) => e.stopPropagation()}
              className="no-drag p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors flex items-center justify-center cursor-pointer"
              title="Nueva Conversación"
            >
              <RefreshCcw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              onPointerDown={(e) => e.stopPropagation()}
              className="no-drag p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              title="Minimizar"
            >
              <Minus className="h-5 w-5" />
            </button>
            <button
              onClick={toggleOpen}
              onPointerDown={(e) => e.stopPropagation()}
              className="no-drag p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body / Messages List */}
        <div className="relative flex-1 min-h-0 flex flex-col bg-slate-50/50">
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
              <div className="bg-white p-4 rounded-full shadow-sm">
                <Bot className="h-10 w-10 text-indigo-200" />
              </div>
              <p className="text-sm font-medium">¿En qué te puedo ayudar hoy?</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <ChatMessageItem key={msg.id} msg={msg} />
              ))}
              {isTyping && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 shadow-sm border border-white">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center rounded-tl-none">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="absolute bottom-4 right-4 z-10 p-2 bg-white/90 backdrop-blur shadow-md rounded-full text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer border border-slate-200"
              title="Ir al final"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Footer / Input */}
        <div className="p-4 border-t border-slate-200/50 bg-white/80 backdrop-blur-sm">
          {!isPersonalAiEnabled ? (
            <div className="bg-slate-900 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg border border-slate-800">
              <ShieldAlert className="h-5 w-5 text-orange-500 mb-2" />
              <p className="text-sm font-bold text-white mb-2">La IA del Sistema está desactivada.</p>
              <Link
                to="/configuracion/integracion-ia"
                onClick={toggleOpen}
                className="text-[11px] font-black uppercase tracking-wider text-orange-400 hover:text-orange-300 transition-colors bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20 cursor-pointer"
              >
                Actívala en Configuración
              </Link>
            </div>
          ) : isLimitReached ? (
            <div className="bg-slate-900 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg border border-slate-800">
              <ShieldAlert className="h-5 w-5 text-red-500 mb-2" />
              <p className="text-sm font-bold text-white mb-2">Límite diario de tokens alcanzado.</p>
              <div className="flex flex-col gap-2 w-full mt-2">
                <Link
                  to="/configuracion/integracion-ia"
                  onClick={toggleOpen}
                  className="text-[11px] font-black uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 cursor-pointer w-full"
                >
                  Aumentar Límite
                </Link>
                <button
                  onClick={() => setIsResetModalOpen(true)}
                  className="text-[11px] font-black uppercase tracking-wider text-orange-400 hover:text-orange-300 transition-colors bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20 cursor-pointer w-full"
                >
                  Reiniciar Contador
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative flex shadow-sm rounded-2xl">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isTyping}
                  placeholder={isTyping ? "La IA está escribiendo..." : "Escribe un mensaje..."}
                  className="w-full pr-20 pl-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-400 resize-none h-24 overflow-y-auto"
                />
                <div className="absolute bottom-1.5 right-1.5 flex gap-1.5">
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`cursor-pointer flex items-center justify-center p-2 rounded-full transition-all active:scale-95 shadow-sm ${
                      isListening 
                        ? 'bg-rose-500 text-white animate-pulse' 
                        : 'bg-slate-100 text-slate-500 hover:bg-blue-600 hover:text-white'
                    }`}
                  >
                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isTyping}
                    className="p-2 text-white bg-indigo-600 rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-center text-[10px] text-slate-400 mt-2 font-medium">
                La IA puede cometer errores. Verifica la información.
              </p>
            </>
          )}
        </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isResetModalOpen}
        title="Reiniciar Contador de Tokens"
        description="Tu contador de tokens volverá a 0 para que puedas seguir usando el Copiloto hoy, pero los costos adicionales generados seguirán siendo de tu responsabilidad financiera. ¿Deseas continuar?"
        confirmText="Reiniciar y Continuar"
        cancelText="Cancelar"
        type="warning"
        isDeleting={isResetting}
        onConfirm={handleResetTokens}
        onClose={() => setIsResetModalOpen(false)}
      />
    </>
  );
};
