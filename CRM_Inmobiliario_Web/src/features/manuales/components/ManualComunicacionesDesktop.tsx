import { ManualSection, ManualAlert, ManualBadge } from '../../../components/ui/manuales';
import { MessageCircle, ShieldCheck, Zap, BrainCircuit, Bot, Megaphone, Bell } from 'lucide-react';

export const ManualComunicacionesDesktop = () => {
  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-800">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Manual de Comunicaciones y Canales</h1>
          <p className="text-lg text-slate-600">Guía completa para la gestión de mensajes, canales y alertas</p>
        </div>

        <ManualSection title="1. Integración de Canales (WhatsApp y Facebook)" icon={<MessageCircle className="w-6 h-6 text-blue-600" />}>
          <p className="text-slate-700 leading-relaxed mb-4">
            El sistema te permite recibir y responder mensajes tanto de WhatsApp como de Facebook Messenger utilizando una única pantalla de conversación, apoyado por nuestra Inteligencia Artificial.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-slate-900">Protección Antifraude</h4>
                <p className="text-sm text-slate-600 mt-1">El sistema verifica automáticamente que cada mensaje que recibes provenga realmente de WhatsApp o Facebook, evitando mensajes falsos.</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-start space-x-3">
              <Zap className="w-5 h-5 text-amber-500 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-slate-900">Entrega Garantizada</h4>
                <p className="text-sm text-slate-600 mt-1">Garantizamos que ningún mensaje de tus clientes se pierda. Si hay una interrupción, el sistema guarda los mensajes y los entrega al volver a la normalidad.</p>
              </div>
            </div>
          </div>
        </ManualSection>

        <ManualSection title="2. Procesamiento de Mensajes" icon={<BrainCircuit className="w-6 h-6 text-indigo-600" />}>
          <p className="text-slate-700 leading-relaxed mb-4">
            El sistema es capaz de entender texto y extraer información valiosa de lo que envían tus clientes.
          </p>
          <ul className="space-y-3">
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold mr-3 mt-0.5">1</span>
              <div>
                <strong className="text-slate-900">Mensajes de Audio:</strong> <span className="text-slate-700">La IA es capaz de escuchar y procesar los mensajes de audio del cliente para poder ofrecerte un resumen o responder directamente de forma confiable.</span>
              </div>
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold mr-3 mt-0.5">2</span>
              <div>
                <strong className="text-slate-900">Archivos Multimedia:</strong> <span className="text-slate-700">Cuando un cliente envía fotos, videos o documentos, el sistema deja una nota clara en el historial (por ejemplo, "[Media: Imagen]").</span>
              </div>
            </li>
          </ul>
        </ManualSection>

        <ManualSection title="3. Comportamiento del Asistente Inteligente (Copilot)" icon={<Bot className="w-6 h-6 text-purple-600" />}>
           <div className="grid grid-cols-2 gap-4">
             <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <ManualBadge>Control Total</ManualBadge>
                <p className="text-sm text-slate-600 mt-2">Tú decides cuándo usar el asistente inteligente. Puedes activarlo o desactivarlo según prefieras.</p>
             </div>
             <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <ManualBadge>Creación Automática</ManualBadge>
                <p className="text-sm text-slate-600 mt-2">Olvídate de guardar números manualmente. El sistema crea perfiles de contacto automáticamente.</p>
             </div>
             <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <ManualBadge>Adaptación en la Charla</ManualBadge>
                <p className="text-sm text-slate-600 mt-2">Si el cliente cambia de opinión, el asistente se adapta al instante y sigue con naturalidad.</p>
             </div>
             <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <ManualBadge>Modo Silencio</ManualBadge>
                <p className="text-sm text-slate-600 mt-2">En etapas clave, como una negociación avanzada, el asistente se silencia automáticamente.</p>
             </div>
           </div>
        </ManualSection>

        <ManualSection title="4. Campañas y Anuncios (Facebook)" icon={<Megaphone className="w-6 h-6 text-pink-600" />}>
           <ManualAlert title="Seguimiento Inteligente" description="La IA es capaz de identificar exactamente desde qué anuncio de Facebook te está escribiendo un cliente, vinculándolo de forma automática a la propiedad correcta." />
        </ManualSection>
        
        <ManualSection title="5. Alertas y Notificaciones" icon={<Bell className="w-6 h-6 text-orange-600" />}>
           <p className="text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
             <strong>Notificaciones Directas:</strong> Recibe alertas directas en tu navegador web o celular para que no te pierdas nada importante. Te avisaremos al instante sobre tareas pendientes en tu agenda o si la IA requiere tu ayuda para responder a un cliente.
           </p>
        </ManualSection>
      </div>
    </div>
  );
};
