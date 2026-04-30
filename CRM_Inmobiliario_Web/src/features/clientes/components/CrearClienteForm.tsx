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
    validateTelefono
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
          isSuccess={isSuccess}
          validateTelefono={validateTelefono}
        />

        <OrigenSelect 
          control={control}
          setValue={setValue}
          errors={errors}
          isSuccess={isSuccess}
        />

        <CrearClienteFooter 
          isEditing={isEditing}
          isSuccess={isSuccess}
          onCancel={onCancel}
        />
      </form>
    </div>
  );
};
