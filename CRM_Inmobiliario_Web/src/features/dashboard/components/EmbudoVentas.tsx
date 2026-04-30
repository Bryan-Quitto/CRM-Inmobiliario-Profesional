import React from 'react';
import { Filter } from 'lucide-react';
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
import type { DashboardKpis } from '../types';

interface EmbudoVentasProps {
  data: DashboardKpis;
  syncing: boolean;
}

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#94a3b8'];

export const EmbudoVentas: React.FC<EmbudoVentasProps> = ({ data, syncing }) => {
  return (
    <div className="lg:col-span-8 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden">
      {syncing && <div className="absolute inset-0 bg-white/10 backdrop-blur-[0.5px] pointer-events-none" />}
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

      <div className="h-[300px] w-full mt-4">
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
  );
};
