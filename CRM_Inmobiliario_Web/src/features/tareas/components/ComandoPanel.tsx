import { useState, useEffect, useRef } from 'react';
import { Bot, Mic, MicOff, X, Info, Clock, Phone, MapPin, Users, Briefcase, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { parseComando } from '../utils/parseComando';
import type { ComandoParseado } from '../utils/parseComando';

interface ComandoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** Callback disparado cuando el parser produce un resultado; el componente padre abre el form pre-llenado. */
  onParsed: (resultado: ComandoParseado) => void;
}

// ─────────────────────────────────────────────
// Catálogo de formatos aceptados por el parser
// ─────────────────────────────────────────────
const INSTRUCCIONES = [
  {
    categoria: 'Tipos de Tarea',
    icono: Briefcase,
    color: 'text-amber-600 bg-amber-50 border-amber-100',
    ejemplos: [
      { etiqueta: 'Visita',   texto: '"Visita con [cliente] en [propiedad]..."' },
      { etiqueta: 'Llamada',  texto: '"Llamada con [cliente]..."' },
      { etiqueta: 'Reunión',  texto: '"Reunión con [cliente]..."' },
      { etiqueta: 'Trámite',  texto: '"Trámite para [propiedad]..."' },
    ]
  },
  {
    categoria: 'Cuándo — Día',
    icono: Calendar,
    color: 'text-blue-600 bg-blue-50 border-blue-100',
    ejemplos: [
      { etiqueta: 'hoy',             texto: '"...hoy a las 10am"' },
      { etiqueta: 'mañana',          texto: '"...mañana a las 3pm"' },
      { etiqueta: 'pasado mañana',   texto: '"...pasado mañana a las 9:30"' },
      { etiqueta: 'en X días',       texto: '"...en 3 días a las 11am"' },
      { etiqueta: 'día del mes',     texto: '"...el 15 de mayo a las 2pm"' },
      { etiqueta: 'día de semana',   texto: '"...el lunes a las 4 de la tarde"' },
    ]
  },
  {
    categoria: 'Cuándo — Hora',
    icono: Clock,
    color: 'text-violet-600 bg-violet-50 border-violet-100',
    ejemplos: [
      { etiqueta: 'formato 12h', texto: '"...a las 10am" / "...a las 3pm"' },
      { etiqueta: 'formato 24h', texto: '"...a las 14:30"' },
      { etiqueta: 'coloquial',   texto: '"...a las 4 de la tarde"' },
      { etiqueta: 'media hora',  texto: '"...a las 9 y media"' },
    ]
  },
  {
    categoria: 'Con quién',
    icono: Users,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    ejemplos: [
      { etiqueta: 'nombre completo', texto: '"...con Ana García..."' },
      { etiqueta: 'primer nombre',   texto: '"...con Carlos..."' },
    ]
  },
  {
    categoria: 'Dónde',
    icono: MapPin,
    color: 'text-rose-600 bg-rose-50 border-rose-100',
    ejemplos: [
      { etiqueta: 'nombre propiedad', texto: '"...en el Apt. 4B La Carolina..."' },
      { etiqueta: 'dirección',        texto: '"...en Av. Naciones Unidas..."' },
    ]
  },
  {
    categoria: 'Ejemplos Completos',
    icono: Phone,
    color: 'text-slate-600 bg-slate-50 border-slate-200',
    ejemplos: [
      { etiqueta: '→', texto: '"Visita con Ana García en el Apt. 4B mañana a las 10am"' },
      { etiqueta: '→', texto: '"Llamada con Juan Pérez el martes a las 3 de la tarde"' },
      { etiqueta: '→', texto: '"Reunión con Carlos López en 2 días a las 9:30"' },
      { etiqueta: '→', texto: '"Trámite para la propiedad Cumbayá hoy a las 11am"' },
    ]
  },
];

