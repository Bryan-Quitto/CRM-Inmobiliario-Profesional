import React, { useEffect, useState } from 'react';
import { 
  Home, 
  Users, 
  Calendar, 
  TrendingUp, 
  ArrowUpRight,
  Loader2,
  Filter
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { getDashboardKpis } from '../api/getDashboardKpis';
import type { DashboardKpis } from '../types';

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#94a3b8'];
const DASHBOARD_CACHE_KEY = 'crm_dashboard_kpis_cache';

// Definición del orden lógico del embudo para una visualización coherente
const ORDEN_EMBUDO: Record<string, number> = {
  'Nuevo': 1,
  'Calificado': 2,
  'En Negociación': 3,
  'Propuesta': 4,
  'Cierre': 5,
  'Ganado': 6,
  'Perdido': 7
};

export const DashboardPrincipal: React.FC = () => {
  const [data, setData] = useState<DashboardKpis | null>(() => {
    // Intento de carga instantánea desde cache (SWR Pattern)
    const saved = localStorage.getItem(DASHBOARD_CACHE_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(!data); // Solo mostramos loader si NO hay cache

  useEffect(() => {
    const fetchKpis = async () => {
      try {
        const kpis = await getDashboardKpis();
        
        const normalizar = (str: string) => 
          str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

        const mapaNormalizado: Record<string, number> = {};
        Object.entries(ORDEN_EMBUDO).forEach(([key, val]) => {
          mapaNormalizado[normalizar(key)] = val;
        });

        // Ordenamos ascendentemente para que el primer proceso (Nuevo) esté arriba en el layout vertical
        const embudoOrdenado = [...kpis.embudoVentas].sort((a, b) => {
          const pesoA = mapaNormalizado[normalizar(a.etapa)] || 99;
          const pesoB = mapaNormalizado[normalizar(b.etapa)] || 99;
          return pesoA - pesoB; 
        });

        const kpisProcesados = { ...kpis, embudoVentas: embudoOrdenado };
        setData(kpisProcesados);
        
        localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(kpisProcesados));
      } catch (error) {
        console.error("Error al cargar KPIs del dashboard", error);
      } finally {
        setLoading(false);
      }
    };

    fetchKpis();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in duration-500">
        <Loader2 className="h-10 w-10 text-blue-700 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-700 uppercase tracking-widest">Generando resumen...</p>
      </div>
    );
  }

  if (!data) return null;

  const kpiCards = [
    {
      title: 'Propiedades Disponibles',
      value: data.totalPropiedadesDisponibles,
      icon: <Home className="h-6 w-6" />,
      color: 'bg-blue-50 text-blue-600',
      description: 'Listas para la venta'
    },
    {
      title: 'Prospectos Activos',
      value: data.totalProspectosActivos,
      icon: <Users className="h-6 w-6" />,
      color: 'bg-indigo-50 text-indigo-600',
      description: 'En seguimiento actual'
    },
    {
      title: 'Tareas Hoy',
      value: data.tareasPendientesHoy,
      icon: <Calendar className="h-6 w-6" />,
      color: 'bg-emerald-50 text-emerald-600',
      description: 'Pendientes por completar'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Hola de nuevo, <span className="text-blue-600">Agente</span>.
        </h1>
        <p className="text-slate-500 font-medium">Aquí está el resumen estratégico de tu negocio hoy.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpiCards.map((card, idx) => (
          <div 
            key={idx} 
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-2xl ${card.color} group-hover:scale-110 transition-transform`}>
                {card.icon}
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-widest">
                <TrendingUp className="h-3 w-3" />
                Actual
              </div>
            </div>
            <div className="mt-4">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{card.title}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <h2 className="text-4xl font-black text-slate-900">{card.value}</h2>
                <p className="text-[11px] font-bold text-slate-500">{card.description}</p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Últimas 24h</span>
              <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Filter className="h-5 w-5 text-blue-600" />
                Embudo de Ventas
              </h3>
              <p className="text-sm font-medium text-slate-500">Distribución estratégica por etapa comercial</p>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-100">
              Total: {data.totalProspectosActivos} Prospectos
            </div>
          </div>

          <div className="h-[400px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={data.embudoVentas} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis 
                  type="number"
                  axisLine={false} 
                  tickLine={false} 
                  allowDecimals={false}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} 
                />
                <YAxis 
                  dataKey="etapa" 
                  type="category"
                  axisLine={false} 
                  tickLine={false} 
                  width={120}
                  tick={{ fill: '#0f172a', fontSize: 11, fontWeight: 'black' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                  itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                />
                <Bar 
                  dataKey="cantidad" 
                  radius={[0, 8, 8, 0]} 
                  barSize={32}
                  animationDuration={1500}
                >
                  {data.embudoVentas.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
