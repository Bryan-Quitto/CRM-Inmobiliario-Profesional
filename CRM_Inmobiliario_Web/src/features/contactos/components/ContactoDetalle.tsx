import { useContactoDetalle } from '../hooks/useContactoDetalle';
import { ContactoDetalleDesktop } from './ContactoDetalleDesktop';
import { ContactoDetalleMobile } from './ContactoDetalleMobile';

export const ContactoDetalle = () => {
  const logic = useContactoDetalle();

  return (
    <>
      <div className="hidden lg:block">
        <ContactoDetalleDesktop logic={logic} />
      </div>
      <div className="block lg:hidden">
        <ContactoDetalleMobile logic={logic} />
      </div>
    </>
  );
};
