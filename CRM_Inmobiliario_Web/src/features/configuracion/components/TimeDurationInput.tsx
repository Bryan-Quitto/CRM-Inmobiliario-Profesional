import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown } from 'lucide-react';
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
        className={buttonClassName || `w-full min-w-0 px-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl text-left text-sm font-medium transition-all outline-none flex items-center justify-between group cursor-pointer text-slate-700`}
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
                {opt.label}
                {value === opt.value && <Check className="h-4 w-4 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export type TimeUnit = 'minutes' | 'hours' | 'days';

export interface TimeDurationInputProps {
  value: number;
  onChange: (value: number) => void;
  baseUnit: 'minutes' | 'hours';
  allowedUnits: TimeUnit[];
  prefix?: string;
  unitLabels?: Record<TimeUnit, string>;
  error?: string;
}

const calculateBaseValue = (num: number, unit: TimeUnit, baseUnit: 'minutes' | 'hours') => {
  if (baseUnit === 'minutes') {
    if (unit === 'days') return Math.round(num * 1440);
    if (unit === 'hours') return Math.round(num * 60);
    return Math.round(num);
  } else {
    if (unit === 'days') return Math.round(num * 24);
    return Math.round(num);
  }
};

const getInitialState = (value: number, baseUnit: 'minutes' | 'hours', allowedUnits: TimeUnit[]) => {
  if (baseUnit === 'minutes') {
    if (allowedUnits.includes('days') && value % 1440 === 0 && value !== 0) return { num: value / 1440, unit: 'days' as TimeUnit };
    if (allowedUnits.includes('hours') && value % 60 === 0 && value !== 0) return { num: value / 60, unit: 'hours' as TimeUnit };
    return { num: value, unit: 'minutes' as TimeUnit };
  } else {
    if (allowedUnits.includes('days') && value % 24 === 0 && value !== 0) return { num: value / 24, unit: 'days' as TimeUnit };
    return { num: value, unit: 'hours' as TimeUnit };
  }
};

export const TimeDurationInput: React.FC<TimeDurationInputProps> = ({ 
  value, 
  onChange, 
  baseUnit, 
  allowedUnits,
  prefix,
  unitLabels = { minutes: 'Minutos', hours: 'Horas', days: 'Días' },
  error
}) => {
  const [displayNum, setDisplayNum] = useState<string>(getInitialState(value, baseUnit, allowedUnits).num.toString());
  const [displayUnit, setDisplayUnit] = useState<TimeUnit>(getInitialState(value, baseUnit, allowedUnits).unit);

  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    const currentCalculated = calculateBaseValue(Number(displayNum), displayUnit, baseUnit);
    if (currentCalculated !== value) {
      const state = getInitialState(value, baseUnit, allowedUnits);
      setDisplayNum(state.num.toString());
      setDisplayUnit(state.unit);
    }
  }

  const handleNumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDisplayNum(val);
    const num = Number(val);
    if (!isNaN(num)) {
      onChange(calculateBaseValue(num, displayUnit, baseUnit));
    }
  };

  const handleUnitChange = (newUnit: TimeUnit) => {
    setDisplayUnit(newUnit);
    const num = Number(displayNum);
    if (!isNaN(num)) {
      onChange(calculateBaseValue(num, newUnit, baseUnit));
    }
  };

  return (
    <div className="space-y-1 w-full">
      <div className={`flex items-center bg-slate-50 border ${error ? 'border-rose-300 focus-within:border-rose-500 focus-within:ring-rose-100' : 'border-slate-200 focus-within:border-indigo-500 focus-within:ring-indigo-100'} w-full rounded-xl focus-within:ring-2 transition-all shadow-sm overflow-visible`}>
        {prefix && (
          <div className="pl-4 pr-1 text-sm font-medium text-slate-500 pointer-events-none select-none shrink-0">
            {prefix}
          </div>
        )}
        <input
          type="number"
          min="1"
          step="1"
          value={displayNum}
          onChange={handleNumChange}
          className={`w-16 sm:w-20 shrink-0 px-2 py-2.5 bg-transparent outline-none text-slate-800 text-sm font-bold text-center border-r ${error ? 'border-rose-200' : 'border-slate-200'} ${prefix ? 'pl-1' : 'pl-4'}`}
        />
        <div className="flex-1 min-w-0">
          <CustomSelect<TimeUnit>
            value={displayUnit}
            onChange={handleUnitChange}
            options={allowedUnits.map(u => ({ value: u, label: unitLabels[u] }))}
            buttonClassName="w-full min-w-0 px-3 py-2.5 bg-transparent text-left text-sm font-medium transition-all outline-none flex items-center justify-between group cursor-pointer text-slate-700"
          />
        </div>
      </div>
      {error && <p className="text-[11px] text-rose-500 font-medium pl-1 leading-tight break-words">{error}</p>}
    </div>
  );
};
