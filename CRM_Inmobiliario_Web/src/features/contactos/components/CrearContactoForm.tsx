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
    hasData,
    isConfirmingClear,
    setIsConfirmingClear,
    handleClearDraft,
    validateTelefono,
    roleError
  } = useCrearContacto({ initialData, isOwnersView, onSuccess });

  return (
    <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-300 relative max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
      <CrearContactoHeader 
        isEditing={isEditing}
        isSuccess={isSuccess}
        hasData={hasData}
        isConfirmingClear={isConfirmingClear}
        setIsConfirmingClear={setIsConfirmingClear}
        handleClearDraft={handleClearDraft}
        onCancel={onCancel}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div className="space-y-4">
          <CrearContactoFooter 
            isEditing={isEditing}
            isSuccess={isSuccess}
            onCancel={onCancel}
          />
          
          {roleError && (
            <p className="text-center text-rose-500 font-black text-[10px] uppercase tracking-wider animate-bounce">
              ⚠️ Debes seleccionar al menos un rol (Cliente o Propietario)
            </p>
          )}
        </div>
      </form>
    </div>
  );
};
