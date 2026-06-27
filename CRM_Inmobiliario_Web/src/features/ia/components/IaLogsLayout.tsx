import { useIaLogsLayoutLogic } from '../hooks/useIaLogsLayoutLogic';
import { IaLogsLayoutDesktop } from './IaLogsLayoutDesktop';
import { IaLogsLayoutMobile } from './IaLogsLayoutMobile';

export const IaLogsLayout = () => {
  const logic = useIaLogsLayoutLogic();

  return (
    <>
      <div className="hidden lg:block">
        <IaLogsLayoutDesktop logic={logic} />
      </div>
      <div className="block lg:hidden">
        <IaLogsLayoutMobile logic={logic} />
      </div>
    </>
  );
};
