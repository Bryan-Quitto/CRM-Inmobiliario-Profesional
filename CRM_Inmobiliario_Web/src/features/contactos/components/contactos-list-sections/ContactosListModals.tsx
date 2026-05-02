import { CrearContactoForm } from '../CrearContactoForm';
import { ClosingModal } from '../../../propiedades/components/ClosingModal';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
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
  notification: { type: 'success' | 'error'; message: string } | null;
  setNotification: (notif: { type: 'success' | 'error'; message: string } | null) => void;
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
  notification,
  setNotification,
  mutate
}: ContactosListModalsProps) => {
  const label = 'Contacto';

  return (
    <>
      {notification && (
        <div className={`fixed bottom-8 right-8 z-[200] px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-bottom-10 duration-300 ${
          notification.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-rose-600 border-rose-500 text-white'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span className="font-bold text-sm tracking-tight">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 hover:bg-black/10 rounded-lg p-1 transition-all cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {selectedContactoForEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <CrearContactoForm 
            initialData={selectedContactoForEdit}
            onSuccess={() => {
              mutate();
              setSelectedContactoForEdit(null);
              setNotification({ type: 'success', message: `${label} actualizado con éxito.` });
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
              setNotification({ type: 'success', message: `${label} registrado.` }); 
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
