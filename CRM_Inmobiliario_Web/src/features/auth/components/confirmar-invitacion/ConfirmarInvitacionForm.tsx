import React from 'react';
import { User, Building, Phone, Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { PasswordRequirements } from './PasswordRequirements';

interface ConfirmarInvitacionFormProps {
  formData: {
    nombre: string;
    apellido: string;
    telefono: string;
    agenciaId: string;
    agenciaNombre: string;
    password: string;
    confirmPassword: string;
  };
  isLoading: boolean;
  error: string | null;
  hasPredefinedAgency: boolean;
  validations: {
    personal: boolean;
    length: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    match: boolean;
  };
  allValid: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleActivate: (e: React.FormEvent) => void;
}

export const ConfirmarInvitacionForm: React.FC<ConfirmarInvitacionFormProps> = ({
  formData,
  isLoading,
  error,
  hasPredefinedAgency,
  validations,
  allValid,
  handleChange,
  handleActivate
}) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 p-8 rounded-[2rem] shadow-2xl">
      <form onSubmit={handleActivate} className="space-y-6">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start gap-3 text-rose-400 text-sm font-bold">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Fila 1: Nombre y Apellido */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input name="nombre" type="text" required value={formData.nombre} onChange={handleChange}
                className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:border-emerald-500 transition-all"
                placeholder="Tu nombre" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Apellido</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input name="apellido" type="text" required value={formData.apellido} onChange={handleChange}
                className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:border-emerald-500 transition-all"
                placeholder="Tu apellido" />
            </div>
          </div>
        </div>

        {/* Fila 2: Teléfono y Agencia */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input name="telefono" type="tel" required value={formData.telefono} onChange={handleChange}
                className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:border-emerald-500 transition-all"
                placeholder="+593 ..." />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Agencia (Solo lectura)</label>
            <div className="relative group">
              <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input
                name="agenciaNombre"
                type="text"
                value={formData.agenciaNombre || 'Independiente'}
                onChange={handleChange}
                disabled={hasPredefinedAgency}
                className={`w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl py-3 pl-11 pr-4 text-sm outline-none transition-all ${hasPredefinedAgency ? 'opacity-60 cursor-not-allowed border-dashed' : 'focus:border-emerald-500'}`}
                placeholder="Nombre empresa"
              />
            </div>
          </div>
        </div>

        {/* Contraseñas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nueva Contraseña</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input name="password" type="password" required value={formData.password} onChange={handleChange}
                className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:border-emerald-500 transition-all"
                placeholder="••••••••" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
              <input name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange}
                className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl py-3 pl-11 pr-4 text-sm outline-none focus:border-emerald-500 transition-all"
                placeholder="••••••••" />
            </div>
          </div>
        </div>

        {/* Checklist */}
        <PasswordRequirements validations={validations} />

        <button 
          type="submit" 
          disabled={isLoading || !allValid}
          className={`w-full rounded-xl py-4 font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer 
            ${allValid ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20' : 'bg-slate-700 text-slate-400'}`}
        >
          {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <><CheckCircle2 className="h-5 w-5" /> Activar mi Cuenta</>}
        </button>
      </form>
    </div>
  );
};
