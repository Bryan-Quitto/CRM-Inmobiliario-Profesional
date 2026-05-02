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
import { buscarContactos } from '../../contactos/api/buscarContactos';
import { buscarPropiedades } from '../../propiedades/api/buscarPropiedades';
import type { EditarTareaFormValues } from '../hooks/useEditarTarea';

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Título</label>
        <div className="relative">
          <Type className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            {...register('titulo', { required: 'El título es obligatorio' })}
            type="text" 
            disabled={isReadOnly}
            placeholder="Ej. Llamar a Juan..."
            className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${errors.titulo ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all outline-none disabled:opacity-70 disabled:cursor-not-allowed`}
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
            disabled={isReadOnly}
            placeholder="Detalles adicionales..."
            rows={3}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl text-sm font-medium transition-all outline-none resize-none disabled:opacity-70 disabled:cursor-not-allowed"
          />
        </div>
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
              const res = await buscarContactos(q);
              return res.map(c => ({ id: c.id, title: c.nombreCompleto, subtitle: c.telefono }));
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
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              {...register('lugar')}
              type="text" 
              disabled={isReadOnly}
              placeholder="Dirección o punto de encuentro..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl text-sm font-medium transition-all outline-none disabled:opacity-70 disabled:cursor-not-allowed"
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
            disabled={isReadOnly}
            className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${errors.fechaInicio ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all outline-none disabled:opacity-70 disabled:cursor-not-allowed`}
          />
        </div>
        {errors.fechaInicio && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase">{errors.fechaInicio.message}</p>}
      </div>

      {!isReadOnly && (
        <div className="pt-4">
          <button 
            type="submit"
            className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer"
          >
            Guardar Cambios
          </button>
        </div>
      )}
    </form>
  );
};
