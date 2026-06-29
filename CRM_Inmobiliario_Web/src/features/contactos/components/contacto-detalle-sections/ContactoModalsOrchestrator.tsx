import { RotateCcw, AlertTriangle } from 'lucide-react';
import type { Contacto } from '../../types';

interface ContactoModalsOrchestratorProps {
  contacto: Contacto;
  newCycleConfirmation: { estado: string } | null;
  setNewCycleConfirmation: (conf: { estado: string } | null) => void;
  executeStageChange: (etapa: string) => Promise<void>;
}

export const ContactoModalsOrchestrator = ({
  contacto,
  newCycleConfirmation,
  setNewCycleConfirmation,
  executeStageChange
}: ContactoModalsOrchestratorProps) => {
  return (
    <>
      {newCycleConfirmation && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[500] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <RotateCcw className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight text-center">Nuevo Ciclo Comercial</h3>
              <p className="text-slate-500 font-medium mb-6 leading-relaxed text-center">
                Estás moviendo a <span className="text-slate-900 font-bold">{contacto.nombre}</span> a la etapa <span className="text-blue-600 font-bold uppercase tracking-wider">{newCycleConfirmation.estado}</span>.
              </p>

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 mb-8">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-amber-800 font-bold mb-1">
                    Esto NO es un fin de contrato
                  </p>
                  <p className="text-amber-700/80">
                    Esto colocará al cliente en estado {newCycleConfirmation.estado} para iniciar una nueva búsqueda, pero <strong>mantendrá intacto</strong> el contrato histórico. 
                    <br/><br/>
                    La propiedad anterior <strong>NO</strong> volverá a estar Disponible. Si lo que deseas es finalizar un arrendamiento o anular una venta para liberar la propiedad, debes hacerlo exclusivamente desde el Catálogo de Propiedades.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setNewCycleConfirmation(null)}
                  className="flex-1 px-6 py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => executeStageChange(newCycleConfirmation.estado)}
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

