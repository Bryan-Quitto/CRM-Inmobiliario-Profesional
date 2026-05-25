import React from 'react';
import { Users } from 'lucide-react';
import { ListaAgentes } from './ListaAgentes';

export const ConfiguracionAgentes: React.FC = () => {
  return (
    <div className="space-y-6">
      <section className="space-y-6 bg-slate-100/50 p-8 rounded-[40px] border border-slate-200/60 animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
            <Users size={20} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Agentes Actuales</h2>
        </div>
        
        <ListaAgentes />
      </section>
    </div>
  );
};

export default ConfiguracionAgentes;
