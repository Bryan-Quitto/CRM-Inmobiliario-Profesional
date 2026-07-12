import React from 'react';
import { Building2, Loader2, Pencil } from 'lucide-react';
import { PhoneInputWorldClass } from '@/features/contactos/components/PhoneInputWorldClass';
import type { ConfiguracionAgenciasLogic } from '../hooks/useConfiguracionAgenciasLogic';
import { InputWithCounter } from '@/components/ui/InputWithCounter';
import { TextAreaWithCounter } from '@/components/ui/TextAreaWithCounter';
import { Controller } from 'react-hook-form';

interface Props {
  logic: ConfiguracionAgenciasLogic;
}

export const AgenciaModal: React.FC<Props> = ({ logic }) => {
  const {
    isModalOpen,
    setIsModalOpen,
    editingAgency,
    isSubmitting,
    methods,
    onSubmit,
  } = logic;

  if (!isModalOpen || !methods) return null;

  const { register, control, formState: { errors } } = methods;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200 custom-scrollbar">
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl shrink-0">
              {editingAgency ? <Pencil size={24} /> : <Building2 size={24} />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight break-words">
                {editingAgency ? 'Editar Agencia' : 'Nueva Agencia'}
              </h3>
              <p className="text-sm text-slate-500 font-medium break-words">
                {editingAgency ? 'Modifica los datos corporativos de la agencia.' : 'Ingresa la información para registrar una nueva agencia.'}
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Nombre Comercial <span className="text-rose-500">*</span></label>
                <InputWithCounter
                  {...register('nombre')}
                  maxLength={150}
                  type="text"
                  className={`w-full px-4 py-3 bg-slate-50 border ${errors.nombre ? 'border-rose-300 focus:border-rose-500 ring-rose-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'} rounded-xl focus:outline-none focus:ring-2 transition-all font-medium`}
                  placeholder="Ej. RE/MAX Diamante"
                />
                {errors.nombre && <p className="text-[10px] text-rose-500 font-bold mt-1 uppercase">{errors.nombre.message}</p>}
              </div>
              
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Teléfono Corporativo</label>
                <Controller
                  name="telefonoCorporativo"
                  control={control}
                  render={({ field }) => (
                    <PhoneInputWorldClass
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Email Corporativo</label>
                <InputWithCounter
                  {...register('emailCorporativo')}
                  maxLength={255}
                  type="email"
                  className={`w-full px-4 py-3 bg-slate-50 border ${errors.emailCorporativo ? 'border-rose-300 focus:border-rose-500 ring-rose-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'} rounded-xl focus:outline-none focus:ring-2 transition-all font-medium`}
                  placeholder="contacto@agencia.com"
                />
                {errors.emailCorporativo && <p className="text-[10px] text-rose-500 font-bold mt-1 uppercase">{errors.emailCorporativo.message}</p>}
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Dirección Física</label>
                <InputWithCounter
                  {...register('direccionFisica')}
                  maxLength={500}
                  type="text"
                  className={`w-full px-4 py-3 bg-slate-50 border ${errors.direccionFisica ? 'border-rose-300 focus:border-rose-500 ring-rose-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'} rounded-xl focus:outline-none focus:ring-2 transition-all font-medium`}
                  placeholder="Dirección completa de la oficina..."
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Sitio Web</label>
                <InputWithCounter
                  {...register('sitioWeb')}
                  maxLength={255}
                  type="text"
                  className={`w-full px-4 py-3 bg-slate-50 border ${errors.sitioWeb ? 'border-rose-300 focus:border-rose-500 ring-rose-100' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'} rounded-xl focus:outline-none focus:ring-2 transition-all font-medium`}
                  placeholder="https://www.agencia.com"
                />
                {errors.sitioWeb && <p className="text-[10px] text-rose-500 font-bold mt-1 uppercase">{errors.sitioWeb.message}</p>}
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-black uppercase tracking-widest text-indigo-600 mb-2 flex flex-col sm:flex-row justify-start sm:justify-between items-start sm:items-center gap-2 sm:gap-0">
                  <span className="flex-1 min-w-0 break-words">Contexto Corporativo (Prompt para IA)</span>
                  <span className="text-[10px] font-medium normal-case text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">Altamente recomendado</span>
                </label>
                <TextAreaWithCounter
                  {...register('contextoCorporativoIA')}
                  maxLength={2000}
                  className={`w-full px-4 py-3 bg-indigo-50/30 border ${errors.contextoCorporativoIA ? 'border-rose-300 focus:border-rose-500 ring-rose-100' : 'border-indigo-100 focus:border-indigo-500 focus:ring-indigo-500/20'} rounded-xl focus:outline-none focus:ring-2 transition-all font-medium min-h-[120px] resize-y`}
                  placeholder="Ej. Somos una agencia especializada en propiedades comerciales de lujo en Quito. Nuestro trato es extremadamente formal..."
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto px-6 py-3 font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer text-center"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                {editingAgency ? 'Guardar Cambios' : 'Crear Agencia'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
