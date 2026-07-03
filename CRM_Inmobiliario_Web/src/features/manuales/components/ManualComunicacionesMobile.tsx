import { ManualSection, ManualAlert, ManualBadge } from '../../../components/ui/manuales';
import { MessageCircle, ShieldCheck, Zap, BrainCircuit, Bot, Megaphone, Bell } from 'lucide-react';

export const ManualComunicacionesMobile = () => {
  return (
    <div className="p-4 bg-slate-50 min-h-screen font-sans text-slate-800 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Comunicaciones</h1>
        <p className="text-sm text-slate-600">Gestión de mensajes y canales</p>
      </div>

      <ManualSection title="1. Canales" icon={<MessageCircle className="w-5 h-5 text-blue-600" />}>
        <p className="text-sm text-slate-700 mb-4">
          Unifica WhatsApp y Globe en una sola pantalla con IA.
        </p>
        <div className="space-y-3">
          <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">Antifraude</h4>
              <p className="text-xs text-slate-600 mt-1">Verificación automática de mensajes.</p>
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 flex items-start space-x-3">
            <Zap className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">Entrega Segura</h4>
              <p className="text-xs text-slate-600 mt-1">Mensajes guardados ante desconexiones.</p>
            </div>
          </div>
        </div>
      </ManualSection>

      <ManualSection title="2. Procesamiento" icon={<BrainCircuit className="w-5 h-5 text-indigo-600" />}>
        <ul className="space-y-3">
          <li className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm text-sm">
            <strong className="text-slate-900 block mb-1">Audio:</strong>
            <span className="text-slate-600 text-xs">La IA escucha, resume y responde automáticamente.</span>
          </li>
          <li className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm text-sm">
            <strong className="text-slate-900 block mb-1">Multimedia:</strong>
            <span className="text-slate-600 text-xs">Anota el tipo de archivo recibido en el chat.</span>
          </li>
        </ul>
      </ManualSection>

      <ManualSection title="3. Asistente IA" icon={<Bot className="w-5 h-5 text-purple-600" />}>
          <div className="flex flex-col space-y-3">
            <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
              <ManualBadge>Control</ManualBadge>
              <p className="text-xs text-slate-600 mt-1">Activa o desactiva la IA a voluntad.</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
              <ManualBadge>Contactos</ManualBadge>
              <p className="text-xs text-slate-600 mt-1">Creación automática de perfiles.</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
              <ManualBadge>Adaptación</ManualBadge>
              <p className="text-xs text-slate-600 mt-1">Sigue el hilo si el cliente cambia de idea.</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
              <ManualBadge>Silencio</ManualBadge>
              <p className="text-xs text-slate-600 mt-1">Se pausa en negociaciones clave.</p>
            </div>
          </div>
      </ManualSection>

      <ManualSection title="4. Campañas" icon={<Megaphone className="w-5 h-5 text-pink-600" />}>
          <ManualAlert title="Seguimiento de Anuncios" description="Identifica desde qué anuncio de FB escribe el cliente." />
      </ManualSection>
      
      <ManualSection title="5. Alertas" icon={<Bell className="w-5 h-5 text-orange-600" />}>
          <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
            Notificaciones en web y celular para agenda y avisos de la IA.
          </p>
      </ManualSection>
    </div>
  );
};
