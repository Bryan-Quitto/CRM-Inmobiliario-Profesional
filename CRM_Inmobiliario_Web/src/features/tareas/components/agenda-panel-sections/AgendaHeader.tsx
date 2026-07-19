import React from 'react';
import { Zap, Plus, XCircle, Filter } from 'lucide-react';
import { HelpButton } from '../../../../components/ui/HelpButton';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { toast } from 'sonner';

interface AgendaHeaderProps {
  tareasPendientesCount: number;
  isToolbarOpen: boolean;
  onToggleToolbar: () => void;
  onOpenComando: () => void;
  onCreateTask: () => void;
  onClose?: () => void;
}

export const AgendaHeader: React.FC<AgendaHeaderProps> = ({
  tareasPendientesCount,
  isToolbarOpen,
  onToggleToolbar,
  onOpenComando,
  onCreateTask,
  onClose
}) => {
  const { canWrite } = useSubscriptionGuard();

  return (
    <div className="px-4 py-5 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 gap-4 overflow-hidden">
      <div className="flex items-start gap-2 min-w-0">
        <div className="shrink-0">
          <h2 className="text-base font-black text-slate-900 tracking-tight whitespace-nowrap">Agenda Diaria</h2>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 whitespace-nowrap">
            {tareasPendientesCount} Tareas Pendientes
          </p>
        </div>
        <div className="pt-0.5 shrink-0">
          <HelpButton title="Productividad y Organización" path="/docs/manuales/manual_productividad.md" />
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onToggleToolbar}
          aria-label="Alternar filtros"
          className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer ${
            isToolbarOpen 
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
              : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Filter className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          title="Comando Rápido"
          onClick={(e) => {
            if (!canWrite) {
              e.preventDefault();
              toast.warning('Tu suscripción ha vencido. Contacta al administrador para renovar.');
              return;
            }
            onOpenComando();
          }}
          aria-label="Abrir comando rápido"
          className={`h-7 w-7 bg-gradient-to-br from-violet-600 to-violet-700 text-white rounded-lg flex items-center justify-center hover:from-violet-500 hover:to-violet-600 transition-all shadow-md shadow-violet-500/20 active:scale-95 ${!canWrite ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <Zap className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button 
          onClick={(e) => {
            if (!canWrite) {
              e.preventDefault();
              toast.warning('Tu suscripción ha vencido. Contacta al administrador para renovar.');
              return;
            }
            onCreateTask();
          }}
          aria-label="Crear nueva tarea"
          className={`h-7 w-7 bg-slate-900 text-white rounded-lg flex items-center justify-center hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10 active:scale-95 ${!canWrite ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
        {onClose && (
          <button 
            onClick={onClose}
            aria-label="Cerrar panel de agenda"
            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors active:scale-95 border border-slate-100 cursor-pointer"
          >
            <XCircle className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};
