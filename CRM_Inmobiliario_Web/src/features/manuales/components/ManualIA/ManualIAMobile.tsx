import { Bot, BrainCircuit, Smartphone, ShieldCheck } from 'lucide-react';
import { FacebookIcon as Facebook } from '../../../../components/ui/FacebookIcon';
import { ManualSection } from '../../../../components/ui/manuales/ManualSection';
import type { ManualIASection } from './index';

interface Props {
  section: ManualIASection;
}

export const ManualIAMobile: React.FC<Props> = ({ section }) => {
  const showAll = section === 'all';
  const showPersonal = showAll || section === 'personal';
  const showWhatsapp = showAll || section === 'whatsapp';
  const showFacebook = showAll || section === 'facebook';

  return (
    <div className="bg-white min-h-screen font-sans text-slate-800 p-4 pb-12">
      <header className="mb-8 border-b border-slate-100 pb-6 text-center">
        <div className="inline-flex items-center justify-center p-2 bg-indigo-50 rounded-xl mb-3">
          <Bot className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Asistente Virtual (IA)</h1>
        <p className="text-sm text-slate-500 leading-relaxed">Tu Asistente Virtual para organizar contactos y buscar propiedades.</p>
      </header>

      <div className="space-y-6">
        {showPersonal && (
          <ManualSection title={showAll ? "1. IA del Sistema" : "IA del Sistema"} icon={<BrainCircuit className="w-5 h-5" />}>
            <ul className="space-y-3 text-xs text-slate-700">
              <li className="bg-slate-50 p-3 rounded-lg border border-slate-100"><strong>Búsqueda:</strong> Encuentra propiedades y muestra tarjetas con detalles.</li>
              <li className="bg-slate-50 p-3 rounded-lg border border-slate-100"><strong>Base de Conocimiento:</strong> Responde dudas con documentos oficiales.</li>
              <li className="bg-slate-50 p-3 rounded-lg border border-slate-100"><strong>Resumen:</strong> Revisa el historial de interacciones con un cliente.</li>
              <li className="bg-slate-50 p-3 rounded-lg border border-slate-100"><strong>Agenda:</strong> Dile que te recuerde algo y creará una tarea.</li>
              <li className="bg-slate-50 p-3 rounded-lg border border-slate-100"><strong>Navegación y Memoria:</strong> Enlaces rápidos y comprensión de contexto.</li>
            </ul>
          </ManualSection>
        )}

        {showWhatsapp && (
          <ManualSection title={showAll ? "2. WhatsApp" : "WhatsApp"} icon={<Smartphone className="w-5 h-5" />}>
            <ul className="space-y-3 text-xs text-slate-700">
              <li className="bg-slate-50 p-3 rounded-lg border border-slate-100"><strong>Atención:</strong> Busca propiedades, da detalles y responde dudas.</li>
              <li className="bg-slate-50 p-3 rounded-lg border border-slate-100"><strong>Nivel de Interés:</strong> Anota qué propiedades gustaron al cliente.</li>
              <li className="bg-slate-50 p-3 rounded-lg border border-slate-100"><strong>Multimédia:</strong> Escucha audios y envía fotos.</li>
              <li className="bg-slate-50 p-3 rounded-lg border border-slate-100"><strong>Contactos:</strong> Crea perfiles para clientes nuevos y capta dueños.</li>
              <li className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-600" /> Protección antifraude y control total.</li>
            </ul>
          </ManualSection>
        )}

        {showFacebook && (
          <ManualSection title={showAll ? "3. Facebook Messenger" : "Facebook Messenger"} icon={<Facebook className="w-5 h-5" />}>
            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-600">Funciona igual que WhatsApp.</p>
              </div>
              <div className="bg-sky-50 p-3 rounded-lg border border-sky-100">
                <h4 className="font-bold text-sky-900 text-xs mb-1">Seguimiento de Anuncios</h4>
                <p className="text-xs text-sky-800">Identifica desde qué anuncio escribe el cliente.</p>
              </div>
            </div>
          </ManualSection>
        )}
      </div>
    </div>
  );
};
