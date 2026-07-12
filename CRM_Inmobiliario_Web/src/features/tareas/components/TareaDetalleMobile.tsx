import { 
  Type, 
  AlignLeft, 
  Calendar, 
  MapPin, 
  ChevronLeft, 
  Pencil,
  Home,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  User,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { TareaDetalleLogicReturn } from '../hooks/useTareaDetalleLogic';

interface Props {
  logic: TareaDetalleLogicReturn;
}

export const TareaDetalleMobile = ({ logic }: Props) => {
  const {
    tarea,
    onEdit,
    onCancelTask,
    onCompleteTask,
    onBack,
    Icon,
    colorClass,
    isPending,
    formatFecha
  } = logic;

  return (
    <div className="flex flex-col h-full w-full bg-white animate-in slide-in-from-right duration-300 relative overflow-hidden">
      {/* Header Mobile: flex-col, full width buttons */}
      <div className="w-full p-2 border-b border-slate-50 flex flex-col gap-2 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3 w-full">
          <button 
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all cursor-pointer shrink-0"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-base md:text-xl font-black text-slate-900 tracking-tight break-words">Detalle de Tarea</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5 break-words">Vista rápida</p>
          </div>
        </div>
        
        {isPending && (
          <div className="flex flex-col gap-2 w-full">
            <button 
              onClick={onCompleteTask}
              className="cursor-pointer w-full flex items-center justify-center gap-2 p-3 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all font-bold text-sm"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              Completar Tarea
            </button>
            <button 
              onClick={onEdit}
              className="cursor-pointer w-full flex items-center justify-center gap-2 p-3 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all font-bold text-sm"
            >
              <Pencil className="h-5 w-5 shrink-0" />
              Editar Tarea
            </button>
            <button 
              onClick={onCancelTask}
              className="cursor-pointer w-full flex items-center justify-center gap-2 p-3 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all font-bold text-sm"
            >
              <Trash2 className="h-5 w-5 shrink-0" />
              Cancelar Tarea
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 w-full overflow-y-auto p-2 space-y-3 scrollbar-hide relative z-10 pb-12">
        {/* Estado y Tipo Mobile */}
        <div className="flex flex-col gap-3 w-full">
          <span 
            className={`px-2 py-2 rounded-lg text-xs font-black uppercase tracking-widest self-start text-center break-words max-w-full ${!tarea.colorHex ? colorClass : ''}`}
            style={tarea.colorHex ? { backgroundColor: `${tarea.colorHex}15`, color: tarea.colorHex } : undefined}
          >
            {tarea.tipoTarea}
          </span>
          <div className="flex flex-col gap-2 w-full">
            {tarea.estado === 'Completada' ? (
              <span className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest bg-emerald-50 px-2 py-3 rounded-lg w-full break-words">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Completada
              </span>
            ) : tarea.estado === 'Cancelada' ? (
              <span className="flex items-center justify-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-widest bg-rose-50 px-2 py-3 rounded-lg w-full break-words">
                <XCircle className="h-4 w-4 shrink-0" />
                Cancelada
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest bg-blue-50 px-2 py-3 rounded-lg border border-blue-100 w-full break-words">
                <Clock className="h-4 w-4 shrink-0" />
                Pendiente
              </span>
            )}
          </div>
        </div>

        {/* Titulo Mobile */}
        <div className="space-y-2 w-full">
          <div className="flex items-center gap-2 text-slate-400 w-full">
            <Type className="h-4 w-4 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] break-words">Título</span>
          </div>
          <h3 className="text-base md:text-xl font-black text-slate-900 tracking-tight break-words">
            {tarea.titulo}
          </h3>
        </div>

        {/* Fecha Mobile */}
        <div className="space-y-2 w-full">
          <div className="flex items-center gap-2 text-slate-400 w-full">
            <Calendar className="h-4 w-4 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] break-words">Programación</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-bold text-slate-700 capitalize break-words">
              {formatFecha(tarea.fechaInicio)}
            </p>
            {tarea.duracionMinutos > 0 && (
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-1 rounded-md flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {tarea.duracionMinutos >= 60 ? (tarea.duracionMinutos % 60 === 0 ? `${tarea.duracionMinutos / 60}h` : `${Math.floor(tarea.duracionMinutos / 60)}h ${tarea.duracionMinutos % 60}m`) : `${tarea.duracionMinutos} min`}
              </span>
            )}
          </div>
        </div>

        {/* Descripción Mobile */}
        {tarea.descripcion && (
          <div className="w-full space-y-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-400 w-full">
              <AlignLeft className="h-4 w-4 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] break-words">Descripción</span>
            </div>
            <p className="text-sm font-medium text-slate-600 italic break-words">
              "{tarea.descripcion}"
            </p>
          </div>
        )}

        {/* Relaciones Mobile */}
        <div className="w-full space-y-3 pt-6 border-t border-slate-100">
          {tarea.contactoNombre && (
            <Link 
              to={`/contactos/${tarea.contactoId}`}
              className="w-full flex flex-row items-center gap-3 group text-left hover:bg-slate-50 p-2 rounded-xl transition-all cursor-pointer bg-slate-50/50 border border-slate-100"
            >
              <div className="h-10 w-10 shrink-0 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 shadow-sm shadow-blue-100">
                <User size={24} />
              </div>
              <div className="flex-1 w-full min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between gap-2 break-words w-full">
                  Contacto Relacionado
                  <ExternalLink size={14} className="text-slate-400 shrink-0" />
                </p>
                <p className="text-sm md:text-lg font-black text-slate-900 mt-1 break-words">{tarea.contactoNombre}</p>
              </div>
            </Link>
          )}

          {tarea.propiedadTitulo && (
            <Link 
              to={`/propiedades?id=${tarea.propiedadId}`}
              className="w-full flex flex-row items-center gap-3 group text-left hover:bg-slate-50 p-2 rounded-xl transition-all cursor-pointer bg-slate-50/50 border border-slate-100"
            >
              <div className="h-10 w-10 shrink-0 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 shadow-sm shadow-emerald-100 overflow-hidden">
                {tarea.propiedadImagenPortadaUrl ? (
                  <img src={tarea.propiedadImagenPortadaUrl} alt={tarea.propiedadTitulo} className="w-full h-full object-cover" />
                ) : (
                  <Home size={24} />
                )}
              </div>
              <div className="flex-1 w-full min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between gap-2 break-words w-full">
                  Inmueble de Interés
                  <ExternalLink size={14} className="text-slate-400 shrink-0" />
                </p>
                <p className="text-sm md:text-lg font-black text-slate-900 mt-1 break-words">{tarea.propiedadTitulo}</p>
              </div>
            </Link>
          )}

          {(tarea.lugar || tarea.propiedadDireccion) && (
            <div className="w-full flex flex-row items-center gap-3 bg-amber-50/30 p-2 rounded-xl border border-amber-100/50">
              <div className="h-10 w-10 shrink-0 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 shadow-sm shadow-amber-100">
                <MapPin size={24} />
              </div>
              <div className="flex-1 w-full min-w-0">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest break-words w-full">Ubicación de la Tarea</p>
                <p className="text-sm md:text-lg font-bold text-slate-800 mt-1 break-words">
                  {tarea.lugar || tarea.propiedadDireccion}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Decorative Icon */}
      <div 
        className="absolute -right-8 -bottom-8 opacity-[0.03] pointer-events-none z-0"
        style={tarea.colorHex ? { color: tarea.colorHex } : undefined}
      >
        <Icon size={160} />
      </div>
    </div>
  );
};
