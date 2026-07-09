import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Filter, ChevronDown, Check } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { TruncatedText } from '@/components/ui/TruncatedText';

interface Props {
  dias: number | 'custom';
  setDias: (d: number | 'custom') => void;
  startDate: string;
  setStartDate: (d: string) => void;
  endDate: string;
  setEndDate: (d: string) => void;
  canal: string;
  setCanal: (c: string) => void;
}

export const AuditoriaGeneralFiltros: React.FC<Props> = ({ 
  dias, setDias, startDate, setStartDate, endDate, setEndDate, canal, setCanal 
}) => {
  const [isCustom, setIsCustom] = useState(dias === 'custom');
  const [localStart, setLocalStart] = useState<string>(startDate || format(new Date(), 'yyyy-MM-dd'));
  const [localEnd, setLocalEnd] = useState<string>(endDate || format(new Date(), 'yyyy-MM-dd'));
  
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    if (openDropdownId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  const handleDiasChange = (value: string | number) => {
    if (value === 'custom') {
      setIsCustom(true);
      return;
    }
    
    setIsCustom(false);
    setDias(value as number);
    setStartDate('');
    setEndDate('');
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localStart && localEnd) {
      let finalStart = localStart;
      let finalEnd = localEnd;
      
      // Asegurar que inicio <= fin
      if (new Date(finalStart) > new Date(finalEnd)) {
        const temp = finalStart;
        finalStart = finalEnd;
        finalEnd = temp;
      }
      
      // Limitar a 31 días por rendimiento
      if (differenceInDays(new Date(finalEnd), new Date(finalStart)) > 31) {
        const adjustedStart = new Date(finalEnd);
        adjustedStart.setDate(adjustedStart.getDate() - 31);
        finalStart = format(adjustedStart, 'yyyy-MM-dd');
      }

      setLocalStart(finalStart);
      setLocalEnd(finalEnd);
      
      setStartDate(finalStart);
      setEndDate(finalEnd);
      setDias('custom');
    }
    setOpenDropdownId(null);
  };

  const diasOptions = [
    { value: 1, label: 'Hoy' },
    { value: 7, label: 'Semana' },
    { value: 30, label: 'Mes' },
    { value: 'custom', label: 'Personalizada' }
  ];

  const canalOptions = [
    { value: '', label: 'Todos los Canales' },
    { value: 'WhatsApp', label: 'WhatsApp' },
    { value: 'Facebook', label: 'Facebook Messenger' },
    { value: 'Personal', label: 'Personal' }
  ];

  const selectedDiasLabel = isCustom 
    ? (startDate && endDate ? `${startDate} al ${endDate}` : 'Personalizada') 
    : diasOptions.find(o => o.value === dias)?.label;

  const selectedCanalLabel = canal === '' 
    ? 'Todos los Canales' 
    : canalOptions.find(o => o.value === canal)?.label;

  return (
    <div className="flex flex-wrap items-end gap-3 mb-6" ref={dropdownRef}>
      
      {/* Dropdown Período */}
      <div className="flex flex-col gap-1.5 flex-1 sm:flex-none">
        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Período de Tiempo</label>
        <div className="relative flex flex-wrap gap-2">
          <button 
            type="button"
            onClick={() => setOpenDropdownId(openDropdownId === 'periodo' ? null : 'periodo')}
            className="flex items-center gap-3 pl-4 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-slate-300 transition-all shadow-sm cursor-pointer h-[42px] min-w-[160px]"
          >
            <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
            <TruncatedText as="span" className="truncate flex-1 text-left">{selectedDiasLabel}</TruncatedText>
            <ChevronDown className={`h-4 w-4 text-slate-300 shrink-0 transition-transform duration-300 ${openDropdownId === 'periodo' ? 'rotate-180' : ''}`} />
          </button>

          {openDropdownId === 'periodo' && (
            <div className="absolute left-0 top-full mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] py-2 animate-in fade-in zoom-in duration-200 origin-top-left backdrop-blur-xl bg-white/95">
              {diasOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    handleDiasChange(option.value);
                    if (option.value !== 'custom') setOpenDropdownId(null);
                  }}
                  className={`cursor-pointer w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 ${
                    (!isCustom && dias === option.value) || (isCustom && option.value === 'custom')
                      ? 'text-blue-600 bg-blue-50/30' 
                      : 'text-slate-600'
                  }`}
                >
                  {option.label}
                  {((!isCustom && dias === option.value) || (isCustom && option.value === 'custom')) && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}

          {isCustom && (
            <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 group relative z-10">
              <input
                type="date"
                value={localStart}
                onChange={(e) => setLocalStart(e.target.value)}
                className="h-[42px] bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 block px-3 outline-none transition-all shadow-sm"
              />
              <span className="text-slate-400 font-bold text-sm">-</span>
              <input
                type="date"
                value={localEnd}
                onChange={(e) => setLocalEnd(e.target.value)}
                className="h-[42px] bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 block px-3 outline-none transition-all shadow-sm"
              />
              <button 
                type="submit" 
                className="h-[42px] px-4 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 cursor-pointer"
              >
                Aplicar
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max bg-slate-800 text-white text-[10px] font-bold tracking-wider uppercase rounded py-1 px-2 shadow-lg">
                Máx. 31 días por rendimiento
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Dropdown Canal */}
      <div className="flex flex-col gap-1.5 flex-1 sm:flex-none">
        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 ml-1">Canal</label>
        <div className="relative">
          <button 
            type="button"
            onClick={() => setOpenDropdownId(openDropdownId === 'canal' ? null : 'canal')}
            className="flex items-center gap-3 pl-4 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-slate-300 transition-all shadow-sm cursor-pointer h-[42px] min-w-[200px]"
          >
            <Filter className="h-4 w-4 text-slate-500 shrink-0" />
            <TruncatedText as="span" className="truncate flex-1 text-left">{selectedCanalLabel}</TruncatedText>
            <ChevronDown className={`h-4 w-4 text-slate-300 shrink-0 transition-transform duration-300 ${openDropdownId === 'canal' ? 'rotate-180' : ''}`} />
          </button>

          {openDropdownId === 'canal' && (
            <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] py-2 animate-in fade-in zoom-in duration-200 origin-top-left sm:origin-top-right backdrop-blur-xl bg-white/95">
              {canalOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setCanal(option.value as string);
                    setOpenDropdownId(null);
                  }}
                  className={`cursor-pointer w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 ${
                    canal === option.value ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                  }`}
                >
                  {option.label}
                  {canal === option.value && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
