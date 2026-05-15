import { useMemo, useState } from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { UserPlus, UserCircle, UserCheck, Phone, User } from 'lucide-react';
import useSWR from 'swr';

import type { CrearPropiedadDTO } from '../../api/crearPropiedad';
import { DynamicSearchSelect, type SearchItem } from '@/components/DynamicSearchSelect';
import { getAgentes } from '@/features/configuracion/api/getAgentes';
import { getContactos } from '@/features/contactos/api/getContactos';
import { swrDefaultConfig } from '@/lib/swr';
import type { Propiedad } from '../../types';
import { usePerfil } from '@/features/auth/api/perfil';

interface Props {
  initialData?: Propiedad;
}

export const CommissionSection = ({ initialData }: Props) => {
  const { register, control, setValue, formState: { errors } } = useFormContext<CrearPropiedadDTO>();
  const { perfil } = usePerfil();
  const esCaptacionPropia = useWatch({ control, name: 'esCaptacionPropia' });
  const esCaptadorActivo = useWatch({ control, name: 'esCaptadorActivo' });

  // Estados para cambios MANUALES del usuario
  const [userSelectedMode, setUserSelectedMode] = useState<'list' | 'guest' | null>(null);

  // Modo derivado para la UI (prioriza selección manual, cae a detección por initialData)
  const { isGuestMode } = useMemo(() => {
    if (userSelectedMode) {
      return {
        isGuestMode: userSelectedMode === 'guest'
      };
    }

    // Detección automática basada en datos iniciales
    if (initialData && !initialData.esCaptacionPropia) {
      // Es invitado si no tiene ID pero sí nombre
      const esInvitado = !initialData.agenteId && !!initialData.agenteNombre;
      
      return {
        isGuestMode: esInvitado
      };
    }

    return { isGuestMode: false };
  }, [userSelectedMode, initialData]);

  const { data: agentes = [] } = useSWR('/configuracion/agentes', getAgentes, swrDefaultConfig);
  const { data: contactos = [] } = useSWR('/contactos', getContactos, swrDefaultConfig);

  const agenteOptions = useMemo<SearchItem[]>(() => {
    if (!perfil?.id) return [];
    
    const currentId = perfil.id.toLowerCase();
    return agentes
      .filter(a => a.id.toLowerCase() !== currentId) // Filtro robusto
      .map(a => ({
        id: a.id,
        title: `${a.nombre} ${a.apellido}`,
        subtitle: a.activo ? 'Agente Activo' : 'Agente Externo/Invitado',
        raw: a
      }));
  }, [agentes, perfil]);

  const contactoOptions = useMemo<SearchItem[]>(() => 
    contactos.map(c => ({
      id: c.id,
      title: `${c.nombre} ${c.apellido || ''}`,
      subtitle: c.esPropietario ? 'Propietario' : 'Contacto',
      raw: c
    })),
    [contactos]
  );

  const handleModeChange = (mode: 'list' | 'guest') => {
    setUserSelectedMode(mode);
    
    // Limpiar campos según el modo
    setValue('captadorId', undefined);
    setValue('nuevoCaptador', undefined);

    // Si es invitado, por defecto el captador NO es activo (gestiona el creador)
    if (mode === 'guest') {
      setValue('esCaptadorActivo', false);
    } else {
      setValue('esCaptadorActivo', true);
    }
  };

  const handleToggleCaptacionPropia = (checked: boolean) => {
    setValue('esCaptacionPropia', checked);
    if (checked) {
      setValue('esCaptadorActivo', true);
      setUserSelectedMode(null);
    }
  };

  // Solo mostramos el nombre inicial si NO era captación propia originalmente
  const captadorInitialLabel = !initialData?.esCaptacionPropia ? initialData?.agenteNombre : undefined;

  return (
    <div className="md:col-span-6 space-y-8">
      {/* Sección de Propietario (Spec 015) */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2 px-1">
          <User className="h-4 w-4 text-blue-500" />
          <label className="text-xs font-black text-slate-900 uppercase tracking-widest">Dueño de la Propiedad</label>
        </div>
        
        <Controller
          name="propietarioId"
          control={control}
          render={({ field }) => (
            <DynamicSearchSelect
              label="Asignar Propietario"
              icon={UserCheck}
              placeholder="Buscar por nombre o teléfono..."
              options={contactoOptions}
              value={field.value}
              initialLabel={initialData?.propietarioNombre}
              onChange={(id) => field.onChange(id)}
              error={errors.propietarioId?.message}
            />
          )}
        />
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight px-1 italic">
          * Si el contacto es un Contacto, se convertirá automáticamente en Propietario al guardar.
        </p>
      </div>

      <div className="border-t border-slate-100 my-6"></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex items-center gap-3 p-4 bg-blue-50/50 border-2 border-blue-100/50 rounded-[24px] hover:bg-blue-50 transition-all group cursor-pointer">
          <div className="relative inline-flex items-center">
            <input 
              type="checkbox" 
              checked={esCaptacionPropia}
              onChange={(e) => handleToggleCaptacionPropia(e.target.checked)}
              className="sr-only peer" 
            />
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
          <div className="flex flex-col gap-3 px-1">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">¿Quién captó la propiedad?</label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleModeChange('list')}
                className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all flex items-center gap-2 cursor-pointer ${!isGuestMode ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
              >
                <UserCircle className="h-3 w-3" />
                De la lista
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('guest')}
                className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all flex items-center gap-2 cursor-pointer ${isGuestMode ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
              >
                <UserPlus className="h-3 w-3" />
                Agente Invitado
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-2 border-slate-100 rounded-[24px] flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 uppercase tracking-tight">¿El agente usa el sistema?</span>
                {esCaptadorActivo ? (
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase rounded-md tracking-tighter">Activo</span>
                ) : (
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black uppercase rounded-md tracking-tighter">Gestionado por ti</span>
                )}
              </div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest opacity-70">
                {esCaptadorActivo 
                  ? "El agente captador podrá editar y cambiar estados." 
                  : "Tú mantendrás el control total de edición de esta propiedad."}
              </span>
            </div>
            <div className="relative inline-flex items-center">
              <input 
                type="checkbox" 
                {...register('esCaptadorActivo')}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 shadow-inner"></div>
            </div>
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
                  initialLabel={captadorInitialLabel}
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
