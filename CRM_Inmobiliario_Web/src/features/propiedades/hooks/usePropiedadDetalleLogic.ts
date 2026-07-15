import { useState } from 'react';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';
import type { DropResult } from '@hello-pangea/dnd';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePerfil } from '@/features/auth/api/perfil';
import { usePropiedadDetalle } from './usePropiedadDetalle';
import { usePropiedadArchive } from './usePropiedadArchive';

interface UsePropiedadDetalleLogicProps {
  id: string;
  onCoverUpdated?: (newUrl: string) => void;
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('es-EC', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString));
};

export const usePropiedadDetalleLogic = ({ id, onCoverUpdated }: UsePropiedadDetalleLogicProps) => {
  const [activeTab, setActiveTab] = useState<'detalle' | 'galeria' | 'secciones' | 'historial' | 'ia'>('detalle');
  const { user } = useAuth();
  const { perfil } = usePerfil();
  const {
    propiedad,
    historial,
    syncing,
    isUpdatingStatus,
    isAddingSection,
    isCreatingInline,
    newSectionName,
    newSectionDesc,
    statusConfirmation,
    ownerReactivationConfirmation,
    isClosingModalOpen,
    closingState,
    isStatusDropdownOpen,
    showEditModal,
    isReordering,
    showReversionModal,
    setNewSectionName,
    setNewSectionDesc,
    setIsCreatingInline,
    setIsStatusDropdownOpen,
    setShowEditModal,
    setStatusConfirmation,
    setOwnerReactivationConfirmation,
    setIsClosingModalOpen,
    setClosingState,
    setShowReversionModal,
    handleClosingConfirm,
    handleSetCover,
    handleDeleteMedia,
    handleAddSection,
    handleConfirmAddSection,
    handleDeleteSection,
    handleRenameSection,
    handleClearGallery,
    handleReorder,
    handleMoveSection,
    handleInlineUpdateNote,
    handleStatusChange,
    handleRelist,
    handleCancelTransaction,
    mutate
  } = usePropiedadDetalle({ id, onCoverUpdated });

  const { mutate: globalMutate } = useSWRConfig();

  const { isTogglingArchive, handleToggleArchive } = usePropiedadArchive({
    propiedad: propiedad ?? undefined,
    mutate,
    globalMutate
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !propiedad?.secciones || isReordering) return;
    if (result.destination.index === result.source.index) return;

    const ids = propiedad.secciones.map(s => s.id);
    const [reorderedItem] = ids.splice(result.source.index, 1);
    ids.splice(result.destination.index, 0, reorderedItem);

    handleReorder(ids);
  };

  const buildShareMessage = () => {
    if (!propiedad) return '';
    const emojiMap: Record<string, string> = {
      'Casa': '\u{1F3E0}', 'Departamento': '\u{1F3E2}', 'Oficina': '\u{1F4BC}', 
      'Terreno': '\u{1F4D0}', 'Local Comercial': '\u{1F3EA}', 'Suite': '\u{2728}', 
      'Galpón': '\u{1F3ED}', 'Bodega': '\u{1F4E6}', 'Hotel': '\u{1F3E8}'
    };
    const emojiTipo = emojiMap[propiedad.tipoPropiedad] || '\u{1F3E0}';
    const e = { wave: '\u{1F44B}', sparkle: '\u{2728}', money: '\u{1F4B0}', pin: '\u{1F4CD}', clipboard: '\u{1F4CB}', bed: '\u{1F6CF}', bath: '\u{1F6C1}', ruler: '\u{1F4CF}', smile: '\u{1F60A}', star: '\u{2B50}', check: '\u{2705}' };
    
    let message = '';
    const headerInfo = `*${propiedad.titulo.toUpperCase()}* ${emojiTipo}${e.sparkle}\n\n${e.money} *Precio:* ${formatCurrency(propiedad.precio)}\n${e.pin} *Zona:* ${propiedad.sector}, ${propiedad.ciudad}\n${e.clipboard} *Operación:* ${propiedad.operacion}\n\n`;

    if (['Casa', 'Departamento', 'Suite', 'Hotel'].includes(propiedad.tipoPropiedad)) {
      message = `¡Hola! ${e.wave} El espacio perfecto para ti te está esperando:\n\n` + headerInfo;
      message += `${e.star} *Distribución:*\n`;
      message += `${e.check} ${propiedad.habitaciones} Habitaciones\n`;
      message += `${e.check} ${propiedad.banos} Baños\n`;
      if (propiedad.estacionamientos && propiedad.estacionamientos > 0) message += `${e.check} ${propiedad.estacionamientos} Parqueos\n`;
      message += `${e.check} ${propiedad.areaTotal} m² Área Total\n`;
    } else if (propiedad.tipoPropiedad === 'Terreno') {
      message = `¡Hola! ${e.wave} Ideal para tu próximo gran proyecto:\n\n` + headerInfo;
      message += `${e.star} *Características:*\n`;
      message += `${e.check} ${propiedad.areaTotal} m² Área Total\n`;
    } else {
      message = `¡Hola! ${e.wave} Excelente ubicación estratégica para tu negocio:\n\n` + headerInfo;
      message += `${e.star} *Distribución:*\n`;
      if (propiedad.banos > 0) message += `${e.check} ${propiedad.banos} Baños\n`;
      if (propiedad.estacionamientos && propiedad.estacionamientos > 0) message += `${e.check} ${propiedad.estacionamientos} Parqueos\n`;
      message += `${e.check} ${propiedad.areaTotal} m² Área Total\n`;
    }

    if (propiedad.urlRemax) message += `\n🔗 Ver más detalles aquí:\n${propiedad.urlRemax}\n`;
    message += `\n¿Te gustaría agendar una visita? ${e.smile}`;
    
    return message;
  };

  const handleWhatsAppShare = () => {
    const message = buildShareMessage();
    if (!message) return;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  const handleCopyWhatsAppAdLink = async () => {
    if (!propiedad) return;
    
    const originalPhone = perfil?.telefono?.trim() || '';
    if (!originalPhone) {
      toast.warning('Debes configurar tu teléfono en tu perfil para generar este enlace');
      return;
    }

    let formattedPhone = originalPhone.replace(/\D/g, '');
    
    // Si el usuario incluyó explícitamente un +, respetamos su código de país internacional
    if (!originalPhone.startsWith('+')) {
      // Si empieza con 0, asumimos formato local de Ecuador y lo reemplazamos por 593
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '593' + formattedPhone.slice(1);
      } 
      // Si no empieza con 593 ni con 0, asumimos que omitió el código y le ponemos el de Ecuador por defecto
      else if (!formattedPhone.startsWith('593')) {
        formattedPhone = '593' + formattedPhone;
      }
    }

    const message = `Hola, estoy interesado en la propiedad *${propiedad.titulo}* que publicó, me podría ayudar con más información por favor`;
    const link = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Enlace de WhatsApp para anuncios copiado');
    } catch {
      toast.error('No se pudo copiar al portapapeles');
    }
  };

  const handleMessengerShare = async () => {
    const message = buildShareMessage();
    if (!message) return;
    try {
      await navigator.clipboard.writeText(message);
      toast.success('Mensaje copiado. Pégalo en Messenger');
      window.open('https://www.messenger.com/new', '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('No se pudo copiar al portapapeles');
    }
  };

  return {
    activeTab, setActiveTab, user,
    propiedad, historial, syncing, isUpdatingStatus, isAddingSection, isCreatingInline,
    newSectionName, newSectionDesc, statusConfirmation, ownerReactivationConfirmation, isClosingModalOpen, closingState, isStatusDropdownOpen,
    showEditModal, isReordering, showReversionModal, setNewSectionName, setNewSectionDesc, setIsCreatingInline,
    setIsStatusDropdownOpen, setShowEditModal, setStatusConfirmation, setOwnerReactivationConfirmation, setIsClosingModalOpen,
    setClosingState, setShowReversionModal, handleClosingConfirm, handleSetCover,
    handleDeleteMedia, handleAddSection, handleConfirmAddSection, handleDeleteSection,
    handleRenameSection, handleClearGallery, handleReorder, handleMoveSection,
    handleInlineUpdateNote, handleStatusChange, handleRelist, handleCancelTransaction,
    mutate,
    isTogglingArchive, handleToggleArchive,
    handleDragEnd, handleWhatsAppShare, handleMessengerShare, handleCopyWhatsAppAdLink
  };
};

export type PropiedadDetalleLogic = ReturnType<typeof usePropiedadDetalleLogic>;
