import { Mail, Phone, Clock, Pencil, ChevronDown, Check, ArrowUpRight, Share2, Lock, Bot } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { ETAPAS, ETAPAS_PROPIETARIO } from '../../constants/contactos';
import { CompartirContactoModal } from './CompartirContactoModal';
import ConfirmModal from '@/components/ConfirmModal';
import { useContactoBotToggle } from '../../hooks/useContactoBotToggle';
import { toast } from 'sonner';
import type { Contacto } from '../../types';

interface ContactoCardProps {
  contacto: Contacto;
  activeSegment: 'todos' | 'clientes' | 'propietarios';
  syncing: boolean;
  onNavigate: (id: string) => void;
  onEdit: (contacto: Contacto) => void;
  onStageChange: (id: string, etapa: string, tipo?: 'contacto' | 'propietario') => void;
}

export const ContactoCard = ({
  contacto,
  activeSegment,
  syncing,
  onNavigate,
  onEdit,
  onStageChange,
}: ContactoCardProps) => {
  const [openDropdown, setOpenDropdown] = useState<'cliente' | 'propietario' | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMultipolar = contacto.esContacto && contacto.esPropietario;
  const { isBotActivo, handleToggle, isLoading, showOverrideModal, confirmOverride, cancelOverride } = useContactoBotToggle(contacto);
  
  const getEtapaStyles = (etapa: string, isPropietario: boolean = false) => {
    const list = isPropietario ? ETAPAS_PROPIETARIO : ETAPAS;
    const found = list.find((e: { value: string }) => e.value === etapa);
    return found?.color || 'bg-gray-50 text-gray-600 border-gray-100';
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const handleStageUpdate = (etapa: string, tipo: 'contacto' | 'propietario') => {
    if (contacto.esCompartido) return;
    onStageChange(contacto.id, etapa, tipo);
    setOpenDropdown(null);
  };

  return (
    <div 
      className={`bg-white rounded-2xl border p-6 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden ${
        contacto.esCompartido ? 'border-slate-100 opacity-95' : 'border-slate-100 hover:border-blue-100'
      }`}
    >
      {syncing && <div className="absolute inset-0 bg-white/5 backdrop-blur-[0.5px] pointer-events-none" />}
      
      <div className="flex justify-between items-start mb-5">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-black text-lg shadow-lg transition-all ${
          contacto.esCompartido 
            ? 'bg-slate-100 text-slate-400 shadow-slate-200/10' 
            : 'bg-slate-900 text-white shadow-slate-900/10 group-hover:bg-blue-600 group-hover:shadow-blue-600/20'
        }`}>
          {contacto.nombre[0]}{contacto.apellido?.[0] || ''}
        </div>
        
        <div className="flex items-center gap-2">
          {contacto.esCompartido && (
            <div className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100 animate-pulse">
              Agente: {contacto.nombreAgenteDueno}
            </div>
          )}

          {activeSegment === 'todos' && isMultipolar && (
             <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border bg-slate-50 text-slate-500 border-slate-100`}>
                Multipolar
             </div>
          )}

          {!contacto.esCompartido && (
            <button 
              onClick={() => onNavigate(contacto.id)}
              className="h-10 w-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-600/20 transition-all cursor-pointer group/nav"
              title="Ver Detalles"
            >
              <ArrowUpRight className="h-5 w-5 transition-transform group-hover/nav:translate-x-0.5 group-hover/nav:-translate-y-0.5" />
            </button>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h3 className={`text-lg font-black transition-colors uppercase tracking-tight ${
          contacto.esCompartido ? 'text-slate-600' : 'text-slate-900 group-hover:text-blue-600'
        }`}>
          {[contacto.nombre, contacto.apellido].filter(Boolean).join(' ')}
        </h3>
        
        <div className="flex flex-col gap-2 mt-3">
          {/* Badge Dropdown Cliente */}
          {contacto.esContacto && !contacto.esCompartido && (
            <div className="relative" ref={openDropdown === 'cliente' ? dropdownRef : null}>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                  contacto.esCompartido 
                    ? 'bg-slate-50 text-slate-400 border-slate-100' 
                    : 'bg-blue-50 text-blue-600 border-blue-100/50'
                }`}>
                  Cliente
                </span>
                <button 
                  disabled={contacto.esCompartido}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (contacto.esCompartido) return;
                    setOpenDropdown(prev => prev === 'cliente' ? null : 'cliente');
                  }}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${
                    contacto.esCompartido 
                      ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed' 
                      : `cursor-pointer hover:shadow-sm active:scale-95 ${getEtapaStyles(contacto.etapaEmbudo, false)}`
                  }`}
                >
                  {contacto.etapaEmbudo}
                  {contacto.esCompartido ? <Lock className="h-2.5 w-2.5" /> : <ChevronDown className={`h-2.5 w-2.5 transition-transform ${openDropdown === 'cliente' ? 'rotate-180' : ''}`} />}
                </button>
              </div>

              {openDropdown === 'cliente' && !contacto.esCompartido && (
                <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[50] py-2 animate-in fade-in zoom-in duration-200 origin-top-left backdrop-blur-xl bg-white/95">
                  {ETAPAS.filter(e => e.value !== 'En Negociación' && e.value !== 'Cerrado' && e.value !== 'Cerrado Ganado' && e.value !== 'Cerrado Perdido').map((etapa) => (
                    <button
                      key={etapa.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStageUpdate(etapa.value, 'contacto');
                      }}
                      className={`cursor-pointer w-full px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide flex items-center justify-between transition-colors hover:bg-slate-50 ${
                        contacto.etapaEmbudo === etapa.value ? 'text-blue-600' : 'text-slate-600'
                      }`}
                    >
                      {etapa.label}
                      {contacto.etapaEmbudo === etapa.value && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Badge Dropdown Propietario */}
          {contacto.esPropietario && !contacto.esCompartido && (
            <div className="relative" ref={openDropdown === 'propietario' ? dropdownRef : null}>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                  contacto.esCompartido 
                    ? 'bg-slate-50 text-slate-400 border-slate-100' 
                    : 'bg-emerald-50 text-emerald-600 border-emerald-100/50'
                }`}>
                  Propietario
                </span>
                <button 
                  disabled={contacto.esCompartido}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (contacto.esCompartido) return;
                    setOpenDropdown(prev => prev === 'propietario' ? null : 'propietario');
                  }}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${
                    contacto.esCompartido 
                      ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed' 
                      : `cursor-pointer hover:shadow-sm active:scale-95 ${getEtapaStyles(contacto.estadoPropietario, true)}`
                  }`}
                >
                  {contacto.estadoPropietario}
                  {contacto.esCompartido ? <Lock className="h-2.5 w-2.5" /> : <ChevronDown className={`h-2.5 w-2.5 transition-transform ${openDropdown === 'propietario' ? 'rotate-180' : ''}`} />}
                </button>
              </div>

              {openDropdown === 'propietario' && !contacto.esCompartido && (
                <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[50] py-2 animate-in fade-in zoom-in duration-200 origin-top-left backdrop-blur-xl bg-white/95">
                  {ETAPAS_PROPIETARIO.map((etapa) => (
                    <button
                      key={etapa.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStageUpdate(etapa.value, 'propietario');
                      }}
                      className={`cursor-pointer w-full px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide flex items-center justify-between transition-colors hover:bg-slate-50 ${
                        contacto.estadoPropietario === etapa.value ? 'text-blue-600' : 'text-slate-600'
                      }`}
                    >
                      {etapa.label}
                      {contacto.estadoPropietario === etapa.value && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}


          {/* Badge Estado IA */}
          {!contacto.esCompartido && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border bg-purple-50 text-purple-600 border-purple-100/50">
                Estado IA
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                isBotActivo ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50'
                : contacto.estadoIA === 'Escalado' ? 'bg-amber-50 text-amber-600 border-amber-100/50'
                : contacto.estadoIA === 'LimiteAlcanzado' ? 'bg-purple-50 text-purple-600 border-purple-100/50'
                : 'bg-slate-50 text-slate-400 border-slate-100'
              }`}>
                {isBotActivo ? 'Operativo' : contacto.estadoIA === 'Escalado' ? 'Escalado a Humano' : contacto.estadoIA === 'LimiteAlcanzado' ? 'Límite de Tokens' : 'Desactivado'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 pt-5 border-t border-slate-50">
        {!contacto.esCompartido && contacto.email && (
          <div className="flex items-center gap-3 text-sm text-slate-500 font-medium group-hover:text-slate-900 transition-colors">
            <Mail className="h-4 w-4 text-slate-300 group-hover:text-blue-500" />
            <span className="truncate">{contacto.email}</span>
          </div>
        )}
        <div className="flex items-center gap-3 text-sm text-slate-500 font-medium group-hover:text-slate-900 transition-colors">
          <Phone className="h-4 w-4 text-slate-300 group-hover:text-blue-500" />
          <span>{contacto.esCompartido ? '••••••••' : contacto.telefono}</span>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between">
        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          Desde: {new Date(contacto.fechaCreacion!).toLocaleDateString()}
        </span>
        <div className="flex items-center gap-2">
          {!contacto.esCompartido && (
            <>
              <div className="opacity-0 group-hover:opacity-100 transition-all inline-block">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const isStageLocked = contacto.etapaEmbudo === 'En Negociación' || contacto.etapaEmbudo === 'Cerrado' || contacto.etapaEmbudo === 'Cerrado Ganado';
                    if (isStageLocked) {
                      toast.error("El cliente está en proceso de trámite, por cuestiones de seguridad debe pasar a otro estado para activar la IA.");
                      return;
                    }
                    if (isLoading) return;
                    handleToggle(!isBotActivo);
                  }}
                  className={`h-8 px-2 rounded-lg flex items-center gap-1.5 transition-all ${
                    (contacto.etapaEmbudo === 'En Negociación' || contacto.etapaEmbudo === 'Cerrado' || contacto.etapaEmbudo === 'Cerrado Ganado')
                      ? 'bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed'
                      : isBotActivo 
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 cursor-pointer' 
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100 cursor-pointer'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={isBotActivo ? 'Desactivar IA' : 'Activar IA'}
                >
                  <Bot className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-wider">{isBotActivo ? 'SI' : 'NO'}</span>
                </button>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsShareModalOpen(true);
                }}
                className="h-8 w-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center hover:bg-amber-50 hover:text-amber-600 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                title="Compartir Visibilidad"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(contacto);
                }}
                className="h-8 w-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                title="Editar Contacto"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </>
          )}

        </div>
      </div>

      {!contacto.esCompartido && (
        <>
          <CompartirContactoModal 
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            contacto={contacto}
          />
          <ConfirmModal
            isOpen={showOverrideModal}
            onClose={cancelOverride}
            onConfirm={confirmOverride}
            title="Reactivar IA (Límite Superado)"
            description="Este contacto ha alcanzado su límite de tokens diarios. ¿Deseas reiniciar su límite para permitir que la IA siga contestando? Podría incurrir en costos extras."
            confirmText="Sí, reactivar bot"
            type="info"
            icon={<Bot className="h-10 w-10 text-blue-500" />}
          />
        </>
      )}
    </div>
  );
};
