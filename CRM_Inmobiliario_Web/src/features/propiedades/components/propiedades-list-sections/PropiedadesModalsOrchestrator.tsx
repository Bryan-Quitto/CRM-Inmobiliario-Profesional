import { lazy, Suspense } from 'react';
import { toast } from 'sonner';
import type { Propiedad } from '../../types';

// Lazy-load todos los modales: son pesados, condicionales y solo se necesitan al hacer clic
const PropiedadDetalle = lazy(() => import('../PropiedadDetalle').then(m => ({ default: m.PropiedadDetalle })));
const CrearPropiedadForm = lazy(() => import('../CrearPropiedadForm').then(m => ({ default: m.CrearPropiedadForm })));
const ClosingModal = lazy(() => import('../ClosingModal').then(m => ({ default: m.ClosingModal })));
const PropiedadStatusConfirmModal = lazy(() => import('../modals/PropiedadStatusConfirmModal').then(m => ({ default: m.PropiedadStatusConfirmModal })));
const PropiedadReversionModal = lazy(() => import('../modals/PropiedadReversionModal').then(m => ({ default: m.PropiedadReversionModal })));
const ConfirmModal = lazy(() => import('../../../../components/ConfirmModal'));

// Skeleton mínimo para modales (invisible al usuario, solo evita suspense vacío)
const ModalFallback = () => null;

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
  ownerReactivation: { id: string; nuevoEstado: string } | null;
  setOwnerReactivation: (conf: { id: string; nuevoEstado: string } | null) => void;
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
  ownerReactivation,
  setOwnerReactivation,
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
        <Suspense fallback={<ModalFallback />}>
          <PropiedadDetalle 
            id={selectedPropiedadId} 
            onClose={handleCloseDetail} 
            onCoverUpdated={(url) => handleCoverUpdate(selectedPropiedadId, url)}
          />
        </Suspense>
      )}

      {selectedPropiedadIdForEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <Suspense fallback={<ModalFallback />}>
            <CrearPropiedadForm 
              initialData={propiedades?.find(p => p.id === selectedPropiedadIdForEdit)}
              onSuccess={() => {
                import('swr').then(({ mutate: globalMutate }) => {
                  globalMutate(`/propiedades/${selectedPropiedadIdForEdit}/pdf-status`);
                });
                mutate();
                setSelectedPropiedadIdForEdit(null);
                toast.success('Propiedad actualizada con éxito');
              }}
              onCancel={() => setSelectedPropiedadIdForEdit(null)}
            />
          </Suspense>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <Suspense fallback={<ModalFallback />}>
            <CrearPropiedadForm 
              onSuccess={() => { 
                mutate(); 
                setIsModalOpen(false); 
                toast.success('Inmueble registrado correctamente.'); 
              }} 
              onCancel={() => setIsModalOpen(false)} 
            />
          </Suspense>
        </div>
      )}

      <Suspense fallback={<ModalFallback />}>
        <PropiedadStatusConfirmModal 
          isOpen={!!statusConfirmation}
          onClose={() => setStatusConfirmation(null)}
          onConfirm={handleStatusChange}
          statusConfirmation={statusConfirmation}
        />
      </Suspense>

      <Suspense fallback={<ModalFallback />}>
        <ConfirmModal
          isOpen={!!ownerReactivation}
          onClose={() => setOwnerReactivation(null)}
          onConfirm={() => {
            if (ownerReactivation) {
              handleStatusChange(ownerReactivation.id, ownerReactivation.nuevoEstado, true);
              setOwnerReactivation(null);
            }
          }}
          title="¿Reactivar Propietario?"
          description="El propietario actual está Inactivo. Al cambiar esta propiedad a Disponible, el propietario pasará a estado Activo."
          confirmText="Sí, continuar"
          cancelText="Cancelar"
          type="info"
        />
      </Suspense>

      <Suspense fallback={<ModalFallback />}>
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
      </Suspense>

      <Suspense fallback={<ModalFallback />}>
        <PropiedadReversionModal 
          isOpen={!!showReversionModal}
          onClose={() => setShowReversionModal(null)}
          onRelist={handleRelistPropiedad}
          showReversionModal={showReversionModal}
        />
      </Suspense>
    </>
  );
};
