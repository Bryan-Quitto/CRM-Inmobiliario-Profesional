import { AlertOctagon, Archive, Info } from 'lucide-react';
import { ManualSection } from '../../../../components/ui/manuales/ManualSection';

export const ManualConsecuenciasPropiedadMobile: React.FC = () => {
  return (
    <div className="bg-white min-h-screen font-sans text-slate-800 p-4 pb-12">
      <header className="mb-6 border-b border-slate-100 pb-5 text-center">
        <div className="inline-flex items-center justify-center p-2 bg-rose-50 rounded-xl mb-3">
          <Archive className="w-8 h-8 text-rose-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Registro Archivado</h1>
        <p className="text-sm text-slate-500">¿Qué pasa cuando una propiedad se archiva?</p>
      </header>

      <div className="space-y-5">
        <ManualSection title="Restricciones (Bloqueos)" icon={<AlertOctagon className="w-5 h-5" />}>
          <p className="text-xs text-slate-600 mb-3">
            La propiedad entra en un modo de <strong>"solo lectura"</strong>. A continuación lo que se bloquea:
          </p>
          
          <div className="space-y-2 mb-4">
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
              <h4 className="font-bold text-orange-900 text-xs mb-1">Limpieza Global</h4>
              <p className="text-xs text-slate-600"><strong>Inactividad:</strong> Alerta roja ("Por limpiar") al año sin actividad. <br/><strong>Cerradas:</strong> Limpieza inevitable (bloqueando opciones de fotos/PDF) al año del cierre.<br/><strong>Inactivas:</strong> Limpieza inmediata al cambiar estado.</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <h4 className="font-bold text-rose-800 text-xs mb-1">Datos y Compartir</h4>
              <p className="text-xs text-slate-600">No puedes editar su perfil, exportarla a PDF ni compartirla por WhatsApp.</p>
            </div>
            
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <h4 className="font-bold text-rose-800 text-xs mb-1">Multimedia y FAQs</h4>
              <p className="text-xs text-slate-600">No se pueden subir fotos, ni administrar la base de conocimientos (FAQs).</p>
            </div>
            
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <h4 className="font-bold text-rose-800 text-xs mb-1">Historial y Estado</h4>
              <p className="text-xs text-slate-600">No puedes añadir notas de transacción ni cambiar el estado del inmueble.</p>
            </div>
          </div>

          <div className="bg-indigo-50 p-3 rounded-lg flex items-start gap-2 border border-indigo-100">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-900">
              Para recuperar estas funciones, debes <strong>Desarchivar</strong> el inmueble manualmente.
            </p>
          </div>
        </ManualSection>
      </div>
    </div>
  );
};
