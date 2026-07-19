import React from 'react';
import { X, RefreshCcw, Send, Bot, Loader2, ShieldAlert, ChevronDown, Mic, MicOff, History, Square } from 'lucide-react';
import { ChatMessageItem } from './ChatMessageItem';
import { Link } from 'react-router-dom';
import ConfirmModal from '@/components/ConfirmModal';
import { HelpButton } from '../../../components/ui/HelpButton';
import { useCopilotDrawerLogic } from '../hooks/useCopilotDrawerLogic';
import { TruncatedText } from '@/components/ui/TruncatedText';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';

export const CopilotDrawerMobile: React.FC<{ logic: ReturnType<typeof useCopilotDrawerLogic> }> = ({ logic }) => {
  const {
    isOpen,
    isMinimized,
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
    toggleOpen,
    showScrollButton,
    handleScroll
  } = logic;
  const { canWrite } = useSubscriptionGuard();

  if (!isOpen || isMinimized) return null;

  return (
    <div className="block lg:hidden fixed inset-0 z-50 flex flex-col bg-white w-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white shadow-sm w-full min-w-0">
        <div className="flex items-center gap-2 text-slate-800 min-w-0">
          <div className="bg-indigo-100 p-1.5 rounded-lg shrink-0">
            <Bot className="h-5 w-5 text-indigo-600" />
          </div>
          <TruncatedText as="h2" className="text-base font-semibold truncate">Asistente de IA</TruncatedText>
          <Link 
            title="Ver Historial"
            to="/registros-sistema-ia/personal" 
            className="ml-1 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors flex items-center justify-center cursor-pointer shrink-0"
          >
            <History className="h-4 w-4" />
          </Link>
          <div className="shrink-0">
            <HelpButton title="Inteligencia Artificial" path="/docs/manuales/manual_ia.md#personal" />
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            title="Nueva Conversación"
            onClick={handleClearConversation}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors flex items-center justify-center cursor-pointer shrink-0"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
          <button
            title="Cerrar"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Active Context Banner */}
      {focusedContext && (
        <div className="bg-indigo-50 px-4 py-2 flex items-center justify-between border-b border-indigo-100/50 select-none w-full min-w-0">
          <div className="flex items-center gap-2 overflow-hidden text-indigo-700 min-w-0">
            <span className="text-xs font-semibold whitespace-nowrap shrink-0">📌 Contacto activo:</span>
            <TruncatedText as="span" className="text-xs font-medium truncate">{focusedContext.name}</TruncatedText>
          </div>
          <button 
            onClick={() => setFocusedContext(null)}
            className="cursor-pointer p-1 hover:bg-indigo-100 rounded-full text-indigo-400 hover:text-indigo-600 transition-colors shrink-0"
            title="Quitar contexto"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Body / Messages List */}
      <div 
        id="copilot-messages-container-mobile"
        className="flex-1 min-h-0 min-w-0 overflow-y-auto p-4 space-y-4 bg-slate-50 relative w-full"
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4 w-full min-w-0">
            <div className="bg-white p-4 rounded-full shadow-sm shrink-0">
              <Bot className="h-10 w-10 text-indigo-200" />
            </div>
            <p className="text-sm font-medium text-center break-words min-w-0 w-full px-4">¿En qué te puedo ayudar hoy?</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              if (msg.role === 'assistant' && !msg.content) {
                return (
                  <div key={msg.id} className="flex gap-3 w-full">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 shadow-sm border border-white">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-2 rounded-tl-none min-w-0 break-words">
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-500 shrink-0" />
                      <span className="text-sm text-slate-500 font-medium animate-pulse break-words min-w-0">Pensando...</span>
                    </div>
                  </div>
                );
              }
              return <ChatMessageItem key={msg.id} msg={msg} isHighlighted={msg.id === msgIdToHighlight} />;
            })}
            {isTyping && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-3 w-full">
                <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 shadow-sm border border-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center gap-2 rounded-tl-none min-w-0 break-words">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-500 shrink-0" />
                  <span className="text-sm text-slate-500 font-medium animate-pulse break-words min-w-0">Pensando...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
        
        {showScrollButton && messages.length > 0 && (
          <button
            type="button"
            title="Ir al final"
            onClick={() => {
              const container = document.getElementById('copilot-messages-container-mobile');
              if (container) {
                container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
              }
            }}
            className="fixed bottom-32 right-4 z-10 p-2 bg-white/90 shadow-md rounded-full text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer border border-slate-200"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Footer / Input (Pinned to bottom) */}
      <div className="p-4 border-t border-slate-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] w-full min-w-0 shrink-0 flex flex-col gap-3">
        {!canWrite ? (
          <div className="bg-slate-900 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg border border-slate-800 w-full min-w-0 break-words">
            <ShieldAlert className="h-5 w-5 text-rose-500 mb-2 shrink-0" />
            <p className="text-sm font-bold text-white mb-2 w-full break-words">Suscripción Expirada</p>
            <p className="text-xs text-slate-300">Renueva tu suscripción para utilizar el Asistente de IA.</p>
          </div>
        ) : !isPersonalAiEnabled ? (
          <div className="bg-slate-900 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg border border-slate-800 w-full min-w-0 break-words">
            <ShieldAlert className="h-5 w-5 text-orange-500 mb-2 shrink-0" />
            <p className="text-sm font-bold text-white mb-2 w-full break-words">La IA del Sistema está desactivada.</p>
            <Link
              to="/configuracion/integracion-ia"
              onClick={toggleOpen}
              className="cursor-pointer text-[11px] font-black uppercase tracking-wider text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20 w-full text-center break-words min-w-0"
            >
              Actívala en Configuración
            </Link>
          </div>
        ) : isLimitReached ? (
          <div className="bg-slate-900 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg border border-slate-800 w-full min-w-0 break-words">
            <ShieldAlert className="h-5 w-5 text-red-500 mb-2 shrink-0" />
            <p className="text-sm font-bold text-white mb-2 w-full break-words">Límite diario alcanzado.</p>
            <div className="flex flex-col gap-2 w-full mt-2 min-w-0">
              <Link
                to="/configuracion/integracion-ia"
                onClick={toggleOpen}
                className="cursor-pointer text-[11px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 w-full text-center break-words min-w-0"
              >
                Aumentar Límite
              </Link>
              <button
                onClick={() => setIsResetModalOpen(true)}
                className="cursor-pointer text-[11px] font-black uppercase tracking-wider text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20 w-full text-center break-words min-w-0"
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
                  className="cursor-pointer text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 text-center"
                >
                  Configurar IA
                </Link>
              </div>
            )}
            <div className="relative flex shadow-sm rounded-2xl w-full min-w-0">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping || isByokExhausted}
                placeholder={isByokExhausted ? "Crédito agotado..." : isTyping ? "La IA está escribiendo..." : "Escribe un mensaje..."}
                className="w-full pr-20 pl-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-400 resize-none h-20 overflow-y-auto"
              />
              <div className="absolute bottom-1.5 right-1.5 flex gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={isByokExhausted}
                  className={`cursor-pointer flex items-center justify-center p-2 rounded-full transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                    isListening 
                      ? 'bg-rose-500 text-white animate-pulse' 
                      : 'bg-slate-100 text-slate-500'
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
                    className="cursor-pointer p-2 text-white bg-indigo-600 rounded-full hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-center text-[10px] text-slate-400 mt-2 font-medium w-full min-w-0 break-words">
              La IA puede cometer errores. Verifica la información.
            </p>
          </>
        )}
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
