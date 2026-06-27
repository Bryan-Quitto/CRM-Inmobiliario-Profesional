import { useAuditoriaLogsViewLogic } from '../hooks/useAuditoriaLogsViewLogic';
import { AuditoriaLogsViewDesktop } from './AuditoriaLogsViewDesktop';
import { AuditoriaLogsViewMobile } from './AuditoriaLogsViewMobile';

export const AuditoriaLogsView = ({ canal = 'WhatsApp' }: { canal?: string }) => {
  const logic = useAuditoriaLogsViewLogic(canal);

  return (
    <>
      <div className="hidden lg:block">
        <AuditoriaLogsViewDesktop logic={logic} canal={canal} />
      </div>
      <div className="block lg:hidden">
        <AuditoriaLogsViewMobile logic={logic} canal={canal} />
      </div>
    </>
  );
};
