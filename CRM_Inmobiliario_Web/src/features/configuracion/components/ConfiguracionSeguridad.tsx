import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const ConfiguracionSeguridad: React.FC = () => {
  return (
    <div className="space-y-6">
      <section className="bg-slate-100/50 p-12 rounded-[40px] border border-slate-200/60 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-4">Próximamente</h2>
        <p className="text-slate-600 font-medium max-w-md text-lg">
          Panel de Seguridad y Actividad Anómala.
        </p>
        <p className="text-slate-500 mt-4">
          Aquí podrás monitorear accesos sospechosos y gestionar políticas de seguridad.
        </p>
      </section>
    </div>
  );
};

export default ConfiguracionSeguridad;
