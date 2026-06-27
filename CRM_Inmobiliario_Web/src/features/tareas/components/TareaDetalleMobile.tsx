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
    formatFecha,
    handleNavigateToClient,
    handleNavigateToProperty
  } = logic;

  return (
    <div className="flex flex-col h-full w-full bg-white animate-in slide-in-from-right duration-300 relative overflow-hidden">
      {/* Header Mobile: flex-col, full width buttons */}
      <div className="w-full p-4 border-b border-slate-50 flex flex-col gap-4 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3 w-full">
          <button 
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer shrink-0"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-slate-900 tracking-tight break-words">Detalle de Tarea</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5 break-words">Vista rápida</p>
          </div>
        </div>
        
        {isPending && (
          <div className="flex flex-col gap-2 w-full">
            <button 
              onClick={onCompleteTask}
              className="w-full flex items-center justify-center gap-2 p-3 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all font-bold text-sm"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              Completar Tarea
            </button>
            <button 
              onClick={onEdit}
              className="w-full flex items-center justify-center gap-2 p-3 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all font-bold text-sm"
            >
              <Pencil className="h-5 w-5 shrink-0" />
              Editar Tarea
            </button>
            <button 
              onClick={onCancelTask}
              className="w-full flex items-center justify-center gap-2 p-3 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all font-bold text-sm"
            >
              <Trash2 className="h-5 w-5 shrink-0" />
              Cancelar Tarea
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 w-full overflow-y-auto p-4 space-y-6 scrollbar-hide relative z-10 pb-12">
        {/* Estado y Tipo Mobile */}
        <div className="flex flex-col gap-3 w-full">
          <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest self-start text-center break-words max-w-full ${colorClass}`}>
            {tarea.tipoTarea}
          </span>
          <div className="flex flex-col gap-2 w-full">
            {tarea.estado === 'Completada' ? (
              <span className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest bg-emerald-50 px-4 py-3 rounded-xl w-full break-words">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Completada
              </span>
            ) : tarea.estado === 'Cancelada' ? (
              <span className="flex items-center justify-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-widest bg-rose-50 px-4 py-3 rounded-xl w-full break-words">
                <XCircle className="h-4 w-4 shrink-0" />
                Cancelada
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest bg-blue-50 px-4 py-3 rounded-xl border border-blue-100 w-full break-words">
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
          <h3 className="text-xl font-black text-slate-900 tracking-tight break-words">
            {tarea.titulo}
          </h3>
        </div>

        {/* Fecha Mobile */}
        <div className="space-y-2 w-full">
          <div className="flex items-center gap-2 text-slate-400 w-full">
            <Calendar className="h-4 w-4 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] break-words">Programación</span>
          </div>
          <p className="text-sm font-bold text-slate-700 capitalize break-words">
            {formatFecha(tarea.fechaInicio)}
          </p>
        </div>

        {/* Descripción Mobile */}
        {tarea.descripcion && (
          <div className="w-full space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
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
            <button 
              onClick={handleNavigateToClient}
              className="w-full flex flex-row items-center gap-3 group text-left hover:bg-slate-50 p-4 rounded-2xl transition-all cursor-pointer bg-slate-50/50 border border-slate-100"
            >
              <div className="h-12 w-12 shrink-0 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm shadow-blue-100">
                <User size={24} />
              </div>
              <div className="flex-1 w-full min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between gap-2 break-words w-full">
                  Contacto Relacionado
                  <ExternalLink size={14} className="text-slate-400 shrink-0" />
                </p>
                <p className="text-lg font-black text-slate-900 mt-1 break-words">{tarea.contactoNombre}</p>
              </div>
            </button>
          )}

          {tarea.propiedadTitulo && (
            <button 
              onClick={handleNavigateToProperty}
              className="w-full flex flex-row items-center gap-3 group text-left hover:bg-slate-50 p-4 rounded-2xl transition-all cursor-pointer bg-slate-50/50 border border-slate-100"
            >
              <div className="h-12 w-12 shrink-0 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm shadow-emerald-100">
                <Home size={24} />
              </div>
              <div className="flex-1 w-full min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between gap-2 break-words w-full">
                  Inmueble de Interés
                  <ExternalLink size={14} className="text-slate-400 shrink-0" />
                </p>
                <p className="text-lg font-black text-slate-900 mt-1 break-words">{tarea.propiedadTitulo}</p>
              </div>
            </button>
          )}

          {(tarea.lugar || tarea.propiedadDireccion) && (
            <div className="w-full flex flex-row items-center gap-3 bg-amber-50/30 p-4 rounded-2xl border border-amber-100/50">
              <div className="h-12 w-12 shrink-0 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-sm shadow-amber-100">
                <MapPin size={24} />
              </div>
              <div className="flex-1 w-full min-w-0">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest break-words w-full">Ubicación de la Tarea</p>
                <p className="text-lg font-bold text-slate-800 mt-1 break-words">
                  {tarea.lugar || tarea.propiedadDireccion}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Decorative Icon */}
      <div className="absolute -right-8 -bottom-8 opacity-[0.03] pointer-events-none z-0">
        <Icon size={160} />
      </div>
    </div>
  );
};
