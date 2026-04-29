import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { useSWRConfig } from 'swr';
import { 
  X, 
  Trash2, 
  Check, 
  RotateCcw, 
  Pencil
} from 'lucide-react';
import { crearPropiedad } from '../api/crearPropiedad';
import { actualizarPropiedad } from '../api/actualizarPropiedad';
import { useState, useEffect } from 'react';
import type { Propiedad } from '../types';
import type { CrearPropiedadDTO } from '../api/crearPropiedad';
import { toast } from 'sonner';

// Hooks personalizados
import { usePropertyDraft } from '../hooks/usePropertyDraft';
import { useVoiceDictation } from '../hooks/useVoiceDictation';
import { useRemaxScraper } from '../hooks/useRemaxScraper';

// Componentes de sección
import { ImportSection } from './crear-propiedad-sections/ImportSection';
import { BasicInfoSection } from './crear-propiedad-sections/BasicInfoSection';
import { LocationSection } from './crear-propiedad-sections/LocationSection';
import { TechnicalSpecsSection } from './crear-propiedad-sections/TechnicalSpecsSection';
import { CommissionSection } from './crear-propiedad-sections/CommissionSection';

// Constantes
import { DRAFT_STORAGE_KEY } from '../constants/propertyForm';

interface Props {
  initialData?: Propiedad;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CrearPropiedadForm = ({ initialData, onSuccess, onCancel }: Props) => {
  const { mutate } = useSWRConfig();
  const isEditing = !!initialData;
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const getInitialValues = (): Partial<CrearPropiedadDTO> => {
    const today = new Date();
    const ecuadorDate = new Date(today.getTime() - (5 * 60 * 60 * 1000)).toISOString().split('T')[0];

    if (isEditing && initialData) {
      const fecha = initialData.fechaIngreso ? initialData.fechaIngreso.split('T')[0] : ecuadorDate;
      return {
        ...initialData,
        urlRemax: initialData.urlRemax ?? '',
        captadorId: !initialData.esCaptacionPropia ? initialData.agenteId : undefined,
        porcentajeComision: initialData.porcentajeComision ?? 5,
        fechaIngreso: fecha
      };
    }

    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { 
          fechaIngreso: ecuadorDate,
          porcentajeComision: 5,
          ...parsed 
        };
      } catch (e) {
        console.error('Error al parsear borrador:', e);
      }
    }

    return {
      tipoPropiedad: '',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      operacion: '' as any,
      urlRemax: '',
      fechaIngreso: ecuadorDate,
      esCaptacionPropia: true,
      porcentajeComision: 5
    };
  };

  const methods = useForm<CrearPropiedadDTO>({
    defaultValues: getInitialValues() as CrearPropiedadDTO
  });

  const { handleSubmit, reset, control, formState: { isDirty } } = methods;
  const watchedValues = useWatch({ control });
  const tipoSeleccionado = useWatch({ control, name: 'tipoPropiedad' });

  // Hooks de lógica extraída
  const { handleClearDraft } = usePropertyDraft(isEditing, watchedValues as CrearPropiedadDTO, reset);
  const { isListening, toggleListening } = useVoiceDictation(methods.setValue, methods.getValues);
  const { isScraping, missedFields, handleImportar } = useRemaxScraper(methods.setValue, methods.getValues);

  useEffect(() => {
    if (!isEditing || !initialData) return;
    if (!isDirty) {
      const today = new Date();
      const ecuadorDate = new Date(today.getTime() - (5 * 60 * 60 * 1000)).toISOString().split('T')[0];
      const fecha = initialData.fechaIngreso ? initialData.fechaIngreso.split('T')[0] : ecuadorDate;
      
      reset({ 
        ...initialData,
        urlRemax: initialData.urlRemax ?? '',
        captadorId: !initialData.esCaptacionPropia ? initialData.agenteId : undefined,
        fechaIngreso: fecha,
        porcentajeComision: initialData.porcentajeComision ?? 5
      } as CrearPropiedadDTO);
    }
  }, [initialData, isEditing, reset, isDirty]);

  const hasData = watchedValues 
    ? Object.values(watchedValues).some(v => v && v !== '' && v !== 0) 
    : false;

  const onSubmit = (data: CrearPropiedadDTO) => {
    setIsSuccess(true);
    if (!isEditing) localStorage.removeItem(DRAFT_STORAGE_KEY);

    setTimeout(() => onSuccess(), 600);

    const payload = {
      ...data,
      precio: Number(data.precio),
      habitaciones: Number(data.habitaciones || 0),
      banos: Number(data.banos || 0),
      areaTotal: Number(data.areaTotal || 0),
      areaTerreno: data.areaTerreno !== undefined && data.areaTerreno !== null && (data.areaTerreno as unknown as string) !== '' ? Number(data.areaTerreno) : undefined,
      areaConstruccion: data.areaConstruccion !== undefined && data.areaConstruccion !== null && (data.areaConstruccion as unknown as string) !== '' ? Number(data.areaConstruccion) : undefined,
      estacionamientos: data.estacionamientos !== undefined && data.estacionamientos !== null && (data.estacionamientos as unknown as string) !== '' ? Number(data.estacionamientos) : undefined,
      mediosBanos: data.mediosBanos !== undefined && data.mediosBanos !== null && (data.mediosBanos as unknown as string) !== '' ? Number(data.mediosBanos) : undefined,
      aniosAntiguedad: data.aniosAntiguedad !== undefined && data.aniosAntiguedad !== null && (data.aniosAntiguedad as unknown as string) !== '' ? Number(data.aniosAntiguedad) : undefined,
      fechaIngreso: data.fechaIngreso ? `${data.fechaIngreso}T12:00:00-05:00` : undefined,
    };

    const action = isEditing 
      ? actualizarPropiedad(initialData.id, payload)
      : crearPropiedad(payload);

    action.then(() => {
      mutate('/dashboard/kpis');
      mutate(key => typeof key === 'string' && key.startsWith('/analitica/'));
      mutate('/propiedades');
    }).catch((err) => {
      console.error('Error al guardar propiedad:', err);
      toast.error(`Error al ${isEditing ? 'actualizar' : 'registrar'} propiedad`);
    });
  };

  return (
    <div key={initialData?.id || 'new'} className="bg-white p-8 rounded-3xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-300 relative max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