// ─────────────────────────────────────────────
// Sub-componente: Modal de instrucciones
// ─────────────────────────────────────────────
const InstruccionesModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <>
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      aria-hidden="true"
    />
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Formatos de instrucción aceptados"
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-full max-w-lg max-h-[85vh] animate-in fade-in zoom-in-95 duration-300 flex flex-col"
    >
      <div className="bg-white rounded-3xl shadow-2xl shadow-black/25 border border-slate-100 overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-br from-violet-700 to-violet-900 p-5 relative shrink-0">
          <button
            onClick={onClose}
            aria-label="Cerrar instrucciones"
            className="absolute top-4 right-4 p-1.5 text-violet-300 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-white/15 rounded-xl flex items-center justify-center">
              <Info className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight">Formatos Aceptados</h3>
              <p className="text-[10px] text-violet-300 font-medium mt-0.5 uppercase tracking-widest">
                Cómo describir tu tarea al asistente
              </p>
            </div>
          </div>
        </div>

        {/* Body scrollable */}
        <div className="overflow-y-auto p-5 space-y-5 scrollbar-hide">
          {INSTRUCCIONES.map((grupo) => {
            const IconoGrupo = grupo.icono;
            return (
              <div key={grupo.categoria}>
                {/* Categoría */}
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest mb-2.5 ${grupo.color}`}>
                  <IconoGrupo className="h-3 w-3" />
                  {grupo.categoria}
                </div>

                {/* Ejemplos */}
                <div className="space-y-1.5">
                  {grupo.ejemplos.map((ej) => (
                    <div key={ej.texto} className="flex items-start gap-2.5">
                      <span className="shrink-0 mt-0.5 min-w-[52px] text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">
                        {ej.etiqueta}
                      </span>
                      <span className="text-[12px] font-medium text-slate-700 italic leading-relaxed">
                        {ej.texto}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Nota al pie */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 italic text-center leading-relaxed">
              El asistente intentará reconocer variaciones naturales del lenguaje.<br />
              Si no puede interpretar un campo, te lo pedirá en el formulario.
            </p>
          </div>
        </div>
      </div>
    </div>
  </>
);

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
export const ComandoPanel: React.FC<ComandoPanelProps> = ({ isOpen, onClose, onParsed }) => {
  const [comandoText, setComandoText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isInstruccionesOpen, setIsInstruccionesOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Instancia de SpeechRecognition (misma arquitectura que CrearPropiedadForm)
  const recognitionRef = useRef<null | {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: (event: { results: { length: number; [key: number]: { length: number; [key: number]: { transcript: string } } } }) => void;
    onerror: (event: { error: string }) => void;
    onend: () => void;
    start: () => void;
    stop: () => void;
  }>(null);

  // Ref para acceder a isListening dentro de effects sin añadirlo como dependencia
  const isListeningRef = useRef(false);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);

  // Auto-focus y reset al abrir (setState diferido – evita setState síncronos dentro de effects)
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setComandoText('');
        setIsListening(false);
        setIsInstruccionesOpen(false);
        textareaRef.current?.focus();
      }, 0);
      return () => clearTimeout(timer);
    } else {
      // Detener reconocimiento si el panel se cierra mientras escucha
      if (isListeningRef.current && recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  }, [isOpen]);

  // Cerrar con Escape — cierra primero el modal de instrucciones si está abierto
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (isInstruccionesOpen) {
        setIsInstruccionesOpen(false);
      } else if (isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isInstruccionesOpen, onClose]);

  const toggleListening = () => {
    const SpeechRecognition = (window as unknown as {
      SpeechRecognition: typeof recognitionRef.current;
      webkitSpeechRecognition: typeof recognitionRef.current;
    }).SpeechRecognition || (window as unknown as {
      SpeechRecognition: typeof recognitionRef.current;
      webkitSpeechRecognition: typeof recognitionRef.current;
    }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Tu navegador no soporta el dictado por voz.');
      return;
    }

    if (!recognitionRef.current) {
      const RecognitionClass = SpeechRecognition as unknown as new () => NonNullable<typeof recognitionRef.current>;
      recognitionRef.current = new RecognitionClass();

      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'es-ES';

        recognitionRef.current.onresult = (event) => {
          const lastResultIndex = event.results.length - 1;
          const transcript = event.results[lastResultIndex][0].transcript;

          if (transcript) {
            const formatted = transcript.trim().charAt(0).toUpperCase() + transcript.trim().slice(1);
            setComandoText(prev =>
              prev ? `${prev.trim()} ${formatted}.` : `${formatted}.`
            );
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            toast.error('Permiso de micrófono denegado.');
          }
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    } else if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Error starting recognition:', e);
      }
    }
  };

  const handleProcesar = () => {
    const texto = comandoText.trim();
    if (!texto) {
      toast.error('Escribe o dicta una instrucción primero.');
      return;
    }

    const resultado = parseComando(texto);

    // Informar al usuario sobre campos que no se pudieron determinar
    if (resultado.advertencias.length > 0) {
      toast.warning('Algunos campos no se detectaron', {
        description: `Revisa en el formulario: ${resultado.advertencias.join(', ')}.`,
        duration: 4000,
      });
    } else {
      toast.success('¡Instrucción procesada!', {
        description: `"${resultado.titulo}" · ${resultado.fechaInicio.replace('T', ' ')}`,
        duration: 3000,
      });
    }

    onClose();
    // Pequeño delay para que la animación de cierre no choque con la apertura del form
    setTimeout(() => onParsed(resultado), 150);
  };

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
