import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Tarea } from '../types';

export type AgendaView = 'list' | 'create' | 'edit' | 'detail';

export interface PrefillResuelto {
  titulo: string;
  tipoTarea?: string;
  fechaInicio: string;
  contactoId?: string;
  contactoLabel?: string;
  propiedadId?: string;
  propiedadLabel?: string;
  lugar?: string;
}

export const useAgendaState = (allTareas: Tarea[]) => {
  const [searchParams] = useSearchParams();
  const urlTareaId = searchParams.get('tarea');

  const [view, setView] = useState<AgendaView>(urlTareaId ? 'detail' : 'list');
  const [selectedTareaId, setSelectedTareaId] = useState<string | null>(urlTareaId || null);

  // Sincronizar si la URL cambia estando el panel abierto
  useEffect(() => {
    if (urlTareaId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setView('detail');
      setSelectedTareaId(urlTareaId);
    }
  }, [urlTareaId]);

  useEffect(() => {
    const handleOpenCreateTask = () => setView('create');
    window.addEventListener('open-agenda-create-task', handleOpenCreateTask);
    return () => window.removeEventListener('open-agenda-create-task', handleOpenCreateTask);
  }, []);
  const [showHistory, setShowHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [isFuturasExpanded, setIsFuturasExpanded] = useState(false);
  const [isComandoPanelOpen, setIsComandoPanelOpen] = useState(false);
  const [prefillData, setPrefillData] = useState<PrefillResuelto | null>(null);

  // Filtros y Búsqueda
  const [isToolbarOpen, setIsToolbarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTipos, setFilterTipos] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'fechaInicio' | 'fechaCreacion'>('fechaInicio');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [historySortOrder, setHistorySortOrder] = useState<'desc' | 'asc'>('desc');

  const selectedTarea = useMemo(() => 
    allTareas.find(t => t.id === selectedTareaId), 
  [allTareas, selectedTareaId]);

  return {
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
    selectedTarea,
    isToolbarOpen,
    setIsToolbarOpen,
    searchQuery,
    setSearchQuery,
    filterTipos,
    setFilterTipos,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    historySortOrder,
    setHistorySortOrder
  };
};
