import { useState, useMemo, useEffect, useRef } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, 
  Search,
  AlertCircle,
  Activity,
  ChevronDown,
  User,
  ExternalLink,
  MessageSquare,
  Clock,
  Settings,
  Heart,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  Calendar,
  CheckCheck,
  Eye,
  MapPin,
  TrendingUp
} from 'lucide-react';
import { CrearClienteForm } from '../../clientes/components/CrearClienteForm';
import { eliminarCliente } from '../../clientes/api/eliminarCliente';
import { vincularPropiedad } from '../../clientes/api/vincularPropiedad';
import { desvincularPropiedad } from '../../clientes/api/desvincularPropiedad';
import { toast } from 'sonner';
import type { Cliente } from '../../clientes/types';
import { getClienteById } from '../../clientes/api/getClienteById';
import { api } from '@/lib/axios';

interface LogResponse {
  id: string;
  accion: string;
  detalleJson: string | null;
  triggerMessage: string | null;
  fecha: string;
}

interface InteresResumen {
  propiedadId: string;
  titulo: string;
  imagenUrl: string | null;
  precio: number;
  sector: string | null;
  nivelInteres: string;
  fecha: string;
}

interface ClientGroup {
  telefono: string;
  nombre: string;
  clienteId: string | null;
  ultimaActividad: string;
  registradoPorIA: boolean;
  logs: LogResponse[];
  intereses: InteresResumen[];
}

interface MensajeChat {
  rol: 'cliente' | 'ia';
  contenido: string;
  fecha: string;
}

const NIVELES_INTERES = [
  { label: 'Alto 🔥', value: 'Alto', color: 'text-rose-600 bg-rose-50' },
  { label: 'Medio ⚡', value: 'Medio', color: 'text-amber-600 bg-amber-50' },
  { label: 'Bajo ❄️', value: 'Bajo', color: 'text-blue-600 bg-blue-50' },
  { label: 'Descartada ❌', value: 'Descartada', color: 'text-slate-400 bg-slate-50' }
];

const dateFormatter = new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'short' });
const fullDateFormatter = new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'long', year: 'numeric' });
const timeFormatter = new Intl.DateTimeFormat('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false });
const currencyFormatter = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });

const formatWhatsAppText = (text: string) => {
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return <strong key={i} className="font-black">{part.slice(1, -1)}</strong>;
    }
    return part;
  });
};

