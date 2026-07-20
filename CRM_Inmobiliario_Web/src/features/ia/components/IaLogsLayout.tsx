import { useIaLogsLayoutLogic } from '../hooks/useIaLogsLayoutLogic';
import { IaLogsLayoutDesktop } from './IaLogsLayoutDesktop';
import { IaLogsLayoutMobile } from './IaLogsLayoutMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

export const IaLogsLayout = () => {
  const logic = useIaLogsLayoutLogic();
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <IaLogsLayoutMobile logic={logic} />
      ) : (
        <IaLogsLayoutDesktop logic={logic} />
      )}
    </>
  );
};
