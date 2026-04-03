import { api } from '../../../lib/axios';
import type { ActividadAnalitica, SeguimientoAnalitica } from '../types';

export const getActividadAnalitica = async (inicio: string, fin: string): Promise<ActividadAnalitica> => {
  const response = await api.get<ActividadAnalitica>(`/analitica/actividad`, {
    params: { inicio, fin }
  });
  return response.data;
};

export const getSeguimientoAnalitica = async (): Promise<SeguimientoAnalitica> => {
  const response = await api.get<SeguimientoAnalitica>('/analitica/seguimiento');
  return response.data;
};
