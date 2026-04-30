import React from 'react';
import { 
  Users, 
  Phone, 
  MapPin, 
  Clock, 
  Loader2,
  Check,
  Briefcase,
  Pencil
} from 'lucide-react';
import type { Tarea } from '../../types';
import { formatDateTime, isExpired } from '../../utils';

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

interface TaskCardProps {
  tarea: Tarea;
  onComplete: (id: string) => void;
  onClick: () => void;
  onEdit: () => void;
  isCompleting: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  tarea, 
  onComplete, 
  onClick, 
  onEdit, 
  isCompleting 
}) => {
  const Icon = TIPO_ICONOS[tarea.tipoTarea] || Clock;
  const colorClass = TIPO_COLORES[tarea.tipoTarea] || 'text-slate-600 bg-slate-50';
  const expired = isExpired(tarea.fechaInicio) && tarea.estado === 'Pendiente';

  return (
    <div 
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={`Tarea: ${tarea.titulo}. Tipo: ${tarea.tipoTarea}. Inicia: ${formatDateTime(tarea.fechaInicio)}. ${expired ? '¡ATRASADA!' : ''}`}
      className={`cursor-pointer group bg-white border border-slate-100 p-4 rounded-2xl transition-all duration-300 hover:shadow-xl hover:border-blue-50 relative overflow-hidden ${
        tarea.estado === 'Completada' ? 'opacity-50 scale-95 translate-x-4 grayscale' : ''
      }`}
    >
      {/* Botón de Editar en la esquina inferior izquierda */}
      {tarea.estado === 'Pendiente' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="absolute bottom-2 left-2 p-1.5 bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10 cursor-pointer"
          title="Editar Tarea"
        >
          <Pencil className="h-3 w-3" />
        </button>
      )}

      <div className="flex items-start gap-3">
        {/* Custom Checkbox */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onComplete(tarea.id);
          }}
          disabled={isCompleting}
          aria-label={`Marcar como completada: ${tarea.titulo}`}
          className={`cursor-pointer shrink-0 h-6 w-6 rounded-full border-2 transition-all flex items-center justify-center active:scale-90 ${
            isCompleting ? 'border-blue-200 bg-blue-50' : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50'
          }`}
        >
          {isCompleting ? (
            <Loader2 className="h-3 w-3 animate-spin text-blue-600" aria-hidden="true" />
          ) : (
            <Check className="h-3 w-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${colorClass}`}>
              {tarea.tipoTarea}
            </span>
            <span className={`text-[10px] font-bold ${expired ? 'text-rose-500 animate-pulse' : 'text-slate-400 italic'}`}>
              {formatDateTime(tarea.fechaInicio)}
            </span>
          </div>
          
          <h4 className={`text-sm font-black text-slate-900 truncate leading-tight transition-all ${
            tarea.estado === 'Completada' ? 'line-through text-slate-400' : ''
          }`}>
            {tarea.titulo}
          </h4>

          {/* Relaciones */}
          {(tarea.clienteNombre || tarea.propiedadTitulo || tarea.lugar) && (
            <div className="mt-2 space-y-1">
              {tarea.clienteNombre && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                  <Users className="h-3 w-3 text-slate-300" />
                  <span className="truncate">{tarea.clienteNombre}</span>
                </div>
              )}
              {tarea.propiedadTitulo && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                  <MapPin className="h-3 w-3 text-slate-300" />
                  <span className="truncate italic">{tarea.propiedadTitulo}</span>
                </div>
              )}
              {tarea.lugar && !tarea.propiedadTitulo && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                  <MapPin className="h-3 w-3 text-slate-300" />
                  <span className="truncate">{tarea.lugar}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Background decoration */}
      <div className={`absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity`}>
        <Icon className="h-12 w-12" />
      </div>
    </div>
  );
};
