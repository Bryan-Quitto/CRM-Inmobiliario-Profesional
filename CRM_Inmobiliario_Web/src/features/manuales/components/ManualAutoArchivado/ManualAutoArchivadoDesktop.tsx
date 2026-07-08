import { Archive, Settings, ShieldCheck, AlertOctagon } from 'lucide-react';
import { ManualSection } from '../../../../components/ui/manuales/ManualSection';

export const ManualAutoArchivadoDesktop: React.FC = () => {
  return (
    <div className="bg-slate-50 p-8 min-h-screen font-sans text-slate-800">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-10">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-2xl mb-4">
            <Archive className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Manual de Auto-Archivado</h1>
          <p className="text-lg text-slate-500">Configura el archivado automático y entiende cómo el sistema mantiene tu CRM organizado.</p>
        </header>

        <div className="space-y-8">
          <ManualSection title="1. Configuración" icon={<Settings className="w-6 h-6 text-indigo-500" />}>
            <p className="mb-4 text-slate-700">En la pantalla de configuración encontrarás las siguientes opciones para automatizar el mantenimiento:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Archive className="w-4 h-4 text-slate-400" /> Contactos Inactivos</h3>
                <p className="text-sm text-slate-600 mb-3">Interruptor que permite activar o desactivar el auto-archivado para tus contactos.</p>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500 font-semibold mb-1">Límite de Inactividad:</p>
                  <p className="text-sm text-slate-700">Tiempo sin actividad antes de ser archivado (<strong>100 a 1095 días</strong>).</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><Archive className="w-4 h-4 text-slate-400" /> Propiedades Inactivas</h3>
                <p className="text-sm text-slate-600 mb-3">Interruptor que permite activar o desactivar el auto-archivado para tus propiedades.</p>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-xs text-slate-500 font-semibold mb-1">Límite de Inactividad:</p>
                  <p className="text-sm text-slate-700">Tiempo sin actividad antes de ser archivada (<strong>100 a 1095 días</strong>).</p>
                </div>
              </div>
            </div>
          </ManualSection>

          <ManualSection title="2. Criterios de Archivado" icon={<ShieldCheck className="w-6 h-6 text-emerald-500" />}>
            <p className="mb-4 text-slate-700">El sistema archiva registros sin actividad reciente. Cualquier interacción sobre ellos actualizará su estado, manteniéndolos vivos.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100/50">
                <h3 className="font-bold text-emerald-900 mb-3 text-sm uppercase tracking-wider">Contactos (Acciones)</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>• Edición de datos o etapas</li>
                  <li>• Intereses y Transacciones</li>
                  <li>• Tareas y Notas</li>
                  <li>• Fusión y Colaboración</li>
                  <li>• Mensajería Omnicanal</li>
                  <li>• Control de IA</li>
                </ul>
              </div>

              <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100/50">
                <h3 className="font-bold text-emerald-900 mb-3 text-sm uppercase tracking-wider">Propiedades (Acciones)</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>• Edición de datos o estados</li>
                  <li>• Gestión de FAQs</li>
                  <li>• Gestión de Galería y Secciones</li>
                  <li>• Transacciones</li>
                  <li>• Creación de Tareas</li>
                </ul>
              </div>
            </div>
          </ManualSection>

          <ManualSection title="3. Consecuencias del Archivado" icon={<AlertOctagon className="w-6 h-6 text-rose-500" />}>
            <p className="mb-4 text-slate-700">Cuando un registro pasa a "Archivado", entra en un modo de <strong>solo lectura</strong>.</p>
            
            <div className="space-y-4">
              <div className="bg-rose-50 p-5 rounded-xl border border-rose-100">
                <h3 className="font-bold text-rose-900 mb-2">Se bloquea en Contactos:</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-rose-800/80">
                  <li>• Edición y Fusión</li>
                  <li>• Inteligencia Artificial</li>
                  <li>• Gestión de Intereses</li>
                  <li>• Nuevas Notas (Historial)</li>
                  <li>• Cambio de estado</li>
                </ul>
              </div>

              <div className="bg-rose-50 p-5 rounded-xl border border-rose-100">
                <h3 className="font-bold text-rose-900 mb-2">Se bloquea en Propiedades:</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-rose-800/80 mb-4">
                  <li>• Edición General</li>
                  <li>• Botones Exportar/Compartir</li>
                  <li>• Gestión de Multimedia y Galería</li>
                  <li>• Configuración de FAQs</li>
                  <li>• Nuevas notas de transacciones</li>
                  <li>• Cambio de estado</li>
                </ul>
                <div className="bg-white/60 p-3 rounded-lg border border-rose-200/50">
                  <h4 className="font-bold text-orange-900 text-xs mb-1 uppercase tracking-wide">⚠️ Limpieza Automática</h4>
                  <p className="text-xs text-rose-800/90">Si la propiedad permanece archivada por <strong>más de 31 días</strong>, sus fotografías y PDF se eliminarán automáticamente para liberar almacenamiento.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-slate-100 p-4 rounded-xl text-sm text-slate-600 text-center">
              <strong>Nota:</strong> Para recuperar estas funcionalidades, simplemente utiliza la opción de "Desarchivar".
            </div>
          </ManualSection>
        </div>
      </div>
    </div>
  );
};
