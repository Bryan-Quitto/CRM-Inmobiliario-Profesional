import { useState, useEffect } from 'react';
import useSWR, { SWRConfig } from 'swr';
import {
  X,
  Bed,
  Bath,
  Maximize,
  MapPin,
  Loader2,
  Clock,
  Pencil,
  ChevronDown,
  Check,
  AlertCircle,
  Handshake,
  Car,
  CalendarDays,
  History,
  RotateCcw,
  TrendingUp,
  Trash2,
  MoreVertical,
  Plus,
  MessageSquare,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { getPropiedadById } from '../api/getPropiedadById';
import { CrearPropiedadForm } from './CrearPropiedadForm';
import { actualizarEstadoPropiedad } from '../api/actualizarEstadoPropiedad';
import { relistPropiedad } from '../api/relistPropiedad';
import { getHistorialPropiedad, type PropertyTransactionResponse } from '../api/getHistorialPropiedad';
import { updateTransaction } from '../api/updateTransaction';
import { deleteTransaction } from '../api/deleteTransaction';
import { limpiarImagenesPropiedad } from '../api/limpiarImagenesPropiedad';
import { establecerImagenPrincipal } from '../api/establecerImagenPrincipal';
import { deleteImagenPropiedad } from '../api/deleteImagenPropiedad';
import { deleteImagenesSeleccionadas } from '../api/deleteImagenesSeleccionadas';
import { crearSeccion } from '../api/crearSeccion';
import { eliminarSeccion } from '../api/eliminarSeccion';
import { actualizarSeccion } from '../api/actualizarSeccion';
import { reordenarSecciones } from '../api/reordenarSecciones';
import { ClosingModal } from './ClosingModal';
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd';
import { localStorageProvider, swrDefaultConfig } from '@/lib/swr';
import { SectionalGallery } from './SectionalGallery';
import PDFLinkInternal from './PDFLinkInternal';

import type { Propiedad, SeccionGaleria } from '../types';

interface PropiedadDetalleProps {
  id: string;
  onClose: () => void;
  onCoverUpdated?: (newUrl: string) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('es-EC', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(dateString));
};

const getMapEmbedUrl = (url: string, direccionFisica: string) => {
  if (!url) return '';

  // 1. Si ya tiene el formato embed, lo retornamos directo
  if (url.includes('/embed') || url.includes('output=embed')) {
    return url;
  }

  // 2. Si es un enlace acortado (maps.app.goo.gl), 
  // usamos la dirección física para una búsqueda más fiable en el iframe.
  if (url.includes('maps.app.goo.gl')) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(direccionFisica)}&hl=es&z=16&output=embed`;
  }

  // 3. Extraer coordenadas exactas (@lat,lng) de la URL estándar de navegador
  const matchCoordenadas = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (matchCoordenadas) {
    const lat = matchCoordenadas[1];
    const lng = matchCoordenadas[2];
    // Usamos q=lat,lng para forzar el pin rojo
    return `https://maps.google.com/maps?q=${lat},${lng}&hl=es&z=17&output=embed`;
  }

  // 4. Intentar extraer parámetro de búsqueda q= si existe
  try {
    const urlObj = new URL(url);
    const query = urlObj.searchParams.get('q') || urlObj.searchParams.get('query');
    if (query) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=es&z=17&output=embed`;
    }
  } catch { /* Ignorar */ }

  // 5. Fallback final: Búsqueda por texto (Dirección + Ciudad)
  return `https://maps.google.com/maps?q=${encodeURIComponent(direccionFisica)}&hl=es&z=16&output=embed`;
};

const ESTADOS = [
  { label: 'Disponible', value: 'Disponible', color: 'bg-emerald-500 border-emerald-400 text-white hover:bg-emerald-600' },
  { label: 'Reservada', value: 'Reservada', color: 'bg-amber-500 border-amber-400 text-white hover:bg-amber-600' },
  { label: 'Vendida', value: 'Vendida', color: 'bg-slate-700 border-slate-600 text-white hover:bg-slate-800' },
  { label: 'Alquilada', value: 'Alquilada', color: 'bg-blue-600 border-blue-500 text-white hover:bg-blue-700' },
  { label: 'Inactiva', value: 'Inactiva', color: 'bg-rose-500 border-rose-400 text-white hover:bg-rose-600' },
];

