import useSWR from 'swr';
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
}

export const useStorageHistory = () => {
  const { data, error, isLoading, mutate } = useSWR<StorageFileLog[]>('/configuracion/almacenamiento/historial');
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

