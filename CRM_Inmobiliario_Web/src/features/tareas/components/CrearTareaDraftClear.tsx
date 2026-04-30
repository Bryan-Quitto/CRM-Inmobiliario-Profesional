import { useState } from 'react';
import { Trash2, Check, RotateCcw } from 'lucide-react';

interface CrearTareaDraftClearProps {
  onClear: () => void;
}

export const CrearTareaDraftClear = ({ onClear }: CrearTareaDraftClearProps) => {
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  return (
    <div className="flex items-center gap-2 min-h-[24px]">
      {!isConfirmingClear ? (
        <button
          type="button"
          onClick={() => setIsConfirmingClear(true)}
          className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:Rose-500 bg-slate-50 hover:bg-rose-50 px-2 py-1 rounded-full transition-all group cursor-pointer"
        >
          <Trash2 className="h-2.5 w-2.5" />
          Limpiar Borrador
        </button>
      ) : (
        <div className="flex items-center gap-1 bg-rose-50 p-0.5 rounded-full border border-rose-100 shadow-sm animate-in zoom-in duration-200">
          <button
            type="button"
            onClick={() => {
              onClear();
              setIsConfirmingClear(false);
            }}
            className="flex items-center gap-1 text-[10px] font-black text-white bg-rose-500 hover:bg-rose-600 px-2.5 py-1 rounded-full transition-all cursor-pointer"
          >
            <Check className="h-2.5 w-2.5" />
            Confirmar
          </button>
          <button
            type="button"
            onClick={() => setIsConfirmingClear(false)}
            className="p-1 text-rose-400 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-2.5 w-2.5" />
          </button>
        </div>
      )}
    </div>
  );
};
