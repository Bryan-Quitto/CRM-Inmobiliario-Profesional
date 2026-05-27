import React from 'react';
import { ShieldCheck, Activity, AlertTriangle, Clock, ShieldBan } from 'lucide-react';
import useSWR from 'swr';
import { useAuth } from '../../auth/hooks/useAuth';
import { getLogsSeguridad } from '../api/getLogsSeguridad';

export const ConfiguracionSeguridad: React.FC = () => {
  const { isAdmin, isLoading: isLoadingPerfil } = useAuth();

  const { data: logs, isLoading: isLoadingLogs } = useSWR(
    isAdmin ? '/configuracion/seguridad/logs' : null,
    getLogsSeguridad,
    { keepPreviousData: true }
  );

  if (isLoadingPerfil) {
    return (
      <div className="space-y-6">
        <div className="h-40 bg-slate-100 rounded-[40px] animate-pulse"></div>
        <div className="h-96 bg-slate-100 rounded-[40px] animate-pulse"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <section className="bg-rose-50/50 p-12 rounded-[40px] border border-rose-200/60 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-6">
            <ShieldBan size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-4">Acceso Denegado</h2>
          <p className="text-slate-600 font-medium max-w-md text-lg">
            El Centro de Seguridad y Auditoría está restringido.
          </p>
          <p className="text-slate-500 mt-4">
            Solo el administrador principal tiene los permisos necesarios para visualizar los registros de telemetría y actividad anómala.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <ShieldCheck className="text-emerald-500 h-6 w-6" />
              Auditoría de Seguridad
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Registro de actividad anómala y alertas de telemetría en tiempo real.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
            <Activity className="h-5 w-5 text-blue-500" />
            <div className="text-sm font-bold text-slate-700">
              Telemetría Activa
            </div>
          </div>
        </div>

        <div className="p-0">
          {isLoadingLogs ? (
            <div className="p-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha y Hora</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Agente</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo Incidente</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                          <Clock className="h-4 w-4 text-slate-400" />
                          {new Date(log.timestamp).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs uppercase">
                            {log.agenteNombre.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800">{log.agenteNombre}</div>
                            <div className="text-xs font-medium text-slate-500 font-mono">{log.agenteId.split('-')[0]}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {log.tipoIncidente}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-600 max-w-md">
                          {log.descripcion}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-16 text-center">
              <ShieldCheck className="mx-auto h-12 w-12 text-emerald-400 mb-4" />
              <h3 className="text-lg font-bold text-slate-800">Todo en orden</h3>
              <p className="text-slate-500 font-medium mt-1">No se han registrado actividades anómalas recientemente.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionSeguridad;
