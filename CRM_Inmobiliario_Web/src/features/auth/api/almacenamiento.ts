import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import { api } from '@/lib/axios';

export interface StorageFileLog {
  id: string;
  objectKey: string;
  fileSizeBytes: number;
  targetType: string;
  targetId?: string;
  targetName?: string;
  context?: string;
  uploadedAt: string;
  isDeleted: boolean;
  deletedAt?: string;
  friendlyName: string;
}

export const useStorageHistory = (startDate?: string, endDate?: string) => {
  const query = new URLSearchParams();
  if (startDate) {
    const isISO = startDate.includes('T');
    const start = isISO ? new Date(startDate) : new Date(`${startDate}T00:00:00`);
    query.append('startDate', start.toISOString());
  }
  if (endDate) {
    const isISO = endDate.includes('T');
    const end = isISO ? new Date(endDate) : new Date(`${endDate}T23:59:59.999`);
    query.append('endDate', end.toISOString());
  }
  const queryString = query.toString() ? `?${query.toString()}` : '';

  const { data, error, isLoading, mutate } = useSWR<StorageFileLog[]>(`/configuracion/almacenamiento/historial${queryString}`);
  return {
    history: data,
    error,
    isLoading,
    mutate,
  };
};

export const deleteStorageFiles = async (logIds: string[]): Promise<void> => {
  await api.post('/configuracion/almacenamiento/eliminar', { logIds });
};

export interface GlobalStorageHistoryResponse {
  items: StorageFileLog[];
  totalCount: number;
}

export interface GlobalStorageFilters {
  search: string;
  targetType: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export const useGlobalStorageHistory = (filters: GlobalStorageFilters, limit: number = 50) => {
  const getKey = (pageIndex: number, previousPageData: GlobalStorageHistoryResponse | null) => {
    // Si llegamos al final (la página anterior trajo menos elementos que el límite o 0)
    if (previousPageData && !previousPageData.items.length) return null;

    const query = new URLSearchParams();
    query.append('limit', limit.toString());
    query.append('offset', (pageIndex * limit).toString());
    if (filters.search) query.append('search', filters.search);
    if (filters.targetType && filters.targetType !== 'Todas') query.append('targetType', filters.targetType);
    if (filters.status && filters.status !== 'Todos') query.append('status', filters.status);
    if (filters.startDate) {
      const isISO = filters.startDate.includes('T');
      const start = isISO ? new Date(filters.startDate) : new Date(`${filters.startDate}T00:00:00`);
      query.append('startDate', start.toISOString());
    }
    if (filters.endDate) {
      const isISO = filters.endDate.includes('T');
      const end = isISO ? new Date(filters.endDate) : new Date(`${filters.endDate}T23:59:59.999`);
      query.append('endDate', end.toISOString());
    }
    if (filters.sortBy) query.append('sortBy', filters.sortBy);
    if (filters.sortOrder) query.append('sortOrder', filters.sortOrder);

    return `/configuracion/almacenamiento/historial-global?${query.toString()}`;
  };

  const { data, error, isLoading, isValidating, mutate, size, setSize } = useSWRInfinite<GlobalStorageHistoryResponse>(
    getKey,
    {
      revalidateFirstPage: false,
      revalidateAll: false,
    }
  );

  const history = data ? data.flatMap(page => page.items) : [];
  const totalCount = data?.[0]?.totalCount ?? 0;
  
  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");
  const isEmpty = data?.[0]?.items.length === 0;
  const isReachingEnd =
    isEmpty || (data && data[data.length - 1]?.items.length < limit);

  return {
    history,
    totalCount,
    error,
    isLoading,
    isValidating,
    isLoadingMore,
    isReachingEnd,
    size,
    setSize,
    mutate
  };
};

