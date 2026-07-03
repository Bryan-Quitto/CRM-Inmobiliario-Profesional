import { Bot, MessageSquare, BrainCircuit, Smartphone, Globe, ShieldCheck } from 'lucide-react';
import { ManualSection } from '../../../../components/ui/manuales/ManualSection';
import type { ManualIASection } from './index';

interface Props {
  section: ManualIASection;
}

export const ManualIADesktop: React.FC<Props> = ({ section }) => {
  const showAll = section === 'all';
  const showPersonal = showAll || section === 'personal';
  const showWhatsapp = showAll || section === 'whatsapp';
  const showFacebook = showAll || section === 'facebook';

  return (
    <div className="bg-slate-50 p-8 min-h-screen font-sans text-slate-800">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-10">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-2xl mb-4">
            <Bot className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Manual del Asistente Virtual (IA)</h1>
          <p className="text-lg text-slate-500">Tu Asistente Virtual está aquí para ayudarte en tu día a día: desde organizar tus contactos y tareas, hasta buscar propiedades y responder tus dudas sobre el negocio.</p>
        </header>

        <div className="space-y-8">
          {showPersonal && (
            <ManualSection title={showAll ? "1. IA del Sistema (Personal)" : "IA del Sistema (Personal)"} icon={<BrainCircuit className="w-6 h-6 text-indigo-500" />}>
              <p className="mb-4 text-slate-600">Es el asistente que usas tú mismo dentro de la plataforma para ser más rápido (Copilot).</p>
              <ul className="space-y-4">
                <li className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                  <h4 className="font-bold text-indigo-900 mb-1">Búsqueda Inteligente y Detalles Profundos</h4>
                  <p className="text-sm text-slate-700">Puedes pedirle al asistente que busque propiedades basándose en lo que tu cliente necesita, mostrándote tarjetas interactivas de propiedades y permitiéndote consultar todos sus detalles profundos.</p>
                </li>
                <li className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                  <h4 className="font-bold text-indigo-900 mb-1">Base de Conocimiento</h4>
                  <p className="text-sm text-slate-700">Consúltale sobre políticas de la empresa, manuales o procesos internos y te dará la respuesta exacta usando documentos oficiales. Si no sabe algo, no se lo inventará.</p>
                </li>
                <li className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                  <h4 className="font-bold text-indigo-900 mb-1">Resumen y Revisión de Contactos</h4>
                  <p className="text-sm text-slate-700">Pídele que te resuma de qué has hablado y qué ha pasado con un cliente, o revisa de forma rápida todas las llamadas, correos o reuniones que has tenido con él.</p>
                </li>
                <li className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                  <h4 className="font-bold text-indigo-900 mb-1">Agendar Tareas</h4>
                  <p className="text-sm text-slate-700">Dile "recuérdame llamar a Juan mañana", y el asistente creará la tarea en tu calendario por ti. (Maneja horarios locales de Ecuador).</p>
                </li>
                <li className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                  <h4 className="font-bold text-indigo-900 mb-1">Cotizaciones Rápidas</h4>
                  <p className="text-sm text-slate-700">Solo tú puedes usar el asistente para generar proyecciones hipotecarias rápidas, recordando que son cálculos referenciales.</p>
                </li>
                <li className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                  <h4 className="font-bold text-indigo-900 mb-1">Navegación Rápida</h4>
                  <p className="text-sm text-slate-700">El asistente te compartirá enlaces rápidos con emojis para llevarte directo a otras pantallas del sistema sin salir del chat.</p>
                </li>
                <li className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                  <h4 className="font-bold text-indigo-900 mb-1">Memoria y Seguimiento</h4>
                  <p className="text-sm text-slate-700">Recuerda el hilo de la charla, sabe cuándo cambias de tema y comprende referencias a propiedades anteriores.</p>
                </li>
              </ul>
            </ManualSection>
          )}

          {showWhatsapp && (
            <ManualSection title={showAll ? "2. Integración con WhatsApp" : "Integración con WhatsApp"} icon={<Smartphone className="w-6 h-6 text-emerald-500" />}>
              <p className="mb-4 text-slate-600">Es el asistente que atiende a tus clientes directamente por WhatsApp.</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <li className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
                  <h4 className="font-bold text-emerald-900 mb-1">Búsqueda y Detalles</h4>
                  <p className="text-sm text-slate-700">Buscará la casa ideal usando las características que mencione el cliente, y le contará todo sobre esa propiedad.</p>
                </li>
                <li className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
                  <h4 className="font-bold text-emerald-900 mb-1">Dudas Frecuentes</h4>
                  <p className="text-sm text-slate-700">Responderá las dudas del cliente consultando nuestra información oficial.</p>
                </li>
                <li className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
                  <h4 className="font-bold text-emerald-900 mb-1">Nivel de Interés</h4>
                  <p className="text-sm text-slate-700">Tomará nota de qué propiedades le gustaron más al cliente para que te enfoques en esas opciones.</p>
                </li>
                <li className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
                  <h4 className="font-bold text-emerald-900 mb-1">Hablar con un Humano</h4>
                  <p className="text-sm text-slate-700">Si el asistente no puede ayudar o el cliente prefiere hablar con una persona, te conectará rápidamente contigo.</p>
                </li>
                <li className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
                  <h4 className="font-bold text-emerald-900 mb-1">Captación de Dueños</h4>
                  <p className="text-sm text-slate-700">Si un dueño desea vender o alquilar, tomará sus datos y te avisará.</p>
                </li>
                <li className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
                  <h4 className="font-bold text-emerald-900 mb-1">Multimédia (Fotos/Audios)</h4>
                  <p className="text-sm text-slate-700">La IA puede escuchar notas de voz, enviar fotos de la propiedad y detectar archivos enviados por el cliente ("Media: Imagen").</p>
                </li>
                <li className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
                  <h4 className="font-bold text-emerald-900 mb-1">Creación de Contactos</h4>
                  <p className="text-sm text-slate-700">Si un cliente nuevo te escribe por primera vez, el sistema crea su perfil automáticamente.</p>
                </li>
                <li className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
                  <h4 className="font-bold text-emerald-900 mb-1 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-emerald-600" /> Modo Silencio</h4>
                  <p className="text-sm text-slate-700">En etapas de negociación, el asistente se silencia para que tú tomes el control.</p>
                </li>
                <li className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 md:col-span-2">
                  <h4 className="font-bold text-emerald-900 mb-1 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Protección Antifraude y Estabilidad</h4>
                  <p className="text-sm text-slate-700">El sistema verifica que los mensajes sean reales de WhatsApp y garantiza su entrega, gestionando los mensajes uno por uno de manera estable.</p>
                </li>
              </ul>
            </ManualSection>
          )}

          {showFacebook && (
            <ManualSection title={showAll ? "3. Integración con Facebook Messenger" : "Integración con Facebook Messenger"} icon={<Globe className="w-6 h-6 text-sky-500" />}>
              <p className="mb-4 text-slate-600">Funciona exactamente igual que el asistente de WhatsApp en cuanto a funcionalidades, pero atiende a los clientes que te escriben por Facebook Messenger o mediante anuncios en redes sociales.</p>
              <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100/50">
                <h4 className="font-bold text-sky-900 mb-1">Seguimiento Inteligente de Anuncios</h4>
                <p className="text-sm text-slate-700">La IA es capaz de identificar exactamente desde qué anuncio de Facebook te está escribiendo un cliente, vinculándolo de forma automática a la propiedad correcta de tu inventario.</p>
              </div>
            </ManualSection>
          )}
        </div>
      </div>
    </div>
  );
};
