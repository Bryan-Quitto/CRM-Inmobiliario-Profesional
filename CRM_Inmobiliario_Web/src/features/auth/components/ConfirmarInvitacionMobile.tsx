import React from 'react';
import { ShieldCheck, User, Building, Lock, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import type { ConfirmarInvitacionLogic } from '../hooks/useConfirmarInvitacionLogic';
import { PasswordRequirements } from './confirmar-invitacion/PasswordRequirements';
import { PhoneInputWorldClass } from '@/features/contactos/components/PhoneInputWorldClass';
import { LegalModal } from '../../legal/components/LegalModal';

interface Props {
  logic: ConfirmarInvitacionLogic;
}

export const ConfirmarInvitacionMobile: React.FC<Props> = ({ logic }) => {
  const { formData, isLoading, error, hasPredefinedAgency, validations, allValid, legalAccepted, setLegalAccepted, handleChange, handleActivate } = logic;
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalType, setModalType] = React.useState<'privacidad' | 'terminos' | null>(null);

  const openModal = (type: 'privacidad' | 'terminos') => {
    setModalType(type);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col p-4">
      {/* Simplified Background */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-emerald-900/20 rounded-b-[3rem] blur-3xl pointer-events-none"></div>

      <div className="flex flex-col items-center mt-4 mb-4 z-10">
        <div className="h-12 w-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 mb-4">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-lg md:text-xl md:text-2xl font-black text-white tracking-tight text-center">
          Activa tu <span className="text-emerald-500">Perfil Pro</span>
        </h1>
        <p className="text-slate-400 mt-2 font-bold uppercase tracking-widest text-[11px] text-center">
          Completa tus datos para comenzar
        </p>
      </div>

      <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-3xl shadow-xl z-10 mb-4">
        <form onSubmit={handleActivate} className="flex flex-col gap-5">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-start gap-2 text-rose-400 text-xs font-bold">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input name="nombre" type="text" required value={formData.nombre} onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-emerald-500"
                  placeholder="Tu nombre" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Apellido</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input name="apellido" type="text" required value={formData.apellido} onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-emerald-500"
                  placeholder="Tu apellido" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
              <PhoneInputWorldClass
                value={formData.telefono}
                onChange={(phone) => handleChange({ target: { name: 'telefono', value: phone } } as unknown as React.ChangeEvent<HTMLInputElement>)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Agencia (Solo lectura)</label>
              <div className="relative">
                <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  name="agenciaNombre"
                  type="text"
                  value={formData.agenciaNombre || 'Independiente'}
                  onChange={handleChange}
                  disabled={hasPredefinedAgency}
                  className={`w-full bg-slate-900 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 text-sm outline-none ${hasPredefinedAgency ? 'opacity-60' : 'focus:border-emerald-500'}`}
                  placeholder="Nombre empresa"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Nueva Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input name="password" type={showPassword ? "text" : "password"} required value={formData.password} onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-10 text-sm outline-none focus:border-emerald-500"
                  placeholder="••••••••" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} required value={formData.confirmPassword} onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-10 text-sm outline-none focus:border-emerald-500"
                  placeholder="••••••••" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-2">
            <PasswordRequirements validations={validations} />
          </div>

          {/* Consentimiento Legal */}
          <div className="flex items-start gap-3 mt-2">
            <div className="flex items-center h-5">
              <input
                id="legal-checkbox-mobile"
                type="checkbox"
                checked={legalAccepted}
                onChange={(e) => setLegalAccepted(e.target.checked)}
                className="w-4 h-4 border border-slate-700 rounded bg-slate-900 checked:bg-emerald-500 checked:border-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-800 focus:ring-2 transition-all cursor-pointer"
              />
            </div>
            <div className="text-[11px] text-slate-400 leading-snug">
              <label htmlFor="legal-checkbox-mobile" className="cursor-pointer select-none">
                He leído y acepto los{' '}
              </label>
              <button type="button" onClick={() => openModal('terminos')} className="text-emerald-500 hover:text-emerald-400 hover:underline font-medium transition-colors">Términos de Servicio</button>
              {' '}y la{' '}
              <button type="button" onClick={() => openModal('privacidad')} className="text-emerald-500 hover:text-emerald-400 hover:underline font-medium transition-colors">Política de Privacidad</button>.
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading || !allValid}
            className={`w-full rounded-xl py-3.5 mt-2 font-black text-xs uppercase tracking-widest shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer 
              ${allValid ? 'bg-emerald-600 text-white shadow-emerald-600/20' : 'bg-slate-700 text-slate-400'}`}
          >
            {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <><CheckCircle2 className="h-5 w-5" /> Activar mi Cuenta</>}
          </button>
        </form>
      </div>

      <LegalModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={modalType}
      />
    </div>
  );
};
