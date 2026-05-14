import { toast } from 'sonner';
import { CrearContactoForm } from '../CrearContactoForm';
import { ClosingModal } from '../../../propiedades/components/ClosingModal';
import type { Contacto } from '../../types';

interface ContactosListModalsProps {
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  isOwnersView: boolean;
  selectedContactoForEdit: Contacto | null;
  setSelectedContactoForEdit: (contacto: Contacto | null) => void;
  closingContacto: Contacto | null;
  setClosingContacto: (contacto: Contacto | null) => void;
  onClosingConfirm: (precioCierre: number, propiedadId: string, nuevoEstadoPropiedad: string) => Promise<void>;
  mutate: () => void;
}

export const ContactosListModals = ({
  isCreateModalOpen,
  setIsCreateModalOpen,
  isOwnersView,
  selectedContactoForEdit,
  setSelectedContactoForEdit,
  closingContacto,
  setClosingContacto,
  onClosingConfirm,
  mutate
}: ContactosListModalsProps) => {
  const label = 'Contacto';

  return (
    <>
      {selectedContactoForEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <CrearContactoForm 
            initialData={selectedContactoForEdit}
            onSuccess={() => {
              mutate();
              setSelectedContactoForEdit(null);
              toast.success(`${label} actualizado con éxito.`);
            }}
            onCancel={() => setSelectedContactoForEdit(null)}
          />
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <CrearContactoForm 
            isOwnersView={isOwnersView}
            onSuccess={() => { 
              mutate(); 
              setIsCreateModalOpen(false); 
              toast.success(`${label} registrado.`); 
            }} 
            onCancel={() => setIsCreateModalOpen(false)} 
          />
        </div>
      )}

      <ClosingModal 
        isOpen={!!closingContacto}
        onClose={() => setClosingContacto(null)}
        onConfirm={onClosingConfirm}
        mode="contacto"
        initialData={closingContacto ? {
          id: closingContacto.id,
          titulo: [closingContacto.nombre, closingContacto.apellido].filter(Boolean).join(' '),
          precio: 0,
          operacion: 'Venta'
        } : undefined}
      />
    </>
  );
};
