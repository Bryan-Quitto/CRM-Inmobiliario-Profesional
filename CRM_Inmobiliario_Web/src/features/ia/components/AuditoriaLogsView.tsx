import { useAuditoriaLogsViewLogic } from '../hooks/useAuditoriaLogsViewLogic';
import { AuditoriaLogsViewDesktop } from './AuditoriaLogsViewDesktop';
import { AuditoriaLogsViewMobile } from './AuditoriaLogsViewMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

export const AuditoriaLogsView = ({ canal = 'WhatsApp' }: { canal?: string }) => {
  const logic = useAuditoriaLogsViewLogic(canal);
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <AuditoriaLogsViewMobile logic={logic} canal={canal} />
      ) : (
        <AuditoriaLogsViewDesktop logic={logic} canal={canal} />
      )}
    </>
  );
};
