import { Shield, Smartphone, BrainCircuit, LayoutGrid } from 'lucide-react';
import { FacebookIcon as Facebook } from '../../../../components/ui/FacebookIcon';
import { ManualSection } from '../../../../components/ui/manuales/ManualSection';
import type { ManualSistemaIARegistrosSection } from './index';

interface Props {
  section: ManualSistemaIARegistrosSection;
}

export const ManualSistemaIARegistrosDesktop: React.FC<Props> = ({ section }) => {
  const showAll = section === 'all';
  const showWhatsapp = showAll || section === 'whatsapp';
  const showFacebook = showAll || section === 'facebook';
  const showPersonal = showAll || section === 'personal';
  const showGeneral = showAll || section === 'general';

  // WhatsApp and Facebook share the exact same UI in the manual
  const renderChannelLogs = (title: string, icon: React.ReactNode, bgColor: string, textColor: string, borderColor: string) => (
    <ManualSection title={title} icon={icon}>
      <p className="mb-4 text-slate-600">En esta pestaña podrás ver todos los contactos que han tenido un historial de conversación con el sistema.</p>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <li className={`${bgColor} p-4 rounded-xl border ${borderColor}`}>
          <h4 className={`font-bold ${textColor} mb-1`}>Ver Contacto</h4>
          <p className="text-sm text-slate-700">Puedes hacer clic en este botón para abrir los detalles completos del contacto en una nueva pestaña.</p>
        </li>
        <li className={`${bgColor} p-4 rounded-xl border ${borderColor}`}>
          <h4 className={`font-bold ${textColor} mb-1`}>Origen del Registro</h4>
          <p className="text-sm text-slate-700">Visualiza si el contacto fue registrado automáticamente por el sistema o si fue creado manualmente por ti, y edítalo directamente desde aquí.</p>
        </li>
        <li className={`${bgColor} p-4 rounded-xl border ${borderColor}`}>
          <h4 className={`font-bold ${textColor} mb-1`}>Historial de Conversación</h4>
          <p className="text-sm text-slate-700">Lee toda la conversación. El sistema diferencia claramente mediante colores y etiquetas cuándo una respuesta fue de la IA y cuándo fue un mensaje tuyo.</p>
        </li>
        <li className={`${bgColor} p-4 rounded-xl border ${borderColor}`}>
          <h4 className={`font-bold ${textColor} mb-1`}>Intereses y Disparadores</h4>
          <p className="text-sm text-slate-700">Ve, edita o elimina intereses del cliente. Si la IA lo registró, usa "Ver disparador" para abrir la ficha de la propiedad que le interesó.</p>
        </li>
      </ul>
    </ManualSection>
  );

  return (
    <div className="bg-slate-50 p-8 min-h-screen font-sans text-slate-800">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-10">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-2xl mb-4">
            <Shield className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Auditoría y Registros del Sistema IA</h1>
          <p className="text-lg text-slate-500">El sistema mantiene un historial detallado de todas las interacciones que tienes tú y tus clientes con los Asistentes Virtuales.</p>
        </header>

        <div className="space-y-8">
          {showWhatsapp && renderChannelLogs(showAll ? "1. Registros de WhatsApp" : "Registros de WhatsApp", <Smartphone className="w-6 h-6 text-emerald-500" />, "bg-emerald-50/50", "text-emerald-900", "border-emerald-100/50")}
          
          {showFacebook && renderChannelLogs(showAll ? "2. Registros de Facebook" : "Registros de Facebook Messenger", <Facebook className="w-6 h-6 text-sky-500" />, "bg-sky-50/50", "text-sky-900", "border-sky-100/50")}

          {showPersonal && (
            <ManualSection title={showAll ? "3. Registros de IA del Sistema (Personal)" : "Registros de IA Personal"} icon={<BrainCircuit className="w-6 h-6 text-indigo-500" />}>
              <p className="mb-4 text-slate-600">En esta pestaña podrás auditar todas las conversaciones que has tenido con tu Copilot (IA Personal).</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <li className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                  <h4 className="font-bold text-indigo-900 mb-1">Gestión de Conversaciones</h4>
                  <p className="text-sm text-slate-700">Cambia el nombre a una conversación específica para organizarla mejor, o elimínala si ya no la necesitas.</p>
                </li>
                <li className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50">
                  <h4 className="font-bold text-indigo-900 mb-1">Acceso Directo</h4>
                  <p className="text-sm text-slate-700">Haz clic para acceder a la conversación. Esto abrirá tu Drawer del Copilot y cargará directamente el historial hasta tu último mensaje.</p>
                </li>
              </ul>
            </ManualSection>
          )}

          {showGeneral && (
            <ManualSection title={showAll ? "4. Registros Generales" : "Registros Generales"} icon={<LayoutGrid className="w-6 h-6 text-amber-500" />}>
              <p className="mb-4 text-slate-600">La vista general te muestra un historial combinado de todos los canales para una revisión rápida.</p>
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50">
                <h4 className="font-bold text-amber-900 mb-1">Tarjetas por Sesión (Rangos de 10 min)</h4>
                <p className="text-sm text-slate-700">Los registros se agrupan en tarjetas horizontales que representan intervalos de tiempo. Si conversaste de forma seguida durante 30 minutos, el sistema guardará 3 tarjetas (Sesión #1, #2, #3) correspondientes a cada periodo de 10 minutos.</p>
              </div>
            </ManualSection>
          )}
        </div>
      </div>
    </div>
  );
};
