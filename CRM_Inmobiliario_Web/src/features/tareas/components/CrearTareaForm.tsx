import { useCrearTarea } from '../hooks/useCrearTarea';
import { CrearTareaHeader } from './CrearTareaHeader';
import { CrearTareaDraftClear } from './CrearTareaDraftClear';
import { CrearTareaFormContent } from './CrearTareaFormContent';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
  fechaInicial?: string;
  prefill?: {
    titulo?: string;
    tipoTarea?: string;
    fechaInicio?: string;
    clienteId?: string;
    clienteLabel?: string;
    propiedadId?: string;
    propiedadLabel?: string;
    lugar?: string;
  };
}

export const CrearTareaForm = ({ onSuccess, onCancel, fechaInicial, prefill }: Props) => {
  const {
    register,
    handleSubmit,
    errors,
    control,
    setValue,
    watch,
    formData,
    clienteOptions,
    propiedadOptions,
    onSubmit,
    handleClearDraft
  } = useCrearTarea({ onSuccess, fechaInicial, prefill });

  const hasData = formData.titulo || formData.descripcion;

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300">
      <CrearTareaHeader 
        onCancel={onCancel} 
        isPrefill={!!prefill} 
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
        {hasData && !prefill && (
          <CrearTareaDraftClear onClear={handleClearDraft} />
        )}

        <CrearTareaFormContent 
          register={register}
          control={control}
          errors={errors}
          setValue={setValue}
          watch={watch}
          clienteOptions={clienteOptions}
          propiedadOptions={propiedadOptions}
          handleSubmit={handleSubmit}
          onSubmit={onSubmit}
          prefill={prefill}
        />
      </div>
    </div>
  );
};
