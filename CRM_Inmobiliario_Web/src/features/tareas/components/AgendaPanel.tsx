import { useState, useMemo } from 'react';
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
  Check,
  Briefcase,
  History,
  XCircle,
  Search
} from 'lucide-react';
import { completarTarea } from '../api/completarTarea';
import { useTareas } from '../context/TareasContext';
import type { Tarea } from '../types';
import { CrearTareaForm } from './CrearTareaForm';
import { EditarTareaForm } from './EditarTareaForm';

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
  return new Date(dateString) < new Date();
};

export const AgendaPanel = () => {
  const { tareas: allTareas, loading, refreshTareas } = useTareas();
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedTareaId, setSelectedTareaId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  const handleCompletar = async (id: string) => {
    try {
      setCompletingId(id);
      await completarTarea(id);
      // Actualizamos el contexto global para que la campana también se entere
      await refreshTareas();
      setCompletingId(null);
    } catch (err) {
      console.error('Error al completar tarea:', err);
      setCompletingId(null);
    }
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
    return tareasPendientes.filter(t => new Date(t.fechaVencimiento) < ahora);
  }, [tareasPendientes]);

  const tareasHoy = useMemo(() => {
    const hoy = new Date();
    const inicioHoy = new Date(hoy.setHours(0, 0, 0, 0));
    const finHoy = new Date(hoy.setHours(23, 59, 59, 999));
    
    return tareasPendientes.filter(t => {
      const fecha = new Date(t.fechaVencimiento);
      return fecha >= inicioHoy && fecha <= finHoy;
    });
  }, [tareasPendientes]);

  const tareasFuturas = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    return tareasPendientes.filter(t => new Date(t.fechaVencimiento) > hoy);
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

  if (view === 'edit' && selectedTareaId) {
    return (
      <div className="w-80 h-full border-l border-slate-100 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)]">
        <EditarTareaForm 
          tareaId={selectedTareaId}
          onSuccess={() => {
            setView('list');
            setSelectedTareaId(null);
            refreshTareas();
          }}
          onCancel={() => {
            setView('list');
            setSelectedTareaId(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-80 h-full bg-white border-l border-slate-100 flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)] animate-in fade-in slide-in-from-left duration-300">
      {/* Header */}
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Agenda Diaria</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            {tareasPendientes.length} Tareas Pendientes
          </p>
        </div>
        <button 
          onClick={() => setView('create')}
          className="h-8 w-8 bg-slate-900 text-white rounded-lg flex items-center justify-center hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 cursor-pointer active:scale-95"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Tareas List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide">
        {loading && allTareas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando...</p>
          </div>
        ) : tareasPendientes.length === 0 ? (
          <div className="py-20 text-center px-6">
            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-slate-200" />
            </div>
            <p className="text-sm font-bold text-slate-900">¡Todo al día!</p>
            <p className="text-xs text-slate-400 mt-1 italic">No tienes tareas pendientes para mostrar.</p>
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
                        setView('edit');
                      }}
                      isCompleting={completingId === tarea.id}
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
                        setView('edit');
                      }}
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
                      onClick={() => {
                        setSelectedTareaId(tarea.id);
                        setView('edit');
                      }}
                      isCompleting={completingId === tarea.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer - Historial */}
      <div className="mt-auto border-t border-slate-100 bg-slate-50/50">
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="w-full p-4 flex items-center justify-between group hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Historial</span>
          </div>
          <span className="bg-slate-200 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded-full">
            {filteredHistorial.length}
          </span>
        </button>

        {showHistory && (
          <div className="px-4 pb-4 animate-in slide-in-from-bottom-2 duration-300">
            {/* Buscador Historial */}
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
              <input 
                type="text"
                placeholder="Buscar en historial..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-medium focus:ring-2 focus:ring-blue-100 outline-none transition-all"
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
                      setView('edit');
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
                        {tarea.estado} • {formatDateTime(tarea.fechaVencimiento)}
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

const TaskCard = ({ tarea, onComplete, onClick, isCompleting }: { 
  tarea: Tarea; 
  onComplete: (id: string) => void;
  onClick: () => void;
  isCompleting: boolean;
}) => {
  const Icon = TIPO_ICONOS[tarea.tipoTarea] || Clock;
  const colorClass = TIPO_COLORES[tarea.tipoTarea] || 'text-slate-600 bg-slate-50';
  const expired = isExpired(tarea.fechaVencimiento) && tarea.estado === 'Pendiente';

  return (
    <div 
      onClick={onClick}
      className={`group bg-white border border-slate-100 p-4 rounded-2xl transition-all duration-300 hover:shadow-xl hover:border-blue-50 relative overflow-hidden cursor-pointer ${
      tarea.estado === 'Completada' ? 'opacity-50 scale-95 translate-x-4 grayscale' : ''
    }`}>
      <div className="flex items-start gap-3">
        {/* Custom Checkbox */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onComplete(tarea.id);
          }}
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
              {formatDateTime(tarea.fechaVencimiento)}
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
