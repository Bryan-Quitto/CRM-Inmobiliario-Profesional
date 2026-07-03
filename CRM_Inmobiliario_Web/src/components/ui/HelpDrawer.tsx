import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useHelpDrawerStore } from '../../store/useHelpDrawerStore';

import { ManualBusqueda } from '../../features/manuales/components/ManualBusqueda';
import { ManualAnalitica } from '../../features/manuales/components/ManualAnalitica';
import { ManualDashboard } from '../../features/manuales/components/ManualDashboard';
import { ManualProductividad } from '../../features/manuales/components/ManualProductividad';
import { ManualComunicaciones } from '../../features/manuales/components/ManualComunicaciones';
import { ManualKnowledge } from '../../features/manuales/components/ManualKnowledge';
import { ManualAdministracion } from '../../features/manuales/components/ManualAdministracion';
import { ManualPropiedades } from '../../features/manuales/components/ManualPropiedades';
import { ManualContactos } from '../../features/manuales/components/ManualContactos';
import { ManualIA } from '../../features/manuales/components/ManualIA';
import { ManualSistemaIARegistros } from '../../features/manuales/components/ManualSistemaIARegistros';
import { ManualNotificaciones } from '../../features/manuales/components/ManualNotificaciones';

const componentMap: Record<string, React.ReactNode> = {
  '/docs/manuales/manual_busqueda.md': <ManualBusqueda />,
  '/docs/manuales/manual_analitica.md': <ManualAnalitica />,
  '/docs/manuales/manual_dashboard.md': <ManualDashboard />,
  '/docs/manuales/manual_productividad.md': <ManualProductividad />,
  '/docs/manuales/manual_notificaciones.md': <ManualNotificaciones />,
  '/docs/manuales/manual_knowledge.md': <ManualKnowledge />,
  '/docs/manuales/manual_administracion.md': <ManualAdministracion />,
  '/docs/manuales/manual_propiedades.md': <ManualPropiedades />,
  '/docs/manuales/manual_contactos.md': <ManualContactos />,
  '/docs/manuales/manual_ia.md': <ManualIA section="all" />,
  '/docs/manuales/manual_ia.md#personal': <ManualIA section="personal" />,
  '/docs/manuales/manual_ia.md#whatsapp': <ManualIA section="whatsapp" />,
  '/docs/manuales/manual_ia.md#facebook': <ManualIA section="facebook" />,
  '/docs/manuales/manual_sistema-ia_registros.md': <ManualSistemaIARegistros section="all" />,
  '/docs/manuales/manual_sistema-ia_registros.md#whatsapp': <ManualSistemaIARegistros section="whatsapp" />,
  '/docs/manuales/manual_sistema-ia_registros.md#facebook': <ManualSistemaIARegistros section="facebook" />,
  '/docs/manuales/manual_sistema-ia_registros.md#personal': <ManualSistemaIARegistros section="personal" />,
  '/docs/manuales/manual_sistema-ia_registros.md#general': <ManualSistemaIARegistros section="general" />
};

export const HelpDrawer = () => {
  const { isOpen, title, markdownPath, customContent, closeHelp } = useHelpDrawerStore();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Solo carga por fetch si no está en el mapa de componentes de React (fallback)
    if (isOpen && !customContent && markdownPath && !componentMap[markdownPath]) {
      let active = true;
      
      // Hacemos el setLoading asíncrono para evitar advertencias de renderizado en cascada
      Promise.resolve().then(() => {
        if (active) setLoading(true);
      });
      
      fetch(markdownPath)
        .then(res => res.text())
        .then(text => {
          if (active) setContent(text);
        })
        .catch(err => {
          if (active) setContent(`Error al cargar el manual: ${err}`);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
        
      return () => { active = false; };
    }
  }, [isOpen, markdownPath, customContent]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-y-0 right-0 w-full md:w-[650px] lg:w-[750px] bg-white shadow-2xl border-l border-slate-200 z-[9999] flex flex-col transform transition-transform duration-300 translate-x-0">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">💡</span> {title}
          </h2>
          <button 
            onClick={closeHelp}
            className="p-2 hover:bg-slate-200 rounded-full text-slate-500 cursor-pointer transition-colors"
            title="Cerrar panel de ayuda"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto bg-slate-50">
          {customContent ? (
             <div className="p-6 prose prose-slate prose-indigo max-w-none prose-headings:font-semibold prose-a:text-indigo-600 prose-blockquote:border-l-indigo-500 prose-blockquote:bg-indigo-50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic prose-blockquote:text-slate-700">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{customContent}</ReactMarkdown>
             </div>
          ) : markdownPath && componentMap[markdownPath] ? (
             <div className="w-full h-full">
               {componentMap[markdownPath]}
             </div>
          ) : loading ? (
             <div className="p-6 flex flex-col items-center justify-center h-40 text-slate-400">
               <Loader2 className="animate-spin mb-2" size={32} />
               <p>Cargando información...</p>
             </div>
          ) : (
             <div className="p-6 prose prose-slate prose-indigo max-w-none prose-headings:font-semibold prose-a:text-indigo-600 prose-blockquote:border-l-indigo-500 prose-blockquote:bg-indigo-50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic prose-blockquote:text-slate-700">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
             </div>
          )}
        </div>
      </div>
    </>
  );
};
