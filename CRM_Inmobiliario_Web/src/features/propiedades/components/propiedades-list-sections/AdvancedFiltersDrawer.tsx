import React from 'react';
import { X, Search } from 'lucide-react';
import type { AdvancedFiltersState } from '../../hooks/usePropiedadesList/usePropiedadesFiltering';

interface AdvancedFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: AdvancedFiltersState;
  setFilters: React.Dispatch<React.SetStateAction<AdvancedFiltersState>>;
  activeCount: number;
}

export const AdvancedFiltersDrawer = ({ isOpen, onClose, filters, setFilters, activeCount }: AdvancedFiltersDrawerProps) => {
  if (!isOpen) return null;

  const handleChange = (key: keyof AdvancedFiltersState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      operacion: 'Todas',
      precioMin: '',
      precioMax: '',
      areaMin: '',
      areaMax: '',
      habitacionesMin: '',
      banosMin: '',
      estacionamientosMin: ''
    });
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
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-8">
          
          {/* Rango de Precio */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-black uppercase tracking-wider text-slate-400">Rango de Precio ($)</label>
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                placeholder="Mínimo"
                value={filters.precioMin}
                onChange={e => handleChange('precioMin', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
              />
              <span className="text-slate-400 font-bold">-</span>
              <input 
                type="number" 
                placeholder="Máximo"
                value={filters.precioMax}
                onChange={e => handleChange('precioMax', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
              />
            </div>
          </div>

          {/* Rango de Área */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-black uppercase tracking-wider text-slate-400">Área Total (m²)</label>
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                placeholder="Mínima"
                value={filters.areaMin}
                onChange={e => handleChange('areaMin', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
              />
              <span className="text-slate-400 font-bold">-</span>
              <input 
                type="number" 
                placeholder="Máxima"
                value={filters.areaMax}
                onChange={e => handleChange('areaMax', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
              />
            </div>
          </div>

          {/* Habitaciones */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-black uppercase tracking-wider text-slate-400">Habitaciones (Mínimo)</label>
            <div className="grid grid-cols-6 gap-2">
              <button
                onClick={() => handleChange('habitacionesMin', '')}
                className={`col-span-2 py-2 text-sm font-bold rounded-lg border transition-all cursor-pointer ${!filters.habitacionesMin ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                Cualquiera
              </button>
              {['1', '2', '3', '4'].map(val => (
                <button
                  key={val}
                  onClick={() => handleChange('habitacionesMin', val)}
                  className={`col-span-1 py-2 text-sm font-bold rounded-lg border transition-all cursor-pointer ${filters.habitacionesMin === val ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  {val}+
                </button>
              ))}
            </div>
          </div>

          {/* Baños */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-black uppercase tracking-wider text-slate-400">Baños (Mínimo)</label>
            <div className="grid grid-cols-6 gap-2">
              <button
                onClick={() => handleChange('banosMin', '')}
                className={`col-span-2 py-2 text-sm font-bold rounded-lg border transition-all cursor-pointer ${!filters.banosMin ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                Cualquiera
              </button>
              {['1', '2', '3', '4'].map(val => (
                <button
                  key={val}
                  onClick={() => handleChange('banosMin', val)}
                  className={`col-span-1 py-2 text-sm font-bold rounded-lg border transition-all cursor-pointer ${filters.banosMin === val ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  {val}+
                </button>
              ))}
            </div>
          </div>

          {/* Estacionamientos */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-black uppercase tracking-wider text-slate-400">Estacionamientos (Mínimo)</label>
            <div className="grid grid-cols-6 gap-2">
              <button
                onClick={() => handleChange('estacionamientosMin', '')}
                className={`col-span-2 py-2 text-sm font-bold rounded-lg border transition-all cursor-pointer ${!filters.estacionamientosMin ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                Cualquiera
              </button>
              {['1', '2', '3', '4'].map(val => (
                <button
                  key={val}
                  onClick={() => handleChange('estacionamientosMin', val)}
                  className={`col-span-1 py-2 text-sm font-bold rounded-lg border transition-all cursor-pointer ${filters.estacionamientosMin === val ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  {val}+
                </button>
              ))}
            </div>
          </div>

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
