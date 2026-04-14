import React from 'react';
import ConfiguracionPerfil from '../../auth/components/ConfiguracionPerfil';
import { InvitarAgenteForm } from './InvitarAgenteForm';
import { UserCog, UserPlus } from 'lucide-react';
import { usePerfil } from '../../auth/api/perfil';

export const ConfiguracionView: React.FC = () => {
  const { perfil } = usePerfil();
  const ADMIN_ID = 'd4a6efdd-b801-40fb-901e-64e36f6b1400';
  const isAdmin = perfil?.id === ADMIN_ID;

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-10 px-6">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight italic">Panel de Control</h1>
        <p className="text-slate-500 font-medium mt-2">Gestiona tu identidad y el equipo de agentes autorizados.</p>
      </header>

      <div className="grid grid-cols-1 gap-12">
        {/* Sección: Mi Perfil */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 px-6">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <UserCog size={20} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Identidad Corporativa</h2>
          </div>
          <ConfiguracionPerfil />
        </section>

        {/* Sección: Gestión de Equipo (Solo para el Administrador d4a6efdd...) */}
        {isAdmin && (
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
                  Desde aquí puedes invitar a nuevos agentes a unirse a tu instancia del CRM. 
                  Recibirán un correo electrónico con un enlace seguro para configurar su contraseña y acceder al sistema.
                </p>
                <ul className="space-y-3">
                  {[
                    'Acceso seguro mediante invitación por correo.',
                    'Vinculación automática a tu base de datos.',
                    'Configuración de contraseña obligatoria al primer ingreso.',
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
        )}
      </div>
    </div>
  );
};

export default ConfiguracionView;
