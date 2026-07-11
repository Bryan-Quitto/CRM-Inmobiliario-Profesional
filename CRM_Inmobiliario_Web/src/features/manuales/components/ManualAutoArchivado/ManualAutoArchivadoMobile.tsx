import { Archive, Settings, ShieldCheck, AlertOctagon } from 'lucide-react';
import { ManualSection } from '../../../../components/ui/manuales/ManualSection';

export const ManualAutoArchivadoMobile: React.FC = () => {
  return (
    <div className="bg-white min-h-screen font-sans text-slate-800 p-4 pb-12">
      <header className="mb-8 border-b border-slate-100 pb-6 text-center">
        <div className="inline-flex items-center justify-center p-2 bg-indigo-50 rounded-xl mb-3">
          <Archive className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Manual Auto-Archivado</h1>
        <p className="text-sm text-slate-500 leading-relaxed">Entiende cómo el sistema mantiene tu CRM limpio y organizado.</p>
      </header>

      <div className="space-y-6">
        <ManualSection title="1. Configuración" icon={<Settings className="w-5 h-5" />}>
          <div className="space-y-3">
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-800 text-xs mb-1">Contactos Inactivos</h4>
              <p className="text-xs text-slate-600">Activa el archivado y elige límite de 100 a 1095 días.</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <h4 className="font-bold text-slate-800 text-xs mb-1">Propiedades Inactivas</h4>
              <p className="text-xs text-slate-600">Activa el archivado y elige límite de 100 a 1095 días.</p>
            </div>
          </div>
        </ManualSection>

        <ManualSection title="2. Criterios de Archivado" icon={<ShieldCheck className="w-5 h-5" />}>
          <p className="text-xs text-slate-600 mb-3">Cualquier interacción mantendrá tus registros vivos.</p>
          
          <div className="space-y-3">
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
              <h3 className="font-bold text-emerald-900 text-xs mb-1.5">Mantiene a los Contactos:</h3>
              <p className="text-xs text-emerald-800">Edición, tareas, notas, fusión, mensajes, transacciones, IA, intereses y cambios de etapa.</p>
            </div>
            
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
              <h3 className="font-bold text-emerald-900 text-xs mb-1.5">Mantiene a las Propiedades:</h3>
              <p className="text-xs text-emerald-800">Edición, tareas, cambios de estado, manejo de FAQs, subida de imágenes y edición multimedia.</p>
            </div>
          </div>
        </ManualSection>

        <ManualSection title="3. Consecuencias (Bloqueos)" icon={<AlertOctagon className="w-5 h-5" />}>
          <p className="text-xs text-slate-600 mb-3">El registro archivado entra en modo <strong>solo lectura</strong>.</p>
          
          <div className="space-y-3">
            <div className="bg-rose-50 p-3 rounded-lg border border-rose-100">
              <h3 className="font-bold text-rose-900 text-xs mb-1.5">Contactos Archivados:</h3>
              <p className="text-xs text-rose-800">Se bloquea la edición, IA, fusión, crear notas, cambiar etapa y la gestión de intereses.</p>
            </div>
            
            <div className="bg-rose-50 p-3 rounded-lg border border-rose-100">
              <h3 className="font-bold text-rose-900 text-xs mb-1.5">Propiedades Archivadas:</h3>
              <p className="text-xs text-rose-800 mb-2">Se bloquea la edición, FAQs, compartir, exportar, transacciones, cambiar estado y multimedia.</p>
              <div className="bg-white/60 p-2 rounded border border-rose-200/50">
                <p className="text-[10px] text-orange-900 font-bold uppercase mb-0.5">⚠️ Limpieza Global</p>
                <p className="text-[10px] text-rose-800">Reglas estrictas (archivada o no): Inactivas por 1 año sufren alerta de 31 días y limpieza. Cerradas sufren alerta inmediata y limpieza innegociable al año.</p>
              </div>
            </div>
            
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mt-2">
              <p className="text-xs text-slate-600 text-center">Para recuperar las funciones, debes <strong>Desarchivar</strong> el registro manualmente.</p>
            </div>
          </div>
        </ManualSection>
      </div>
    </div>
  );
};
