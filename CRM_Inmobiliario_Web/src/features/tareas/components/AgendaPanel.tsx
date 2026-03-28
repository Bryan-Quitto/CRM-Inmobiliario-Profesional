import { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Phone, 
  MapPin, 
  Users, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Plus,
  Loader2,
  AlertCircle,
  MoreVertical,
  Check
} from 'lucide-react';
import { getTareas } from '../api/getTareas';
import { completarTarea } from '../api/completarTarea';
import type { Tarea } from '../types';

const TIPO_ICONOS = {
  'Llamada': Phone,
  'Visita': MapPin,
  'Reunión': Users
};

const TIPO_COLORES = {
  'Llamada': 'text-blue-600 bg-blue-50',
  'Visita': 'text-emerald-600 bg-emerald-50',
  'Reunión': 'text-purple-600 bg-purple-50'
};

const formatTime = (dateString: string) => {
  return new Intl.DateTimeFormat('es-EC', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString));
};

const isExpired = (dateString: string) => {
  return new Date(dateString) < new Date();
};

export const AgendaPanel = () => {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const fetchTareas = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTareas();
      // Filtrar solo pendientes para la agenda activa
      setTareas(data.filter(t => t.estado === 'Pendiente'));
    } catch (err) {
      console.error('Error al cargar tareas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTareas();
  }, [fetchTareas]);

  const handleCompletar = async (id: string) => {
    try {
      setCompletingId(id);
      await completarTarea(id);
      // Animación local antes de remover
      setTareas(prev => prev.map(t => t.id === id ? { ...t, estado: 'Completada' as const } : t));
      setTimeout(() => {
        setTareas(prev => prev.filter(t => t.id !== id));
        setCompletingId(null);
      }, 400);
    } catch (err) {
      console.error('Error al completar tarea:', err);
      setCompletingId(null);
    }
  };

  const tareasHoy = useMemo(() => {
    const hoy = new Date();
    return tareas.filter(t => {
      const fecha = new Date(t.fechaVencimiento);
      return fecha.getDate() === hoy.getDate() && 
             fecha.getMonth() === hoy.getMonth() && 
             fecha.getFullYear() === hoy.getFullYear();
    });
  }, [tareas]);

  const tareasFuturas = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    return tareas.filter(t => new Date(t.fechaVencimiento) > hoy);
  }, [tareas]);

  return (
    <div className="w-80 h-full bg-white border-l border-slate-100 flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)]">
      {/* Header */}
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Agenda Diaria</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            {tareas.length} Tareas Pendientes
          </p>
        </div>
        <button className="h-8 w-8 bg-slate-900 text-white rounded-lg flex items-center justify-center hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 cursor-pointer active:scale-95">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Tareas List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando...</p>
          </div>
        ) : tareas.length === 0 ? (
          <div className="py-20 text-center px-6">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-slate-200" />
            </div>
            <p className="text-sm font-bold text-slate-900">¡Todo al día!</p>
            <p className="text-xs text-slate-400 mt-1 italic">No tienes tareas pendientes para mostrar.</p>
          </div>
        ) : (
          <>
            {/* Sección Hoy */}
            {tareasHoy.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <span className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-pulse"></span>
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Para Hoy</h3>
                </div>
                <div className="space-y-3">
                  {tareasHoy.map((tarea) => (
                    <TaskCard 
                      key={tarea.id} 
                      tarea={tarea} 
                      onComplete={handleCompletar}
                      isCompleting={completingId === tarea.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sección Próximamente */}
            {tareasFuturas.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <span className="h-1.5 w-1.5 bg-slate-200 rounded-full"></span>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Próximamente</h3>
                </div>
                <div className="space-y-3">
                  {tareasFuturas.map((tarea) => (
                    <TaskCard 
                      key={tarea.id} 
                      tarea={tarea} 
                      onComplete={handleCompletar}
                      isCompleting={completingId === tarea.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const TaskCard = ({ tarea, onComplete, isCompleting }: { 
  tarea: Tarea; 
  onComplete: (id: string) => void;
  isCompleting: boolean;
}) => {
  const Icon = TIPO_ICONOS[tarea.tipoTarea] || Clock;
  const colorClass = TIPO_COLORES[tarea.tipoTarea] || 'text-slate-600 bg-slate-50';
  const expired = isExpired(tarea.fechaVencimiento) && tarea.estado === 'Pendiente';

  return (
    <div className={`group bg-white border border-slate-100 p-4 rounded-2xl transition-all duration-300 hover:shadow-xl hover:border-blue-50 relative overflow-hidden ${
      tarea.estado === 'Completada' ? 'opacity-50 scale-95 translate-x-4 grayscale' : ''
    }`}>
      <div className="flex items-start gap-3">
        {/* Custom Checkbox */}
        <button 
          onClick={() => onComplete(tarea.id)}
          disabled={isCompleting}
          className={`shrink-0 h-6 w-6 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer active:scale-90 ${
            isCompleting ? 'border-blue-200 bg-blue-50' : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50'
          }`}
        >
          {isCompleting ? (
            <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
          ) : (
            <Check className="h-3 w-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${colorClass}`}>
              {tarea.tipoTarea}
            </span>
            <span className={`text-[10px] font-bold ${expired ? 'text-rose-500 animate-pulse' : 'text-slate-400 italic'}`}>
              {formatTime(tarea.fechaVencimiento)}
            </span>
          </div>
          
          <h4 className={`text-sm font-black text-slate-900 truncate leading-tight transition-all ${
            tarea.estado === 'Completada' ? 'line-through text-slate-400' : ''
          }`}>
            {tarea.titulo}
          </h4>

          {/* Relaciones */}
          {(tarea.clienteNombre || tarea.propiedadTitulo) && (
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
