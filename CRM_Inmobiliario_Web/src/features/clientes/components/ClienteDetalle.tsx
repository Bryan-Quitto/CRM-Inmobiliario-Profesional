import { useEffect, useState, useMemo } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Send, 
  Loader2, 
  MessageSquare, 
  Clock, 
  Info,
  Plus,
  Building,
  DollarSign,
  ChevronDown,
  Search
} from 'lucide-react';
import { getClienteById } from '../api/getClienteById';
import { registrarInteraccion } from '../api/registrarInteraccion';
import { vincularPropiedad } from '../api/vincularPropiedad';
import { getPropiedades } from '../../propiedades/api/getPropiedades';
import type { Cliente } from '../types';
import type { Propiedad } from '../../propiedades/types';

interface ClienteDetalleProps {
  id: string;
  onClose: () => void;
}

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

export const ClienteDetalle = ({ id, onClose }: ClienteDetalleProps) => {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [nuevaNota, setNuevaNota] = useState('');
  const [tipoNota, setTipoNota] = useState('Nota');

  // Estados para Vinculación
  const [showVincularModal, setShowVincularModal] = useState(false);
  const [propiedadesDisponibles, setPropiedadesDisponibles] = useState<Propiedad[]>([]);
  const [filtroPropiedad, setFiltroPropiedad] = useState('');
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState<Propiedad | null>(null);
  const [nivelInteres, setNivelInteres] = useState('Medio');
  const [vinculando, setVinculando] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Estados de UI World-Class
  const [expandedSections, setExpandedSections] = useState({
    intereses: true,
    historial: true
  });
  const [searchIntereses, setSearchIntereses] = useState('');
  const [searchHistorial, setSearchHistorial] = useState('');

  const fetchCliente = async () => {
    try {
      setLoading(true);
      const data = await getClienteById(id);
      setCliente(data);
    } catch (err) {
      console.error('Error al cargar detalles del cliente:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCliente();
  }, [id]);

  const toggleSection = (section: 'intereses' | 'historial') => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleOpenVincular = async () => {
    setShowVincularModal(true);
    setFiltroPropiedad('');
    setPropiedadSeleccionada(null);
    try {
      const data = await getPropiedades();
      setPropiedadesDisponibles(data.filter(p => p.estadoComercial === 'Disponible'));
    } catch (err) {
      console.error('Error al cargar propiedades:', err);
    }
  };

  const handleVincular = async () => {
    if (!propiedadSeleccionada) return;
    try {
      setVinculando(true);
      await vincularPropiedad(id, propiedadSeleccionada.id, nivelInteres);
      setShowVincularModal(false);
      setPropiedadSeleccionada(null);
      fetchCliente();
    } catch (err) {
      console.error('Error al vincular propiedad:', err);
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
    return cliente.interacciones.filter(i => 
      i.notas.toLowerCase().includes(searchHistorial.toLowerCase()) ||
      i.tipoInteraccion.toLowerCase().includes(searchHistorial.toLowerCase())
    );
  }, [cliente?.interacciones, searchHistorial]);

  const propiedadesFiltradas = propiedadesDisponibles.filter(p => 
    p.titulo.toLowerCase().includes(filtroPropiedad.toLowerCase())
  );

  const handleGuardarNota = async () => {
    if (!nuevaNota.trim()) return;
    try {
      setSending(true);
      await registrarInteraccion({
        clienteId: id,
        tipoInteraccion: tipoNota,
        notas: nuevaNota
      });
      setNuevaNota('');
      // Recargar para ver la nueva nota en el timeline
      fetchCliente();
    } catch (err) {
      console.error('Error al guardar nota:', err);
    } finally {
      setSending(false);
    }
  };

  const getEtapaStyles = (etapa: string) => {
    switch (etapa) {
      case 'Nuevo': return 'bg-blue-500 text-white';
      case 'Contacto': return 'bg-amber-500 text-white';
      case 'Negociacion': return 'bg-emerald-500 text-white';
      case 'Cerrado': return 'bg-slate-700 text-white';
      default: return 'bg-slate-400 text-white';
    }
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

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Vincular Propiedad Modal */}
      {showVincularModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-all duration-500" onClick={() => setShowVincularModal(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Sugerir Propiedad</h3>
              <button 
                onClick={() => setShowVincularModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-8">
              {/* Buscador Dinámico */}
              <div className="space-y-3 relative">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Seleccionar Propiedad</label>
                <div className="relative">
                  <div className={`flex items-center gap-3 bg-slate-50 border-2 transition-all duration-300 rounded-2xl px-5 py-4 ${showDropdown ? 'border-blue-500 ring-4 ring-blue-50' : 'border-slate-100 hover:border-slate-200'}`}>
                    <Building className={`h-5 w-5 ${showDropdown ? 'text-blue-500' : 'text-slate-400'}`} />
                    <input 
                      type="text"
                      className="w-full bg-transparent border-none focus:ring-0 outline-none font-bold text-slate-700 placeholder:text-slate-300"
                      placeholder="Buscar por título..."
                      value={filtroPropiedad}
                      onChange={(e) => {
                        setFiltroPropiedad(e.target.value);
                        setShowDropdown(true);
                        setPropiedadSeleccionada(null);
                      }}
                      onFocus={() => setShowDropdown(true)}
                    />
                  </div>

                  {showDropdown && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden z-[310] animate-in slide-in-from-top-2 duration-200">
                      <div className="max-h-60 overflow-y-auto p-2">
                        {propiedadesFiltradas.length === 0 ? (
                          <div className="p-4 text-center">
                            <p className="text-xs font-bold text-slate-400 italic">No se encontraron propiedades disponibles</p>
                          </div>
                        ) : (
                          propiedadesFiltradas.map(p => (
                            <button
                              key={p.id}
                              onClick={() => {
                                setPropiedadSeleccionada(p);
                                setFiltroPropiedad(p.titulo);
                                setShowDropdown(false);
                              }}
                              className="w-full text-left p-4 hover:bg-blue-50 rounded-2xl transition-all group flex items-center justify-between cursor-pointer"
                            >
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{p.titulo}</span>
                                <span className="text-[10px] font-bold text-slate-400">{formatCurrency(p.precio)}</span>
                              </div>
                              <Plus className="h-4 w-4 text-slate-200 group-hover:text-blue-400" />
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Selector de Nivel de Interés */}
              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nivel de Interés Inicial</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Alto', 'Medio', 'Bajo', 'Descartada'].map(nivel => (
                    <button
                      key={nivel}
                      onClick={() => setNivelInteres(nivel)}
                      className={`px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 cursor-pointer ${
                        nivelInteres === nivel 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/20 scale-[1.02]' 
                          : 'bg-white border-slate-50 text-slate-400 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {nivel}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  onClick={() => setShowVincularModal(false)}
                  className="flex-1 px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl text-xs font-black hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleVincular}
                  disabled={!propiedadSeleccionada || vinculando}
                  className="flex-1 px-6 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {vinculando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Vincular
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drawer Panel */}
      <div className="relative w-full md:w-[750px] lg:w-[950px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out">
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
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Perfil del Prospecto</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gestión de Seguimiento</p>
            </div>
          </div>
          <div className="flex gap-2">
            {cliente && (
              <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${getEtapaStyles(cliente.etapaEmbudo)}`}>
                {cliente.etapaEmbudo}
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest animate-pulse">Obteniendo expediente...</p>
          </div>
        ) : !cliente ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center mb-6">
              <Info className="h-10 w-10 text-rose-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Cliente no encontrado</h3>
            <button onClick={onClose} className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-sm cursor-pointer">Cerrar</button>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
            {/* Sección Izquierda: Info y Registro */}
            <div className="flex-1 overflow-y-auto p-8 border-r border-slate-50 space-y-10">
              {/* Info básica */}
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="h-20 w-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600">
                    <User className="h-10 w-10" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                      {cliente.nombre} {cliente.apellido}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5 text-slate-500 text-sm font-bold">
                        <Phone className="h-3.5 w-3.5 text-blue-500" />
                        {cliente.telefono}
                      </div>
                      {cliente.email && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-sm font-bold">
                          <Mail className="h-3.5 w-3.5 text-blue-500" />
                          {cliente.email}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Origen</p>
                    <p className="text-sm font-black text-slate-900">{cliente.origen}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Registrado</p>
                    <p className="text-sm font-black text-slate-900">{formatDate(cliente.fechaCreacion).split(',')[0]}</p>
                  </div>
                </div>
              </div>

              {/* Registro de Notas */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-1 bg-blue-600 rounded-full"></div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Bitácora de Seguimiento</h3>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-500 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    {['Nota', 'Llamada', 'WhatsApp'].map((tipo) => (
                      <button
                        key={tipo}
                        onClick={() => setTipoNota(tipo)}
                        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          tipoNota === tipo ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {tipo}
                      </button>
                    ))}
                  </div>
                  <textarea 
                    value={nuevaNota}
                    onChange={(e) => setNuevaNota(e.target.value)}
                    placeholder={`Escribe aquí el resumen de la ${tipoNota.toLowerCase()}...`}
                    className="w-full h-32 bg-transparent border-none focus:ring-0 outline-none text-slate-600 font-medium placeholder:text-slate-300 resize-none"
                  />
                  <div className="flex justify-end pt-4 border-t border-slate-50">
                    <button 
                      onClick={handleGuardarNota}
                      disabled={sending || !nuevaNota.trim()}
                      className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Guardar Interacción
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección Derecha: Panel Lateral (Secciones Colapsables) */}
            <div className="w-full lg:w-[380px] bg-slate-50/50 overflow-y-auto p-6 border-l border-slate-50 space-y-4">
              
              {/* Bloque: Propiedades de Interés */}
              <div className={`bg-white rounded-[32px] border transition-all duration-500 overflow-hidden ${expandedSections.intereses ? 'border-blue-100 shadow-xl shadow-blue-600/5' : 'border-slate-100 shadow-sm'}`}>
                {/* Header Sección */}
                <div 
                  onClick={() => toggleSection('intereses')}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${expandedSections.intereses ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Building className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Propiedades de Interés</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{cliente.intereses?.length || 0} Vinculadas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenVincular(); }}
                      className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-blue-600 transition-all cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform duration-500 ${expandedSections.intereses ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Contenido Sección */}
                {expandedSections.intereses && (
                  <div className="px-5 pb-5 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    {/* Buscador de Sección */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-300" />
                      <input 
                        type="text"
                        placeholder="Filtrar intereses..."
                        value={searchIntereses}
                        onChange={(e) => setSearchIntereses(e.target.value)}
                        className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-hide">
                      {interesesFiltrados.length === 0 ? (
                        <div className="py-8 text-center border-2 border-dashed border-slate-50 rounded-2xl">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sin coincidencias</p>
                        </div>
                      ) : (
                        interesesFiltrados.map((interes) => (
                          <div key={interes.propiedadId} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-3 hover:bg-white hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="text-[11px] font-black text-slate-900 line-clamp-2 leading-tight">
                                {interes.titulo}
                              </h4>
                              <span className={`shrink-0 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border ${getNivelInteresStyles(interes.nivelInteres)}`}>
                                {interes.nivelInteres}
                              </span>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100/50">
                              <div className="flex items-center gap-1 text-blue-600 font-black text-[10px]">
                                <DollarSign className="h-3 w-3" />
                                {formatCurrency(interes.precio)}
                              </div>
                              <span className="text-[8px] font-bold text-slate-400">
                                {formatDate(interes.fechaRegistro).split(',')[0]}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Bloque: Historial / Timeline */}
              <div className={`bg-white rounded-[32px] border transition-all duration-500 overflow-hidden ${expandedSections.historial ? 'border-indigo-100 shadow-xl shadow-indigo-600/5' : 'border-slate-100 shadow-sm'}`}>
                {/* Header Sección */}
                <div 
                  onClick={() => toggleSection('historial')}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${expandedSections.historial ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">Historial de Actividad</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{cliente.interacciones?.length || 0} Eventos</p>
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-300 transition-transform duration-500 ${expandedSections.historial ? 'rotate-180' : ''}`} />
                </div>

                {/* Contenido Sección */}
                {expandedSections.historial && (
                  <div className="px-5 pb-5 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    {/* Buscador de Sección */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-300" />
                      <input 
                        type="text"
                        placeholder="Buscar en el historial..."
                        value={searchHistorial}
                        onChange={(e) => setSearchHistorial(e.target.value)}
                        className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold text-slate-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-3.5 before:w-0.5 before:bg-slate-100 max-h-[500px] overflow-y-auto pr-1 scrollbar-hide">
                      {historialFiltrado.length === 0 ? (
                        <div className="py-8 text-center opacity-30">
                          <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Sin actividad registrada</p>
                        </div>
                      ) : (
                        historialFiltrado.map((interaccion) => (
                          <div key={interaccion.id} className="relative pl-10 group">
                            <div className="absolute left-0 top-1.5 h-7 w-7 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center z-10 group-hover:border-indigo-500 transition-colors">
                              {interaccion.tipoInteraccion === 'Llamada' ? <Phone className="h-3 w-3 text-blue-500" /> : 
                              interaccion.tipoInteraccion === 'WhatsApp' ? <MessageSquare className="h-3 w-3 text-emerald-500" /> : 
                              <Clock className="h-3 w-3 text-slate-400" />}
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-black text-slate-900 uppercase tracking-tight">
                                  {interaccion.tipoInteraccion}
                                </span>
                                <span className="text-[8px] font-bold text-slate-400 italic">
                                  {formatDate(interaccion.fechaInteraccion)}
                                </span>
                              </div>
                              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-sm transition-all group-hover:border-indigo-100">
                                <p className="text-[11px] font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                                  {interaccion.notas}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
