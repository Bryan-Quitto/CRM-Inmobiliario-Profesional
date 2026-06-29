import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useHelpDrawerStore } from '../../store/useHelpDrawerStore';

export const HelpDrawer = () => {
  const { isOpen, title, markdownPath, customContent, closeHelp } = useHelpDrawerStore();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !customContent && markdownPath) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true);
      fetch(markdownPath)
        .then(res => res.text())
        .then(text => setContent(text))
        .catch(err => setContent(`Error al cargar el manual: ${err}`))
        .finally(() => setLoading(false));
    }
  }, [isOpen, markdownPath, customContent]);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9998] transition-opacity"
        onClick={closeHelp}
      />
      <div className="fixed inset-y-0 right-0 w-full md:w-[450px] lg:w-[500px] bg-white shadow-2xl z-[9999] flex flex-col transform transition-transform duration-300 translate-x-0">
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
        <div className="p-6 overflow-y-auto flex-1 prose prose-slate prose-indigo max-w-none prose-headings:font-semibold prose-a:text-indigo-600 prose-blockquote:border-l-indigo-500 prose-blockquote:bg-indigo-50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic prose-blockquote:text-slate-700">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p>Cargando información...</p>
            </div>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {customContent || content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </>
  );
};
