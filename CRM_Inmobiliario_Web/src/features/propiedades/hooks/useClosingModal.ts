import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { buscarClientes } from '../../clientes/api/buscarClientes';
import { buscarPropiedades } from '../../propiedades/api/buscarPropiedades';
import { useTareas } from '../../tareas/context/useTareas';
import { type SearchItem } from '@/components/DynamicSearchSelect';

interface UseClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (precioCierre: number, partnerId: string, finalStatus: string) => Promise<void>;
  mode: 'property' | 'lead';
  initialData?: {
    id: string;
    titulo: string;
    precio: number;
    operacion: string;
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
  const { clientes, propiedades } = useTareas();
  
  const [precioCierre, setPrecioCierre] = useState<string>(initialData?.precio.toString() || '');
  const [partnerId, setPartnerId] = useState<string | undefined>(mode === 'property' ? undefined : initialData?.id);
  const [selectedPartnerData, setSelectedPartnerData] = useState<{titulo: string, operacion: string} | null>(
    mode === 'property' && initialData ? { titulo: initialData.titulo, operacion: initialData.operacion } : null
  );
  
  const [tipoCierre, setTipoCierre] = useState<string>(() => {
    if (intendedState) return intendedState;
    if (mode === 'property' && initialData) {
      return initialData.operacion === 'Alquiler' ? 'Alquilada' : 'Vendida';
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
      // Resetear estados al abrir
      if (intendedState) {
        setTipoCierre(intendedState);
      } else if (mode === 'property' && initialData) {
        setTipoCierre(initialData.operacion === 'Alquiler' ? 'Alquilada' : 'Vendida');
      } else {
        setTipoCierre('Vendida');
      }
      
      setPrecioCierre(initialData?.precio.toString() || '');
      setPartnerId(mode === 'property' ? undefined : initialData?.id);
      setIsSubmitting(false);
      setIsSuccess(false);
      
      if (mode === 'property' && initialData) {
        setSelectedPartnerData({ titulo: initialData.titulo, operacion: initialData.operacion });
      } else {
        setSelectedPartnerData(null);
      }
    }
  }

  const clienteOptions = useMemo(() => 
    clientes.map(c => ({ id: c.id, title: [c.nombre, c.apellido].filter(Boolean).join(' '), subtitle: c.telefono })),
    [clientes]
  );

  const propiedadOptions = useMemo(() => 
    propiedades
      .filter(p => p.estadoComercial === 'Disponible')
      .map(p => ({ 
        id: p.id, 
        title: p.titulo, 
        subtitle: `${p.sector}, ${p.ciudad}`,
        raw: p 
      })),
    [propiedades]
  );

  const handleConfirm = async () => {
    if (!precioCierre || isNaN(Number(precioCierre))) {
      toast.error('Por favor, ingresa un precio válido.');
      return;
    }
    if (!partnerId) {
      toast.error(`Por favor, selecciona ${mode === 'property' ? 'al cliente' : 'la propiedad'}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(Number(precioCierre), partnerId, tipoCierre);
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
    const results = await buscarClientes(query);
    return results.map(c => ({
      id: c.id,
      title: c.nombreCompleto,
      subtitle: c.telefono,
      raw: c
    }));
  };

  const onSearchProperties = async (query: string) => {
    const results = await buscarPropiedades(query);
    return results.map(p => ({
      id: p.id,
      title: p.titulo,
      subtitle: `${p.sector}, ${p.ciudad}`,
      raw: p 
    }));
  };

  const handlePropertySelect = (id: string | undefined, _title: string | undefined, item?: SearchItem) => {
    if (!id) return;
    setPartnerId(id);
    
    if (item && item.raw) {
      const p = item.raw as { titulo: string, operacion: string };
      setSelectedPartnerData({ titulo: p.titulo, operacion: p.operacion || 'Venta' });
      setTipoCierre(p.operacion === 'Alquiler' ? 'Alquilada' : 'Vendida');
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
      clienteOptions,
      propiedadOptions
    },
    actions: {
      setPrecioCierre,
      setPartnerId,
      setTipoCierre,
      setShowTipoCierreDropdown,
      handleConfirm,
      onSearchClients,
      onSearchProperties,
      handlePropertySelect
    }
  };
};
