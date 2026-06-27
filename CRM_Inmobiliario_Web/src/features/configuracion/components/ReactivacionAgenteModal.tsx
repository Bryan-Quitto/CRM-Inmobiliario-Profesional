import React from 'react';
import { UserCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useReactivarAgente } from '../hooks/useReactivarAgente';

interface ReactivacionAgenteModalProps {
  agenteId: string;
  agenteNombre: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReactivacionAgenteModal: React.FC<ReactivacionAgenteModalProps> = ({
  agenteId,
  agenteNombre,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { mutateAsync: reactivar, isLoading } = useReactivarAgente();

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      await reactivar(agenteId);
      toast.success('Agente reactivado exitosamente');
      onSuccess();
      onClose();
    } catch {
      // error handled in hook
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          <div className="flex items-center gap-4 mb-6 w-full">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <UserCheck size={28} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight break-words">Reactivar Agente</h3>
              <p className="text-slate-500 font-medium break-words">Restaurar acceso al sistema</p>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6">
            <p className="text-sm font-medium text-amber-800 break-words">
              Estás a punto de reactivar a <strong className="font-black break-words">{agenteNombre}</strong>. 
              Ten en cuenta que sus propiedades y contactos estarán en <strong>cero</strong> ya que fueron reasignados previamente.
            </p>
          </div>
          
          <p className="text-sm font-medium text-slate-600 mb-8 break-words">
            ¿Confirmas que deseas restaurar su acceso a la plataforma?
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-auto shrink-0 w-full">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 w-full sm:w-auto px-4 py-4 font-bold text-slate-700 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 w-full sm:w-auto px-4 py-4 font-bold text-white bg-emerald-600 rounded-2xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin shrink-0" />
                  Reactivando...
                </>
              ) : (
                <>
                  <UserCheck size={20} className="shrink-0" />
                  Confirmar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
