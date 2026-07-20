import { Phone, Mail, Tag, Bot, ChevronDown, Check } from 'lucide-react';
import { useContactoBotToggle } from '../../hooks/useContactoBotToggle';
import ConfirmModal from '@/components/ConfirmModal';
import { toast } from 'sonner';
import { useState, useRef, useEffect } from 'react';
import type { Contacto } from '../../types';
import { useContactoTokenUsage } from '../../hooks/useContactoTokenUsage';
import { useConfiguracionIA } from '../../../configuracion/hooks/useConfiguracionIA';
import { Tooltip } from '@/components/ui/Tooltip';
import { MobileInfoPopover } from '@/components/ui/MobileInfoPopover';
import { TruncatedText } from '@/components/ui/TruncatedText';
import { useContactoConsent } from '../../hooks/useContactoConsent';

interface ContactoProfileCardProps {
  contacto: Contacto;
}

export const ContactoProfileCard = ({ contacto }: ContactoProfileCardProps) => {
  const waToggle = useContactoBotToggle(contacto, 'WhatsApp');
  const fbToggle = useContactoBotToggle(contacto, 'Facebook');
  const [rango, setRango] = useState<'hoy' | 'semana' | 'mes' | 'siempre'>('hoy');
  const [channelFilter, setChannelFilter] = useState<'todas' | 'WhatsApp' | 'Facebook'>('todas');
  const { usage, isLoading: isLoadingUsage } = useContactoTokenUsage(contacto.id, rango, channelFilter);
  const { settings } = useConfiguracionIA();
  const isWhatsAppAiEnabled = settings?.isWhatsAppAiEnabled ?? true;
  const isFacebookAiEnabled = settings?.isFacebookAiEnabled ?? true;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isChannelDropdownOpen, setIsChannelDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const channelDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (channelDropdownRef.current && !channelDropdownRef.current.contains(event.target as Node)) {
        setIsChannelDropdownOpen(false);
      }
    };
    if (isDropdownOpen || isChannelDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen, isChannelDropdownOpen]);

  const RANGOS = [
    { value: 'hoy', label: 'Hoy' },
    { value: 'semana', label: 'Semana' },
    { value: 'mes', label: 'Mes' },
    { value: 'siempre', label: 'Siempre' }
  ];

  const CHANNELS = [
    { value: 'todas', label: 'Todas' },
    { value: 'WhatsApp', label: 'WhatsApp' },
    { value: 'Facebook', label: 'Facebook' }
  ];

  return (
    <div className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-8 border border-slate-100 shadow-sm">
      <div className="flex flex-col items-center text-center mb-6 md:mb-8">
        <div className="h-16 w-16 md:h-24 md:w-24 bg-slate-900 text-white rounded-[20px] md:rounded-[32px] flex items-center justify-center text-xl md:text-3xl font-black shadow-2xl mb-3 md:mb-4 rotate-3">
          {contacto.nombre[0]}{contacto.apellido?.[0] || ''}
        </div>
        <TruncatedText as="h2" className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight truncate">{[contacto.nombre, contacto.apellido].filter(Boolean).join(' ')}</TruncatedText>
        <p className="text-sm font-bold text-slate-400 mt-1 italic">Contacto desde {new Date(contacto.fechaCreacion!).toLocaleDateString()}</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm transition-colors">
            <Phone className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono</p>
            <TruncatedText as="p" className="text-sm font-bold text-slate-900 truncate">{contacto.telefono}</TruncatedText>
          </div>
        </div>

        {!contacto.esCompartido && (
          <div className="flex flex-col gap-3">
            <BotToggleRow 
              channel="WhatsApp" 
              isGlobalEnabled={isWhatsAppAiEnabled} 
              toggleState={waToggle} 
              contacto={contacto} 
            />
            <BotToggleRow 
              channel="Facebook" 
              isGlobalEnabled={isFacebookAiEnabled} 
              toggleState={fbToggle} 
              contacto={contacto} 
            />
          </div>
        )}

        {contacto.email && (
          <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm transition-colors">
              <Mail className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
              <TruncatedText as="p" className="text-sm font-bold text-slate-900 truncate">{contacto.email}</TruncatedText>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm transition-colors">
            <Tag className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Origen</p>
            <TruncatedText as="p" className="text-sm font-bold text-slate-900 truncate">{contacto.origen}</TruncatedText>
          </div>
        </div>

        {/* Token Usage Section */}
        {!contacto.esCompartido && (
          <div className="p-3 md:p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0 mb-3">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-purple-500" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consumo Tokens</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative" ref={channelDropdownRef}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsChannelDropdownOpen(!isChannelDropdownOpen);
                      setIsDropdownOpen(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:border-purple-300 transition-colors focus:outline-none cursor-pointer"
                  >
                    {CHANNELS.find(c => c.value === channelFilter)?.label}
                    <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isChannelDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isChannelDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-32 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[50] py-2 animate-in fade-in zoom-in duration-200 origin-top-right backdrop-blur-xl bg-white/95">
                      {CHANNELS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={(e) => {
                            e.stopPropagation();
                            setChannelFilter(opt.value as 'todas' | 'WhatsApp' | 'Facebook');
                            setIsChannelDropdownOpen(false);
                          }}
                          className={`cursor-pointer w-full px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide flex items-center justify-between transition-colors hover:bg-slate-50 ${
                            channelFilter === opt.value ? 'text-purple-600' : 'text-slate-600'
                          }`}
                        >
                          {opt.label}
                          {channelFilter === opt.value && <Check className="h-3.5 w-3.5" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDropdownOpen(!isDropdownOpen);
                      setIsChannelDropdownOpen(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:border-purple-300 transition-colors focus:outline-none cursor-pointer"
                  >
                    {RANGOS.find(r => r.value === rango)?.label}
                    <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-32 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[50] py-2 animate-in fade-in zoom-in duration-200 origin-top-right backdrop-blur-xl bg-white/95">
                      {RANGOS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={(e) => {
                            e.stopPropagation();
                            setRango(opt.value as 'hoy' | 'semana' | 'mes' | 'siempre');
                            setIsDropdownOpen(false);
                          }}
                          className={`cursor-pointer w-full px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide flex items-center justify-between transition-colors hover:bg-slate-50 ${
                            rango === opt.value ? 'text-purple-600' : 'text-slate-600'
                          }`}
                        >
                          {opt.label}
                          {rango === opt.value && <Check className="h-3.5 w-3.5" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-3 border border-slate-100 flex flex-col gap-2">
              {isLoadingUsage ? (
                <span className="text-xs text-slate-400 animate-pulse text-center py-4">Cargando métricas...</span>
              ) : (
                <>
                  {/* Tokens Totales */}
                  <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Tokens Totales</span>
                      <span className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">Entrada + Salida</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-black text-slate-800">
                        {usage?.totalTokens?.toLocaleString() || 0} <span className="text-[10px] font-bold text-slate-400 uppercase">tkns</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        ≈ ${(usage?.costoUSD || 0).toFixed(4)} USD <span className="text-[8px] uppercase">(Valor)</span>
                      </span>
                    </div>
                  </div>


                </>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={waToggle.showOverrideModal}
        onClose={waToggle.cancelOverride}
        onConfirm={waToggle.confirmOverride}
        title="Reactivar IA (Límite Superado) - WhatsApp"
        description="Este contacto ha alcanzado su límite de tokens diarios en WhatsApp. ¿Deseas reiniciar su límite para permitir que la IA siga contestando? Podría incurrir en costos extras."
        confirmText="Sí, reactivar bot"
        type="info"
        icon={<Bot className="h-10 w-10 text-blue-500" />}
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
    </div>
  );
};

interface BotToggleRowProps {
  channel: 'WhatsApp' | 'Facebook';
  isGlobalEnabled: boolean;
  toggleState: ReturnType<typeof useContactoBotToggle>;
  contacto: Contacto;
}

const BotToggleRow = ({ channel, isGlobalEnabled, toggleState, contacto }: BotToggleRowProps) => {
  const { isBotActivo, handleToggle, isLoading } = toggleState;
  const estadoIA = channel === 'Facebook' ? contacto.estadoIA_FB : contacto.estadoIA_WA;
  const estadoConsentimiento = channel === 'Facebook' ? contacto.consentimientoIA_FB : contacto.consentimientoIA_WA;
  const consent = useContactoConsent(contacto, channel);

  const toggleBtnContent = (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (!isGlobalEnabled) {
          toast.warning(`Debes activar la IA de ${channel} en Configuración para usar esta función`);
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
        if (isLoading || contacto.esCompartido) return;
        handleToggle(!isBotActivo);
      }}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
        !isGlobalEnabled
          ? 'bg-slate-300 opacity-50 cursor-not-allowed'
          : (contacto.estadoEmbudo === 'En Negociación' || contacto.estadoEmbudo === 'Cerrado' || contacto.estadoEmbudo === 'Cerrado Ganado')
            ? 'bg-slate-300 opacity-50 cursor-not-allowed'
            : contacto.isArchivedForCurrentUser
              ? 'bg-slate-300 opacity-50 cursor-not-allowed'
              : isBotActivo ? 'bg-emerald-500 cursor-pointer' : 'bg-slate-300 cursor-pointer'
      } ${isLoading || contacto.esCompartido ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        isBotActivo ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  );

  return (
    <div className="flex items-start justify-between p-3 md:p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all gap-3">
      <div className="flex items-start gap-3 md:gap-4 flex-1 min-w-0">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-sm transition-colors shrink-0 ${isBotActivo ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-400'}`}>
          <Bot className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1 items-start">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-0.5">IA {channel}</p>
          {!isGlobalEnabled ? (
            <>
              <div className="hidden lg:flex">
                <Tooltip content={`La IA de ${channel} está desactivada en tu Configuración`}>
                  <span 
                    className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider cursor-help"
                  >
                    Inactivo (Global)
                  </span>
                </Tooltip>
              </div>
              <div className="flex lg:hidden">
                <MobileInfoPopover content={`La IA de ${channel} está desactivada en tu Configuración`}>
                  <span 
                    className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider cursor-help"
                  >
                    Inactivo (Global)
                  </span>
                </MobileInfoPopover>
              </div>
            </>
          ) : isBotActivo ? (
            <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">Operativo</span>
          ) : estadoIA === 'Escalado' ? (
            <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">Escalado</span>
          ) : estadoIA === 'LimiteAlcanzado' ? (
            <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">Límite de uso</span>
          ) : estadoIA === 'Derivado a Captacion' ? (
            <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">Desactivado (Captación)</span>
          ) : (
            <span className="bg-slate-50 text-slate-400 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">Desactivado</span>
          )}
          
          <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-2 w-full">
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shrink-0 ${
              (estadoConsentimiento === 'PendingConsent' || estadoConsentimiento === null) ? 'bg-amber-50 text-amber-600' 
              : (estadoConsentimiento === 'Denied' || estadoConsentimiento === 'DeniedResponse') ? 'bg-red-50 text-red-600'
              : 'bg-emerald-50 text-emerald-600'
            }`}>
              {(estadoConsentimiento === 'PendingConsent' || estadoConsentimiento === null) ? 'Consent. Pendiente' 
               : (estadoConsentimiento === 'Denied' || estadoConsentimiento === 'DeniedResponse') ? 'Consent. Rechazado'
               : 'Consent. Otorgado'}
            </span>
            {estadoConsentimiento !== 'Granted' ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  consent.handleUpdateConsent('Granted');
                }}
                disabled={consent.isLoading}
                className="cursor-pointer px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200/60 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors disabled:opacity-50 shrink-0"
              >
                Autorizar
              </button>
            ) : (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  consent.handleUpdateConsent('Denied');
                }}
                disabled={consent.isLoading}
                className="cursor-pointer px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200/60 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 shrink-0"
              >
                Revocar
              </button>
            )}
            {(estadoConsentimiento === 'PendingConsent' || estadoConsentimiento === null) && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  consent.handleUpdateConsent('Denied');
                }}
                disabled={consent.isLoading}
                className="cursor-pointer px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200/60 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 shrink-0"
              >
                Rechazar
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="inline-block shrink-0 mt-2">
        <div className="hidden lg:inline-block">
          {!isGlobalEnabled ? (
            <Tooltip content={`Debes activar la IA de ${channel} en Configuración para usar esta función`}>
              {toggleBtnContent}
            </Tooltip>
          ) : (
            toggleBtnContent
          )}
        </div>
        <div className="inline-block lg:hidden">
          {(!isGlobalEnabled) ? (
            <MobileInfoPopover content={`Debes activar la IA de ${channel} en Configuración para usar esta función`}>
              <button
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-slate-300 opacity-50 cursor-not-allowed cursor-pointer"
              >
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
              </button>
            </MobileInfoPopover>
          ) : (
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
                if (isLoading || contacto.esCompartido) return;
                handleToggle(!isBotActivo);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                (contacto.estadoEmbudo === 'En Negociación' || contacto.estadoEmbudo === 'Cerrado' || contacto.estadoEmbudo === 'Cerrado Ganado')
                  ? 'bg-slate-300 opacity-50 cursor-not-allowed'
                  : contacto.isArchivedForCurrentUser
                    ? 'bg-slate-300 opacity-50 cursor-not-allowed'
                    : isBotActivo ? 'bg-emerald-500 cursor-pointer' : 'bg-slate-300 cursor-pointer'
              } ${isLoading || contacto.esCompartido ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isBotActivo ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
