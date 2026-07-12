import React from 'react';
import { Save, Building2 } from 'lucide-react';
import type { PerfilAgente } from '../../api/perfil';
import { PhoneInputWorldClass } from '@/features/contactos/components/PhoneInputWorldClass';
import { InputWithCounter } from '@/components/ui/InputWithCounter';
import { TextAreaWithCounter } from '@/components/ui/TextAreaWithCounter';
import { Controller, type UseFormReturn } from 'react-hook-form';
import type { FormDataPerfil } from '../../hooks/useConfiguracionPerfil';

interface DatosPersonalesFormProps {
  methods: UseFormReturn<FormDataPerfil>;
  perfil: PerfilAgente;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
}

const DatosPersonalesForm: React.FC<DatosPersonalesFormProps> = ({
  methods,
  perfil,
  onSubmit
}) => {
  const { register, control, formState: { errors } } = methods;

  return (
    <div className="bg-white shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden border border-slate-100">
      <div className="p-6">
        <form onSubmit={onSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Nombre */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nombre</label>
              <InputWithCounter
                {...register('nombre')}
                maxLength={100}
                type="text"
                className={`w-full px-6 py-4 rounded-2xl bg-slate-50 border ${errors.nombre ? 'border-rose-300 focus:border-rose-500 ring-rose-100' : 'border-transparent focus:border-indigo-200 focus:ring-indigo-100'} focus:bg-white focus:ring-4 outline-none transition-all font-bold text-slate-700`}
                placeholder="Tu nombre"
              />
              {errors.nombre && <p className="text-[10px] text-rose-500 font-bold mt-1 uppercase">{errors.nombre.message}</p>}
            </div>

            {/* Apellido */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Apellido</label>
              <InputWithCounter
                {...register('apellido')}
                maxLength={100}
                type="text"
                className={`w-full px-6 py-4 rounded-2xl bg-slate-50 border ${errors.apellido ? 'border-rose-300 focus:border-rose-500 ring-rose-100' : 'border-transparent focus:border-indigo-200 focus:ring-indigo-100'} focus:bg-white focus:ring-4 outline-none transition-all font-bold text-slate-700`}
                placeholder="Tu apellido"
              />
              {errors.apellido && <p className="text-[10px] text-rose-500 font-bold mt-1 uppercase">{errors.apellido.message}</p>}
            </div>

            {/* Email (Solo lectura) */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Email (Privado)</label>
              <input
                type="email"
                value={perfil?.email || ''}
                disabled
                className="w-full px-6 py-4 rounded-2xl bg-slate-100 border-transparent text-slate-400 cursor-not-allowed outline-none font-bold"
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Teléfono / WhatsApp</label>
              <Controller
                name="telefono"
                control={control}
                render={({ field }) => (
                  <PhoneInputWorldClass
                    value={field.value || ''}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* Dirección Física */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Dirección Física (Sucursal)</label>
              <InputWithCounter
                {...register('direccionFisica')}
                maxLength={500}
                type="text"
                className={`w-full px-6 py-4 rounded-2xl bg-slate-50 border ${errors.direccionFisica ? 'border-rose-300 focus:border-rose-500 ring-rose-100' : 'border-transparent focus:border-indigo-200 focus:ring-indigo-100'} focus:bg-white focus:ring-4 outline-none transition-all font-bold text-slate-700`}
                placeholder="Dirección de la sucursal donde trabajas"
              />
            </div>

            {/* Prompt Personal IA */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Personalidad de tu IA (Prompt Personal)</label>
              <TextAreaWithCounter
                {...register('promptPersonalIA')}
                maxLength={2000}
                rows={3}
                className={`w-full px-6 py-4 rounded-2xl bg-slate-50 border ${errors.promptPersonalIA ? 'border-rose-300 focus:border-rose-500 ring-rose-100' : 'border-transparent focus:border-indigo-200 focus:ring-indigo-100'} focus:bg-white focus:ring-4 outline-none transition-all font-bold text-slate-700 resize-none`}
                placeholder="Ej. Soy Juan Pérez. Uso emojis amigables..."
              />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1 mt-1">
                * Tu IA unirá esto a las reglas corporativas globales.
              </p>
            </div>

            {/* Agencia (Solo lectura) */}
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Agencia Asociada</label>
              <div className="relative group">
                <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={perfil?.agenciaNombre || 'Independiente'}
                  disabled
                  className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-100 border-transparent text-slate-500 cursor-not-allowed outline-none font-bold"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider ml-1 mt-1">
                * El nombre de la agencia es gestionado por la administración central.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-50 flex flex-col items-center gap-4">
            <button
              type="submit"
              className="flex items-center justify-center w-full gap-3 px-6 py-4 rounded-2xl font-black text-white transition-all transform active:scale-95 shadow-xl bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200 cursor-pointer"
            >
              <Save size={20} className="shrink-0" /> GUARDAR CAMBIOS
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DatosPersonalesForm;
