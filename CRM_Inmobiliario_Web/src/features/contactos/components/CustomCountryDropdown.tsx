import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { SearchInput } from '@/components/ui/SearchInput';
import { defaultCountries, parseCountry, FlagImage } from 'react-international-phone';
import Fuse from 'fuse.js';

interface Props {
  country: string; // iso2
  setCountry: (iso2: string) => void;
  disabled?: boolean;
}

export const CustomCountryDropdown = ({ country, setCountry, disabled }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Parseamos todos los países para la búsqueda
  const parsedCountries = useMemo(() => {
    return defaultCountries.map((c) => parseCountry(c));
  }, []);

  const selectedCountryData = useMemo(() => {
    return parsedCountries.find((c) => c.iso2 === country) || parsedCountries[0];
  }, [country, parsedCountries]);

  const fuse = useMemo(() => {
    return new Fuse(parsedCountries, {
      keys: ['name', 'dialCode', 'iso2'],
      threshold: 0.3,
    });
  }, [parsedCountries]);

  const results = useMemo(() => {
    if (!query) return parsedCountries;
    return fuse.search(query).map((result) => result.item);
  }, [query, parsedCountries, fuse]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 pl-2 pr-2 py-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 outline-none cursor-pointer"
      >
        <FlagImage iso2={selectedCountryData.iso2} size="20px" />
        <span className="text-sm font-bold text-slate-700">+{selectedCountryData.dialCode}</span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in duration-200 origin-top overflow-hidden">
          <div className="px-3 pb-2 border-b border-slate-50">
            <SearchInput
              autoFocus
              placeholder="Buscar país o prefijo..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 py-2 bg-slate-50"
              iconClassName="left-3"
            />
          </div>
          
          <div className="max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 mt-1">
            {results.length > 0 ? (
              results.map((c) => (
                <button
                  key={c.iso2}
                  type="button"
                  onClick={() => {
                    setCountry(c.iso2);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <FlagImage iso2={c.iso2} size="20px" />
                    <div>
                      <p className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                        {c.name}
                      </p>
                      <p className="text-xs font-medium text-slate-400">+{c.dialCode}</p>
                    </div>
                  </div>
                  {country === c.iso2 && <Check className="h-4 w-4 text-blue-500" />}
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-xs font-bold text-slate-400 italic">No se encontraron resultados</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
