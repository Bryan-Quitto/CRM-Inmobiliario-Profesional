import React, { useState } from 'react';
import { X, RefreshCcw, Send, Bot, Loader2 } from 'lucide-react';
import { useCopilotStore } from '../store/useCopilotStore';
import { useCopilotChat } from '../hooks/useCopilotChat';
import { ChatMessageItem } from './ChatMessageItem';

export const CopilotDrawer: React.FC = () => {
  const { isOpen, toggleOpen, messages, clearConversation, isTyping } = useCopilotStore();
  const { sendMessage } = useCopilotChat();
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim() || isTyping) return;
    sendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <>
      {/* Overlay to close when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={toggleOpen}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-slate-200 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2 text-slate-800">
            <Bot className="h-6 w-6 text-indigo-600" />
            <h2 className="text-lg font-semibold">Asistente de IA</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearConversation}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors flex items-center gap-2 cursor-pointer"
              title="Nueva Conversación"
            >
              <RefreshCcw className="h-4 w-4" />
              <span className="text-sm font-medium hidden sm:inline">Nueva</span>
            </button>
            <button
              onClick={toggleOpen}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body / Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
              <Bot className="h-12 w-12 text-slate-300" />
              <p className="text-sm">¿En qué te puedo ayudar hoy?</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <ChatMessageItem key={msg.id} msg={msg} />
              ))}
              {isTyping && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-slate-200 text-slate-600">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center rounded-tl-none">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer / Input */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
              placeholder={isTyping ? "La IA está escribiendo..." : "Escribe un mensaje..."}
              className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-shadow disabled:bg-slate-100 disabled:text-slate-400"
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className="absolute right-2 p-2 text-white bg-indigo-600 rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-center text-xs text-slate-400 mt-2">
            La IA puede cometer errores. Verifica la información.
          </p>
        </div>
      </aside>
    </>
  );
};
