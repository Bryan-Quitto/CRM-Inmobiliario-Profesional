import React from 'react';
import type { Contacto } from '../types';
import { useContactosKanbanLogic } from '../hooks/useContactosKanbanLogic';
import { ContactosKanbanDesktop } from './ContactosKanbanDesktop';
import { ContactosKanbanMobile } from './ContactosKanbanMobile';

interface ContactosKanbanProps {
  contactos: Contacto[];
  activeSegment: 'clientes' | 'propietarios' | 'todos';
  onStageChange: (id: string, nuevoEstado: string, tipo?: 'contacto' | 'propietario') => void;
}

export const ContactosKanban: React.FC<ContactosKanbanProps> = (props) => {
  const logic = useContactosKanbanLogic(props);

  return (
    <>
      <div className="hidden lg:block w-full">
        <ContactosKanbanDesktop logic={logic} />
      </div>
      <div className="block lg:hidden w-full">
        <ContactosKanbanMobile logic={logic} />
      </div>
    </>
  );
};
