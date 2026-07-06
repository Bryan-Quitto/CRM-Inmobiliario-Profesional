import { useMemo, useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import type { FilterDefinition } from '../../types/filters.types';
import type { AdvancedFiltersState } from '../../hooks/usePropiedadesList/usePropiedadesFiltering';
import type { Propiedad } from '../../types';
import Fuse from 'fuse.js';

interface DynamicFilterInputProps {
  propiedades: Propiedad[];
  filterDef: FilterDefinition;
  filters: AdvancedFiltersState;
  onChange: (key: string, value: string | boolean | number) => void;
  onRemove: () => void;
  isRemovable: boolean;
}

export const DynamicFilterInput = ({ propiedades, filterDef, filters, onChange, onRemove, isRemovable }: DynamicFilterInputProps) => {
  const { key, label, type, options, minLabel, maxLabel } = filterDef;
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const uniqueValues = useMemo(() => {
    if (type !== 'text' || !propiedades) return [];
    const values = new Set<string>();
    propiedades.forEach(p => {
      const val = p[key as keyof Propiedad];
      if (typeof val === 'string' && val.trim() !== '') {
        values.add(val.trim());
      }
    });
    return Array.from(values).map(v => ({ id: v, title: v }));
  }, [type, propiedades, key]);

  const fuse = useMemo(() => {
    if (uniqueValues.length === 0) return null;
    return new Fuse(uniqueValues, { keys: ['title'], threshold: 0.3 });
  }, [uniqueValues]);

  const suggestions = useMemo(() => {
    if (type !== 'text') return [];
    const query = filters[key] as string;
    if (!query) return uniqueValues.slice(0, 5);
    if (!fuse) return [];
    return fuse.search(query).map(r => r.item).slice(0, 5);
  }, [fuse, filters, key, uniqueValues, type]);

  const renderInput = () => {
    switch (type) {
      case 'text':
        return (
          <div className="relative" ref={containerRef}>
            <input 
              type="text" 
              placeholder={`Buscar por ${label.toLowerCase()}...`}
              value={(filters[key] as string) || ''}
              onChange={e => {
                onChange(key, e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg z-50 py-1 max-h-48 overflow-y-auto animate-in fade-in zoom-in duration-200">
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onChange(key, item.title);
                      setShowSuggestions(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700 cursor-pointer"
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      case 'select': {
        const selectedValue = (filters[key] as string) || (options && options.length > 0 ? options[0] : '');
        return (
          <div className="relative" ref={containerRef}>
            <button
              type="button"
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all cursor-pointer flex justify-between items-center text-slate-700"
            >
              <span>{selectedValue}</span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${showSuggestions ? 'rotate-180' : ''}`} />
            </button>
            {showSuggestions && options && options.length > 0 && (
              <div className="absolute w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg z-50 py-1 max-h-48 overflow-y-auto animate-in fade-in zoom-in duration-200">
                {options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      onChange(key, opt);
                      setShowSuggestions(false);
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-slate-50 transition-colors text-sm font-medium cursor-pointer ${selectedValue === opt ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      }
      case 'range':
        return (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <input 
              type="number" 
              placeholder={minLabel || 'Mínimo'}
              value={(filters[`${key}Min`] as string | number) || ''}
              onChange={e => onChange(`${key}Min`, e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
            />
            <span className="hidden sm:block text-slate-400 font-bold">-</span>
            <input 
              type="number" 
              placeholder={maxLabel || 'Máximo'}
              value={(filters[`${key}Max`] as string | number) || ''}
              onChange={e => onChange(`${key}Max`, e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
            />
          </div>
        );
      case 'boolean': {
        const isChecked = filters[key] === true || String(filters[key]) === 'true';
        const labelTrue = filterDef.booleanLabels?.true || 'Sí';
        const labelFalse = filterDef.booleanLabels?.false || 'No';
        const selectedValue = isChecked ? labelTrue : labelFalse;
        
        return (
          <div className="relative" ref={containerRef}>
            <button
              type="button"
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all cursor-pointer flex justify-between items-center text-slate-700"
            >
              <span>{selectedValue}</span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${showSuggestions ? 'rotate-180' : ''}`} />
            </button>
            {showSuggestions && (
              <div className="absolute w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg z-50 py-1 max-h-48 overflow-y-auto animate-in fade-in zoom-in duration-200">
                {[
                  { value: true, label: labelTrue },
                  { value: false, label: labelFalse }
                ].map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => {
                      onChange(key, opt.value);
                      setShowSuggestions(false);
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-slate-50 transition-colors text-sm font-medium cursor-pointer ${isChecked === opt.value ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-3 relative group">
      <div className="flex items-center justify-between">
        <label className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</label>
        {isRemovable && (
          <button 
            title="Eliminar filtro"
            onClick={onRemove}
            className="text-slate-300 hover:text-red-500 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100 cursor-pointer p-1"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {renderInput()}
    </div>
  );
};
