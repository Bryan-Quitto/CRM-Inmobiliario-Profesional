import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useConfirmarInvitacion } from '../hooks/useConfirmarInvitacion';
import { ConfirmarInvitacionForm } from './confirmar-invitacion/ConfirmarInvitacionForm';

export const ConfirmarInvitacion: React.FC = () => {
  const {
    formData,
    isLoading,
    error,
    hasPredefinedAgency,
    validations,
    allValid,
    handleChange,
    handleActivate
  } = useConfirmarInvitacion();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-xl animate-in fade-in zoom-in duration-700">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-emerald-600/40 mb-4">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight text-center">
            Activa tu <span className="text-emerald-500">Perfil Pro</span>
          </h1>
          <p className="text-slate-400 mt-2 font-bold uppercase tracking-[0.2em] text-[10px]">
            Completa tus datos para comenzar
          </p>
        </div>

        <ConfirmarInvitacionForm 
          formData={formData}
          isLoading={isLoading}
          error={error}
          hasPredefinedAgency={hasPredefinedAgency}
          validations={validations}
          allValid={allValid}
          handleChange={handleChange}
          handleActivate={handleActivate}
        />
      </div>
    </div>
  );
};
