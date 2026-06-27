import { SWRConfig } from 'swr';
import { localStorageProvider } from '@/lib/swr';
import { useContactosListLogic } from '../hooks/useContactosListLogic';
import { ContactosListDesktop } from './ContactosListDesktop';
import { ContactosListMobile } from './ContactosListMobile';

const ContactosContentOrchestrator = () => {
  const logic = useContactosListLogic();

  return (
    <>
      <div className="hidden lg:block">
        <ContactosListDesktop logic={logic} />
      </div>
      <div className="block lg:hidden">
        <ContactosListMobile logic={logic} />
      </div>
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
