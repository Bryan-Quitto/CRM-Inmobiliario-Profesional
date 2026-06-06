import { useState, useRef, useEffect } from 'react';
import { Bot, ChevronDown, Check } from 'lucide-react';
import { useTokenUsage } from '../../configuracion/api/finops';

export const PersonalTokenUsagePanel = () => {
  const [rango, setRango] = useState<'hoy' | 'semana' | 'mes' | 'siempre'>('hoy');
  const { data, isLoading } = useTokenUsage();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const RANGOS = [
    { value: 'hoy', label: 'Hoy' },
    { value: 'semana', label: 'Semana' },
    { value: 'mes', label: 'Mes' },
    { value: 'siempre', label: 'Siempre' }
  ];

  const getFilteredData = () => {
    if (!data) return [];
    if (rango === 'siempre') return data;

    const now = new Date();
    // Obtener string "YYYY-MM-DD" en UTC-5
    const getEcDateStr = (d: Date) => {
      return new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'America/Guayaquil', 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      }).format(d);
    };

    const todayStr = getEcDateStr(now);
    const [tYear, tMonth] = todayStr.split('-');
    
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgoStr = getEcDateStr(sevenDaysAgo);

    return data.filter(row => {
      // Asumiendo que row.fecha empieza con YYYY-MM-DD
      const rowDateStr = row.fecha.slice(0, 10);
      
      if (rango === 'hoy') {
        return rowDateStr === todayStr;
      }
      if (rango === 'mes') {
        const [rYear, rMonth] = rowDateStr.split('-');
        return rYear === tYear && rMonth === tMonth;
      }
      if (rango === 'semana') {
        return rowDateStr >= sevenDaysAgoStr && rowDateStr <= todayStr;
      }
      return true;
    });
  };

  const filteredData = getFilteredData();
  const inputTokens = filteredData.reduce((acc, row) => acc + row.tokensInput, 0);
  const outputTokens = filteredData.reduce((acc, row) => acc + row.tokensOutput, 0);
  const totalTokens = inputTokens + outputTokens;
  const costoTotal = filteredData.reduce((acc, row) => acc + row.costoTotalUsd, 0);

  return (
    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-purple-500" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consumo Tokens IA</p>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsDropdownOpen(!isDropdownOpen);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:border-purple-300 transition-colors focus:outline-none cursor-pointer"
          >
            {RANGOS.find(r => r.value === rango)?.label}
            <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[50] py-2 animate-in fade-in zoom-in duration-200 origin-top-right backdrop-blur-xl bg-white/95">
              {RANGOS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    setRango(opt.value as 'hoy' | 'semana' | 'mes' | 'siempre');
                    setIsDropdownOpen(false);
                  }}
                  className={`cursor-pointer w-full px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide flex items-center justify-between transition-colors hover:bg-slate-50 ${
                    rango === opt.value ? 'text-purple-600' : 'text-slate-600'
                  }`}
                >
                  {opt.label}
                  {rango === opt.value && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="bg-white rounded-xl p-3 border border-slate-100 flex flex-col gap-2">
        {isLoading ? (
          <span className="text-xs text-slate-400 animate-pulse text-center py-4">Cargando métricas...</span>
        ) : (
          <>
            <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Tokens Totales</span>
                <span className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">Input + Output</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-black text-slate-800">
                  {totalTokens.toLocaleString('es-EC')} <span className="text-[10px] font-bold text-slate-400 uppercase">tkns</span>
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  ≈ ${costoTotal.toFixed(6)} USD <span className="text-[8px] uppercase">(Valor)</span>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-indigo-50/50 border border-indigo-100/50 transition-colors">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wide">Desglose</span>
                <span className="text-[10px] text-indigo-500/80 font-medium leading-none mt-0.5">Input / Output</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-black text-indigo-700">
                  {inputTokens.toLocaleString('es-EC')} <span className="text-[10px] font-bold text-indigo-500/70 uppercase">in</span>
                </span>
                <span className="text-[10px] font-bold text-indigo-600">
                  {outputTokens.toLocaleString('es-EC')} <span className="text-[8px] uppercase">out</span>
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
