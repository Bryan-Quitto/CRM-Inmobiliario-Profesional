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
    } catch (error) {
      // error handled in hook
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[32px] max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <UserCheck size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Reactivar Agente</h3>
              <p className="text-slate-500 font-medium">Restaurar acceso al sistema</p>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6">
            <p className="text-sm font-medium text-amber-800">
              Estás a punto de reactivar a <strong className="font-black">{agenteNombre}</strong>. 
              Ten en cuenta que sus propiedades y contactos estarán en <strong>cero</strong> ya que fueron reasignados previamente.
            </p>
          </div>
          
          <p className="text-sm font-medium text-slate-600 mb-8">
            ¿Confirmas que deseas restaurar su acceso a la plataforma?
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-4 font-bold text-slate-700 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-4 font-bold text-white bg-emerald-600 rounded-2xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Reactivando...
                </>
              ) : (
                <>
                  <UserCheck size={20} />
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
