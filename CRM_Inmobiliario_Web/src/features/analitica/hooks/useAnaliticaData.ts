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

export const useAnaliticaData = (rangoActual: { inicio: Date; fin: Date }) => {
  const { data: proyeccion } = useSWR<ProyeccionAnalitica>('/analitica/proyecciones', fetcher, swrConfig);
  const { data: eficiencia } = useSWR<EficienciaAnalitica>('/analitica/eficiencia', fetcher, swrConfig);

  const actividadKey = [`/analitica/actividad`, rangoActual.inicio.toISOString(), rangoActual.fin.toISOString()];
  const { data: actividad, isValidating: loadingActividad } = useSWR<ActividadAnalitica>(
    actividadKey,
    () => fetcher('/analitica/actividad', { 
      inicio: rangoActual.inicio.toISOString(), 
      fin: rangoActual.fin.toISOString() 
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
