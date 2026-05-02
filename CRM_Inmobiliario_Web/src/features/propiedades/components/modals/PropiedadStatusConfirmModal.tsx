import { AlertCircle } from 'lucide-react';

interface PropiedadStatusConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string, nuevoEstado: string, confirmed: boolean) => void;
  statusConfirmation: { id: string; nuevoEstado: string } | null;
}

export const PropiedadStatusConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  statusConfirmation
}: PropiedadStatusConfirmModalProps) => {
  if (!isOpen || !statusConfirmation) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 text-center">
          <div className="h-20 w-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-rose-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
            ¿Confirmar estado {statusConfirmation.nuevoEstado}?
          </h3>
          <p className="text-slate-500 font-medium contactoing-relaxed mb-8">
            Al marcar esta propiedad como <span className="font-bold text-slate-900">{statusConfirmation.nuevoEstado}</span>, todas las imágenes de la galería serán eliminadas permanentemente para optimizar el almacenamiento, <span className="text-rose-600 font-bold">excepto la foto de portada</span>.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all active:scale-95 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={() => onConfirm(statusConfirmation.id, statusConfirmation.nuevoEstado, true)}
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
  );
};
