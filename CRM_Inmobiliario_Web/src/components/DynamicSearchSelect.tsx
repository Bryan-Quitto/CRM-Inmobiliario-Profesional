import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Loader2, X, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Fuse from 'fuse.js';

interface SearchItem {
  id: string;
  title: string;
  subtitle?: string;
}

interface Props {
  label: string;
  icon: LucideIcon;
  placeholder: string;
  value?: string; // ID
  initialLabel?: string;
  options?: SearchItem[]; // Búsqueda local instantánea
  onSearch?: (query: string) => Promise<SearchItem[]>; // Fallback a búsqueda remota
  onChange: (id: string | undefined, title: string | undefined) => void;
  error?: string;
}

export const DynamicSearchSelect = ({ 
  label, 
  icon: Icon, 
  placeholder, 
  value, 
  initialLabel, 
  options,
  onSearch, 
  onChange,
  error 
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(initialLabel || '');
  
  const containerRef = useRef<HTMLDivElement>(null);

  const fuse = useMemo(() => {
    if (!options) return null;
    return new Fuse(options, {
      keys: ['title', 'subtitle'],
      threshold: 0.3,
      distance: 100
    });
  }, [options]);

  useEffect(() => {
    if (initialLabel) setSelectedLabel(initialLabel);
  }, [initialLabel]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Si hay opciones locales, la búsqueda es INSTANTÁNEA (sin debounce)
    if (options && fuse) {
      if (query.length >= 1) {
        const fuzzyResults = fuse.search(query).map(r => r.item);
        setResults(fuzzyResults);
      } else {
        setResults([]);
      }
      return;
    }

    // Si NO hay opciones locales, usamos la búsqueda remota con debounce (el comportamiento anterior)
    if (!onSearch) return;

    const delayDebounceFn = setTimeout(async () => {
      if (query.length >= 1) {
        setIsLoading(true);
        try {
          const data = await onSearch(query);
          setResults(data);
        } catch (error) {
          console.error('Error searching:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, options, fuse, onSearch]);

  const handleSelect = (item: SearchItem) => {
    setSelectedLabel(item.title);
    onChange(item.id, item.title);
    setIsOpen(false);
    setQuery('');
  };

  const handleClear = () => {
    setSelectedLabel('');
    onChange(undefined, undefined);
    setQuery('');
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">{label}</label>
      <div className="relative">
        {selectedLabel ? (
          <div className="w-full pl-4 pr-12 py-3 bg-blue-50 border border-blue-200 rounded-2xl text-sm font-bold text-blue-700 flex items-center gap-2 animate-in zoom-in duration-200">
            <Icon className="h-4 w-4 text-blue-500" />
            <span className="truncate">{selectedLabel}</span>
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 p-1.5 hover:bg-blue-100 rounded-lg transition-colors text-blue-400 hover:text-blue-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="relative group">
            <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className={`w-full pl-10 pr-10 py-3 bg-slate-50 border ${error ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'} rounded-2xl text-sm font-medium transition-all outline-none focus:ring-4`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isLoading ? (
                <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
              ) : (
                <Search className="h-4 w-4 text-slate-300" />
              )}
            </div>
          </div>
        )}

        {isOpen && query.length >= 1 && (
          <div className="absolute w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in duration-200 origin-top overflow-hidden">
            <div className="max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
              {results.length > 0 ? (
                results.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0 group flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter mt-0.5">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                    {value === item.id && <Check className="h-4 w-4 text-blue-500" />}
                  </button>
                ))
              ) : (
                !isLoading && (
                  <div className="px-4 py-6 text-center">
                    <p className="text-xs font-bold text-slate-400 italic">No se encontraron resultados</p>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-[10px] text-rose-500 font-bold mt-1 pl-1 uppercase">{error}</p>}
    </div>
  );
};
