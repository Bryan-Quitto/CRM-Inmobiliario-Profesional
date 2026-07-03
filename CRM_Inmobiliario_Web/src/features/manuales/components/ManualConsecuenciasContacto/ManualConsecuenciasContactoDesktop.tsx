import { AlertOctagon, Archive, Info } from 'lucide-react';
import { ManualSection } from '../../../../components/ui/manuales/ManualSection';

export const ManualConsecuenciasContactoDesktop: React.FC = () => {
  return (
    <div className="bg-slate-50 p-8 min-h-screen font-sans text-slate-800">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-10">
        <header className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-rose-50 rounded-2xl mb-4">
            <Archive className="w-10 h-10 text-rose-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">Registro Archivado</h1>
          <p className="text-lg text-slate-500">Conoce qué sucede cuando un contacto se encuentra en este estado.</p>
        </header>

        <div className="space-y-6">
          <ManualSection title="Restricciones del Archivado" icon={<AlertOctagon className="w-6 h-6 text-rose-500" />}>
            <p className="mb-4 text-slate-700 text-sm">
              Cuando un contacto pasa a estado "Archivado", entra en un modo de <strong>"solo lectura"</strong> para preservar su información histórica intacta.
            </p>
            
            <div className="bg-rose-50/50 p-5 rounded-xl border border-rose-100/50 mb-4">
              <h3 className="font-bold text-rose-900 mb-3 text-sm">Acciones deshabilitadas:</h3>
              <ul className="space-y-3 text-sm text-slate-700">
                <li><strong className="text-rose-800">Edición de datos:</strong> El botón para editar la información principal del contacto desaparece.</li>
                <li><strong className="text-rose-800">Fusión de contactos:</strong> No podrás fusionar el contacto archivado con otro registro.</li>
                <li><strong className="text-rose-800">Inteligencia Artificial:</strong> El interruptor para activar/desactivar la IA se deshabilita.</li>
                <li><strong className="text-rose-800">Gestión de Intereses:</strong> Se bloquea la opción de vincular nuevas propiedades al contacto.</li>
                <li><strong className="text-rose-800">Historial e Interacciones:</strong> El editor de notas se oculta, impidiendo nuevas interacciones.</li>
                <li><strong className="text-rose-800">Cambio de estado:</strong> No podrás cambiar la etapa del embudo ni el estado del propietario.</li>
              </ul>
            </div>

            <div className="bg-indigo-50 p-4 rounded-xl flex items-start gap-3 border border-indigo-100">
              <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <p className="text-sm text-indigo-900">
                <strong>Nota:</strong> Para recuperar cualquiera de estas funcionalidades y volver a interactuar con el cliente, simplemente debes utilizar la opción de <strong>"Desarchivar"</strong>.
              </p>
            </div>
          </ManualSection>
        </div>
      </div>
    </div>
  );
};
