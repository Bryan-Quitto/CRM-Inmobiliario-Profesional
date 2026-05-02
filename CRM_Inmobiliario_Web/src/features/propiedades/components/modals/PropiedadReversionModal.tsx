import { AlertCircle, RotateCcw } from 'lucide-react';

interface PropiedadReversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRelist: (id: string, reason: string, type: 'Relist' | 'Cancel') => void;
  showReversionModal: { type: 'status', id: string, targetStatus: string } | null;
}

export const PropiedadReversionModal = ({
  isOpen,
  onClose,
  onRelist,
  showReversionModal
}: PropiedadReversionModalProps) => {
  if (!isOpen || !showReversionModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[600] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-10 text-center">
          <div className="h-20 w-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <RotateCcw className="h-10 w-10 text-indigo-600" />
          </div>
          <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Ciclo de Vida</h3>
          <p className="text-slate-500 font-medium mb-10 contactoing-relaxed px-4">
            La propiedad está marcada como cerrada. <br/>¿Cómo deseas proceder con el re-listado?
          </p>
          
          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={() => {
                onRelist(showReversionModal.id, "Fin de contrato / Relistado natural", "Relist");
                onClose();
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
              onClick={() => {
                onRelist(showReversionModal.id, "Operación anulada / Trato caído", "Cancel");
                onClose();
              }}
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
            onClick={onClose} 
            className="mt-8 text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors cursor-pointer"
          >
            Volver atrás
          </button>
        </div>
      </div>
    </div>
  );
};
