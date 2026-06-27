import { useAuditoriaGeneral } from './useAuditoriaGeneral';
import type { AuditoriaSessionResponse } from '../types/auditoria';

export interface AuditoriaSessionWithStats extends AuditoriaSessionResponse {
  totalIA: number;
  totalContacto: number;
}

export const useAuditoriaGeneralViewLogic = () => {
  const {
    sesiones,
    isLoading,
    error,
    dias,
    setDias,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    canal,
    setCanal
  } = useAuditoriaGeneral();

  const sesionesWithStats: AuditoriaSessionWithStats[] = sesiones.map(sesion => {
    const totalIA = sesion.eventos.filter(e => {
      const isAi = e.senderType?.toLowerCase() === 'ia' || e.senderType?.toLowerCase() === 'assistant';
      return isAi || e.source === 'AiAction';
    }).length;
    
    const totalContacto = sesion.eventos.filter(e => {
      if (e.source === 'AiAction') return false;
      const isAi = e.senderType?.toLowerCase() === 'ia' || e.senderType?.toLowerCase() === 'assistant';
      return !isAi && e.detalleJson;
    }).length;

    return {
      ...sesion,
      totalIA,
      totalContacto
    };
  });

  return {
    sesiones: sesionesWithStats,
    isLoading,
    error,
    dias,
    setDias,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    canal,
    setCanal
  };
};

export type AuditoriaGeneralLogic = ReturnType<typeof useAuditoriaGeneralViewLogic>;
