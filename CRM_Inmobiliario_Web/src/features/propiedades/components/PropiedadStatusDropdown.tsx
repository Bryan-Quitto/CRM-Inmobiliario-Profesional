import React from 'react';
import { ChevronDown, Check, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { ESTADOS } from '../constants/propiedades';
import type { Propiedad } from '../types';

interface PropiedadStatusDropdownProps {
  propiedad: Propiedad;
  isUpdating: boolean;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  onStatusChange: (id: string, nuevoEstado: string) => void;
  className?: string;
  variant?: 'card' | 'header';
  dropdownRef?: React.RefObject<HTMLDivElement | null>;
}

export const PropiedadStatusDropdown: React.FC<PropiedadStatusDropdownProps> = ({
  propiedad: p,
  isUpdating,
  isOpen,
  onToggle,
  onStatusChange,
  className = '',
  variant = 'card',
  dropdownRef
}) => {
  const getStatusStyles = (estado: string) => {
    const found = ESTADOS.find(e => e.value === estado);
    return found?.color || 'bg-slate-500 border-slate-400 text-white';
  };

  const canEdit = p.permissions?.canChangeStatus;

  // Usamos onMouseDown para interceptar el clic antes de que cualquier otra capa lo detenga
  const handlePriorityToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!canEdit) {
      // Priorizar el nombre de quien tiene la transacción activa, sino el captador
      const responsable = p.activeTransaction?.agenteNombre || p.agenteNombre || 'otro agente';
      toast.warning('Acción restringida', {
        description: `Esta propiedad está siendo gestionada por ${responsable}. Contacta con el agente para cambios.`
      });
      return;
    }
    
    onToggle(!isOpen);
  };

  const handleSelectStatus = (e: React.MouseEvent, nuevoEstado: string) => {
    e.preventDefault();
    e.stopPropagation();
    onStatusChange(p.id, nuevoEstado);
  };

  return (
    <div 
      className={`relative ${className}`} 
      ref={dropdownRef}
      onMouseDown={(e) => e.stopPropagation()} // Evitamos que el card detecte el clic
    >
      {isUpdating ? (
        <div className={`flex items-center gap-2 shadow-sm backdrop-blur-md border ${
          variant === 'header' 
            ? 'px-3 py-1.5 rounded-full bg-slate-100 border-slate-200' 
            : 'px-3 py-1 rounded-full bg-white/90 border-white/20'
        }`}>
          <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
          <span className={`text-[9px] font-black uppercase tracking-widest ${variant === 'header' ? 'text-slate-400' : 'text-slate-600'}`}>
            {variant === 'header' ? 'Guardando...' : 'SYNC...'}
          </span>
        </div>
      ) : (
        <>
          <button
            onMouseDown={handlePriorityToggle} // PRIORIDAD MÁXIMA
            type="button"
            className={`cursor-pointer font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm hover:scale-105 active:scale-95 disabled:opacity-50 ${
              variant === 'header' 
                ? 'px-3 py-1.5 rounded-full text-[10px]' 
                : 'px-3 py-1 rounded-full text-[10px] border'
            } ${getStatusStyles(p.estadoComercial)} ${!canEdit ? 'opacity-80' : ''}`}
          >
            {!canEdit && <Lock className="h-2.5 w-2.5" />}
            {p.estadoComercial}
            {canEdit && (
              <ChevronDown className={`transition-transform duration-300 ${variant === 'header' ? 'h-3.5 w-3.5' : 'h-3 w-3'} ${isOpen ? 'rotate-180' : ''}`} />
            )}
          </button>

          {isOpen && canEdit && (
            <div 
              className={`absolute mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[100] py-2 animate-in fade-in zoom-in duration-200 backdrop-blur-xl bg-white/95 ${
                variant === 'header' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'
              }`}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {ESTADOS.map((estado) => (
                <button
                  key={estado.value}
                  type="button"
                  onMouseDown={(e) => handleSelectStatus(e, estado.value)} // PRIORIDAD MÁXIMA
                  className={`cursor-pointer w-full px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide flex items-center justify-between transition-colors hover:bg-slate-50 ${
                    p.estadoComercial === estado.value 
                      ? (variant === 'header' ? 'text-indigo-600 bg-indigo-50/30' : 'text-blue-600 bg-blue-50/30') 
                      : 'text-slate-600'
                  }`}
                >
                  {estado.label}
                  {p.estadoComercial === estado.value && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
