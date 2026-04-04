import { api } from '../../../lib/axios';
import type { ActividadAnalitica, SeguimientoAnalitica, ProyeccionAnalitica, EficienciaAnalitica } from '../types';

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

export const getProyeccionAnalitica = async (): Promise<ProyeccionAnalitica> => {
  const response = await api.get<ProyeccionAnalitica>('/analitica/proyecciones');
  return response.data;
};

export const getEficienciaAnalitica = async (): Promise<EficienciaAnalitica> => {
  const response = await api.get<EficienciaAnalitica>('/analitica/eficiencia');
  return response.data;
};
