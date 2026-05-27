import { Phone, Mail, Tag, Bot } from 'lucide-react';
import { useContactoBotToggle } from '../../hooks/useContactoBotToggle';
import ConfirmModal from '@/components/ConfirmModal';
import { toast } from 'sonner';
import type { Contacto } from '../../types';

interface ContactoProfileCardProps {
  contacto: Contacto;
}

export const ContactoProfileCard = ({ contacto }: ContactoProfileCardProps) => {
  const { isBotActivo, handleToggle, isLoading, showOverrideModal, confirmOverride, cancelOverride } = useContactoBotToggle(contacto);

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
      </div>

      <ConfirmModal
        isOpen={showOverrideModal}
        onClose={cancelOverride}
        onConfirm={confirmOverride}
        title="Reactivar IA (Límite Superado)"
        description="Este contacto ha alcanzado su límite de tokens diarios. ¿Deseas reiniciar su límite para permitir que la IA siga contestando? Podría incurrir en costos extras."
        confirmText="Sí, reactivar bot"
      />
    </div>
  );
};
