import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface PasswordRequirementsProps {
  validations: {
    personal: boolean;
    length: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    match: boolean;
  };
}

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({ validations }) => {
  return (
    <div className="flex flex-col gap-1.5 p-4 bg-slate-900/40 rounded-2xl border border-slate-700/50">
      <Requirement met={validations.personal} label="Datos personales" />
      <Requirement met={validations.length} label="8+ caracteres" />
      <Requirement met={validations.hasUpper} label="Mayúscula" />
      <Requirement met={validations.hasNumber} label="Un número" />
      <Requirement met={validations.match} label="Coinciden" />
    </div>
  );
};

const Requirement = ({ met, label }: { met: boolean; label: string }) => (
  <div className={`flex items-center gap-2 text-[11px] font-bold transition-colors ${met ? 'text-emerald-400' : 'text-slate-500'}`}>
    {met ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3 opacity-30" />}
    {label}
  </div>
);
