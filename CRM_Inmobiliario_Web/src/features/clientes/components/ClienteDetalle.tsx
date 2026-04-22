import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSWR, { useSWRConfig } from 'swr';
import { 
  Mail, 
  Phone, 
  Clock, 
  ChevronLeft, 
  Loader2, 
  Plus, 
  Search, 
  Filter as FilterIcon, 
  MessageSquare,
  Send,
  Trash2,
  X,
  Check,
  Building2,
  Pencil,
  Tag,
  ExternalLink,
  PhoneCall,
  ChevronDown,
  History,
  RotateCcw,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { getClienteById } from '../api/getClienteById';
import { registrarInteraccion } from '../api/registrarInteraccion';
import { getPropiedades } from '../../propiedades/api/getPropiedades';
import { vincularPropiedad } from '../api/vincularPropiedad';
import { desvincularPropiedad } from '../api/desvincularPropiedad';
import { actualizarEtapaCliente } from '../api/actualizarEtapaCliente';
import { revertirEstadoCliente } from '../api/revertirEstadoCliente';
import { DynamicSearchSelect } from '@/components/DynamicSearchSelect';
import { ClosingModal } from '../../propiedades/components/ClosingModal';
import { actualizarInteraccion } from '../api/actualizarInteraccion';
import { eliminarInteraccion } from '../api/eliminarInteraccion';
import { toast } from 'sonner';
import type { Cliente, Interaccion, Interes } from '../types';

const ETAPAS = [
  { label: 'Nuevo', value: 'Nuevo', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  { label: 'Contactado', value: 'Contactado', color: 'bg-amber-50 text-amber-700 border-amber-100' },
  { label: 'En Negociación', value: 'En Negociación', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  { label: 'Cerrado', value: 'Cerrado', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { label: 'Perdido', value: 'Perdido', color: 'bg-rose-50 text-rose-700 border-rose-100' },
];

const TIPO_NOTA_OPCIONES = [
  { label: 'Nota', value: 'Nota' },
  { label: 'Llamada', value: 'Llamada' },
  { label: 'WhatsApp', value: 'WhatsApp' },
  { label: 'Visita', value: 'Visita' },
  { label: 'Correo', value: 'Correo' }
];

const NIVELES_INTERES = [
  { label: 'Alto 🔥', value: 'Alto', color: 'text-rose-600 bg-rose-50' },
  { label: 'Medio ⚡', value: 'Medio', color: 'text-amber-600 bg-amber-50' },
  { label: 'Bajo ❄️', value: 'Bajo', color: 'text-blue-600 bg-blue-50' },
  { label: 'Descartada ❌', value: 'Descartada', color: 'text-slate-400 bg-slate-50' }
];

export const ClienteDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mutate: globalMutate } = useSWRConfig();
  const { data: cliente, error, isLoading, mutate } = useSWR<Cliente>(
    id ? `/clientes/${id}` : null,
    () => getClienteById(id!)
  );

  const { data: propiedadesDisponibles } = useSWR('/propiedades', getPropiedades);
  
  const propiedadesOptions = useMemo(() => {
    if (!propiedadesDisponibles) return undefined;
    return propiedadesDisponibles.map(p => ({
      id: p.id,
      title: p.titulo,
      subtitle: `${p.ciudad} - ${p.sector}`
    }));
  }, [propiedadesDisponibles]);

  const [nuevaNota, setNuevaNota] = useState('');
  const [tipoNota, setTipoNota] = useState('Nota');
  const [notaEnEdicion, setNotaEnEdicion] = useState<string | null>(null);
  const [isSavingNota, setIsSavingNota] = useState(false);
  const [searchHistorial, setSearchHistorial] = useState('');
  const [filterTipoTimeline, setFilterTipoTimeline] = useState('Todos');
  const [idInteraccionABorrar, setIdInteraccionABorrar] = useState<string | null>(null);

  // Estados para vinculación de propiedades
  const [updatingInteresId, setUpdatingInteresId] = useState<string | null>(null);
  const [propiedadPendienteId, setPropiedadPendienteId] = useState<string | null>(null);
  const [nivelInteresPendiente, setNivelInteresPendiente] = useState('Medio');
  const [dropdownInteresOpenId, setDropdownInteresOpenId] = useState<string | null>(null);
  const [vincularStatus, setVincularStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  
  // Estados para Cierre de Negocio
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [isUpdatingEtapa, setIsUpdatingEtapa] = useState(false);
  const [showEtapaDropdown, setShowEtapaDropdown] = useState(false);
  const [revertConfirmation, setRevertConfirmation] = useState<{ etapa: string } | null>(null);

  const handleRevertStatus = async (nuevaEtapa: string, liberarPropiedades: boolean) => {
    if (!id || !cliente) return;
    setIsUpdatingEtapa(true);
    setRevertConfirmation(null);

    // Optimistic Update
    mutate({ ...cliente, etapaEmbudo: nuevaEtapa, fechaCierre: undefined }, false);

    try {
      await revertirEstadoCliente(id, nuevaEtapa, liberarPropiedades);
      toast.success(`Estado revertido a ${nuevaEtapa}`);
      await mutate();
      
      // Revalidación global
      globalMutate('/dashboard/kpis');
      globalMutate(key => typeof key === 'string' && key.startsWith('/analitica/'));
      globalMutate('/propiedades');
      globalMutate('/clientes');
    } catch (err) {
      console.error('Error al revertir estado:', err);
      toast.error('No se pudo revertir el estado');
      mutate();
    } finally {
      setIsUpdatingEtapa(false);
    }
  };

  const handleStageChange = async (nuevaEtapa: string, confirmedData?: { propiedadId: string, precioCierre: number, nuevoEstadoPropiedad: string }) => {
    if (!id || !cliente || cliente.etapaEmbudo === nuevaEtapa) return;
    setShowEtapaDropdown(false);

    // Interceptar Cierre
    if (nuevaEtapa === 'Cerrado' && !confirmedData) {
      setIsClosingModalOpen(true);
      return;
    }

    // Interceptar Reversión (Si ya estaba Cerrado o Perdido y se mueve a una etapa activa)
    if ((cliente.etapaEmbudo === 'Cerrado' || cliente.etapaEmbudo === 'Perdido') && nuevaEtapa !== 'Cerrado' && nuevaEtapa !== 'Perdido') {
      setRevertConfirmation({ etapa: nuevaEtapa });
      return;
    }

    setIsUpdatingEtapa(true);
    // ... rest of handleStageChange
  };

  const handleClosingConfirm = async (precioCierre: number, propiedadId: string, nuevoEstadoPropiedad: string) => {
    await handleStageChange('Cerrado', { propiedadId, precioCierre, nuevoEstadoPropiedad });
    setIsClosingModalOpen(false);
  };
  
  // Estado para Confirmación Express de Borrado de Interés
  const [idInteresABorrar, setIdInteresABorrar] = useState<string | null>(null);
  const [isDeletingInteres, setIsDeletingInteres] = useState(false);

  const handleSaveNota = async () => {
    if (!nuevaNota.trim() || !id) return;
    setIsSavingNota(true);

    const isEdit = !!notaEnEdicion;
    const idNota = notaEnEdicion;
    const notaParaActualizar = nuevaNota;
    const tipoParaActualizar = tipoNota;

    const previousInteracciones = [...(cliente?.interacciones || [])];

    try {
      if (isEdit) {
        const nuevasInteracciones = previousInteracciones.map(i => i.id === idNota ? { ...i, notas: notaParaActualizar, tipoInteraccion: tipoParaActualizar } : i);
        const optimisticData = { ...cliente!, interacciones: nuevasInteracciones };
        
        mutate(optimisticData, false);
        setNotaEnEdicion(null);
        setNuevaNota('');
        setTipoNota('Nota');

        await actualizarInteraccion(idNota!, notaParaActualizar, tipoParaActualizar);
        toast.success('Nota actualizada');
      } else {
        const tipoAGuardar = tipoNota;
        const textoAGuardar = nuevaNota;

        const nuevaInteraccion: Interaccion = {
          id: `temp-${Date.now()}`,
          tipoInteraccion: tipoAGuardar,
          notas: textoAGuardar,
          fechaInteraccion: new Date().toISOString()
        };

        const optimisticData = { ...cliente!, interacciones: [nuevaInteraccion, ...previousInteracciones] };
        mutate(optimisticData, false);
        setNuevaNota('');
        setTipoNota('Nota');

        await registrarInteraccion({
          clienteId: id,
          tipoInteraccion: tipoAGuardar,
          notas: textoAGuardar
        });
        toast.success('Interacción registrada');
      }
      
      await mutate();
      
      // Revalidación proactiva de analíticas y dashboard (UPSP)
      globalMutate('/dashboard/kpis');
      globalMutate(key => typeof key === 'string' && key.startsWith('/analitica/'));

    } catch (err) {
      console.error('Error al guardar nota:', err);
      toast.error('No se pudo guardar la nota');
      mutate();
    } finally {
      setIsSavingNota(false);
    }
  };

  const handleEditarNota = (interaccion: Interaccion) => {
    setNotaEnEdicion(interaccion.id);
    setTipoNota(interaccion.tipoInteraccion);
    setNuevaNota(interaccion.notas);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEliminarNota = async (interaccionId: string) => {
    if (!cliente) return;
    const previousInteracciones = [...(cliente.interacciones || [])];

    try {
      const optimisticData = { 
        ...cliente, 
        interacciones: previousInteracciones.filter(i => i.id !== interaccionId) 
      };
      mutate(optimisticData, false);

      await eliminarInteraccion(interaccionId);
      toast.success('Nota eliminada');
      
      await mutate();

      // Revalidación proactiva de analíticas y dashboard (UPSP)
      globalMutate('/dashboard/kpis');
      globalMutate(key => typeof key === 'string' && key.startsWith('/analitica/'));

    } catch (err) {
      console.error('Error al eliminar nota:', err);
      toast.error('No se pudo eliminar la nota');
      mutate();
    }
  };

  const handleVincularPropiedad = async () => {
    if (!id || !propiedadPendienteId) return;
    
    const targetPropId = propiedadPendienteId;
    setUpdatingInteresId(targetPropId);
    setVincularStatus('saving');
    
    try {
      await vincularPropiedad(id, targetPropId, nivelInteresPendiente);
      setVincularStatus('success');
      
      // Satisfy transition: mostrar éxito visual por 800ms antes de cerrar
      setTimeout(async () => {
        toast.success('Propiedad vinculada correctamente');
        setPropiedadPendienteId(null);
        setNivelInteresPendiente('Medio');
        setVincularStatus('idle');
        await mutate();
        
        // Revalidación proactiva de analíticas y dashboard (UPSP)
        globalMutate('/dashboard/kpis');
        globalMutate(key => typeof key === 'string' && key.startsWith('/analitica/'));
      }, 800);

    } catch (err) {
      console.error('Error al vincular propiedad:', err);
      toast.error('No se pudo vincular la propiedad');
      setVincularStatus('idle');
    } finally {
      setUpdatingInteresId(null);
    }
  };

  const handleUpdateNivelInteres = async (propiedadId: string, nuevoNivel: string) => {
    if (!id || !cliente) return;
    
    // Implementación Optimistic UI
    const prevIntereses = cliente.intereses || [];
    const optimisticData = {
      ...cliente,
      intereses: prevIntereses.map(i => i.propiedadId === propiedadId ? { ...i, nivelInteres: nuevoNivel } : i)
    };
    
    mutate(optimisticData, false);

    try {
      await vincularPropiedad(id, propiedadId, nuevoNivel);
      toast.success('Interés actualizado instantáneamente');
      await mutate();
      
      // Revalidación proactiva de analíticas y dashboard (UPSP)
      globalMutate('/dashboard/kpis');
      globalMutate(key => typeof key === 'string' && key.startsWith('/analitica/'));

    } catch (err) {
      console.error('Error al actualizar interés:', err);
      toast.error('Hubo un error de sincronización, deshaciendo...');
      mutate(); // Revert local state to the previous correct server state
    }
  };

  const handleDesvincular = async (propiedadId: string) => {
    if (!id || !cliente) return;
    setIsDeletingInteres(true);
    
    // Implementación Optimistic UI y Undo Pattern
    const prevIntereses = cliente.intereses || [];
    const optimisticData = {
      ...cliente,
      intereses: prevIntereses.filter(i => i.propiedadId !== propiedadId)
    };

    mutate(optimisticData, false);

    try {
      await desvincularPropiedad(id, propiedadId);
      toast.success('Propiedad desvinculada exitosamente');
      setIdInteresABorrar(null);
      await mutate();
      
      // Revalidación proactiva de analíticas y dashboard (UPSP)
      globalMutate('/dashboard/kpis');
      globalMutate(key => typeof key === 'string' && key.startsWith('/analitica/'));

    } catch (err) {
      console.error('Error al desvincular:', err);
      toast.error('Error en el servidor al desvincular');
      mutate(); // Revert data to what server actually has
    } finally {
      setIsDeletingInteres(false);
    }
  };

  const historialFiltrado = useMemo(() => {
    if (!cliente?.interacciones) return [];
    return cliente.interacciones.filter(i => {
      const matchesSearch = i.notas.toLowerCase().includes(searchHistorial.toLowerCase()) || 
                           i.tipoInteraccion.toLowerCase().includes(searchHistorial.toLowerCase());
      const matchesTipo = filterTipoTimeline === 'Todos' || i.tipoInteraccion === filterTipoTimeline;
      return matchesSearch && matchesTipo;
    });
  }, [cliente, searchHistorial, filterTipoTimeline]);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-EC', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Cargando expediente...</p>
      </div>
    );
  }

  if (error || !cliente) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center mb-6">
          <X className="h-10 w-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Expediente no encontrado</h2>
        <p className="text-slate-500 max-w-xs mb-8">El prospecto que buscas no existe o ha sido eliminado.</p>
        <button 
          onClick={() => navigate('/prospectos')}
          className="px-8 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
        >
          Volver a Cartera
        </button>
      </div>
    );
  }

  const etapaActual = ETAPAS.find(e => e.value === cliente.etapaEmbudo) || ETAPAS[0];

  return (
    <div className="bg-slate-50 min-h-screen pb-20 font-sans antialiased">
      {/* Header Sticky */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-[100] px-6 py-4 flex items-center justify-between backdrop-blur-md bg-white/80">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/prospectos')}
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">{cliente.nombre} {cliente.apellido}</h1>
              
              <div className="relative">
                <button 
                  onClick={() => !isUpdatingEtapa && setShowEtapaDropdown(!showEtapaDropdown)}
                  disabled={isUpdatingEtapa}
                  className={`cursor-pointer ${`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-2 transition-all ${etapaActual.color} ${isUpdatingEtapa ? 'opacity-50' : 'hover:scale-105 active:scale-95'}`}`}
                >
                  {isUpdatingEtapa ? <Loader2 className="h-3 w-3 animate-spin" /> : cliente.etapaEmbudo}
                  <ChevronDown className={`h-3 w-3 transition-transform ${showEtapaDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showEtapaDropdown && (
                  <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[150] py-2 animate-in fade-in zoom-in-95 duration-200">
                    {ETAPAS.map((etapa) => (
                      <button
                        key={etapa.value}
                        onClick={() => handleStageChange(etapa.value)}
                        className={`cursor-pointer ${`w-full px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide flex items-center justify-between transition-colors hover:bg-slate-50 ${
                                                                                    cliente.etapaEmbudo === etapa.value ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'
                                                                                  }`}`}
                      >
                        {etapa.label}
                        {cliente.etapaEmbudo === etapa.value && <Check className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Expediente del Prospecto</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a 
            href={`tel:${cliente.telefono}`}
            className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100 cursor-pointer"
          >
            <PhoneCall className="h-5 w-5" />
          </a>
          <button className="h-10 px-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 cursor-pointer">
            Acciones
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Columna Izquierda: Información y Propiedades */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Card: Info básica */}
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="h-24 w-24 bg-slate-900 text-white rounded-[32px] flex items-center justify-center text-3xl font-black shadow-2xl mb-4 rotate-3">
                {cliente.nombre[0]}{cliente.apellido?.[0] || ''}
              </div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{cliente.nombre} {cliente.apellido}</h2>
              <p className="text-sm font-bold text-slate-400 mt-1 italic">Prospecto desde {new Date(cliente.fechaCreacion!).toLocaleDateString()}</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm transition-colors">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono</p>
                  <p className="text-sm font-bold text-slate-900 truncate">{cliente.telefono}</p>
                </div>
              </div>

              {cliente.email && (
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
                  <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{cliente.email}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm transition-colors">
                  <Tag className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Origen</p>
                  <p className="text-sm font-bold text-slate-900 truncate">{cliente.origen}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Propiedades de Interés */}
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Intereses</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Propiedades vinculadas</p>
              </div>
              <Building2 className="h-5 w-5 text-slate-200" />
            </div>

            <div className="mb-6">
              {!propiedadPendienteId ? (
                <DynamicSearchSelect 
                  label=""
                  placeholder="Vincular propiedad..."
                  icon={Plus}
                  options={propiedadesOptions}
                  onChange={(propId) => {
                    if (propId) {
                       setPropiedadPendienteId(propId);
                       setNivelInteresPendiente('Medio');
                    }
                  }}
                />
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 animate-in fade-in zoom-in-95 duration-200">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-3">Nivel de Interés para la propiedad</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {NIVELES_INTERES.map(n => (
                      <button
                        key={n.value}
                        onClick={() => setNivelInteresPendiente(n.value)}
                        className={`cursor-pointer ${`py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${nivelInteresPendiente === n.value ? n.color + ' border-current shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}`}
                      >
                        {n.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleVincularPropiedad}
                      disabled={vincularStatus === 'saving' || vincularStatus === 'success'}
                      className={`cursor-pointer ${`flex-1 font-black text-xs uppercase tracking-widest py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2
                        ${vincularStatus === 'success' 
                                                                                                                  ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                                                                                                                  : 'bg-slate-900 text-white shadow-slate-900/10 hover:bg-slate-800 disabled:bg-slate-200 disabled:shadow-none active:scale-95'}`}`}
                    >
                      {vincularStatus === 'saving' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : vincularStatus === 'success' ? (
                        <><Check className="h-4 w-4" /> ¡Vinculado!</>
                      ) : (
                        <><Check className="h-4 w-4" /> Vincular Ahora</>
                      )}
                    </button>
                    <button 
                      onClick={() => { setPropiedadPendienteId(null); setVincularStatus('idle'); }}
                      disabled={vincularStatus === 'saving'}
                      className="h-[40px] w-[40px] flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-rose-500 rounded-xl transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {!cliente.intereses || cliente.intereses.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs font-bold text-slate-400 italic">No hay propiedades vinculadas</p>
                </div>
              ) : (
                cliente.intereses.map((interes: Interes) => {
                  const nivelActual = NIVELES_INTERES.find(n => n.value === interes.nivelInteres) || NIVELES_INTERES[1];
                  const isUpdating = updatingInteresId === interes.propiedadId;
                  const isThisBeingDeleted = idInteresABorrar === interes.propiedadId;

                  return (
                    <div key={interes.propiedadId} className="group relative bg-white border border-slate-100 p-4 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all">
                      {(isUpdating || (isDeletingInteres && isThisBeingDeleted)) && <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl"><Loader2 className="h-5 w-5 text-blue-600 animate-spin" /></div>}
                      
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 bg-slate-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-slate-300" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-black text-slate-900 uppercase truncate leading-tight group-hover:text-blue-600 transition-colors">{interes.titulo}</h4>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">{formatCurrency(interes.precio || 0)}</p>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <div className="relative">
                              <button 
                                onClick={() => setDropdownInteresOpenId(dropdownInteresOpenId === interes.propiedadId ? null : interes.propiedadId)}
                                className={`cursor-pointer ${`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full flex items-center gap-1 border border-transparent hover:border-current transition-all ${nivelActual.color}`}`}
                              >
                                {nivelActual.label}
                                <ChevronDown className="h-2.5 w-2.5" />
                              </button>
                              
                              {dropdownInteresOpenId === interes.propiedadId && (
                                <>
                                  <div className="fixed inset-0 z-40 cursor-default" onClick={() => setDropdownInteresOpenId(null)}></div>
                                  <div className="absolute left-0 bottom-full mb-2 z-50 bg-white border border-slate-100 rounded-xl shadow-2xl p-1 w-32 animate-in fade-in zoom-in-95 duration-200">
                                    {NIVELES_INTERES.map(n => (
                                      <button 
                                        key={n.value}
                                        onClick={() => {
                                          handleUpdateNivelInteres(interes.propiedadId, n.value);
                                          setDropdownInteresOpenId(null);
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-[9px] font-black uppercase hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
                                      >
                                        {n.label}
                                        {interes.nivelInteres === n.value && <Check className="h-3 w-3 text-blue-600" />}
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                            
                            {/* Confirmación Express de Borrado */}
                            <div className="flex items-center">
                              {isThisBeingDeleted ? (
                                <div className="flex items-center gap-1 bg-rose-50 p-0.5 rounded-lg animate-in zoom-in-95 duration-200 border border-rose-100">
                                  <button 
                                    onClick={() => handleDesvincular(interes.propiedadId)}
                                    disabled={isDeletingInteres}
                                    className="p-1 text-emerald-600 hover:bg-emerald-100 rounded-md transition-all cursor-pointer"
                                  >
                                    <Check className="h-3 w-3" />
                                  </button>
                                  <button 
                                    onClick={() => setIdInteresABorrar(null)}
                                    disabled={isDeletingInteres}
                                    className="p-1 text-slate-400 hover:bg-slate-100 rounded-md transition-all cursor-pointer"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => setIdInteresABorrar(interes.propiedadId)}
                                  className="text-[9px] font-black text-slate-300 hover:text-rose-500 uppercase tracking-tighter transition-colors cursor-pointer"
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => navigate(`/propiedades?id=${interes.propiedadId}`)}
                          className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Timeline y Notas */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Editor de Notas */}
          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm overflow-hidden relative group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                  <Pencil className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                    {notaEnEdicion ? 'Editando Nota' : 'Nueva Interacción'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registra el progreso</p>
                </div>
              </div>
              {notaEnEdicion && (
                <button 
                  onClick={() => { setNotaEnEdicion(null); setNuevaNota(''); setTipoNota('Nota'); }}
                  className="text-[10px] font-black text-rose-500 uppercase hover:underline cursor-pointer"
                >
                  Cancelar Edición
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex gap-2 p-1.5 bg-slate-50 rounded-2xl w-fit">
                {TIPO_NOTA_OPCIONES.map(opt => (
                  <button 
                    key={opt.value}
                    onClick={() => setTipoNota(opt.value)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${tipoNota === opt.value ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <textarea 
                  value={nuevaNota}
                  onChange={(e) => setNuevaNota(e.target.value)}
                  placeholder="Escribe aquí los detalles de la interacción..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-[24px] p-6 text-slate-700 font-medium text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-200 transition-all outline-none min-h-[120px] resize-none"
                />
                <button 
                  onClick={handleSaveNota}
                  disabled={isSavingNota || !nuevaNota.trim()}
                  className="absolute bottom-4 right-4 bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center gap-2 disabled:bg-slate-200 disabled:shadow-none active:scale-95 cursor-pointer"
                >
                  {isSavingNota ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  {notaEnEdicion ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>

          {/* Timeline de Historial */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Línea de Tiempo</h3>
                <p className="text-xs font-bold text-slate-400 italic">Cronología de actividades</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    value={searchHistorial}
                    onChange={(e) => setSearchHistorial(e.target.value)}
                    placeholder="Buscar notas..."
                    className="bg-white border border-slate-200 rounded-full pl-9 pr-4 py-2 text-[10px] font-bold text-slate-600 focus:ring-4 focus:ring-blue-100 transition-all outline-none w-40 sm:w-56"
                  />
                </div>
                <div className="relative group/filter">
                  <button className="h-9 w-9 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all shadow-sm cursor-pointer">
                    <FilterIcon className="h-4 w-4" />
                  </button>
                  <div className="absolute right-0 top-full mt-2 hidden group-hover/filter:block z-50 bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 w-40 animate-in fade-in zoom-in-95 duration-200">
                    <button onClick={() => setFilterTipoTimeline('Todos')} className="w-full text-left px-4 py-2 text-[10px] font-black uppercase hover:bg-slate-50 rounded-xl transition-colors cursor-pointer">Todos</button>
                    {TIPO_NOTA_OPCIONES.map(opt => (
                      <button key={opt.value} onClick={() => setFilterTipoTimeline(opt.value)} className="w-full text-left px-4 py-2 text-[10px] font-black uppercase hover:bg-slate-50 rounded-xl transition-colors cursor-pointer">{opt.label}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative space-y-10 before:absolute before:left-6 before:top-4 before:bottom-0 before:w-0.5 before:bg-slate-200 before:content-['']">
              {historialFiltrado.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200 ml-12">
                  <p className="text-sm font-bold text-slate-400 italic">No hay registros que coincidan con el filtro</p>
                </div>
              ) : (
                historialFiltrado.map((interaccion) => (
                  <div key={interaccion.id} className="relative pl-14 group">
                    <div className="absolute left-3 top-0 h-7 w-7 bg-white border-2 border-slate-200 rounded-full z-10 flex items-center justify-center group-hover:border-blue-500 transition-colors shadow-sm">
                      {interaccion.tipoInteraccion === 'Llamada' ? <Phone className="h-3.5 w-3.5 text-blue-500" /> : interaccion.tipoInteraccion === 'WhatsApp' ? <MessageSquare className="h-3.5 w-3.5 text-emerald-500" /> : <Clock className="h-3.5 w-3.5 text-slate-400" />}
                    </div>
                    
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{interaccion.tipoInteraccion}</span>
                          <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{formatDate(interaccion.fechaInteraccion)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {idInteraccionABorrar === interaccion.id ? (
                            <div className="flex items-center gap-1 bg-rose-50 p-0.5 rounded-lg animate-in zoom-in duration-200">
                              <button onClick={() => { handleEliminarNota(interaccion.id); setIdInteraccionABorrar(null); }} className="p-1 text-rose-600 hover:bg-rose-100 rounded-md transition-all cursor-pointer"><Check className="h-3 w-3" /></button>
                              <button onClick={() => setIdInteraccionABorrar(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-md transition-all cursor-pointer"><X className="h-3 w-3" /></button>
                            </div>
                          ) : (
                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEditarNota(interaccion)} className="p-1.5 hover:bg-blue-50 text-slate-300 hover:text-blue-600 rounded-lg transition-all cursor-pointer"><Pencil className="h-3 w-3" /></button>
                              <button onClick={() => setIdInteraccionABorrar(interaccion.id)} className="p-1.5 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded-lg transition-all cursor-pointer"><Trash2 className="h-3 w-3" /></button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="bg-slate-50/50 p-6 rounded-[32px] border border-slate-100 hover:bg-white hover:shadow-xl hover:border-blue-100 transition-all duration-500 italic text-sm font-medium text-slate-600 leading-relaxed">"{interaccion.notas}"</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <ClosingModal 
        isOpen={isClosingModalOpen}
        onClose={() => setIsClosingModalOpen(false)}
        onConfirm={handleClosingConfirm}
        mode="lead"
        initialData={cliente ? {
          id: cliente.id,
          titulo: `${cliente.nombre} ${cliente.apellido}`,
          precio: 0,
          operacion: 'Venta'
        } : undefined}
      />

      {/* Modal de Reversión (Spec 011) */}
      {revertConfirmation && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[500] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8">
              <div className="h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6">
                <RotateCcw className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Revertir Cierre/Perdida</h3>
              <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                Estás moviendo a <span className="text-slate-900 font-bold">{cliente.nombre}</span> a la etapa <span className="text-blue-600 font-bold uppercase tracking-wider">{revertConfirmation.etapa}</span>.
              </p>

              <div className="space-y-4 mb-8">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        id="liberarProp"
                        className="peer h-5 w-5 appearance-none rounded-md border-2 border-slate-200 checked:bg-indigo-600 checked:border-indigo-600 transition-all cursor-pointer"
                        defaultChecked={true}
                      />
                      <Check className="absolute h-3 w-3 text-white scale-0 peer-checked:scale-100 transition-transform left-1" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                      Volver a listar propiedades cerradas con este cliente
                    </span>
                  </label>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50">
                  <ShieldCheck className="h-4 w-4 text-amber-600 mt-0.5" />
                  <p className="text-[10px] font-bold text-amber-700 leading-tight uppercase tracking-wider">
                    Se registrarán transacciones de cancelación en el historial de las propiedades afectadas.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setRevertConfirmation(null)}
                  className="flex-1 px-6 py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    const check = document.getElementById('liberarProp') as HTMLInputElement;
                    handleRevertStatus(revertConfirmation.etapa, check.checked);
                  }}
                  className="flex-1 px-6 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 shadow-xl shadow-slate-900/20 transition-all active:scale-95 cursor-pointer"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
