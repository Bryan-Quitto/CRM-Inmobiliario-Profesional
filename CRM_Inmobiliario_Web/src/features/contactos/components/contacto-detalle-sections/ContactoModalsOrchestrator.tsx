import { RotateCcw, Check, ShieldCheck } from 'lucide-react';
import { ClosingModal } from '../../../propiedades/components/ClosingModal';
import type { Contacto } from '../../types';

interface ContactoModalsOrchestratorProps {
  contacto: Contacto;
  isClosingModalOpen: boolean;
  setIsClosingModalOpen: (open: boolean) => void;
  handleClosingConfirm: (precio: number, propId: string, estado: string) => Promise<void>;
  revertConfirmation: { etapa: string } | null;
  setRevertConfirmation: (revert: { etapa: string } | null) => void;
  handleRevertStatus: (etapa: string, liberar: boolean) => Promise<void>;
}

export const ContactoModalsOrchestrator = ({
  contacto,
  isClosingModalOpen,
  setIsClosingModalOpen,
  handleClosingConfirm,
  revertConfirmation,
  setRevertConfirmation,
  handleRevertStatus
}: ContactoModalsOrchestratorProps) => {
  return (
    <>
      <ClosingModal 
        isOpen={isClosingModalOpen}
        onClose={() => setIsClosingModalOpen(false)}
        onConfirm={handleClosingConfirm}
        mode="contacto"
        initialData={contacto ? {
          id: contacto.id,
          titulo: [contacto.nombre, contacto.apellido].filter(Boolean).join(' '),
          precio: 0,
          operacion: 'Venta'
        } : undefined}
      />

      {revertConfirmation && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[500] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6">
                <RotateCcw className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Revertir Cierre/Perdida</h3>
              <p className="text-slate-500 font-medium mb-8 contactoing-relaxed">
                Estás moviendo a <span className="text-slate-900 font-bold">{contacto.nombre}</span> a la etapa <span className="text-blue-600 font-bold uppercase tracking-wider">{revertConfirmation.etapa}</span>.
              </p>

              <div className="space-y-4 mb-8">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        id="liberarProp"
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
                
                <div className="flex items-start gap-3 p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50">
                  <ShieldCheck className="h-4 w-4 text-amber-600 mt-0.5" />
                  <p className="text-[10px] font-bold text-amber-700 contactoing-tight uppercase tracking-wider">
                    Se registrarán transacciones de cancelación en el historial de las propiedades afectadas.
                  </p>
                </div>
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
                    const check = document.getElementById('liberarProp') as HTMLInputElement;
                    handleRevertStatus(revertConfirmation.etapa, check.checked);
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
