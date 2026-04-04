import { useState, useCallback } from 'react';
import useSWR, { SWRConfig } from 'swr';
import { 
  X, 
  Bed, 
  Bath, 
  Maximize, 
  MapPin, 
  Info,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  Building2,
  Clock,
  Upload,
  Star,
  Trash2,
  Check,
  Library,
  Download,
  FileDown,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { getPropiedadById } from '../api/getPropiedadById';
import { actualizarEstadoPropiedad } from '../api/actualizarEstadoPropiedad';
import { limpiarImagenesPropiedad } from '../api/limpiarImagenesPropiedad';
import { establecerImagenPrincipal } from '../api/establecerImagenPrincipal';
import { deleteImagenPropiedad } from '../api/deleteImagenPropiedad';
import { deleteTodasLasImagenes } from '../api/deleteTodasLasImagenes';
import { deleteImagenesSeleccionadas } from '../api/deleteImagenesSeleccionadas';
import { useUpload } from '../context/useUpload';
import { localStorageProvider, swrDefaultConfig } from '@/lib/swr';
import type { Propiedad } from '../types';

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

  // UPSP: loading es TRUE solo si no hay datos y estamos validando por primera vez o revalidando sin cache.
  const loading = !propiedad && syncing;
  const [isUpdatingCover, setIsUpdatingCover] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [confirmDeleteSelected, setConfirmDeleteSelected] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isCleaningGallery, setIsCleaningGallery] = useState(false);
  const [statusConfirmation, setStatusConfirmation] = useState<string | null>(null);

  const { uploadFiles, isUploading } = useUpload();

  const onImageUploaded = useCallback((result: { id: string; propiedadId: string; tipoMultimedia: string; urlPublica: string; esPrincipal: boolean; orden: number }) => {
    mutate((prev) => {
      if (!prev || prev.id !== result.propiedadId) return prev;
      if (prev.media?.some(m => m.id === result.id)) return prev;
      return {
        ...prev,
        media: [...(prev.media || []), result]
      };
    }, false);
  }, [mutate]);

  const handleStatusChange = async (nuevoEstado: string, confirmed = false) => {
    if (!propiedad || propiedad.estadoComercial === nuevoEstado) return;
    setIsStatusDropdownOpen(false);

    if ((nuevoEstado === 'Vendida' || nuevoEstado === 'Inactiva') && !confirmed) {
      setStatusConfirmation(nuevoEstado);
      return;
    }

    setStatusConfirmation(null);

    // CASO 1: Cambio de estado SIN limpieza (Disponible, Reservada, Alquilada)

    if (!confirmed) {
        const optimisticData = { ...propiedad, estadoComercial: nuevoEstado };
        try {
            setIsUpdatingStatus(true);
            await mutate(actualizarEstadoPropiedad(propiedad.id, nuevoEstado).then(() => optimisticData), {
              optimisticData,
              rollbackOnError: true,
              revalidate: true
            });
            toast.success(`Propiedad marcada como ${nuevoEstado}`);
        } catch {
            toast.error('Error al actualizar el estado comercial.');
        } finally {
            setIsUpdatingStatus(false);
        }
        return;
    }

    // CASO 2: Cambio de estado CON limpieza (Vendida, Inactiva) - Usar patrón de Deshacer
    const optimisticData = { 
      ...propiedad, 
      estadoComercial: nuevoEstado,
      media: propiedad.media?.filter(m => m.esPrincipal) || []
    };

    let isCancelled = false;

    toast.warning(`Estado: ${nuevoEstado}`, {
      description: "La galería ha sido depurada. Puedes deshacer esta acción.",
      action: {
        label: "Deshacer",
        onClick: () => {
          isCancelled = true;
          mutate(); // Vuelve a los datos originales
          toast.success("Cambio de estado cancelado");
        },
      },
      duration: 6000,
      onAutoClose: async () => {
        if (isCancelled) return;

        try {
          setIsUpdatingStatus(true);
          setIsCleaningGallery(true);
          await actualizarEstadoPropiedad(propiedad.id, nuevoEstado);
          await limpiarImagenesPropiedad(propiedad.id);
          mutate();
          toast.success(`Propiedad actualizada a ${nuevoEstado} con éxito.`);
        } catch (err) {
          console.error('Error en cambio de estado masivo:', err);
          toast.error("Error al procesar el cambio de estado masivo.");
        } finally {
          setIsUpdatingStatus(false);
          setIsCleaningGallery(false);
        }
      }
    });
    
    mutate(optimisticData, false);
  };

  const handleFiles = async (files: FileList | File[]) => {
    if (!propiedad || files.length === 0) return;
    const filesArray = Array.from(files);
    const MAX_SIZE_MB = 30;
    const validFiles = filesArray.filter(file => {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`${file.name}: Excede el máximo de ${MAX_SIZE_MB} MB`);
        return false;
      }
      return true;
    });
    if (validFiles.length === 0) return;
    uploadFiles(propiedad.id, propiedad.titulo, validFiles, onImageUploaded);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isUploading(id)) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isUploading(id) && e.dataTransfer.files) {
      await handleFiles(e.dataTransfer.files);
    }
  };

  const handleSetCover = async (e: React.MouseEvent, imagenId: string) => {
    e.stopPropagation();
    if (!propiedad) return;
    
    try {
      setIsUpdatingCover(imagenId);
      await establecerImagenPrincipal(propiedad.id, imagenId);
      
      const mediaActualizada = propiedad.media?.map(m => ({
        ...m,
        esPrincipal: m.id === imagenId
      }));

      const optimisticData = { ...propiedad, media: mediaActualizada };
      mutate(optimisticData, false);

      const nuevaImagen = mediaActualizada?.find(m => m.id === imagenId);
      if (nuevaImagen && onCoverUpdated) {
        onCoverUpdated(nuevaImagen.urlPublica);
      }

      toast.success('Imagen de portada actualizada');
    } catch (err) {
      console.error('Error al establecer portada:', err);
      toast.error('No se pudo actualizar la portada');
    } finally {
      setIsUpdatingCover(null);
    }
  };

  const handleDeleteImage = async (imagenId: string) => {
    if (!propiedad) return;
    const imagenABorrar = propiedad.media?.find(m => m.id === imagenId);
    if (!imagenABorrar) return;
    const previousMedia = [...(propiedad.media || [])];

    const optimisticData = {
      ...propiedad,
      media: previousMedia.filter(m => m.id !== imagenId)
    };
    setConfirmDelete(null);

    let isCancelled = false;
    
    toast.warning("Imagen eliminada", {
      description: "Tienes unos segundos para deshacer esta acción.",
      action: {
        label: "Deshacer",
        onClick: () => {
          isCancelled = true;
          mutate();
          toast.success("Eliminación cancelada");
        },
      },
      duration: 5000,
      onAutoClose: async () => {
        if (isCancelled) return;
        try {
          setIsDeleting(imagenId);
          await deleteImagenPropiedad(propiedad.id, imagenId);
          if (imagenABorrar.esPrincipal && onCoverUpdated) {
            onCoverUpdated('');
          }
          mutate();
        } catch (err) {
          console.error('Error al eliminar imagen:', err);
          toast.error("No se pudo eliminar la imagen del servidor");
        } finally {
          setIsDeleting(null);
        }
      }
    });
    
    mutate(optimisticData, false);
  };

  const handleToggleSelection = (imagenId: string) => {
    const newSelected = new Set(selectedMediaIds);
    if (newSelected.has(imagenId)) {
      newSelected.delete(imagenId);
    } else {
      newSelected.add(imagenId);
    }
    setSelectedMediaIds(newSelected);
  };

  const handleDeleteAll = async () => {
    if (!propiedad || !propiedad.media || propiedad.media.length === 0) return;
    const previousMedia = [...propiedad.media];
    
    const optimisticData = { ...propiedad, media: [] };
    setConfirmDeleteAll(false);

    let isCancelled = false;

    toast.warning(`Eliminando ${previousMedia.length} imágenes`, {
      description: "Puedes deshacer esta acción ahora mismo.",
      action: {
        label: "Deshacer",
        onClick: () => {
          isCancelled = true;
          mutate();
          toast.success("Eliminación masiva cancelada");
        },
      },
      duration: 6000,
      onAutoClose: async () => {
        if (isCancelled) return;
        try {
          setIsDeletingAll(true);
          await deleteTodasLasImagenes(propiedad.id);
          if (onCoverUpdated) onCoverUpdated('');
          mutate();
        } catch (err) {
          console.error('Error al eliminar todas las imágenes:', err);
          toast.error("Error al vaciar la galería en el servidor");
        } finally {
          setIsDeletingAll(false);
        }
      }
    });
    
    mutate(optimisticData, false);
  };

  const handleDeleteSelected = async () => {
    if (!propiedad || selectedMediaIds.size === 0) return;
    const previousMedia = [...(propiedad.media || [])];
    const selectedIdsArray = Array.from(selectedMediaIds);
    const count = selectedMediaIds.size;

    const optimisticData = {
      ...propiedad,
      media: previousMedia.filter(m => !selectedMediaIds.has(m.id))
    };
    
    const tempSelected = new Set(selectedMediaIds);
    setSelectedMediaIds(new Set());
    setConfirmDeleteSelected(false);

    let isCancelled = false;

    toast.warning(`${count} imágenes eliminadas`, {
      description: "¿Te equivocaste? Puedes restaurarlas ahora.",
      action: {
        label: "Deshacer",
        onClick: () => {
          isCancelled = true;
          mutate();
          setSelectedMediaIds(tempSelected);
          toast.success("Restauración completada");
        },
      },
      duration: 5000,
      onAutoClose: async () => {
        if (isCancelled) return;
        try {
          setIsDeletingAll(true);
          await deleteImagenesSeleccionadas(propiedad.id, selectedIdsArray);
          const algunaPrincipal = previousMedia.some(m => tempSelected.has(m.id) && m.esPrincipal);
          if (algunaPrincipal && onCoverUpdated) {
            onCoverUpdated('');
          }
          mutate();
        } catch (err) {
          console.error('Error al eliminar selección:', err);
          toast.error("No se pudo completar la eliminación masiva");
        } finally {
          setIsDeletingAll(false);
        }
      }
    });
    
    mutate(optimisticData, false);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadSingle = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      downloadBlob(blob, filename);
      toast.success('Descarga iniciada');
    } catch (err) {
      console.error('Error al descargar imagen:', err);
      toast.error('No se pudo descargar la imagen');
    }
  };

  const handleBulkDownload = async (mediaToDownload: { urlPublica: string }[], zipName: string) => {
    if (mediaToDownload.length === 0) return;
    try {
      setIsDownloading(true);
      const toastId = toast.loading(`Preparando descarga de ${mediaToDownload.length} imágenes...`);
      const zip = new JSZip();
      const downloadPromises = mediaToDownload.map(async (item, index) => {
        const response = await fetch(item.urlPublica);
        const blob = await response.blob();
        const extension = item.urlPublica.split('.').pop() || 'webp';
        const filename = `imagen_${index + 1}.${extension}`;
        zip.file(filename, blob);
      });
      await Promise.all(downloadPromises);
      const content = await zip.generateAsync({ type: 'blob' });
      downloadBlob(content, `${zipName}.zip`);
      toast.dismiss(toastId);
      toast.success('Galería descargada con éxito');
    } catch (err) {
      console.error('Error al crear ZIP:', err);
      toast.error('Error al generar el archivo de descarga');
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusBadgeStyles = (estado: string) => {
    switch (estado) {
      case 'Disponible': return 'bg-emerald-500 text-white';
      case 'Reservada': return 'bg-amber-500 text-white';
      case 'Vendida': return 'bg-slate-700 text-white';
      case 'Alquilada': return 'bg-blue-600 text-white';
      default: return 'bg-rose-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[200] flex justify-end">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
        <div className="relative w-full md:w-[700px] lg:w-[850px] bg-white h-full shadow-2xl flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">Obteniendo expediente técnico...</p>
        </div>
      </div>
    );
  }

  if (!propiedad) {
    return (
      <div className="fixed inset-0 z-[200] flex justify-end">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full md:w-[700px] lg:w-[850px] bg-white h-full shadow-2xl flex flex-col items-center justify-center p-8 text-center">
          <div className="h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center mb-6">
            <Info className="h-10 w-10 text-rose-500" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">Propiedad no encontrada</h3>
          <button onClick={onClose} className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-sm hover:bg-slate-800 transition-all cursor-pointer">Cerrar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full md:w-[700px] lg:w-[850px] bg-white h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-500 ease-out">
        {syncing && (
          <div className="fixed top-24 right-8 z-[100] animate-in slide-in-from-top-4 duration-300">
            <div className="bg-slate-900/90 backdrop-blur-xl text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10">
              <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sincronizando Galería...</span>
            </div>
          </div>
        )}

        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-900 cursor-pointer"><X className="h-6 w-6" /></button>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Detalles del Inmueble</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {id.split('-')[0]}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <button onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)} disabled={isUpdatingStatus} className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50 ${getStatusBadgeStyles(propiedad.estadoComercial)}`}>
                {isUpdatingStatus ? <Loader2 className="h-3 w-3 animate-spin" /> : propiedad.estadoComercial}
                <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isStatusDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[100] py-2 animate-in fade-in zoom-in duration-200 origin-top-right backdrop-blur-xl bg-white/95">
                  <div className="px-4 py-1.5 border-b border-slate-50 mb-1"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cambiar Estado</span></div>
                  {ESTADOS.map((estado) => (
                    <button key={estado.value} onClick={() => handleStatusChange(estado.value)} className={`w-full px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide flex items-center justify-between transition-colors hover:bg-slate-50 cursor-pointer ${propiedad.estadoComercial === estado.value ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'}`}>{estado.label}{propiedad.estadoComercial === estado.value && <Check className="h-3.5 w-3.5" />}</button>
                  ))}
                </div>
              )}
            </div>
            <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">{propiedad.operacion}</span>
          </div>
        </div>

        <div className="p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3"><span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-widest">{propiedad.tipoPropiedad}</span></div>
              <h1 className="text-4xl font-black text-slate-900 leading-tight tracking-tight">{propiedad.titulo}</h1>
              <div className="flex items-center gap-2 text-slate-500 mt-4"><MapPin className="h-5 w-5 text-blue-600" /><span className="text-lg font-bold italic">{propiedad.direccion}</span></div>
              <div className="text-slate-400 text-sm font-medium ml-7">{propiedad.sector}, {propiedad.ciudad}</div>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col items-end min-w-[200px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Precio de Lista</p>
              <p className="text-4xl font-black text-blue-600 tracking-tight">{formatCurrency(propiedad.precio)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Habitaciones', value: propiedad.habitaciones, icon: Bed, color: 'blue' },
              { label: 'Baños', value: propiedad.banos, icon: Bath, color: 'emerald' },
              { label: 'Área Total', value: `${propiedad.areaTotal} m²`, icon: Maximize, color: 'amber' },
              { label: 'Ingreso', value: formatDate(propiedad.fechaIngreso), icon: Clock, color: 'slate' }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 group hover:border-blue-100 transition-all">
                <div className={`h-10 w-10 bg-${stat.color}-50 rounded-xl flex items-center justify-center text-${stat.color}-600 group-hover:bg-${stat.color}-600 group-hover:text-white transition-all`}><stat.icon className="h-5 w-5" /></div>
                <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p><p className="text-lg font-black text-slate-900">{stat.value}</p></div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2"><div className="h-8 w-1 bg-blue-600 rounded-full"></div><h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Descripción General</h3></div>
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Building2 className="h-16 w-16 text-slate-900" /></div>
              <p className="text-slate-600 leading-relaxed text-lg font-medium whitespace-pre-line relative z-10">{propiedad.descripcion}</p>
            </div>
          </div>

          <div className="space-y-4 pb-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><div className="h-8 w-1 bg-blue-600 rounded-full"></div><h3 className="text-xl font-black text-slate-900 uppercase tracking-tight text-nowrap">Galería de Imágenes</h3></div>
              <div className="flex items-center gap-3">
                {isCleaningGallery && <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg animate-pulse border border-rose-100 shadow-sm z-[60]"><Loader2 className="h-3.5 w-3.5 animate-spin" /><span className="text-[10px] font-black uppercase tracking-wider">Limpiando Galería...</span></div>}
                {propiedad.media && propiedad.media.length > 0 && (
                  <div className="flex items-center gap-3">
                    <button disabled={isDownloading} onClick={() => { if (selectedMediaIds.size > 0) { const selectedItems = propiedad.media?.filter(m => selectedMediaIds.has(m.id)) || []; handleBulkDownload(selectedItems, `seleccion_propiedad_${propiedad.id.split('-')[0]}`); } else { handleBulkDownload(propiedad.media || [], `todas_propiedad_${propiedad.id.split('-')[0]}`); } }} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-blue-100 transition-all cursor-pointer border border-blue-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100">{isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}{selectedMediaIds.size > 0 ? `Descargar Selección (${selectedMediaIds.size})` : 'Descargar Todas'}</button>
                    <button onClick={() => selectedMediaIds.size > 0 ? setConfirmDeleteSelected(true) : setConfirmDeleteAll(true)} className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-rose-100 transition-all cursor-pointer border border-rose-100"><Trash2 className="h-3.5 w-3.5" />{selectedMediaIds.size > 0 ? `Eliminar Selección (${selectedMediaIds.size})` : 'Eliminar Todas'}</button>
                  </div>
                )}
                {selectedMediaIds.size > 0 && <button onClick={() => setSelectedMediaIds(new Set())} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors cursor-pointer px-2 py-1">Limpiar Selección</button>}
              </div>
            </div>
            
            <div className="relative group">
              <label onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`relative border-4 border-dashed rounded-[40px] h-48 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer overflow-hidden ${isUploading(id) ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : isDragging ? 'bg-blue-50 border-blue-500 scale-[1.02] shadow-2xl shadow-blue-200/50' : 'border-slate-100 bg-slate-50/50 hover:bg-blue-50/30 hover:border-blue-400'}`}>
                <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/jpg" onChange={handleFileUpload} disabled={isUploading(id)} multiple />
                {isUploading(id) ? <><Loader2 className="h-10 w-10 text-blue-600 animate-spin" /><p className="text-blue-600 font-black text-sm uppercase tracking-widest animate-pulse">Procesando en segundo plano...</p></> : 
                  <><div className={`h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-xl shadow-slate-200/50 transition-all duration-500 ${isDragging ? 'scale-125 rotate-6 text-blue-600' : 'group-hover:scale-110 group-hover:rotate-3'}`}><Upload className={`h-8 w-8 transition-colors ${isDragging ? 'text-blue-600' : 'text-slate-300 group-hover:text-blue-500'}`} /></div>
                  <div className="text-center px-4"><p className="text-slate-900 font-black text-lg tracking-tight">{isDragging ? '¡Suelta para subir!' : 'Haz clic o arrastra imágenes'}</p><p className="text-slate-400 font-bold text-xs italic mt-1 text-balance">Formatos: JPG, JPEG, PNG, WEBP (Máx. 30MB)</p></div></>
                }
              </label>
            </div>

            {propiedad.media && propiedad.media.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8">
                {propiedad.media.map((item) => (
                  <div key={item.id} onClick={() => handleToggleSelection(item.id)} className={`group relative aspect-video rounded-3xl overflow-hidden border-2 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer ${selectedMediaIds.has(item.id) ? 'border-blue-600 ring-4 ring-blue-600/20' : 'border-slate-100'}`}>
                    <img src={item.urlPublica} alt="Multimedia propiedad" className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 ${selectedMediaIds.has(item.id) ? 'opacity-90' : ''}`} />
                    <div className={`absolute top-3 left-3 h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all z-40 ${selectedMediaIds.has(item.id) ? 'bg-blue-600 border-blue-600 text-white scale-110' : 'bg-white/40 border-white opacity-0 group-hover:opacity-100 text-transparent'}`}><Check className="h-4 w-4 stroke-[3px]" /></div>
                    {!selectedMediaIds.has(item.id) && selectedMediaIds.size === 0 && (
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-40">
                        <button onClick={(e) => { e.stopPropagation(); handleDownloadSingle(item.urlPublica, `propiedad_${propiedad.id.split('-')[0]}_img_${item.orden}.webp`); }} className="bg-white text-slate-900 p-1.5 rounded-full hover:bg-blue-600 hover:text-white hover:scale-110 cursor-pointer shadow-lg transition-all" title="Descargar"><Download className="h-4 w-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); setConfirmDelete(item.id); }} className="bg-rose-600 text-white p-1.5 rounded-full hover:bg-rose-700 hover:scale-110 cursor-pointer shadow-lg transition-all" title="Eliminar"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    )}
                    {item.esPrincipal ? (
                      <div className="absolute bottom-3 left-3 px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg flex items-center gap-1.5 z-30"><CheckCircle2 className="h-3 w-3" />Portada</div>
                    ) : (
                      selectedMediaIds.size === 0 && <button onClick={(e) => handleSetCover(e, item.id)} disabled={!!isUpdatingCover} className="absolute bottom-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-md text-slate-900 text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600 hover:text-white cursor-pointer disabled:cursor-not-allowed z-30">{isUpdatingCover === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Star className="h-3.5 w-3.5" />}Poner Portada</button>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-4 z-20"><span className="text-[10px] font-bold text-white uppercase tracking-wider">Imagen #{item.orden}</span></div>
                  </div>
                ))}
              </div>
            ) : (!isUploading(id) && <div className="flex flex-col items-center justify-center py-16 text-slate-300 border-2 border-slate-50 rounded-[40px] bg-slate-50/20"><ImageIcon className="h-20 w-20 mb-4 opacity-10" /><p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Sin contenido visual</p></div>)}
          </div>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => !isDeleting && setConfirmDelete(null)} />
          <div className="relative bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300 border border-slate-100 text-center">
            <div className="h-16 w-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 mx-auto"><Trash2 className="h-8 w-8 text-rose-500" /></div>
            <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">¿Eliminar esta imagen?</h3>
            <p className="text-slate-500 text-sm font-medium mb-8">Esta acción es permanente y eliminará el archivo del servidor.</p>
            <div className="flex gap-3"><button disabled={!!isDeleting} onClick={() => setConfirmDelete(null)} className="flex-1 py-3 text-slate-500 font-bold text-sm cursor-pointer">Cancelar</button><button disabled={!!isDeleting} onClick={() => handleDeleteImage(confirmDelete)} className="flex-[2] py-3 bg-rose-600 text-white font-black rounded-xl hover:bg-rose-700 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer">{isDeleting ? <><Loader2 className="h-4 w-4 animate-spin" />Borrando...</> : 'Sí, eliminar'}</button></div>
          </div>
        </div>
      )}

      {confirmDeleteSelected && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => !isDeletingAll && setConfirmDeleteSelected(false)} />
          <div className="relative bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300 border border-slate-100 text-center">
            <div className="h-20 w-20 bg-rose-50 rounded-3xl flex items-center justify-center mb-6 mx-auto"><Trash2 className="h-10 w-10 text-rose-500" /></div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">¿Eliminar selección?</h3>
            <p className="text-slate-500 text-sm mb-8">Estás a punto de eliminar <strong>{selectedMediaIds.size} imágenes</strong>.</p>
            <div className="flex flex-col gap-3"><button disabled={isDeletingAll} onClick={handleDeleteSelected} className="w-full py-4 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-700 transition-all shadow-xl flex items-center justify-center gap-3 cursor-pointer">{isDeletingAll ? <><Loader2 className="h-5 w-5 animate-spin" />Borrando...</> : 'Sí, eliminar seleccionadas'}</button><button disabled={isDeletingAll} onClick={() => setConfirmDeleteSelected(false)} className="w-full py-3 text-slate-400 font-bold text-sm cursor-pointer">Cancelar</button></div>
          </div>
        </div>
      )}

      {confirmDeleteAll && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => !isDeletingAll && setConfirmDeleteAll(false)} />
          <div className="relative bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300 border border-slate-100 text-center">
            <div className="h-20 w-20 bg-rose-100 rounded-3xl flex items-center justify-center mb-6 mx-auto rotate-3"><Library className="h-10 w-10 text-rose-600" /></div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">¿Borrar toda la galería?</h3>
            <p className="text-slate-500 text-sm mb-8">Eliminarás <strong>todas las imágenes</strong>. Esta acción es irreversible.</p>
            <div className="flex flex-col gap-3"><button disabled={isDeletingAll} onClick={handleDeleteAll} className="w-full py-4 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-700 transition-all shadow-xl flex items-center justify-center gap-3 cursor-pointer">{isDeletingAll ? <><Loader2 className="h-5 w-5 animate-spin" />Borrando...</> : <><Trash2 className="h-5 w-5" />Sí, vaciar galería</>}</button><button disabled={isDeletingAll} onClick={() => setConfirmDeleteAll(false)} className="w-full py-3 text-slate-400 font-bold text-sm cursor-pointer">No, mantener imágenes</button></div>
          </div>
        </div>
      )}

      {statusConfirmation && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center">
              <div className="h-20 w-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6"><AlertCircle className="h-10 w-10 text-rose-600" /></div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">¿Confirmar estado {statusConfirmation}?</h3>
              <p className="text-slate-500 font-medium mb-8">Se eliminarán permanentemente todas las imágenes, <span className="text-rose-600 font-bold">excepto la foto de portada</span>.</p>
              <div className="flex flex-col sm:flex-row gap-3"><button onClick={() => setStatusConfirmation(null)} className="flex-1 px-6 py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl cursor-pointer">Cancelar</button><button onClick={() => handleStatusChange(statusConfirmation, true)} className="flex-1 px-6 py-4 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-700 shadow-xl cursor-pointer">Sí, confirmar</button></div>
            </div>
            <div className="bg-slate-50 p-4 border-t border-slate-100"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Acción permanente de limpieza</p></div>
          </div>
        </div>
      )}
    </div>
  );
};

export const PropiedadDetalle = (props: PropiedadDetalleProps) => {
  return (
    <SWRConfig value={{ provider: localStorageProvider }}>
      <PropiedadDetalleContent {...props} />
    </SWRConfig>
  );
};
