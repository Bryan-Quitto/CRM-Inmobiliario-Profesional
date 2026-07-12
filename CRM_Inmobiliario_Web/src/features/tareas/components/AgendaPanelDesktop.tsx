import React from 'react';
import { Loader2 } from 'lucide-react';
import { ComandoPanel } from './ComandoPanel';
import { CrearTareaForm } from './CrearTareaForm';
import { EditarTareaForm } from './EditarTareaForm';
import { TareaDetalle } from './TareaDetalle';
import ConfirmModal from '../../../components/ConfirmModal';

import { AgendaHeader } from './agenda-panel-sections/AgendaHeader';
import { AgendaToolbar } from './agenda-panel-sections/AgendaToolbar';
import { AgendaTaskList } from './agenda-panel-sections/AgendaTaskList';
import { AgendaHistory } from './agenda-panel-sections/AgendaHistory';
import type { UseAgendaPanelLogicReturn } from '../hooks/useAgendaPanelLogic';

interface AgendaPanelDesktopProps {
  logic: UseAgendaPanelLogicReturn;
  onClose?: () => void;
}

export const AgendaPanelDesktop: React.FC<AgendaPanelDesktopProps> = ({ logic, onClose }) => {
  const { allTareas, loading, state, filters, actions, handlers } = logic;
  const { view } = state;

  if (view === 'create') {
    return (
      <div className="w-80 h-full border-l border-slate-100 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)]">
        <CrearTareaForm
          onSuccess={handlers.handleSuccessCreate}
          onCancel={handlers.handleCancelCreate}
          prefill={state.prefillData ?? undefined}
        />
      </div>
    );
  }

  if (view === 'detail' && state.selectedTarea) {
    return (
      <div className="w-80 h-full border-l border-slate-100 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)]">
        <TareaDetalle 
          tarea={state.selectedTarea}
          onEdit={() => state.setView('edit')}
          onCancelTask={() => state.setIsConfirmingCancel(true)}
          onCompleteTask={handlers.handleCompletarFromDetail}
          onBack={handlers.handleBackFromDetail}
        />
        <ConfirmModal 
          isOpen={state.isConfirmingCancel}
          title="¿Cancelar Tarea?"
          description="Esta acción no se puede deshacer. La tarea quedará marcada como cancelada en el historial."
          confirmText="Sí, cancelar"
          type="danger"
          onConfirm={() => actions.handleCancelar(state.selectedTareaId)}
          onClose={() => state.setIsConfirmingCancel(false)}
        />
      </div>
    );
  }

  if (view === 'edit' && state.selectedTareaId) {
    return (
      <div className="w-80 h-full border-l border-slate-100 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)]">
        <EditarTareaForm 
          tareaId={state.selectedTareaId}
          initialData={state.selectedTarea}
          onSuccess={handlers.handleSuccessEdit}
          onCancel={handlers.handleCancelEdit}
          onCancelTask={() => state.setIsConfirmingCancel(true)}
        />
        <ConfirmModal 
          isOpen={state.isConfirmingCancel}
          title="¿Cancelar Tarea?"
          description="Esta acción no se puede deshacer. La tarea quedará marcada como cancelada en el historial."
          confirmText="Sí, cancelar"
          type="danger"
          onConfirm={() => actions.handleCancelar(state.selectedTareaId)}
          onClose={() => state.setIsConfirmingCancel(false)}
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
        tareasPendientesCount={filters.tareasPendientes.length}
        isToolbarOpen={state.isToolbarOpen}
        onToggleToolbar={() => state.setIsToolbarOpen(!state.isToolbarOpen)}
        onOpenComando={() => state.setIsComandoPanelOpen(true)}
        onCreateTask={() => state.setView('create')}
        onClose={onClose}
      />

      {state.isToolbarOpen && (
        <AgendaToolbar
          searchQuery={state.searchQuery}
          onSearchChange={state.setSearchQuery}
          filterTipos={state.filterTipos}
          onFilterTiposChange={state.setFilterTipos}
          filterColores={state.filterColores}
          onFilterColoresChange={state.setFilterColores}
          sortBy={state.sortBy}
          onSortByChange={state.setSortBy}
          sortOrder={state.sortOrder}
          onSortOrderChange={state.setSortOrder}
        />
      )}

      {!(state.showHistory && state.isHistoryToolbarOpen) && (
        <>
          <AgendaTaskList 
            loading={loading}
            allTareasCount={allTareas.length}
            tareasPendientes={filters.tareasPendientes}
            tareasAtrasadas={filters.tareasAtrasadas}
            tareasHoy={filters.tareasHoy}
            tareasFuturas={filters.tareasFuturas}
            isFuturasExpanded={state.isFuturasExpanded}
            onToggleFuturas={() => state.setIsFuturasExpanded(!state.isFuturasExpanded)}
            onComplete={actions.handleCompletar}
            onSelectTask={handlers.handleSelectTask}
            onEditTask={(id) => {
              state.setSelectedTareaId(id);
              state.setView('edit');
            }}
            onCancelTask={(id) => {
              state.setSelectedTareaId(id);
              state.setIsConfirmingCancel(true);
            }}
          />
          <ConfirmModal 
            isOpen={state.isConfirmingCancel}
            title="¿Cancelar Tarea?"
            description="Esta acción no se puede deshacer. La tarea quedará marcada como cancelada en el historial."
            confirmText="Sí, cancelar"
            type="danger"
            onConfirm={() => actions.handleCancelar(state.selectedTareaId)}
            onClose={() => state.setIsConfirmingCancel(false)}
          />
        </>
      )}

      <AgendaHistory 
        showHistory={state.showHistory}
        onToggleHistory={() => state.setShowHistory(!state.showHistory)}
        historySearch={state.historySearch}
        onSearchChange={state.setHistorySearch}
        filteredHistorial={filters.filteredHistorial}
        onSelectTask={handlers.handleSelectTask}
        historySortOrder={state.historySortOrder}
        onHistorySortOrderChange={state.setHistorySortOrder}
        historyFilterTipos={state.historyFilterTipos}
        onHistoryFilterTiposChange={state.setHistoryFilterTipos}
        historyFilterColores={state.historyFilterColores}
        onHistoryFilterColoresChange={state.setHistoryFilterColores}
        historySortBy={state.historySortBy}
        onHistorySortByChange={state.setHistorySortBy}
        isHistoryToolbarOpen={state.isHistoryToolbarOpen}
        onToggleHistoryToolbar={() => state.setIsHistoryToolbarOpen(!state.isHistoryToolbarOpen)}
      />

      <ComandoPanel
        isOpen={state.isComandoPanelOpen}
        onClose={() => state.setIsComandoPanelOpen(false)}
        onParsed={handlers.handleParsedComando}
      />
    </div>
  );
};
