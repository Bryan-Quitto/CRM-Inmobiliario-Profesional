import React from 'react';
import { ChevronDown, Check, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ESTADOS, ESTADOS_PROPIETARIO } from '../constants/contactos';
import type { Contacto } from '../types';

interface ContactoStatusDropdownProps {
  contacto: Contacto;
  tipo: 'cliente' | 'propietario';
  isOpen: boolean;
  isUpdating: boolean;
  onToggle: (tipo: 'cliente' | 'propietario' | null) => void;
  onStatusChange: (id: string, etapa: string, tipo: 'contacto' | 'propietario') => void;
  variant?: 'card' | 'header';
  dropdownRef?: React.RefObject<HTMLDivElement | null>;
}

export const ContactoStatusDropdown: React.FC<ContactoStatusDropdownProps> = ({
  contacto,
  tipo,
  isOpen,
  isUpdating,
  onToggle,
  onStatusChange,
  variant = 'card',
  dropdownRef
}) => {
  const isPropietario = tipo === 'propietario';
  const currentState = isPropietario ? contacto.estadoPropietario : contacto.estadoEmbudo;
  const list = isPropietario ? ESTADOS_PROPIETARIO : ESTADOS;
  
  // Filter specific stages
  const displayList = isPropietario 
    ? list.filter(e => e.value !== 'Cerrado')
    : list.filter(e => e.value !== 'En Negociación' && e.value !== 'Cerrado' && e.value !== 'Cerrado Ganado' && e.value !== 'Cerrado Perdido');

  const getEtapaStyles = (etapa: string) => {
    const found = list.find((e: { value: string; color?: string }) => e.value === etapa);
    return found?.color || 'bg-gray-50 text-gray-600 border-gray-100';
  };

  const isBlocked = contacto.esCompartido || contacto.isArchivedForCurrentUser;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isBlocked) {
      if (contacto.isArchivedForCurrentUser) {
        toast.warning('Acción restringida', {
          description: 'No puedes modificar el estado de un registro archivado.'
        });
      } else if (contacto.esCompartido) {
        toast.warning('Acción restringida', {
          description: `El registro es compartido. Pertenece al agente: ${contacto.nombreAgenteDueno}`
        });
      }
      return;
    }

    onToggle(isOpen ? null : tipo);
  };

  const handleSelectStatus = (e: React.MouseEvent, nuevoEstado: string) => {
    e.preventDefault();
    e.stopPropagation();
    onStatusChange(contacto.id, nuevoEstado, isPropietario ? 'propietario' : 'contacto');
  };

  // Base styles depending on variant
  const buttonClasses = variant === 'header'
    ? `px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-2 transition-all ${getEtapaStyles(currentState)}`
    : `inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${getEtapaStyles(currentState)}`;

  return (
    <div className="relative" ref={dropdownRef} onMouseDown={(e) => e.stopPropagation()}>
      <button
        onMouseDown={handleToggle}
        type="button"
        disabled={isUpdating}
        className={`${buttonClasses} ${
          isBlocked 
            ? 'cursor-not-allowed opacity-70 bg-slate-50 text-slate-400 border-slate-100' 
            : 'cursor-pointer hover:shadow-sm hover:scale-105 active:scale-95'
        }`}
      >
        {isUpdating && isOpen ? <Loader2 className="h-3 w-3 animate-spin" /> : currentState}
        {contacto.esCompartido ? (
          <Lock className={variant === 'header' ? 'h-3 w-3' : 'h-2.5 w-2.5'} />
        ) : (
          !contacto.isArchivedForCurrentUser && (
            <ChevronDown className={`transition-transform ${variant === 'header' ? 'h-3 w-3' : 'h-2.5 w-2.5'} ${isOpen ? 'rotate-180' : ''}`} />
          )
        )}
      </button>

      {isOpen && !isBlocked && (
        <div 
          className={`absolute mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] py-2 animate-in fade-in zoom-in duration-200 backdrop-blur-xl bg-white/95 ${
            variant === 'header' ? 'left-0 origin-top-left' : 'left-0 origin-top-left'
          }`}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {displayList.map((etapa) => (
            <button
              key={etapa.value}
              type="button"
              onMouseDown={(e) => handleSelectStatus(e, etapa.value)}
              className={`cursor-pointer w-full px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide flex items-center justify-between transition-colors hover:bg-slate-50 ${
                currentState === etapa.value 
                  ? (isPropietario ? 'text-emerald-600 bg-emerald-50/30' : 'text-blue-600 bg-blue-50/30') 
                  : 'text-slate-600'
              }`}
            >
              {etapa.label}
              {currentState === etapa.value && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
