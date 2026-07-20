import { useGlobalContactoModalLogic } from '../../hooks/useGlobalContactoModalLogic';
import { GlobalContactoModalDesktop } from './GlobalContactoModalDesktop';
import { GlobalContactoModalMobile } from './GlobalContactoModalMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

export const GlobalContactoModal = () => {
  const logic = useGlobalContactoModalLogic();
  const isMobile = useIsMobile();

  if (!logic.isOpen) return null;

  return (
    <>
      {isMobile ? (
        <GlobalContactoModalMobile logic={logic} />
      ) : (
        <GlobalContactoModalDesktop logic={logic} />
      )}
    </>
  );
};
