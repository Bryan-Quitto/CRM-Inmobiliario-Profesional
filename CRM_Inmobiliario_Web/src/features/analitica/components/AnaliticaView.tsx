import React, { useState, useRef, useEffect, useMemo } from 'react';
import useSWR, { SWRConfig } from 'swr';
import { 
  CheckCircle2, 
  Handshake, 
  FileText, 
  Loader2,
  TrendingUp,
  Calendar,
  ChevronDown,
  Check,
  Target,
  DollarSign,
  ArrowUpRight,
  Zap,
  Clock,
  Activity,
  BarChart3,
  Info
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { api } from '../../../lib/axios';
import { localStorageProvider } from '../../../lib/swr';
import type { ActividadAnalitica, ProyeccionAnalitica, EficienciaAnalitica } from '../types';

// Fetcher genérico para SWR usando Axios
const fetcher = (url: string, params?: Record<string, unknown>) => api.get(url, { params }).then(res => res.data);

interface RangoFechas {
  inicio: Date;
  fin: Date;
  label: string;
}

const AnaliticaContent: React.FC = () => {
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
  const [semanaIndice, setSemanaIndice] = useState<number | 'total'>('total');
  const [anioSeleccionado] = useState(new Date().getFullYear());
  const [showMesDropdown, setShowMesDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const semanasDelMes = useMemo(() => {
    const rawSemanas: { inicio: Date; fin: Date }[] = [];
    const primerDia = new Date(anioSeleccionado, mesSeleccionado, 1);
    const ultimoDia = new Date(anioSeleccionado, mesSeleccionado + 1, 0, 23, 59, 59);

    let current = new Date(primerDia);
    while (current <= ultimoDia) {
      const inicio = new Date(current);
      const diaSemana = inicio.getDay();
      const diasHastaDomingo = diaSemana === 0 ? 0 : 7 - diaSemana;
      let fin = new Date(inicio);
      fin.setDate(inicio.getDate() + diasHastaDomingo);
      fin.setHours(23, 59, 59);

      if (fin > ultimoDia) fin = new Date(ultimoDia);
      rawSemanas.push({ inicio, fin });
      
      current = new Date(fin);
      current.setDate(fin.getDate() + 1);
      current.setHours(0, 0, 0, 0);
    }

    const clustered: RangoFechas[] = [];
    for (let i = 0; i < rawSemanas.length; i++) {
      const item = rawSemanas[i];
      const diffMs = item.fin.getTime() - item.inicio.getTime();
      const durationDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (i === 0 && durationDays < 4 && rawSemanas.length > 1) {
        rawSemanas[i + 1].inicio = item.inicio;
        continue;
      }
      if (i === rawSemanas.length - 1 && durationDays < 4 && clustered.length > 0) {
        clustered[clustered.length - 1].fin = item.fin;
        continue;
      }

      clustered.push({
        inicio: item.inicio,
        fin: item.fin,
        label: `S${clustered.length + 1}`
      });
    }

    return clustered;
  }, [anioSeleccionado, mesSeleccionado]);

  const rangoActual = useMemo(() => {
    if (semanaIndice === 'total') {
      return {
        inicio: new Date(anioSeleccionado, mesSeleccionado, 1),
        fin: new Date(anioSeleccionado, mesSeleccionado + 1, 0, 23, 59, 59)
      };
    }
    const s = semanasDelMes[semanaIndice] || semanasDelMes[0];
    return { inicio: s.inicio, fin: s.fin };
  }, [semanaIndice, semanasDelMes, anioSeleccionado, mesSeleccionado]);

  const formattedRange = `${rangoActual.inicio.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${rangoActual.fin.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;

  const swrConfig = { 
    dedupingInterval: 10000, 
    revalidateOnFocus: false,
    revalidateIfStale: true,
    keepPreviousData: true
  };

  const { data: proyeccion } = useSWR<ProyeccionAnalitica>('/analitica/proyecciones', fetcher, swrConfig);
  const { data: eficiencia } = useSWR<EficienciaAnalitica>('/analitica/eficiencia', fetcher, swrConfig);

  const actividadKey = [`/analitica/actividad`, rangoActual.inicio.toISOString(), rangoActual.fin.toISOString()];
  const { data: actividad, isValidating: loadingActividad } = useSWR<ActividadAnalitica>(
    actividadKey,
    () => fetcher('/analitica/actividad', { 
      inicio: rangoActual.inicio.toISOString(), 
      fin: rangoActual.fin.toISOString() 
    }),
    swrConfig
  );

  const initialLoading = !actividad && !proyeccion;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMesDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 text-blue-700 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-700 uppercase tracking-widest italic text-center">Iniciando motor de inteligencia comercial...</p>
      </div>
    );
  }

  const kpisOperativos = [
    { title: 'Visitas', value: actividad?.visitasCompletadas ?? 0, icon: <CheckCircle2 className="h-5 w-5" />, color: 'bg-emerald-50 text-emerald-600', desc: 'Completadas' },
    { title: 'Cierres', value: actividad?.cierresRealizados ?? 0, icon: <Handshake className="h-5 w-5" />, color: 'bg-blue-50 text-blue-600', desc: 'Finalizados' },
    { title: 'Ofertas', value: actividad?.ofertasGeneradas ?? 0, icon: <FileText className="h-5 w-5" />, color: 'bg-indigo-50 text-indigo-600', desc: 'Generadas' },
    { title: 'Captaciones', value: actividad?.captacionesPropias ?? 0, icon: <Target className="h-5 w-5" />, color: 'bg-amber-50 text-amber-600', desc: 'Nuevas' },
  ];

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 relative pb-20">
      {loadingActividad && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900/90 backdrop-blur-xl text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10">
            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sincronizando Inteligencia...</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Pulso del Negocio</h2>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Snapshot en Tiempo Real</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[40px] p-10 text-white shadow-2xl shadow-slate-900/20 overflow-hidden relative group border border-white/5">
            <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <DollarSign className="h-40 w-40" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 h-full">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/20 backdrop-blur-md p-2 rounded-xl border border-emerald-500/20">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400">Proyección Estratégica</span>
                </div>
                <h2 className="text-6xl font-black tracking-tighter">
                  {formatCurrency(proyeccion?.proyeccionIngresos ?? 0)}
                </h2>
                <p className="text-slate-400 text-sm font-medium max-w-md">
                  Ingresos estimados basados en inmuebles <span className="text-white font-bold italic">Reservados</span> y clientes activos.
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 flex flex-col items-center justify-center min-w-[220px]">
                <div className="bg-white/10 text-white p-3 rounded-2xl mb-4 border border-white/10">
                  <ArrowUpRight className="h-6 w-6 text-emerald-400" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Potencial Real</span>
                <span className="text-2xl font-black tracking-tight text-white">Pipeline</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 grid grid-cols-1 gap-6">
            <div className="bg-indigo-600 rounded-[32px] p-8 text-white flex flex-col justify-between shadow-xl shadow-indigo-200 group relative overflow-hidden">
              <Clock className="absolute -right-4 -bottom-4 h-24 w-24 text-white/10 group-hover:scale-110 transition-transform" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em] mb-1">Velocidad de Cierre</p>
                  <h3 className="text-5xl font-black tracking-tighter">{eficiencia?.tiempoPromedioCierreDias ?? 0} <span className="text-2xl opacity-50 italic">días</span></h3>
                </div>
                <p className="text-indigo-100/70 text-[11px] font-bold leading-tight mt-4 italic">Promedio histórico de éxito comercial.</p>
              </div>
            </div>
            
            <div className="bg-white border-2 border-slate-100 rounded-[32px] p-8 flex items-center justify-between group hover:border-blue-200 transition-all shadow-sm">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Tasa de Éxito</p>
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{eficiencia?.tasaConversion ?? 0}%</h3>
                <p className="text-[11px] font-bold text-slate-500 mt-1">Cierres Totales</p>
              </div>
              <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:rotate-12 transition-all">
                <Activity className="h-7 w-7" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-100"></div>

      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Análisis de Desempeño</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-0.5">
                <Info className="h-3 w-3" /> Basado en el filtro de fecha seleccionado
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setShowMesDropdown(!showMesDropdown)} className="bg-white border-2 border-slate-100 rounded-2xl px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:border-blue-300 focus:ring-4 focus:ring-blue-50/50 transition-all outline-none shadow-md flex items-center gap-3 min-w-[140px] justify-between cursor-pointer">{MESES[mesSeleccionado]}<ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${showMesDropdown ? 'rotate-180' : ''}`} /></button>
              {showMesDropdown && (
                <div className="absolute left-0 mt-3 w-48 bg-white border-2 border-slate-50 rounded-[24px] shadow-2xl z-[100] py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-left overflow-hidden backdrop-blur-xl bg-white/95">
                  {MESES.slice(0, new Date().getMonth() + 1).map((mes, idx) => (
                    <button key={idx} onClick={() => { setMesSeleccionado(idx); setSemanaIndice('total'); setShowMesDropdown(false); }} className={`cursor-pointer ${`w-full px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest flex items-center justify-between transition-colors hover:bg-slate-50 ${mesSeleccionado === idx ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'}`}`}>{mes}{mesSeleccionado === idx && <Check className="h-3 w-3" />}</button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl shadow-inner border border-slate-200/50">
              <button onClick={() => setSemanaIndice('total')} className={`cursor-pointer ${`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${semanaIndice === 'total' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-600'}`}`}>Mes</button>
              {semanasDelMes.map((s, idx) => (
                <button key={idx} onClick={() => setSemanaIndice(idx)} className={`cursor-pointer ${`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${semanaIndice === idx ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-600'}`}`}>{s.label}</button>
              ))}
            </div>

            <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl flex items-center gap-3 shadow-lg shadow-slate-900/10 border border-white/5">
              <Calendar className="h-4 w-4 text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{formattedRange}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpisOperativos.map((kpi, idx) => (
            <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group border-b-4 border-b-transparent hover:border-b-blue-500 relative overflow-hidden">
              {loadingActividad && (
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 flex items-center justify-center animate-in fade-in duration-300">
                  <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                </div>
              )}
              <div className={`p-3 rounded-2xl ${kpi.color} w-fit mb-4 group-hover:scale-110 transition-transform`}>{kpi.icon}</div>
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
    </div>
  );
};

export const AnaliticaView: React.FC = () => {
  return (
    <SWRConfig value={{ provider: localStorageProvider }}>
      <AnaliticaContent />
    </SWRConfig>
  );
};
