import React from 'react';
import { ShieldCheck, Activity, AlertTriangle, Clock, ShieldBan } from 'lucide-react';
import type { ConfiguracionSeguridadLogic } from '../hooks/useConfiguracionSeguridadLogic';
import { TruncatedText } from '@/components/ui/TruncatedText';

interface Props {
  logic: ConfiguracionSeguridadLogic;
}

export const ConfiguracionSeguridadMobile: React.FC<Props> = ({ logic }) => {
  const { isAdmin, isLoadingPerfil, logs, isLoadingLogs } = logic;

  if (isLoadingPerfil) {
    return (
      <div className="space-y-4 w-full">
        <div className="h-32 w-full bg-slate-100 rounded-3xl animate-pulse"></div>
        <div className="h-64 w-full bg-slate-100 rounded-3xl animate-pulse"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-4 w-full">
        <section className="bg-rose-50/50 p-4 rounded-3xl border border-rose-200/60 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-1000 w-full">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4 shrink-0">
            <ShieldBan size={32} className="shrink-0" />
          </div>
          <h2 className="text-lg md:text-xl md:text-2xl font-black text-slate-800 tracking-tight mb-2 break-words w-full">Acceso Denegado</h2>
          <p className="text-slate-600 font-medium text-base mb-3 break-words w-full">
            El Centro de Seguridad y Auditoría está restringido.
          </p>
          <p className="text-slate-500 text-sm break-words w-full">
            Solo el administrador principal tiene los permisos necesarios para visualizar los registros de telemetría.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col w-full">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-3 w-full">
          <div className="flex justify-between items-start w-full gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 break-words">
                <ShieldCheck className="text-emerald-500 h-5 w-5 shrink-0" />
                Auditoría
              </h2>
            </div>
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm shrink-0">
              <Activity className="h-4 w-4 text-blue-500 shrink-0" />
              <div className="text-xs font-bold text-slate-700">
                Activa
              </div>
            </div>
          </div>
          <p className="text-xs font-medium text-slate-500 break-words w-full">
            Registro de actividad anómala y alertas en tiempo real.
          </p>
        </div>

        <div className="p-0 bg-slate-50/30">
          {isLoadingLogs ? (
            <div className="p-4 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="flex flex-col p-4 gap-3">
              {logs.map((log) => (
                <div key={log.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3 w-full">
                  <div className="flex justify-between items-start gap-2 w-full">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs uppercase shrink-0">
                        {log.agenteNombre.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <TruncatedText as="div" className="text-sm font-bold text-slate-800 truncate w-full">{log.agenteNombre}</TruncatedText>
                        <TruncatedText as="div" className="text-[10px] font-medium text-slate-500 font-mono truncate w-full">{log.agenteId.split('-')[0]}...</TruncatedText>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold shrink-0">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      {log.tipoIncidente}
                    </div>
                  </div>
                  
                  <p className="text-xs font-medium text-slate-600 bg-slate-50 p-2.5 rounded-xl break-words w-full">
                    {log.descripcion}
                  </p>
                  
                  <div className="flex items-center justify-end gap-1.5 text-[11px] font-medium text-slate-400 mt-1 w-full shrink-0">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    {new Date(log.timestamp).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center">
              <ShieldCheck className="mx-auto h-10 w-10 text-emerald-400 mb-3 shrink-0" />
              <h3 className="text-base font-bold text-slate-800">Todo en orden</h3>
              <p className="text-slate-500 font-medium text-sm mt-1">No hay actividades anómalas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
