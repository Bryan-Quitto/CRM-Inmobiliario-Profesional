import { useMemo, useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
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
      case 'select':
        return (
          <select
            value={(filters[key] as string) || (options && options.length > 0 ? options[0] : '')}
            onChange={e => onChange(key, e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all appearance-none cursor-pointer"
          >
            {options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'range':
        return (
          <div className="flex items-center gap-3">
            <input 
              type="number" 
              placeholder={minLabel || 'Mínimo'}
              value={(filters[`${key}Min`] as string | number) || ''}
              onChange={e => onChange(`${key}Min`, e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
            />
            <span className="text-slate-400 font-bold">-</span>
            <input 
              type="number" 
              placeholder={maxLabel || 'Máximo'}
              value={(filters[`${key}Max`] as string | number) || ''}
              onChange={e => onChange(`${key}Max`, e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
            />
          </div>
        );
      case 'boolean':
        return (
          <label className="flex items-center gap-3 cursor-pointer mt-1">
            <input 
              type="checkbox"
              checked={filters[key] === true || filters[key] === 'true'}
              onChange={e => onChange(key, e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-sm font-semibold text-slate-700">Activo / Sí</span>
          </label>
        );
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
            onClick={onRemove}
            className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer p-1"
            title="Eliminar filtro"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {renderInput()}
    </div>
  );
};
