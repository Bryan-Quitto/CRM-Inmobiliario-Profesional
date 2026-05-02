import { 
  Type, 
  AlignLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Briefcase, 
  ChevronLeft, 
  Pencil,
  Phone,
  Home,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  User,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Tarea } from '../types';

interface Props {
  tarea: Tarea;
  onEdit: () => void;
  onCancelTask: () => void;
  onBack: () => void;
}

const TIPO_ICONOS = {
  'Llamada': Phone,
  'Visita': MapPin,
  'Reunión': Users,
  'Trámite': Briefcase
};

const TIPO_COLORES = {
  'Llamada': 'text-blue-600 bg-blue-50',
  'Visita': 'text-emerald-600 bg-emerald-50',
  'Reunión': 'text-purple-600 bg-purple-50',
  'Trámite': 'text-amber-600 bg-amber-50'
};

export const TareaDetalle = ({ tarea, onEdit, onCancelTask, onBack }: Props) => {
  const navigate = useNavigate();
  const Icon = TIPO_ICONOS[tarea.tipoTarea] || Clock;
  const colorClass = TIPO_COLORES[tarea.tipoTarea] || 'text-slate-600 bg-slate-50';
  const isPending = tarea.estado === 'Pendiente';

  const formatFecha = (dateStr: string) => {
    return new Intl.DateTimeFormat('es-EC', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateStr));
  };

  const handleNavigateToClient = () => {
    if (tarea.contactoId) {
      navigate(`/contactos/${tarea.contactoId}`);
    }
  };

  const handleNavigateToProperty = () => {
    if (tarea.propiedadId) {
      navigate(`/propiedades?id=${tarea.propiedadId}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300 relative overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Detalle de Tarea</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Vista rápida</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPending && (
            <>
              <button 
                onClick={onCancelTask}
                title="Cancelar Tarea"
                className="p-2.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 cursor-pointer"
              >
                <Trash2 className="h-5 w-5" />
              </button>
              <button 
                onClick={onEdit}
                title="Editar Tarea"
                className="p-2.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100 cursor-pointer"
              >
                <Pencil className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide relative z-10">
        {/* Estado y Tipo */}
        <div className="flex items-center justify-between">
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${colorClass}`}>
            {tarea.tipoTarea}
          </span>
          <div className="flex items-center gap-2">
            {tarea.estado === 'Completada' ? (
              <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Completada
              </span>
            ) : tarea.estado === 'Cancelada' ? (
              <span className="flex items-center gap-1.5 text-rose-500 font-bold text-[10px] uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full">
                <XCircle className="h-3.5 w-3.5" />
                Cancelada
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-blue-600 font-bold text-[10px] uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                <Clock className="h-3.5 w-3.5" />
                Pendiente
              </span>
            )}
          </div>
        </div>

        {/* Titulo */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-400">
            <Type className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Título</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 contactoing-tight tracking-tight">
            {tarea.titulo}
          </h3>
        </div>

        {/* Fecha */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Programación</span>
          </div>
          <p className="text-sm font-bold text-slate-700 capitalize">
            {formatFecha(tarea.fechaInicio)}
          </p>
        </div>

        {/* Descripción */}
        {tarea.descripcion && (
          <div className="space-y-2 bg-slate-50/50 p-5 rounded-3xl border border-slate-100/50">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <AlignLeft className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Descripción</span>
            </div>
            <p className="text-sm font-medium text-slate-600 contactoing-relaxed italic">
              "{tarea.descripcion}"
            </p>
          </div>
        )}

        {/* Relaciones */}
        <div className="space-y-4 pt-6 border-t border-slate-50">
          {tarea.contactoNombre && (
            <button 
              onClick={handleNavigateToClient}
              className="w-full flex items-center gap-4 group text-left hover:bg-slate-50 p-2 -m-2 rounded-2xl transition-all cursor-pointer"
            >
              <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform shadow-sm shadow-blue-100">
                <User size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  Contacto Relacionado
                  <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
                <p className="text-base font-black text-slate-900 contactoing-none mt-1 truncate">{tarea.contactoNombre}</p>
              </div>
            </button>
          )}

          {tarea.propiedadTitulo && (
            <button 
              onClick={handleNavigateToProperty}
              className="w-full flex items-center gap-4 group text-left hover:bg-slate-50 p-2 -m-2 rounded-2xl transition-all cursor-pointer"
            >
              <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform shadow-sm shadow-emerald-100">
                <Home size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  Inmueble de Interés
                  <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
                <p className="text-base font-black text-slate-900 contactoing-none mt-1 truncate">{tarea.propiedadTitulo}</p>
              </div>
            </button>
          )}

          {(tarea.lugar || tarea.propiedadDireccion) && (
            <div className="flex items-center gap-4 group">
              <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform shadow-sm shadow-amber-100">
                <MapPin size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ubicación de la Tarea</p>
                <p className="text-base font-bold text-slate-700 contactoing-tight mt-1 truncate max-w-[200px]">
                  {tarea.lugar || tarea.propiedadDireccion}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Decorative Icon */}
      <div className="absolute -right-12 -bottom-12 opacity-[0.03] pointer-events-none z-0">
        <Icon size={240} />
      </div>
    </div>
  );
};
