import { usePersonalLogsViewLogic } from '../hooks/usePersonalLogsViewLogic';
import { PersonalLogsViewDesktop } from './PersonalLogsViewDesktop';
import { PersonalLogsViewMobile } from './PersonalLogsViewMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

export const PersonalLogsView = () => {
  const logic = usePersonalLogsViewLogic();
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <PersonalLogsViewMobile logic={logic} />
      ) : (
        <PersonalLogsViewDesktop logic={logic} />
      )}
    </>
  );
};
