import React, { useEffect, useState, useRef } from 'react';
import { 
  CheckCircle2, 
  Handshake, 
  FileText, 
  Users, 
  Loader2,
  TrendingUp,
  Calendar,
  ChevronDown,
  Check
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
import { getActividadAnalitica, getSeguimientoAnalitica } from '../api/analitica';
import type { ActividadAnalitica, SeguimientoAnalitica } from '../types';

const ANALITICA_CACHE_BASE = 'crm_analitica_v1_';

export const AnaliticaView: React.FC = () => {
  const [actividad, setActividad] = useState<ActividadAnalitica | null>(null);
  const [seguimiento, setSeguimiento] = useState<SeguimientoAnalitica | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para filtros granulares
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
  const [semanaSeleccionada, setSemanaSeleccionada] = useState<number | 'total'>('total');
  const [anioSeleccionado] = useState(new Date().getFullYear());
  const [showMesDropdown, setShowMesDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Helper para generar una llave de cache única por periodo
  const getCacheKey = () => `${ANALITICA_CACHE_BASE}${anioSeleccionado}_${mesSeleccionado}_${semanaSeleccionada}`;

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMesDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper para obtener el rango de fechas de una semana específica en un mes
  const getRangoSemana = (year: number, month: number, weekNum: number | 'total') => {
    if (weekNum === 'total') {
      const inicio = new Date(year, month, 1);
      const fin = new Date(year, month + 1, 0, 23, 59, 59);
      return { inicio, fin };
    }

    const primerDiaMes = new Date(year, month, 1);
    const diaSemanaPrimerDia = primerDiaMes.getDay(); // 0 (Dom) a 6 (Sab)
    const desfaseLunes = diaSemanaPrimerDia === 0 ? 1 : diaSemanaPrimerDia === 1 ? 0 : 8 - diaSemanaPrimerDia;
    
    const inicioSemana1 = new Date(year, month, 1 + desfaseLunes);
    const inicio = new Date(inicioSemana1.getTime());
    inicio.setDate(inicio.getDate() + (weekNum - 1) * 7);
    
    const fin = new Date(inicio.getTime());
    fin.setDate(fin.getDate() + 6);
    fin.setHours(23, 59, 59);
    
    return { inicio, fin };
  };

  const { inicio: startObj, fin: endObj } = getRangoSemana(anioSeleccionado, mesSeleccionado, semanaSeleccionada);
  const formattedRange = `${startObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${endObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;

  // Efecto para sincronizar datos (Cache-First + Background Sync)
  useEffect(() => {
    const fetchData = async () => {
      const cacheKey = getCacheKey();
      const saved = localStorage.getItem(cacheKey);
      
      // 1. Instant UI: Cargar desde cache si existe
      if (saved) {
        const { actividad: cachedAct, seguimiento: cachedSeg } = JSON.parse(saved);
        setActividad(cachedAct);
        setSeguimiento(cachedSeg);
        setLoading(false); // No bloqueamos la UI principal si hay cache
      } else {
        setActividad(null);
        setLoading(true); // Bloqueamos solo si no hay nada que mostrar
      }

      try {
        const { inicio, fin } = getRangoSemana(anioSeleccionado, mesSeleccionado, semanaSeleccionada);
        const [act, seg] = await Promise.all([
          getActividadAnalitica(inicio.toISOString(), fin.toISOString()),
          getSeguimientoAnalitica()
        ]);
        
        setActividad(act);
        setSeguimiento(seg);
        
        // Actualizar cache
        localStorage.setItem(cacheKey, JSON.stringify({ actividad: act, seguimiento: seg, timestamp: Date.now() }));
      } catch (error) {
        console.error("Error al cargar datos de analítica", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mesSeleccionado, semanaSeleccionada, anioSeleccionado]);

  if (loading && !actividad) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 text-blue-700 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-700 uppercase tracking-widest italic">Calculando métricas de rendimiento...</p>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Visitas Completadas',
      value: actividad?.visitasCompletadas ?? 0,
      icon: <CheckCircle2 className="h-6 w-6" />,
      color: 'bg-emerald-50 text-emerald-600',
      description: 'Efectividad en agenda'
    },
    {
      title: 'Cierres Realizados',
      value: actividad?.cierresRealizados ?? 0,
      icon: <Handshake className="h-6 w-6" />,
      color: 'bg-blue-50 text-blue-600',
      description: 'Operaciones exitosas'
    },
    {
      title: 'Ofertas Generadas',
      value: actividad?.ofertasGeneradas ?? 0,
      icon: <FileText className="h-6 w-6" />,
      color: 'bg-indigo-50 text-indigo-600',
      description: 'En negociación activa'
    },
    {
      title: 'Seguimiento Crítico',
      value: seguimiento?.seguimientoRequerido ?? 0,
      icon: <Users className="h-6 w-6" />,
      color: 'bg-rose-50 text-rose-600',
      description: 'Interés Medio/Alto'
    }
  ];

  const dataGrafico = [
    { name: 'S1', visitas: 4, cierres: 1 },
    { name: 'S2', visitas: 7, cierres: 2 },
    { name: 'S3', visitas: 5, cierres: actividad?.cierresRealizados ?? 0 },
    { name: 'S4', visitas: actividad?.visitasCompletadas ?? 0, cierres: 1 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 relative">
      {/* Overlay de Carga Sutil (Zero Wait Pattern) */}
      {loading && actividad && (
        <div className="absolute inset-0 bg-slate-50/40 backdrop-blur-[1px] z-[60] flex items-start justify-center pt-40 transition-all duration-500 rounded-3xl">
          <div className="bg-white/90 px-6 py-4 rounded-3xl shadow-2xl border border-slate-100 flex items-center gap-4 animate-in zoom-in-95 duration-300">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Sincronizando analítica...</span>
          </div>
        </div>
      )}

      {/* Header con Selectores Granulares */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Rendimiento <span className="text-blue-600">Comercial</span></h1>
          <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">Rango</span>
            {formattedRange}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Mes (Custom Dropdown) */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowMesDropdown(!showMesDropdown)}
              className="bg-white border-2 border-slate-100 rounded-2xl px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:border-blue-300 focus:ring-4 focus:ring-blue-50/50 transition-all cursor-pointer outline-none shadow-md flex items-center gap-3 min-w-[140px] justify-between"
            >
              {MESES[mesSeleccionado]}
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${showMesDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showMesDropdown && (
              <div className="absolute left-0 mt-3 w-48 bg-white border-2 border-slate-50 rounded-[24px] shadow-2xl z-[100] py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-left overflow-hidden backdrop-blur-xl bg-white/95">
                {MESES.map((mes, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => {
                      setMesSeleccionado(idx);
                      setSemanaSeleccionada('total');
                      setShowMesDropdown(false);
                    }}
                    className={`w-full px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest flex items-center justify-between transition-colors hover:bg-slate-50 cursor-pointer ${mesSeleccionado === idx ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'}`}
                  >
                    {mes}
                    {mesSeleccionado === idx && <Check className="h-3 w-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selector de Semana */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl shadow-inner border border-slate-200/50">
            <button 
              onClick={() => setSemanaSeleccionada('total')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${semanaSeleccionada === 'total' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-600'}`}
            >
              Mes Completo
            </button>
            {[1, 2, 3, 4].map(w => (
              <button 
                key={w}
                onClick={() => setSemanaSeleccionada(w)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${semanaSeleccionada === w ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-600'}`}
              >
                S{w}
              </button>
            ))}
          </div>

          <div className="h-10 w-px bg-slate-200 mx-2 hidden lg:block"></div>
          
          <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-slate-900/10">
            <Calendar className="h-4 w-4 text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">{anioSeleccionado}</span>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className={`p-3 rounded-2xl ${kpi.color} w-fit mb-4 group-hover:scale-110 transition-transform`}>
              {kpi.icon}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.title}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-4xl font-black text-slate-900">{kpi.value}</h2>
              <p className="text-[11px] font-bold text-slate-500">{kpi.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Tendencia de Actividad
            </h3>
            <p className="text-sm font-medium text-slate-500">Comparativa de visitas vs cierres en el tiempo</p>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Visitas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Cierres</span>
            </div>
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dataGrafico} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVisitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCierres" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                }}
              />
              <Area 
                type="monotone" 
                dataKey="visitas" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorVisitas)" 
              />
              <Area 
                type="monotone" 
                dataKey="cierres" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorCierres)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
