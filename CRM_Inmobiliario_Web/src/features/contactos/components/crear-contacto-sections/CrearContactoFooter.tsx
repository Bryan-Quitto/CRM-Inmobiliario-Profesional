import { Check, Pencil, Loader2 } from 'lucide-react';

interface CrearContactoFooterProps {
  isEditing: boolean;
  isSuccess: boolean;
  isSubmitting?: boolean;
  onCancel: () => void;
}

export const CrearContactoFooter = ({
  isEditing,
  isSuccess,
  isSubmitting,
  onCancel
}: CrearContactoFooterProps) => {
  return (
    <div className="pt-8 flex flex-col sm:flex-row items-center gap-3 w-full">
      <button 
        type="button"
        onClick={onCancel}
        disabled={isSuccess}
        className="flex-1 w-full py-4 text-slate-400 font-bold text-sm hover:text-slate-900 transition-colors disabled:opacity-0 cursor-pointer"
      >
        Cancelar
      </button>
      <button 
        type="submit"
        disabled={isSuccess || isSubmitting}
        className={`flex-[2] w-full py-4 font-black rounded-2xl transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 disabled:cursor-not-allowed ${
          isSuccess 
            ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
            : 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700 disabled:bg-slate-300'
        }`}
      >
        {isSuccess ? (
          <div className="flex items-center gap-2 animate-in zoom-in duration-300 min-w-0">
            <Check className="h-5 w-5 stroke-[4px] shrink-0" />
            <span className="truncate">¡{isEditing ? 'Actualizado' : 'Registrado'}!</span>
          </div>
        ) : isSubmitting ? (
          <div className="flex items-center gap-2 min-w-0">
            <Loader2 className="h-5 w-5 animate-spin shrink-0" />
            <span className="truncate">Guardando...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-0">
            {isEditing ? <Pencil className="h-4 w-4 shrink-0" /> : null}
            <span className="truncate">{isEditing ? 'Actualizar Contacto' : 'Guardar Contacto'}</span>
          </div>
        )}
      </button>
    </div>
  );
};
