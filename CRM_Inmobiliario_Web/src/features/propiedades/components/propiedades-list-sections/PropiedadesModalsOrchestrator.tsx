import { AlertCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { PropiedadDetalle } from '../PropiedadDetalle';
import { CrearPropiedadForm } from '../CrearPropiedadForm';
import { ClosingModal } from '../ClosingModal';
import { relistPropiedad } from '../../api/relistPropiedad';
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
  globalMutate: (key: string | ((key: unknown) => boolean)) => void;
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
  globalMutate
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

      {statusConfirmation && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center">
              <div className="h-20 w-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-10 w-10 text-rose-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                ¿Confirmar estado {statusConfirmation.nuevoEstado}?
              </h3>
              <p className="text-slate-500 font-medium leading-relaxed mb-8">
                Al marcar esta propiedad como <span className="font-bold text-slate-900">{statusConfirmation.nuevoEstado}</span>, todas las imágenes de la galería serán eliminadas permanentemente para optimizar el almacenamiento, <span className="text-rose-600 font-bold">excepto la foto de portada</span>.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setStatusConfirmation(null)}
                  className="flex-1 px-6 py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all active:scale-95 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleStatusChange(statusConfirmation.id, statusConfirmation.nuevoEstado, true)}
                  className="flex-1 px-6 py-4 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/20 active:scale-95 cursor-pointer"
                >
                  Sí, confirmar
                </button>
              </div>
            </div>
            <div className="bg-slate-50 p-4 border-t border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Esta acción es irreversible</p>
            </div>
          </div>
        </div>
      )}

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

      {showReversionModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[600] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 text-center">
              <div className="h-20 w-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <RotateCcw className="h-10 w-10 text-indigo-600" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Ciclo de Vida</h3>
              <p className="text-slate-500 font-medium mb-10 leading-relaxed px-4">
                La propiedad está marcada como cerrada. <br/>¿Cómo deseas proceder con el re-listado?
              </p>
              
              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={async () => {
                    const { id } = showReversionModal;
                    const propiedad = propiedades.find(p => p.id === id);
                    setShowReversionModal(null);
                    
                    if (!propiedad) return;

                    let isCancelled = false;
                    const commitRelist = async () => {
                      if (isCancelled) return;
                      try {
                        await relistPropiedad(id, "Fin de contrato / Relistado natural", "Relist");
                        mutate();
                        toast.success("Nuevo ciclo comercial iniciado");
                        globalMutate('/dashboard/kpis');
                        globalMutate(key => typeof key === 'string' && key.startsWith('/analitica/'));
                      } catch {
                        toast.error("Error al relistar");
                      }
                    };

                    toast.info("Relistando...", {
                      description: "Se mantendrá el historial de cierre del cliente. 5s para deshacer.",
                      action: { label: "Deshacer", onClick: () => { isCancelled = true; toast.success("Acción cancelada"); } },
                      duration: 5000,
                      onAutoClose: commitRelist,
                      onDismiss: commitRelist
                    });
                    
                    mutate(); 
                  }}
                  className="group relative bg-white border-2 border-slate-100 p-6 rounded-[2rem] text-left hover:border-indigo-600 transition-all hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <RotateCcw size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Relistar (Fin de Contrato)</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Comenzar nuevo ciclo comercial</p>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={async () => {
                    const { id } = showReversionModal;
                    const propiedad = propiedades.find(p => p.id === id);
                    setShowReversionModal(null);

                    if (!propiedad) return;

                    let isCancelled = false;
                    const commitCancel = async () => {
                      if (isCancelled) return;
                      try {
                        await relistPropiedad(id, "Operación anulada / Trato caído", "Cancel");
                        mutate();
                        toast.success("Operación cancelada con éxito");
                        globalMutate('/dashboard/kpis');
                        globalMutate(key => typeof key === 'string' && key.startsWith('/analitica/'));
                      } catch {
                        toast.error("Error al cancelar la operación");
                      }
                    };

                    toast.warning("Anulando Operación", {
                      description: "El trato se marcará como caído y el cliente revertirá a Negociación. 5s para deshacer.",
                      action: { label: "Deshacer", onClick: () => { isCancelled = true; toast.success("Acción cancelada"); } },
                      duration: 5000,
                      onAutoClose: commitCancel,
                      onDismiss: commitCancel
                    });

                    mutate(); 
                  }}
                  className="group relative bg-white border-2 border-slate-100 p-6 rounded-[2rem] text-left hover:border-rose-600 transition-all hover:shadow-xl hover:shadow-rose-500/10 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                      <AlertCircle size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Cancelar (Trato Caído)</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">El cliente volverá a negociación</p>
                    </div>
                  </div>
                </button>
              </div>

              <button 
                onClick={() => setShowReversionModal(null)} 
                className="mt-8 text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors cursor-pointer"
              >
                Volver atrás
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
