import { ManualSection, ManualAlert, ManualBadge } from '../../../components/ui/manuales';
import { BookOpen, FileQuestion, UploadCloud, MapPin, CheckCircle, Clock, RefreshCw } from 'lucide-react';

export const ManualKnowledgeMobile = () => {
  return (
    <div className="p-4 bg-slate-50 min-h-screen font-sans text-slate-800 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Base de Conocimiento</h1>
        <p className="text-sm text-slate-600">Gestión de FAQs y documentos</p>
      </div>

      <ManualSection title="1. FAQs por Propiedad" icon={<FileQuestion className="w-5 h-5 text-teal-600" />}>
        <p className="text-sm text-slate-700 mb-4">
          Detalles específicos del inmueble para enseñar a la IA.
        </p>
        
        <div className="space-y-3">
          <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 flex items-start space-x-3">
            <Clock className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">Borradores</h4>
              <p className="text-xs text-slate-600 mt-1">Guarda o elimina preguntas.</p>
            </div>
          </div>
          
          <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 flex items-start space-x-3">
            <RefreshCw className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">Revisión</h4>
              <p className="text-xs text-slate-600 mt-1">Evaluación por el agente responsable.</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-slate-900 text-sm">Aprobación</h4>
              <p className="text-xs text-slate-600 mt-1">Activa las FAQs para la IA.</p>
            </div>
          </div>
        </div>
      </ManualSection>

      <ManualSection title="2. Documentos" icon={<BookOpen className="w-5 h-5 text-indigo-600" />}>
         <div className="space-y-3">
           <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex items-center space-x-3">
              <UploadCloud className="w-6 h-6 text-indigo-500 flex-shrink-0" />
              <p className="text-xs text-slate-600">Sube archivos para que la IA los analice y use.</p>
           </div>
           <ManualAlert title="Proceso en 2do plano" description="Análisis silencioso automático." />
         </div>
      </ManualSection>

      <ManualSection title="3. Ubicación" icon={<MapPin className="w-5 h-5 text-rose-600" />}>
         <div className="flex flex-col space-y-3">
           <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
              <ManualBadge>FAQs: Propiedades</ManualBadge>
              <p className="text-xs text-slate-600 mt-2">Detalles de cada inmueble.</p>
           </div>
           <div className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
              <ManualBadge>Documentos: Configuración</ManualBadge>
              <p className="text-xs text-slate-600 mt-2">Panel IA &gt; Base de conocimiento.</p>
           </div>
         </div>
      </ManualSection>
    </div>
  );
};
