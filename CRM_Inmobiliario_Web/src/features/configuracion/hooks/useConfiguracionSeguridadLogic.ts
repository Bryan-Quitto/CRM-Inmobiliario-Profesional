import useSWR from 'swr';
import { useAuth } from '../../auth/hooks/useAuth';
import { getLogsSeguridad } from '../api/getLogsSeguridad';

export const useConfiguracionSeguridadLogic = () => {
  const { isAdmin, isLoading: isLoadingPerfil } = useAuth();

  const { data: logs, isLoading: isLoadingLogs } = useSWR(
    isAdmin ? '/configuracion/seguridad/logs' : null,
    getLogsSeguridad,
    { keepPreviousData: true }
  );

  return {
    isAdmin,
    isLoadingPerfil,
    logs,
    isLoadingLogs,
  };
};

export type ConfiguracionSeguridadLogic = ReturnType<typeof useConfiguracionSeguridadLogic>;