const PropiedadDetalleContent = ({ id, onClose, onCoverUpdated }: PropiedadDetalleProps) => {
  const { data: propiedad, isValidating: syncing, mutate } = useSWR<Propiedad>(
    id ? `/propiedades/${id}` : null,
    () => getPropiedadById(id),
    swrDefaultConfig
  );

  const { data: historial, mutate: mutateHistorial } = useSWR(
    id ? `/propiedades/${id}/history` : null,
    () => getHistorialPropiedad(id),
    swrDefaultConfig
  );

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [statusConfirmation, setStatusConfirmation] = useState<string | null>(null);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [closingState, setClosingState] = useState<string | undefined>(undefined);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [transactionMenuOpen, setTransactionMenuOpen] = useState<string | null>(null);

  const handleClosingConfirm = async (precioCierre: number, cerradoConId: string) => {
    if (!propiedad) return;
    try {
      setIsUpdatingStatus(true);
      await actualizarEstadoPropiedad(propiedad.id, propiedad.operacion === 'Alquiler' ? 'Alquilada' : 'Vendida', precioCierre, cerradoConId);

      // Si es Venta, también limpiamos la galería
      if (propiedad.operacion !== 'Alquiler') {
        await limpiarImagenesPropiedad(propiedad.id);
      }

      await mutate();
      toast.success(`Propiedad ${propiedad.operacion === 'Alquiler' ? 'alquilada' : 'vendida'} con éxito`);
      setIsClosingModalOpen(false);
    } catch (error) {
      console.error('Error al cerrar:', error);
      throw error;
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSetCover = async (imagenId: string) => {
    if (!propiedad) return;
    try {
      await establecerImagenPrincipal(propiedad.id, imagenId);
      mutate();
      if (onCoverUpdated) {
        const principal = propiedad.mediaSinSeccion?.find(m => m.id === imagenId) ||
          propiedad.secciones?.flatMap(s => s.media).find(m => m.id === imagenId);
        if (principal) onCoverUpdated(principal.urlPublica);
      }
      toast.success('Imagen de portada actualizada');
    } catch {
      toast.error('Error al actualizar portada');
    }
  };

  const handleDeleteMedia = async (ids: string | string[]) => {
    if (!propiedad) return;
    const idsArray = Array.isArray(ids) ? ids : [ids];

    // Pattern Undo
    let isCancelled = false;
    const commitDelete = async () => {
      if (isCancelled) return;
      try {
        if (idsArray.length === 1) {
          await deleteImagenPropiedad(propiedad.id, idsArray[0]);
        } else {
          await deleteImagenesSeleccionadas(propiedad.id, idsArray);
        }
        mutate();
      } catch {
        toast.error("Error al eliminar del servidor");
      }
    };

    toast.warning(`${idsArray.length > 1 ? 'Imágenes eliminadas' : 'Imagen eliminada'}`, {
      description: "Tienes unos segundos para deshacer.",
      action: {
        label: "Deshacer",
        onClick: () => {
          isCancelled = true;
          mutate();
          toast.success("Eliminación cancelada");
        }
      },
      duration: 5000,
      onAutoClose: commitDelete,
      onDismiss: commitDelete
    });

    // Optimistic UI
    mutate((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        mediaSinSeccion: prev.mediaSinSeccion?.filter(m => !idsArray.includes(m.id)),
        secciones: prev.secciones?.map(s => ({
          ...s,
          media: s.media.filter(m => !idsArray.includes(m.id))
        }))
      };
    }, false);
  };

  const handleAddSection = () => {
    setIsCreatingInline(true);
    setNewSectionName('');
  };

  const handleConfirmAddSection = async () => {
    if (!newSectionName.trim() || !propiedad) {
      setIsCreatingInline(false);
      return;
    }

    const nombreNuevaSeccion = newSectionName.trim();
    const orden = (propiedad.secciones?.length || 0) + 1;

    // Guardar estado previo para revertir si falla
    const previousSecciones = [...(propiedad.secciones || [])];

    // Nueva sección temporal para UI Optimista con clientId estable
    const tempId = `temp-${Date.now()}`;
    const nuevaSeccionTemp: SeccionGaleria & { clientId?: string } = {
      id: tempId,
      clientId: tempId,
      nombre: nombreNuevaSeccion,
      orden: orden,
      media: []
    };

    setIsCreatingInline(false);
    setNewSectionName('');

    // Actualización Optimista
    mutate((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        secciones: [...(prev.secciones || []), nuevaSeccionTemp]
      };
    }, false);

    try {
      setIsAddingSection(true);
      const nuevaSeccionReal = await crearSeccion(id, nombreNuevaSeccion, orden);

      // Actualizamos el cache con la sección real pero manteniendo el clientId para la key
      mutate((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          secciones: prev.secciones?.map(s =>
            s.id === tempId ? { ...nuevaSeccionReal, clientId: tempId } : s
          )
        };
      }, false);

      toast.success("Sección creada");
    } catch {
      toast.error("Error al crear sección");
      // Revertir a estado anterior
      mutate((prev) => prev ? { ...prev, secciones: previousSecciones } : prev, false);
    } finally {
      setIsAddingSection(false);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!propiedad) return;

    // Optimistic UI: Guardar estado previo por si falla
    const previousSecciones = [...(propiedad.secciones || [])];

    // Pattern Undo
    let isCancelled = false;
    const commitDelete = async () => {
      if (isCancelled) return;
      try {
        await eliminarSeccion(sectionId);
        mutate();
      } catch {
        toast.error("Error al eliminar sección del servidor");
        // Revertir UI
        mutate((prev) => prev ? { ...prev, secciones: previousSecciones } : prev, false);
      }
    };

    toast.warning("Sección eliminada", {
      description: "Tienes unos segundos para deshacer.",
      action: {
        label: "Deshacer",
        onClick: () => {
          isCancelled = true;
          mutate(); // Forzar re-fetching o restaurar localmente
          toast.success("Eliminación cancelada");
        }
      },
      duration: 5000,
      onAutoClose: commitDelete,
      onDismiss: commitDelete
    });

    // Actualización Optimista UI
    mutate((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        secciones: prev.secciones?.filter(s => s.id !== sectionId)
      };
    }, false);
  };

  const handleRenameSection = async (sectionId: string, nombre: string, descripcion: string | null, orden: number) => {
    try {
      await actualizarSeccion(sectionId, nombre, descripcion, orden);
      mutate();
    } catch {
      toast.error("Error al actualizar sección");
    }
  };

  const handleClearGallery = async () => {
    if (!propiedad) return;

    // Optimistic UI: Guardar estado previo
    const previousState = {
      mediaSinSeccion: [...(propiedad.mediaSinSeccion || [])],
      secciones: [...(propiedad.secciones || [])]
    };

    // Pattern Undo
    let isCancelled = false;
    const commitClear = async () => {
      if (isCancelled) return;
      try {
        await limpiarImagenesPropiedad(id);
        mutate();
      } catch {
        toast.error("Error al limpiar la galería en el servidor");
        mutate((prev) => prev ? { ...prev, ...previousState } : prev, false);
      }
    };

    toast.warning("Galería depurada", {
      description: "Se han eliminado todas las fotos excepto la de portada. Tienes unos segundos para deshacer.",
      action: {
        label: "Deshacer",
        onClick: () => {
          isCancelled = true;
          mutate();
          toast.success("Limpieza cancelada");
        }
      },
      duration: 6000,
      onAutoClose: commitClear,
      onDismiss: commitClear
    });

    // Actualización Optimista UI
    mutate((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        mediaSinSeccion: prev.mediaSinSeccion?.filter(m => m.urlPublica === prev.imagenPortadaUrl) || [],
        secciones: [] // Al limpiar galería se eliminan todas las secciones según lógica de negocio
      };
    }, false);
  };

  const handleReorder = async (nuevoOrdenIds: string[]) => {
    if (!propiedad || isReordering) return;

    setIsReordering(true);
    const toastId = toast.loading("Guardando nuevo orden...");

    // Optimistic UI
    const seccionesOriginales = [...(propiedad.secciones || [])];
    mutate((prev) => {
      if (!prev || !prev.secciones) return prev;
      const nuevasSecciones = nuevoOrdenIds
        .map(id => prev.secciones!.find(s => s.id === id))
        .filter(Boolean) as SeccionGaleria[];
      return { ...prev, secciones: nuevasSecciones };
    }, false);

    try {
      await reordenarSecciones(propiedad.id, nuevoOrdenIds);
      toast.success("Orden actualizado", { id: toastId });
    } catch {
      toast.error("Error al guardar el nuevo orden", { id: toastId });
      mutate((prev) => prev ? { ...prev, secciones: seccionesOriginales } : prev, false);
    } finally {
      setIsReordering(false);
    }
  };

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

    // Usamos secuencias de escape Unicode para evitar problemas de codificación (UTF-8/ISO mismatch)
    const emojiMap: Record<string, string> = {
      'Casa': '\u{1F3E0}',            // 🏠
      'Departamento': '\u{1F3E2}',    // 🏢
      'Oficina': '\u{1F4BC}',         // 💼
      'Terreno': '\u{1F4D0}',         // 📐
      'Local Comercial': '\u{1F3EA}', // 🏪
      'Suite': '\u{2728}',            // ✨
      'Galpón': '\u{1F3ED}',          // 🏭
      'Bodega': '\u{1F4E6}',          // 📦
      'Hotel': '\u{1F3E8}'            // 🏨
    };

    const emojiTipo = emojiMap[propiedad.tipoPropiedad] || '\u{1F3E0}';

    // Emojis auxiliares
    const e = {
      wave: '\u{1F44B}',     // 👋
      sparkle: '\u{2728}',   // ✨
      money: '\u{1F4B0}',    // 💰
      pin: '\u{1F4CD}',      // 📍
      clipboard: '\u{1F4CB}',// 📋
      bed: '\u{1F6CF}',      // 🛌
      bath: '\u{1F6C1}',     // 🛀
      ruler: '\u{1F4CF}',    // 📏
      smile: '\u{1F60A}'     // 😊
    };

    let message = `¡Hola! ${e.wave} Mira esta increíble propiedad que te puede interesar:\n\n`;
    message += `*${propiedad.titulo.toUpperCase()}* ${emojiTipo}${e.sparkle}\n\n`;

    message += `${e.money} *Precio:* ${formatCurrency(propiedad.precio)}\n`;
    message += `${e.pin} *Ubicación:* ${propiedad.sector}, ${propiedad.ciudad}\n`;
    message += `${e.clipboard} *Operación:* ${propiedad.operacion}\n`;

    if (['Casa', 'Departamento', 'Suite', 'Hotel'].includes(propiedad.tipoPropiedad)) {
      message += `${e.bed} *Habitaciones:* ${propiedad.habitaciones}\n`;
      message += `${e.bath} *Baños:* ${propiedad.banos}\n`;
    } else if (['Oficina', 'Local Comercial', 'Galpón', 'Bodega'].includes(propiedad.tipoPropiedad)) {
      if (propiedad.banos > 0) message += `${e.bath} *Baños:* ${propiedad.banos}\n`;
    }
    if (propiedad.mediosBanos && propiedad.mediosBanos > 0) {
      message += `${e.bath} *Medios Baños:* ${propiedad.mediosBanos}\n`;
    }

    if (propiedad.estacionamientos && propiedad.estacionamientos > 0) message += `🚗 *Parqueaderos:* ${propiedad.estacionamientos}\n`;
    if (propiedad.aniosAntiguedad !== undefined && propiedad.aniosAntiguedad >= 0) message += `📅 *Antigüedad:* ${propiedad.aniosAntiguedad} años\n`;

    message += `${e.ruler} *Área Total:* ${propiedad.areaTotal} m²\n`;
    if (propiedad.areaConstruccion && propiedad.areaConstruccion > 0) message += `🏗️ *Área Construcción:* ${propiedad.areaConstruccion} m²\n`;
    if (propiedad.areaTerreno && propiedad.areaTerreno > 0) message += `📐 *Área Terreno:* ${propiedad.areaTerreno} m²\n`;

    if (propiedad.tipoPropiedad === 'Terreno') {
      message += `${emojiTipo} Ideal para construir el proyecto de tus sueños.\n`;
    }

    if (propiedad.urlRemax) {
      message += `\nPuedes ver la propiedad en este enlace:\n${propiedad.urlRemax}\n\n¿Te gustaría agendar una visita? ${e.smile}`;
    } else {
      message += `\n¿Te gustaría agendar una visita? ${e.smile}`;
    }

    // Usamos api.whatsapp.com que suele ser más estable para mensajes largos
    const text = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${text}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down', customTargetIndex?: number) => {
    if (!propiedad?.secciones || isReordering) return;

    const newIndex = customTargetIndex !== undefined ? customTargetIndex : (direction === 'up' ? index - 1 : index + 1);

    if (newIndex < 0 || newIndex >= propiedad.secciones.length || newIndex === index) return;

    const ids = propiedad.secciones.map(s => s.id);
    const [item] = ids.splice(index, 1);
    ids.splice(newIndex, 0, item);

    handleReorder(ids);
  };

  const [showReversionModal, setShowReversionModal] = useState<{ type: 'transaction' | 'status', id?: string, targetStatus?: string } | null>(null);

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!historial) return;

    const transaction = historial.find(t => t.id === transactionId);

    // Si es una transacción de cierre, pedir confirmación especial
    if (transaction && (transaction.transactionType === 'Sale' || transaction.transactionType === 'Rent')) {
      setShowReversionModal({ type: 'transaction', id: transactionId });
      setTransactionMenuOpen(null);
      return;
    }

    // Pattern Undo para transacciones normales (ej. Relisting, Cancellation)
    let isCancelled = false;
    const previousHistorial = [...historial];

    const commitDelete = async () => {
      if (isCancelled) return;
      try {
        await deleteTransaction(transactionId);
        mutate(); // Sincronizar propiedad por si cambió estado
        mutateHistorial();
      } catch {
        toast.error("Error al eliminar del historial");
        mutateHistorial(previousHistorial, false);
      }
    };

    toast.warning("Registro eliminado", {
      description: "Tienes 5 segundos para deshacer.",
      action: {
        label: "Deshacer",
        onClick: () => {
          isCancelled = true;
          mutateHistorial(previousHistorial, false);
          toast.success("Acción cancelada");
        }
      },
      duration: 5000,
      onAutoClose: commitDelete,
      onDismiss: commitDelete
    });

    // Optimistic UI
    mutateHistorial(historial.filter(t => t.id !== transactionId), false);
    setTransactionMenuOpen(null);
  };

  const handleInlineUpdateNote = async (transaction: PropertyTransactionResponse, newNotes: string) => {
    try {
      await updateTransaction(transaction.id, {
        transactionDate: transaction.transactionDate,
        transactionType: transaction.transactionType,
        amount: transaction.amount,
        leadId: transaction.leadId,
        notes: newNotes
      });
      mutate();
      mutateHistorial();
      toast.success("Nota actualizada");
    } catch {
      toast.error("Error al actualizar la nota");
    }
  };

  const handleStatusChange = (nuevoEstado: string, confirmed = false) => {
    if (!propiedad || propiedad.estadoComercial === nuevoEstado) return;
    setIsStatusDropdownOpen(false);

    // Evitar salto directo entre estados cerrados sin pasar por Disponible
    const esEstadoCerrado = (estado: string) => estado === 'Vendida' || estado === 'Alquilada';
    if (esEstadoCerrado(propiedad.estadoComercial) && esEstadoCerrado(nuevoEstado) && !confirmed) {
      toast.error("Transición inválida", {
        description: `La propiedad está ${propiedad.estadoComercial}. Debes pasarla a 'Disponible' (Relistar) antes de registrar una nueva operación.`
      });
      return;
    }

    // Caso de CIERRE (Venta/Alquiler)
    if ((nuevoEstado === 'Vendida' || nuevoEstado === 'Alquilada') && !confirmed) {
      setClosingState(nuevoEstado);
      setIsClosingModalOpen(true);
      return;
    }

    // Caso de RE-LISTADO (Si ya estaba cerrada)
    if ((nuevoEstado === 'Disponible' || nuevoEstado === 'Inactiva') && (propiedad.estadoComercial === 'Vendida' || propiedad.estadoComercial === 'Alquilada') && !confirmed) {
      setShowReversionModal({ type: 'status', targetStatus: nuevoEstado });
      return;
    }

    // Caso de INACTIVA (Limpieza simple - no cierre)
    if (nuevoEstado === 'Inactiva' && !confirmed && propiedad.estadoComercial !== 'Vendida' && propiedad.estadoComercial !== 'Alquilada') {
      setStatusConfirmation(nuevoEstado);
      return;
    }

    setStatusConfirmation(null);
    setIsClosingModalOpen(false);

    // FIRE AND FORGET: Respuesta instantánea
    const optimisticData = { ...propiedad, estadoComercial: nuevoEstado };
    mutate(optimisticData, false);
    toast.success(`Estado actualizado a ${nuevoEstado}`);

    // Cambio de estado simple o confirmado en background
    const action = async () => {
      await actualizarEstadoPropiedad(propiedad.id, nuevoEstado);
      if (confirmed && (nuevoEstado === 'Vendida' || nuevoEstado === 'Inactiva')) {
        await limpiarImagenesPropiedad(propiedad.id);
      }
    };

    action()
      .then(() => {
        mutate();
        mutateHistorial();
      })
      .catch((err) => {
        console.error('Error al cambiar estado:', err);
        if (nuevoEstado === 'Reservada' && (propiedad.estadoComercial === 'Vendida' || propiedad.estadoComercial === 'Alquilada')) {
          toast.error("Acción no permitida", {
            description: "Debe primero cambiar la propiedad a Disponible antes de reservarla."
          });
        } else {
          toast.error("Error al sincronizar el estado");
        }
        mutate();
      });
  };

  if (!propiedad && syncing) {
    return (
      <div className="fixed inset-0 z-[200] flex justify-end">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
        <div className="relative w-full md:w-[700px] lg:w-[850px] bg-white h-full shadow-2xl flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">Sincronizando expediente...</p>
        </div>
      </div>
    );
  }

  if (!propiedad) return null;

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300 cursor-pointer" onClick={onClose} />

      <div className="relative w-full md:w-[700px] lg:w-[850px] bg-white h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-500 ease-out">
        {syncing && (
          <div className="fixed top-24 right-8 z-[100] animate-in slide-in-from-top-4 duration-300">
            <div className="bg-slate-900/90 backdrop-blur-xl text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sincronizando...</span>
            </div>
          </div>
        )}

        {/* Header Fijo */}
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-900 cursor-pointer"><X className="h-6 w-6" /></button>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Detalles del Inmueble</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {id.split('-')[0]}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <PDFLinkInternal propiedad={propiedad} />

            <button
              onClick={handleWhatsAppShare}
              className="h-9 w-9 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-all active:scale-90 group/wa cursor-pointer"
              title="Compartir por WhatsApp"
            >
              <MessageSquare className="h-4 w-4 fill-white group-hover/wa:scale-110 transition-transform" />
            </button>

            {propiedad.permissions?.canEditMasterData && (
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-1.5 bg-white border-2 border-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:border-slate-200 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Pencil className="h-3 w-3 text-indigo-600" />
                Editar
              </button>
            )}

            {/* Dropdown de Estado */}
            <div className="relative">
              <button
                onClick={() => {
                  if (propiedad.permissions && !propiedad.permissions.canChangeStatus) {
                    const responsable = propiedad.activeTransaction?.agenteNombre || 'otro agente';
                    toast.warning('Acción restringida', {
                      description: `Esta propiedad está en proceso por ${responsable}.`
                    });
                    return;
                  }
                  setIsStatusDropdownOpen(!isStatusDropdownOpen);
                }}
                disabled={isUpdatingStatus}
                className={`cursor-pointer ${`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${propiedad.estadoComercial === 'Disponible' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-white'} ${propiedad.permissions && !propiedad.permissions.canChangeStatus ? 'opacity-70 grayscale-[0.5]' : ''}`}`}
              >
                {isUpdatingStatus ? <Loader2 className="h-3 w-3 animate-spin" /> : propiedad.estadoComercial}
                {(!propiedad.permissions || propiedad.permissions.canChangeStatus) && <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />}
              </button>
              {isStatusDropdownOpen && (!propiedad.permissions || propiedad.permissions.canChangeStatus) && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[100] py-2 animate-in fade-in zoom-in duration-200 origin-top-right backdrop-blur-xl bg-white/95">
                  {ESTADOS.map((estado) => (
                    <button key={estado.value} onClick={() => handleStatusChange(estado.value)} className={`cursor-pointer ${`w-full px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide flex items-center justify-between transition-colors hover:bg-slate-50 ${propiedad.estadoComercial === estado.value ? 'text-indigo-600 bg-indigo-50/30' : 'text-slate-600'}`}`}>{estado.label}{propiedad.estadoComercial === estado.value && <Check className="h-3.5 w-3.5" />}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 space-y-12 pb-24">
          {/* Info Principal */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-widest">{propiedad.tipoPropiedad}</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${propiedad.operacion === 'Venta' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>{propiedad.operacion}</span>
                {propiedad.esCaptacionPropia && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center gap-1 ${propiedad.permissions?.canEditMasterData ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Handshake className="h-3 w-3" /> 
                    {propiedad.permissions?.canEditMasterData ? 'Captación Propia' : `Captación de ${propiedad.agenteNombre}`}
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-black text-slate-900 leading-tight tracking-tight">{propiedad.titulo}</h1>
              <div className="flex items-start gap-3 text-slate-500 mt-4">
                <MapPin className="h-6 w-6 text-indigo-600 mt-1 shrink-0" />
                <div>
                  <p className="text-lg font-bold italic leading-tight text-slate-700">{propiedad.direccion}</p>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{propiedad.sector}, {propiedad.ciudad}</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 flex flex-col items-end min-w-[200px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Precio de Lista</p>
              <p className="text-4xl font-black text-indigo-600 tracking-tight">{formatCurrency(propiedad.precio)}</p>
            </div>
          </div>

          {/* Estadísticas Inteligentes */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[
              {
                label: 'Área Construcción',
                value: propiedad.areaConstruccion ? `${propiedad.areaConstruccion} m²` : `${propiedad.areaTotal} m²`,
                icon: Maximize,
                color: 'amber',
                show: true
              },
              {
                label: 'Área Terreno',
                value: `${propiedad.areaTerreno} m²`,
                icon: MapPin,
                color: 'orange',
                show: !!propiedad.areaTerreno && propiedad.areaTerreno > 0
              },
              {
                label: 'Habitaciones',
                value: propiedad.habitaciones,
                icon: Bed,
                color: 'blue',
                show: ['Casa', 'Departamento', 'Suite', 'Hotel'].includes(propiedad.tipoPropiedad)
              },
              {
                label: 'Baños',
                value: propiedad.banos + (propiedad.mediosBanos ? ` y ${propiedad.mediosBanos} medios` : ''),
                icon: Bath,
                color: 'emerald',
                show: propiedad.tipoPropiedad !== 'Terreno'
              },
              {
                label: 'Parqueaderos',
                value: propiedad.estacionamientos,
                icon: Car,
                color: 'indigo',
                show: !!propiedad.estacionamientos && propiedad.estacionamientos > 0
              },
              {
                label: 'Antigüedad',
                value: `${propiedad.aniosAntiguedad} años`,
                icon: CalendarDays,
                color: 'slate',
                show: !!propiedad.aniosAntiguedad && propiedad.aniosAntiguedad >= 0
              },
              {
                label: 'Comisión',
                value: `${propiedad.porcentajeComision}%`,
                icon: Handshake,
                color: 'indigo',
                show: true
              },
              {
                label: 'Registro',
                value: formatDate(propiedad.fechaIngreso),
                icon: Clock,
                color: 'slate',
                show: true
              }
            ].filter(stat => stat.show).map((stat, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 group hover:border-indigo-100 transition-all hover:-translate-y-1">
                <div className={`h-10 w-10 bg-${stat.color}-50 rounded-xl flex items-center justify-center text-${stat.color}-500 group-hover:scale-110 transition-transform`}><stat.icon className="h-5 w-5" /></div>
                <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p><p className="text-sm font-black text-slate-900 leading-tight tracking-tight mt-0.5" title={stat.value?.toString()}>{stat.value}</p></div>
              </div>
            ))}
          </div>

          {/* Descripción & Mapa Dinámico */}
          <div className={`grid grid-cols-1 ${propiedad.googleMapsUrl ? 'lg:grid-cols-2' : ''} gap-8`}>
            <div className="space-y-6">
              <div className="flex items-center gap-2"><div className="h-6 w-1 bg-indigo-600 rounded-full"></div><h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Descripción</h3></div>
              <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">{propiedad.descripcion}</p>
              </div>
            </div>

            {propiedad.googleMapsUrl && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-2"><div className="h-6 w-1 bg-rose-600 rounded-full"></div><h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Ubicación</h3></div>
                <div className="bg-slate-100 rounded-[2rem] overflow-hidden border-2 border-slate-100 shadow-inner h-[280px] relative group">
                  <iframe
                    title="Google Maps"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    allowFullScreen
                    src={getMapEmbedUrl(propiedad.googleMapsUrl, `${propiedad.direccion} ${propiedad.sector} ${propiedad.ciudad}`)}
                  ></iframe>

                  {/* Botón superior izquierdo que tapa el nativo de Google */}
                  <a
                    href={propiedad.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 left-2 bg-white px-6 py-3 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] text-[11px] font-black uppercase tracking-[0.15em] text-slate-900 hover:bg-slate-50 transition-all flex items-center gap-3 border border-slate-100 z-20 hover:scale-[1.02] active:scale-95 cursor-pointer"
                  >
                    <div className="h-6 w-6 bg-indigo-50 rounded-lg flex items-center justify-center">
                      <Globe className="h-3.5 w-3.5 text-indigo-600" />
                    </div>
                    Ver en Google Maps
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Galería Estructurada */}
          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><div className="h-8 w-1 bg-indigo-600 rounded-full"></div><h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Galerías del Inmueble</h3></div>
              {propiedad.permissions?.canManageGallery && (
                <button
                  onClick={handleAddSection}
                  disabled={isCreatingInline}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Plus size={16} />
                  Nueva Sección
                </button>
              )}
            </div>

            {/* Galería General */}
            <SectionalGallery
              propiedadId={id}
              propiedadTitulo={propiedad.titulo}
              index={-1}
              media={propiedad.mediaSinSeccion || []}
              onSetCover={handleSetCover}
              onDeleteMedia={handleDeleteMedia}
              onImageUploaded={() => mutate()}
              onClearGallery={handleClearGallery}
              isReadOnly={!propiedad.permissions?.canManageGallery}
            />

            {/* Secciones Dinámicas con Drag & Drop */}
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="sections-list" isDropDisabled={!propiedad.permissions?.canManageGallery}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-12"
                  >
                    {propiedad.secciones?.map((seccion, index) => {
                      const seccionConClient = seccion as SeccionGaleria & { clientId?: string };
                      return (
                        <SectionalGallery
                          key={seccionConClient.clientId || seccion.id}
                          index={index}
                          sectionId={seccion.id}
                          sectionNombre={seccion.nombre}
                          sectionDescripcion={seccion.descripcion}
                          propiedadId={id}
                          propiedadTitulo={propiedad.titulo}
                          media={seccion.media || []}
                          onSetCover={handleSetCover}
                          onDeleteMedia={handleDeleteMedia}
                          onImageUploaded={() => mutate()}
                          onDeleteSection={handleDeleteSection}
                          onRenameSection={(id, nombre, desc) => handleRenameSection(id, nombre, desc, seccion.orden)}
                          onMoveUp={() => handleMoveSection(index, 'up')}
                          onMoveDown={() => handleMoveSection(index, 'down')}
                          onMoveTo={(newIndex) => handleMoveSection(index, newIndex > index ? 'down' : 'up', newIndex)}
                          totalSections={propiedad.secciones?.length || 0}
                          isReadOnly={!propiedad.permissions?.canManageGallery}
                        />
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {/* Input Inline para Nueva Sección - World Class UX */}
            {isCreatingInline && propiedad.permissions?.canManageGallery && (
              <div className="bg-indigo-50/50 border-2 border-dashed border-indigo-200 rounded-[2rem] p-6 animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <Plus size={24} />
                  </div>
                  <div className="flex-1">
                    <input
                      autoFocus
                      value={newSectionName}
                      onChange={(e) => setNewSectionName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleConfirmAddSection();
                        if (e.key === 'Escape') setIsCreatingInline(false);
                      }}
                      placeholder="Ej: Master Suite, Jardín Trasero..."
                      className="w-full bg-transparent border-none text-xl font-black text-slate-900 placeholder:text-slate-300 outline-none"
                    />
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Presiona Enter para crear o Esc para cancelar</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsCreatingInline(false)}
                      className="p-3 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <X size={20} />
                    </button>
                    <button
                      onClick={handleConfirmAddSection}
                      disabled={!newSectionName.trim() || isAddingSection}
                      className="bg-indigo-600 text-white p-3 rounded-xl shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isAddingSection ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check size={20} />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Historial Transaccional (Spec 011) */}
          <div className="space-y-8 pb-12">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 bg-slate-900 rounded-full"></div>
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Historial Inmobiliario</h3>
            </div>

            {!historial || historial.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-[2rem] p-12 text-center">
                <History className="h-12 w-12 text-slate-300 mx-auto mb-4 opacity-50" />
                <p className="text-xs font-bold text-slate-400 italic">No hay registros históricos para esta propiedad.</p>
              </div>
            ) : (
              <div className="relative space-y-8 before:absolute before:left-6 before:top-4 before:bottom-0 before:w-0.5 before:bg-slate-100 before:content-['']">
                {historial.map((item) => (
                  <div key={item.id} className="relative pl-14 group">
                    <div className={`absolute left-3 top-0 h-7 w-7 bg-white border-2 rounded-full z-10 flex items-center justify-center shadow-sm transition-colors
                      ${item.transactionType === 'Sale' || item.transactionType === 'Rent' ? 'border-emerald-500 text-emerald-600' :
                        item.transactionType === 'Relisting' ? 'border-indigo-500 text-indigo-600' : 'border-rose-500 text-rose-600'}`}>
                      {item.transactionType === 'Sale' || item.transactionType === 'Rent' ? <TrendingUp size={14} /> :
                        item.transactionType === 'Relisting' ? <RotateCcw size={14} /> : <X size={14} />}
                    </div>

                    <div className="bg-white border border-slate-100 p-6 rounded-3xl hover:border-slate-200 hover:shadow-xl transition-all duration-500">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md
                            ${item.transactionType === 'Sale' || item.transactionType === 'Rent' ? 'bg-emerald-50 text-emerald-600' :
                              item.transactionType === 'Relisting' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                            {item.transactionType === 'Sale' ? 'Venta' :
                              item.transactionType === 'Rent' ? 'Alquiler' :
                                item.transactionType === 'Relisting' ? 'Re-Listado' : 'Cancelación'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{formatDate(item.transactionDate)}</span>
                        </div>
                        {item.amount && (
                          <span className="text-sm font-black text-slate-900">{formatCurrency(item.amount)}</span>
                        )}

                        <div className="relative">
                          <button
                            onClick={() => {
                              // Solo el autor puede ver el menú de acciones (eliminar)
                              // Nota: Necesitamos el ID del usuario actual. 
                              // Como no lo tenemos inyectado directamente, usaremos una validación 
                              // basada en si el backend devolvió el menú o si el agenteNombre coincide.
                              // Por ahora, permitimos el clic pero validaremos dentro.
                              setTransactionMenuOpen(transactionMenuOpen === item.id ? null : item.id);
                            }}
                            className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {transactionMenuOpen === item.id && (
                            <div className="absolute right-0 mt-1 w-32 bg-white border border-slate-100 rounded-xl shadow-2xl z-[100] py-1 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                              <button 
                                onClick={() => {
                                  // El backend ya validará, pero para UX ocultamos/deshabilitamos si no es el dueño
                                  // Usamos una técnica simple: si no es el dueño de la captación ni el autor, toast.
                                  // En una fase futura inyectaremos el user.id aquí.
                                  handleDeleteTransaction(item.id);
                                }}
                                className="w-full px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 size={12} />
                                Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <InlineNoteEditor 
                        transaction={item} 
                        onSave={(notes) => handleInlineUpdateNote(item, notes)} 
                      />

                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400 uppercase tracking-tighter shadow-inner">
                            {item.agenteNombre[0]}
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agente: {item.agenteNombre}</span>
                        </div>
                        {item.leadId && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Titular:</span>
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{item.leadNombre}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Limpieza por Estado */}
      {statusConfirmation && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center">
              <div className="h-20 w-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6"><AlertCircle className="h-10 w-10 text-rose-600" /></div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">¿Confirmar estado {statusConfirmation}?</h3>
              <p className="text-slate-500 font-medium mb-8">Se eliminarán permanentemente <span className="text-rose-600 font-bold">todas las secciones y fotos</span>, excepto la de portada.</p>
              <div className="flex flex-col sm:flex-row gap-3"><button onClick={() => setStatusConfirmation(null)} className="flex-1 px-6 py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl cursor-pointer">Cancelar</button><button onClick={() => handleStatusChange(statusConfirmation, true)} className="flex-1 px-6 py-4 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-700 shadow-xl cursor-pointer">Sí, confirmar</button></div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <CrearPropiedadForm
            initialData={propiedad}
            onSuccess={() => { mutate(); setShowEditModal(false); }}
            onCancel={() => setShowEditModal(false)}
          />
        </div>
      )}

      <ClosingModal
        key={propiedad.id}
        isOpen={isClosingModalOpen}
        onClose={() => { setIsClosingModalOpen(false); setClosingState(undefined); }}
        onConfirm={handleClosingConfirm}
        mode="property"
        intendedState={closingState}
        initialData={{
          id: propiedad.id,
          titulo: propiedad.titulo,
          precio: propiedad.precio,
          operacion: propiedad.operacion
        }}
      />

      {/* Modal de Decisión Semántica (Spec 011 Fase 5) */}
      {showReversionModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[600] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 text-center">
              <div className="h-20 w-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <RotateCcw className="h-10 w-10 text-indigo-600" />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Ciclo de Vida</h3>
              <p className="text-slate-500 font-medium mb-10 leading-relaxed px-4">
                La propiedad está marcada como cerrada. <br />¿Cómo deseas proceder con el re-listado?
              </p>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={async () => {
                    const { targetStatus } = showReversionModal;
                    setShowReversionModal(null);

                    // Pattern Undo
                    let isCancelled = false;
                    const commitRelist = async () => {
                      if (isCancelled) return;
                      try {
                        await relistPropiedad(propiedad.id, "Fin de contrato / Relistado natural", "Relist");
                        mutate();
                        mutateHistorial();
                        toast.success("Nuevo ciclo comercial iniciado");
                      } catch {
                        toast.error("Error al relistar");
                      }
                    };

                    toast.info("Relistando...", {
                      description: "Se mantendrá el historial de cierre del cliente. 5s para deshacer.",
                      action: { label: "Deshacer", onClick: () => { isCancelled = true; toast.success("Acción cancelada"); } },
                      duration: 5000,
                      onAutoClose: commitRelist,
                      onDismiss: commitRelist
                    });

                    if (targetStatus) {
                      mutate({ ...propiedad, estadoComercial: targetStatus }, false);
                    } else {
                      mutate({ ...propiedad, estadoComercial: 'Disponible' }, false);
                    }
                  }}
                  className="group relative bg-white border-2 border-slate-100 p-6 rounded-[2rem] text-left hover:border-indigo-600 transition-all hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <RotateCcw size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Relistar (Fin de Contrato)</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Comenzar nuevo ciclo comercial</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={async () => {
                    const { targetStatus } = showReversionModal;
                    setShowReversionModal(null);

                    // Pattern Undo
                    let isCancelled = false;
                    const commitCancel = async () => {
                      if (isCancelled) return;
                      try {
                        await relistPropiedad(propiedad.id, "Operación anulada / Trato caído", "Cancel");
                        mutate();
                        mutateHistorial();
                        toast.success("Operación cancelada con éxito");
                      } catch {
                        toast.error("Error al cancelar la operación");
                      }
                    };

                    toast.warning("Anulando Operación", {
                      description: "El trato se marcará como caído y el cliente revertirá a Negociación. 5s para deshacer.",
                      action: { label: "Deshacer", onClick: () => { isCancelled = true; toast.success("Acción cancelada"); } },
                      duration: 5000,
                      onAutoClose: commitCancel,
                      onDismiss: commitCancel
                    });

                    if (targetStatus) {
                      mutate({ ...propiedad, estadoComercial: targetStatus }, false);
                    } else {
                      mutate({ ...propiedad, estadoComercial: 'Disponible' }, false);
                    }
                  }}
                  className="group relative bg-white border-2 border-slate-100 p-6 rounded-[2rem] text-left hover:border-rose-600 transition-all hover:shadow-xl hover:shadow-rose-500/10 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                      <AlertCircle size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Cancelar (Trato Caído)</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">El cliente volverá a negociación</p>
                    </div>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShowReversionModal(null)}
                className="mt-8 text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors cursor-pointer"
              >
                Volver atrás
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const InlineNoteEditor = ({ transaction, onSave }: { transaction: PropertyTransactionResponse, onSave: (notes: string) => Promise<void> }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(transaction.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setNotes(transaction.notes || '');
  }, [transaction.notes]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(notes);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNotes(transaction.notes || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="mb-4 relative">
        <textarea
          autoFocus
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="w-full px-4 py-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none min-h-[80px]"
          placeholder="Escribe la nota y presiona Enter para guardar..."
        />
        <div className="absolute bottom-3 right-3 flex gap-2">
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            title="Guardar (Enter)"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          </button>
          <button 
            onClick={handleCancel}
            disabled={isSaving}
            className="p-1.5 bg-white border border-slate-200 text-slate-400 rounded-lg hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            title="Cancelar (Esc)"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <p 
      onDoubleClick={() => setIsEditing(true)}
      className={`text-sm font-medium leading-relaxed mb-4 italic cursor-text hover:bg-slate-50 p-2 -mx-2 rounded-lg transition-colors border border-transparent hover:border-slate-100 ${transaction.notes ? 'text-slate-600' : 'text-slate-300'}`}
      title="Doble clic para editar nota"
    >
      {transaction.notes ? `"${transaction.notes}"` : 'Doble clic para añadir nota...'}
    </p>
  );
};

export const PropiedadDetalle = (props: PropiedadDetalleProps) => {
  return (
    <SWRConfig value={{ provider: localStorageProvider }}>
      <PropiedadDetalleContent {...props} />
    </SWRConfig>
  );
};