import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import type { ContactosAdvancedFiltersState } from '../../hooks/useContactosFiltering';
import { DynamicFilterInput } from './DynamicFilterInput';
import { FilterSelectorDropdown } from './FilterSelectorDropdown';
import { AVAILABLE_CONTACT_FILTERS, DEFAULT_ACTIVE_CONTACT_FILTER_KEYS } from '../../types/filters.types';
import type { Contacto } from '../../types';

interface AdvancedFiltersDrawerProps {
  contactos: Contacto[];
  isOpen: boolean;
  onClose: () => void;
  filters: ContactosAdvancedFiltersState;
  setFilters: React.Dispatch<React.SetStateAction<ContactosAdvancedFiltersState>>;
  activeCount: number;
}

export const AdvancedFiltersDrawer = ({ contactos, isOpen, onClose, filters, setFilters, activeCount }: AdvancedFiltersDrawerProps) => {
  const [activeKeys, setActiveKeys] = useState<string[]>(() => {
    const keys = new Set(DEFAULT_ACTIVE_CONTACT_FILTER_KEYS);
    Object.keys(filters).forEach(k => {
      const baseKey = k.replace(/Min$|Max$/, '');
      if (filters[k] !== undefined && filters[k] !== '') {
        keys.add(baseKey);
      }
    });
    return Array.from(keys);
  });

  if (!isOpen) return null;

  const handleChange = (key: string, value: string | boolean | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    // Resetting advanced filters (but not the quick ones, wait, advanced filters usually only store their own keys in the drawer,
    // but the hook will reset everything except 'Todas')
    // We should probably just empty out the state since we decided NOT to persist.
    // The main dropdowns state is in `useContactosFiltering`.
    setFilters({});
    setActiveKeys([...DEFAULT_ACTIVE_CONTACT_FILTER_KEYS]);
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[200] transition-opacity cursor-pointer" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-white shadow-2xl z-[210] flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <h3 className="font-extrabold text-lg text-slate-800">Filtros Avanzados</h3>
            {activeCount > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs font-black px-2 py-0.5 rounded-full">
                {activeCount}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-8 pb-32">
          {activeKeys.map(key => {
            const filterDef = AVAILABLE_CONTACT_FILTERS.find(f => f.key === key);
            if (!filterDef) return null;
            return (
              <DynamicFilterInput 
                key={key}
                contactos={contactos}
                filterDef={filterDef}
                filters={filters}
                onChange={handleChange}
                onRemove={() => {
                  setActiveKeys(prev => prev.filter(k => k !== key));
                  if (filterDef.type === 'range' || filterDef.type === 'date') {
                    setFilters(prev => {
                      const newFilters = { ...prev };
                      delete newFilters[`${key}Min`];
                      delete newFilters[`${key}Max`];
                      return newFilters;
                    });
                  } else {
                    setFilters(prev => {
                      const newFilters = { ...prev };
                      delete newFilters[key];
                      return newFilters;
                    });
                  }
                }}
                isRemovable={true}
              />
            );
          })}

          <FilterSelectorDropdown 
            activeKeys={activeKeys}
            onAddFilter={key => setActiveKeys(prev => [...prev, key])}
          />
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50/50">
          <button 
            onClick={clearFilters}
            className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Limpiar
          </button>
          <button 
            onClick={onClose}
            className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Search className="h-4 w-4" />
            <span>Ver Resultados</span>
          </button>
        </div>

      </div>
    </>
  );
};
