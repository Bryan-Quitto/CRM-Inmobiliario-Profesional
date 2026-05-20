import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { AVAILABLE_CONTACT_FILTERS } from '../../types/filters.types';

interface FilterSelectorDropdownProps {
  activeKeys: string[];
  onAddFilter: (key: string) => void;
}

export const FilterSelectorDropdown = ({ activeKeys, onAddFilter }: FilterSelectorDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const availableFilters = AVAILABLE_CONTACT_FILTERS.filter(f => !activeKeys.includes(f.key));
  
  const filteredOptions = availableFilters.filter(f => 
    f.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative mt-4">
      {isOpen ? (
        <div className="absolute bottom-full left-0 mb-2 w-full bg-white border border-slate-200 shadow-xl rounded-xl p-2 z-[220] flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              autoFocus
              placeholder="Buscar filtro..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
            />
          </div>
          <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
            {filteredOptions.length === 0 ? (
              <div className="text-center text-sm text-slate-500 py-4 font-medium">No hay más filtros disponibles</div>
            ) : (
              filteredOptions.map(f => (
                <button
                  key={f.key}
                  onClick={() => {
                    onAddFilter(f.key);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className="text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-sm font-semibold text-slate-700 transition-colors cursor-pointer flex items-center justify-between group"
                >
                  <span>{f.label}</span>
                  <Plus className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}

      {/* Overlay to close */}
      {isOpen && (
        <div className="fixed inset-0 z-[210]" onClick={() => setIsOpen(false)} />
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-3 flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all cursor-pointer font-bold text-sm"
      >
        <Plus className="h-4 w-4" />
        <span>Añadir filtro</span>
      </button>
    </div>
  );
};
