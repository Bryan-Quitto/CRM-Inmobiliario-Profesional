import { useState, useMemo } from 'react';
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
  const [view, setView] = useState<AgendaView>('list');
  const [selectedTareaId, setSelectedTareaId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [isFuturasExpanded, setIsFuturasExpanded] = useState(false);
  const [isComandoPanelOpen, setIsComandoPanelOpen] = useState(false);
  const [prefillData, setPrefillData] = useState<PrefillResuelto | null>(null);

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
    selectedTarea
  };
};
