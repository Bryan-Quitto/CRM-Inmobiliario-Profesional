import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, ArrowUp, ArrowDown } from 'lucide-react';

interface AgendaToolbarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  filterTipos: string[];
  onFilterTiposChange: (val: string[]) => void;
  sortBy: 'fechaInicio' | 'fechaCreacion';
  onSortByChange: (val: 'fechaInicio' | 'fechaCreacion') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (val: 'asc' | 'desc') => void;
}

const TIPOS_TAREA = ['Llamada', 'Visita', 'Reunión', 'Trámite'];

export const AgendaToolbar: React.FC<AgendaToolbarProps> = ({
  searchQuery,
  onSearchChange,
  filterTipos,
  onFilterTiposChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange
}) => {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTipo = (tipo: string) => {
    if (filterTipos.includes(tipo)) {
      onFilterTiposChange(filterTipos.filter(t => t !== tipo));
    } else {
      onFilterTiposChange([...filterTipos, tipo]);
    }
  };

  const sortOptions = [
    { value: 'fechaInicio', label: 'Fecha de Inicio' },
    { value: 'fechaCreacion', label: 'Fecha de Creación' }
  ] as const;

  return (
    <div className="px-5 py-3 border-b border-slate-50 space-y-2.5 bg-slate-50/50 animate-in slide-in-from-top-2 duration-200">
      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar tareas, contactos o propiedades..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400"
        />
      </div>

      {/* Filtros rápidos por Tipo */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
        {TIPOS_TAREA.map((tipo) => (
          <button
            key={tipo}
            onClick={() => toggleTipo(tipo)}
            className={`whitespace-nowrap px-2.5 py-1 rounded-md text-[10px] font-bold transition-all border cursor-pointer ${
              filterTipos.includes(tipo)
                ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tipo}
          </button>
        ))}
      </div>

      {/* Controles de Ordenamiento */}
      <div className="flex items-center justify-between gap-2 pt-0.5 relative" ref={sortRef}>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Organizar por:</span>
          
          <button
            onClick={() => setIsSortOpen(!isSortOpen)}
            className="flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-transparent hover:text-blue-600 transition-colors cursor-pointer"
          >
            {sortOptions.find(o => o.value === sortBy)?.label}
            <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Dropdown Custom */}
        {isSortOpen && (
          <div className="absolute top-6 left-16 w-36 bg-white border border-slate-200 shadow-xl rounded-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onSortByChange(opt.value);
                  setIsSortOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-[10px] font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between group cursor-pointer"
              >
                {opt.label}
                {sortBy === opt.value && <Check className="h-3 w-3 text-blue-600" />}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
          title={`Orden ${sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}`}
          className="h-6 w-6 bg-white border border-slate-200 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-sm active:scale-95"
        >
          {sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
};
