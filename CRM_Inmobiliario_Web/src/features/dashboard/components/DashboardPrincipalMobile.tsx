import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2, BellRing, AlertCircle } from 'lucide-react';
import type { DashboardPrincipalLogicType } from '../hooks/useDashboardPrincipalLogic';
import { usePerfil } from '@/features/auth/api/perfil';
import { KpiCards } from './KpiCards';
import { SeguimientoCritico } from './SeguimientoCritico';
import { EmbudoVentas } from './EmbudoVentas';


interface Props {
  logic: DashboardPrincipalLogicType;
}

export const DashboardPrincipalMobile: React.FC<Props> = ({ logic }) => {
  const { data, syncing, isSupported, isSubscribed, greeting } = logic;
  const { perfil } = usePerfil();

  const isStorageFull = perfil && perfil.monthlyStorageBytesLimit > 0 && perfil.currentMonthStorageBytesUsed >= perfil.monthlyStorageBytesLimit;

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] w-full animate-in fade-in duration-500">
        <Loader2 className="h-8 w-8 text-blue-700 animate-spin mb-3 shrink-0" />
        <p className="w-full text-xs font-bold text-slate-700 uppercase tracking-widest italic text-center px-4 break-words">
          Iniciando motor de inteligencia comercial...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 relative pb-6 w-full">
      {syncing && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-300 w-max max-w-[90vw]">
          <div className="bg-slate-900/95 backdrop-blur-xl text-white px-5 py-2 rounded-full shadow-2xl flex items-center gap-2 border border-white/10 w-full">
            <Loader2 className="h-3 w-3 animate-spin text-blue-400 shrink-0" />
            <span className="text-[9px] font-black uppercase tracking-[0.15em] min-w-0 flex-1 break-words">Sincronizando...</span>
          </div>
        </div>
      )}

      {isSupported && !isSubscribed && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 flex flex-col gap-3 shadow-sm animate-in fade-in zoom-in-95 duration-500 w-full">
          <div className="flex items-start gap-3 w-full">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl shrink-0">
              <BellRing className="w-5 h-5 shrink-0" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-800 break-words">Activa las alertas</h3>
              <p className="text-xs text-slate-600 mt-1 break-words">Recibe notificaciones de la IA y de las tareas en tu agenda.</p>
            </div> 
          </div>
          <Link 
            to="/configuracion/notificaciones"
            className="w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm shrink-0"
          >
            Configurar
          </Link>
        </div>
      )}

      {isStorageFull && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm animate-in fade-in zoom-in-95 duration-500 w-full">
          <div className="flex items-start gap-3 w-full">
            <div className="p-2 bg-red-100 text-red-700 rounded-xl shrink-0">
              <AlertCircle className="w-5 h-5 shrink-0" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-800 break-words">Límite de Almacenamiento ({Math.round(perfil.monthlyStorageBytesLimit / (1024 * 1024))} MB)</h3>
              <p className="text-xs text-slate-600 mt-1 break-words">
                Tu cuota se renueva en <strong>{perfil.daysUntilStorageReset} días</strong>.<br/><br/>Contáctate con <a href="mailto:soporte@zielluxoracrm.com" className="text-red-700 font-bold hover:underline">soporte@zielluxoracrm.com</a> si deseas asistencia.
              </p>
            </div> 
          </div>
        </div>
      )}

      <div className="relative w-full bg-slate-900 rounded-3xl p-4 shadow-xl overflow-hidden flex flex-col justify-end min-h-[100px] border border-slate-800">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent z-10"></div>
          <img src="/ivisual.webp" fetchPriority="high" alt="Smart Building" className="w-full h-full object-cover object-top opacity-60" />
        </div>
        <div className="relative z-10 flex flex-col gap-1 min-w-0 w-full">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-lg md:text-xl md:text-2xl font-black text-white tracking-tight break-words">
              Hola, <span className="text-blue-500 break-words">{greeting}</span>.
            </h1>
          </div>
          <p className="text-slate-400 font-medium text-xs break-words">Resumen estratégico de hoy.</p>
        </div>
      </div>

      <div className="w-full overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
        <div className="w-fit min-w-full">
          <KpiCards data={data} syncing={syncing} />
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full">
        <div className="w-full overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
          <div className="w-fit min-w-[300px]">
            <SeguimientoCritico data={data} />
          </div>
        </div>
        <div className="w-full overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
          <div className="w-fit min-w-[300px]">
            <EmbudoVentas data={data} syncing={syncing} />
          </div>
        </div>
      </div>
    </div>
  );
};
