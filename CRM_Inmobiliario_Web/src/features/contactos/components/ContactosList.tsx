import { SWRConfig } from 'swr';
import { localStorageProvider } from '@/lib/swr';
import { useContactosListLogic } from '../hooks/useContactosListLogic';
import { ContactosListDesktop } from './ContactosListDesktop';
import { ContactosListMobile } from './ContactosListMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

const ContactosContentOrchestrator = () => {
  const logic = useContactosListLogic();
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <ContactosListMobile logic={logic} />
      ) : (
        <ContactosListDesktop logic={logic} />
      )}
    </>
  );
};

export const ContactosList = () => {
  return (
    <SWRConfig value={{ provider: localStorageProvider }}>
      <ContactosContentOrchestrator />
    </SWRConfig>
  );
};
