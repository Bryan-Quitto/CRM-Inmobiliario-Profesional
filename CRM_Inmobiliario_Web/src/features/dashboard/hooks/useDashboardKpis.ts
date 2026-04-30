import { useMemo } from 'react';
import useSWR from 'swr';
import { getDashboardKpis } from '../api/getDashboardKpis';
import { swrDefaultConfig } from '@/lib/swr';
import type { DashboardKpis } from '../types';

// Definición del orden lógico del embudo para una visualización coherente
const ORDEN_EMBUDO: Record<string, number> = {
  'Nuevo': 1,
  'Calificado': 2,
  'En Negociación': 3,
  'Propuesta': 4,
  'Cierre': 5,
  'Ganado': 6,
  'Perdido': 7
};

export const useDashboardKpis = () => {
  const { data: rawData, isValidating: syncing } = useSWR<DashboardKpis>(
    '/dashboard/kpis', 
    getDashboardKpis, 
    swrDefaultConfig
  );

  const data = useMemo(() => {
    if (!rawData) return null;

    const normalizar = (str: string) => 
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

    const mapaNormalizado: Record<string, number> = {};
    Object.entries(ORDEN_EMBUDO).forEach(([key, val]) => {
      mapaNormalizado[normalizar(key)] = val;
    });

    const embudoOrdenado = [...rawData.embudoVentas].sort((a, b) => {
      const pesoA = mapaNormalizado[normalizar(a.etapa)] || 99;
      const pesoB = mapaNormalizado[normalizar(b.etapa)] || 99;
      return pesoA - pesoB; 
    });

    return { ...rawData, embudoVentas: embudoOrdenado };
  }, [rawData]);

  return { data, syncing };
};
