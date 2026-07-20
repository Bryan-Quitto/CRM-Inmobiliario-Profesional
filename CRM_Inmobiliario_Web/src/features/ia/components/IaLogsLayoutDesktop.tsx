import { NavLink, Outlet } from 'react-router-dom';
import { Bot, Activity, AlertCircle } from 'lucide-react';
import { HelpButton } from '../../../components/ui/HelpButton';
import type { IaLogsLayoutLogicReturn } from '../hooks/useIaLogsLayoutLogic';

interface Props {
  logic: IaLogsLayoutLogicReturn;
}

export const IaLogsLayoutDesktop = ({ logic }: Props) => {
  const { tabs } = logic;
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Cabecera del Layout Maestro */}
      <div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-2xl shadow-blue-600/30 rotate-3">
            <Bot className="h-8 w-8" />
          </div>
          <div className="flex items-center gap-3">
            Auditoría Sistema/IA
            <div className="pt-1.5">
              <HelpButton title="Auditoría Sistema" path="/docs/manuales/manual_sistema-ia_registros.md" />
            </div>
          </div>
        </h2>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-3 flex items-center gap-2">
          <Activity className="h-3 w-3 text-emerald-500" />
          Supervisión proactiva del asistente y del sistema
        </p>
      {/* Banner Informativo sobre Consentimiento */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-4">
        <div className="h-10 w-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">Consentimiento de IA Activo</h4>
          <p className="text-xs text-amber-700/90 mt-1 font-medium leading-relaxed max-w-3xl">
            Los clientes nuevos reciben automáticamente un mensaje solicitando su consentimiento antes de que la IA registre o responda mensajes. 
            Puedes otorgar o denegar este permiso manualmente desde el perfil de cada contacto (Tarjeta de Contacto) si cuentas con su autorización explícita por otro medio.
          </p>
        </div>
      </div>
    </div>

      {/* NavMenu */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 border-b-2 border-slate-100 scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `cursor-pointer flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'
                    : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span className="flex items-center gap-1.5">
                {tab.label}
                <div className="cursor-pointer" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                  <HelpButton title={`Registros de ${tab.label}`} path={`/docs/manuales/manual_sistema-ia_registros.md#${tab.label.toLowerCase()}`} />
                </div>
              </span>
            </NavLink>
          );
        })}
      </div>

      {/* Contenido de la subruta */}
      <div>
        <Outlet />
      </div>
    </div>
  );
};
