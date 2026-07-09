import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { TruncatedText } from '@/components/ui/TruncatedText';

export function CustomSelect<T extends string | number>({ 
  value, 
  onChange, 
  options,
  buttonClassName
}: { 
  value: T; 
  onChange: (value: T) => void; 
  options: { value: T; label: string }[]; 
  buttonClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOpt = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative w-full" ref={selectRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={buttonClassName || `w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl text-left text-sm font-medium transition-all outline-none flex items-center justify-between group cursor-pointer text-slate-700`}
      >
        <TruncatedText as="span" className="truncate pr-2">{selectedOpt?.label}</TruncatedText>
        <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-50 py-2 animate-in fade-in zoom-in duration-200 origin-top">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`cursor-pointer w-full px-4 py-2.5 text-left text-sm font-medium flex items-center justify-between hover:bg-slate-50 transition-colors ${
                  value === opt.value ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-600'
                }`}
              >
                <TruncatedText as="span" className="truncate pr-2">{opt.label}</TruncatedText>
                {value === opt.value && <Check className="h-4 w-4 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export type TimeUnitDays = 'days' | 'weeks' | 'months' | 'years';

const unitLabels: Record<TimeUnitDays, string> = {
  days: 'Días',
  weeks: 'Semanas',
  months: 'Meses',
  years: 'Años'
};

const calculateBaseDays = (num: number, unit: TimeUnitDays) => {
  if (unit === 'weeks') return Math.round(num * 7);
  if (unit === 'months') return Math.round(num * 30);
  if (unit === 'years') return Math.round(num * 365);
  return Math.round(num);
};

const getInitialDaysState = (value: number) => {
  if (value > 0) {
    if (value % 365 === 0) return { num: value / 365, unit: 'years' as TimeUnitDays };
    if (value % 30 === 0) return { num: value / 30, unit: 'months' as TimeUnitDays };
    if (value % 7 === 0) return { num: value / 7, unit: 'weeks' as TimeUnitDays };
  }
  return { num: value || 100, unit: 'days' as TimeUnitDays };
};

export interface TimeDurationDaysInputProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
}

export const TimeDurationDaysInput: React.FC<TimeDurationDaysInputProps> = ({ value, onChange, error }) => {
  const [displayNum, setDisplayNum] = useState<string>(getInitialDaysState(value).num.toString());
  const [displayUnit, setDisplayUnit] = useState<TimeUnitDays>(getInitialDaysState(value).unit);

  useEffect(() => {
    const currentCalculated = calculateBaseDays(Number(displayNum), displayUnit);
    if (currentCalculated !== value) {
      const state = getInitialDaysState(value);
      setDisplayNum(state.num.toString());
      setDisplayUnit(state.unit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleNumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDisplayNum(val);
    const num = Number(val);
    if (!isNaN(num)) {
      onChange(calculateBaseDays(num, displayUnit));
    }
  };

  const handleUnitChange = (newUnit: TimeUnitDays) => {
    setDisplayUnit(newUnit);
    const num = Number(displayNum);
    if (!isNaN(num)) {
      onChange(calculateBaseDays(num, newUnit));
    }
  };

  return (
    <div className="space-y-1 w-full">
      <div className={`w-full flex items-center bg-slate-50 border ${error ? 'border-rose-300 focus-within:border-rose-500 focus-within:ring-rose-100' : 'border-slate-200 focus-within:border-indigo-500 focus-within:ring-indigo-100'} rounded-xl focus-within:ring-2 transition-all shadow-sm overflow-visible`}>
        <div className="pl-4 pr-1 text-sm font-medium text-slate-500 pointer-events-none select-none shrink-0">
          Tras
        </div>
        <input
          type="number"
          min="1"
          step="1"
          value={displayNum}
          onChange={handleNumChange}
          className={`w-16 sm:w-20 shrink-0 px-2 py-2.5 bg-transparent outline-none text-slate-800 text-sm font-bold text-center border-r ${error ? 'border-rose-200' : 'border-slate-200'} pl-1`}
        />
        <div className="flex-1 min-w-0">
          <CustomSelect<TimeUnitDays>
            value={displayUnit}
            onChange={handleUnitChange}
            options={(Object.keys(unitLabels) as TimeUnitDays[]).map(u => ({ value: u, label: unitLabels[u] }))}
            buttonClassName="w-full px-3 py-2.5 bg-transparent text-left text-sm font-medium transition-all outline-none flex items-center justify-between group cursor-pointer text-slate-700"
          />
        </div>
      </div>
      {error && <p className="text-[11px] text-rose-500 font-medium pl-1 leading-tight break-words w-full">{error}</p>}
    </div>
  );
};
