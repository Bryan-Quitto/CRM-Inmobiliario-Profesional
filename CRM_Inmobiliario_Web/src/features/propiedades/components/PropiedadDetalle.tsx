import { useEffect, useState } from 'react';
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
  FileDown
} from 'lucide-react';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';
import JSZip from 'jszip';
import { getPropiedadById } from '../api/getPropiedadById';
import { uploadImagenPropiedad } from '../api/uploadImagenPropiedad';
import { establecerImagenPrincipal } from '../api/establecerImagenPrincipal';
import { deleteImagenPropiedad } from '../api/deleteImagenPropiedad';
import { deleteTodasLasImagenes } from '../api/deleteTodasLasImagenes';
import { deleteImagenesSeleccionadas } from '../api/deleteImagenesSeleccionadas';
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

export const PropiedadDetalle = ({ id, onClose, onCoverUpdated }: PropiedadDetalleProps) => {
  const [propiedad, setPropiedad] = useState<Propiedad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdatingCover, setIsUpdatingCover] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [confirmDeleteSelected, setConfirmDeleteSelected] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const fetchDetalles = async () => {
      try {
        setLoading(true);
        const data = await getPropiedadById(id);
        setPropiedad(data);
      } catch (err) {
        console.error('Error al cargar detalles de la propiedad:', err);
        setError('No se pudo cargar la información de la propiedad.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetalles();
  }, [id]);

  const handleFiles = async (files: FileList | File[]) => {
    if (!propiedad || files.length === 0) return;
    
    const filesArray = Array.from(files);
    setIsUploading(true);
    
    try {
      // Procesamos cada archivo secuencialmente para no saturar el navegador con la compresión
      for (const file of filesArray) {
        // Validación de tamaño máximo (30 MB)
        const MAX_SIZE_MB = 30;
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          toast.error(`${file.name}: Se permite una imagen de hasta máximo ${MAX_SIZE_MB} MB`);
          continue;
        }

        // Opciones de compresión
        const options = {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: 'image/webp'
        };

        const compressedBlob = await imageCompression(file, options);
        const fileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
        const finalFile = new File([compressedBlob], fileName, {
          type: 'image/webp',
          lastModified: Date.now(),
        });

        const result = await uploadImagenPropiedad(propiedad.id, finalFile);
        
        // Actualizar el estado local agregando la imagen una por una
        setPropiedad(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            media: [...(prev.media || []), {
              id: result.id,
              propiedadId: prev.id,
              tipoMultimedia: 'Imagen',
              urlPublica: result.urlPublica,
              esPrincipal: result.esPrincipal,
              orden: (prev.media?.length || 0) + 1
            }]
          };
        });
      }
      toast.success('Todas las imágenes han sido procesadas y subidas');
    } catch (err: any) {
      console.error('Error al procesar imágenes:', err);
      const errorMessage = err.response?.data?.detail || err.response?.data || 'Error al subir una o más imágenes.';
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isUploading) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isUploading && e.dataTransfer.files) {
      await handleFiles(e.dataTransfer.files);
    }
  };

  const handleSetCover = async (e: React.MouseEvent, imagenId: string) => {
    e.stopPropagation();
    if (!propiedad) return;
    
    try {
      setIsUpdatingCover(imagenId);
      await establecerImagenPrincipal(propiedad.id, imagenId);
      
      // Actualizar estado local del detalle
      const mediaActualizada = propiedad.media?.map(m => ({
        ...m,
        esPrincipal: m.id === imagenId
      }));

      setPropiedad({
        ...propiedad,
        media: mediaActualizada
      });

      // Notificar al padre (lista) para actualizar la UI en tiempo real
      const nuevaImagen = mediaActualizada?.find(m => m.id === imagenId);
      if (nuevaImagen && onCoverUpdated) {
        onCoverUpdated(nuevaImagen.urlPublica);
      }

      toast.success('Imagen de portada actualizada');
    } catch (err: any) {
      console.error('Error al establecer portada:', err);
      const msg = err.response?.data?.detail || err.message || 'Error desconocido';
      toast.error(`No se pudo actualizar la portada: ${msg}`);
    } finally {
      setIsUpdatingCover(null);
    }
  };

  const handleDeleteImage = async (imagenId: string) => {
    if (!propiedad) return;
    
    try {
      setIsDeleting(imagenId);
      await deleteImagenPropiedad(propiedad.id, imagenId);
      
      // Actualizar estado local eliminando la imagen
      const mediaActualizada = propiedad.media?.filter(m => m.id !== imagenId);
      setPropiedad({
        ...propiedad,
        media: mediaActualizada
      });

      // Si la imagen borrada era la principal, notificar al padre para limpiar la portada en la lista
      const imagenBorrada = propiedad.media?.find(m => m.id === imagenId);
      if (imagenBorrada?.esPrincipal && onCoverUpdated) {
        onCoverUpdated(''); // O una URL por defecto
      }

      toast.success('Imagen eliminada correctamente');
    } catch (err: any) {
      console.error('Error al eliminar imagen:', err);
      const msg = err.response?.data?.detail || err.message || 'Error desconocido';
      toast.error(`No se pudo eliminar la imagen: ${msg}`);
    } finally {
      setIsDeleting(null);
      setConfirmDelete(null);
    }
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
    if (!propiedad) return;
    
    try {
      setIsDeletingAll(true);
      await deleteTodasLasImagenes(propiedad.id);
      
      // Vaciar galería localmente
      setPropiedad({
        ...propiedad,
        media: []
      });

      // Notificar al padre para limpiar la portada en la lista
      if (onCoverUpdated) {
        onCoverUpdated('');
      }

      toast.success('Todas las imágenes han sido eliminadas');
    } catch (err: any) {
      console.error('Error al eliminar todas las imágenes:', err);
      const msg = err.response?.data?.detail || err.message || 'Error desconocido';
      toast.error(`No se pudieron eliminar las imágenes: ${msg}`);
    } finally {
      setIsDeletingAll(false);
      setConfirmDeleteAll(false);
      setSelectedMediaIds(new Set());
    }
  };

  const handleDeleteSelected = async () => {
    if (!propiedad || selectedMediaIds.size === 0) return;
    
    try {
      setIsDeletingAll(true); // Reutilizamos el estado de carga masiva
      const idsArray = Array.from(selectedMediaIds);
      await deleteImagenesSeleccionadas(propiedad.id, idsArray);
      
      // Actualizar galería localmente filtrando los IDs borrados
      const mediaActualizada = propiedad.media?.filter(m => !selectedMediaIds.has(m.id));
      setPropiedad({
        ...propiedad,
        media: mediaActualizada
      });

      // Si alguna de las borradas era la principal, limpiar portada
      const algunaPrincipal = propiedad.media?.some(m => selectedMediaIds.has(m.id) && m.esPrincipal);
      if (algunaPrincipal && onCoverUpdated) {
        onCoverUpdated('');
      }

      toast.success(`${selectedMediaIds.size} imágenes eliminadas correctamente`);
    } catch (err: any) {
      console.error('Error al eliminar selección:', err);
      const msg = err.response?.data?.detail || err.message || 'Error desconocido';
      toast.error(`No se pudieron eliminar las imágenes: ${msg}`);
    } finally {
      setIsDeletingAll(false);
      setConfirmDeleteSelected(false);
      setSelectedMediaIds(new Set());
    }
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

  const handleBulkDownload = async (mediaToDownload: any[], zipName: string) => {
    if (mediaToDownload.length === 0) return;
    
    try {
      setIsDownloading(true);
      const toastId = toast.loading(`Preparando descarga de ${mediaToDownload.length} imágenes...`);
      
      const zip = new JSZip();
      
      // Descargamos todas las imágenes y las añadimos al ZIP
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

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full md:w-[700px] lg:w-[850px] bg-white h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-500 ease-out">
        {/* Header Fijo */}
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-900 cursor-pointer"
            >
              <X className="h-6 w-6" />
            </button>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Detalles del Inmueble</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {id.split('-')[0]}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {propiedad && (
              <>
                <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${getStatusBadgeStyles(propiedad.estadoComercial)}`}>
                  {propiedad.estadoComercial}
                </span>
                <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                  {propiedad.operacion}
                </span>
              </>
            )}
          </div>
        </div>

        {loading ? (
          <div className="h-[calc(100vh-80px)] flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">Cargando información...</p>
          </div>
        ) : error || !propiedad ? (
          <div className="h-[calc(100vh-80px)] flex flex-col items-center justify-center p-8 text-center">
            <div className="h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center mb-6">
              <Info className="h-10 w-10 text-rose-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">¡Ups! Algo salió mal</h3>
            <p className="text-slate-500 max-w-xs">{error || 'No se encontró la propiedad solicitada.'}</p>
            <button 
              onClick={onClose}
              className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-sm hover:bg-slate-800 transition-all cursor-pointer"
            >
              Cerrar Panel
            </button>
          </div>
        ) : (
          <div className="p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Título y Precio */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-widest">
                    {propiedad.tipoPropiedad}
                  </span>
                </div>
                <h1 className="text-4xl font-black text-slate-900 leading-tight tracking-tight">
                  {propiedad.titulo}
                </h1>
                <div className="flex items-center gap-2 text-slate-500 mt-4">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <span className="text-lg font-bold italic">{propiedad.direccion}</span>
                </div>
                <div className="text-slate-400 text-sm font-medium ml-7">
                  {propiedad.sector}, {propiedad.ciudad}
                </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col items-end min-w-[200px]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Precio de Lista</p>
                <p className="text-4xl font-black text-blue-600 tracking-tight">
                  {formatCurrency(propiedad.precio)}
                </p>
              </div>
            </div>

            {/* Grid de Características */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Habitaciones', value: propiedad.habitaciones, icon: Bed, color: 'blue' },
                { label: 'Baños', value: propiedad.banos, icon: Bath, color: 'emerald' },
                { label: 'Área Total', value: `${propiedad.areaTotal} m²`, icon: Maximize, color: 'amber' },
                { label: 'Ingreso', value: formatDate(propiedad.fechaIngreso), icon: Clock, color: 'slate' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 group hover:border-blue-100 transition-all">
                  <div className={`h-10 w-10 bg-${stat.color}-50 rounded-xl flex items-center justify-center text-${stat.color}-600 group-hover:bg-${stat.color}-600 group-hover:text-white transition-all`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-lg font-black text-slate-900">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Descripción */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-1 bg-blue-600 rounded-full"></div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Descripción General</h3>
              </div>
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Building2 className="h-16 w-16 text-slate-900" />
                </div>
                <p className="text-slate-600 leading-relaxed text-lg font-medium whitespace-pre-line relative z-10">
                  {propiedad.descripcion}
                </p>
              </div>
            </div>

            {/* Galería e Imágenes */}
            <div className="space-y-4 pb-12">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-1 bg-blue-600 rounded-full"></div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight text-nowrap">Galería de Imágenes</h3>
                </div>
                
                <div className="flex items-center gap-3">
                  {propiedad.media && propiedad.media.length > 0 && (
                    <>
                      {/* Botón Contextual de Descarga */}
                      <button
                        disabled={isDownloading}
                        onClick={() => {
                          if (selectedMediaIds.size > 0) {
                            const selectedItems = propiedad.media?.filter(m => selectedMediaIds.has(m.id)) || [];
                            handleBulkDownload(selectedItems, `seleccion_propiedad_${propiedad.id.split('-')[0]}`);
                          } else {
                            handleBulkDownload(propiedad.media || [], `todas_propiedad_${propiedad.id.split('-')[0]}`);
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-blue-100 transition-all cursor-pointer border border-blue-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100"
                      >
                        {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
                        {selectedMediaIds.size > 0 ? `Descargar Selección (${selectedMediaIds.size})` : 'Descargar Todas'}
                      </button>

                      {/* Botón Contextual de Eliminación */}
                      <button
                        onClick={() => selectedMediaIds.size > 0 ? setConfirmDeleteSelected(true) : setConfirmDeleteAll(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-rose-100 transition-all cursor-pointer border border-rose-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {selectedMediaIds.size > 0 ? `Eliminar Selección (${selectedMediaIds.size})` : 'Eliminar Todas'}
                      </button>
                    </>
                  )}

                  {selectedMediaIds.size > 0 && (
                    <button
                      onClick={() => setSelectedMediaIds(new Set())}
                      className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors cursor-pointer px-2 py-1"
                    >
                      Limpiar Selección
                    </button>
                  )}
                </div>
              </div>
              <div className="h-px w-full bg-slate-100 hidden md:block"></div>
              
              {/* Zona de Carga (Drag & Drop style) */}
              <div className="relative group">
                <label 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`
                    relative border-4 border-dashed rounded-[40px] h-48 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer overflow-hidden
                    ${isUploading ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : 
                      isDragging ? 'bg-blue-50 border-blue-500 scale-[1.02] shadow-2xl shadow-blue-200/50' : 
                      'border-slate-100 bg-slate-50/50 hover:bg-blue-50/30 hover:border-blue-400'}
                  `}
                >
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/jpeg,image/png,image/webp,image/jpg" 
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    multiple
                  />
                  
                  {isUploading ? (
                    <>
                      <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                      <p className="text-blue-600 font-black text-sm uppercase tracking-widest animate-pulse">Subiendo archivo...</p>
                    </>
                  ) : (
                    <>
                      <div className={`h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-xl shadow-slate-200/50 transition-all duration-500 ${isDragging ? 'scale-125 rotate-6 text-blue-600' : 'group-hover:scale-110 group-hover:rotate-3'}`}>
                        <Upload className={`h-8 w-8 transition-colors ${isDragging ? 'text-blue-600' : 'text-slate-300 group-hover:text-blue-500'}`} />
                      </div>
                      <div className="text-center px-4">
                        <p className="text-slate-900 font-black text-lg tracking-tight">
                          {isDragging ? '¡Suelta para subir!' : 'Haz clic o arrastra imágenes'}
                        </p>
                        <p className="text-slate-400 font-bold text-xs italic mt-1 text-balance">Formatos: JPG, JPEG, PNG, WEBP (Máx. 30MB)</p>
                      </div>
                    </>
                  )}
                  
                  {/* Floating decorative dots */}
                  {!isUploading && (
                    <>
                      <div className="absolute top-6 left-6 h-2 w-2 bg-slate-200 rounded-full"></div>
                      <div className="absolute bottom-6 right-6 h-3 w-3 bg-blue-100 rounded-full"></div>
                    </>
                  )}
                </label>
              </div>

              {/* Cuadrícula de Galería */}
              {propiedad.media && propiedad.media.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8">
                  {propiedad.media.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => handleToggleSelection(item.id)}
                      className={`
                        group relative aspect-video rounded-3xl overflow-hidden border-2 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer
                        ${selectedMediaIds.has(item.id) ? 'border-blue-600 ring-4 ring-blue-600/20' : 'border-slate-100'}
                      `}
                    >
                      <img 
                        src={item.urlPublica} 
                        alt="Multimedia propiedad" 
                        className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 ${selectedMediaIds.has(item.id) ? 'opacity-90' : ''}`}
                      />

                      {/* Selector Visual (Checkbox style) */}
                      <div className={`
                        absolute top-3 left-3 h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all z-40
                        ${selectedMediaIds.has(item.id) ? 'bg-blue-600 border-blue-600 text-white scale-110' : 'bg-white/40 border-white opacity-0 group-hover:opacity-100 text-transparent'}
                      `}>
                        <Check className="h-4 w-4 stroke-[3px]" />
                      </div>

                      {/* Botón de Borrar (Solo si no hay multi-selección o si se quiere acción rápida) */}
                      {!selectedMediaIds.has(item.id) && selectedMediaIds.size === 0 && (
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all z-40">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadSingle(item.urlPublica, `propiedad_${propiedad.id.split('-')[0]}_img_${item.orden}.webp`);
                            }}
                            className="bg-white text-slate-900 p-1.5 rounded-full hover:bg-blue-600 hover:text-white hover:scale-110 cursor-pointer shadow-lg transition-all"
                            title="Descargar imagen"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete(item.id);
                            }}
                            className="bg-rose-600 text-white p-1.5 rounded-full hover:bg-rose-700 hover:scale-110 cursor-pointer shadow-lg transition-all"
                            title="Eliminar imagen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      
                      {/* Badge / Botón de Portada */}
                      {item.esPrincipal ? (
                        <div className="absolute bottom-3 left-3 px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg flex items-center gap-1.5 z-30">
                          <CheckCircle2 className="h-3 w-3" />
                          Portada
                        </div>
                      ) : (
                        selectedMediaIds.size === 0 && (
                          <button 
                            onClick={(e) => handleSetCover(e, item.id)}
                            disabled={!!isUpdatingCover}
                            className="absolute bottom-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-md text-slate-900 text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600 hover:text-white cursor-pointer disabled:cursor-not-allowed z-30"
                          >
                            {isUpdatingCover === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Star className="h-3.5 w-3.5" />
                            )}
                            Poner Portada
                          </button>
                        )
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-4 z-20">
                         <span className="text-[10px] font-bold text-white uppercase tracking-wider">Imagen #{item.orden}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                !isUploading && (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-300 border-2 border-slate-50 rounded-[40px] bg-slate-50/20">
                    <ImageIcon className="h-20 w-20 mb-4 opacity-10" />
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Sin contenido visual</p>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Confirmación de Borrado */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => !isDeleting && setConfirmDelete(null)}
          />
          <div className="relative bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300 border border-slate-100">
            <div className="h-16 w-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Trash2 className="h-8 w-8 text-rose-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900 text-center mb-2 tracking-tight">¿Eliminar esta imagen?</h3>
            <p className="text-slate-500 text-center text-sm font-medium leading-relaxed mb-8">
              Esta acción es permanente y eliminará el archivo de nuestros servidores de forma definitiva.
            </p>
            <div className="flex gap-3">
              <button
                disabled={!!isDeleting}
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 text-slate-500 font-bold text-sm hover:text-slate-900 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                disabled={!!isDeleting}
                onClick={() => handleDeleteImage(confirmDelete)}
                className="flex-[2] py-3 bg-rose-600 text-white font-black rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Borrando...
                  </>
                ) : (
                  'Sí, eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Borrar Selección */}
      {confirmDeleteSelected && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => !isDeletingAll && setConfirmDeleteSelected(false)}
          />
          <div className="relative bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300 border border-slate-100 text-center">
            <div className="h-20 w-20 bg-rose-50 rounded-3xl flex items-center justify-center mb-6 mx-auto">
              <Trash2 className="h-10 w-10 text-rose-500" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">¿Eliminar selección?</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
              Estás a punto de eliminar <strong>{selectedMediaIds.size} imágenes seleccionadas</strong>. Esta acción no se puede deshacer.
            </p>
            <div className="flex flex-col gap-3">
              <button
                disabled={isDeletingAll}
                onClick={handleDeleteSelected}
                className="w-full py-4 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/30 flex items-center justify-center gap-3 cursor-pointer disabled:bg-slate-300"
              >
                {isDeletingAll ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Borrando selección...
                  </>
                ) : (
                  'Sí, eliminar seleccionadas'
                )}
              </button>
              <button
                disabled={isDeletingAll}
                onClick={() => setConfirmDeleteSelected(false)}
                className="w-full py-3 text-slate-400 font-bold text-sm hover:text-slate-900 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Borrar Todas */}
      {confirmDeleteAll && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => !isDeletingAll && setConfirmDeleteAll(false)}
          />
          <div className="relative bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300 border border-slate-100 text-center">
            <div className="h-20 w-20 bg-rose-100 rounded-3xl flex items-center justify-center mb-6 mx-auto rotate-3">
              <Library className="h-10 w-10 text-rose-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">¿Borrar toda la galería?</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
              Estás a punto de eliminar <strong>todas las imágenes ({propiedad?.media?.length})</strong> de esta propiedad. Esta acción es irreversible.
            </p>
            <div className="flex flex-col gap-3">
              <button
                disabled={isDeletingAll}
                onClick={handleDeleteAll}
                className="w-full py-4 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/30 flex items-center justify-center gap-3 cursor-pointer disabled:bg-slate-300"
              >
                {isDeletingAll ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Borrando galería completa...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-5 w-5" />
                    Sí, vaciar galería
                  </>
                )}
              </button>
              <button
                disabled={isDeletingAll}
                onClick={() => setConfirmDeleteAll(false)}
                className="w-full py-3 text-slate-400 font-bold text-sm hover:text-slate-900 transition-colors cursor-pointer"
              >
                No, mantener imágenes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
