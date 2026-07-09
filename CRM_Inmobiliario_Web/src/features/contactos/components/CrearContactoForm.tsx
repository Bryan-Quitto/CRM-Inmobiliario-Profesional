import { useCrearContacto } from '../hooks/useCrearContacto';
import { CrearContactoHeader } from './crear-contacto-sections/CrearContactoHeader';
import { CrearContactoFields } from './crear-contacto-sections/CrearContactoFields';
import { OrigenSelect } from './crear-contacto-sections/OrigenSelect';
import { CrearContactoFooter } from './crear-contacto-sections/CrearContactoFooter';
import type { Contacto } from '../types';

interface Props {
  initialData?: Contacto;
  isOwnersView?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CrearContactoForm = ({ initialData, isOwnersView, onSuccess, onCancel }: Props) => {
  const {
    register,
    handleSubmit,
    errors,
    control,
    setValue,
    isEditing,
    isSuccess,
    isSubmitting,
    hasData,
    isConfirmingClear,
    setIsConfirmingClear,
    handleClearDraft,
    validateTelefono,
    roleError
  } = useCrearContacto({ initialData, isOwnersView, onSuccess });

  return (
    <div className="mx-auto bg-white p-6 sm:p-8 rounded-none sm:rounded-3xl w-full max-w-lg shadow-none sm:shadow-2xl animate-in fade-in zoom-in duration-300 relative max-h-full sm:max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 flex flex-col min-w-0">
      <CrearContactoHeader 
        isEditing={isEditing}
        isSuccess={isSuccess}
        hasData={hasData}
        isConfirmingClear={isConfirmingClear}
        setIsConfirmingClear={setIsConfirmingClear}
        handleClearDraft={handleClearDraft}
        onCancel={onCancel}
      />

      <form onSubmit={handleSubmit} className="flex flex-col w-full space-y-6">
        <CrearContactoFields 
          register={register}
          errors={errors}
          control={control}
          setValue={setValue}
          isSuccess={isSuccess}
          validateTelefono={validateTelefono}
          roleError={roleError}
        />

        <OrigenSelect 
          control={control}
          setValue={setValue}
          errors={errors}
          isSuccess={isSuccess}
        />

        <div className="space-y-4 w-full">
          <CrearContactoFooter 
            isEditing={isEditing}
            isSuccess={isSuccess}
            isSubmitting={isSubmitting}
            onCancel={onCancel}
          />
          
          {roleError && (
            <p className="text-center text-rose-500 font-black text-[10px] uppercase tracking-wider animate-bounce break-words px-2">
              ⚠️ Debes seleccionar al menos un rol (Cliente o Propietario)
            </p>
          )}
        </div>
      </form>
    </div>
  );
};
