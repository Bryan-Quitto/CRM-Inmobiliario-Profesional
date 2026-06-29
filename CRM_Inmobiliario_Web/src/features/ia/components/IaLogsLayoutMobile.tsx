import { NavLink, Outlet } from 'react-router-dom';
import { Bot, Activity } from 'lucide-react';
import { HelpButton } from '../../../components/ui/HelpButton';
import type { IaLogsLayoutLogicReturn } from '../hooks/useIaLogsLayoutLogic';

interface Props {
  logic: IaLogsLayoutLogicReturn;
}

export const IaLogsLayoutMobile = ({ logic }: Props) => {
  const { tabs } = logic;
  return (
    <div className="flex flex-col min-h-screen w-full min-w-0 bg-slate-50 pb-20 animate-in fade-in duration-500">
      {/* Cabecera del Layout Maestro (Mobile) */}
      <div className="px-4 pt-6 pb-4 bg-white shadow-sm z-10 sticky top-0 w-full min-w-0">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3 w-full min-w-0">
          <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/30 rotate-3 shrink-0">
            <Bot className="h-6 w-6 shrink-0" />
          </div>
          <div className="flex flex-1 items-center gap-3 min-w-0">
            <span className="min-w-0 break-words">Auditoría Sistema/IA</span>
            <div className="shrink-0 pt-0.5">
              <HelpButton title="Auditoría Sistema" path="/docs/manuales/manual_comunicaciones.md" />
            </div>
          </div>
        </h2>
        <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.2em] mt-2 flex items-center gap-1.5 w-full min-w-0 break-words">
          <Activity className="h-3 w-3 text-emerald-500 shrink-0" />
          <span className="flex-1 min-w-0 break-words">Supervisión proactiva</span>
        </p>

        {/* Top Scrolling Tab Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 scrollbar-hide w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  `cursor-pointer flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex-shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {tab.label}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Contenido de la subruta */}
      <div className="flex-1 px-4 py-6 bg-slate-50 w-full min-w-0 flex flex-col">
        <Outlet />
      </div>
    </div>
  );
};
