import { type UseFormRegister, type FieldErrors } from 'react-hook-form';
import { User, Mail, Phone } from 'lucide-react';
import { type CrearClienteDTO } from '../../api/crearCliente';

interface CrearClienteFieldsProps {
  register: UseFormRegister<CrearClienteDTO>;
  errors: FieldErrors<CrearClienteDTO>;
  isSuccess: boolean;
  validateTelefono: (value: string) => Promise<string | true>;
}

export const CrearClienteFields = ({
  register,
  errors,
  isSuccess,
  validateTelefono
}: CrearClienteFieldsProps) => {
  return (
    <div className="space-y-6">
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
