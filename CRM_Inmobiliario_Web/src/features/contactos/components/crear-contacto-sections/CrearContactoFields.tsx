import { type UseFormRegister, type FieldErrors, type Control, useWatch, Controller } from 'react-hook-form';
import { User, Mail, UserCheck, Search, ShieldAlert } from 'lucide-react';
import { type CrearContactoDTO } from '../../api/crearContacto';
import { PhoneInputWorldClass } from '../PhoneInputWorldClass';
import type { Contacto } from '../../types';
import { InputWithCounter } from '@/components/ui/InputWithCounter';
import { TruncatedText } from '@/components/ui/TruncatedText';

interface CrearContactoFieldsProps {
  register: UseFormRegister<CrearContactoDTO>;
  errors: FieldErrors<CrearContactoDTO>;
  control: Control<CrearContactoDTO>;
  setValue: (name: keyof CrearContactoDTO, value: string | boolean | undefined) => void;
  isSuccess: boolean;
  validateTelefono: (value: string) => Promise<string | true>;
  roleError?: boolean;
  initialData?: Contacto;
}

export const CrearContactoFields = ({
  register,
  errors,
  control,
  setValue,
  isSuccess,
  validateTelefono,
  roleError,
  initialData
}: CrearContactoFieldsProps) => {
  const esCliente = useWatch({ control, name: 'esCliente' });
  const esPropietario = useWatch({ control, name: 'esPropietario' });
  const origen = useWatch({ control, name: 'origen' });
  const isWhatsApp = origen?.toLowerCase().includes('whatsapp');

  const numPropiedadesCaptadas = initialData?.numeroPropiedadesCaptadas ?? initialData?.propiedadesCaptadas?.length ?? 0;
  const tienePropiedadesComoPropietario = numPropiedadesCaptadas > 0;
  
  const tienePropiedadesCerradasComoCliente = initialData ? ((initialData.numeroReservas || 0) > 0 || (initialData.numeroCierres || 0) > 0) : false;



  return (
    <div className="space-y-8 w-full">
      {/* Sección de Roles */}
      <div className="space-y-3 w-full">
        <label className={`text-[10px] font-black uppercase tracking-widest ml-1 transition-colors ${roleError ? 'text-rose-500' : 'text-slate-400'} block break-words`}>
          Roles del Contacto {roleError && '(Debe seleccionar al menos uno)'}
        </label>
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 p-1 rounded-3xl transition-all w-full ${roleError ? 'bg-rose-50 ring-2 ring-rose-200' : ''}`}>
          <button
            type="button"
            onClick={() => {
              if (tienePropiedadesCerradasComoCliente) return;
              setValue('esCliente', !esCliente);
            }}
            disabled={isSuccess || tienePropiedadesCerradasComoCliente}
            title={tienePropiedadesCerradasComoCliente ? "No se puede quitar el rol porque tiene propiedades reservadas, alquiladas o vendidas." : ""}
            className={`relative flex items-center gap-3 p-3 rounded-2xl border-2 transition-all w-full ${
              tienePropiedadesCerradasComoCliente ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
            } ${
              esCliente 
                ? (tienePropiedadesCerradasComoCliente ? 'border-slate-300 bg-slate-100' : 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/10')
                : 'border-slate-100 bg-slate-50 hover:border-slate-200'
            }`}
          >
            <div className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center transition-colors ${
              esCliente ? (tienePropiedadesCerradasComoCliente ? 'bg-slate-400' : 'bg-blue-500') : 'bg-slate-200'
            }`}>
              <Search className={`h-4 w-4 shrink-0 ${esCliente ? 'text-white' : 'text-slate-500'}`} />
            </div>
            <div className="text-left flex-1 min-w-0 pr-6">
              <TruncatedText as="p" className={`text-xs font-black uppercase truncate ${esCliente ? (tienePropiedadesCerradasComoCliente ? 'text-slate-700' : 'text-blue-900') : 'text-slate-500'}`}>Cliente</TruncatedText>
              <TruncatedText as="p" className={`text-[9px] font-bold uppercase leading-none mt-0.5 truncate ${esCliente ? (tienePropiedadesCerradasComoCliente ? 'text-slate-500' : 'text-blue-600') : 'text-slate-400'}`}>
                {esCliente ? 'Habilitado' : 'Inactivo'}
              </TruncatedText>
            </div>
            {tienePropiedadesCerradasComoCliente && (
              <ShieldAlert className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
               if (tienePropiedadesComoPropietario) return;
               setValue('esPropietario', !esPropietario);
            }}
            disabled={isSuccess || tienePropiedadesComoPropietario}
            title={tienePropiedadesComoPropietario ? "No se puede quitar el rol de propietario porque tiene propiedades enlazadas." : ""}
            className={`relative flex items-center gap-3 p-3 rounded-2xl border-2 transition-all w-full ${
              tienePropiedadesComoPropietario ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
            } ${
              esPropietario 
                ? (tienePropiedadesComoPropietario ? 'border-slate-300 bg-slate-100' : 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/10')
                : 'border-slate-100 bg-slate-50 hover:border-slate-200'
            }`}
          >
            <div className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center transition-colors ${
              esPropietario ? (tienePropiedadesComoPropietario ? 'bg-slate-400' : 'bg-emerald-500') : 'bg-slate-200'
            }`}>
              <UserCheck className={`h-4 w-4 shrink-0 ${esPropietario ? 'text-white' : 'text-slate-500'}`} />
            </div>
            <div className="text-left flex-1 min-w-0 pr-6">
              <TruncatedText as="p" className={`text-xs font-black uppercase truncate ${esPropietario ? (tienePropiedadesComoPropietario ? 'text-slate-700' : 'text-emerald-900') : 'text-slate-500'}`}>Propietario</TruncatedText>
              <TruncatedText as="p" className={`text-[9px] font-bold uppercase leading-none mt-0.5 truncate ${esPropietario ? (tienePropiedadesComoPropietario ? 'text-slate-500' : 'text-emerald-600') : 'text-slate-400'}`}>
                {esPropietario ? 'Habilitado' : 'Inactivo'}
              </TruncatedText>
            </div>
            {tienePropiedadesComoPropietario && (
               <ShieldAlert className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>
        <input type="hidden" {...register('esCliente')} />
        <input type="hidden" {...register('esPropietario')} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div className="space-y-2 w-full">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 block break-words">Nombre</label>
          <InputWithCounter 
            {...register('nombre')}
            icon={<User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 shrink-0 text-slate-400" />}
            maxLength={100}
            type="text" 
            disabled={isSuccess}
            placeholder="Ej. Juan"
            className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${errors.nombre ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all outline-none disabled:opacity-50`}
          />
          {errors.nombre && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase break-words">{errors.nombre.message}</p>}
        </div>

        <div className="space-y-2 w-full">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 block break-words">Apellido</label>
          <InputWithCounter 
            {...register('apellido')}
            maxLength={100}
            type="text" 
            disabled={isSuccess}
            placeholder="Ej. Pérez"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 rounded-2xl text-sm font-medium transition-all outline-none disabled:opacity-50"
          />
          {errors.apellido && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase break-words">{errors.apellido.message}</p>}
        </div>
      </div>

      <div className="space-y-2 w-full">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 block break-words">Correo Electrónico</label>
        <InputWithCounter 
          {...register('email')}
          icon={<Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 shrink-0 text-slate-400" />}
          maxLength={150}
          type="email" 
          disabled={isSuccess}
          placeholder="juan.perez@ejemplo.com"
          className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${errors.email ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all outline-none disabled:opacity-50`}
        />
        {errors.email && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase break-words">{errors.email.message}</p>}
      </div>

      <div className="space-y-2 w-full">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 block break-words">
          Teléfono {isWhatsApp && <span className="text-rose-500">*</span>}
        </label>
        <Controller
          name="telefono"
          control={control}
          rules={{ 
            validate: validateTelefono
          }}
          render={({ field: { onChange, onBlur, value, ref } }) => (
            <PhoneInputWorldClass
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              ref={ref}
              disabled={isSuccess}
              hasError={!!errors.telefono}
            />
          )}
        />
        {errors.telefono && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase break-words">{errors.telefono.message}</p>}
      </div>
    </div>
  );
};