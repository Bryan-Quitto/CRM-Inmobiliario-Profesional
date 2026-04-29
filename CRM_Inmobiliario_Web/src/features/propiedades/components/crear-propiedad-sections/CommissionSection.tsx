import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { UserPlus, UserCircle, UserCheck, Phone } from 'lucide-react';
import type { CrearPropiedadDTO } from '../../api/crearPropiedad';
import { DynamicSearchSelect, type SearchItem } from '@/components/DynamicSearchSelect';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { getAgentes } from '@/features/configuracion/api/getAgentes';
import { swrDefaultConfig } from '@/lib/swr';
import type { Propiedad } from '../../types';

interface Props {
  initialData?: Propiedad;
}

export const CommissionSection = ({ initialData }: Props) => {
  const { register, control, setValue, formState: { errors } } = useFormContext<CrearPropiedadDTO>();
  const esCaptacionPropia = useWatch({ control, name: 'esCaptacionPropia' });
  const [isGuestMode, setIsGuestMode] = useState(false);

  const { data: agentes = [] } = useSWR('/configuracion/agentes', getAgentes, swrDefaultConfig);

  const agenteOptions = useMemo<SearchItem[]>(() => 
    agentes.map(a => ({
      id: a.id,
      title: `${a.nombre} ${a.apellido}`,
      subtitle: a.activo ? 'Agente Activo' : 'Agente Externo/Invitado',
      raw: a
    })),
    [agentes]
  );

  return (
    <div className="md:col-span-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex items-center gap-3 p-4 bg-blue-50/50 border-2 border-blue-100/50 rounded-[24px] hover:bg-blue-50 transition-all group cursor-pointer">
          <div className="relative inline-flex items-center">
            <input type="checkbox" {...register('esCaptacionPropia')} className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
          </div>
          <div>
            <span className="text-xs font-black text-slate-900 uppercase tracking-tight block">¿Captación propia?</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block opacity-70">Marcar si tú captaste la propiedad</span>
          </div>
        </label>

        <div className="bg-slate-50 border-2 border-slate-100 rounded-[24px] p-4 flex items-center justify-between gap-4 group hover:border-blue-200 transition-all">
          <div className="flex flex-col">
            <span className="text-xs font-black text-slate-900 uppercase tracking-tight">Comisión (%)</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest opacity-70">Porcentaje pactado</span>
          </div>
          <div className="relative w-24">
            <input 
              {...register('porcentajeComision', { required: true, min: 0, max: 100 })}
              type="number" 
              step="0.1"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-black text-blue-600 text-center focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Buscador de Captador (Solo si no es propia) */}
      {!esCaptacionPropia && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between px-1">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">¿Quién captó la propiedad?</label>
            <button
              type="button"
              onClick={() => {
                setIsGuestMode(!isGuestMode);
                setValue('captadorId', undefined);
                setValue('nuevoCaptador', undefined);
              }}
              className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1 cursor-pointer"
            >
              {isGuestMode ? <UserCircle className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
              {isGuestMode ? 'Seleccionar de la lista' : 'El agente no está registrado'}
            </button>
          </div>

          {!isGuestMode ? (
            <Controller
              name="captadorId"
              control={control}
              rules={{ required: !esCaptacionPropia && !isGuestMode ? 'Debes seleccionar un captador' : false }}
              render={({ field }) => (
                <DynamicSearchSelect
                  label="Buscar Agente Captador"
                  icon={UserCheck}
                  placeholder="Nombre del compañero..."
                  options={agenteOptions}
                  value={field.value}
                  initialLabel={initialData?.agenteNombre}
                  onChange={(id) => field.onChange(id)}
                  error={errors.captadorId?.message}
                />
              )}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-6 rounded-3xl border-2 border-dashed border-slate-200">
              <div className="md:col-span-2 flex items-center gap-2 mb-2">
                <UserPlus className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-black text-slate-900 uppercase tracking-tight">Registro de Agente Invitado</span>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nombre</label>
                <input 
                  {...register('nuevoCaptador.nombre', { required: isGuestMode })}
                  type="text" 
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                  placeholder="Ej. Juan"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Apellido</label>
                <input 
                  {...register('nuevoCaptador.apellido', { required: isGuestMode })}
                  type="text" 
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                  placeholder="Ej. Pérez"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Teléfono (WhatsApp)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input 
                    {...register('nuevoCaptador.telefono')}
                    type="tel" 
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                    placeholder="Ej. 0987654321"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
