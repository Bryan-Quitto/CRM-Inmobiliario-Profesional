import { useRef, useEffect } from 'react';
import { BarChart3, Info, ChevronDown, Check, Calendar } from 'lucide-react';
import { MESES, type RangoFechas } from '../../hooks/useAnaliticaState';

interface AnaliticaHeaderProps {
  mesSeleccionado: number;
  setMesSeleccionado: (val: number) => void;
  semanaIndice: number | 'total';
  setSemanaIndice: (val: number | 'total') => void;
  showMesDropdown: boolean;
  setShowMesDropdown: (val: boolean) => void;
  semanasDelMes: RangoFechas[];
  formattedRange: string;
}

export const AnaliticaHeader = ({
  mesSeleccionado,
  setMesSeleccionado,
  semanaIndice,
  setSemanaIndice,
  showMesDropdown,
  setShowMesDropdown,
  semanasDelMes,
  formattedRange
}: AnaliticaHeaderProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMesDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setShowMesDropdown]);

  return (
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
          <button 
            onClick={() => setShowMesDropdown(!showMesDropdown)} 
            className="bg-white border-2 border-slate-100 rounded-2xl px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:border-blue-300 focus:ring-4 focus:ring-blue-50/50 transition-all outline-none shadow-md flex items-center gap-3 min-w-[140px] justify-between cursor-pointer"
          >
            {MESES[mesSeleccionado]}
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${showMesDropdown ? 'rotate-180' : ''}`} />
          </button>
          
          {showMesDropdown && (
            <div className="absolute left-0 mt-3 w-48 bg-white border-2 border-slate-50 rounded-[24px] shadow-2xl z-[100] py-2 animate-in fade-in zoom-in-95 duration-200 origin-top-left overflow-hidden backdrop-blur-xl bg-white/95">
              {MESES.slice(0, new Date().getMonth() + 1).map((mes, idx) => (
                <button 
                  key={idx} 
                  onClick={() => { setMesSeleccionado(idx); setSemanaIndice('total'); setShowMesDropdown(false); }} 
                  className={`cursor-pointer w-full px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest flex items-center justify-between transition-colors hover:bg-slate-50 ${mesSeleccionado === idx ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'}`}
                >
                  {mes}
                  {mesSeleccionado === idx && <Check className="h-3 w-3" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl shadow-inner border border-slate-200/50">
          <button 
            onClick={() => setSemanaIndice('total')} 
            className={`cursor-pointer px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${semanaIndice === 'total' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-600'}`}
          >
            Mes
          </button>
          {semanasDelMes.map((s, idx) => (
            <button 
              key={idx} 
              onClick={() => setSemanaIndice(idx)} 
              className={`cursor-pointer px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${semanaIndice === idx ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-600'}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl flex items-center gap-3 shadow-lg shadow-slate-900/10 border border-white/5">
          <Calendar className="h-4 w-4 text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{formattedRange}</span>
        </div>
      </div>
    </div>
  );
};
