import { useState } from 'react';
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
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { getPropiedadById } from '../api/getPropiedadById';
import { CrearPropiedadForm } from './CrearPropiedadForm';
import { actualizarEstadoPropiedad } from '../api/actualizarEstadoPropiedad';
import { limpiarImagenesPropiedad } from '../api/limpiarImagenesPropiedad';
import { establecerImagenPrincipal } from '../api/establecerImagenPrincipal';
import { deleteImagenPropiedad } from '../api/deleteImagenPropiedad';
import { deleteImagenesSeleccionadas } from '../api/deleteImagenesSeleccionadas';
import { crearSeccion } from '../api/crearSeccion';
import { eliminarSeccion } from '../api/eliminarSeccion';
import { actualizarSeccion } from '../api/actualizarSeccion';
import { localStorageProvider, swrDefaultConfig } from '@/lib/swr';
import { SectionalGallery } from './SectionalGallery';
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

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [statusConfirmation, setStatusConfirmation] = useState<string | null>(null);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

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
      onAutoClose: async () => {
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
      }
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
    if (!newSectionName.trim()) {
      setIsCreatingInline(false);
      return;
    }

    try {
      setIsAddingSection(true);
      const orden = (propiedad?.secciones?.length || 0) + 1;
      await crearSeccion(id, newSectionName, orden);
      mutate();
      setIsCreatingInline(false);
      setNewSectionName('');
      toast.success("Sección creada");
    } catch {
      toast.error("Error al crear sección");
    } finally {
      setIsAddingSection(false);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      await eliminarSeccion(sectionId);
      mutate();
      toast.success("Sección eliminada");
    } catch {
      toast.error("Error al eliminar sección");
    }
  };

  const handleRenameSection = async (sectionId: string, nombre: string, descripcion: string | null) => {
    try {
      await actualizarSeccion(sectionId, nombre, descripcion, 0);
      mutate();
    } catch {
      toast.error("Error al actualizar sección");
    }
  };

  const handleClearGallery = async () => {
    try {
      await limpiarImagenesPropiedad(id);
      mutate();
      toast.success("Galería general limpia (portada preservada)");
    } catch {
      toast.error("Error al limpiar la galería");
    }
  };

  const handleStatusChange = async (nuevoEstado: string, confirmed = false) => {
    if (!propiedad || propiedad.estadoComercial === nuevoEstado) return;
    setIsStatusDropdownOpen(false);

    if ((nuevoEstado === 'Vendida' || nuevoEstado === 'Inactiva') && !confirmed) {
      setStatusConfirmation(nuevoEstado);
      return;
    }

    setStatusConfirmation(null);

    try {
      setIsUpdatingStatus(true);
      if (confirmed) {
        await actualizarEstadoPropiedad(propiedad.id, nuevoEstado);
        await limpiarImagenesPropiedad(propiedad.id);
        toast.success("Propiedad cerrada y galería depurada");
      } else {
        await actualizarEstadoPropiedad(propiedad.id, nuevoEstado);
        toast.success(`Estado: ${nuevoEstado}`);
      }
      mutate();
    } catch {
      toast.error("Error al cambiar estado");
    } finally {
      setIsUpdatingStatus(false);
    }
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
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" onClick={onClose} />
      
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
            <button 
              onClick={() => setShowEditModal(true)}
              className="px-4 py-1.5 bg-white border-2 border-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:border-slate-200 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Pencil className="h-3 w-3 text-indigo-600" />
              Editar
            </button>
            
            {/* Dropdown de Estado */}
            <div className="relative">
              <button 
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)} 
                disabled={isUpdatingStatus} 
                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50 ${propiedad.estadoComercial === 'Disponible' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-white'}`}
              >
                {isUpdatingStatus ? <Loader2 className="h-3 w-3 animate-spin" /> : propiedad.estadoComercial}
                <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isStatusDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[100] py-2 animate-in fade-in zoom-in duration-200 origin-top-right backdrop-blur-xl bg-white/95">
                  {ESTADOS.map((estado) => (
                    <button key={estado.value} onClick={() => handleStatusChange(estado.value)} className={`w-full px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide flex items-center justify-between transition-colors hover:bg-slate-50 cursor-pointer ${propiedad.estadoComercial === estado.value ? 'text-indigo-600 bg-indigo-50/30' : 'text-slate-600'}`}>{estado.label}{propiedad.estadoComercial === estado.value && <Check className="h-3.5 w-3.5" />}</button>
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
                {propiedad.esCaptacionPropia && (
                  <span className="text-[10px] font-black text-white bg-indigo-600 px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center gap-1">
                    <Handshake className="h-3 w-3" /> Captación Propia
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-black text-slate-900 leading-tight tracking-tight">{propiedad.titulo}</h1>
              <div className="flex items-center gap-2 text-slate-500 mt-4"><MapPin className="h-5 w-5 text-indigo-600" /><span className="text-lg font-bold italic">{propiedad.direccion}</span></div>
            </div>
            <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 flex flex-col items-end min-w-[200px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Precio de Lista</p>
              <p className="text-4xl font-black text-indigo-600 tracking-tight">{formatCurrency(propiedad.precio)}</p>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[
              { label: 'Habitaciones', value: propiedad.habitaciones, icon: Bed, color: 'blue' },
              { label: 'Baños', value: propiedad.banos, icon: Bath, color: 'emerald' },
              { label: 'Área Total', value: `${propiedad.areaTotal} m²`, icon: Maximize, color: 'amber' },
              { label: 'Comisión', value: `${propiedad.porcentajeComision}%`, icon: Handshake, color: 'indigo' },
              { label: 'Ingreso', value: formatDate(propiedad.fechaIngreso), icon: Clock, color: 'slate' }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 group hover:border-indigo-100 transition-all">
                <div className={`h-10 w-10 bg-${stat.color}-50 rounded-xl flex items-center justify-center text-${stat.color}-600 group-hover:bg-${stat.color}-600 group-hover:text-white transition-all`}><stat.icon className="h-5 w-5" /></div>
                <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p><p className="text-lg font-black text-slate-900">{stat.value}</p></div>
              </div>
            ))}
          </div>

          {/* Galería Estructurada */}
          <div className="space-y-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><div className="h-8 w-1 bg-indigo-600 rounded-full"></div><h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Galerías del Inmueble</h3></div>
              <button 
                onClick={handleAddSection}
                disabled={isCreatingInline}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Plus size={16} />
                Nueva Sección
              </button>
            </div>

            {/* Galería General */}
            <SectionalGallery 
              propiedadId={id}
              propiedadTitulo={propiedad.titulo}
              media={propiedad.mediaSinSeccion || []}
              onSetCover={handleSetCover}
              onDeleteMedia={handleDeleteMedia}
              onImageUploaded={() => mutate()}
              onClearGallery={handleClearGallery}
            />

            {/* Secciones Dinámicas */}
            {propiedad.secciones?.map((seccion) => (
              <SectionalGallery 
                key={seccion.id}
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
                onRenameSection={handleRenameSection}
              />
            ))}

            {/* Input Inline para Nueva Sección - World Class UX */}
            {isCreatingInline && (
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
