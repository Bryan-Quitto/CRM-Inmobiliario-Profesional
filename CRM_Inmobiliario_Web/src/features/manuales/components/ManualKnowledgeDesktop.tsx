import { ManualSection, ManualAlert, ManualBadge } from '../../../components/ui/manuales';
import { BookOpen, FileQuestion, UploadCloud, MapPin, CheckCircle, Clock, RefreshCw, Power } from 'lucide-react';

export const ManualKnowledgeDesktop = () => {
  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-800">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Manual de Base de Conocimiento</h1>
          <p className="text-lg text-slate-600">Gestión de FAQs por propiedad y documentos de la empresa</p>
        </div>

        <ManualSection title="1. Gestión de Preguntas Frecuentes (FAQs)" icon={<FileQuestion className="w-6 h-6 text-teal-600" />}>
          <p className="text-slate-700 leading-relaxed mb-6">
            Las FAQs son exclusivas para cada propiedad. Su función es enseñar a la IA los detalles específicos del inmueble para responder a clientes.
          </p>
          
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Ciclo de vida y Moderación</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-slate-400" />
                <h4 className="font-semibold text-slate-900">1. Borradores</h4>
              </div>
              <p className="text-sm text-slate-600">Crea nuevas preguntas y guárdalas hasta que estén listas, o bórralas si no sirven.</p>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-2">
                <RefreshCw className="w-5 h-5 text-blue-500" />
                <h4 className="font-semibold text-slate-900">2. Revisión</h4>
              </div>
              <p className="text-sm text-slate-600">El agente responsable evalúa el contenido antes de que la IA pueda usarla.</p>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <h4 className="font-semibold text-slate-900">3. Aprobación o Rechazo</h4>
              </div>
              <p className="text-sm text-slate-600">El agente decide si aprueba la pregunta para la IA o pide correcciones.</p>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-2 mb-2">
                <Power className="w-5 h-5 text-amber-500" />
                <h4 className="font-semibold text-slate-900">4. Activación</h4>
              </div>
              <p className="text-sm text-slate-600">Puedes desactivar temporalmente una pregunta y reactivarla cuando sea oportuno.</p>
            </div>
          </div>
        </ManualSection>

        <ManualSection title="2. Documentos y Conocimiento de la Empresa" icon={<BookOpen className="w-6 h-6 text-indigo-600" />}>
           <div className="space-y-4">
             <div className="flex items-start bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <UploadCloud className="w-8 h-8 text-indigo-500 mr-4 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-slate-900 text-lg">Subida de Documentos</h4>
                  <p className="text-slate-600 mt-1">Puedes subir archivos con información de la empresa. El sistema los analizará para que el Asistente pueda usarlos.</p>
                </div>
             </div>
             <ManualAlert title="Procesamiento Automático" description="El sistema hace el trabajo pesado de analizar los documentos silenciosamente en segundo plano." />
           </div>
        </ManualSection>

        <ManualSection title="3. ¿Dónde encontrar estas herramientas?" icon={<MapPin className="w-6 h-6 text-rose-600" />}>
           <div className="grid md:grid-cols-2 gap-4">
             <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <ManualBadge>Preguntas por Propiedad</ManualBadge>
                <p className="text-sm text-slate-600 mt-3">Dentro de la pantalla de detalles de cada inmueble. ¡Todo a la mano!</p>
             </div>
             <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <ManualBadge>Conocimiento Empresa</ManualBadge>
                <p className="text-sm text-slate-600 mt-3">Panel de Configuración &gt; Inteligencia Artificial. Decide si es para uso interno, público o ciertas agencias.</p>
             </div>
           </div>
        </ManualSection>
      </div>
    </div>
  );
};
