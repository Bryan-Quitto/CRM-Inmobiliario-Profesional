import React from 'react';
import { Database, UploadCloud, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ManualSection } from '../../../components/ui/manuales/ManualSection';

export const ManualUsoPlataforma: React.FC = () => {
  return (
    <div className="bg-slate-50 p-4 md:p-8 min-h-screen font-sans text-slate-800">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-10">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-2xl mb-4">
            <Database className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Uso de Plataforma y Cuotas</h1>
          <p className="text-base md:text-lg text-slate-500">
            Aquí te explicamos cómo medimos y gestionamos tus cuotas de uso (Operaciones y Almacenamiento) para que le saques el mayor provecho a tu CRM.
          </p>
        </header>

        <div className="space-y-8">
          <ManualSection title="1. Operaciones" icon={<UploadCloud className="w-6 h-6 text-indigo-500" />}>
            <p className="mb-4 text-slate-600">
              Mide la cantidad de subidas (uploads) que realizas en la plataforma.
            </p>
            <ul className="space-y-4">
              <li className="bg-indigo-50/50 p-4 md:p-5 rounded-xl border border-indigo-100/50">
                <h4 className="font-bold text-indigo-900 mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> ¿Qué cuenta como operación?
                </h4>
                <p className="text-sm text-slate-700 text-justify">
                  Cualquier archivo nuevo que subas a la nube de tu CRM. Esto incluye fotos de propiedades, PDFs de documentos, el logo de tu agencia, foto de perfil, y audios procesados. 
                </p>
              </li>
              <li className="bg-indigo-50/50 p-4 md:p-5 rounded-xl border border-indigo-100/50">
                <h4 className="font-bold text-indigo-900 mb-1 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" /> ¿Qué NO cuenta como operación?
                </h4>
                <p className="text-sm text-slate-700 text-justify">
                  Borrar un archivo, visualizar una imagen, o leer documentos no consume operaciones de subida. Solo las cargas de información nueva consumen la cuota de operaciones.
                </p>
              </li>
            </ul>
          </ManualSection>

          <ManualSection title="2. Almacenamiento" icon={<Database className="w-6 h-6 text-indigo-500" />}>
            <p className="mb-4 text-slate-600">
              Mide el peso total (en Megabytes o Gigabytes) de todos los archivos que tienes alojados en el mes activo.
            </p>
            <div className="bg-slate-50 p-4 md:p-5 rounded-xl border border-slate-200">
              <p className="text-sm text-slate-700 text-justify leading-relaxed">
                Todas las imágenes que subes son <strong>comprimidas y optimizadas automáticamente</strong> al moderno formato WebP antes de ser guardadas. Esto significa que una foto de 5 MB de tu celular puede reducirse a unos 200 KB sin perder calidad visual. Gracias a esto, tu límite de almacenamiento rinde muchísimo más, permitiéndote subir miles de fotos al mes sin problemas.
              </p>
            </div>
          </ManualSection>

          <ManualSection title="3. Ciclo de Facturación" icon={<AlertCircle className="w-6 h-6 text-indigo-500" />}>
            <div className="bg-blue-50/50 p-4 md:p-5 rounded-xl border border-blue-100/50">
              <p className="text-sm text-slate-700 text-justify mb-3">
                <strong>Reinicio Automático:</strong> Tanto las Operaciones como el Almacenamiento se reinician automáticamente al inicio de tu próximo mes de corte. En tu panel siempre podrás visualizar cuántos días faltan para este reinicio.
              </p>
              <p className="text-sm text-slate-700 text-justify">
                Si has alcanzado tu límite y necesitas continuar trabajando con normalidad antes del fin de mes, o si necesitas un plan de almacenamiento mayor, por favor contáctanos de urgencia.
              </p>
            </div>
          </ManualSection>
        </div>

        <div className="mt-12 text-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
          <p className="text-sm font-medium text-slate-500 mb-2">¿Tienes una urgencia o necesitas más capacidad?</p>
          <a href="mailto:soporte@luminacrminmobiliario.com" className="text-lg font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
            soporte@luminacrminmobiliario.com
          </a>
        </div>
      </div>
    </div>
  );
};
