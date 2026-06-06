import { NavLink, Outlet } from 'react-router-dom';
import { Bot, MessageSquare, MessageCircle, User, Settings2, Activity } from 'lucide-react';

const tabs = [
  { path: '/ia-logs/whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { path: '/ia-logs/facebook', label: 'Facebook', icon: MessageCircle },
  { path: '/ia-logs/personal', label: 'Personal', icon: User },
  { path: '/ia-logs/general', label: 'General', icon: Settings2 },
];

export const IaLogsLayout = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Cabecera del Layout Maestro */}
      <div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-2xl shadow-blue-600/30 rotate-3">
            <Bot className="h-8 w-8" />
          </div>
          Auditoría IA
        </h2>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-3 flex items-center gap-2">
          <Activity className="h-3 w-3 text-emerald-500" />
          Supervisión proactiva del asistente
        </p>
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
              {tab.label}
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
