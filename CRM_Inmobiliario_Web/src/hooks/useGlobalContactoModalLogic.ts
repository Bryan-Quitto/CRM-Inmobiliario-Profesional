import { useState, useEffect } from 'react';

export interface LogicProps {
  isOpen: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contacto: any;
  isOwnersView: boolean;
  close: () => void;
}

export const useGlobalContactoModalLogic = (): LogicProps => {
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

  const close = () => {
    setIsOpen(false);
    setContacto(null);
  };

  return {
    isOpen,
    contacto,
    isOwnersView,
    close
  };
};
