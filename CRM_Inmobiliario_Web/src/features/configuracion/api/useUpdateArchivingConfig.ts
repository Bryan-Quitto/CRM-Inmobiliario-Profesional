import useSWR from 'swr';
import { api } from '@/lib/axios';

export interface ArchivingConfig {
  autoArchivarContactos: boolean;
  diasInactividadContactos: number;
  autoArchivarPropiedades: boolean;
  diasInactividadPropiedades: number;
}

export const useUpdateArchivingConfig = () => {
  const { data, error, isLoading, mutate } = useSWR<ArchivingConfig>(
    '/agencies/archiving-config',
    (url: string) => api.get(url).then(res => res.data)
  );

  const updateConfig = async (newConfig: ArchivingConfig) => {
    await mutate(newConfig, false);
    try {
      await api.put('/agencies/archiving-config', newConfig);
      await mutate(newConfig);
    } catch (err) {
      await mutate();
      throw err;
    }
  };

  return {
    data,
    isLoading,
    error,
    updateConfig
  };
};
