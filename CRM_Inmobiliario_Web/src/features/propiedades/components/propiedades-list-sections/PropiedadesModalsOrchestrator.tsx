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
  statusConfirmation: { id: string; nuevoEstado: string } | null;
  setStatusConfirmation: (conf: { id: string; nuevoEstado: string } | null) => void;
  handleStatusChange: (id: string, nuevoEstado: string, confirmed?: boolean) => void;
  closingPropiedad: { propiedad: Propiedad; nuevoEstado: string } | null;
  setClosingPropiedad: (closing: { propiedad: Propiedad; nuevoEstado: string } | null) => void;
  handleClosingConfirm: (precio: number | null, montoReserva: number | null, id: string, agenteCerradorId: string | undefined, tipo: string) => Promise<void>;
  showReversionModal: { type: 'status', id: string, targetStatus: string, currentStatus?: string } | null;
  setShowReversionModal: (reversion: { type: 'status', id: string, targetStatus: string, currentStatus?: string } | null) => void;
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
              toast.success('Inmueble registrado correctamente.'); 
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
          precio: closingPropiedad.propiedad.estadoComercial === 'Reservada' && closingPropiedad.propiedad.precioCierre ? closingPropiedad.propiedad.precioCierre : closingPropiedad.propiedad.precio,
          operacion: closingPropiedad.propiedad.operacion,
          propietarioId: closingPropiedad.propiedad.propietarioId,
          cerradoConId: closingPropiedad.propiedad.cerradoConId,
          cerradoConNombre: closingPropiedad.propiedad.cerradoConNombre,
          estadoComercial: closingPropiedad.propiedad.estadoComercial
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
