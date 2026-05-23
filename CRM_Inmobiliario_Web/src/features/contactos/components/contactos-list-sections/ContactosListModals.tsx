import { toast } from 'sonner';
import { RotateCcw, Check, AlertTriangle } from 'lucide-react';
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
  closingIntendedStage?: string | null;
  onClosingConfirm: (precioCierre: number | null, propiedadId: string, nuevoEstadoPropiedad: string) => Promise<void>;
  revertConfirmation: { id: string; etapa: string; nombre: string; etapaOrigen: string } | null;
  setRevertConfirmation: (revert: { id: string; etapa: string; nombre: string; etapaOrigen: string } | null) => void;
  handleRevertStatus: (id: string, etapa: string, liberar: boolean) => void;
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
  closingIntendedStage,
  onClosingConfirm,
  revertConfirmation,
  setRevertConfirmation,
  handleRevertStatus,
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
        intendedState={closingIntendedStage || undefined}
        initialData={closingContacto ? {
          id: closingContacto.id,
          titulo: [closingContacto.nombre, closingContacto.apellido].filter(Boolean).join(' '),
          precio: 0,
          operacion: closingIntendedStage === 'En Negociación' ? 'Reservada' : 'Venta'
        } : undefined}
      />

      {revertConfirmation && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[500] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6">
                <RotateCcw className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Revertir Operación</h3>
              <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                Estás moviendo a <span className="text-slate-900 font-bold">{revertConfirmation.nombre}</span> a la etapa <span className="text-blue-600 font-bold uppercase tracking-wider">{revertConfirmation.etapa}</span>.
              </p>

              <div className="space-y-4 mb-8">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        id="liberarPropList"
                        className="peer h-5 w-5 appearance-none rounded-md border-2 border-slate-200 checked:bg-indigo-600 checked:border-indigo-600 transition-all cursor-pointer"
                        defaultChecked={true}
                      />
                      <Check className="absolute h-3 w-3 text-white scale-0 peer-checked:scale-100 transition-transform left-1" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                      Volver a listar propiedades cerradas con este contacto
                    </span>
                  </label>
                </div>
                
                {revertConfirmation.etapaOrigen === 'En Negociación' && (
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 mb-6">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-amber-800 font-bold mb-1">
                        Precaución con este cambio
                      </p>
                      <p className="text-amber-700/80">
                        Si procede con el cambio, la propiedad reservada pasará a relistarse a Disponible.
                      </p>
                    </div>
                  </div>
                )}

                {revertConfirmation.etapaOrigen === 'Cerrado' && (revertConfirmation.etapa === 'Nuevo' || revertConfirmation.etapa === 'Contactado') && (
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 mb-6">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-amber-800 font-bold mb-1">
                        Precaución con este cambio
                      </p>
                      <p className="text-amber-700/80">
                        Si procede con este cambio, se asume que el contrato finalizó exitosamente, y desea relistar la propiedad Alquilada/Vendida a Disponible.
                      </p>
                    </div>
                  </div>
                )}

                {revertConfirmation.etapaOrigen === 'Cerrado' && (revertConfirmation.etapa === 'Perdido' || revertConfirmation.etapa === 'Cerrado Perdido') && (
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 mb-6">
                    <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-rose-800 font-bold mb-1">
                        Precaución con este cambio
                      </p>
                      <p className="text-rose-700/80">
                        Si procede con este cambio, se asume que el trato falló, cancelando la transacción y desea relistar la propiedad Alquilada/Vendida a Disponible.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setRevertConfirmation(null)}
                  className="flex-1 px-6 py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    const check = document.getElementById('liberarPropList') as HTMLInputElement;
                    handleRevertStatus(revertConfirmation.id, revertConfirmation.etapa, check.checked);
                  }}
                  className="flex-1 px-6 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 shadow-xl shadow-slate-900/20 transition-all active:scale-95 cursor-pointer"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
