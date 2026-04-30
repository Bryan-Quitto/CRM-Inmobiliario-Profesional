import { toast } from 'sonner';
import { PropiedadDetalle } from '../PropiedadDetalle';
import { CrearPropiedadForm } from '../CrearPropiedadForm';
import { ClosingModal } from '../ClosingModal';
import { PropiedadStatusConfirmModal } from '../modals/PropiedadStatusConfirmModal';
import { PropiedadReversionModal } from '../modals/PropiedadReversionModal';
import type { Propiedad } from '../../types';

interface PropiedadesModalsOrchestratorProps {
  propiedades: Propiedad[];
  selectedPropiedadId: string | null;
  handleCloseDetail: () => void;
  handleCoverUpdate: (id: string, url: string) => void;
  selectedPropiedadIdForEdit: string | null;
  setSelectedPropiedadIdForEdit: (id: string | null) => void;
  mutate: () => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  setNotification: (notif: { type: 'success' | 'error'; message: string } | null) => void;
  statusConfirmation: { id: string; nuevoEstado: string } | null;
  setStatusConfirmation: (conf: { id: string; nuevoEstado: string } | null) => void;
  handleStatusChange: (id: string, nuevoEstado: string, confirmed?: boolean) => void;
  closingPropiedad: { propiedad: Propiedad; nuevoEstado: string } | null;
  setClosingPropiedad: (closing: { propiedad: Propiedad; nuevoEstado: string } | null) => void;
  handleClosingConfirm: (precio: number, id: string, tipo: string) => Promise<void>;
  showReversionModal: { type: 'status', id: string, targetStatus: string } | null;
  setShowReversionModal: (reversion: { type: 'status', id: string, targetStatus: string } | null) => void;
  handleRelistPropiedad: (id: string, reason: string, type: 'Relist' | 'Cancel') => void;
}

export const PropiedadesModalsOrchestrator = ({
  propiedades,
  selectedPropiedadId,
  handleCloseDetail,
  handleCoverUpdate,
  selectedPropiedadIdForEdit,
  setSelectedPropiedadIdForEdit,
  mutate,
  isModalOpen,
  setIsModalOpen,
  setNotification,
  statusConfirmation,
  setStatusConfirmation,
  handleStatusChange,
  closingPropiedad,
  setClosingPropiedad,
  handleClosingConfirm,
  showReversionModal,
  setShowReversionModal,
  handleRelistPropiedad
}: PropiedadesModalsOrchestratorProps) => {
  return (
    <>
      {selectedPropiedadId && (
        <PropiedadDetalle 
          id={selectedPropiedadId} 
          onClose={handleCloseDetail} 
          onCoverUpdated={(url) => handleCoverUpdate(selectedPropiedadId, url)}
        />
      )}

      {selectedPropiedadIdForEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <CrearPropiedadForm 
            initialData={propiedades?.find(p => p.id === selectedPropiedadIdForEdit)}
            onSuccess={() => {
              mutate();
              setSelectedPropiedadIdForEdit(null);
              toast.success('Propiedad actualizada con éxito');
            }}
            onCancel={() => setSelectedPropiedadIdForEdit(null)}
          />
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <CrearPropiedadForm 
            onSuccess={() => { 
              mutate(); 
              setIsModalOpen(false); 
              setNotification({ type: 'success', message: 'Inmueble registrado correctamente.' }); 
            }} 
            onCancel={() => setIsModalOpen(false)} 
          />
        </div>
      )}

      <PropiedadStatusConfirmModal 
        isOpen={!!statusConfirmation}
        onClose={() => setStatusConfirmation(null)}
        onConfirm={handleStatusChange}
        statusConfirmation={statusConfirmation}
      />

      <ClosingModal
        key={closingPropiedad?.propiedad.id || 'closed'}
        isOpen={!!closingPropiedad}
        onClose={() => setClosingPropiedad(null)}
        onConfirm={handleClosingConfirm}
        mode="property"
        intendedState={closingPropiedad?.nuevoEstado}
        initialData={closingPropiedad ? {
          id: closingPropiedad.propiedad.id,
          titulo: closingPropiedad.propiedad.titulo,
          precio: closingPropiedad.propiedad.precio,
          operacion: closingPropiedad.propiedad.operacion
        } : undefined}
      />

      <PropiedadReversionModal 
        isOpen={!!showReversionModal}
        onClose={() => setShowReversionModal(null)}
        onRelist={handleRelistPropiedad}
        showReversionModal={showReversionModal}
      />
    </>
  );
};
