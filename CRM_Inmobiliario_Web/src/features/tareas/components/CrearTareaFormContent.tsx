import { 
  Type, 
  AlignLeft, 
  MapPin, 
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
import { buscarContactos } from '../../contactos/api/buscarContactos';
import { buscarPropiedades } from '../../propiedades/api/buscarPropiedades';
import type { CrearTareaDTO } from '../types';
import type { EditarTareaFormValues } from '../hooks/useEditarTarea';

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
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Título</label>
        <div className="relative">
          <Type className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            {...register('titulo', { required: 'El título es obligatorio' })}
            type="text"
            placeholder="Ej. Llamar a Juan..."
            className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${errors.titulo ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all outline-none focus:ring-4`}
          />
        </div>
        {errors.titulo && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase">{errors.titulo.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Descripción</label>
        <div className="relative">
          <AlignLeft className="absolute left-3.5 top-4 h-4 w-4 text-slate-400" />
          <textarea
            {...register('descripcion')}
            placeholder="Detalles adicionales..."
            rows={3}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl text-sm font-medium transition-all outline-none resize-none"
          />
        </div>
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
              const res = await buscarContactos(q);
              return res.map(c => ({ id: c.id, title: c.nombreCompleto, subtitle: c.telefono }));
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
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              {...register('lugar')}
              type="text"
              placeholder="Dirección o punto de encuentro..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl text-sm font-medium transition-all outline-none"
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Fecha de Inicio</label>
        <div className="relative">
          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            {...register('fechaInicio', { required: 'La fecha es obligatoria' })}
            type="datetime-local"
            className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${errors.fechaInicio ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all outline-none`}
          />
        </div>
        {errors.fechaInicio && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase">{errors.fechaInicio.message}</p>}
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