export const AuditoriaLogsView = () => {
  const navigate = useNavigate();
  const { mutate: globalMutate } = useSWRConfig();
  const { data: clientGroups, error, isLoading, mutate } = useSWR<ClientGroup[]>('/ia/logs', {
    revalidateOnFocus: true,
    dedupingInterval: 0
  });
  
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<'registrado' | 'conversacion' | 'intereses' | null>(null);
  const [search, setSearch] = useState('');
  
  // Estados para Edición y Borrado de Cliente
  const [clienteEnEdicion, setClienteEnEdicion] = useState<Cliente | null>(null);
  const [idABorrar, setIdABorrar] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados para Conversación (Fase 3)
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [totalMensajes, setTotalMensajes] = useState(0);
  const [loadingChat, setLoadingChat] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Estados para Intereses (Fase 4 + Mejoras)
  const [expandedInteresId, setExpandedInteresId] = useState<string | null>(null);
  const [dropdownInteresOpenId, setDropdownInteresOpenId] = useState<string | null>(null);
  const [updatingInteresId, setUpdatingInteresId] = useState<string | null>(null);
  const [interesABorrarId, setInteresABorrarId] = useState<string | null>(null);
  const [isDeletingInteres, setIsDeletingInteres] = useState(false);

  const filteredGroups = useMemo(() => {
    if (!clientGroups) return [];
    
    return clientGroups.filter(group => {
      const nombre = group?.nombre || '';
      const telefono = group?.telefono || '';
      const searchStr = search || '';
      
      return nombre.toLowerCase().includes(searchStr.toLowerCase()) || 
             telefono.includes(searchStr);
    });
  }, [clientGroups, search]);

  const handleRetry = () => mutate(undefined, { revalidate: true });

  const handleEditClick = async (clienteId: string) => {
    try {
      const fullCliente = await getClienteById(clienteId);
      setClienteEnEdicion(fullCliente);
    } catch {
      toast.error('No se pudo cargar la información del cliente para editar.');
    }
  };

  const handleConfirmDelete = async (clienteId: string) => {
    setIsDeleting(true);
    try {
      await eliminarCliente(clienteId);
      toast.success('Prospecto eliminado exitosamente');
      setIdABorrar(null);
      await mutate();
      globalMutate('/clientes');
      globalMutate('/dashboard/kpis');
    } catch {
      toast.error('No se pudo eliminar el prospecto');
    } finally {
      setIsDeleting(false);
    }
  };

  const loadConversation = async (telefono: string, skip = 0, isMore = false) => {
    if (isMore) setLoadingMore(true);
    else setLoadingChat(true);

    try {
      const res = await api.get(`/ia/conversacion/${telefono}?skip=${skip}&take=10`);
      if (isMore) {
        setMensajes(prev => [...res.data.mensajes, ...prev]);
      } else {
        setMensajes(res.data.mensajes);
        setTotalMensajes(res.data.total);
      }
    } catch {
      toast.error('No se pudo cargar el historial de conversación.');
    } finally {
      setLoadingChat(false);
      setLoadingMore(false);
    }
  };

  const handleUpdateNivelInteres = async (clienteId: string, propiedadId: string, nuevoNivel: string) => {
    setUpdatingInteresId(propiedadId);
    try {
      await vincularPropiedad(clienteId, propiedadId, nuevoNivel);
      toast.success('Interés actualizado correctamente');
      await mutate();
      globalMutate('/dashboard/kpis');
    } catch (err) {
      console.error('Error al actualizar interés:', err);
      toast.error('No se pudo actualizar el nivel de interés');
    } finally {
      setUpdatingInteresId(null);
      setDropdownInteresOpenId(null);
    }
  };

  const handleConfirmDeleteInteres = async (clienteId: string, propiedadId: string) => {
    setIsDeletingInteres(true);
    try {
      await desvincularPropiedad(clienteId, propiedadId);
      toast.success('Interés eliminado correctamente');
      setInteresABorrarId(null);
      await mutate();
      globalMutate('/dashboard/kpis');
    } catch (err) {
      console.error('Error al eliminar interés:', err);
      toast.error('No se pudo eliminar el interés');
    } finally {
      setIsDeletingInteres(false);
    }
  };

  useEffect(() => {
    if (expandedSection === 'conversacion' && expandedClientId) {
      loadConversation(expandedClientId);
    }
  }, [expandedSection, expandedClientId]);

  useEffect(() => {
    if (expandedSection === 'conversacion' && !loadingMore && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes, expandedSection, loadingMore]);

  const getNivelInteresColor = (nivel: string | null | undefined) => {
    if (!nivel) return 'bg-slate-100 text-slate-500';
    switch (nivel.toLowerCase()) {
      case 'alto': return 'bg-rose-500 text-white shadow-rose-500/20';
      case 'medio': return 'bg-orange-500 text-white shadow-orange-500/20';
      case 'bajo': return 'bg-slate-400 text-white shadow-slate-400/20';
      case 'descartada': return 'bg-slate-900 text-white shadow-slate-900/20';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  if (error) return (
    <div className="bg-rose-50 border border-rose-100 p-12 rounded-[2rem] text-center max-w-2xl mx-auto mt-10 shadow-xl shadow-rose-500/5 animate-in zoom-in-95 duration-500">
      <div className="bg-white h-20 w-20 rounded-3xl shadow-lg flex items-center justify-center mx-auto mb-6">
        <AlertCircle className="h-10 w-10 text-rose-500" />
      </div>
      <h3 className="text-2xl font-black text-rose-900 uppercase tracking-tight mb-2">Error de Conexión</h3>
      <p className="text-rose-600/80 font-bold text-sm mb-8 leading-relaxed px-10">
        No se pudo contactar con el servicio de auditoría de IA.
      </p>
      <button 
        onClick={handleRetry}
        className="cursor-pointer bg-rose-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-rose-700 transition-all shadow-lg active:scale-95"
      >
        Reintentar Conexión
      </button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header Estilo Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-2xl shadow-blue-600/30 rotate-3">
              <Bot className="h-8 w-8" />
            </div>
            Auditoría IA
          </h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-3 flex items-center gap-2">
            <Activity className="h-3 w-3 text-emerald-500" />
            Supervisión proactiva del asistente
          </p>
        </div>

        <div className="relative w-full max-w-sm group">
          <Search className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar cliente o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-8 focus:ring-blue-50 focus:border-blue-200 transition-all outline-none shadow-sm placeholder:text-slate-300"
          />
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-white border-2 border-slate-50 rounded-[2rem] animate-pulse"></div>
          ))
        ) : filteredGroups.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-100 rounded-[3rem] py-24 text-center">
            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bot className="h-10 w-10 text-slate-200" />
            </div>
            <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No hay actividad reciente</p>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div 
              key={group.telefono}
              className={`bg-white border-2 transition-all duration-500 rounded-[2.5rem] overflow-hidden ${
                expandedClientId === group.telefono 
                  ? 'border-blue-200 shadow-2xl shadow-blue-600/5 ring-8 ring-blue-50/50' 
                  : 'border-slate-50 hover:border-slate-200 hover:shadow-xl hover:shadow-slate-200/20'
              }`}
            >
              {/* Header del Cliente */}
              <div className="p-6 flex items-center justify-between gap-4">
                <div 
                  className="flex-1 flex items-center gap-5 cursor-pointer"
                  onClick={() => {
                    setExpandedClientId(expandedClientId === group.telefono ? null : group.telefono);
                    setExpandedSection(null);
                  }}
                >
                  <div className={`h-16 w-16 rounded-[1.5rem] flex items-center justify-center text-xl font-black shadow-inner rotate-2 transition-transform ${
                    expandedClientId === group.telefono ? 'bg-blue-600 text-white scale-110' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {group.nombre[0]}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight truncate">
                        {group.nombre}
                      </h3>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-sm font-bold text-slate-400">{group.telefono}</p>
                      <span className="h-1 w-1 bg-slate-200 rounded-full"></span>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {dateFormatter.format(new Date(group.ultimaActividad))} @ {timeFormatter.format(new Date(group.ultimaActividad))}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {group.clienteId && (
                    <button 
                      onClick={() => navigate(`/prospectos/${group.clienteId}`)}
                      className="hidden sm:flex items-center gap-3 bg-slate-50 hover:bg-slate-900 hover:text-white p-3 pr-5 rounded-2xl transition-all group cursor-pointer border border-slate-100 hover:border-slate-900"
                    >
                      <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 shadow-sm transition-colors">
                        <User size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-[9px] font-black text-slate-400 group-hover:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                          Expediente
                          <ExternalLink size={10} />
                        </p>
                        <p className="text-xs font-black leading-none mt-1">Ver Cliente</p>
                      </div>
                    </button>
                  )}

                  <button 
                    onClick={() => {
                      setExpandedClientId(expandedClientId === group.telefono ? null : group.telefono);
                      setExpandedSection(null);
                    }}
                    className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                      expandedClientId === group.telefono ? 'bg-blue-50 text-blue-600 rotate-180' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <ChevronDown className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Secciones Desplegables */}
              {expandedClientId === group.telefono && (
                <div className="p-8 pt-2 border-t border-slate-50 space-y-4 animate-in slide-in-from-top-4 duration-500">
                  
                  {/* Fase 2: Registrado */}
                  <div className="space-y-3">
                    <button 
                      onClick={() => setExpandedSection(expandedSection === 'registrado' ? null : 'registrado')}
                      className={`w-full flex items-center justify-between p-5 rounded-3xl transition-all cursor-pointer border ${
                        expandedSection === 'registrado' ? 'bg-blue-50 border-blue-100 shadow-sm' : 'bg-slate-50/50 hover:bg-slate-50 border-transparent hover:border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-sm transition-colors ${
                          expandedSection === 'registrado' ? 'bg-blue-600 text-white' : 'bg-white text-slate-400'
                        }`}>
                          <Settings className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-black text-slate-900 uppercase tracking-tight">Registrado</span>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform ${expandedSection === 'registrado' ? 'rotate-180 text-blue-500' : ''}`} />
                    </button>

                    {expandedSection === 'registrado' && (
                      <div className="px-6 py-8 bg-blue-50/30 rounded-[2rem] border border-blue-100/50 animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-center gap-6">
                            {group.registradoPorIA ? (
                              <>
                                <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-xl shadow-blue-500/10 border border-blue-50">
                                  <Bot size={32} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-blue-600/20">
                                      IA-Nativo
                                    </span>
                                    <h4 className="text-lg font-black text-slate-900">Registrado por IA</h4>
                                  </div>
                                  <div className="flex items-center gap-4 mt-2">
                                    <p className="text-[11px] font-bold text-slate-400 flex items-center gap-2">
                                      <Calendar className="h-3 w-3" />
                                      Historial de registro IA confirmado
                                    </p>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-xl shadow-slate-500/10 border border-slate-100">
                                  <User size={32} />
                                </div>
                                <div>
                                  <h4 className="text-lg font-black text-slate-900">Registrado por el agente</h4>
                                  <p className="text-[11px] font-bold text-slate-400 mt-1 italic">Ingreso manual o vía importación</p>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            {idABorrar === group.clienteId ? (
                              <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-xl border border-rose-100 animate-in zoom-in duration-200">
                                <p className="text-[10px] font-black text-rose-500 uppercase px-3">¿Borrar?</p>
                                <button 
                                  onClick={() => group.clienteId && handleConfirmDelete(group.clienteId)}
                                  disabled={isDeleting}
                                  className="h-10 w-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center hover:bg-emerald-600 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                                >
                                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-5 w-5" />}
                                </button>
                                <button 
                                  onClick={() => setIdABorrar(null)}
                                  disabled={isDeleting}
                                  className="h-10 w-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-all cursor-pointer"
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <button 
                                  onClick={() => group.clienteId && handleEditClick(group.clienteId)}
                                  className="h-14 w-14 bg-white text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl flex items-center justify-center transition-all shadow-sm border border-slate-100 hover:border-blue-200 cursor-pointer group/btn"
                                >
                                  <Pencil className="h-6 w-6 group-hover/btn:scale-110 transition-transform" />
                                </button>
                                <button 
                                  onClick={() => setIdABorrar(group.clienteId)}
                                  className="h-14 w-14 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl flex items-center justify-center transition-all shadow-sm border border-slate-100 hover:border-rose-200 cursor-pointer group/btn"
                                >
                                  <Trash2 className="h-6 w-6 group-hover/btn:scale-110 transition-transform" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Fase 3: Conversación */}
                  <div className="space-y-3">
                    <button 
                      onClick={() => setExpandedSection(expandedSection === 'conversacion' ? null : 'conversacion')}
                      className={`w-full flex items-center justify-between p-5 rounded-3xl transition-all cursor-pointer border ${
                        expandedSection === 'conversacion' ? 'bg-emerald-50 border-emerald-100 shadow-sm' : 'bg-slate-50/50 hover:bg-slate-50 border-transparent hover:border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-sm transition-colors ${
                          expandedSection === 'conversacion' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400'
                        }`}>
                          <MessageSquare className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-black text-slate-900 uppercase tracking-tight">Conversación</span>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform ${expandedSection === 'conversacion' ? 'rotate-180 text-emerald-500' : ''}`} />
                    </button>

                    {expandedSection === 'conversacion' && (
                      <div className="relative bg-[#e5ddd5] rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl h-[600px] flex flex-col">
                        <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat"></div>
                        <div ref={scrollRef} className="relative flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
                          {mensajes.length < totalMensajes && (
                            <div className="flex justify-center pb-4">
                              <button onClick={() => loadConversation(group.telefono, mensajes.length, true)} disabled={loadingMore} className="bg-white/80 hover:bg-white text-slate-600 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-all border border-slate-200/50 disabled:opacity-50 cursor-pointer">
                                {loadingMore ? <div className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" />Cargando...</div> : 'Cargar mensajes anteriores'}
                              </button>
                            </div>
                          )}
                          {loadingChat ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                              <div className="h-16 w-16 bg-white rounded-3xl flex items-center justify-center shadow-xl animate-bounce"><MessageSquare className="h-8 w-8 text-emerald-500" /></div>
                              <p className="font-black uppercase text-[10px] tracking-widest animate-pulse">Sincronizando Chat...</p>
                            </div>
                          ) : mensajes.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                              <div className="h-16 w-16 bg-white/50 rounded-3xl flex items-center justify-center border-2 border-dashed border-slate-300"><MessageSquare className="h-8 w-8 text-slate-300" /></div>
                              <p className="font-black uppercase text-[10px] tracking-widest">No hay historial de chat</p>
                            </div>
                          ) : (
                            (() => {
                              let lastDate = '';
                              return mensajes.map((msg, idx) => {
                                const msgDate = new Date(msg.fecha).toDateString();
                                const showDivider = msgDate !== lastDate;
                                lastDate = msgDate;
                                return (
                                  <div key={idx} className="space-y-4">
                                    {showDivider && (
                                      <div className="flex justify-center my-6">
                                        <span className="bg-white/90 px-4 py-1.5 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest shadow-sm border border-slate-100">
                                          {fullDateFormatter.format(new Date(msg.fecha))}
                                        </span>
                                      </div>
                                    )}
                                    <div className={`flex ${msg.rol === 'ia' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                      <div className={`relative max-w-[85%] px-4 py-2.5 rounded-2xl shadow-sm ${msg.rol === 'ia' ? 'bg-[#dcf8c6] text-slate-800 rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none'}`}>
                                        <div className={`absolute top-0 w-3 h-3 ${msg.rol === 'ia' ? '-right-2 bg-[#dcf8c6] [clip-path:polygon(0_0,0_100%,100%_0)]' : '-left-2 bg-white [clip-path:polygon(100%_0,100%_100%,0_0)]'}`}></div>
                                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{formatWhatsAppText(msg.contenido)}</p>
                                        <div className="flex items-center justify-end gap-1.5 mt-1 opacity-50"><span className="text-[9px] font-bold uppercase">{timeFormatter.format(new Date(msg.fecha))}</span>{msg.rol === 'ia' && <CheckCheck size={12} className="text-blue-500" />}</div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              });
                            })()
                          )}
                        </div>
                        <div className="bg-[#f0f2f5] p-4 flex items-center gap-4"><div className="flex-1 bg-white h-12 rounded-2xl px-6 flex items-center text-slate-400 text-sm font-medium">Solo lectura (Modo Auditoría)</div></div>
                      </div>
                    )}
                  </div>

                  {/* Fase 4: Intereses */}
                  <div className="space-y-3">
                    <button 
                      onClick={() => setExpandedSection(expandedSection === 'intereses' ? null : 'intereses')}
                      className={`w-full flex items-center justify-between p-5 rounded-3xl transition-all cursor-pointer border ${
                        expandedSection === 'intereses' ? 'bg-rose-50 border-rose-100 shadow-sm' : 'bg-slate-50/50 hover:bg-slate-50 border-transparent hover:border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-sm transition-colors ${
                          expandedSection === 'intereses' ? 'bg-rose-500 text-white' : 'bg-white text-slate-400'
                        }`}>
                          <Heart className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-black text-slate-900 uppercase tracking-tight">Intereses</span>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform ${expandedSection === 'intereses' ? 'rotate-180 text-rose-500' : ''}`} />
                    </button>

                    {expandedSection === 'intereses' && (
                      <div className="space-y-4 animate-in zoom-in-95 duration-300">
                        {group.intereses.length === 0 ? (
                          <div className="p-12 text-center bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                            <TrendingUp className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Aún no se han detectado intereses</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-4">
                            {group.intereses.map((interes) => {
                              const nivelActual = NIVELES_INTERES.find(n => n.value === interes.nivelInteres) || NIVELES_INTERES[1];
                              const isUpdating = updatingInteresId === interes.propiedadId;
                              const isDeletingInt = interesABorrarId === interes.propiedadId;

                              return (
                                <div 
                                  key={interes.propiedadId}
                                  className="bg-white border-2 border-slate-50 rounded-[2.5rem] p-4 flex flex-col gap-4 hover:border-blue-100 transition-all group/card shadow-sm hover:shadow-xl hover:shadow-blue-600/5 relative"
                                >
                                  {(isUpdating || isDeletingInteres) && isUpdating && <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-[2.5rem]"><Loader2 className="h-8 w-8 text-blue-600 animate-spin" /></div>}
                                  
                                  <div className="flex items-center gap-6">
                                    {/* Foto Mini-Premium */}
                                    <div className="relative h-24 w-24 shrink-0 rounded-3xl overflow-hidden bg-slate-100 shadow-inner group-hover/card:scale-105 transition-transform duration-500">
                                      {interes.imagenUrl ? (
                                        <img src={interes.imagenUrl} alt="" className="h-full w-full object-cover" />
                                      ) : (
                                        <div className="h-full w-full flex items-center justify-center text-slate-300"><MapPin size={24} /></div>
                                      )}
                                      <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter shadow-xl ${getNivelInteresColor(interes.nivelInteres)}`}>
                                        {interes.nivelInteres}
                                      </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-md font-black text-slate-900 truncate tracking-tight">{interes.titulo}</h4>
                                      <div className="flex items-center gap-4 mt-1">
                                        <p className="text-blue-600 font-black text-sm">{currencyFormatter.format(interes.precio)}</p>
                                        <span className="h-1 w-1 bg-slate-200 rounded-full"></span>
                                        <p className="text-slate-400 font-bold text-[11px] truncate">{interes.sector || 'Sector no especificado'}</p>
                                      </div>
                                      
                                      <div className="flex items-center gap-3 mt-3">
                                        {/* Dropdown Nivel de Interés */}
                                        <div className="relative">
                                          <button 
                                            onClick={() => setDropdownInteresOpenId(dropdownInteresOpenId === interes.propiedadId ? null : interes.propiedadId)}
                                            className={`cursor-pointer ${`text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-xl flex items-center gap-2 border border-transparent hover:border-current transition-all shadow-sm ${nivelActual.color}`}`}
                                          >
                                            {nivelActual.label}
                                            <ChevronDown className="h-3 w-3" />
                                          </button>
                                          
                                          {dropdownInteresOpenId === interes.propiedadId && (
                                            <>
                                              <div className="fixed inset-0 z-40 cursor-default" onClick={() => setDropdownInteresOpenId(null)}></div>
                                              <div className="absolute left-0 top-full mt-2 z-50 bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 w-40 animate-in fade-in zoom-in-95 duration-200">
                                                {NIVELES_INTERES.map(n => (
                                                  <button 
                                                    key={n.value}
                                                    onClick={() => group.clienteId && handleUpdateNivelInteres(group.clienteId, interes.propiedadId, n.value)}
                                                    className="w-full text-left px-4 py-2 text-[10px] font-black uppercase hover:bg-slate-50 rounded-xl transition-colors flex items-center justify-between cursor-pointer"
                                                  >
                                                    {n.label}
                                                    {interes.nivelInteres === n.value && <Check className="h-3.5 w-3.5 text-blue-600" />}
                                                  </button>
                                                ))}
                                              </div>
                                            </>
                                          )}
                                        </div>

                                        <button 
                                          onClick={() => setExpandedInteresId(expandedInteresId === interes.propiedadId ? null : interes.propiedadId)}
                                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                                            expandedInteresId === interes.propiedadId ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                          }`}
                                        >
                                          <Eye size={12} />
                                          Ver Disparador
                                        </button>
                                        <button 
                                          onClick={() => window.location.href = `/propiedades?id=${interes.propiedadId}`}
                                          className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
                                        >
                                          <ExternalLink size={12} />
                                          Ver Ficha
                                        </button>

                                        {/* Borrar Interés con Confirmación Express */}
                                        <div className="flex items-center ml-auto">
                                          {isDeletingInt ? (
                                            <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-xl animate-in zoom-in-95 duration-200 border border-rose-100">
                                              <p className="text-[8px] font-black text-rose-500 uppercase px-2">¿Quitar?</p>
                                              <button 
                                                onClick={() => group.clienteId && handleConfirmDeleteInteres(group.clienteId, interes.propiedadId)}
                                                disabled={isDeletingInteres}
                                                className="h-8 w-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-all cursor-pointer shadow-sm"
                                              >
                                                {isDeletingInteres ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-4 w-4" />}
                                              </button>
                                              <button 
                                                onClick={() => setInteresABorrarId(null)}
                                                disabled={isDeletingInteres}
                                                className="h-8 w-8 bg-white text-slate-400 rounded-lg flex items-center justify-center hover:bg-slate-50 transition-all cursor-pointer border border-slate-100"
                                              >
                                                <X className="h-4 w-4" />
                                              </button>
                                            </div>
                                          ) : (
                                            <button 
                                              onClick={() => setInteresABorrarId(interes.propiedadId)}
                                              className="h-9 w-9 bg-white text-slate-300 hover:text-rose-500 rounded-xl flex items-center justify-center transition-all border border-slate-50 hover:border-rose-100 hover:shadow-sm cursor-pointer group/trash"
                                            >
                                              <Trash2 size={14} className="group-hover/trash:scale-110 transition-transform" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Visor del Disparador (Ojo) */}
                                  {expandedInteresId === interes.propiedadId && (
                                    <div className="mt-2 p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 animate-in slide-in-from-top-4 duration-300">
                                      <div className="flex items-center gap-2 mb-3">
                                        <MessageSquare size={14} className="text-blue-500" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contexto de la IA:</span>
                                      </div>
                                      {(() => {
                                        const logInteres = group.logs.find(l => 
                                          l.accion === 'RegistroInteres' && 
                                          l.detalleJson?.includes(interes.propiedadId)
                                        );
                                        return (
                                          <p className="text-xs font-bold text-slate-600 leading-relaxed italic border-l-4 border-blue-200 pl-4">
                                            "{logInteres?.triggerMessage || 'La IA detectó interés en base a los requerimientos del cliente.'}"
                                          </p>
                                        );
                                      })()}
                                      <div className="mt-4 flex items-center justify-end text-[8px] font-black text-slate-300 uppercase tracking-widest gap-2">
                                        <Clock size={10} />
                                        Detectado el {dateFormatter.format(new Date(interes.fecha))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal de Edición */}
      {clienteEnEdicion && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[500] flex items-center justify-center p-4">
          <div className="max-w-2xl w-full animate-in zoom-in-95 duration-300">
            <CrearClienteForm 
              initialData={clienteEnEdicion}
              onSuccess={async () => {
                await mutate();
                // Revalidamos globalmente para que todas las vistas vean el nuevo nombre
                globalMutate('/ia/logs');
                globalMutate('/clientes');
                setClienteEnEdicion(null);
                toast.success('Información actualizada correctamente');
              }}
              onCancel={() => setClienteEnEdicion(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
