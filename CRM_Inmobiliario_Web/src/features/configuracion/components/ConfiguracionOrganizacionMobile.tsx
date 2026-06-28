import React from 'react';
import { UserPlus } from 'lucide-react';
import { InvitarAgenteForm } from './InvitarAgenteForm';
import type { ConfiguracionOrganizacionLogic } from '../hooks/useConfiguracionOrganizacionLogic';

interface Props {
  logic: ConfiguracionOrganizacionLogic;
}

export const ConfiguracionOrganizacionMobile: React.FC<Props> = () => {
  return (
    <div className="space-y-4 w-full">
      <section className="space-y-4 bg-slate-100/50 p-4 rounded-3xl border border-slate-200/60 animate-in fade-in slide-in-from-top-4 duration-1000 w-full">
        <div className="flex items-center gap-3 mb-4 w-full">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg shrink-0">
            <UserPlus size={20} />
          </div>
          <h2 className="text-lg md:text-xl font-black text-slate-800 tracking-tight flex-1 min-w-0 break-words">Gestión de Equipo</h2>
        </div>
        
        <div className="flex flex-col gap-4 w-full">
          <div className="space-y-4 w-full">
            <p className="text-slate-600 font-medium leading-relaxed text-sm break-words">
              Invita a nuevos agentes y vinculalos a sus respectivas agencias. 
              Recibirán un correo con un enlace seguro.
            </p>
            <ul className="space-y-3 w-full">
              {[
                'Acceso seguro por invitación.',
                'Vinculación a agencias multi-tenant.',
                'Configuración de contraseña al primer ingreso.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs font-bold text-slate-500 w-full">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-1.5" />
                  <span className="leading-relaxed flex-1 min-w-0 break-words">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full">
            <InvitarAgenteForm />
          </div>
        </div>
      </section>
    </div>
  );
};
