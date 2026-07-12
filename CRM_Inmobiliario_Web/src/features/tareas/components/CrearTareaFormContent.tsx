import { 
  AlignLeft, 
  MapPin, 
  PenLine,
  Calendar, 
  User, 
  Home 
} from 'lucide-react';
import { Controller } from 'react-hook-form';
import type { 
  UseFormRegister, 
  UseFormHandleSubmit, 
  Control, 
  FieldErrors, 
  UseFormSetValue, 
  UseFormWatch 
} from 'react-hook-form';
import { DynamicSearchSelect } from '../../../components/DynamicSearchSelect';
import { TipoTareaSelect } from './TipoTareaSelect';
import { getDropdownContactos } from '../../contactos/api/getDropdownContactos';
import { buscarPropiedades } from '../../propiedades/api/buscarPropiedades';
import type { CrearTareaDTO } from '../types';
import type { EditarTareaFormValues } from '../hooks/useEditarTarea';
import { InputWithCounter } from '@/components/ui/InputWithCounter';
import { TextAreaWithCounter } from '@/components/ui/TextAreaWithCounter';
import { TimeDurationInput } from '../../configuracion/components/TimeDurationInput';
import { TaskColorPicker } from './TaskColorPicker';

interface CrearTareaFormContentProps {
  register: UseFormRegister<CrearTareaDTO>;
  control: Control<CrearTareaDTO>;
  errors: FieldErrors<CrearTareaDTO>;
  setValue: UseFormSetValue<CrearTareaDTO>;
  watch: UseFormWatch<CrearTareaDTO>;
  contactoOptions: { id: string; title: string; subtitle: string | undefined }[];
  propiedadOptions: { id: string; title: string; subtitle: string }[];
  handleSubmit: UseFormHandleSubmit<CrearTareaDTO>;
  onSubmit: (data: CrearTareaDTO) => void;
  prefill?: {
    contactoLabel?: string;
    propiedadLabel?: string;
  };
}

export const CrearTareaFormContent = ({
  register,
  control,
  errors,
  setValue,
  watch,
  contactoOptions,
  propiedadOptions,
  handleSubmit,
  onSubmit,
  prefill
}: CrearTareaFormContentProps) => {
  const formData = watch();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-10">
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Título de la tarea</label>
        <InputWithCounter
          {...register('titulo')}
          icon={<PenLine className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />}
          maxLength={100}
          type="text"
          placeholder="Ej. Llamar al cliente..."
          className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border ${errors.titulo ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all outline-none focus:ring-4`}
        />
        {errors.titulo && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase">{errors.titulo.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Descripción</label>
        <TextAreaWithCounter
          {...register('descripcion')}
          icon={<AlignLeft className="absolute left-3.5 top-4 h-4 w-4 text-slate-400" />}
          maxLength={500}
          placeholder="Detalles adicionales..."
          rows={3}
          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl text-sm font-medium transition-all outline-none resize-none"
        />
      </div>

      <TipoTareaSelect 
        control={control as unknown as Control<EditarTareaFormValues>}
        errors={errors as unknown as FieldErrors<EditarTareaFormValues>}
        isReadOnly={false}
        setValue={setValue as unknown as UseFormSetValue<EditarTareaFormValues>}
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
            initialLabel={prefill?.contactoLabel}
            options={contactoOptions}
            onSearch={async (q) => {
              const res = await getDropdownContactos(q, 'General');
              return res.map(c => ({ id: c.id, title: c.nombre, subtitle: c.referencia }));
            }}
            onChange={(id) => field.onChange(id)}
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
            initialLabel={prefill?.propiedadLabel}
            options={propiedadOptions}
            onSearch={async (q) => {
              const res = await buscarPropiedades(q);
              return res.map(p => ({ id: p.id, title: p.titulo, subtitle: `${p.ciudad}, ${p.sector}` }));
            }}
            onChange={(id) => field.onChange(id)}
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
            placeholder="Dirección o punto de encuentro..."
            className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${errors.lugar ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all outline-none focus:ring-4`}
          />
          {errors.lugar && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase">{errors.lugar.message}</p>}
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
            className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${errors.fechaInicio ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all outline-none`}
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

      <button
        type="submit"
        className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer"
      >
        Guardar Tarea
      </button>
    </form>
  );
};
