import { Bot, Mic, MicOff, X, Info } from 'lucide-react';
import { useComandoPanel } from '../hooks/useComandoPanel';
import { InstruccionesModal } from './comando-panel-sections/InstruccionesModal';
import type { ComandoParseado } from '../utils/parseComando';

interface ComandoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** Callback disparado cuando el parser produce un resultado; el componente padre abre el form pre-llenado. */
  onParsed: (resultado: ComandoParseado) => void;
}

export const ComandoPanel = ({ isOpen, onClose, onParsed }: ComandoPanelProps) => {
  const {
    comandoText,
    setComandoText,
    isListening,
    isInstruccionesOpen,
    setIsInstruccionesOpen,
    textareaRef,
    toggleListening,
    handleProcesar
  } = useComandoPanel({ isOpen, onClose, onParsed });

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel centrado */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Asistente de Agenda"
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg animate-in fade-in zoom-in-95 duration-300"
      >
        <div className="bg-white rounded-3xl shadow-2xl shadow-black/20 border border-slate-100 overflow-hidden">

          {/* Header oscuro con gradiente */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 relative">
            {/* Botón cerrar */}
            <button
              onClick={onClose}
              aria-label="Cerrar asistente"
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-4">
              {/* Ícono robot con halo animado */}
              <div className="relative shrink-0">
                <div className="absolute inset-0 bg-violet-500/30 rounded-2xl blur-md animate-pulse" />
                <div className="relative h-12 w-12 bg-gradient-to-br from-violet-500 to-violet-700 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Bot className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-black text-white tracking-tight">Asistente de Agenda</h2>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Describe tu tarea y la agendaré automáticamente
                </p>
              </div>
            </div>

            {/* Fila inferior del header: shortcuts + botón info */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-white/10 text-slate-400 text-[9px] font-black rounded border border-white/10 tracking-widest">ESC</kbd>
                <span className="text-[10px] text-slate-500">para cerrar</span>
              </div>

              {/* Botón de instrucciones */}
              <button
                id="comando-info-btn"
                type="button"
                onClick={() => setIsInstruccionesOpen(true)}
                aria-label="Ver formatos de instrucción aceptados"
                title="¿Cómo escribir mi instrucción?"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-violet-600 text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/10 hover:border-violet-500 transition-all cursor-pointer group"
              >
                <Info className="h-3 w-3 group-hover:animate-pulse" />
                ¿Cómo escribirlo?
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {/* Textarea con visualizador de dictado */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                id="comando-input"
                rows={4}
                value={comandoText}
                onChange={(e) => setComandoText(e.target.value)}
                placeholder={'Ej. "Visita con Ana García en el Apt. 4B mañana a las 10am"'}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 rounded-2xl text-sm font-medium transition-all outline-none resize-none"
              />

              {/* Indicador visual de dictado activo */}
              {isListening && (
                <div className="absolute right-4 bottom-4 flex items-end gap-1">
                  <span className="w-1 h-3 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1 h-4 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1 h-3 bg-rose-500 rounded-full animate-bounce" />
                </div>
              )}
            </div>

            {/* Indicador de estado de escucha */}
            {isListening && (
              <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-100 rounded-xl animate-in fade-in duration-200">
                <span className="h-2 w-2 bg-rose-500 rounded-full animate-ping" />
                <span className="text-[11px] font-bold text-rose-600 uppercase tracking-widest">Escuchando...</span>
              </div>
            )}

            {/* Action bar */}
            <div className="flex items-center justify-between gap-3 pt-1">
              {/* Botón de voz */}
              <button
                type="button"
                onClick={toggleListening}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-black uppercase tracking-tight transition-all active:scale-95 cursor-pointer ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-slate-100 text-slate-500 hover:bg-violet-600 hover:text-white'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="h-3.5 w-3.5" />
                    Detener
                  </>
                ) : (
                  <>
                    <Mic className="h-3.5 w-3.5" />
                    Dictar
                  </>
                )}
              </button>

              {/* Botón procesar */}
              <button
                id="comando-enviar-btn"
                type="button"
                onClick={handleProcesar}
                className="bg-violet-600 hover:bg-violet-700 text-white font-black text-sm px-6 py-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-violet-500/20 cursor-pointer"
              >
                Procesar →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de instrucciones (z-60, por encima del panel) */}
      {isInstruccionesOpen && (
        <InstruccionesModal onClose={() => setIsInstruccionesOpen(false)} />
      )}
    </>
  );
};
