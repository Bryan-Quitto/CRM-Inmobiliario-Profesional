import { CheckCircle2, Handshake, FileText, Target, Loader2, Eye } from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import type { ActividadAnalitica } from '../../types';

interface AnaliticaActividadProps {
  actividad?: ActividadAnalitica;
  loadingActividad: boolean;
  setActiveModal: (modal: 'visitas' | 'cierres' | 'ofertas' | 'captaciones' | null) => void;
}

export const AnaliticaActividad = ({ actividad, loadingActividad, setActiveModal }: AnaliticaActividadProps) => {
  const kpisOperativos = [
    { id: 'visitas' as const, title: 'Visitas', value: actividad?.visitasCompletadas ?? 0, icon: <CheckCircle2 className="h-5 w-5" />, color: 'bg-emerald-50 text-emerald-600', desc: 'Completadas' },
    { id: 'cierres' as const, title: 'Cierres', value: actividad?.cierresRealizados ?? 0, icon: <Handshake className="h-5 w-5" />, color: 'bg-blue-50 text-blue-600', desc: 'Finalizados' },
    { id: 'ofertas' as const, title: 'Ofertas', value: actividad?.ofertasGeneradas ?? 0, icon: <FileText className="h-5 w-5" />, color: 'bg-indigo-50 text-indigo-600', desc: 'Generadas' },
    { id: 'captaciones' as const, title: 'Captaciones', value: actividad?.captacionesPropias ?? 0, icon: <Target className="h-5 w-5" />, color: 'bg-amber-50 text-amber-600', desc: 'Nuevas' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpisOperativos.map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group border-b-4 border-b-transparent hover:border-b-blue-500 relative overflow-hidden">
            {loadingActividad && (
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 flex items-center justify-center animate-in fade-in duration-300">
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              </div>
            )}
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-2xl ${kpi.color} group-hover:scale-110 transition-transform`}>{kpi.icon}</div>
              <button 
                onClick={() => setActiveModal(kpi.id)}
                className="p-2 bg-slate-50 hover:bg-blue-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all cursor-pointer border border-transparent hover:border-blue-100"
                title="Ver detalles"
              >
                <Eye size={16} />
              </button>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.title}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-4xl font-black text-slate-900">{kpi.value}</h2>
              <p className="text-[11px] font-bold text-slate-500">{kpi.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden">
          {loadingActividad && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center animate-in fade-in duration-500">
               <div className="bg-white p-4 rounded-full shadow-xl border border-slate-100">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
               </div>
               <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Recalculando Tendencia...</p>
            </div>
          )}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">Tendencia Diaria</h3>
              <p className="text-sm font-medium text-slate-500">Esfuerzo operativo detectado en el rango</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={actividad?.trend ?? []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVisitas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                  <linearGradient id="colorCierres" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                  <linearGradient id="colorCaptaciones" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="visitas" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVisitas)" />
                <Area type="monotone" dataKey="cierres" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCierres)" />
                <Area type="monotone" dataKey="captaciones" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorCaptaciones)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
