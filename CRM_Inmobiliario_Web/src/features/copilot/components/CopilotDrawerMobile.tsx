import React from 'react';
import { X, RefreshCcw, Send, Bot, Loader2, ShieldAlert, ChevronDown, Mic, MicOff, History } from 'lucide-react';
import { ChatMessageItem } from './ChatMessageItem';
import { Link } from 'react-router-dom';
import ConfirmModal from '@/components/ConfirmModal';
import { useCopilotDrawerLogic } from '../hooks/useCopilotDrawerLogic';

export const CopilotDrawerMobile: React.FC<{ logic: ReturnType<typeof useCopilotDrawerLogic> }> = ({ logic }) => {
  const {
    isOpen,
    isMinimized,
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
    toggleOpen
  } = logic;

  if (!isOpen || isMinimized) return null;

  return (
    <div className="block lg:hidden fixed inset-0 z-50 flex flex-col bg-white w-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white shadow-sm w-full min-w-0">
        <div className="flex items-center gap-2 text-slate-800 min-w-0">
          <div className="bg-indigo-100 p-1.5 rounded-lg shrink-0">
            <Bot className="h-5 w-5 text-indigo-600" />
          </div>
          <h2 className="text-base font-semibold truncate">Asistente de IA</h2>
          <Link 
            title="Ver Historial"
            to="/registros-sistema-ia/personal" 
            className="ml-1 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors flex items-center justify-center cursor-pointer shrink-0"
          >
            <History className="h-4 w-4" />
          </Link>
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

      {/* Body / Messages List */}
      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto p-4 space-y-4 bg-slate-50 relative w-full">
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
        
        {messages.length > 0 && (
          <button
            title="Ir al final"
            onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="fixed bottom-32 right-4 z-10 p-2 bg-white/90 shadow-md rounded-full text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer border border-slate-200"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Footer / Input (Pinned to bottom) */}
      <div className="p-4 border-t border-slate-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] w-full min-w-0 shrink-0">
        {!isPersonalAiEnabled ? (
          <div className="bg-slate-900 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg border border-slate-800 w-full min-w-0 break-words">
            <ShieldAlert className="h-5 w-5 text-orange-500 mb-2 shrink-0" />
            <p className="text-sm font-bold text-white mb-2 w-full break-words">La IA del Sistema está desactivada.</p>
            <Link
              to="/configuracion/integracion-ia"
              onClick={toggleOpen}
              className="text-[11px] font-black uppercase tracking-wider text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20 w-full text-center break-words min-w-0"
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
                className="text-[11px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 w-full text-center break-words min-w-0"
              >
                Aumentar Límite
              </Link>
              <button
                onClick={() => setIsResetModalOpen(true)}
                className="text-[11px] font-black uppercase tracking-wider text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20 w-full text-center break-words min-w-0"
              >
                Reiniciar Contador
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative flex shadow-sm rounded-2xl w-full min-w-0">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping}
                placeholder={isTyping ? "La IA está escribiendo..." : "Escribe un mensaje..."}
                className="w-full pr-20 pl-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:bg-slate-50 disabled:text-slate-400 placeholder:text-slate-400 resize-none h-20 overflow-y-auto"
              />
              <div className="absolute bottom-1.5 right-1.5 flex gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`flex items-center justify-center p-2 rounded-full transition-all active:scale-95 shadow-sm ${
                    isListening 
                      ? 'bg-rose-500 text-white animate-pulse' 
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isTyping}
                  className="p-2 text-white bg-indigo-600 rounded-full hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
                >
                  <Send className="h-4 w-4" />
                </button>
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
