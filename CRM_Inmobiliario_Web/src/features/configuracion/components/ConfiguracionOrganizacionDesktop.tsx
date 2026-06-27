import React from 'react';
import { UserPlus } from 'lucide-react';
import { InvitarAgenteForm } from './InvitarAgenteForm';
import type { ConfiguracionOrganizacionLogic } from '../hooks/useConfiguracionOrganizacionLogic';

interface Props {
  logic: ConfiguracionOrganizacionLogic;
}

export const ConfiguracionOrganizacionDesktop: React.FC<Props> = () => {
  return (
    <div className="space-y-12">
      {/* Gestión de Equipo */}
      <section className="space-y-6 bg-slate-100/50 p-8 rounded-[40px] border border-slate-200/60 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
            <UserPlus size={20} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gestión de Equipo</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <p className="text-slate-600 font-medium leading-relaxed">
              Invita a nuevos agentes y vinculalos a sus respectivas agencias. 
              Recibirán un correo con un enlace seguro.
            </p>
            <ul className="space-y-3">
              {[
                'Acceso seguro por invitación.',
                'Vinculación a agencias multi-tenant.',
                'Configuración de contraseña al primer ingreso.',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm font-bold text-slate-500">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <InvitarAgenteForm />
          </div>
        </div>
      </section>
    </div>
  );
};
