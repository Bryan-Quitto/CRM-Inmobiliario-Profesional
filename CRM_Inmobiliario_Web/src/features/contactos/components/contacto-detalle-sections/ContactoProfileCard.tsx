import { Phone, Mail, Tag, Bot, ChevronDown, Check } from 'lucide-react';
import { useContactoBotToggle } from '../../hooks/useContactoBotToggle';
import ConfirmModal from '@/components/ConfirmModal';
import { toast } from 'sonner';
import { useState, useRef, useEffect } from 'react';
import type { Contacto } from '../../types';
import { useContactoTokenUsage } from '../../hooks/useContactoTokenUsage';

interface ContactoProfileCardProps {
  contacto: Contacto;
}

export const ContactoProfileCard = ({ contacto }: ContactoProfileCardProps) => {
  const { isBotActivo, handleToggle, isLoading, showOverrideModal, confirmOverride, cancelOverride } = useContactoBotToggle(contacto);
  const [rango, setRango] = useState<'hoy' | 'semana' | 'mes' | 'siempre'>('hoy');
  const { usage, isLoading: isLoadingUsage } = useContactoTokenUsage(contacto.id, rango);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  const RANGOS = [
    { value: 'hoy', label: 'Hoy' },
    { value: 'semana', label: 'Semana' },
    { value: 'mes', label: 'Mes' },
    { value: 'siempre', label: 'Siempre' }
  ];

  return (
    <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="h-24 w-24 bg-slate-900 text-white rounded-[32px] flex items-center justify-center text-3xl font-black shadow-2xl mb-4 rotate-3">
          {contacto.nombre[0]}{contacto.apellido?.[0] || ''}
        </div>
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{[contacto.nombre, contacto.apellido].filter(Boolean).join(' ')}</h2>
        <p className="text-sm font-bold text-slate-400 mt-1 italic">Contacto desde {new Date(contacto.fechaCreacion!).toLocaleDateString()}</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm transition-colors">
            <Phone className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teléfono</p>
            <p className="text-sm font-bold text-slate-900 truncate">{contacto.telefono}</p>
          </div>
        </div>

        {!contacto.esCompartido && (
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all">
            <div className="flex items-center gap-4">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-sm transition-colors ${isBotActivo ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-400'}`}>
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-1 items-start">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado IA</p>
                {isBotActivo ? (
                  <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">Operativo</span>
                ) : contacto.estadoIA === 'Escalado' ? (
                  <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">Escalado a Humano</span>
                ) : contacto.estadoIA === 'LimiteAlcanzado' ? (
                  <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">Límite de Tokens</span>
                ) : (
                  <span className="bg-slate-50 text-slate-400 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">Desactivado</span>
                )}
              </div>
            </div>
            <div className="inline-block">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const isStageLocked = contacto.etapaEmbudo === 'En Negociación' || contacto.etapaEmbudo === 'Cerrado' || contacto.etapaEmbudo === 'Cerrado Ganado';
                  if (isStageLocked) {
                    toast.error("El cliente está en proceso de trámite, por cuestiones de seguridad debe pasar a otro estado para activar la IA.");
                    return;
                  }
                  if (isLoading || contacto.esCompartido) return;
                  handleToggle(!isBotActivo);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  (contacto.etapaEmbudo === 'En Negociación' || contacto.etapaEmbudo === 'Cerrado' || contacto.etapaEmbudo === 'Cerrado Ganado')
                    ? 'bg-slate-300 opacity-50 cursor-not-allowed'
                    : isBotActivo ? 'bg-emerald-500 cursor-pointer' : 'bg-slate-300 cursor-pointer'
                } ${isLoading || contacto.esCompartido ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isBotActivo ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        )}

        {contacto.email && (
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm transition-colors">
              <Mail className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
              <p className="text-sm font-bold text-slate-900 truncate">{contacto.email}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
          <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm transition-colors">
            <Tag className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Origen</p>
            <p className="text-sm font-bold text-slate-900 truncate">{contacto.origen}</p>
          </div>
        </div>

        {/* Token Usage Section */}
        {!contacto.esCompartido && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-purple-500" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consumo Tokens</p>
              </div>
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDropdownOpen(!isDropdownOpen);
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
            <div className="bg-white rounded-xl p-3 border border-slate-100 flex flex-col gap-2">
              {isLoadingUsage ? (
                <span className="text-xs text-slate-400 animate-pulse text-center py-4">Cargando métricas...</span>
              ) : (
                <>
                  {/* 1. Tokens Totales */}
                  <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Tokens Totales</span>
                      <span className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">Input + Output</span>
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

                  {/* 2. Tokens del Límite (Input + Output) */}
                  <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-indigo-50/50 border border-indigo-100/50 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wide">Consumo Límite</span>
                      <span className="text-[10px] text-indigo-500/80 font-medium leading-none mt-0.5">Solo Input + Output</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-black text-indigo-700">
                        {((usage?.inputTokens || 0) + (usage?.outputTokens || 0)).toLocaleString()} <span className="text-[10px] font-bold text-indigo-500/70 uppercase">tkns</span>
                      </span>
                      <span className="text-[10px] font-bold text-indigo-600">
                        ${usage?.costoUSD?.toFixed(4) || '0.0000'} USD <span className="text-[8px] uppercase">(Cobrado)</span>
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
        isOpen={showOverrideModal}
        onClose={cancelOverride}
        onConfirm={confirmOverride}
        title="Reactivar IA (Límite Superado)"
        description="Este contacto ha alcanzado su límite de tokens diarios. ¿Deseas reiniciar su límite para permitir que la IA siga contestando? Podría incurrir en costos extras."
        confirmText="Sí, reactivar bot"
        type="info"
        icon={<Bot className="h-10 w-10 text-blue-500" />}
      />
    </div>
  );
};
