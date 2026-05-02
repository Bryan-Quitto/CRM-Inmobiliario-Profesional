import { type UseFormRegister, type FieldErrors, type Control, useWatch } from 'react-hook-form';
import { User, Mail, Phone, UserCheck, Search } from 'lucide-react';
import { type CrearClienteDTO } from '../../api/crearCliente';

interface CrearClienteFieldsProps {
  register: UseFormRegister<CrearClienteDTO>;
  errors: FieldErrors<CrearClienteDTO>;
  control: Control<CrearClienteDTO>;
  setValue: (name: keyof CrearClienteDTO, value: string | boolean | undefined) => void;
  isSuccess: boolean;
  validateTelefono: (value: string) => Promise<string | true>;
}

export const CrearClienteFields = ({
  register,
  errors,
  control,
  setValue,
  isSuccess,
  validateTelefono
}: CrearClienteFieldsProps) => {
  const esPropietario = useWatch({ control, name: 'esPropietario' });

  return (
    <div className="space-y-8">
      {/* Sección de Roles */}
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Roles del Contacto</label>
        <div className="grid grid-cols-2 gap-3">
          <div 
            className="flex items-center gap-3 p-3 rounded-2xl border-2 border-blue-100 bg-blue-50/30 transition-all opacity-60 cursor-not-allowed"
            title="Por defecto todo contacto es prospecto"
          >
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Search className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-black text-blue-900 uppercase">Prospecto</p>
              <p className="text-[9px] text-blue-600 font-bold uppercase leading-none mt-0.5">Activo</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setValue('esPropietario', !esPropietario)}
            disabled={isSuccess}
            className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer ${
              esPropietario 
                ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/10' 
                : 'border-slate-100 bg-slate-50 hover:border-slate-200'
            }`}
          >
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
              esPropietario ? 'bg-emerald-500' : 'bg-slate-200 group-hover:bg-slate-300'
            }`}>
              <UserCheck className={`h-4 w-4 ${esPropietario ? 'text-white' : 'text-slate-500'}`} />
            </div>
            <div className="text-left">
              <p className={`text-xs font-black uppercase ${esPropietario ? 'text-emerald-900' : 'text-slate-500'}`}>Propietario</p>
              <p className={`text-[9px] font-bold uppercase leading-none mt-0.5 ${esPropietario ? 'text-emerald-600' : 'text-slate-400'}`}>
                {esPropietario ? 'Habilitado' : 'Inactivo'}
              </p>
            </div>
          </button>
        </div>
        <input type="hidden" {...register('esPropietario')} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Nombre</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              {...register('nombre', { required: 'El nombre es obligatorio' })}
              type="text" 
              disabled={isSuccess}
              placeholder="Ej. Juan"
              className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${errors.nombre ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all focus:ring-4 outline-none disabled:opacity-50`}
            />
          </div>
          {errors.nombre && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase">{errors.nombre.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Apellido</label>
          <input 
            {...register('apellido')}
            type="text" 
            disabled={isSuccess}
            placeholder="Ej. Pérez"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl text-sm font-medium transition-all outline-none disabled:opacity-50"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Correo Electrónico</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            {...register('email', { 
              pattern: { value: /^\S+@\S+$/i, message: 'Email inválido' }
            })}
            type="email" 
            disabled={isSuccess}
            placeholder="juan.perez@ejemplo.com"
            className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${errors.email ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all focus:ring-4 outline-none disabled:opacity-50`}
          />
        </div>
        {errors.email && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Teléfono</label>
        <div className="relative">
          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            {...register('telefono', { 
              required: 'El teléfono es obligatorio',
              validate: validateTelefono
            })}
            type="tel" 
            disabled={isSuccess}
            placeholder="+593 98 765 4321"
            className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${errors.telefono ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all focus:ring-4 outline-none disabled:opacity-50`}
          />
        </div>
        {errors.telefono && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase">{errors.telefono.message}</p>}
      </div>
    </div>
  );
};
