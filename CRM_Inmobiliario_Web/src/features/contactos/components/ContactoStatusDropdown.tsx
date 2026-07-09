import React, { useState } from 'react';
import { ChevronDown, Check, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ESTADOS, ESTADOS_PROPIETARIO } from '../constants/contactos';
import type { Contacto } from '../types';
import ConfirmModal from '../../../components/ConfirmModal';

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
  
  // Estados Locales para Modales (Intercepción SSoT)
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

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

    // INTERCEPCIÓN SSoT: Evaluamos la regla de negocio antes de mandar a la API
    if (isPropietario) {
      const actualStr = currentState?.toLowerCase() || '';
      const nuevoStr = nuevoEstado.toLowerCase();

      if (actualStr === 'inactivo' && nuevoStr === 'activo') {
        setPendingStatus(nuevoEstado);
        setShowReactivateModal(true);
        onToggle(null); // Cerramos el menú desplegable visualmente
        return; 
      }
      
      if (actualStr !== 'inactivo' && nuevoStr === 'inactivo') {
        setPendingStatus(nuevoEstado);
        setShowDeactivateModal(true);
        onToggle(null); // Cerramos el menú desplegable visualmente
        return; 
      }
    }

    onStatusChange(contacto.id, nuevoEstado, isPropietario ? 'propietario' : 'contacto');
    onToggle(null);
  };

  const executePendingStatusChange = () => {
    if (pendingStatus) {
      onStatusChange(contacto.id, pendingStatus, isPropietario ? 'propietario' : 'contacto');
    }
    setShowReactivateModal(false);
    setShowDeactivateModal(false);
    setPendingStatus(null);
  };

  const cancelPendingStatus = () => {
    setShowReactivateModal(false);
    setShowDeactivateModal(false);
    setPendingStatus(null);
  };

  // Base styles depending on variant
  const buttonClasses = variant === 'header'
    ? `px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-2 transition-all ${getEtapaStyles(currentState)}`
    : `inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${getEtapaStyles(currentState)}`;

  return (
    <>
      <div className="relative" ref={dropdownRef} onMouseDown={(e) => e.stopPropagation()}>
        <button
          onMouseDown={handleToggle}
          type="button"
          disabled={isUpdating}
          className={`${buttonClasses} cursor-pointer ${
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

      {/* Renderizamos los modales fuera del flow principal del dropdown para evitar z-index clipping */}
      <ConfirmModal
        isOpen={showReactivateModal}
        onClose={cancelPendingStatus}
        onConfirm={executePendingStatusChange}
        title="¿Reactivar Propietario?"
        description="Todas las propiedades actualmente inactivas de este propietario volverán a estar Disponibles en el catálogo."
        confirmText="Sí, reactivar"
        cancelText="Cancelar"
        type="info"
      />

      <ConfirmModal
        isOpen={showDeactivateModal}
        onClose={cancelPendingStatus}
        onConfirm={executePendingStatusChange}
        title="¿Desactivar Propietario?"
        description={
          <div className="flex flex-col gap-3 text-left">
            <p className="text-slate-600">
              Todas las propiedades de este contacto van a pasar a Inactivas. Asegúrate de que no tenga propiedades en operaciones activas (Reservada, Vendida, Alquilada) porque la acción será bloqueada por el sistema.
            </p>
            <div className="bg-red-50 text-red-600 p-3 rounded-md border border-red-200 text-sm flex flex-col gap-1 shadow-sm mt-1">
              <strong className="font-semibold flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Advertencia Crítica
              </strong>
              <span>
                A una propiedad inactiva se le borran todas sus fotos y su PDF generado. Deberás volver a pasar dicha propiedad a Disponible y generar el PDF para tenerlo nuevamente.
              </span>
            </div>
          </div> as unknown as string
        }
        confirmText="Sí, desactivar"
        cancelText="Cancelar"
        type="warning"
      />
    </>
  );
};