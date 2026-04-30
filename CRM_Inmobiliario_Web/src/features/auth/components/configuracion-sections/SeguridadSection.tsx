import React from 'react';
import { ShieldCheck, Lock, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import type { PwdData } from '../../hooks/useConfiguracionPerfil';

interface SeguridadSectionProps {
  pwdData: PwdData;
  setPwdData: React.Dispatch<React.SetStateAction<PwdData>>;
  isUpdatingPwd: boolean;
  validations: {
    length: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    match: boolean;
  };
  allValid: boolean;
  handleUpdatePassword: (e: React.FormEvent) => void;
}

const SeguridadSection: React.FC<SeguridadSectionProps> = ({
  pwdData,
  setPwdData,
  isUpdatingPwd,
  validations,
  allValid,
  handleUpdatePassword
}) => {
  return (
    <div className="bg-white shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden border border-slate-100">
      <div className="p-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Seguridad y Acceso</h3>
            <p className="text-sm font-bold text-slate-400">Actualiza tu contraseña principal</p>
          </div>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-8">
          <div className="space-y-6">
            {/* Contraseña Actual */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Contraseña Actual</label>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="password"
                  value={pwdData.currentPassword}
                  onChange={(e) => setPwdData({ ...pwdData, currentPassword: e.target.value })}
                  className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 outline-none transition-all font-bold text-slate-700"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nueva Contraseña */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nueva Contraseña</label>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="password"
                    value={pwdData.password}
                    onChange={(e) => setPwdData({ ...pwdData, password: e.target.value })}
                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 outline-none transition-all font-bold text-slate-700"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Confirmar Contraseña */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Confirmar Contraseña</label>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="password"
                    value={pwdData.confirmPassword}
                    onChange={(e) => setPwdData({ ...pwdData, confirmPassword: e.target.value })}
                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 outline-none transition-all font-bold text-slate-700"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <Requirement met={validations.length} label="Mínimo 8 caracteres" />
            <Requirement met={validations.hasUpper} label="Una mayúscula" />
            <Requirement met={validations.hasNumber} label="Un número" />
            <Requirement met={validations.match} label="Las contraseñas coinciden" />
          </div>

          <div className="pt-8 border-t border-slate-50 flex items-center justify-end">
            <button
              type="submit"
              disabled={isUpdatingPwd || !allValid || !pwdData.currentPassword}
              className={`cursor-pointer flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-white transition-all transform active:scale-95 shadow-xl ${
                allValid && pwdData.currentPassword 
                  ? 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200' 
                  : 'bg-slate-300 pointer-events-none'
              }`}
            >
              {isUpdatingPwd ? <Loader2 className="animate-spin h-5 w-5" /> : <><Lock size={20} /> ACTUALIZAR CONTRASEÑA</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Requirement = ({ met, label }: { met: boolean; label: string }) => (
  <div className={`flex items-center gap-2 text-[10px] font-bold transition-colors ${met ? 'text-indigo-600' : 'text-slate-400'}`}>
    {met ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3 opacity-30" />}
    {label}
  </div>
);

export default SeguridadSection;
