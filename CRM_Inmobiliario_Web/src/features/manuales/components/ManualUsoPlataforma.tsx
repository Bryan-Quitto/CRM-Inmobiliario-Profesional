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

          <ManualSection title="2. Almacenamiento (Global y Mensual)" icon={<Database className="w-6 h-6 text-indigo-500" />}>
            <p className="mb-4 text-slate-600">
              El sistema utiliza dos medidores diferentes para garantizar un uso justo del espacio en la nube:
            </p>
            <ul className="list-disc pl-5 text-sm text-slate-700 mb-4 space-y-2">
              <li><strong>Almacenamiento Global:</strong> Es el peso total histórico de todos tus archivos acumulados en el sistema. Nunca se reinicia a cero, solo baja cuando eliminas archivos antiguos o propiedades.</li>
              <li><strong>Subida Mensual (Ingesta):</strong> Es el límite de Gigabytes nuevos que se te permite subir específicamente durante tu mes de facturación en curso.</li>
            </ul>
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 md:p-5 rounded-xl border border-slate-200">
                <p className="text-sm text-slate-700 text-justify leading-relaxed">
                  Todas las imágenes que subes son <strong>comprimidas y optimizadas automáticamente</strong> al moderno formato WebP antes de ser guardadas. Esto significa que una foto de 5 MB de tu celular puede reducirse a unos 200 KB sin perder calidad visual. Gracias a esto, tu límite de almacenamiento rinde muchísimo más, permitiéndote subir miles de fotos al mes sin problemas.
                </p>
              </div>
              <div className="bg-indigo-50/50 p-4 md:p-5 rounded-xl border border-indigo-100/50">
                <h4 className="font-bold text-indigo-900 mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Liberación de Cuota Automática
                </h4>
                <p className="text-sm text-slate-700 text-justify">
                  El sistema optimiza tu espacio de forma automática. Cuando reemplazas un archivo, el sistema <strong>elimina el archivo anterior y te devuelve el espacio</strong> ocupado. <br/><br/>
                  <strong>Nota sobre las Fichas Comerciales PDF:</strong> Al editar la información de una propiedad, el PDF anterior deja de estar visible para garantizar que siempre compartas datos actualizados. Si generas la nueva ficha en ese momento, el PDF anterior se sobrescribe y el espacio se recupera al instante. Caso contrario, nuestro sistema de mantenimiento automático identificará y eliminará definitivamente los PDFs obsoletos cada día a las 03:00 AM del horario de Ecuador, devolviéndote el espacio a tu cuota sin que tengas que realizar ninguna acción manual.
                </p>
              </div>
            </div>
          </ManualSection>

          <ManualSection title="3. Historial y Auditoría" icon={<AlertCircle className="w-6 h-6 text-indigo-500" />}>
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 md:p-5 rounded-xl border border-slate-200">
                <p className="text-sm text-slate-700 text-justify leading-relaxed mb-3">
                  Para garantizar total transparencia en el uso de tu plataforma, cuentas con dos vistas detalladas para tu <strong>Historial de Almacenamiento</strong>:
                </p>
                <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2">
                  <li><strong>Historial Global:</strong> Accesible desde la barra lateral. Muestra <em>todos</em> los archivos que has subido a la plataforma a lo largo del tiempo, permitiéndote buscar, filtrar, ordenar (por fecha o tamaño) y eliminar registros antiguos masivamente para liberar espacio.</li>
                  <li><strong>Historial Mensual:</strong> Accesible dando clic en el icono del ojo junto a tus estadísticas de uso. Muestra específicamente los archivos que has subido durante tu mes de facturación actual, ayudándote a auditar tu cuota del mes.</li>
                </ul>
              </div>

              <div className="bg-indigo-50/50 p-4 md:p-5 rounded-xl border border-indigo-100/50">
                <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Nomenclatura Dinámica Inteligente
                </h4>
                <p className="text-sm text-slate-700 text-justify mb-3">
                  Ya no tienes que preocuparte por cómo se llamaban tus archivos originales. El sistema genera <strong>nombres amigables y dinámicos</strong> de forma automática para cada registro, basándose en su origen y contexto:
                </p>
                <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2">
                  <li><strong>Trazabilidad:</strong> Si subes una foto a una propiedad, el sistema la nombra combinando el título de la propiedad con la sección (Ej. <em>"Casa en la Playa - Galería General.webp"</em>).</li>
                  <li><strong>Numeración Única:</strong> Si subes múltiples archivos al mismo lugar (como una galería), el sistema les asigna automáticamente un número consecutivo para que cada archivo sea fácil de identificar (Ej. <em>"Casa en la Playa - Galería General 1.webp"</em>, <em>"... 2.webp"</em>, etc.).</li>
                  <li><strong>Audios y Perfiles:</strong> Los audios de WhatsApp incluyen el nombre del contacto y la hora de recepción, mientras que las fotos de perfil o logotipos reciben su nombre correspondiente.</li>
                </ul>
              </div>
            </div>
          </ManualSection>

          <ManualSection title="4. Ciclo de Facturación" icon={<AlertCircle className="w-6 h-6 text-indigo-500" />}>
            <div className="bg-blue-50/50 p-4 md:p-5 rounded-xl border border-blue-100/50">
              <p className="text-sm text-slate-700 text-justify mb-3">
                <strong>Reinicio Automático:</strong> Tanto las Operaciones como tu límite de Subida Mensual (ingesta) se reinician automáticamente a cero al inicio de tu próximo mes de corte. En tu panel siempre podrás visualizar cuántos días faltan para este reinicio. El Almacenamiento Global no se reinicia, ya que es tu disco duro acumulativo.
              </p>
              <p className="text-sm text-slate-700 text-justify">
                Si has alcanzado tu límite y necesitas continuar trabajando con normalidad antes del fin de mes, o si necesitas un plan de almacenamiento mayor, por favor contáctanos de urgencia.
              </p>
            </div>
          </ManualSection>
        </div>

        <div className="mt-12 text-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
          <p className="text-sm font-medium text-slate-500 mb-2">¿Tienes una urgencia o necesitas más capacidad?</p>
          <a href="mailto:soporte@zielluxoracrm.com" className="text-lg font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
            soporte@zielluxoracrm.com
          </a>
        </div>
      </div>
    </div>
  );
};
