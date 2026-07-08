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

export const DashboardPrincipalDesktop: React.FC<Props> = ({ logic }) => {
  const { data, syncing, isSupported, isSubscribed, greeting } = logic;
  const { perfil } = usePerfil();

  const isStorageFull = perfil && perfil.monthlyStorageBytesLimit > 0 && perfil.currentMonthStorageBytesUsed >= perfil.monthlyStorageBytesLimit;

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in duration-500">
        <Loader2 className="h-10 w-10 text-blue-700 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-700 uppercase tracking-widest italic">Iniciando motor de inteligencia comercial...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      {syncing && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900/90 backdrop-blur-xl text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10">
            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sincronizando Resumen...</span>
          </div>
        </div>
      )}

      {isSupported && !isSubscribed && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 flex items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in zoom-in-95 duration-500">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Activa las notificaciones en tiempo real</h3>
              <p className="text-sm text-slate-600 mt-0.5">Recibe alertas inmediatas cuando la IA requiera asistencia con un cliente o con las tareas de tu agenda.</p>
            </div> 
          </div>
          <Link 
            to="/configuracion/notificaciones"
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center gap-2"
          >
            Configurar
          </Link>
        </div>
      )}

      {isStorageFull && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in zoom-in-95 duration-500">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 text-red-700 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Has alcanzado tu límite mensual de almacenamiento ({Math.round(perfil.monthlyStorageBytesLimit / (1024 * 1024))} MB)</h3>
              <p className="text-sm text-slate-600 mt-0.5">
                Tu cuota se renovará en <strong>{perfil.daysUntilStorageReset} días</strong>. 
                Por favor, contáctate con <a href="mailto:soporte@luminacrminmobiliario.com" className="text-red-700 font-bold hover:underline">soporte@luminacrminmobiliario.com</a> si deseas asistencia.
              </p>
            </div> 
          </div>
        </div>
      )}

      <div className="relative bg-slate-900 rounded-3xl p-8 sm:p-10 shadow-2xl overflow-hidden flex items-center justify-between border border-slate-800">
        <div className="relative z-10 flex flex-col gap-2 max-w-lg">
          <div className="flex items-start gap-3">
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Hola de nuevo, <span className="text-blue-500">{greeting}</span>.
            </h1>
          </div>
          <p className="text-slate-400 font-medium text-sm sm:text-base">Aquí está el resumen estratégico de tu negocio hoy.</p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-2/3 md:w-1/2 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/60 to-transparent z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900 z-10"></div>
          <img src="/ivisual.webp" fetchPriority="high" alt="Smart Building" className="w-full h-full object-cover object-center opacity-80" />
        </div>
      </div>

      <KpiCards data={data} syncing={syncing} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <SeguimientoCritico data={data} />
        <EmbudoVentas data={data} syncing={syncing} />
      </div>
    </div>
  );
};
