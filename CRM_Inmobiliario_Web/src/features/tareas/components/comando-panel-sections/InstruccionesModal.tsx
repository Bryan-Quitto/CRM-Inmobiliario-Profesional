import { X, Info, Briefcase, Calendar, Clock, Users, MapPin, Phone } from 'lucide-react';

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

interface InstruccionesModalProps {
  onClose: () => void;
}

export const InstruccionesModal = ({ onClose }: InstruccionesModalProps) => (
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
