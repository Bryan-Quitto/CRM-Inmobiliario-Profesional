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
  isArchived?: boolean;
  signal?: AbortSignal;
}

export interface GetContactosResponse {
  items: Contacto[];
  totalCount: number;
  nuevos: number;
  enNegociacion: number;
}

export const getContactos = async (params?: GetContactosParams): Promise<GetContactosResponse> => {
  const { signal, ...restParams } = params || {};
  const { data } = await api.get<GetContactosResponse>('/contactos', { params: restParams, signal });
  return data;
};
