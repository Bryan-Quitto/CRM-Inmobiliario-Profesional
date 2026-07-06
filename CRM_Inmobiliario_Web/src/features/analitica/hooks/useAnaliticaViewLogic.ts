import { useState } from 'react';
import { useAnaliticaState } from './useAnaliticaState';
import { useAnaliticaData } from './useAnaliticaData';

export const useAnaliticaViewLogic = () => {
  const {
    mesSeleccionado,
    semanaIndice,
    setSemanaIndice,
    showMesDropdown,
    setShowMesDropdown,
    semanasDelMes,
    rangoActual
  } = useAnaliticaState();

  const {
    proyeccion,
    eficiencia,
    actividad,
    loadingActividad,
    initialLoading
  } = useAnaliticaData(rangoActual);

  const [expandedCard, setExpandedCard] = useState<'proyeccion' | 'velocidad' | 'tasa' | null>(null);
  const [activeModal, setActiveModal] = useState<'visitas' | 'cierres' | 'ofertas' | 'captaciones' | 'auditoria-velocidad' | null>(null);

  const formattedRange = `${rangoActual.inicio.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${rangoActual.fin.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;

  return {
    state: {
      mesSeleccionado,
      semanaIndice,
      showMesDropdown,
      semanasDelMes,
      rangoActual,
      formattedRange,
      expandedCard,
      activeModal
    },
    actions: {
      setSemanaIndice,
      setShowMesDropdown,
      setExpandedCard,
      setActiveModal
    },
    data: {
      proyeccion,
      eficiencia,
      actividad,
      loadingActividad,
      initialLoading
    }
  };
};

export type AnaliticaViewLogic = ReturnType<typeof useAnaliticaViewLogic>;
