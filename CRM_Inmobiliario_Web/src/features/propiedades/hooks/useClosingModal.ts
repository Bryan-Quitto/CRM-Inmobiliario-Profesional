import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { buscarContactos } from '../../contactos/api/buscarContactos';
import { buscarPropiedades } from '../../propiedades/api/buscarPropiedades';
import { useAgentes } from '@/features/configuracion/hooks/useAgentes';
import { type SearchItem } from '@/components/DynamicSearchSelect';
import useSWR from 'swr';
import { getDropdownContactos, type DropdownContactoResponse } from '../../contactos/api/getDropdownContactos';
import { getPropiedades } from '../../propiedades/api/getPropiedades';
import type { Propiedad } from '../../propiedades/types';
import { swrDefaultConfig } from '@/lib/swr';

interface UseClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (precioCierre: number | null, partnerId: string, agenteCerradorId: string | undefined, finalStatus: string) => Promise<void>;
  mode: 'property' | 'contacto';
  initialData?: {
    id: string;
    titulo: string;
    precio: number;
    operacion: string;
    propietarioId?: string;
  };
  intendedState?: string;
}

export const useClosingModal = ({
  isOpen,
  onClose,
  onConfirm,
  mode,
  initialData,
  intendedState
}: UseClosingModalProps) => {
  const { data: contactos = [] } = useSWR<DropdownContactoResponse[]>(isOpen ? '/contactos/dropdown' : null, () => getDropdownContactos(), swrDefaultConfig);
  const { data: propiedades = [] } = useSWR<Propiedad[]>(isOpen ? '/propiedades' : null, getPropiedades, swrDefaultConfig);
  
  const [precioCierre, setPrecioCierre] = useState<string>(initialData?.precio.toString() || '');
  const [partnerId, setPartnerId] = useState<string | undefined>(mode === 'property' ? undefined : initialData?.id);
  const [selectedPartnerData, setSelectedPartnerData] = useState<{titulo: string, operacion: string} | null>(
    mode === 'property' && initialData ? { titulo: initialData.titulo, operacion: initialData.operacion } : null
  );
  
  const [isSharedTransaction, setIsSharedTransaction] = useState(false);
  const [agenteCerradorId, setAgenteCerradorId] = useState<string | undefined>();
  const { agentes } = useAgentes();
  
  const [tipoCierre, setTipoCierre] = useState<string>(() => {
    if (intendedState) return intendedState;
    if (mode === 'property' && initialData) {
      if (initialData.operacion === 'Reservada') return 'Reservada';
      return initialData.operacion === 'Venta' ? 'Vendida' : 'Alquilada';
    }
    return 'Vendida';
  });
  
  const [showTipoCierreDropdown, setShowTipoCierreDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Sincronización de estado cuando el modal se abre o cambian los datos iniciales
  // Usamos una técnica de "ajuste de estado durante el render" para evitar el efecto cascada
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      // Resetear estados al abrir con mapeo explícito
      if (intendedState) {
        setTipoCierre(intendedState);
      } else if (mode === 'property' && initialData) {
        setTipoCierre(initialData.operacion === 'Venta' ? 'Vendida' : 'Alquilada');
      } else {
        setTipoCierre('Vendida');
      }
      
      setPrecioCierre(initialData?.precio.toString() || '');
      setPartnerId(mode === 'property' ? undefined : initialData?.id);
      setIsSharedTransaction(false);
      setAgenteCerradorId(undefined);
      setIsSubmitting(false);
      setIsSuccess(false);
      
      if (mode === 'property' && initialData) {
        setSelectedPartnerData({ titulo: initialData.titulo, operacion: initialData.operacion });
      } else {
        setSelectedPartnerData(null);
      }
    }
  }

  const contactoOptions = useMemo(() => 
    contactos
      .filter(c => {
        const isOwner = mode === 'property' && initialData?.propietarioId === c.id;
        // Solo mostrar si NO es el dueño, es un prospecto comercial (esContacto) 
        // y NO está en estados terminales que impiden nuevas transacciones
        const isTerminal = ['Cerrado', 'Cerrado Ganado', 'Perdido', 'Cerrado Perdido'].includes(c.estadoEmbudo);
        return !isOwner && c.esContacto && !isTerminal;
      })
      .map(c => ({ id: c.id, title: [c.nombre, c.apellido].filter(Boolean).join(' '), subtitle: c.telefono })),
    [contactos, mode, initialData?.propietarioId]
  );

  const propiedadOptions = useMemo(() => 
    propiedades
      .filter(p => {
        const isOwner = mode === 'contacto' && p.propietarioId === initialData?.id;
        return p.estadoComercial === 'Disponible' && !isOwner;
      })
      .map(p => ({ 
        id: p.id, 
        title: p.titulo, 
        subtitle: `${p.sector}, ${p.ciudad}`,
        raw: p 
      })),
    [propiedades, mode, initialData?.id]
  );

  const agenteOptions = useMemo(() => 
    agentes.map(a => ({
      id: a.id,
      title: `${a.nombre} ${a.apellido}`.trim(),
      subtitle: a.email,
      raw: a
    })),
    [agentes]
  );

  const handleConfirm = async () => {
    const isReserva = tipoCierre === 'Reservada' || tipoCierre === 'En Negociación';
    
    if (!isReserva && (!precioCierre || isNaN(Number(precioCierre)))) {
      toast.error('Por favor, ingresa un precio de cierre válido.');
      return;
    }

    if (isReserva && precioCierre) {
      const p = Number(precioCierre);
      if (isNaN(p) || p <= 0) {
        toast.error('El monto de reserva debe ser mayor a 0, o déjalo vacío para Reserva de palabra.');
        return;
      }
    }
    if (!partnerId) {
      toast.error(`Por favor, selecciona ${mode === 'property' ? 'al contacto' : 'la propiedad'}.`);
      return;
    }

    if (isSharedTransaction && !agenteCerradorId) {
      toast.error('Por favor, selecciona al agente con quien compartes la transacción.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(precioCierre ? Number(precioCierre) : null, partnerId, isSharedTransaction ? agenteCerradorId : undefined, tipoCierre);
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (error) {
      console.error('Error al procesar el cierre:', error);
      toast.error('Hubo un error al procesar el cierre.');
      setIsSubmitting(false);
    }
  };

  const onSearchClients = async (query: string) => {
    const results = await buscarContactos(query);
    // 1. Filtrar al propietario actual
    // 2. Filtrar a quienes NO son prospectos (solo son propietarios)
    const filteredResults = results.filter(c => {
      const isOwner = mode === 'property' && initialData?.propietarioId === c.id;
      const isTerminal = ['Cerrado', 'Cerrado Ganado', 'Perdido', 'Cerrado Perdido'].includes(c.estadoEmbudo || '');
      return !isOwner && c.esContacto && !isTerminal;
    });

    return filteredResults.map(c => ({
      id: c.id,
      title: c.nombreCompleto,
      subtitle: c.telefono,
      raw: c
    }));
  };

  const onSearchProperties = async (query: string) => {
    const results = await buscarPropiedades(query);
    // Filtrar si el contacto ya es dueño de esa propiedad (No puede comprar lo que ya es suyo)
    const filteredResults = results.filter(p => {
      const isOwner = mode === 'contacto' && p.propietarioId === initialData?.id;
      return !isOwner;
    });

    return filteredResults.map(p => ({
      id: p.id,
      title: p.titulo,
      subtitle: `${p.sector}, ${p.ciudad}`,
      raw: p 
    }));
  };

  const onSearchAgentes = async (query: string) => {
    const q = query.toLowerCase();
    return agenteOptions.filter(a => 
      a.title.toLowerCase().includes(q) || 
      (a.subtitle && a.subtitle.toLowerCase().includes(q))
    );
  };

  const handlePropertySelect = (id: string | undefined, _title: string | undefined, item?: SearchItem) => {
    if (!id) return;
    setPartnerId(id);
    
    if (item && item.raw) {
      const p = item.raw as { titulo: string, operacion: string };
      setSelectedPartnerData({ titulo: p.titulo, operacion: p.operacion || 'Venta' });
      // Si el modal está en modo reserva, no cambiar a Vendida/Alquilada, a menos que sea un cierre.
      if (intendedState !== 'Reservada' && intendedState !== 'En Negociación') {
         setTipoCierre(p.operacion === 'Alquiler' ? 'Alquilada' : 'Vendida');
      }
    }
  };

  return {
    state: {
      precioCierre,
      partnerId,
      selectedPartnerData,
      tipoCierre,
      showTipoCierreDropdown,
      isSubmitting,
      isSuccess,
      contactoOptions,
      propiedadOptions,
      isSharedTransaction,
      agenteCerradorId,
      agenteOptions
    },
    actions: {
      setPrecioCierre,
      setPartnerId,
      setTipoCierre,
      setShowTipoCierreDropdown,
      handleConfirm,
      onSearchClients,
      onSearchProperties,
      onSearchAgentes,
      handlePropertySelect,
      setIsSharedTransaction,
      setAgenteCerradorId
    }
  };
};
