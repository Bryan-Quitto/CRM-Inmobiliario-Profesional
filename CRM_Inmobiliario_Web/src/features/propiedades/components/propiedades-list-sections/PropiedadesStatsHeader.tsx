import { Building2, TrendingUp, Tag } from 'lucide-react';

interface PropiedadesStatsHeaderProps {
  total: number;
  venta: number;
  alquiler: number;
}

export const PropiedadesStatsHeader = ({ total, venta, alquiler }: PropiedadesStatsHeaderProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-blue-100 transition-all cursor-default">
      <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-all">
        <Building2 className="h-6 w-6" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Catálogo</p>
        <p className="text-2xl font-black text-slate-900">{total}</p>
      </div>
    </div>
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-emerald-100 transition-all cursor-default">
      <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-all">
        <TrendingUp className="h-6 w-6" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">En Venta</p>
        <p className="text-2xl font-black text-slate-900">{venta}</p>
      </div>
    </div>
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-amber-100 transition-all cursor-default">
      <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-all">
        <Tag className="h-6 w-6" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">En Alquiler</p>
        <p className="text-2xl font-black text-slate-900">{alquiler}</p>
      </div>
    </div>
  </div>
);
