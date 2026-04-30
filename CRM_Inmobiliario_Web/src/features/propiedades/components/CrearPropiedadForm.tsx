import { FormProvider } from 'react-hook-form';
import { 
  X, 
  Trash2, 
  Check, 
  RotateCcw, 
  Pencil,
  Loader2
} from 'lucide-react';
import type { Propiedad } from '../types';

// Hook modularizado
import { useCrearPropiedad } from '../hooks/useCrearPropiedad';

// Componentes de sección
import { ImportSection } from './crear-propiedad-sections/ImportSection';
import { BasicInfoSection } from './crear-propiedad-sections/BasicInfoSection';
import { LocationSection } from './crear-propiedad-sections/LocationSection';
import { TechnicalSpecsSection } from './crear-propiedad-sections/TechnicalSpecsSection';
import { CommissionSection } from './crear-propiedad-sections/CommissionSection';

interface Props {
  initialData?: Propiedad;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CrearPropiedadForm = ({ initialData: listData, onSuccess, onCancel }: Props) => {
  const {
    methods,
    isEditing,
    isLoadingDetails,
    isSuccess,
    hasData,
    isConfirmingClear,
    setIsConfirmingClear,
    isListening,
    toggleListening,
    isScraping,
    missedFields,
    handleImportar,
    handleClearDraft,
    onSubmit,
    tipoSeleccionado,
    initialData
  } = useCrearPropiedad({ listData, onSuccess });

  if (isEditing && isLoadingDetails) {
    return (
      <div className="bg-white p-12 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Cargando detalles técnicos...</p>
      </div>
    );
  }

  return (
    <div key={listData?.id || 'new'} className="bg-white p-8 rounded-3xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-300 relative max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
      <button 
        onClick={onCancel}
        disabled={isSuccess}
        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-0 cursor-pointer"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          {isEditing ? 'Editar Propiedad' : 'Nueva Propiedad'}
        </h2>
        <div className="flex flex-wrap items-center gap-2 mt-1 min-h-[24px]">
          <p className="text-slate-500 font-medium text-sm">
            {isEditing ? 'Actualiza los detalles técnicos del inmueble.' : 'Ingresa los detalles del inmueble para el catálogo.'}
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
                  Limpiar borrador
                </button>
              ) : (
                <div className="flex items-center gap-1 bg-rose-50 p-0.5 rounded-full border border-rose-100 shadow-sm animate-in zoom-in duration-200">
                  <button 
                    type="button"
                    onClick={() => { handleClearDraft(); setIsConfirmingClear(false); }}
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

      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            
            <ImportSection 
              isSuccess={isSuccess} 
              isScraping={isScraping} 
              onImport={handleImportar} 
            />

            <BasicInfoSection 
              isSuccess={isSuccess} 
              isListening={isListening} 
              onToggleVoice={toggleListening} 
            />

            {tipoSeleccionado && (
              <>
                <LocationSection isSuccess={isSuccess} />
                <TechnicalSpecsSection isSuccess={isSuccess} missedFields={missedFields} />
                <CommissionSection initialData={initialData} />
              </>
            )}
          </div>

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
              disabled={isSuccess || !tipoSeleccionado}
              className={`flex-[2] py-4 font-black rounded-2xl transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 disabled:cursor-not-allowed ${
                isSuccess ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-700 disabled:bg-slate-300'
              }`}
            >
              {isSuccess ? (
                <div className="flex items-center gap-2 animate-in zoom-in duration-300">
                  <Check className="h-5 w-5 stroke-[4px]" />
                  <span>¡{isEditing ? 'Actualizada' : 'Registrada'}!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {isEditing ? <Pencil className="h-4 w-4" /> : null}
                  <span>{isEditing ? 'Actualizar Propiedad' : 'Guardar Propiedad'}</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};
