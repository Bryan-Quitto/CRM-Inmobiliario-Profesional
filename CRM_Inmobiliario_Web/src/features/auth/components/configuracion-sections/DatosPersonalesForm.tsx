import React from 'react';
import { Save, CheckCircle, Building2 } from 'lucide-react';
import type { PerfilAgente } from '../../api/perfil';
import type { FormDataPerfil } from '../../hooks/useConfiguracionPerfil';

interface DatosPersonalesFormProps {
  formData: FormDataPerfil;
  setFormData: React.Dispatch<React.SetStateAction<FormDataPerfil>>;
  perfil: PerfilAgente;
  showSuccess: boolean;
  handleSubmit: (e: React.FormEvent) => void;
}

const DatosPersonalesForm: React.FC<DatosPersonalesFormProps> = ({
  formData,
  setFormData,
  perfil,
  showSuccess,
  handleSubmit
}) => {
  return (
    <div className="bg-white shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden border border-slate-100">
      <div className="p-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Nombre */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nombre</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 outline-none transition-all font-bold text-slate-700"
                placeholder="Tu nombre"
                required
              />
            </div>

            {/* Apellido */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Apellido</label>
              <input
                type="text"
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 outline-none transition-all font-bold text-slate-700"
                placeholder="Tu apellido"
                required
              />
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
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => {
                  let val = e.target.value;
                  if (val && !val.startsWith('+')) {
                     val = '+593 ' + val.replace(/^0/, '');
                  }
                  setFormData({ ...formData, telefono: val });
                }}
                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 outline-none transition-all font-bold text-slate-700"
                placeholder="+593 98 765 4321"
              />
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

          <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
            <div>
              {showSuccess && (
                <span className="text-emerald-600 flex items-center gap-2 font-black text-sm animate-in fade-in slide-in-from-left-4">
                  <CheckCircle size={20} /> PERFIL ACTUALIZADO
                </span>
              )}
            </div>
            
            <button
              type="submit"
              className="flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-white transition-all transform active:scale-95 shadow-xl bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200 cursor-pointer"
            >
              <Save size={20} /> GUARDAR CAMBIOS
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DatosPersonalesForm;
