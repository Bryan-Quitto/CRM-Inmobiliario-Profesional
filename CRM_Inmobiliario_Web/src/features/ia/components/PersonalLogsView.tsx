import { usePersonalLogsViewLogic } from '../hooks/usePersonalLogsViewLogic';
import { PersonalLogsViewDesktop } from './PersonalLogsViewDesktop';
import { PersonalLogsViewMobile } from './PersonalLogsViewMobile';

export const PersonalLogsView = () => {
  const logic = usePersonalLogsViewLogic();

  return (
    <>
      <div className="hidden lg:block">
        <PersonalLogsViewDesktop logic={logic} />
      </div>
      <div className="block lg:hidden">
        <PersonalLogsViewMobile logic={logic} />
      </div>
    </>
  );
};
