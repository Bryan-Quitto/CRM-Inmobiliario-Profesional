import { useEffect, useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Send, 
  Loader2, 
  MessageSquare, 
  Clock, 
  Info
} from 'lucide-react';
import { getClienteById } from '../api/getClienteById';
import { registrarInteraccion } from '../api/registrarInteraccion';
import type { Cliente } from '../types';

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

export const ClienteDetalle = ({ id, onClose }: ClienteDetalleProps) => {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [nuevaNota, setNuevaNota] = useState('');
  const [tipoNota, setTipoNota] = useState('Nota');

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

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

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
                    className="w-full h-32 bg-transparent border-none focus:ring-0 text-slate-600 font-medium placeholder:text-slate-300 resize-none"
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

            {/* Sección Derecha: Timeline */}
            <div className="w-full lg:w-[350px] bg-slate-50/50 overflow-y-auto p-8 border-l border-slate-50">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Historial
                </h3>
                <span className="bg-white px-2 py-0.5 rounded-md text-[10px] font-black text-slate-400 border border-slate-100">
                  {cliente.interacciones?.length || 0} Eventos
                </span>
              </div>

              <div className="space-y-8 relative before:absolute before:inset-y-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                {cliente.interacciones?.length === 0 ? (
                  <div className="text-center py-10 opacity-30">
                    <MessageSquare className="h-10 w-10 mx-auto mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Sin actividad</p>
                  </div>
                ) : (
                  cliente.interacciones?.map((interaccion) => (
                    <div key={interaccion.id} className="relative pl-10 animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="absolute left-0 top-1.5 h-7 w-7 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center z-10">
                        {interaccion.tipoInteraccion === 'Llamada' ? <Phone className="h-3 w-3 text-blue-500" /> : 
                         interaccion.tipoInteraccion === 'WhatsApp' ? <MessageSquare className="h-3 w-3 text-emerald-500" /> : 
                         <Clock className="h-3 w-3 text-slate-400" />}
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">
                            {interaccion.tipoInteraccion}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 italic">
                            {formatDate(interaccion.fechaInteraccion)}
                          </span>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                          <p className="text-xs font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                            {interaccion.notas}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
