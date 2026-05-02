import { TrendingUp, DollarSign, ArrowUpRight, Calculator, Minus, Plus } from 'lucide-react';
import type { ProyeccionAnalitica } from '../../types';

interface AnaliticaProyeccionProps {
  proyeccion?: ProyeccionAnalitica;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

export const AnaliticaProyeccion = ({ proyeccion, isExpanded, onToggleExpand }: AnaliticaProyeccionProps) => {
  return (
    <div className={`lg:col-span-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[40px] p-10 text-white shadow-2xl shadow-slate-900/20 overflow-hidden relative group border border-white/5 transition-all duration-500 ${isExpanded ? 'lg:col-span-12' : ''}`}>
      <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-700">
        <DollarSign className="h-40 w-40" />
      </div>
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 h-full">
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
              Ingresos estimados basados en inmuebles <span className="text-white font-bold italic">Reservados</span> y contactos activos.
            </p>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 flex flex-col items-center justify-center min-w-[220px]">
              <div className="bg-white/10 text-white p-3 rounded-2xl mb-4 border border-white/10">
                <ArrowUpRight className="h-6 w-6 text-emerald-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Potencial Real</span>
              <span className="text-2xl font-black tracking-tight text-white">Pipeline</span>
            </div>
            <button 
              onClick={onToggleExpand}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border border-white/10"
            >
              <Calculator className="h-4 w-4 text-emerald-400" />
              {isExpanded ? 'Ocultar Cálculos' : 'Ver Cálculos'}
              {isExpanded ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-10 p-8 bg-white/5 rounded-[32px] border border-white/10 animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <Calculator className="h-5 w-5 text-emerald-400" />
              <h4 className="text-sm font-black uppercase tracking-widest">Desglose de Comisiones</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-bold">
                <thead>
                  <tr className="text-slate-400 uppercase tracking-widest border-b border-white/10">
                    <th className="pb-4">Propiedad</th>
                    <th className="pb-4 text-right">Precio</th>
                    <th className="pb-4 text-center">% Comisión</th>
                    <th className="pb-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="text-white/80">
                  {proyeccion?.desglose?.map((item, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-4">{item.propiedad}</td>
                      <td className="py-4 text-right font-black">{formatCurrency(item.precio)}</td>
                      <td className="py-4 text-center font-black text-emerald-400">{item.porcentajeComision}%</td>
                      <td className="py-4 text-right font-black text-white">{formatCurrency(item.comisionCalculada)}</td>
                    </tr>
                  ))}
                  {(!proyeccion?.desglose || proyeccion.desglose.length === 0) && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500 italic">No hay propiedades reservadas en este período.</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="text-white">
                    <td colSpan={3} className="pt-6 font-black uppercase tracking-widest text-right pr-10">Total Proyectado:</td>
                    <td className="pt-6 text-right text-2xl font-black text-emerald-400">{formatCurrency(proyeccion?.proyeccionIngresos ?? 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
