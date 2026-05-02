import { Loader2 } from 'lucide-react';
import { useEditarTarea } from '../hooks/useEditarTarea';
import { EditarTareaHeader } from './EditarTareaHeader';
import { EditarTareaFormContent } from './EditarTareaFormContent';
import type { Tarea } from '../types';

interface Props {
  tareaId: string;
  initialData?: Tarea; // Para carga instantánea (Zero Wait Policy)
  onSuccess: () => void;
  onCancel: () => void;
  onCancelTask: () => void;
}

export const EditarTareaForm = ({ 
  tareaId, 
  initialData, 
  onSuccess, 
  onCancel, 
  onCancelTask 
}: Props) => {
  const {
    register,
    handleSubmit,
    watch,
    errors,
    control,
    setValue,
    isLoading,
    isSyncing,
    isReadOnly,
    contactoOptions,
    propiedadOptions,
    onSubmit
  } = useEditarTarea({ tareaId, initialData, onSuccess });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando detalles...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300">
      <EditarTareaHeader 
        isReadOnly={isReadOnly}
        isSyncing={isSyncing}
        onCancel={onCancel}
        onCancelTask={onCancelTask}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
        <EditarTareaFormContent 
          register={register}
          control={control}
          errors={errors}
          isReadOnly={isReadOnly}
          setValue={setValue}
          watch={watch}
          contactoOptions={contactoOptions}
          propiedadOptions={propiedadOptions}
          handleSubmit={handleSubmit}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
};
