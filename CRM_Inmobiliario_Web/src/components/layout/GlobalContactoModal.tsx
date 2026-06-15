import { useState, useEffect } from 'react';
import { CrearContactoForm } from '../../features/contactos/components/CrearContactoForm';

export const GlobalContactoModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [contacto, setContacto] = useState<any>(null);
  const [isOwnersView, setIsOwnersView] = useState(false);

  useEffect(() => {
    const handleOpenModal = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setContacto(detail.contacto || null);
        setIsOwnersView(!!detail.isOwnersView);
        setIsOpen(true);
      }
    };
    window.addEventListener('open-crear-contacto-modal', handleOpenModal);
    return () => window.removeEventListener('open-crear-contacto-modal', handleOpenModal);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full animate-in zoom-in-95 duration-300">
        <CrearContactoForm 
          initialData={contacto}
          isOwnersView={isOwnersView}
          onSuccess={() => {
            setIsOpen(false);
            setContacto(null);
          }}
          onCancel={() => {
            setIsOpen(false);
            setContacto(null);
          }}
        />
      </div>
    </div>
  );
};
