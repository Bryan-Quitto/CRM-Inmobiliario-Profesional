import { useState, useMemo, useEffect } from 'react';
import { X, Search, Users, Home, UserPlus, UserMinus, AlertCircle, Loader2, Check } from 'lucide-react';
import Fuse from 'fuse.js';
import { useAgentes } from '@/features/configuracion/hooks/useAgentes';
import type { AgenteResponse } from '@/features/configuracion/api/getAgentes';
import { usePropiedadesData } from '@/features/propiedades/hooks/usePropiedadesList/usePropiedadesData';
import type { Propiedad } from '@/features/propiedades/types';
import { useCompartirContacto } from '../../hooks/useCompartirContacto';
import { usePerfil } from '@/features/auth/api/perfil';
import type { Contacto, AgenteCompartido } from '../../types';

interface CompartirContactoModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacto: Contacto;
}

export const CompartirContactoModal = ({ isOpen, onClose, contacto }: CompartirContactoModalProps) => {
  const { perfil } = usePerfil();
  const { agentes } = useAgentes();
  const { propiedades } = usePropiedadesData();
  const { agentesCompartidos, compartir, revocar } = useCompartirContacto(contacto.id);

  const [activeTab, setActiveTab] = useState<'compartir' | 'gestion'>('compartir');
  const [searchMode, setSearchMode] = useState<'agente' | 'propiedad'>('agente');
  const [query, setQuery] = useState('');
  const [selectedAgenteId, setSelectedAgenteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fuse.js para Agentes
  const fuseAgentes = useMemo(() => {
    if (!agentes) return null;
    return new Fuse<AgenteResponse>(agentes.filter(a => a.id !== perfil?.id), {
      keys: ['nombre', 'apellido', 'email'],
      threshold: 0.3
    });
  }, [agentes, perfil]);

  // Fuse.js para Propiedades
  const fusePropiedades = useMemo(() => {
    if (!propiedades) return null;
    return new Fuse<Propiedad>(propiedades, {
      keys: ['titulo', 'sector', 'ciudad'],
      threshold: 0.3
    });
  }, [propiedades]);

  const searchResults = useMemo(() => {
    if (!query) return [];
    if (searchMode === 'agente') {
      return fuseAgentes?.search(query).map(r => r.item) || [];
    } else {
      return fusePropiedades?.search(query).map(r => r.item) || [];
    }
  }, [query, searchMode, fuseAgentes, fusePropiedades]);

  const targetAgente = useMemo(() => {
    if (!selectedAgenteId || !agentes) return null;
    return agentes.find(a => a.id === selectedAgenteId);
  }, [selectedAgenteId, agentes]);

  // Reset al cambiar de pestaña
  useEffect(() => {
    setQuery('');
    setSelectedAgenteId(null);
  }, [activeTab, searchMode]);

  const handleSelectAgente = (agenteId: string) => {
    // Verificar si ya tiene acceso
    const yaTieneAcceso = agentesCompartidos.some(a => a.id === agenteId);
    if (yaTieneAcceso) {
      import('sonner').then(({ toast }) => toast.warning('Este agente ya tiene acceso a la visibilidad de este contacto.'));
      return;
    }
    setSelectedAgenteId(agenteId);
  };

  const handleSelectPropiedad = (propiedad: Propiedad) => {
    if (propiedad.gestorId) {
      // Verificar si ya tiene acceso
      const yaTieneAcceso = agentesCompartidos.some(a => a.id === propiedad.gestorId);
      if (yaTieneAcceso) {
        import('sonner').then(({ toast }) => toast.warning(`El gestor (${propiedad.gestorNombre}) ya tiene acceso a este contacto.`));
        return;
      }
      setSelectedAgenteId(propiedad.gestorId);
    }
  };

  const onCompartir = async () => {
    if (!selectedAgenteId) return;
    setIsSubmitting(true);
    try {
      await compartir([selectedAgenteId]);
      setSelectedAgenteId(null);
      setQuery('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRevocar = async (agenteId: string) => {
    setIsSubmitting(true);
    try {
      await revocar([agenteId]);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[600] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Gestionar Visibilidad</h2>
            <p className="text-xs text-slate-500 font-bold mt-1">Contacto: {contacto.nombre} {contacto.apellido}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button 
            onClick={() => setActiveTab('compartir')}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'compartir' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <UserPlus className="h-4 w-4" />
            Compartir
          </button>
          <button 
            onClick={() => setActiveTab('gestion')}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'gestion' ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users className="h-4 w-4" />
            Accesos ({agentesCompartidos.length})
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {activeTab === 'compartir' ? (
            <div className="space-y-6">
              {/* Search Toggle */}
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button 
                  onClick={() => setSearchMode('agente')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    searchMode === 'agente' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  Por Agente
                </button>
                <button 
                  onClick={() => setSearchMode('propiedad')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    searchMode === 'propiedad' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  <Home className="h-3.5 w-3.5" />
                  Por Propiedad
                </button>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                <input 
                  type="text"
                  placeholder={searchMode === 'agente' ? "Buscar agente por nombre..." : "Buscar propiedad por título o sector..."}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              {/* Search Results */}
              {query && searchResults.length > 0 && (
                <div className="space-y-2 mt-4">
                  {searchResults.slice(0, 5).map((item: AgenteResponse | Propiedad) => {
                    const agenteId = searchMode === 'agente' ? item.id : (item as Propiedad).gestorId;
                    const yaTieneAcceso = agentesCompartidos.some(a => a.id === agenteId);

                    return (
                      <button
                        key={item.id}
                        onClick={() => searchMode === 'agente' ? handleSelectAgente(item.id) : handleSelectPropiedad(item as Propiedad)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group cursor-pointer ${
                          yaTieneAcceso 
                            ? 'bg-slate-50/50 border-slate-100 opacity-60' 
                            : 'border-slate-100 hover:border-blue-200 hover:bg-blue-50/30'
                        }`}
                      >
                        {searchMode === 'agente' ? (
                          <>
                            <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black uppercase">
                              {(item as AgenteResponse).fotoUrl ? <img src={(item as AgenteResponse).fotoUrl} className="h-full w-full object-cover rounded-xl" alt="" /> : (item as AgenteResponse).nombre[0]}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{(item as AgenteResponse).nombre} {(item as AgenteResponse).apellido}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">{(item as AgenteResponse).email}</p>
                            </div>
                            {yaTieneAcceso && (
                              <span className="px-2 py-1 bg-slate-200 text-slate-600 text-[8px] font-black uppercase rounded-lg">
                                Con Acceso
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                              <Home className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">{(item as Propiedad).titulo}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">{(item as Propiedad).sector}, {(item as Propiedad).ciudad}</p>
                              {(item as Propiedad).estadoComercial !== 'Disponible' && (
                                <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-black text-amber-600 uppercase">
                                  <AlertCircle className="h-2.5 w-2.5" />
                                  {(item as Propiedad).estadoComercial}
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                               <p className="text-[9px] text-slate-300 font-black uppercase mb-1">Responsable</p>
                               <p className="text-[10px] font-black text-slate-600 uppercase">{(item as Propiedad).gestorNombre}</p>
                               {yaTieneAcceso && (
                                  <span className="inline-block mt-1 px-2 py-0.5 bg-slate-200 text-slate-600 text-[8px] font-black uppercase rounded-md">
                                    Con Acceso
                                  </span>
                               )}
                            </div>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Selection Feedback */}
              {targetAgente && (
                <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl animate-in slide-in-from-bottom-2 duration-300">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Agente Seleccionado</p>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-600/20">
                      {targetAgente.fotoUrl ? <img src={targetAgente.fotoUrl} className="h-full w-full object-cover rounded-2xl" alt="" /> : targetAgente.nombre[0]}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                        {targetAgente.nombre} {targetAgente.apellido}
                      </h4>
                      <p className="text-xs text-blue-600 font-black uppercase tracking-wider">{targetAgente.email}</p>
                    </div>
                    <button 
                      disabled={isSubmitting}
                      onClick={onCompartir}
                      className="h-12 w-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Check className="h-6 w-6" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Tab Gestión / Revocación */
            <div className="space-y-4">
              {agentesCompartidos.length === 0 ? (
                <div className="py-12 text-center">
                  <Users className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">No hay agentes con acceso</p>
                </div>
              ) : (
                agentesCompartidos.map((agente: AgenteCompartido) => (
                  <div 
                    key={agente.id}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/30 group"
                  >
                    <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black uppercase">
                      {agente.fotoUrl ? <img src={agente.fotoUrl} className="h-full w-full object-cover rounded-xl" alt="" /> : agente.nombreCompleto[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{agente.nombreCompleto}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Tiene acceso de lectura</p>
                    </div>
                    <button 
                      disabled={isSubmitting}
                      onClick={() => onRevocar(agente.id)}
                      className="h-10 w-10 bg-red-50 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all cursor-pointer group/del"
                      title="Revocar Acceso"
                    >
                      {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserMinus className="h-5 w-5" />}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
