import { X, Trash2, Check, RotateCcw } from 'lucide-react';

interface CrearContactoHeaderProps {
  isEditing: boolean;
  isSuccess: boolean;
  hasData: boolean;
  isConfirmingClear: boolean;
  setIsConfirmingClear: (val: boolean) => void;
  handleClearDraft: () => void;
  onCancel: () => void;
}

export const CrearContactoHeader = ({
  isEditing,
  isSuccess,
  hasData,
  isConfirmingClear,
  setIsConfirmingClear,
  handleClearDraft,
  onCancel
}: CrearContactoHeaderProps) => {
  return (
    <>
      {/* Botón de cierre */}
      <button 
        onClick={onCancel}
        disabled={isSuccess}
        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-0 cursor-pointer"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          {isEditing ? 'Editar Contacto' : 'Nuevo Contacto'}
        </h2>
        <div className="flex flex-wrap items-center gap-2 mt-1 min-h-[24px]">
          <p className="text-slate-500 font-medium text-sm">
            {isEditing ? 'Actualiza la información de contacto.' : 'Completa los datos para iniciar el seguimiento.'}
          </p>
          
          {!isEditing && hasData && !isSuccess && (
            <div className="flex items-center gap-1.5 animate-in slide-in-from-left-2 duration-300">
              {!isConfirmingClear ? (
                <button 
                  type="button"
                  onClick={() => setIsConfirmingClear(true)}
                  className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-rose-500 bg-slate-50 hover:bg-rose-50 px-2 py-1 rounded-full transition-all group cursor-pointer"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                  Limpiar
                </button>
              ) : (
                <div className="flex items-center gap-1 bg-rose-50 p-0.5 rounded-full border border-rose-100 shadow-sm animate-in zoom-in duration-200">
                  <button 
                    type="button"
                    onClick={handleClearDraft}
                    className="flex items-center gap-1 text-[10px] font-black text-white bg-rose-500 hover:bg-rose-600 px-2.5 py-1 rounded-full transition-all cursor-pointer"
                  >
                    <Check className="h-2.5 w-2.5" />
                    Confirmar
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsConfirmingClear(false)}
                    className="p-1 text-rose-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Cancelar"
                  >
                    <RotateCcw className="h-2.5 w-2.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
