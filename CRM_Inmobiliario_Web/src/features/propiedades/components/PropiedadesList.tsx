import { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import useSWR, { SWRConfig, useSWRConfig } from 'swr';
import Fuse from 'fuse.js';
import { 
  Home, 
  MapPin, 
  Image as ImageIcon, 
  Plus, 
  Search, 
  Filter as FilterIcon, 
  X, 
  Loader2, 
  TrendingUp, 
  Tag, 
  Building2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Check,
  Handshake,
  Pencil
} from 'lucide-react';
import { toast } from 'sonner';
import { getPropiedades } from '../api/getPropiedades';
import { actualizarEstadoPropiedad } from '../api/actualizarEstadoPropiedad';
import { limpiarImagenesPropiedad } from '../api/limpiarImagenesPropiedad';
import { CrearPropiedadForm } from './CrearPropiedadForm';
import { PropiedadDetalle } from './PropiedadDetalle';
import { ClosingModal } from './ClosingModal';
import { localStorageProvider, swrDefaultConfig } from '@/lib/swr';
import type { Propiedad } from '../types';

const ESTADOS = [
  { label: 'Disponible', value: 'Disponible', color: 'bg-emerald-500 border-emerald-400 text-white hover:bg-emerald-600' },
  { label: 'Reservada', value: 'Reservada', color: 'bg-amber-500 border-amber-400 text-white hover:bg-amber-600' },
  { label: 'Vendida', value: 'Vendida', color: 'bg-slate-700 border-slate-600 text-white hover:bg-slate-800' },
  { label: 'Alquilada', value: 'Alquilada', color: 'bg-blue-600 border-blue-500 text-white hover:bg-blue-700' },
  { label: 'Inactiva', value: 'Inactiva', color: 'bg-rose-500 border-rose-400 text-white hover:bg-rose-600' },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const SkeletonPropertyCard = () => (
  <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm animate-pulse">
    <div className="h-56 bg-slate-100 w-full"></div>
    <div className="p-6 space-y-4">
      <div className="flex gap-2">
        <div className="h-5 w-20 bg-slate-50 rounded-full"></div>
        <div className="h-5 w-16 bg-slate-50 rounded-full"></div>
      </div>
      <div className="space-y-2">
        <div className="h-6 w-3/4 bg-slate-100 rounded-md"></div>
        <div className="h-4 w-1/2 bg-slate-50 rounded-md"></div>
      </div>
      <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
        <div className="h-7 w-24 bg-slate-100 rounded-md"></div>
        <div className="h-5 w-5 bg-slate-50 rounded-full"></div>
      </div>
    </div>
  </div>
);

const PropertyStats = ({ total, venta, alquiler }: { total: number, venta: number, alquiler: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-blue-100 transition-all cursor-default">
      <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-all">
        <Building2 className="h-6 w-6" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Catálogo</p>
        <p className="text-2xl font-black text-slate-900">{total}</p>
      </div>
    </div>
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-emerald-100 transition-all cursor-default">
      <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-all">
        <TrendingUp className="h-6 w-6" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">En Venta</p>
        <p className="text-2xl font-black text-slate-900">{venta}</p>
      </div>
    </div>
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-amber-100 transition-all cursor-default">
      <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-all">
        <Tag className="h-6 w-6" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">En Alquiler</p>
        <p className="text-2xl font-black text-slate-900">{alquiler}</p>
      </div>
    </div>
  </div>
);

const PropiedadesContent = () => {
  const { mutate: globalMutate } = useSWRConfig();
  const { data: propiedades = [], isValidating: syncing, mutate } = useSWR<Propiedad[]>(
    '/propiedades',
    getPropiedades,
    swrDefaultConfig
  );

  const loading = !propiedades.length && !syncing;
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null); // 'filter' o id de propiedad
  const [statusConfirmation, setStatusConfirmation] = useState<{ id: string; nuevoEstado: string } | null>(null);
  const [closingPropiedad, setClosingPropiedad] = useState<{ propiedad: Propiedad; nuevoEstado: string } | null>(null);
  
  // SINGLE SOURCE OF TRUTH: El ID viene directamente de la URL
  const selectedPropiedadId = searchParams.get('id');
  const [selectedPropiedadIdForEdit, setSelectedPropiedadIdForEdit] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleOpenDetail = (id: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('id', id);
    setSearchParams(newParams);
  };

  const handleCloseDetail = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('id');
    setSearchParams(newParams);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState('Todos');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleStatusChange = async (id: string, nuevoEstado: string, confirmed = false) => {
    setOpenDropdownId(null);
    const propiedad = propiedades.find(p => p.id === id);
    if (!propiedad || propiedad.estadoComercial === nuevoEstado) return;

    // Caso de CIERRE (Venta/Alquiler)
    if ((nuevoEstado === 'Vendida' || nuevoEstado === 'Alquilada') && !confirmed) {
      setClosingPropiedad({ propiedad, nuevoEstado });
      return;
    }

    // Caso de INACTIVA (Limpieza simple)
    if (nuevoEstado === 'Inactiva' && !confirmed) {
      setStatusConfirmation({ id, nuevoEstado });
      return;
    }

    setStatusConfirmation(null);
    setClosingPropiedad(null);
    const optimisticData = propiedades.map(p => p.id === id ? { ...p, estadoComercial: nuevoEstado } : p);

    // CASO 1: Cambio normal (sin limpieza)
    if (!confirmed) {
      try {
        setUpdatingId(id);
        await mutate(actualizarEstadoPropiedad(id, nuevoEstado).then(() => optimisticData), {
          optimisticData,
          rollbackOnError: true,
          revalidate: true
        });
        toast.success(`Inmueble marcado como ${nuevoEstado}`);
        
        // Revalidación proactiva de analíticas y dashboard (UPSP)
        globalMutate('/dashboard/kpis');
        globalMutate(key => typeof key === 'string' && key.startsWith('/analitica/'));
      } catch {
        toast.error('No se pudo actualizar el estado.');
      } finally {
        setUpdatingId(null);
      }
      return;
    }

    // CASO 2: Cambio con limpieza (Vendida/Inactiva) - Usar Deshacer
    let isCancelled = false;
    const commitStatusChange = async () => {
      if (isCancelled) return;

      try {
        setUpdatingId(id);
        await actualizarEstadoPropiedad(id, nuevoEstado);
        await limpiarImagenesPropiedad(id);
        mutate();
        
        // Revalidación proactiva de analíticas y dashboard (UPSP)
        globalMutate('/dashboard/kpis');
        globalMutate(key => typeof key === 'string' && key.startsWith('/analitica/'));

        toast.success(`Propiedad "${propiedad.titulo}" actualizada y depurada.`);
      } catch {
        toast.error("Error al procesar el cambio de estado masivo.");
      } finally {
        setUpdatingId(null);
      }
    };

    toast.warning(`Estado: ${nuevoEstado}`, {
      description: "La galería ha sido depurada. Puedes deshacer esta acción.",
      action: {
        label: "Deshacer",
        onClick: () => {
          isCancelled = true;
          mutate(); // Vuelve a los datos originales de SWR
          toast.success("Cambio de estado cancelado");
        },
      },
      duration: 6000,
      onAutoClose: commitStatusChange,
      onDismiss: commitStatusChange
    });
    
    // Aplicamos cambio local visual inmediatamente mientras corre el timer del toast
    mutate(optimisticData, false);
  };

  const handleClosingConfirm = async (precioCierre: number, cerradoConId: string) => {
    if (!closingPropiedad) return;
    const { propiedad, nuevoEstado } = closingPropiedad;
    
    try {
      setUpdatingId(propiedad.id);
      await actualizarEstadoPropiedad(propiedad.id, nuevoEstado, precioCierre, cerradoConId);
      
      // Si es Vendida, también limpiamos la galería
      if (nuevoEstado === 'Vendida') {
        await limpiarImagenesPropiedad(propiedad.id);
      }
      
      await mutate();
      
      // Revalidación proactiva de analíticas y dashboard (UPSP)
      globalMutate('/dashboard/kpis');
      globalMutate(key => typeof key === 'string' && key.startsWith('/analitica/'));

      toast.success(`Propiedad ${nuevoEstado === 'Vendida' ? 'vendida' : 'alquilada'} con éxito`);
    } catch (error) {
      console.error('Error al cerrar:', error);
      throw error; // El modal maneja el error visual
    } finally {
      setUpdatingId(null);
      setClosingPropiedad(null);
    }
  };

  const handleCoverUpdate = (propiedadId: string, newUrl: string) => {
    mutate(
      propiedades.map(p => p.id === propiedadId ? { ...p, imagenPortadaUrl: newUrl } : p),
      false
    );
  };

  const getStatusStyles = (estado: string) => {
    const found = ESTADOS.find(e => e.value === estado);
    return found?.color || 'bg-slate-500 border-slate-400 text-white';
  };

  const fuse = useMemo(() => {
    return new Fuse(propiedades, {
      keys: [
        { name: 'titulo', weight: 0.6 },
        { name: 'sector', weight: 0.2 },
        { name: 'ciudad', weight: 0.2 }
      ],
      threshold: 0.3,
      distance: 100
    });
  }, [propiedades]);

  const filteredPropiedades = useMemo(() => {
    let result = propiedades;

    if (searchQuery.trim()) {
      result = fuse.search(searchQuery).map(r => r.item);
    }

    return result.filter(p => {
      const matchesEstado = filterEstado === 'Todos' || p.estadoComercial === filterEstado;
      return matchesEstado;
    });
  }, [propiedades, searchQuery, filterEstado, fuse]);

  const stats = useMemo(() => ({
    total: propiedades.length,
    venta: propiedades.filter(p => p.operacion === 'Venta').length,
    alquiler: propiedades.filter(p => p.operacion === 'Alquiler').length
  }), [propiedades]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 animate-in fade-in duration-500">
        {[1, 2, 3, 4, 5, 6].map(i => <SkeletonPropertyCard key={i} />)}
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans antialiased relative pb-20">
      {/* Indicador de Sincronización UPSP */}
      {syncing && propiedades.length > 0 && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900/90 backdrop-blur-xl text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10">
            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sincronizando Catálogo...</span>
          </div>
        </div>
      )}

      {notification && (
        <div className={`fixed bottom-8 right-8 z-[200] px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-bottom-10 duration-300 ${
          notification.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-rose-600 border-rose-500 text-white'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span className="font-bold text-sm tracking-tight">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 hover:bg-black/10 rounded-lg p-1 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Catálogo de Inmuebles</h2>
          <p className="text-slate-600 mt-1 font-medium italic">Explora y gestiona el inventario de propiedades.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:min-w-[300px]">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, sector o ciudad..." 
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>

          <div className="relative" ref={openDropdownId === 'filter' ? dropdownRef : null}>
            <button 
              onClick={() => setOpenDropdownId(openDropdownId === 'filter' ? null : 'filter')}
              className="flex items-center gap-3 pl-4 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-slate-300 transition-all shadow-sm cursor-pointer"
            >
              <FilterIcon className="h-4 w-4 text-slate-500" />
              <span>{filterEstado === 'Todos' ? 'Todos los estados' : filterEstado}</span>
              <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform duration-300 ${openDropdownId === 'filter' ? 'rotate-180' : ''}`} />
            </button>

            {openDropdownId === 'filter' && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] py-2 animate-in fade-in zoom-in duration-200 origin-top-right backdrop-blur-xl bg-white/95">
                <button
                  onClick={() => { setFilterEstado('Todos'); setOpenDropdownId(null); }}
                  className={`w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 cursor-pointer ${
                    filterEstado === 'Todos' ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                  }`}
                >
                  Todos los estados
                  {filterEstado === 'Todos' && <Check className="h-4 w-4" />}
                </button>
                {ESTADOS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { setFilterEstado(option.value); setOpenDropdownId(null); }}
                    className={`w-full px-4 py-2.5 text-left text-xs font-bold flex items-center justify-between transition-all hover:bg-slate-50 cursor-pointer ${
                      filterEstado === option.value ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                    }`}
                  >
                    {option.label}
                    {filterEstado === option.value && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 active:scale-95 cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            <span>Nueva Propiedad</span>
          </button>
        </div>
      </div>

      <PropertyStats total={stats.total} venta={stats.venta} alquiler={stats.alquiler} />

      {filteredPropiedades.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 py-32 text-center shadow-sm flex flex-col items-center">
          <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
            <Home className="h-10 w-10 text-slate-200" />
          </div>
          <p className="text-xl font-bold text-slate-900">Sin resultados</p>
          <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">
            No encontramos lo que buscas. Intenta con otros filtros.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 animate-in fade-in duration-500">
          {filteredPropiedades.map((p) => (
            <div 
              key={p.id} 
              onClick={() => handleOpenDetail(p.id)}
              className={`bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group relative cursor-pointer ${
                openDropdownId === p.id ? 'z-[60]' : 'z-10'
              }`}
            >
              {syncing && <div className="absolute inset-0 bg-white/5 backdrop-blur-[0.5px] pointer-events-none" />}
              
              <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2 z-30">
                <div className="relative" ref={openDropdownId === p.id ? dropdownRef : null}>
                  {updatingId === p.id ? (
                    <div className="px-3 py-1 bg-white/90 backdrop-blur-md border border-white/20 rounded-full flex items-center gap-2 shadow-sm">
                      <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">SYNC...</span>
                    </div>
                  ) : (
                    <>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(openDropdownId === p.id ? null : p.id);
                        }}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm cursor-pointer transition-all flex items-center gap-2 ${getStatusStyles(p.estadoComercial)}`}
                      >
                        {p.estadoComercial}
                        <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${openDropdownId === p.id ? 'rotate-180' : ''}`} />
                      </button>

                      {openDropdownId === p.id && (
                        <div className="absolute left-0 mt-2 w-40 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[100] py-2 animate-in fade-in zoom-in duration-200 origin-top-left backdrop-blur-xl bg-white/95">
                          {ESTADOS.map((estado) => (
                            <button
                              key={estado.value}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(p.id, estado.value);
                              }}
                              className={`w-full px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide flex items-center justify-between transition-colors hover:bg-slate-50 cursor-pointer ${
                                p.estadoComercial === estado.value ? 'text-blue-600 bg-blue-50/30' : 'text-slate-600'
                              }`}
                            >
                              {estado.label}
                              {p.estadoComercial === estado.value && <Check className="h-3.5 w-3.5" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
                <span className="px-3 py-1 bg-white/90 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-900 shadow-sm h-fit">
                  {p.operacion}
                </span>

                {p.esCaptacionPropia && (
                  <div className="px-3 py-1 bg-blue-600/90 backdrop-blur-md text-white rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-xl shadow-blue-600/20 border border-white/20 animate-in zoom-in-95 duration-500">
                    <Handshake className="h-3 w-3" />
                    Captación Propia
                  </div>
                )}
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPropiedadIdForEdit(p.id);
                }}
                className="absolute top-4 right-4 z-40 h-8 w-8 bg-white/90 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:scale-110 transition-all shadow-sm cursor-pointer opacity-0 group-hover:opacity-100"
                title="Editar Propiedad"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>

              <div className="h-56 bg-slate-200 relative overflow-hidden flex items-center justify-center rounded-t-3xl">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
                {p.imagenPortadaUrl ? (
                  <img 
                    src={p.imagenPortadaUrl} 
                    alt={p.titulo} 
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <ImageIcon className="h-12 w-12 text-slate-300 group-hover:scale-110 transition-transform duration-500" />
                )}
              </div>

              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-widest">
                    {p.tipoPropiedad}
                  </span>
                </div>
                
                <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate mb-1">
                  {p.titulo}
                </h3>
                
                <div className="flex items-center gap-1.5 text-slate-500 mb-6">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-bold truncate italic">{p.sector}, {p.ciudad}</span>
                </div>

                <div className="pt-5 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">
                      {formatCurrency(p.precio)}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-black uppercase tracking-widest border border-blue-100">
                        <Handshake className="h-2.5 w-2.5" />
                        Comisión: {p.porcentajeComision}%
                      </div>
                    </div>
                  </div>
                  <div 
                    className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all cursor-pointer border border-slate-100"
                  >
                    <Plus className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPropiedadId && (
        <PropiedadDetalle 
          id={selectedPropiedadId} 
          onClose={handleCloseDetail} 
          onCoverUpdated={(url) => handleCoverUpdate(selectedPropiedadId, url)}
        />
      )}

      {selectedPropiedadIdForEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <CrearPropiedadForm 
            initialData={propiedades?.find(p => p.id === selectedPropiedadIdForEdit)}
            onSuccess={() => {
              mutate();
              setSelectedPropiedadIdForEdit(null);
              toast.success('Propiedad actualizada con éxito');
            }}
            onCancel={() => setSelectedPropiedadIdForEdit(null)}
          />
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <CrearPropiedadForm 
            onSuccess={() => { 
              mutate(); 
              setIsModalOpen(false); 
              setNotification({ type: 'success', message: 'Inmueble registrado correctamente.' }); 
            }} 
            onCancel={() => setIsModalOpen(false)} 
          />
        </div>
      )}

      {statusConfirmation && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center">
              <div className="h-20 w-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-10 w-10 text-rose-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                ¿Confirmar estado {statusConfirmation.nuevoEstado}?
              </h3>
              <p className="text-slate-500 font-medium leading-relaxed mb-8">
                Al marcar esta propiedad como <span className="font-bold text-slate-900">{statusConfirmation.nuevoEstado}</span>, todas las imágenes de la galería serán eliminadas permanentemente para optimizar el almacenamiento, <span className="text-rose-600 font-bold">excepto la foto de portada</span>.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setStatusConfirmation(null)}
                  className="flex-1 px-6 py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all active:scale-95 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleStatusChange(statusConfirmation.id, statusConfirmation.nuevoEstado, true)}
                  className="flex-1 px-6 py-4 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-700 transition-all shadow-xl shadow-rose-600/20 active:scale-95 cursor-pointer"
                >
                  Sí, confirmar
                </button>
              </div>
            </div>
            <div className="bg-slate-50 p-4 border-t border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Esta acción es irreversible</p>
            </div>
          </div>
        </div>
      )}

      <ClosingModal
        key={closingPropiedad?.propiedad.id || 'closed'}
        isOpen={!!closingPropiedad}
        onClose={() => setClosingPropiedad(null)}
        onConfirm={handleClosingConfirm}
        tituloPropiedad={closingPropiedad?.propiedad.titulo || ''}
        precioSugerido={closingPropiedad?.propiedad.precio || 0}
        tipoOperacion={closingPropiedad?.propiedad.operacion || 'Venta'}
      />
    </div>
  );
};

export const PropiedadesList = () => {
  return (
    <SWRConfig value={{ provider: localStorageProvider }}>
      <PropiedadesContent />
    </SWRConfig>
  );
};
