import { useCrearContacto } from '../hooks/useCrearContacto';
import { CrearContactoHeader } from './crear-contacto-sections/CrearContactoHeader';
import { CrearContactoFields } from './crear-contacto-sections/CrearContactoFields';
import { OrigenSelect } from './crear-contacto-sections/OrigenSelect';
import { CrearContactoFooter } from './crear-contacto-sections/CrearContactoFooter';
import type { Contacto } from '../types';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';

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
  const { canWrite } = useSubscriptionGuard();

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

      <form onSubmit={(e) => {
        if (!canWrite) {
          e.preventDefault();
          import('sonner').then(({ toast }) => toast.warning('Tu suscripción ha vencido. Contacta al administrador para renovar.'));
          return;
        }
        handleSubmit(e);
      }} className="flex flex-col w-full space-y-6">
        <CrearContactoFields 
          register={register}
          errors={errors}
          control={control}
          setValue={setValue}
          isSuccess={isSuccess}
          validateTelefono={validateTelefono}
          roleError={roleError}
          initialData={initialData}
        />

        <OrigenSelect 
          control={control}
          setValue={setValue}
          errors={errors}
          isSuccess={isSuccess}
        />

        <div className="space-y-4 w-full">
          {!isEditing && (
            <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-3 text-[11px] sm:text-xs text-amber-800 flex items-start gap-2 shadow-sm">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <p className="leading-relaxed">
                Recuerda que al registrar datos manualmente, debes haber informado al cliente sobre nuestra{' '}
                <a 
                  href="https://zielluxoracrm.com/privacidad" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-semibold underline underline-offset-2 hover:text-amber-900 transition-colors cursor-pointer"
                >
                  política de privacidad
                </a>.
              </p>
            </div>
          )}

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
