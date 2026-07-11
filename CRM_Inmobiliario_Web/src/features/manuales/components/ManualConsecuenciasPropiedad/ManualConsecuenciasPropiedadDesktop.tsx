import { AlertOctagon, Archive, Info } from 'lucide-react';
import { ManualSection } from '../../../../components/ui/manuales/ManualSection';

export const ManualConsecuenciasPropiedadDesktop: React.FC = () => {
  return (
    <div className="bg-slate-50 p-8 min-h-screen font-sans text-slate-800">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-10">
        <header className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-rose-50 rounded-2xl mb-4">
            <Archive className="w-10 h-10 text-rose-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">Registro Archivado</h1>
          <p className="text-lg text-slate-500">Conoce qué sucede cuando una propiedad se encuentra en este estado.</p>
        </header>

        <div className="space-y-6">
          <ManualSection title="Restricciones del Archivado" icon={<AlertOctagon className="w-6 h-6 text-rose-500" />}>
            <p className="mb-4 text-slate-700 text-sm">
              Cuando una propiedad pasa a estado "Archivado", entra en un modo de <strong>"solo lectura"</strong> para preservar su información histórica intacta.
            </p>
            
            <div className="bg-orange-50/50 p-5 rounded-xl border border-orange-200/50 mb-4">
              <h3 className="font-bold text-orange-900 mb-2 flex items-center gap-2"><Archive className="w-5 h-5 text-orange-600" /> Limpieza por Inactividad</h3>
              <p className="text-sm text-slate-700 mb-3">
                Para optimizar almacenamiento, si la propiedad supera su <strong>Límite de Inactividad y pasan 31 días adicionales sin registrar ninguna actividad</strong>, se limpiarán los recursos pesados. <strong>NO IMPORTA si está archivada o no</strong>; la limpieza depende estrictamente de la inactividad.
              </p>
              <ul className="space-y-2 text-sm text-slate-700">
                <li><strong className="text-orange-800">Galería Fotográfica:</strong> Se eliminarán las fotografías secundarias (se conserva la foto principal).</li>
                <li><strong className="text-orange-800">Ficha Técnica (PDF):</strong> Se eliminará el PDF pre-generado.</li>
              </ul>
            </div>

            <div className="bg-rose-50/50 p-5 rounded-xl border border-rose-100/50 mb-4">
              <h3 className="font-bold text-rose-900 mb-3 text-sm">Acciones deshabilitadas:</h3>
              <ul className="space-y-3 text-sm text-slate-700">
                <li><strong className="text-rose-800">Edición de datos:</strong> El botón para editar la información principal de la propiedad se oculta.</li>
                <li><strong className="text-rose-800">Exportación y Compartir:</strong> Desaparecen las opciones rápidas para generar el PDF y compartir por WhatsApp.</li>
                <li><strong className="text-rose-800">Gestión Multimedia (Galería):</strong> Se bloquea la opción de subir o administrar fotos, videos y recorridos.</li>
                <li><strong className="text-rose-800">Preguntas Frecuentes (FAQ):</strong> Queda inhabilitada la creación, edición, aprobación y eliminación de FAQs.</li>
                <li><strong className="text-rose-800">Historial de transacciones:</strong> Se deshabilita la función de añadir o editar notas en la línea de tiempo.</li>
                <li><strong className="text-rose-800">Cambio de estado:</strong> No podrás modificar el estado de la propiedad desde su ficha.</li>
              </ul>
            </div>

            <div className="bg-indigo-50 p-4 rounded-xl flex items-start gap-3 border border-indigo-100">
              <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <p className="text-sm text-indigo-900">
                <strong>Nota:</strong> Para recuperar cualquiera de estas funcionalidades y volver a ofrecer el inmueble, simplemente debes utilizar la opción de <strong>"Desarchivar"</strong>.
              </p>
            </div>
          </ManualSection>
        </div>
      </div>
    </div>
  );
};
