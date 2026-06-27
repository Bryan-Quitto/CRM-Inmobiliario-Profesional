import { useAuditoriaLogs } from './useAuditoriaLogs';

export const useAuditoriaLogsViewLogic = (canal: string = 'WhatsApp') => {
  return useAuditoriaLogs(canal);
};

export type AuditoriaLogsViewLogic = ReturnType<typeof useAuditoriaLogsViewLogic>;
