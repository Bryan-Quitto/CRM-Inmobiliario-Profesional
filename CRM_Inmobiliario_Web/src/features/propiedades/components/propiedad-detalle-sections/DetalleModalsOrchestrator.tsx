import { AlertCircle, RotateCcw } from 'lucide-react';
import { CrearPropiedadForm } from '../CrearPropiedadForm';
import { ClosingModal } from '../ClosingModal';
import type { Propiedad } from '../../types';

interface DetalleModalsOrchestratorProps {
  propiedad: Propiedad;
  statusConfirmation: string | null;
  showEditModal: boolean;
  isClosingModalOpen: boolean;
  closingState?: string;
  showReversionModal: { type: 'transaction' | 'status', id?: string, targetStatus?: string } | null;
  setStatusConfirmation: (status: string | null) => void;
  setShowEditModal: (show: boolean) => void;
  setIsClosingModalOpen: (open: boolean) => void;
  setClosingState: (state?: string) => void;
  setShowReversionModal: (modal: { type: 'transaction' | 'status', id?: string, targetStatus?: string } | null) => void;
  handleStatusChange: (status: string, confirmed?: boolean) => void;
  handleClosingConfirm: (precioCierre: number, cerradoConId: string) => Promise<void>;
  handleRelist: (targetStatus?: string) => Promise<void>;
  handleCancelTransaction: (targetStatus?: string) => Promise<void>;
  mutate: () => void;
}

export const DetalleModalsOrchestrator = ({
  propiedad,
  statusConfirmation,
  showEditModal,
  isClosingModalOpen,
  closingState,
  showReversionModal,
  setStatusConfirmation,
  setShowEditModal,
  setIsClosingModalOpen,
  setClosingState,
  setShowReversionModal,
  handleStatusChange,
  handleClosingConfirm,
  handleRelist,
  handleCancelTransaction,
  mutate
}: DetalleModalsOrchestratorProps) => {
  return (
    <>
      {/* Modal de Limpieza por Estado */}
      {statusConfirmation && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center">
              <div className="h-20 w-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-10 w-10 text-rose-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">¿Confirmar estado {statusConfirmation}?</h3>
              <p className="text-slate-500 font-medium mb-8">Se eliminarán permanentemente <span className="text-rose-600 font-bold">todas las secciones y fotos</span>, excepto la de portada.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => setStatusConfirmation(null)} className="flex-1 px-6 py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl cursor-pointer">Cancelar</button>
                <button onClick={() => handleStatusChange(statusConfirmation, true)} className="flex-1 px-6 py-4 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-700 shadow-xl cursor-pointer">Sí, confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <CrearPropiedadForm
            initialData={propiedad}
            onSuccess={() => { mutate(); setShowEditModal(false); }}
            onCancel={() => setShowEditModal(false)}
          />
        </div>
      )}

      {/* Modal de Cierre Comercial */}
      <ClosingModal
        key={propiedad.id}
        isOpen={isClosingModalOpen}
        onClose={() => { setIsClosingModalOpen(false); setClosingState(undefined); }}
        onConfirm={handleClosingConfirm}
        mode="property"
        intendedState={closingState}
        initialData={{
          id: propiedad.id,
          titulo: propiedad.titulo,
          precio: propiedad.precio,
          operacion: propiedad.operacion
        }}
      />

      {/* Modal de Decisión Semántica (Ciclo de Vida) */}
      {showReversionModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[600] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 text-center">
              <div className="h-20 w-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <RotateCcw className="h-10 w-10 text-indigo-600" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Ciclo de Vida</h3>
              <p className="text-slate-500 font-medium mb-10 contactoing-relaxed px-4">La propiedad está marcada como cerrada. <br />¿Cómo deseas proceder con el re-listado?</p>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => handleRelist(showReversionModal.targetStatus)}
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
                  onClick={() => handleCancelTransaction(showReversionModal.targetStatus)}
                  className="group relative bg-white border-2 border-slate-100 p-6 rounded-[2rem] text-left hover:border-rose-600 transition-all hover:shadow-xl hover:shadow-rose-500/10 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                      <AlertCircle size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Cancelar (Trato Caído)</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">El contacto volverá a negociación</p>
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
