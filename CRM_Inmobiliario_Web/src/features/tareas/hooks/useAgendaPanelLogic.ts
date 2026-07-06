import { useCallback } from 'react';
import type { ComandoParseado } from '../utils/parseComando';
import { useSearchParams } from 'react-router-dom';
import { useTareas } from '../context/useTareas';
import { useAgendaState } from './useAgendaState';
import { useAgendaFilters } from './useAgendaFilters';
import { useAgendaActions } from './useAgendaActions';
import { getDropdownContactos } from '../../contactos/api/getDropdownContactos';
import { buscarPropiedades } from '../../propiedades/api/buscarPropiedades';

export function useAgendaPanelLogic() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { tareas: allTareas, loading, refreshTareas } = useTareas();
  
  const state = useAgendaState(allTareas);
  const filters = useAgendaFilters(
    allTareas, 
    state.historySearch, 
    state.searchQuery, 
    state.filterTipos, 
    state.sortBy, 
    state.sortOrder,
    state.historySortOrder
  );

  const actions = useAgendaActions({
    refreshTareas,
    setView: state.setView,
    setSelectedTareaId: state.setSelectedTareaId,
    setIsConfirmingCancel: state.setIsConfirmingCancel
  });

  const handleCompletarFromDetail = useCallback(() => {
    if (state.selectedTareaId) {
      actions.handleCompletar(state.selectedTareaId);
      state.setView('list');
      if (searchParams.has('tarea')) {
        searchParams.delete('tarea');
        setSearchParams(searchParams);
      }
    }
  }, [state, actions, searchParams, setSearchParams]);

  const handleBackFromDetail = useCallback(() => {
    state.setView('list');
    if (searchParams.has('tarea')) {
      searchParams.delete('tarea');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams, state]);

  const handleSelectTask = useCallback((id: string) => {
    state.setSelectedTareaId(id);
    state.setView('detail');
    searchParams.set('tarea', id);
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams, state]);

  const handleParsedComando = useCallback(async (resultado: ComandoParseado) => {
    let contactoId: string | undefined;
    let contactoLabel: string | undefined;
    let propiedadId: string | undefined;
    let propiedadLabel: string | undefined;
    let lugar: string | undefined;

    if (resultado.contactoTexto) {
      try {
        const contactos = await getDropdownContactos(resultado.contactoTexto, 'General');
        if (contactos.length > 0) {
          contactoId = contactos[0].id;
          contactoLabel = contactos[0].nombre;
        }
      } catch { /* ignore */ }
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
      } catch {

        lugar = resultado.lugarTexto;
      }
    }

    state.setPrefillData({
      titulo: resultado.titulo,
      tipoTarea: resultado.tipoTarea ?? undefined,
      fechaInicio: resultado.fechaInicio || '',
      contactoId,
      contactoLabel,
      propiedadId,
      propiedadLabel,
      lugar,
    });
    state.setView('create');
  }, [state]);

  const handleSuccessCreate = useCallback(() => {
    state.setPrefillData(null);
    state.setView('list');
    refreshTareas();
  }, [state, refreshTareas]);

  const handleCancelCreate = useCallback(() => {
    state.setPrefillData(null);
    state.setView('list');
  }, [state]);

  const handleSuccessEdit = useCallback(() => {
    state.setView('list');
    state.setSelectedTareaId(null);
    refreshTareas();
  }, [state, refreshTareas]);

  const handleCancelEdit = useCallback(() => {
    state.setView('list');
    state.setSelectedTareaId(null);
  }, [state]);

  return {
    allTareas,
    loading,
    refreshTareas,
    state,
    filters,
    actions,
    handlers: {
      handleCompletarFromDetail,
      handleBackFromDetail,
      handleSelectTask,
      handleParsedComando,
      handleSuccessCreate,
      handleCancelCreate,
      handleSuccessEdit,
      handleCancelEdit
    }
  };
}

export type UseAgendaPanelLogicReturn = ReturnType<typeof useAgendaPanelLogic>;
