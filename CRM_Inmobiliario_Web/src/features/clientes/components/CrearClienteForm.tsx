import { useCrearCliente } from '../hooks/useCrearCliente';
import { CrearClienteHeader } from './crear-cliente-sections/CrearClienteHeader';
import { CrearClienteFields } from './crear-cliente-sections/CrearClienteFields';
import { OrigenSelect } from './crear-cliente-sections/OrigenSelect';
import { CrearClienteFooter } from './crear-cliente-sections/CrearClienteFooter';
import type { Cliente } from '../types';

interface Props {
  initialData?: Cliente;
  isOwnersView?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export const CrearClienteForm = ({ initialData, isOwnersView, onSuccess, onCancel }: Props) => {
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
  } = useCrearCliente({ initialData, isOwnersView, onSuccess });

  return (
    <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-300 relative max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
      <CrearClienteHeader 
        isEditing={isEditing}
        isSuccess={isSuccess}
        hasData={hasData}
        isConfirmingClear={isConfirmingClear}
        setIsConfirmingClear={setIsConfirmingClear}
        handleClearDraft={handleClearDraft}
        onCancel={onCancel}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <CrearClienteFields 
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
          <CrearClienteFooter 
            isEditing={isEditing}
            isSuccess={isSuccess}
            onCancel={onCancel}
          />
          
          {roleError && (
            <p className="text-center text-rose-500 font-black text-[10px] uppercase tracking-wider animate-bounce">
              ⚠️ Debes seleccionar al menos un rol (Prospecto o Propietario)
            </p>
          )}
        </div>
      </form>
    </div>
  );
};
