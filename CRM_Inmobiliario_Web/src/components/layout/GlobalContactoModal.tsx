import { useGlobalContactoModalLogic } from '../../hooks/useGlobalContactoModalLogic';
import { GlobalContactoModalDesktop } from './GlobalContactoModalDesktop';
import { GlobalContactoModalMobile } from './GlobalContactoModalMobile';

export const GlobalContactoModal = () => {
  const logic = useGlobalContactoModalLogic();

  if (!logic.isOpen) return null;

  return (
    <>
      <GlobalContactoModalDesktop logic={logic} />
      <GlobalContactoModalMobile logic={logic} />
    </>
  );
};
