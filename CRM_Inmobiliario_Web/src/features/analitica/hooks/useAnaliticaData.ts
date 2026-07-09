import useSWR from 'swr';
import { api } from '../../../lib/axios';
import type { 
  ActividadAnalitica, 
  ProyeccionAnalitica, 
  EficienciaAnalitica
} from '../types';

const fetcher = (url: string, params?: Record<string, unknown>) => api.get(url, { params }).then(res => res.data);

const swrConfig = { 
  dedupingInterval: 10000, 
  revalidateOnFocus: false,
  revalidateIfStale: true,
  keepPreviousData: true
};

const toLocalISOString = (date: Date) => {
  const tzo = -date.getTimezoneOffset();
  const dif = tzo >= 0 ? '+' : '-';
  const pad = (num: number) => {
      const norm = Math.floor(Math.abs(num));
      return (norm < 10 ? '0' : '') + norm;
  };
  return date.getFullYear() +
      '-' + pad(date.getMonth() + 1) +
      '-' + pad(date.getDate()) +
      'T' + pad(date.getHours()) +
      ':' + pad(date.getMinutes()) +
      ':' + pad(date.getSeconds()) +
      dif + pad(tzo / 60) +
      ':' + pad(tzo % 60);
};

export const useAnaliticaData = (rangoActual: { inicio: Date; fin: Date }) => {
  const { data: proyeccion } = useSWR<ProyeccionAnalitica>('/analitica/proyecciones', fetcher, swrConfig);
  const { data: eficiencia } = useSWR<EficienciaAnalitica>('/analitica/eficiencia', fetcher, swrConfig);

  const actividadKey = [`/analitica/actividad`, toLocalISOString(rangoActual.inicio), toLocalISOString(rangoActual.fin)];
  const { data: actividad, isValidating: loadingActividad } = useSWR<ActividadAnalitica>(
    actividadKey,
    () => fetcher('/analitica/actividad', { 
      inicio: toLocalISOString(rangoActual.inicio), 
      fin: toLocalISOString(rangoActual.fin) 
    }),
    swrConfig
  );

  return {
    proyeccion,
    eficiencia,
    actividad,
    loadingActividad,
    initialLoading: !actividad && !proyeccion
  };
};
