import { api } from '@/lib/axios';
import type { Contacto } from '../types';

export interface GetContactosParams {
  page?: number;
  pageSize?: number;
  search?: string;
  estado?: string;
  segmento?: string;
  visibilidad?: string;
  origen?: string;
  estadoPropietario?: string;
  sortBy?: string;
  sortDirection?: string;
  signal?: AbortSignal;
}

export interface GetContactosResponse {
  items: Contacto[];
  totalCount: number;
  nuevos: number;
  enNegociacion: number;
}

export const getContactos = async (params?: GetContactosParams): Promise<GetContactosResponse> => {
  const start = performance.now();
  const { signal, ...restParams } = params || {};
  const { data } = await api.get<GetContactosResponse>('/contactos', { params: restParams, signal });
  const end = performance.now();
  console.log(`[API] /contactos (Frontend) tardó ${(end - start).toFixed(2)} ms con params:`, restParams);
  return data;
};
