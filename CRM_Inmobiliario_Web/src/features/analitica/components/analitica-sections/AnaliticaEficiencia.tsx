import { Clock, Minus, Plus, Calculator, Activity, Eye } from 'lucide-react';
import type { EficienciaAnalitica } from '../../types';

interface AnaliticaEficienciaProps {
  eficiencia?: EficienciaAnalitica;
  expandedCard: 'velocidad' | 'tasa' | null;
  setExpandedCard: (card: 'velocidad' | 'tasa' | null) => void;
  setActiveModal: (modal: 'auditoria-velocidad' | null) => void;
}

export const AnaliticaEficiencia = ({
  eficiencia,
  expandedCard,
  setExpandedCard,
  setActiveModal
}: AnaliticaEficienciaProps) => {
  return (
    <div className={`${expandedCard === 'velocidad' || expandedCard === 'tasa' ? 'lg:col-span-12' : 'lg:col-span-4'} grid grid-cols-1 gap-6`}>
      <div className={`bg-indigo-600 rounded-[32px] p-8 text-white flex flex-col justify-between shadow-xl shadow-indigo-200 group relative overflow-hidden transition-all duration-500 ${expandedCard === 'velocidad' ? 'h-auto' : ''}`}>
        <Clock className="absolute -right-4 -bottom-4 h-24 w-24 text-white/10 group-hover:scale-110 transition-transform" />
        <div className="relative z-10 h-full">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em] mb-1">Velocidad de Cierre</p>
              <h3 className="text-5xl font-black tracking-tighter">{eficiencia?.tiempoPromedioCierreDias ?? 0} <span className="text-2xl opacity-50 italic">días</span></h3>
            </div>
            <button 
              onClick={() => setExpandedCard(expandedCard === 'velocidad' ? null : 'velocidad')}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all cursor-pointer"
            >
              {expandedCard === 'velocidad' ? <Minus size={16} /> : <Plus size={16} />}
            </button>
          </div>
          <p className="text-indigo-100/70 text-[11px] font-bold contactoing-tight mt-4 italic">Promedio histórico de éxito comercial.</p>

          {expandedCard === 'velocidad' && (
            <div className="mt-6 pt-6 border-t border-white/10 animate-in fade-in duration-300">
              <div className="flex items-center gap-3 mb-4">
                <Calculator className="h-4 w-4 text-indigo-200" />
                <span className="text-[10px] font-black uppercase tracking-widest">Cómo se calcula:</span>
              </div>
              <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-indigo-200">Cierres Analizados:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-black">{eficiencia?.calculos?.contactosConFechaCierre ?? 0}</span>
                    <button 
                      onClick={() => setActiveModal('auditoria-velocidad')}
                      className="p-1 bg-white/10 hover:bg-white/20 rounded-md transition-all cursor-pointer text-indigo-200 hover:text-white"
                      title="Auditar cálculos"
                    >
                      <Eye size={12} />
                    </button>
                  </div>
                </div>
                <div className="text-[9px] text-indigo-100/60 contactoing-relaxed italic">
                  Cálculo: Suma de (Fecha Cierre - Fecha Creación) / Total de Cierres. Solo se incluyen contactos con fecha de cierre registrada.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className={`bg-white border-2 border-slate-100 rounded-[32px] p-8 flex flex-col group hover:border-blue-200 transition-all shadow-sm ${expandedCard === 'tasa' ? 'h-auto' : ''}`}>
        <div className="flex items-center justify-between w-full">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Tasa de Éxito</p>
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{eficiencia?.tasaConversion ?? 0}%</h3>
            <p className="text-[11px] font-bold text-slate-500 mt-1">Cierres Totales</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:rotate-12 transition-all">
              <Activity className="h-7 w-7" />
            </div>
            <button 
              onClick={() => setExpandedCard(expandedCard === 'tasa' ? null : 'tasa')}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-400 transition-all cursor-pointer"
            >
              {expandedCard === 'tasa' ? <Minus size={14} /> : <Plus size={14} />}
            </button>
          </div>
        </div>

        {expandedCard === 'tasa' && (
          <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-4">
              <Calculator className="h-4 w-4 text-blue-600" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Variables del Cálculo:</span>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="block text-[8px] font-black text-slate-400 uppercase mb-1">Cierres (Ganados)</span>
                  <span className="text-lg font-black text-slate-900">{eficiencia?.calculos?.totalCerrados ?? 0}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="block text-[8px] font-black text-slate-400 uppercase mb-1">Total Contactos</span>
                  <span className="text-lg font-black text-slate-900">{eficiencia?.calculos?.totalContactos ?? 0}</span>
                </div>
              </div>
              <div className="text-[9px] text-slate-500 font-medium italic text-center">
                Fórmula: (Cierres / Total Contactos) x 100
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
