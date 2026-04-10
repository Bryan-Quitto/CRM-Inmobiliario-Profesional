import { useState, useMemo } from 'react';
import { useSWRConfig } from 'swr';
import { 
  Users, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Plus,
  Loader2,
  Check,
  Briefcase,
  History,
  XCircle,
  Search,
  Pencil
} from 'lucide-react';
import { completarTarea } from '../api/completarTarea';
import { cancelarTarea } from '../api/cancelarTarea';
import { useTareas } from '../context/useTareas';
import type { Tarea } from '../types';
import { CrearTareaForm } from './CrearTareaForm';
import { EditarTareaForm } from './EditarTareaForm';
import { TareaDetalle } from './TareaDetalle';
import ConfirmModal from '../../../components/ConfirmModal';
import { toast } from 'sonner';

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

const formatDateTime = (dateString: string) => {
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString)).replace('.', '');
};

const isExpired = (dateString: string) => {
  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999);
  return new Date(dateString) <= hoy;
};

interface AgendaPanelProps {
  onClose?: () => void;
}

export const AgendaPanel: React.FC<AgendaPanelProps> = ({ onClose }) => {
  const { mutate } = useSWRConfig();
  const { tareas: allTareas, loading, updateTareaEstado, refreshTareas } = useTareas();
  const [view, setView] = useState<'list' | 'create' | 'edit' | 'detail'>('list');
  const [selectedTareaId, setSelectedTareaId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [isFuturasExpanded, setIsFuturasExpanded] = useState(false);

  const selectedTarea = useMemo(() => 
    allTareas.find(t => t.id === selectedTareaId), 
  [allTareas, selectedTareaId]);

  const handleCompletar = (id: string) => {
    // FIRE AND FORGET: Actualización inmediata en el contexto local (Context API)
    updateTareaEstado(id, 'Completada');
    
    // Petición en background
    completarTarea(id).then(() => {
      // Revalidación proactiva de analíticas y dashboard (UPSP)
      mutate('/dashboard/kpis');
      mutate(key => typeof key === 'string' && key.startsWith('/analitica/'));
      
      // Esperar un momento antes de revalidar para evitar flicker
      setTimeout(() => {
        refreshTareas();
      }, 1500);
    }).catch((err) => {
      console.error('Error al completar tarea en background:', err);
      toast.error('No se pudo sincronizar la tarea');
      refreshTareas(); 
    });
  };

  const handleCancelar = () => {
    if (!selectedTareaId) return;
    const id = selectedTareaId;

    // FIRE AND FORGET: UI instantánea
    updateTareaEstado(id, 'Cancelada');
    setView('list');
    setSelectedTareaId(null);
    setIsConfirmingCancel(false);
    toast.success('Tarea cancelada correctamente');

    // Background process
    cancelarTarea(id).then(() => {
      // Revalidación proactiva de analíticas y dashboard (UPSP)
      mutate('/dashboard/kpis');
      mutate(key => typeof key === 'string' && key.startsWith('/analitica/'));

      setTimeout(() => {
        refreshTareas();
      }, 1500);
    }).catch((err) => {
      console.error('Error al cancelar tarea en background:', err);
      toast.error('No se pudo sincronizar la cancelación');
      refreshTareas();
    });
  };

  const tareasPendientes = useMemo(() => allTareas.filter(t => t.estado === 'Pendiente'), [allTareas]);
  
  const filteredHistorial = useMemo(() => 
    allTareas.filter(t => {
      const isHistory = t.estado === 'Completada' || t.estado === 'Cancelada';
      const matchesSearch = t.titulo.toLowerCase().includes(historySearch.toLowerCase());
      return isHistory && matchesSearch;
    }), 
  [allTareas, historySearch]);

  const tareasAtrasadas = useMemo(() => {
    const ahora = new Date();
    ahora.setHours(0, 0, 0, 0);
    return tareasPendientes.filter(t => new Date(t.fechaInicio) < ahora);
  }, [tareasPendientes]);

  const tareasHoy = useMemo(() => {
    const hoy = new Date();
    const inicioHoy = new Date(hoy.setHours(0, 0, 0, 0));
    const finHoy = new Date(hoy.setHours(23, 59, 59, 999));
    
    return tareasPendientes.filter(t => {
      const fecha = new Date(t.fechaInicio);
      return fecha >= inicioHoy && fecha <= finHoy;
    });
  }, [tareasPendientes]);

  const tareasFuturas = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    return tareasPendientes.filter(t => new Date(t.fechaInicio) > hoy);
  }, [tareasPendientes]);

  if (view === 'create') {
    return (
      <div className="w-80 h-full border-l border-slate-100 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)]">
        <CrearTareaForm 
          onSuccess={() => {
            setView('list');
            refreshTareas();
          }}
          onCancel={() => setView('list')}
        />
      </div>
    );
  }

  if (view === 'detail' && selectedTarea) {
    return (
      <div className="w-80 h-full border-l border-slate-100 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)]">
        <TareaDetalle 
          tarea={selectedTarea}
          onEdit={() => setView('edit')}
          onCancelTask={() => setIsConfirmingCancel(true)}
          onBack={() => setView('list')}
        />
        <ConfirmModal 
          isOpen={isConfirmingCancel}
          title="¿Cancelar Tarea?"
          description="Esta acción no se puede deshacer. La tarea quedará marcada como cancelada en el historial."
          confirmText="Sí, cancelar"
          type="danger"
          onConfirm={handleCancelar}
          onClose={() => setIsConfirmingCancel(false)}
        />
      </div>
    );
  }

  if (view === 'edit' && selectedTareaId) {
    return (
      <div className="w-80 h-full border-l border-slate-100 shadow-[-10px_0_30_px_-15px_rgba(0,0,0,0.05)]">
        <EditarTareaForm 
          tareaId={selectedTareaId}
          initialData={selectedTarea}
          onSuccess={() => {
            setView('list');
            setSelectedTareaId(null);
            refreshTareas();
          }}
          onCancel={() => {
            setView('list');
            setSelectedTareaId(null);
          }}
          onCancelTask={() => setIsConfirmingCancel(true)}
        />
        <ConfirmModal 
          isOpen={isConfirmingCancel}
          title="¿Cancelar Tarea?"
          description="Esta acción no se puede deshacer. La tarea quedará marcada como cancelada en el historial."
          confirmText="Sí, cancelar"
          type="danger"
          onConfirm={handleCancelar}
          onClose={() => setIsConfirmingCancel(false)}
        />
      </div>
    );
  }

  return (
    <div className="w-80 h-full bg-white border-l border-slate-100 flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)] animate-in fade-in slide-in-from-left duration-300 relative">
      {/* Indicador de Sincronización UPSP */}
      {loading && allTareas.length > 0 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-2 duration-300 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-xl text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 border border-white/10">
            <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">Sincronizando...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Agenda Diaria</h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
            {tareasPendientes.length} Tareas Pendientes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setView('create')}
            aria-label="Crear nueva tarea"
            className="h-8 w-8 bg-slate-900 text-white rounded-lg flex items-center justify-center hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              aria-label="Cerrar panel de agenda"
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer active:scale-95 border border-slate-100"
            >
              <XCircle className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Tareas List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide">
        {loading && allTareas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sincronizando...</p>
          </div>
        ) : tareasPendientes.length === 0 ? (
          <div className="py-20 text-center px-6">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <CheckCircle2 className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-900">¡Todo al día!</p>
            <p className="text-xs text-slate-500 mt-1 italic">No tienes tareas pendientes para mostrar.</p>
          </div>
        ) : (
          <>
            {/* Sección Atrasadas */}
            {tareasAtrasadas.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                  <span className="h-1.5 w-1.5 bg-rose-500 rounded-full animate-ping"></span>
                  <h3 className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Atrasadas ({tareasAtrasadas.length})</h3>
                </div>
                <div className="space-y-3">
                  {tareasAtrasadas.map((tarea) => (
                    <TaskCard 
                      key={tarea.id} 
                      tarea={tarea} 
                      onComplete={handleCompletar}
                      onClick={() => {
                        setSelectedTareaId(tarea.id);
                        setView('detail');
                      }}
                      onEdit={() => {
                        setSelectedTareaId(tarea.id);
                        setView('edit');
                      }}
                      isCompleting={false}
                    />
                  ))}
                </div>
              </div>
            )}

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
                      onClick={() => {
                        setSelectedTareaId(tarea.id);
                        setView('detail');
                      }}
                      onEdit={() => {
                        setSelectedTareaId(tarea.id);
                        setView('edit');
                      }}
                      isCompleting={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sección Próximamente */}
            {tareasFuturas.length > 0 && (
              <div className="space-y-4">
                <button 
                  onClick={() => setIsFuturasExpanded(!isFuturasExpanded)}
                  className="w-full flex items-center justify-between px-2 group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-slate-200 rounded-full"></span>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">
                      Próximamente ({tareasFuturas.length})
                    </h3>
                  </div>
                  <ChevronRight 
                    className={`h-3 w-3 text-slate-300 transition-transform duration-300 ${isFuturasExpanded ? 'rotate-90' : ''}`} 
                  />
                </button>
                
                {isFuturasExpanded && (
                  <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                    {tareasFuturas.map((tarea) => (
                      <TaskCard 
                        key={tarea.id} 
                        tarea={tarea} 
                        onComplete={handleCompletar}
                        onClick={() => {
                          setSelectedTareaId(tarea.id);
                          setView('detail');
                        }}
                        onEdit={() => {
                          setSelectedTareaId(tarea.id);
                          setView('edit');
                        }}
                        isCompleting={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer - Historial */}
      <div className="mt-auto border-t border-slate-100 bg-slate-50/50">
        <button 
          onClick={() => setShowHistory(!showHistory)}
          aria-label={showHistory ? "Ocultar historial de tareas" : "Mostrar historial de tareas"}
          aria-expanded={showHistory}
          className="w-full p-4 flex items-center justify-between group hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-slate-500 group-hover:text-slate-600 transition-colors" aria-hidden="true" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Historial</span>
          </div>
          <span className="bg-slate-200 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded-full">
            <span className="sr-only">Tareas en historial: </span>{filteredHistorial.length}
          </span>
        </button>

        {showHistory && (
          <div className="px-4 pb-4 animate-in slide-in-from-bottom-2 duration-300">
            {/* Buscador Historial */}
            <div className="relative mb-3">
              <label htmlFor="history-search" className="sr-only">Buscar en historial de tareas</label>
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" aria-hidden="true" />
              <input 
                id="history-search"
                type="text"
                placeholder="Buscar en historial..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
              />
            </div>

            <div className="max-h-[210px] overflow-y-auto space-y-2 scrollbar-hide pr-1">
              {filteredHistorial.length === 0 ? (
                <p className="text-[10px] text-slate-400 italic text-center py-4">No se encontraron resultados.</p>
              ) : (
                filteredHistorial.map((tarea) => (
                  <div 
                    key={tarea.id}
                    onClick={() => {
                      setSelectedTareaId(tarea.id);
                      setView('detail');
                    }}
                    className="p-3 bg-white border border-slate-100 rounded-xl opacity-60 hover:opacity-100 transition-all grayscale hover:grayscale-0 flex items-center gap-3 group cursor-pointer hover:border-blue-100 hover:shadow-sm"
                  >
                    <div className="shrink-0 h-5 w-5 flex items-center justify-center">
                      {tarea.estado === 'Completada' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[11px] font-bold text-slate-700 truncate ${tarea.estado === 'Completada' ? 'line-through' : ''}`}>
                        {tarea.titulo}
                      </p>
                      <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tighter">
                        {tarea.estado} • {formatDateTime(tarea.fechaInicio)}
                      </p>
                    </div>
                    <ChevronRight className="h-3 w-3 text-slate-300 group-hover:text-blue-400 transition-colors" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TaskCard = ({ tarea, onComplete, onClick, onEdit, isCompleting }: { 
  tarea: Tarea; 
  onComplete: (id: string) => void;
  onClick: () => void;
  onEdit: () => void;
  isCompleting: boolean;
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
      className={`group bg-white border border-slate-100 p-4 rounded-2xl transition-all duration-300 hover:shadow-xl hover:border-blue-50 relative overflow-hidden cursor-pointer ${
      tarea.estado === 'Completada' ? 'opacity-50 scale-95 translate-x-4 grayscale' : ''
    }`}>
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
          className={`shrink-0 h-6 w-6 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer active:scale-90 ${
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
