import { useState } from 'react';
import { useSWRConfig } from 'swr';
import type { DropResult } from '@hello-pangea/dnd';
import { useAuth } from '@/features/auth/hooks/useAuth';
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
  const [activeTab, setActiveTab] = useState<'detalle' | 'ia'>('detalle');
  const { user } = useAuth();
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

  const handleWhatsAppShare = () => {
    if (!propiedad) return;
    const emojiMap: Record<string, string> = {
      'Casa': '\u{1F3E0}', 'Departamento': '\u{1F3E2}', 'Oficina': '\u{1F4BC}', 
      'Terreno': '\u{1F4D0}', 'Local Comercial': '\u{1F3EA}', 'Suite': '\u{2728}', 
      'Galpón': '\u{1F3ED}', 'Bodega': '\u{1F4E6}', 'Hotel': '\u{1F3E8}'
    };
    const emojiTipo = emojiMap[propiedad.tipoPropiedad] || '\u{1F3E0}';
    const e = { wave: '\u{1F44B}', sparkle: '\u{2728}', money: '\u{1F4B0}', pin: '\u{1F4CD}', clipboard: '\u{1F4CB}', bed: '\u{1F6CF}', bath: '\u{1F6C1}', ruler: '\u{1F4CF}', smile: '\u{1F60A}' };
    let message = `¡Hola! ${e.wave} Mira esta increíble propiedad:\n\n*${propiedad.titulo.toUpperCase()}* ${emojiTipo}${e.sparkle}\n\n${e.money} *Precio:* ${formatCurrency(propiedad.precio)}\n${e.pin} *Ubicación:* ${propiedad.sector}, ${propiedad.ciudad}\n${e.clipboard} *Operación:* ${propiedad.operacion}\n`;
    if (['Casa', 'Departamento', 'Suite', 'Hotel'].includes(propiedad.tipoPropiedad)) { message += `${e.bed} *Habitaciones:* ${propiedad.habitaciones}\n${e.bath} *Baños:* ${propiedad.banos}\n`; }
    message += `${e.ruler} *Área Total:* ${propiedad.areaTotal} m²\n`;
    if (propiedad.urlRemax) message += `\nVer más: ${propiedad.urlRemax}\n`;
    message += `\n¿Te gustaría visitarla? ${e.smile}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  return {
    activeTab, setActiveTab, user,
    propiedad, historial, syncing, isUpdatingStatus, isAddingSection, isCreatingInline,
    newSectionName, newSectionDesc, statusConfirmation, isClosingModalOpen, closingState, isStatusDropdownOpen,
    showEditModal, isReordering, showReversionModal, setNewSectionName, setNewSectionDesc, setIsCreatingInline,
    setIsStatusDropdownOpen, setShowEditModal, setStatusConfirmation, setIsClosingModalOpen,
    setClosingState, setShowReversionModal, handleClosingConfirm, handleSetCover,
    handleDeleteMedia, handleAddSection, handleConfirmAddSection, handleDeleteSection,
    handleRenameSection, handleClearGallery, handleReorder, handleMoveSection,
    handleInlineUpdateNote, handleStatusChange, handleRelist, handleCancelTransaction,
    mutate,
    isTogglingArchive, handleToggleArchive,
    handleDragEnd, handleWhatsAppShare
  };
};

export type PropiedadDetalleLogic = ReturnType<typeof usePropiedadDetalleLogic>;
