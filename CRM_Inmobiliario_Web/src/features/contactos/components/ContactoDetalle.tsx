import { useContactoDetalle } from '../hooks/useContactoDetalle';
import { ContactoDetalleDesktop } from './ContactoDetalleDesktop';
import { ContactoDetalleMobile } from './ContactoDetalleMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

export const ContactoDetalle = () => {
  const logic = useContactoDetalle();
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <ContactoDetalleMobile logic={logic} />
      ) : (
        <ContactoDetalleDesktop logic={logic} />
      )}
    </>
  );
};
