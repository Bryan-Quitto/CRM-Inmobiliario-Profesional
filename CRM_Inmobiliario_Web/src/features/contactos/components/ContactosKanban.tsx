import React from 'react';
import type { Contacto } from '../types';
import { useContactosKanbanLogic } from '../hooks/useContactosKanbanLogic';
import { ContactosKanbanDesktop } from './ContactosKanbanDesktop';
import { ContactosKanbanMobile } from './ContactosKanbanMobile';

import ConfirmModal from '../../../components/ConfirmModal';
import { useIsMobile } from '@/hooks/useIsMobile';

interface ContactosKanbanProps {
  contactos: Contacto[];
  activeSegment: 'clientes' | 'propietarios' | 'todos';
  onStageChange: (id: string, nuevoEstado: string, tipo?: 'contacto' | 'propietario') => void;
}

export const ContactosKanban: React.FC<ContactosKanbanProps> = (props) => {
  const logic = useContactosKanbanLogic(props);
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <ContactosKanbanMobile logic={logic} />
      ) : (
        <ContactosKanbanDesktop logic={logic} />
      )}

      <ConfirmModal
        isOpen={logic.reactivationModal.isOpen}
        onClose={logic.cancelReactivation}
        onConfirm={logic.confirmReactivation}
        title="¿Reactivar Propietario?"
        description="Todas las propiedades actualmente inactivas de este propietario volverán a estar Disponibles en el catálogo."
        confirmText="Sí, reactivar"
        cancelText="Cancelar"
        type="info"
      />

      <ConfirmModal
        isOpen={logic.deactivationModal.isOpen}
        onClose={logic.cancelDeactivation}
        onConfirm={logic.confirmDeactivation}
        title="¿Desactivar Propietario?"
        description={
          <div className="flex flex-col gap-3 text-left">
            <p className="text-slate-600">
              Todas las propiedades de este contacto van a pasar a Inactivas. Asegúrate de que no tenga propiedades en operaciones activas (Reservada, Vendida, Alquilada) porque la acción será bloqueada por el sistema.
            </p>
            <div className="bg-red-50 text-red-600 p-3 rounded-md border border-red-200 text-sm flex flex-col gap-1 shadow-sm mt-1">
              <strong className="font-semibold flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Advertencia Crítica
              </strong>
              <span>
                A una propiedad inactiva se le borran todas sus fotos y su PDF generado. Deberás volver a pasar dicha propiedad a Disponible y generar el PDF para tenerlo nuevamente.
              </span>
            </div>
          </div> as unknown as string
        }
        confirmText="Sí, desactivar"
        cancelText="Cancelar"
        type="warning"
      />
    </>
  );
};