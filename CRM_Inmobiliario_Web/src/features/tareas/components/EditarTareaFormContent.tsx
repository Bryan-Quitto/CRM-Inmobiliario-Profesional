import { 
  Type, 
  AlignLeft, 
  MapPin, 
  Calendar, 
  User, 
  Home 
} from 'lucide-react';
import { Controller, type UseFormRegister, type UseFormHandleSubmit, type UseFormWatch, type FieldErrors, type Control, type UseFormSetValue } from 'react-hook-form';
import { DynamicSearchSelect } from '../../../components/DynamicSearchSelect';
import { TipoTareaSelect } from './TipoTareaSelect';
import { getDropdownContactos } from '../../contactos/api/getDropdownContactos';
import { buscarPropiedades } from '../../propiedades/api/buscarPropiedades';
import type { EditarTareaFormValues } from '../hooks/useEditarTarea';
import { InputWithCounter } from '@/components/ui/InputWithCounter';
import { TextAreaWithCounter } from '@/components/ui/TextAreaWithCounter';
import { TimeDurationInput } from '../../configuracion/components/TimeDurationInput';
import { TaskColorPicker } from './TaskColorPicker';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';

interface EditarTareaFormContentProps {
  register: UseFormRegister<EditarTareaFormValues>;
  control: Control<EditarTareaFormValues>;
  errors: FieldErrors<EditarTareaFormValues>;
  isReadOnly: boolean;
  setValue: UseFormSetValue<EditarTareaFormValues>;
  watch: UseFormWatch<EditarTareaFormValues>;
  contactoOptions: { id: string; title: string; subtitle: string | undefined }[];
  propiedadOptions: { id: string; title: string; subtitle: string }[];
  handleSubmit: UseFormHandleSubmit<EditarTareaFormValues>;
  onSubmit: (data: EditarTareaFormValues) => void;
}

export const EditarTareaFormContent = ({
  register,
  control,
  errors,
  isReadOnly,
  setValue,
  watch,
  contactoOptions,
  propiedadOptions,
  handleSubmit,
  onSubmit
}: EditarTareaFormContentProps) => {
  const formData = watch();
  const { canWrite } = useSubscriptionGuard();

  return (
    <form onSubmit={(e) => {
      if (!canWrite) {
        e.preventDefault();
        import('sonner').then(({ toast }) => toast.warning('Tu suscripción ha vencido. Contacta al administrador para renovar.'));
        return;
      }
      handleSubmit(onSubmit)(e);
    }} className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Título</label>
        <InputWithCounter 
          {...register('titulo', { required: 'El título es obligatorio' })}
          icon={<Type className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />}
          maxLength={150}
          type="text" 
          disabled={isReadOnly}
          placeholder="Ej. Llamar a Juan..."
          className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${errors.titulo ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all outline-none disabled:opacity-70 disabled:cursor-not-allowed`}
        />
        {errors.titulo && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase">{errors.titulo.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Descripción</label>
        <TextAreaWithCounter 
          {...register('descripcion')}
          icon={<AlignLeft className="absolute left-3.5 top-4 h-4 w-4 text-slate-400" />}
          maxLength={500}
          disabled={isReadOnly}
          placeholder="Detalles adicionales..."
          rows={3}
          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl text-sm font-medium transition-all outline-none resize-none disabled:opacity-70 disabled:cursor-not-allowed"
        />
      </div>

      <TipoTareaSelect 
        control={control}
        errors={errors}
        isReadOnly={isReadOnly}
        setValue={setValue}
      />

      <Controller
        name="contactoId"
        control={control}
        render={({ field }) => (
          <DynamicSearchSelect
            label="Contacto (Opcional)"
            icon={User}
            placeholder="Buscar por nombre o teléfono..."
            value={field.value}
            initialLabel={formData.contactoNombre}
            options={contactoOptions}
            onSearch={async (q) => {
              const res = await getDropdownContactos(q, 'General');
              return res.map(c => ({ id: c.id, title: c.nombre, subtitle: c.referencia }));
            }}
            onChange={(id, title) => {
              field.onChange(id);
              setValue('contactoNombre', title);
            }}
          />
        )}
      />

      <Controller
        name="propiedadId"
        control={control}
        render={({ field }) => (
          <DynamicSearchSelect
            label="Propiedad (Opcional)"
            icon={Home}
            placeholder="Buscar por título de propiedad..."
            value={field.value}
            initialLabel={formData.propiedadTitulo}
            options={propiedadOptions}
            onSearch={async (q) => {
              const res = await buscarPropiedades(q);
              return res.map(p => ({ id: p.id, title: p.titulo, subtitle: `${p.ciudad}, ${p.sector}` }));
            }}
            onChange={(id, title) => {
              field.onChange(id);
              setValue('propiedadTitulo', title);
            }}
          />
        )}
      />

      {(formData.tipoTarea === 'Visita' || formData.tipoTarea === 'Reunión') && !formData.propiedadId && (
        <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Lugar</label>
          <InputWithCounter 
            {...register('lugar')}
            icon={<MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />}
            maxLength={255}
            type="text" 
            disabled={isReadOnly}
            placeholder="Dirección o punto de encuentro..."
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl text-sm font-medium transition-all outline-none disabled:opacity-70 disabled:cursor-not-allowed"
          />
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Fecha de Inicio</label>
        <div className="relative">
          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            {...register('fechaInicio', { required: 'La fecha es obligatoria' })}
            type="datetime-local"
            min="2000-01-01T00:00"
            max="2100-12-31T23:59"
            disabled={isReadOnly}
            className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${errors.fechaInicio ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all outline-none disabled:opacity-70 disabled:cursor-not-allowed`}
          />
        </div>
        {errors.fechaInicio && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase">{errors.fechaInicio.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Duración (Opcional)</label>
        <Controller
          name="duracionMinutos"
          control={control}
          render={({ field }) => (
            <TimeDurationInput
              value={field.value ?? 0}
              onChange={(val) => field.onChange(val)}
              baseUnit="minutes"
              allowedUnits={['minutes', 'hours']}
              min={0}
              error={errors.duracionMinutos?.message}
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Color (Opcional)</label>
        <Controller
          name="colorHex"
          control={control}
          render={({ field }) => (
            <TaskColorPicker
              value={field.value}
              onChange={field.onChange}
              error={errors.colorHex?.message}
            />
          )}
        />
      </div>

      {!isReadOnly && (
        <div className="pt-4">
          <button 
            type="submit"
            disabled={!canWrite}
            className={`w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 ${!canWrite ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            Guardar Cambios
          </button>
        </div>
      )}
    </form>
  );
};
