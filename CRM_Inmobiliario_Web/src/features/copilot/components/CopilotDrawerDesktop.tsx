import React from 'react';
import { X, RefreshCcw, Send, Bot, Loader2, ShieldAlert, Minus, ChevronDown, Mic, MicOff, History, Square } from 'lucide-react';
import { ChatMessageItem } from './ChatMessageItem';
import { Link } from 'react-router-dom';
import ConfirmModal from '@/components/ConfirmModal';
import { HelpButton } from '../../../components/ui/HelpButton';
import { useCopilotDrawerLogic } from '../hooks/useCopilotDrawerLogic';

export const CopilotDrawerDesktop: React.FC<{ logic: ReturnType<typeof useCopilotDrawerLogic> }> = ({ logic }) => {
  const {
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
  } = logic;

  if (!isOpen) return null;

  return (
    <div className="hidden lg:block">
      {/* Minimized Bubble */}
      {isMinimized && (
        <div 
          title="Restaurar Copiloto"
          className="fixed bottom-6 right-6 z-50 p-4 bg-indigo-600 rounded-full shadow-2xl cursor-pointer hover:bg-indigo-700 transition-all duration-300 ease-in-out hover:scale-105 flex items-center justify-center border-4 border-white/20"
          onClick={() => setIsMinimized(false)}
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
        style={{ 
          position: 'fixed', 
          zIndex: 50, 
          left: position.x, 
          top: position.y, 
          width: size.width, 
          height: size.height,
          display: isMinimized ? 'none' : 'flex'
        }}
        className="transition-shadow flex-col"
      >
        <div className="flex flex-col h-full w-full shadow-2xl overflow-hidden bg-white/90 backdrop-blur-xl border border-slate-200/60 relative rounded-2xl">
          {/* Resize Handles */}
          <div className="absolute top-0 left-0 right-0 h-2 cursor-n-resize touch-none z-10" onPointerDown={(e) => onResizeStart(e, 'n')} />
          <div className="absolute bottom-0 left-0 right-0 h-2 cursor-s-resize touch-none z-10" onPointerDown={(e) => onResizeStart(e, 's')} />
          <div className="absolute top-0 bottom-0 left-0 w-2 cursor-w-resize touch-none z-10" onPointerDown={(e) => onResizeStart(e, 'w')} />
          <div className="absolute top-0 bottom-0 right-0 w-2 cursor-e-resize touch-none z-10" onPointerDown={(e) => onResizeStart(e, 'e')} />
          <div className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize touch-none z-20" onPointerDown={(e) => onResizeStart(e, 'nw')} />
          <div className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize touch-none z-20" onPointerDown={(e) => onResizeStart(e, 'ne')} />
          <div className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize touch-none z-20" onPointerDown={(e) => onResizeStart(e, 'sw')} />
          <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize touch-none z-20" onPointerDown={(e) => onResizeStart(e, 'se')} />

          {/* Header */}
          <div 
            onPointerDown={onDragStart}
            className="flex items-center justify-between p-4 border-b border-slate-200/50 bg-white/50 select-none touch-none drag-handle cursor-move"
          >
            <div className="flex items-center gap-2 text-slate-800">
              <div className="bg-indigo-100 p-1.5 rounded-lg">
                <Bot className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-base font-semibold">Asistente de IA</h2>
              <Link 
                title="Ver Historial"
                to="/registros-sistema-ia/personal" 
                target="_blank" 
                rel="noopener noreferrer"
                className="no-drag ml-1 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors flex items-center justify-center cursor-pointer"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <History className="h-4 w-4" />
              </Link>
              <div className="no-drag" onPointerDown={(e) => e.stopPropagation()}>
                <HelpButton title="Inteligencia Artificial" path="/docs/manuales/manual_ia.md" />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                title="Nueva Conversación"
                onClick={handleClearConversation}
                onPointerDown={(e) => e.stopPropagation()}
                className="no-drag p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors flex items-center justify-center cursor-pointer"
              >
                <RefreshCcw className="h-4 w-4" />
              </button>
              <button
                title="Minimizar"
                onClick={() => setIsMinimized(true)}
                onPointerDown={(e) => e.stopPropagation()}
                className="no-drag p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <Minus className="h-5 w-5" />
              </button>
              <button
                title="Cerrar"
                onClick={handleClose}
                onPointerDown={(e) => e.stopPropagation()}
                className="no-drag p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Active Context Banner */}
          {focusedContext && (
            <div className="bg-indigo-50 px-4 py-2 flex items-center justify-between border-b border-indigo-100/50 select-none">
              <div className="flex items-center gap-2 overflow-hidden text-indigo-700">
                <span className="text-xs font-semibold whitespace-nowrap shrink-0">📌 Contacto activo:</span>
                <span className="text-xs font-medium truncate">{focusedContext.name}</span>
              </div>
              <button 
                onClick={() => setFocusedContext(null)}
                className="p-1 hover:bg-indigo-100 rounded-full text-indigo-400 hover:text-indigo-600 transition-colors shrink-0"
                title="Quitar contexto"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Body / Messages List */}
          <div className="relative flex-1 min-h-0 flex flex-col bg-slate-50/50">
            <div 
              id="copilot-messages-container" 
              className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4"
              onScroll={handleScroll}
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                  <div className="bg-white p-4 rounded-full shadow-sm">
                    <Bot className="h-10 w-10 text-indigo-200" />
                  </div>
                  <p className="text-sm font-medium">¿En qué te puedo ayudar hoy?</p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => {
                    if (msg.role === 'assistant' && !msg.content) {
                      return (
                        <div key={msg.id} className="flex gap-3">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 shadow-sm border border-white">
                            <Bot className="h-4 w-4" />
                          </div>
                          <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-2 rounded-tl-none">
                            <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                            <span className="text-sm text-slate-500 font-medium animate-pulse">Pensando...</span>
                          </div>
                        </div>
                      );
                    }
                    return <ChatMessageItem key={msg.id} msg={msg} isHighlighted={msg.id === msgIdToHighlight} />;
                  })}
                  {isTyping && messages[messages.length - 1]?.role !== 'assistant' && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 shadow-sm border border-white">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-2 rounded-tl-none">
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                        <span className="text-sm text-slate-500 font-medium animate-pulse">Pensando...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
            {showScrollButton && messages.length > 0 && (
              <button
                type="button"
                title="Ir al final"
                onClick={() => {
                  const container = document.getElementById('copilot-messages-container');
                  if (container) {
                    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
                  }
                }}
                className="absolute bottom-4 right-4 z-10 p-2 bg-white/90 backdrop-blur shadow-md rounded-full text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer border border-slate-200"
              >
                <ChevronDown className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Footer / Input */}
          <div className="p-4 border-t border-slate-200/50 bg-white/80 backdrop-blur-sm flex flex-col gap-3">
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
                {isByokExhausted && (
                  <div className="bg-amber-50 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-sm border border-amber-200">
                    <ShieldAlert className="h-5 w-5 text-amber-500 mb-1" />
                    <p className="text-xs font-bold text-amber-900 mb-2">Tu crédito BYOK está agotado. Recarga tu cuenta para continuar.</p>
                    <Link
                      to="/configuracion/integracion-ia"
                      onClick={toggleOpen}
                      className="text-[10px] font-black uppercase tracking-wider text-amber-700 hover:text-amber-600 transition-colors bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 cursor-pointer"
                    >
                      Configurar IA
                    </Link>
                  </div>
                )}
                <div className="relative flex shadow-sm rounded-2xl">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isTyping || isByokExhausted}
                    placeholder={isByokExhausted ? "Crédito agotado..." : isTyping ? "La IA está escribiendo..." : "Escribe un mensaje..."}
                    className="w-full pr-20 pl-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm transition-all disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-400 resize-none h-24 overflow-y-auto"
                  />
                  <div className="absolute bottom-1.5 right-1.5 flex gap-1.5">
                    <button
                      type="button"
                      onClick={toggleListening}
                      disabled={isByokExhausted}
                      className={`cursor-pointer flex items-center justify-center p-2 rounded-full transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                        isListening 
                          ? 'bg-rose-500 text-white animate-pulse' 
                          : 'bg-slate-100 text-slate-500 hover:bg-blue-600 hover:text-white'
                      }`}
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>
                    {isTyping ? (
                      <button
                        onClick={stopGeneration}
                        className="p-2 text-white bg-rose-600 rounded-full hover:bg-rose-700 transition-colors cursor-pointer shadow-sm animate-pulse"
                        title="Detener generación"
                      >
                        <Square className="h-4 w-4 fill-current" />
                      </button>
                    ) : (
                      <button
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isByokExhausted}
                        className="p-2 text-white bg-indigo-600 rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    )}
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
    </div>
  );
};
