import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSWR, { SWRConfig } from 'swr';
import { 
  X, 
  Mail, 
  Phone, 
  Send, 
  Loader2, 
  MessageSquare, 
  Clock, 
  Info,
  Plus,
  Building,
  ChevronDown,
  Search,
  ChevronLeft,
  Check,
  Hash,
  Pencil,
  Trash2
} from 'lucide-react';
import { getClienteById } from '../api/getClienteById';
import { registrarInteraccion } from '../api/registrarInteraccion';
import { vincularPropiedad } from '../api/vincularPropiedad';
import { actualizarEtapaCliente } from '../api/actualizarEtapaCliente';
import { getPropiedades } from '../../propiedades/api/getPropiedades';
import { desvincularPropiedad } from '../api/desvincularPropiedad';
import { actualizarInteraccion } from '../api/actualizarInteraccion';
import { eliminarInteraccion } from '../api/eliminarInteraccion';
import { CrearClienteForm } from './CrearClienteForm';
import { localStorageProvider, swrDefaultConfig } from '@/lib/swr';
import type { Cliente, Interaccion, Interes } from '../types';
import type { Propiedad } from '../../propiedades/types';

const ETAPAS = [
  { label: 'Nuevo', value: 'Nuevo', color: 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100' },
  { label: 'Contactado', value: 'Contactado', color: 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100' },
  { label: 'En Negociación', value: 'En Negociación', color: 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100' },
  { label: 'Cerrado', value: 'Cerrado', color: 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' },
  { label: 'Perdido', value: 'Perdido', color: 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100' },
];

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('es-EC', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString));
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(value);
};

const ClienteDetalleContent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: cliente, isValidating: syncing, mutate } = useSWR<Cliente>(
    id ? `/clientes/${id}` : null,
    () => getClienteById(id!),
    swrDefaultConfig
  );
  
  // UPSP: loading es TRUE solo si no hay datos y estamos validando por primera vez o revalidando sin cache.
  const loading = !cliente && syncing;
  const [sending, setSending] = useState(false);
  const [nuevaNota, setNuevaNota] = useState('');
  const [tipoNota, setTipoNota] = useState('Nota');
  const [notaEnEdicion, setNotaEnEdicion] = useState<string | null>(null);
  const [updatingEtapa, setUpdatingEtapa] = useState(false);
  const [showEtapaDropdown, setShowEtapaDropdown] = useState(false);
  const [idInteraccionABorrar, setIdInteraccionABorrar] = useState<string | null>(null);
  const [idInteresABorrar, setIdInteresABorrar] = useState<string | null>(null);

  const [showVincularModal, setShowVincularModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditingInteres, setIsEditingInteres] = useState(false);
  const [propiedadesDisponibles, setPropiedadesDisponibles] = useState<Propiedad[]>([]);
  const [filtroPropiedad, setFiltroPropiedad] = useState('');
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState<Propiedad | null>(null);
  const [nivelInteres, setNivelInteres] = useState('Medio');
  const [vinculando, setVinculando] = useState(false);
  const [showPropiedadDropdown, setShowPropiedadDropdown] = useState(false);

  const [searchIntereses, setSearchIntereses] = useState('');
  const [searchHistorial, setSearchHistorial] = useState('');
  const [filterTipoTimeline, setFilterTipoTimeline] = useState('Todos');
  const [isTimelineOpen, setIsTimelineOpen] = useState(true);
  const [isInteresesOpen, setIsInteresesOpen] = useState(true);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowEtapaDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStageChange = async (nuevaEtapa: string) => {
    if (!cliente || !id || cliente.etapaEmbudo === nuevaEtapa) return;
    setShowEtapaDropdown(false);
    
    const optimisticData = { ...cliente, etapaEmbudo: nuevaEtapa };
    
    try {
      setUpdatingEtapa(true);
      await mutate(actualizarEtapaCliente(id, nuevaEtapa).then(() => optimisticData), {
        optimisticData,
        rollbackOnError: true,
        revalidate: true
      });
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingEtapa(false);
    }
  };

  const handleOpenVincular = async (interes?: Interes) => {
    setShowVincularModal(true);
    if (interes) {
      setIsEditingInteres(true);
      setPropiedadSeleccionada({ 
        id: interes.propiedadId, 
        titulo: interes.titulo, 
        precio: interes.precio, 
        estadoComercial: interes.estadoComercial,
        codigo: '', 
        tipoInmueble: '',
        ubicacion: '',
        area: 0,
        habitaciones: 0,
        banos: 0,
        parqueaderos: 0,
        descripcion: '',
        caracteristicas: [],
        imagenes: []
      } as unknown as Propiedad);
      setFiltroPropiedad(interes.titulo);
      setNivelInteres(interes.nivelInteres);
    } else {
      setIsEditingInteres(false);
      setFiltroPropiedad('');
      setPropiedadSeleccionada(null);
      setNivelInteres('Medio');
    }
    
    try {
      const data = await getPropiedades();
      setPropiedadesDisponibles(data.filter(p => p.estadoComercial === 'Disponible' || (interes && p.id === interes.propiedadId)));
    } catch (err) {
      console.error('Error al cargar propiedades:', err);
    }
  };

  const handleVincular = async () => {
    if (!propiedadSeleccionada || !cliente || !id) return;
    
    const nuevoInteres: Interes = {
      propiedadId: propiedadSeleccionada.id,
      titulo: propiedadSeleccionada.titulo,
      precio: propiedadSeleccionada.precio,
      estadoComercial: propiedadSeleccionada.estadoComercial,
      nivelInteres: nivelInteres,
      fechaRegistro: new Date().toISOString()
    };

    let nuevosIntereses;
    const previousIntereses = [...(cliente.intereses || [])];
    if (isEditingInteres) {
      nuevosIntereses = previousIntereses.map(i => i.propiedadId === propiedadSeleccionada.id ? { ...i, nivelInteres } : i);
    } else {
      const existe = previousIntereses.find(i => i.propiedadId === propiedadSeleccionada.id);
      if (existe) {
        nuevosIntereses = previousIntereses.map(i => i.propiedadId === propiedadSeleccionada.id ? { ...i, nivelInteres, fechaRegistro: nuevoInteres.fechaRegistro } : i);
      } else {
        nuevosIntereses = [nuevoInteres, ...previousIntereses];
      }
    }

    const optimisticData = { ...cliente, intereses: nuevosIntereses };
    setShowVincularModal(false);
    
    try {
      setVinculando(true);
      await mutate(vincularPropiedad(id, propiedadSeleccionada.id, nivelInteres).then(() => optimisticData), {
        optimisticData,
        rollbackOnError: true,
        revalidate: true
      });
    } catch (err) {
      console.error(err);
    } finally {
      setVinculando(false);
    }
  };

  const interesesFiltrados = useMemo(() => {
    if (!cliente?.intereses) return [];
    return cliente.intereses.filter(i => 
      i.titulo.toLowerCase().includes(searchIntereses.toLowerCase())
    );
  }, [cliente?.intereses, searchIntereses]);

  const historialFiltrado = useMemo(() => {
    if (!cliente?.interacciones) return [];
    return cliente.interacciones.filter(i => {
      const matchesSearch = i.notas.toLowerCase().includes(searchHistorial.toLowerCase()) ||
                          i.tipoInteraccion.toLowerCase().includes(searchHistorial.toLowerCase());
      const matchesTipo = filterTipoTimeline === 'Todos' || i.tipoInteraccion === filterTipoTimeline;
      return matchesSearch && matchesTipo;
    });
  }, [cliente?.interacciones, searchHistorial, filterTipoTimeline]);

  const propiedadesFiltradas = propiedadesDisponibles.filter(p => 
    p.titulo.toLowerCase().includes(filtroPropiedad.toLowerCase())
  );

  const handleGuardarNota = async () => {
    if (!nuevaNota.trim() || !cliente || !id) return;
    const previousInteracciones = [...(cliente.interacciones || [])];

    if (notaEnEdicion) {
      const nuevasInteracciones = previousInteracciones.map(i => i.id === notaEnEdicion ? { ...i, notas: nuevaNota, tipoInteraccion: tipoNota } : i);
      const optimisticData = { ...cliente, interacciones: nuevasInteracciones };
      
      const idNota = notaEnEdicion;
      const tipoParaActualizar = tipoNota;
      const notaParaActualizar = nuevaNota;
      setNotaEnEdicion(null);
      setNuevaNota('');
      
      try {
        setSending(true);
        await mutate(actualizarInteraccion(idNota, notaParaActualizar, tipoParaActualizar).then(() => optimisticData), {
          optimisticData,
          rollbackOnError: true,
          revalidate: true
        });
      } catch (err) {
        console.error(err);
      } finally {
        setSending(false);
      }
      return;
    }

    const nuevaInteraccion: Interaccion = {
      id: crypto.randomUUID(),
      tipoInteraccion: tipoNota,
      notas: nuevaNota,
      fechaInteraccion: new Date().toISOString()
    };
    const optimisticData = { ...cliente, interacciones: [nuevaInteraccion, ...previousInteracciones] };
    const notaAGuardar = nuevaNota;
    const tipoAGuardar = tipoNota;
    setNuevaNota('');
    
    try {
      setSending(true);
      await mutate(registrarInteraccion({
        clienteId: id,
        tipoInteraccion: tipoAGuardar,
        notas: notaAGuardar
      }).then(() => optimisticData), {
        optimisticData,
        rollbackOnError: true,
        revalidate: true
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleEditarNota = (interaccion: Interaccion) => {
    setNotaEnEdicion(interaccion.id);
    setTipoNota(interaccion.tipoInteraccion);
    setNuevaNota(interaccion.notas);
  };

  const handleEliminarNota = async (interaccionId: string) => {
    if (!cliente || !id) return;
    const previousInteracciones = [...(cliente.interacciones || [])];
    const optimisticData = {
      ...cliente,
      interacciones: previousInteracciones.filter(i => i.id !== interaccionId)
    };

    try {
      await mutate(eliminarInteraccion(interaccionId).then(() => optimisticData), {
        optimisticData,
        rollbackOnError: true,
        revalidate: true
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDesvincularInteres = async (propiedadId: string) => {
    if (!cliente || !id) return;
    const previousIntereses = [...(cliente.intereses || [])];
    const optimisticData = {
      ...cliente,
      intereses: previousIntereses.filter(i => i.propiedadId !== propiedadId)
    };

    try {
      await mutate(desvincularPropiedad(id, propiedadId).then(() => optimisticData), {
        optimisticData,
        rollbackOnError: true,
        revalidate: true
      });
    } catch (err) {
      console.error(err);
    }
  };

  const getEtapaStyles = (etapa: string) => {
    const found = ETAPAS.find(e => e.value === etapa);
    return found?.color || 'bg-slate-50 text-slate-700 border-slate-100';
  };

  const getNivelInteresStyles = (nivel: string) => {
    switch (nivel) {
      case 'Alto': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Medio': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Bajo': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Descartada': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-400 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in duration-500">
        <Loader2 className="h-12 w-12 text-blue-700 animate-spin mb-4" />
        <p className="text-sm font-black text-slate-700 uppercase tracking-widest animate-pulse">Obteniendo expediente...</p>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
        <div className="h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center mb-6"><Info className="h-10 w-10 text-rose-500" /></div>
        <h3 className="text-xl font-black text-slate-900 mb-2">Cliente no encontrado</h3>
        <button onClick={() => navigate('/prospectos')} className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 cursor-pointer">Volver a la Cartera</button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      {/* Indicador de Sincronización UPSP */}
      {syncing && cliente && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900/90 backdrop-blur-xl text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10">
            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sincronizando Expediente...</span>
          </div>
        </div>
      )}

      {/* Modales Complementarios */}
      {showVincularModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-all duration-500" onClick={() => setShowVincularModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{isEditingInteres ? 'Modificar Interés' : 'Sugerir Propiedad'}</h3>
              <button onClick={() => setShowVincularModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-8">
              <div className="space-y-3 relative">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Seleccionar Propiedad</label>
                <div className="relative">
                  <div className={`flex items-center gap-3 bg-slate-50 border-2 transition-all duration-300 rounded-2xl px-5 py-4 ${isEditingInteres ? 'opacity-60 cursor-not-allowed border-slate-100' : showPropiedadDropdown ? 'border-blue-500 ring-4 ring-blue-50' : 'border-slate-100 hover:border-slate-200'}`}>
                    <Building className={`h-5 w-5 ${isEditingInteres ? 'text-slate-300' : showPropiedadDropdown ? 'text-blue-500' : 'text-slate-400'}`} />
                    <input 
                      type="text" 
                      className={`w-full bg-transparent border-none focus:ring-0 outline-none font-bold text-slate-700 placeholder:text-slate-300 ${isEditingInteres ? 'cursor-not-allowed' : ''}`} 
                      placeholder="Buscar por título..." 
                      value={filtroPropiedad} 
                      onChange={(e) => { 
                        if (isEditingInteres) return;
                        setFiltroPropiedad(e.target.value); 
                        setShowPropiedadDropdown(true); 
                        setPropiedadSeleccionada(null); 
                      }} 
                      onFocus={() => {
                        if (!isEditingInteres) setShowPropiedadDropdown(true);
                      }}
                      readOnly={isEditingInteres}
                    />
                  </div>
                  {showPropiedadDropdown && !isEditingInteres && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-3xl shadow-2xl z-[510] animate-in slide-in-from-top-2 duration-200">
                      <div className="max-h-60 overflow-y-auto p-2">
                        {propiedadesFiltradas.length === 0 ? <div className="p-4 text-center"><p className="text-xs font-bold text-slate-400 italic">No se encontraron propiedades disponibles</p></div> : 
                          propiedadesFiltradas.map(p => (
                            <button key={p.id} onClick={() => { setPropiedadSeleccionada(p); setFiltroPropiedad(p.titulo); setShowPropiedadDropdown(false); }} className="w-full text-left p-4 hover:bg-blue-50 rounded-2xl transition-all group flex items-center justify-between cursor-pointer">
                              <div className="flex flex-col"><span className="text-sm font-black text-slate-900 group-hover:text-blue-600 line-clamp-1">{p.titulo}</span><span className="text-[10px] font-bold text-slate-400">{formatCurrency(p.precio)}</span></div><Plus className="h-4 w-4 text-slate-200 group-hover:text-blue-400" />
                            </button>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nivel de Interés Inicial</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Alto', 'Medio', 'Bajo', 'Descartada'].map(nivel => (
                    <button key={nivel} onClick={() => setNivelInteres(nivel)} className={`px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 cursor-pointer ${nivelInteres === nivel ? 'bg-blue-600 border-blue-600 text-white shadow-xl' : 'bg-white border-slate-50 text-slate-400 hover:border-slate-200'}`}>{nivel}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button onClick={() => setShowVincularModal(false)} className="flex-1 px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl text-xs font-black hover:bg-slate-200 cursor-pointer">Cancelar</button>
                <button onClick={handleVincular} disabled={!propiedadSeleccionada || vinculando} className="flex-1 px-6 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black hover:bg-slate-800 shadow-xl disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2">{vinculando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Vincular</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative overflow-visible">
        <div className="lg:col-span-12 sticky top-20 z-50 bg-slate-50 py-6 mb-2 border-b border-slate-200/60 -mx-8 px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/prospectos')} className="h-12 w-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-400 shadow-sm active:scale-95 group cursor-pointer border-2 transition-all"><ChevronLeft className="h-6 w-6 group-hover:-translate-x-0.5 transition-transform" /></button>
              <div>
                <div className="flex items-center gap-2 mb-1"><span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Prospectos</span><span className="text-slate-300 text-[10px] font-black">/</span><span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Expediente 360°</span></div>
                <h1 className="text-2xl font-black text-slate-900 uppercase leading-none">{cliente.nombre} {cliente.apellido}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowEditModal(true)}
                className="px-6 py-3 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:border-slate-200 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar Datos
              </button>
              <div className="relative" ref={dropdownRef}>
                {updatingEtapa ? <div className="px-6 py-3 bg-slate-100 border-2 border-slate-200 rounded-2xl flex items-center gap-3"><Loader2 className="h-4 w-4 animate-spin text-blue-600" /><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sincronizando...</span></div> : 
                  <button onClick={() => setShowEtapaDropdown(!showEtapaDropdown)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] border-2 shadow-md transition-all flex items-center gap-3 cursor-pointer ${getEtapaStyles(cliente.etapaEmbudo)}`}>{cliente.etapaEmbudo}<ChevronDown className={`h-4 w-4 transition-transform duration-500 ${showEtapaDropdown ? 'rotate-180' : ''}`} /></button>
                }
                {showEtapaDropdown && (
                  <div className="absolute right-0 mt-3 w-64 bg-white border-2 border-slate-100 rounded-[32px] shadow-2xl z-[100] py-3 animate-in fade-in zoom-in-95 duration-200 origin-top-right overflow-hidden backdrop-blur-xl bg-white/95">
                    {ETAPAS.map((etapa) => (
                      <button key={etapa.value} onClick={() => handleStageChange(etapa.value)} className={`w-full px-6 py-4 text-left text-[11px] font-black uppercase tracking-widest flex items-center justify-between transition-colors hover:bg-slate-50 cursor-pointer ${cliente.etapaEmbudo === etapa.value ? 'text-blue-600 bg-blue-50/20' : 'text-slate-600'}`}>{etapa.label}{cliente.etapaEmbudo === etapa.value && <Check className="h-4 w-4" />}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 sticky top-[180px] self-start h-fit z-20">
          <div className="bg-white rounded-[40px] border-2 border-slate-100 shadow-sm p-10 overflow-hidden relative group">
            <div className="flex flex-col items-center text-center mb-10">
              <div className="h-24 w-24 bg-slate-900 text-white rounded-[32px] flex items-center justify-center font-black text-3xl shadow-2xl shadow-slate-900/20 mb-6">{cliente.nombre[0]}{cliente.apellido?.[0] || ''}</div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-tight">{cliente.nombre} {cliente.apellido}</h2>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-1.5"><Hash className="h-3 w-3" />REF: {cliente.id.substring(0, 8).toUpperCase()}</span>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-4 group/item"><div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover/item:bg-blue-600 group-hover/item:text-white transition-all"><Mail className="h-5 w-5" /></div><div className="flex-1 overflow-hidden"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email</p><p className="text-sm font-bold text-slate-700 truncate">{cliente.email || 'N/A'}</p></div></div>
              <div className="flex items-center gap-4 group/item"><div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover/item:bg-blue-600 group-hover/item:text-white transition-all"><Phone className="h-5 w-5" /></div><div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Teléfono</p><p className="text-sm font-bold text-slate-700">{cliente.telefono}</p></div></div>
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-50">
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Origen</p><p className="text-xs font-black text-slate-900">{cliente.origen}</p></div>
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Fecha</p><p className="text-xs font-black text-slate-900">{formatDate(cliente.fechaCreacion!).split(',')[0]}</p></div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <div className="bg-white rounded-[40px] border-2 border-slate-100 shadow-sm overflow-hidden">
            <div onClick={() => setIsTimelineOpen(!isTimelineOpen)} className="p-8 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3"><div className={`h-8 w-1 rounded-full ${isTimelineOpen ? 'bg-blue-600' : 'bg-slate-200'}`}></div><h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Actividad</h3></div>
              <ChevronDown className={`h-5 w-5 text-slate-300 transition-transform ${isTimelineOpen ? 'rotate-180' : ''}`} />
            </div>
            {isTimelineOpen && (
              <div className="px-8 pb-10 space-y-8 animate-in slide-in-from-top-4 duration-500">
                <div className="flex flex-col gap-4">
                  <div className="relative w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" /><input type="text" placeholder="Buscar evento..." value={searchHistorial} onChange={(e) => setSearchHistorial(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-600 outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-sm" /></div>
                  <div className="flex flex-wrap gap-2">
                    {['Todos', 'Nota', 'Llamada', 'WhatsApp'].map((tipo) => (
                      <button key={tipo} onClick={() => setFilterTipoTimeline(tipo)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${filterTipoTimeline === tipo ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{tipo}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-10 relative before:absolute before:inset-y-0 before:left-5 before:w-0.5 before:bg-slate-100 pr-2">
                  {historialFiltrado.length === 0 ? <div className="py-20 text-center opacity-30"><MessageSquare className="h-10 w-10 mx-auto mb-4" /><p className="text-sm font-black uppercase tracking-widest">Sin coincidencias</p></div> : 
                    historialFiltrado.map((interaccion) => (
                      <div key={interaccion.id} className="relative pl-14 group">
                        <div className="absolute left-1.5 top-0 h-8 w-8 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center z-10 group-hover:border-blue-500 group-hover:scale-110 transition-all shadow-sm">
                          {interaccion.tipoInteraccion === 'Llamada' ? <Phone className="h-3.5 w-3.5 text-blue-500" /> : interaccion.tipoInteraccion === 'WhatsApp' ? <MessageSquare className="h-3.5 w-3.5 text-emerald-500" /> : <Clock className="h-3.5 w-3.5 text-slate-400" />}
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{interaccion.tipoInteraccion}</span>
                              <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase">{formatDate(interaccion.fechaInteraccion)}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {idInteraccionABorrar === interaccion.id ? (
                                <div className="flex items-center gap-1 bg-rose-50 p-0.5 rounded-lg border border-rose-100 shadow-sm animate-in zoom-in duration-200">
                                  <button onClick={() => { handleEliminarNota(interaccion.id); setIdInteraccionABorrar(null); }} className="p-1 text-rose-600 hover:bg-rose-100 rounded-md transition-all cursor-pointer"><Check className="h-3 w-3" /></button>
                                  <button onClick={() => setIdInteraccionABorrar(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-md transition-all cursor-pointer"><X className="h-3 w-3" /></button>
                                </div>
                              ) : (
                                <>
                                  <button onClick={() => handleEditarNota(interaccion)} className="p-1.5 hover:bg-blue-50 text-slate-300 hover:text-blue-600 rounded-lg transition-all cursor-pointer"><Pencil className="h-3 w-3" /></button>
                                  <button onClick={() => setIdInteraccionABorrar(interaccion.id)} className="p-1.5 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded-lg transition-all cursor-pointer"><Trash2 className="h-3 w-3" /></button>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="bg-slate-50/50 p-6 rounded-[32px] border border-slate-100 hover:bg-white hover:shadow-xl hover:border-blue-100 transition-all duration-500 italic text-sm font-medium text-slate-600 leading-relaxed">"{interaccion.notas}"</div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 sticky top-[180px] self-start h-fit z-20">
          <div className="space-y-8">
            <div className="bg-slate-900 rounded-[40px] p-8 shadow-2xl relative overflow-hidden group border-2 border-slate-800">
              <div className="absolute top-0 right-0 p-4"><div className="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 group-hover:text-blue-500 transition-colors"><Send className="h-6 w-6" /></div></div>
              <h3 className="text-xl font-black text-white tracking-tight mb-8 uppercase">Notas Rápidas</h3>
              {notaEnEdicion && (
                <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/40 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Editando nota...</span>
                  <button onClick={() => { setNotaEnEdicion(null); setNuevaNota(''); }} className="text-white/40 hover:text-white transition-colors cursor-pointer"><X className="h-4 w-4" /></button>
                </div>
              )}
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {['Nota', 'Llamada', 'WhatsApp'].map((tipo) => (
                    <button key={tipo} onClick={() => setTipoNota(tipo)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${tipoNota === tipo ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>{tipo}</button>
                  ))}
                </div>
                <textarea value={nuevaNota} onChange={(e) => setNuevaNota(e.target.value)} placeholder={`Resumen de la ${tipoNota.toLowerCase()}...`} className="w-full h-40 bg-white/5 border border-white/10 rounded-[28px] p-5 text-white text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/20 transition-all resize-none" />
                <button onClick={handleGuardarNota} disabled={sending || !nuevaNota.trim()} className="w-full py-4 bg-blue-600 text-white rounded-[24px] text-xs font-black hover:bg-blue-700 shadow-xl disabled:opacity-50 cursor-pointer flex items-center justify-center gap-3">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{notaEnEdicion ? 'Actualizar Nota' : 'Guardar'}</button>
              </div>
            </div>

            <div className={`bg-white rounded-[40px] border-2 transition-all duration-500 overflow-hidden ${isInteresesOpen ? 'border-blue-100 shadow-xl' : 'border-slate-100 shadow-sm'}`}>
              <div onClick={() => setIsInteresesOpen(!isInteresesOpen)} className="p-8 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3"><div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-colors ${isInteresesOpen ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}><Building className="h-5 w-5" /></div><div><h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Intereses</h3><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{cliente.intereses?.length || 0}</p></div></div>
                <div className="flex items-center gap-3"><button onClick={(e) => { e.stopPropagation(); handleOpenVincular(); }} className="h-8 w-8 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-blue-600 shadow-sm active:scale-90 cursor-pointer"><Plus className="h-4 w-4" /></button><ChevronDown className={`h-4 w-4 text-slate-300 transition-transform ${isInteresesOpen ? 'rotate-180' : ''}`} /></div>
              </div>
              {isInteresesOpen && (
                <div className="px-8 pb-8 space-y-6 animate-in slide-in-from-top-4 duration-500">
                  <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" /><input type="text" placeholder="Filtrar..." value={searchIntereses} onChange={(e) => setSearchIntereses(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-600 outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-sm" /></div>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 scrollbar-hide">
                    {interesesFiltrados.length === 0 ? <div className="py-10 text-center border-2 border-dashed border-slate-50 rounded-[32px]"><p className="text-[10px] font-black text-slate-300 uppercase">Sin vínculos</p></div> : 
                      interesesFiltrados.map((interes) => {
                        const date = new Date(interes.fechaRegistro);
                        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
                        
                        return (
                          <div key={interes.propiedadId} className="bg-slate-50 p-5 rounded-[28px] border border-slate-100 hover:bg-white hover:shadow-xl transition-all group/prop cursor-pointer relative">
                            <div className="absolute top-4 right-4 flex items-center gap-2">
                              <span className="text-[8px] font-black text-slate-900 uppercase tracking-tighter group-hover/prop:opacity-0 transition-opacity">
                                {formattedDate}
                              </span>
                              <div className="flex items-center gap-1 opacity-0 group-hover/prop:opacity-100 transition-all absolute right-0">
                                {idInteresABorrar === interes.propiedadId ? (
                                  <div className="flex items-center gap-1 bg-rose-50 p-0.5 rounded-lg border border-rose-100 shadow-sm animate-in zoom-in duration-200">
                                    <button onClick={(e) => { e.stopPropagation(); handleDesvincularInteres(interes.propiedadId); setIdInteresABorrar(null); }} className="p-1 text-rose-600 hover:bg-rose-100 rounded-md transition-all cursor-pointer"><Check className="h-3 w-3" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); setIdInteresABorrar(null); }} className="p-1 text-slate-400 hover:bg-slate-100 rounded-md transition-all cursor-pointer"><X className="h-3 w-3" /></button>
                                  </div>
                                ) : (
                                  <>
                                    <button onClick={(e) => { e.stopPropagation(); handleOpenVincular(interes); }} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all cursor-pointer"><Pencil className="h-3 w-3" /></button>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setIdInteresABorrar(interes.propiedadId); }}
                                      className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            <h4 className="text-[11px] font-black text-slate-900 line-clamp-2 leading-tight mb-3 group-hover/prop:text-blue-600 pr-16">{interes.titulo}</h4>
                            <div className="flex items-center justify-between pt-3 border-t border-slate-200/50">
                              <span className="text-blue-600 font-black text-[10px] flex items-center gap-1">{formatCurrency(interes.precio)}</span>
                              <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border ${getNivelInteresStyles(interes.nivelInteres)}`}>{interes.nivelInteres}</span>
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[500] flex items-center justify-center p-4">
          <CrearClienteForm 
            initialData={cliente}
            onSuccess={() => {
              mutate();
              setShowEditModal(false);
            }}
            onCancel={() => setShowEditModal(false)}
          />
        </div>
      )}
    </div>
  );
};

export const ClienteDetalle = () => {
  return (
    <SWRConfig value={{ provider: localStorageProvider }}>
      <ClienteDetalleContent />
    </SWRConfig>
  );
};
