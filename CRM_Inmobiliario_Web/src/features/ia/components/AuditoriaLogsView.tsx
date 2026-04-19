import { useState } from 'react';
import useSWR from 'swr';
import { 
  Bot, 
  Clock, 
  Phone, 
  Activity, 
  ChevronUp, 
  Search,
  AlertCircle,
  Eye,
  Terminal
} from 'lucide-react';

interface AiLog {
  id: string;
  telefonoCliente: string;
  accion: string;
  detalleJson: string | null;
  fecha: string;
}

// Formateadores nativos para evitar dependencias extra (date-fns)
const dateFormatter = new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'long' });
const timeFormatter = new Intl.DateTimeFormat('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

// Nota: El proyecto usa un interceptor de axios en src/lib/axios.ts, así que usaremos SWR que ya lo tiene configurado globalmente.

export const AuditoriaLogsView = () => {
  const { data: logs, error, isLoading, mutate } = useSWR<AiLog[]>('/ia/logs', {
    revalidateOnFocus: true,
    dedupingInterval: 0
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const handleRetry = () => {
    // Limpiar caché de SWR para esta llave y revalidar
    mutate(undefined, { revalidate: true });
  };

  const filteredLogs = logs?.filter(log => 
    log.telefonoCliente.includes(search) || 
    log.accion.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (error) return (
    <div className="bg-rose-50 border border-rose-100 p-12 rounded-[2rem] text-center max-w-2xl mx-auto mt-10 shadow-xl shadow-rose-500/5 animate-in zoom-in-95 duration-500">
      <div className="bg-white h-20 w-20 rounded-3xl shadow-lg flex items-center justify-center mx-auto mb-6">
        <AlertCircle className="h-10 w-10 text-rose-500" />
      </div>
      <h3 className="text-2xl font-black text-rose-900 uppercase tracking-tight mb-2">Error de Conexión</h3>
      <p className="text-rose-600/80 font-bold text-sm mb-8 leading-relaxed px-10">
        No se pudo contactar con el servicio de auditoría de IA. <br/>
        Esto puede deberse a un problema de red o que el servidor se está reiniciando.
      </p>
      <button 
        onClick={handleRetry}
        className="cursor-pointer bg-rose-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 active:scale-95"
      >
        Reintentar Conexión
      </button>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/20">
              <Bot className="h-6 w-6" />
            </div>
            Actividad de IA
          </h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">
            Supervisión y Auditoría de Decisiones del Asistente
          </p>
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por teléfono o acción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold focus:ring-4 focus:ring-blue-100 transition-all outline-none shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha y Hora</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Acción Realizada</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-6 py-4"><div className="h-10 bg-slate-50 rounded-xl w-full"></div></td>
                  </tr>
                ))
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <Activity className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No hay registros de actividad</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-700 capitalize">
                            {dateFormatter.format(new Date(log.fecha))}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {timeFormatter.format(new Date(log.fecha))} hrs
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-bold tracking-tight">{log.telefonoCliente}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        log.accion.includes('Error') 
                          ? 'bg-rose-50 text-rose-600 border-rose-100' 
                          : log.accion.includes('Registro')
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        {log.accion}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                        className="cursor-pointer p-2 hover:bg-white hover:shadow-md rounded-xl transition-all border border-transparent hover:border-slate-100 group-hover:text-blue-600"
                      >
                        {expandedId === log.id ? <ChevronUp className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Overlay para ver el JSON expandido */}
      {expandedId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-900 rounded-2xl text-emerald-400 shadow-xl">
                  <Terminal className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Pensamiento de la IA</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Detalle técnico del ActionLog</p>
                </div>
              </div>
              <button 
                onClick={() => setExpandedId(null)}
                className="cursor-pointer p-2 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-slate-900"
              >
                <AlertCircle className="h-6 w-6 rotate-45" />
              </button>
            </div>
            
            <div className="p-8">
              <div className="bg-slate-900 rounded-2xl p-6 overflow-auto max-h-[50vh] custom-scrollbar">
                <pre className="text-emerald-400/90 font-mono text-sm leading-relaxed">
                  {JSON.stringify(JSON.parse(logs?.find(l => l.id === expandedId)?.detalleJson || '{}'), null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setExpandedId(null)}
                className="cursor-pointer px-8 py-3 bg-white border border-slate-200 text-slate-900 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all shadow-sm"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
