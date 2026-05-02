import { CrearClienteForm } from '../CrearClienteForm';
import { ClosingModal } from '../../../propiedades/components/ClosingModal';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import type { Cliente } from '../../types';

interface ClientesListModalsProps {
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  isOwnersView: boolean;
  selectedClienteForEdit: Cliente | null;
  setSelectedClienteForEdit: (cliente: Cliente | null) => void;
  closingLead: Cliente | null;
  setClosingLead: (cliente: Cliente | null) => void;
  onClosingConfirm: (precioCierre: number, propiedadId: string, nuevoEstadoPropiedad: string) => Promise<void>;
  notification: { type: 'success' | 'error'; message: string } | null;
  setNotification: (notif: { type: 'success' | 'error'; message: string } | null) => void;
  mutate: () => void;
}

export const ClientesListModals = ({
  isCreateModalOpen,
  setIsCreateModalOpen,
  isOwnersView,
  selectedClienteForEdit,
  setSelectedClienteForEdit,
  closingLead,
  setClosingLead,
  onClosingConfirm,
  notification,
  setNotification,
  mutate
}: ClientesListModalsProps) => {
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

      {selectedClienteForEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <CrearClienteForm 
            initialData={selectedClienteForEdit}
            onSuccess={() => {
              mutate();
              setSelectedClienteForEdit(null);
              setNotification({ type: 'success', message: `${label} actualizado con éxito.` });
            }}
            onCancel={() => setSelectedClienteForEdit(null)}
          />
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <CrearClienteForm 
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
        isOpen={!!closingLead}
        onClose={() => setClosingLead(null)}
        onConfirm={onClosingConfirm}
        mode="lead"
        initialData={closingLead ? {
          id: closingLead.id,
          titulo: [closingLead.nombre, closingLead.apellido].filter(Boolean).join(' '),
          precio: 0,
          operacion: 'Venta'
        } : undefined}
      />
    </>
  );
};
