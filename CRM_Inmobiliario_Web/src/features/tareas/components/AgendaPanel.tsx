import React from 'react';
import { Loader2 } from 'lucide-react';
import { ComandoPanel } from './ComandoPanel';
import { buscarContactos } from '../../contactos/api/buscarContactos';
import { buscarPropiedades } from '../../propiedades/api/buscarPropiedades';
import { useTareas } from '../context/useTareas';
import { CrearTareaForm } from './CrearTareaForm';
import { EditarTareaForm } from './EditarTareaForm';
import { TareaDetalle } from './TareaDetalle';
import ConfirmModal from '../../../components/ConfirmModal';

// Hooks
import { useAgendaState } from '../hooks/useAgendaState';
import { useAgendaFilters } from '../hooks/useAgendaFilters';
import { useAgendaActions } from '../hooks/useAgendaActions';

// Sections
import { AgendaHeader } from './agenda-panel-sections/AgendaHeader';
import { AgendaTaskList } from './agenda-panel-sections/AgendaTaskList';
import { AgendaHistory } from './agenda-panel-sections/AgendaHistory';

interface AgendaPanelProps {
  onClose?: () => void;
}

export const AgendaPanel: React.FC<AgendaPanelProps> = ({ onClose }) => {
  const { tareas: allTareas, loading, refreshTareas } = useTareas();
  
  // 1. State Hook
  const {
    view,
    setView,
    selectedTareaId,
    setSelectedTareaId,
    showHistory,
    setShowHistory,
    historySearch,
    setHistorySearch,
    isConfirmingCancel,
    setIsConfirmingCancel,
    isFuturasExpanded,
    setIsFuturasExpanded,
    isComandoPanelOpen,
    setIsComandoPanelOpen,
    prefillData,
    setPrefillData,
    selectedTarea
  } = useAgendaState(allTareas);

  // 2. Filters Hook
  const {
    tareasPendientes,
    filteredHistorial,
    tareasAtrasadas,
    tareasHoy,
    tareasFuturas
  } = useAgendaFilters(allTareas, historySearch);

  // 3. Actions Hook
  const { handleCompletar, handleCancelar } = useAgendaActions({
    refreshTareas,
    setView,
    setSelectedTareaId,
    setIsConfirmingCancel
  });

  // Renderizado Condicional de Vistas
  if (view === 'create') {
    return (
      <div className="w-80 h-full border-l border-slate-100 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)]">
        <CrearTareaForm
          onSuccess={() => {
            setPrefillData(null);
            setView('list');
            refreshTareas();
          }}
          onCancel={() => {
            setPrefillData(null);
            setView('list');
          }}
          prefill={prefillData ?? undefined}
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
          onConfirm={() => handleCancelar(selectedTareaId)}
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
          onConfirm={() => handleCancelar(selectedTareaId)}
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

      <AgendaHeader 
        tareasPendientesCount={tareasPendientes.length}
        onOpenComando={() => setIsComandoPanelOpen(true)}
        onCreateTask={() => setView('create')}
        onClose={onClose}
      />

      <AgendaTaskList 
        loading={loading}
        allTareasCount={allTareas.length}
        tareasPendientes={tareasPendientes}
        tareasAtrasadas={tareasAtrasadas}
        tareasHoy={tareasHoy}
        tareasFuturas={tareasFuturas}
        isFuturasExpanded={isFuturasExpanded}
        onToggleFuturas={() => setIsFuturasExpanded(!isFuturasExpanded)}
        onComplete={handleCompletar}
        onSelectTask={(id) => {
          setSelectedTareaId(id);
          setView('detail');
        }}
        onEditTask={(id) => {
          setSelectedTareaId(id);
          setView('edit');
        }}
      />

      <AgendaHistory 
        showHistory={showHistory}
        onToggleHistory={() => setShowHistory(!showHistory)}
        historySearch={historySearch}
        onSearchChange={setHistorySearch}
        filteredHistorial={filteredHistorial}
        onSelectTask={(id) => {
          setSelectedTareaId(id);
          setView('detail');
        }}
      />

      <ComandoPanel
        isOpen={isComandoPanelOpen}
        onClose={() => setIsComandoPanelOpen(false)}
        onParsed={async (resultado) => {
          let contactoId: string | undefined;
          let contactoLabel: string | undefined;
          let propiedadId: string | undefined;
          let propiedadLabel: string | undefined;
          let lugar: string | undefined;

          if (resultado.contactoTexto) {
            try {
              const contactos = await buscarContactos(resultado.contactoTexto);
              if (contactos.length > 0) {
                contactoId = contactos[0].id;
                contactoLabel = contactos[0].nombreCompleto;
              }
            } catch (e) {
              console.error('[AsistenteParser] Error resolviendo contacto:', e);
            }
          }

          if (resultado.lugarTexto) {
            try {
              const propiedades = await buscarPropiedades(resultado.lugarTexto);
              if (propiedades.length > 0) {
                propiedadId = propiedades[0].id;
                propiedadLabel = propiedades[0].titulo;
              } else {
                lugar = resultado.lugarTexto;
              }
            } catch (e) {
              console.error('[AsistenteParser] Error resolviendo propiedad:', e);
              lugar = resultado.lugarTexto;
            }
          }

          setPrefillData({
            titulo: resultado.titulo,
            tipoTarea: resultado.tipoTarea ?? undefined,
            fechaInicio: resultado.fechaInicio,
            contactoId,
            contactoLabel,
            propiedadId,
            propiedadLabel,
            lugar,
          });
          setView('create');
        }}
      />
    </div>
  );
};
