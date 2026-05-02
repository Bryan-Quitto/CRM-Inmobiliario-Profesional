import { Check, Pencil } from 'lucide-react';

interface CrearContactoFooterProps {
  isEditing: boolean;
  isSuccess: boolean;
  onCancel: () => void;
}

export const CrearContactoFooter = ({
  isEditing,
  isSuccess,
  onCancel
}: CrearContactoFooterProps) => {
  return (
    <div className="pt-8 flex items-center gap-3">
      <button 
        type="button"
        onClick={onCancel}
        disabled={isSuccess}
        className="flex-1 py-4 text-slate-400 font-bold text-sm hover:text-slate-900 transition-colors disabled:opacity-0 cursor-pointer"
      >
        Cancelar
      </button>
      <button 
        type="submit"
        disabled={isSuccess}
        className={`flex-[2] py-4 font-black rounded-2xl transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 disabled:cursor-not-allowed ${
          isSuccess 
            ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
            : 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700 disabled:bg-slate-300'
        }`}
      >
        {isSuccess ? (
          <div className="flex items-center gap-2 animate-in zoom-in duration-300">
            <Check className="h-5 w-5 stroke-[4px]" />
            <span>¡{isEditing ? 'Actualizado' : 'Registrado'}!</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {isEditing ? <Pencil className="h-4 w-4" /> : null}
            <span>{isEditing ? 'Actualizar Contacto' : 'Guardar Contacto'}</span>
          </div>
        )}
      </button>
    </div>
  );
};
