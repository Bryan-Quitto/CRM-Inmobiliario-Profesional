import { useFormContext } from 'react-hook-form';
import { Globe, Loader2, Wand2 } from 'lucide-react';
import type { CrearPropiedadDTO } from '../../api/crearPropiedad';

interface Props {
  isSuccess: boolean;
  isScraping: boolean;
  onImport: () => void;
}

export const ImportSection = ({ isSuccess, isScraping, onImport }: Props) => {
  const { register, formState: { errors } } = useFormContext<CrearPropiedadDTO>();

  return (
    <div className="md:col-span-6 space-y-2 mb-2 p-4 bg-blue-50/50 rounded-2xl border-2 border-blue-100/50 border-dashed">
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs font-black text-blue-800 uppercase tracking-widest pl-1 flex items-center gap-2">
          <Globe className="h-4 w-4" /> Importación Inteligente (Remax) *
        </label>
      </div>
      <div className="flex gap-2 relative">
        <input 
          {...register('urlRemax', { 
            required: 'La URL de Remax es obligatoria para el catálogo',
            pattern: {
              value: /remax\.com\.ec/,
              message: 'Debe ser una URL válida de remax.com.ec'
            }
          })}
          type="url" 
          disabled={isSuccess || isScraping}
          placeholder="https://www.remax.com.ec/listings/..."
          className={`flex-1 px-4 py-3 bg-white border ${errors.urlRemax ? 'border-rose-300 ring-rose-50' : 'border-blue-200 focus:border-blue-500 focus:ring-blue-100'} focus:ring-4 rounded-xl text-sm font-medium transition-all outline-none disabled:opacity-50`}
        />
        <button
          type="button"
          onClick={onImport}
          disabled={isSuccess || isScraping}
          className="px-5 py-3 bg-blue-600 text-white font-black text-sm uppercase tracking-tight rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
        >
          {isScraping ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Importando...</>
          ) : (
            <><Wand2 className="h-4 w-4" /> Autocompletar</>
          )}
        </button>
      </div>
      {errors.urlRemax && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase">{errors.urlRemax.message}</p>}
      <p className="text-[10px] text-blue-500 font-bold uppercase pl-1 opacity-80">
        Pega una URL para extraer precio, título, cuartos y descripción.
      </p>
    </div>
  );
};
