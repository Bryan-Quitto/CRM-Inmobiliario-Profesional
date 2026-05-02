import React from 'react';
import { Home, Users, Calendar, TrendingUp, ArrowUpRight } from 'lucide-react';
import type { DashboardKpis } from '../types';

interface KpiCardsProps {
  data: DashboardKpis;
  syncing: boolean;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ data, syncing }) => {
  const kpiCards = [
    {
      title: 'Propiedades Disponibles',
      value: data.totalPropiedadesDisponibles,
      icon: <Home className="h-6 w-6" />,
      color: 'bg-blue-50 text-blue-600',
      description: 'Listas para la venta'
    },
    {
      title: 'Contactos Activos',
      value: data.totalContactosActivos,
      icon: <Users className="h-6 w-6" />,
      color: 'bg-indigo-50 text-indigo-600',
      description: 'En seguimiento actual'
    },
    {
      title: 'Tareas Hoy y Vencidas',
      value: data.tareasPendientesHoy,
      icon: <Calendar className="h-6 w-6" />,
      color: 'bg-emerald-50 text-emerald-600',
      description: 'Pendientes por completar'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {kpiCards.map((card, idx) => (
        <div 
          key={idx} 
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
        >
          {syncing && <div className="absolute inset-0 bg-white/10 backdrop-blur-[0.5px] pointer-events-none" />}
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
  );
};
