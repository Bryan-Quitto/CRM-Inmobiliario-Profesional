import { Shield, Smartphone, BrainCircuit, LayoutGrid } from 'lucide-react';
import { FacebookIcon as Facebook } from '../../../../components/ui/FacebookIcon';
import { ManualSection } from '../../../../components/ui/manuales/ManualSection';
import type { ManualSistemaIARegistrosSection } from './index';

interface Props {
  section: ManualSistemaIARegistrosSection;
}

export const ManualSistemaIARegistrosMobile: React.FC<Props> = ({ section }) => {
  const showAll = section === 'all';
  const showWhatsapp = showAll || section === 'whatsapp';
  const showFacebook = showAll || section === 'facebook';
  const showPersonal = showAll || section === 'personal';
  const showGeneral = showAll || section === 'general';

  const renderChannelLogs = (title: string, icon: React.ReactNode, bgColor: string, textColor: string, borderColor: string) => (
    <ManualSection title={title} icon={icon}>
      <ul className="space-y-3 mt-3">
        <li className={`${bgColor} p-3 rounded-lg border ${borderColor}`}>
          <h4 className={`font-bold ${textColor} text-xs mb-1`}>Ver Contacto</h4>
          <p className="text-xs text-slate-700">Abre los detalles completos del contacto en una pestaña nueva.</p>
        </li>
        <li className={`${bgColor} p-3 rounded-lg border ${borderColor}`}>
          <h4 className={`font-bold ${textColor} text-xs mb-1`}>Origen del Registro</h4>
          <p className="text-xs text-slate-700">Visualiza y edita si el contacto fue registrado por IA o por ti.</p>
        </li>
        <li className={`${bgColor} p-3 rounded-lg border ${borderColor}`}>
          <h4 className={`font-bold ${textColor} text-xs mb-1`}>Conversación Diferenciada</h4>
          <p className="text-xs text-slate-700">Diferencia claramente mensajes de la IA y mensajes tuyos.</p>
        </li>
        <li className={`${bgColor} p-3 rounded-lg border ${borderColor}`}>
          <h4 className={`font-bold ${textColor} text-xs mb-1`}>Intereses y Disparadores</h4>
          <p className="text-xs text-slate-700">Usa "Ver disparador" para abrir la ficha de la propiedad que interesó.</p>
        </li>
      </ul>
    </ManualSection>
  );

  return (
    <div className="bg-white min-h-screen font-sans text-slate-800 p-4 pb-12">
      <header className="mb-8 border-b border-slate-100 pb-6 text-center">
        <div className="inline-flex items-center justify-center p-2 bg-indigo-50 rounded-xl mb-3">
          <Shield className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Auditoría IA</h1>
        <p className="text-sm text-slate-500 leading-relaxed">Historial detallado de todas las interacciones con los Asistentes Virtuales.</p>
      </header>

      <div className="space-y-6">
        {showWhatsapp && renderChannelLogs(showAll ? "1. WhatsApp" : "WhatsApp", <Smartphone className="w-5 h-5" />, "bg-emerald-50", "text-emerald-900", "border-emerald-100")}
        
        {showFacebook && renderChannelLogs(showAll ? "2. Facebook" : "Facebook", <Facebook className="w-5 h-5" />, "bg-sky-50", "text-sky-900", "border-sky-100")}

        {showPersonal && (
          <ManualSection title={showAll ? "3. IA del Sistema" : "IA Personal"} icon={<BrainCircuit className="w-5 h-5" />}>
            <ul className="space-y-3 mt-3">
              <li className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                <h4 className="font-bold text-indigo-900 text-xs mb-1">Gestión de Conversaciones</h4>
                <p className="text-xs text-slate-700">Cambia el nombre a una conversación específica o elimínala.</p>
              </li>
              <li className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                <h4 className="font-bold text-indigo-900 text-xs mb-1">Acceso Directo al Copilot</h4>
                <p className="text-xs text-slate-700">Haz clic para abrir tu Drawer del Copilot en esa conversación.</p>
              </li>
            </ul>
          </ManualSection>
        )}

        {showGeneral && (
          <ManualSection title={showAll ? "4. Registros Generales" : "Registros Generales"} icon={<LayoutGrid className="w-5 h-5" />}>
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 mt-3">
              <h4 className="font-bold text-amber-900 text-xs mb-1">Tarjetas por Sesión (10 min)</h4>
              <p className="text-xs text-slate-700">Se agrupan en rangos de 10 minutos (Ej. 30 minutos = 3 tarjetas continuas).</p>
            </div>
          </ManualSection>
        )}
      </div>
    </div>
  );
};
