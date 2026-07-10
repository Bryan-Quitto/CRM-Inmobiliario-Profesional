import { useMemo, useState } from 'react';
import type { DropResult } from '@hello-pangea/dnd';
import { ESTADOS, ESTADOS_PROPIETARIO } from '../constants/contactos';
import type { Contacto } from '../types';

export interface UseContactosKanbanLogicProps {
  contactos: Contacto[];
  activeSegment: 'clientes' | 'propietarios' | 'todos';
  onStageChange: (id: string, nuevoEstado: string, tipo?: 'contacto' | 'propietario') => void;
}

export const useContactosKanbanLogic = ({ contactos, activeSegment, onStageChange }: UseContactosKanbanLogicProps) => {
  const [collapsedColumns, setCollapsedColumns] = useState<string[]>([]);
  const isOwnerMode = activeSegment === 'propietarios';
  const currentEstados = isOwnerMode ? ESTADOS_PROPIETARIO : ESTADOS;

  const toggleColumn = (value: string) => {
    setCollapsedColumns(prev => 
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const columns = useMemo(() => {
    const grouped: Record<string, Contacto[]> = {};
    currentEstados.forEach(e => { grouped[e.value] = []; });
    
    contactos.forEach(contacto => {
      const etapa = isOwnerMode ? contacto.estadoPropietario : contacto.estadoEmbudo;
      if (grouped[etapa]) {
        grouped[etapa].push(contacto);
      } else {
        const defaultEtapa = currentEstados[0].value;
        if (grouped[defaultEtapa]) grouped[defaultEtapa].push(contacto);
      }
    });
    
    return grouped;
  }, [contactos, currentEstados, isOwnerMode]);

  const [reactivationModal, setReactivationModal] = useState<{isOpen: boolean, contactoId: string | null}>({isOpen: false, contactoId: null});
  const [deactivationModal, setDeactivationModal] = useState<{isOpen: boolean, contactoId: string | null}>({isOpen: false, contactoId: null});

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    


    if (!destination) {

      return;
    }
    
    if (destination.droppableId === source.droppableId && destination.index === source.index) {

      return;
    }
    
    const destId = destination.droppableId.toLowerCase();
    const sourceId = source.droppableId.toLowerCase();



    // Interceptar Inactivo -> Activo
    if (isOwnerMode && sourceId === 'inactivo' && destId === 'activo') {

      setReactivationModal({ isOpen: true, contactoId: draggableId });
      return;
    }

    // Interceptar Activo -> Inactivo
    if (isOwnerMode && sourceId !== 'inactivo' && destId === 'inactivo') {

      setDeactivationModal({ isOpen: true, contactoId: draggableId });
      return;
    }


    onStageChange(draggableId, destination.droppableId, isOwnerMode ? 'propietario' : 'contacto');
  };

  const confirmReactivation = () => {
    if (reactivationModal.contactoId) {
      onStageChange(reactivationModal.contactoId, 'Activo', 'propietario');
    }
    setReactivationModal({ isOpen: false, contactoId: null });
  };

  const cancelReactivation = () => {
    setReactivationModal({ isOpen: false, contactoId: null });
  };

  const confirmDeactivation = () => {
    if (deactivationModal.contactoId) {
      onStageChange(deactivationModal.contactoId, 'Inactivo', 'propietario');
    }
    setDeactivationModal({ isOpen: false, contactoId: null });
  };

  const cancelDeactivation = () => {
    setDeactivationModal({ isOpen: false, contactoId: null });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
    if (diffInDays === 0) return 'Hoy';
    if (diffInDays === 1) return 'Ayer';
    return `Hace ${diffInDays} d`;
  };

  const getEtapaColor = (value: string) => {
    const found = currentEstados.find(e => e.value === value);
    if (found?.color.includes('blue')) return 'border-t-blue-500 bg-blue-50/50';
    if (found?.color.includes('amber')) return 'border-t-amber-500 bg-amber-50/50';
    if (found?.color.includes('indigo')) return 'border-t-indigo-500 bg-indigo-50/50';
    if (found?.color.includes('emerald')) return 'border-t-emerald-500 bg-emerald-50/50';
    if (found?.color.includes('rose')) return 'border-t-rose-500 bg-rose-50/50';
    return 'border-t-slate-500 bg-slate-50/50';
  };

  return {
    collapsedColumns,
    currentEstados,
    columns,
    toggleColumn,
    handleDragEnd,
    formatTimeAgo,
    getEtapaColor,
    isOwnerMode,
    reactivationModal,
    confirmReactivation,
    cancelReactivation,
    deactivationModal,
    confirmDeactivation,
    cancelDeactivation
  };
};

export type ContactosKanbanLogicReturn = ReturnType<typeof useContactosKanbanLogic>;