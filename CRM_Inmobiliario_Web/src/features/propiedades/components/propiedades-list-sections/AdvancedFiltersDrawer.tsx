import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import type { AdvancedFiltersState } from '../../hooks/usePropiedadesList/usePropiedadesFiltering';
import { DynamicFilterInput } from './DynamicFilterInput';
import { FilterSelectorDropdown } from './FilterSelectorDropdown';
import { AVAILABLE_PROPERTY_FILTERS, DEFAULT_ACTIVE_FILTER_KEYS } from '../../types/filters.types';
import type { Propiedad } from '../../types';

interface AdvancedFiltersDrawerProps {
  propiedades: Propiedad[];
  isOpen: boolean;
  onClose: () => void;
  filters: AdvancedFiltersState;
  setFilters: React.Dispatch<React.SetStateAction<AdvancedFiltersState>>;
  activeCount: number;
}

export const AdvancedFiltersDrawer = ({ propiedades, isOpen, onClose, filters, setFilters, activeCount }: AdvancedFiltersDrawerProps) => {
  const [activeKeys, setActiveKeys] = useState<string[]>(() => {
    const keys = new Set(DEFAULT_ACTIVE_FILTER_KEYS);
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
    setFilters({ operacion: 'Todas' });
    setActiveKeys([...DEFAULT_ACTIVE_FILTER_KEYS]);
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[200] transition-opacity" onClick={onClose} />
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
            const filterDef = AVAILABLE_PROPERTY_FILTERS.find(f => f.key === key);
            if (!filterDef) return null;
            return (
              <DynamicFilterInput 
                key={key}
                propiedades={propiedades}
                filterDef={filterDef}
                filters={filters}
                onChange={handleChange}
                onRemove={() => {
                  setActiveKeys(prev => prev.filter(k => k !== key));
                  if (filterDef.type === 'range') {
                    setFilters(prev => ({ ...prev, [`${key}Min`]: '', [`${key}Max`]: '' }));
                  } else {
                    setFilters(prev => ({ ...prev, [key]: '' }));
                  }
                }}
                isRemovable={true} // Permitimos remover cualquier filtro para máxima flexibilidad
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
