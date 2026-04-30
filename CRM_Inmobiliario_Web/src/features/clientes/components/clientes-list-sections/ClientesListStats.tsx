import { CheckCircle2, Plus, AlertCircle } from 'lucide-react';

interface ClientesListStatsProps {
  total: number;
  nuevos: number;
  negociacion: number;
}

export const ClientesListStats = ({ total, nuevos, negociacion }: ClientesListStatsProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-blue-100 transition-all cursor-default">
      <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-all">
        <CheckCircle2 className="h-6 w-6" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Prospectos</p>
        <p className="text-2xl font-black text-slate-900">{total}</p>
      </div>
    </div>
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-amber-100 transition-all cursor-default">
      <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-all">
        <Plus className="h-6 w-6" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">En Proceso</p>
        <p className="text-2xl font-black text-slate-900">{nuevos}</p>
      </div>
    </div>
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-indigo-100 transition-all cursor-default">
      <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-all">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">En Negociación</p>
        <p className="text-2xl font-black text-slate-900">{negociacion}</p>
      </div>
    </div>
  </div>
);
