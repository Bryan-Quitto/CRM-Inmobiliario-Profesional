import { Mail, Phone, Clock, Pencil, ArrowUpRight, Share2, Bot } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CompartirContactoModal } from './CompartirContactoModal';
import ConfirmModal from '@/components/ConfirmModal';
import { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { useConfiguracionIA } from '../../../configuracion/hooks/useConfiguracionIA';
import { toggleContactArchive } from '../../api/toggleContactArchive';
import { useContactoBotToggle } from '../../hooks/useContactoBotToggle';
import type { Contacto } from '../../types';
import { ContactoStatusDropdown } from '../ContactoStatusDropdown';
import { ArchiveToggleButton } from '@/components/ui/ArchiveToggleButton';
import { Tooltip } from '@/components/ui/Tooltip';
import { MobileInfoPopover } from '@/components/ui/MobileInfoPopover';
import { TruncatedText } from '@/components/ui/TruncatedText';

interface ContactoCardProps {
  contacto: Contacto;
  activeSegment: 'todos' | 'clientes' | 'propietarios';
  syncing: boolean;
  onEdit: (contacto: Contacto) => void;
  onStageChange: (id: string, etapa: string, tipo?: 'contacto' | 'propietario') => void;
}

export const ContactoCard = ({
  contacto,
  activeSegment,
  syncing,
  onEdit,
  onStageChange,
}: ContactoCardProps) => {
  const [openDropdown, setOpenDropdown] = useState<'cliente' | 'propietario' | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMultipolar = contacto.esCliente && contacto.esPropietario;
  const waToggle = useContactoBotToggle(contacto, 'WhatsApp');
  const fbToggle = useContactoBotToggle(contacto, 'Facebook');
  const { settings } = useConfiguracionIA();
  const isWhatsAppAiEnabled = settings?.isWhatsAppAiEnabled ?? true;
  const isFacebookAiEnabled = settings?.isFacebookAiEnabled ?? true;
  
  const { mutate } = useSWRConfig();
  const [isTogglingArchive, setIsTogglingArchive] = useState(false);

  const handleToggleArchive = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsTogglingArchive(true);
    const newState = !contacto.isArchivedForCurrentUser;
    try {
      await toggleContactArchive(contacto.id);
      mutate(
        (key: unknown) => {
          const keyStr = Array.isArray(key) ? key[0] : key;
          return typeof keyStr === 'string' && keyStr.includes('contactos');
        },
        undefined,
        { revalidate: true }
      );
      toast.success(newState ? 'Contacto archivado' : 'Contacto desarchivado');
    } catch {
      toast.error('Error al cambiar estado de archivo');
    } finally {
      setIsTogglingArchive(false);
    }
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
      className={`bg-white rounded-2xl border p-3 md:p-6 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden ${
        contacto.esCompartido ? 'border-slate-100 opacity-95' : 'border-slate-100 hover:border-blue-100'
      }`}
    >
      {syncing && <div className="absolute inset-0 bg-white/5 backdrop-blur-[0.5px] pointer-events-none" />}
      
      <div className="flex justify-between items-start mb-5 gap-3 min-w-0">
        <div className={`h-12 w-12 shrink-0 rounded-xl flex items-center justify-center font-black text-lg shadow-lg transition-all ${
          contacto.esCompartido 
            ? 'bg-slate-100 text-slate-400 shadow-slate-200/10' 
            : 'bg-slate-900 text-white shadow-slate-900/10 group-hover:bg-blue-600 group-hover:shadow-blue-600/20'
        }`}>
          {contacto.nombre[0]}{contacto.apellido?.[0] || ''}
        </div>
        
        <div className="flex items-center gap-2 flex-wrap min-w-0 justify-end">
          {contacto.esCompartido && (
            <div className="shrink-0 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-100 animate-pulse">
              Agente: {contacto.nombreAgenteDueno}
            </div>
          )}

          {activeSegment === 'todos' && isMultipolar && (
             <div className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border bg-slate-50 text-slate-500 border-slate-100`}>
                Multipolar
             </div>
          )}

          {!contacto.esCompartido && (
            <>
              <ArchiveToggleButton
                isArchived={!!contacto.isArchivedForCurrentUser}
                isToggling={isTogglingArchive}
                onToggle={handleToggleArchive}
              />
              <Link 
                title="Ver Detalles"
                to={`/contactos/${contacto.id}`}
                className="shrink-0 h-10 w-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-600/20 transition-all cursor-pointer group/nav"
              >
                <ArrowUpRight className="h-5 w-5 transition-transform group-hover/nav:translate-x-0.5 group-hover/nav:-translate-y-0.5" />
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="mb-6 min-w-0">
        <TruncatedText as="h3" className={`text-lg font-black transition-colors uppercase tracking-tight truncate ${
          contacto.esCompartido ? 'text-slate-600' : 'text-slate-900 group-hover:text-blue-600'
        }`}>
          {[contacto.nombre, contacto.apellido].filter(Boolean).join(' ')}
        </TruncatedText>
        
        <div className="flex flex-col gap-2 mt-3">
          {/* Badge Dropdown Cliente */}
          {contacto.esCliente && !contacto.esCompartido && (
            <div className="relative min-w-0" ref={openDropdown === 'cliente' ? dropdownRef : null}>
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                  contacto.esCompartido 
                    ? 'bg-slate-50 text-slate-400 border-slate-100' 
                    : 'bg-blue-50 text-blue-600 border-blue-100/50'
                }`}>
                  Cliente
                </span>
                <ContactoStatusDropdown
                  contacto={contacto}
                  tipo="cliente"
                  isOpen={openDropdown === 'cliente'}
                  isUpdating={false}
                  onToggle={(tipo) => setOpenDropdown(tipo)}
                  onStatusChange={(_id, etapa, t) => handleStageUpdate(etapa, t)}
                  variant="card"
                />
              </div>
            </div>
          )}

          {/* Badge Dropdown Propietario */}
          {contacto.esPropietario && !contacto.esCompartido && (
            <div className="relative min-w-0" ref={openDropdown === 'propietario' ? dropdownRef : null}>
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                  contacto.esCompartido 
                    ? 'bg-slate-50 text-slate-400 border-slate-100' 
                    : 'bg-emerald-50 text-emerald-600 border-emerald-100/50'
                }`}>
                  Propietario
                </span>
                <ContactoStatusDropdown
                  contacto={contacto}
                  tipo="propietario"
                  isOpen={openDropdown === 'propietario'}
                  isUpdating={false}
                  onToggle={(tipo) => setOpenDropdown(tipo)}
                  onStatusChange={(_id, etapa, t) => handleStageUpdate(etapa, t)}
                  variant="card"
                />
              </div>
            </div>
          )}


          {/* Badges Estado IA WA & FB */}
          {!contacto.esCompartido && (
            <div className="flex flex-col gap-2 mt-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border bg-purple-50 text-purple-600 border-purple-100/50 min-w-[65px] justify-center">
                  IA WA
                </span>
                {!isWhatsAppAiEnabled ? (
                  <>
                    <div className="hidden lg:flex">
                      <Tooltip content="La IA de WhatsApp está desactivada en tu Configuración">
                        <span 
                          className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border bg-orange-50 text-orange-600 border-orange-100/50 cursor-help"
                        >
                          Inactivo (Global)
                        </span>
                      </Tooltip>
                    </div>
                    <div className="flex lg:hidden">
                      <MobileInfoPopover content="La IA de WhatsApp está desactivada en tu Configuración">
                        <span 
                          className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border bg-orange-50 text-orange-600 border-orange-100/50 cursor-help"
                        >
                          Inactivo (Global)
                        </span>
                      </MobileInfoPopover>
                    </div>
                  </>
                ) : (
                  <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                    waToggle.isBotActivo ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50'
                    : contacto.estadoIA_WA === 'Escalado' ? 'bg-amber-50 text-amber-600 border-amber-100/50'
                    : contacto.estadoIA_WA === 'LimiteAlcanzado' ? 'bg-purple-50 text-purple-600 border-purple-100/50'
                    : contacto.estadoIA_WA === 'Derivado a Captacion' ? 'bg-indigo-50 text-indigo-600 border-indigo-100/50'
                    : 'bg-slate-50 text-slate-400 border-slate-100'
                  }`}>
                    {waToggle.isBotActivo ? 'Operativo' : contacto.estadoIA_WA === 'Escalado' ? 'Escalado' : contacto.estadoIA_WA === 'LimiteAlcanzado' ? 'Límite de uso' : contacto.estadoIA_WA === 'Derivado a Captacion' ? 'Desactivado (Captación)' : 'Desactivado'}
                  </span>
                )}
                <div className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all inline-block ml-1">
                  <div className="hidden lg:block">
                    <Tooltip content={!isWhatsAppAiEnabled ? "Debes activar la IA de WhatsApp en Configuración para usar esta función" : (waToggle.isBotActivo ? 'Desactivar IA WA' : 'Activar IA WA')}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isWhatsAppAiEnabled) {
                            toast.warning("Debes activar la IA de WhatsApp en Configuración para usar esta función");
                            return;
                          }
                          const isStageLocked = contacto.estadoEmbudo === 'En Negociación' || contacto.estadoEmbudo === 'Cerrado' || contacto.estadoEmbudo === 'Cerrado Ganado';
                          if (isStageLocked) {
                            toast.warning("El cliente está en proceso de trámite, por cuestiones de seguridad debe pasar a otro estado para activar la IA.");
                            return;
                          }
                          if (contacto.isArchivedForCurrentUser) {
                            toast.warning("El contacto está archivado. Desarchívalo primero para poder activar la IA.");
                            return;
                          }
                          if (waToggle.isLoading) return;
                          waToggle.handleToggle(!waToggle.isBotActivo);
                        }}
                        className={`shrink-0 h-6 px-1.5 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                          !isWhatsAppAiEnabled || (contacto.estadoEmbudo === 'En Negociación' || contacto.estadoEmbudo === 'Cerrado' || contacto.estadoEmbudo === 'Cerrado Ganado') || contacto.isArchivedForCurrentUser
                            ? 'bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed'
                            : waToggle.isBotActivo 
                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 cursor-pointer' 
                              : 'bg-slate-50 text-slate-400 hover:bg-slate-100 cursor-pointer'
                        } ${waToggle.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Bot className="h-3 w-3" />
                        <span className="text-[9px] font-black uppercase tracking-wider">{waToggle.isBotActivo ? 'SI' : 'NO'}</span>
                      </button>
                    </Tooltip>
                  </div>
                  <div className="block lg:hidden">
                    {(!isWhatsAppAiEnabled) ? (
                      <MobileInfoPopover content="Debes activar la IA de WhatsApp en Configuración para usar esta función">
                        <button className="shrink-0 h-6 px-1.5 rounded-md flex items-center gap-1 transition-all bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed cursor-pointer">
                          <Bot className="h-3 w-3" />
                          <span className="text-[9px] font-black uppercase tracking-wider">{waToggle.isBotActivo ? 'SI' : 'NO'}</span>
                        </button>
                      </MobileInfoPopover>
                    ) : (
                      <MobileInfoPopover content={waToggle.isBotActivo ? 'Desactivar IA WA' : 'Activar IA WA'}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const isStageLocked = contacto.estadoEmbudo === 'En Negociación' || contacto.estadoEmbudo === 'Cerrado' || contacto.estadoEmbudo === 'Cerrado Ganado';
                            if (isStageLocked) {
                              toast.warning("El cliente está en proceso de trámite, por cuestiones de seguridad debe pasar a otro estado para activar la IA.");
                              return;
                            }
                            if (contacto.isArchivedForCurrentUser) {
                              toast.warning("El contacto está archivado. Desarchívalo primero para poder activar la IA.");
                              return;
                            }
                            if (waToggle.isLoading) return;
                            waToggle.handleToggle(!waToggle.isBotActivo);
                          }}
                          className={`shrink-0 h-6 px-1.5 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                            (contacto.estadoEmbudo === 'En Negociación' || contacto.estadoEmbudo === 'Cerrado' || contacto.estadoEmbudo === 'Cerrado Ganado') || contacto.isArchivedForCurrentUser
                              ? 'bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed'
                              : waToggle.isBotActivo 
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 cursor-pointer' 
                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100 cursor-pointer'
                          } ${waToggle.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Bot className="h-3 w-3" />
                          <span className="text-[9px] font-black uppercase tracking-wider">{waToggle.isBotActivo ? 'SI' : 'NO'}</span>
                        </button>
                      </MobileInfoPopover>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border bg-purple-50 text-purple-600 border-purple-100/50 min-w-[65px] justify-center">
                  IA FB
                </span>
                {!isFacebookAiEnabled ? (
                  <>
                    <div className="hidden lg:flex">
                      <Tooltip content="La IA de Facebook está desactivada en tu Configuración">
                        <span 
                          className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border bg-orange-50 text-orange-600 border-orange-100/50 cursor-help"
                        >
                          Inactivo (Global)
                        </span>
                      </Tooltip>
                    </div>
                    <div className="flex lg:hidden">
                      <MobileInfoPopover content="La IA de Facebook está desactivada en tu Configuración">
                        <span 
                          className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border bg-orange-50 text-orange-600 border-orange-100/50 cursor-help"
                        >
                          Inactivo (Global)
                        </span>
                      </MobileInfoPopover>
                    </div>
                  </>
                ) : (
                  <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                    fbToggle.isBotActivo ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50'
                    : contacto.estadoIA_FB === 'Escalado' ? 'bg-amber-50 text-amber-600 border-amber-100/50'
                    : contacto.estadoIA_FB === 'LimiteAlcanzado' ? 'bg-purple-50 text-purple-600 border-purple-100/50'
                    : contacto.estadoIA_FB === 'Derivado a Captacion' ? 'bg-indigo-50 text-indigo-600 border-indigo-100/50'
                    : 'bg-slate-50 text-slate-400 border-slate-100'
                  }`}>
                    {fbToggle.isBotActivo ? 'Operativo' : contacto.estadoIA_FB === 'Escalado' ? 'Escalado' : contacto.estadoIA_FB === 'LimiteAlcanzado' ? 'Límite de uso' : contacto.estadoIA_FB === 'Derivado a Captacion' ? 'Desactivado (Captación)' : 'Desactivado'}
                  </span>
                )}
                <div className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all inline-block ml-1">
                  <div className="hidden lg:block">
                    <Tooltip content={!isFacebookAiEnabled ? "Debes activar la IA de Facebook en Configuración para usar esta función" : (fbToggle.isBotActivo ? 'Desactivar IA FB' : 'Activar IA FB')}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isFacebookAiEnabled) {
                            toast.warning("Debes activar la IA de Facebook en Configuración para usar esta función");
                            return;
                          }
                          const isStageLocked = contacto.estadoEmbudo === 'En Negociación' || contacto.estadoEmbudo === 'Cerrado' || contacto.estadoEmbudo === 'Cerrado Ganado';
                          if (isStageLocked) {
                            toast.warning("El cliente está en proceso de trámite, por cuestiones de seguridad debe pasar a otro estado para activar la IA.");
                            return;
                          }
                          if (contacto.isArchivedForCurrentUser) {
                            toast.warning("El contacto está archivado. Desarchívalo primero para poder activar la IA.");
                            return;
                          }
                          if (fbToggle.isLoading) return;
                          fbToggle.handleToggle(!fbToggle.isBotActivo);
                        }}
                        className={`shrink-0 h-6 px-1.5 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                          !isFacebookAiEnabled || (contacto.estadoEmbudo === 'En Negociación' || contacto.estadoEmbudo === 'Cerrado' || contacto.estadoEmbudo === 'Cerrado Ganado') || contacto.isArchivedForCurrentUser
                            ? 'bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed'
                            : fbToggle.isBotActivo 
                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 cursor-pointer' 
                              : 'bg-slate-50 text-slate-400 hover:bg-slate-100 cursor-pointer'
                        } ${fbToggle.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Bot className="h-3 w-3" />
                        <span className="text-[9px] font-black uppercase tracking-wider">{fbToggle.isBotActivo ? 'SI' : 'NO'}</span>
                      </button>
                    </Tooltip>
                  </div>
                  <div className="block lg:hidden">
                    {(!isFacebookAiEnabled) ? (
                      <MobileInfoPopover content="Debes activar la IA de Facebook en Configuración para usar esta función">
                        <button className="shrink-0 h-6 px-1.5 rounded-md flex items-center gap-1 transition-all bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed cursor-pointer">
                          <Bot className="h-3 w-3" />
                          <span className="text-[9px] font-black uppercase tracking-wider">{fbToggle.isBotActivo ? 'SI' : 'NO'}</span>
                        </button>
                      </MobileInfoPopover>
                    ) : (
                      <MobileInfoPopover content={fbToggle.isBotActivo ? 'Desactivar IA FB' : 'Activar IA FB'}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const isStageLocked = contacto.estadoEmbudo === 'En Negociación' || contacto.estadoEmbudo === 'Cerrado' || contacto.estadoEmbudo === 'Cerrado Ganado';
                            if (isStageLocked) {
                              toast.warning("El cliente está en proceso de trámite, por cuestiones de seguridad debe pasar a otro estado para activar la IA.");
                              return;
                            }
                            if (contacto.isArchivedForCurrentUser) {
                              toast.warning("El contacto está archivado. Desarchívalo primero para poder activar la IA.");
                              return;
                            }
                            if (fbToggle.isLoading) return;
                            fbToggle.handleToggle(!fbToggle.isBotActivo);
                          }}
                          className={`shrink-0 h-6 px-1.5 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                            (contacto.estadoEmbudo === 'En Negociación' || contacto.estadoEmbudo === 'Cerrado' || contacto.estadoEmbudo === 'Cerrado Ganado') || contacto.isArchivedForCurrentUser
                              ? 'bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed'
                              : fbToggle.isBotActivo 
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 cursor-pointer' 
                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100 cursor-pointer'
                          } ${fbToggle.isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <Bot className="h-3 w-3" />
                          <span className="text-[9px] font-black uppercase tracking-wider">{fbToggle.isBotActivo ? 'SI' : 'NO'}</span>
                        </button>
                      </MobileInfoPopover>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3 pt-5 border-t border-slate-50 min-w-0">
        {!contacto.esCompartido && contacto.email && (
          <div className="flex items-center gap-3 text-sm text-slate-500 font-medium group-hover:text-slate-900 transition-colors min-w-0 w-full">
            <Mail className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-blue-500" />
            <TruncatedText as="span" className="truncate min-w-0 flex-1">{contacto.email}</TruncatedText>
          </div>
        )}
        <div className="flex items-center gap-3 text-sm text-slate-500 font-medium group-hover:text-slate-900 transition-colors min-w-0 w-full">
          <Phone className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-blue-500" />
          <TruncatedText as="span" className="truncate min-w-0 flex-1">{contacto.esCompartido ? '••••••••' : contacto.telefono}</TruncatedText>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between flex-wrap gap-4 min-w-0 w-full">
        <span className="shrink-0 text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
          <Clock className="h-3 w-3 shrink-0" />
          Desde: {new Date(contacto.fechaCreacion!).toLocaleDateString()}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {!contacto.esCompartido && (
            <>
              {!contacto.isArchivedForCurrentUser && (
                  <button 
                    title="Compartir Visibilidad"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsShareModalOpen(true);
                    }}
                    className="shrink-0 h-8 w-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center hover:bg-amber-50 hover:text-amber-600 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100 cursor-pointer"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
              )}
              {!contacto.isArchivedForCurrentUser && (
                  <button 
                    title="Editar Contacto"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(contacto);
                    }}
                    className="shrink-0 h-8 w-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100 cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
              )}
            </>
          )}

        </div>
      </div>

      {!contacto.esCompartido && (
        <>
          {isShareModalOpen && (
            <CompartirContactoModal 
              isOpen={isShareModalOpen}
              onClose={() => setIsShareModalOpen(false)}
              contacto={contacto}
            />
          )}
          <ConfirmModal
            isOpen={waToggle.showOverrideModal}
            onClose={waToggle.cancelOverride}
            onConfirm={waToggle.confirmOverride}
            title="Reactivar IA (Límite Superado) - WhatsApp"
            description="Este contacto ha alcanzado su límite de tokens diarios en WhatsApp. ¿Deseas reiniciar su límite para permitir que la IA siga contestando? Podría incurrir en costos extras."
            confirmText="Sí, reactivar bot"
            type="info"
            icon={<Bot className="h-10 w-10 text-emerald-500" />}
          />
          <ConfirmModal
            isOpen={fbToggle.showOverrideModal}
            onClose={fbToggle.cancelOverride}
            onConfirm={fbToggle.confirmOverride}
            title="Reactivar IA (Límite Superado) - Facebook"
            description="Este contacto ha alcanzado su límite de tokens diarios en Facebook. ¿Deseas reiniciar su límite para permitir que la IA siga contestando? Podría incurrir en costos extras."
            confirmText="Sí, reactivar bot"
            type="info"
            icon={<Bot className="h-10 w-10 text-blue-500" />}
          />
        </>
      )}
    </div>
  );
};
