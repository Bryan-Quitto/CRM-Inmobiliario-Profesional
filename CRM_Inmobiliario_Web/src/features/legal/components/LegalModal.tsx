import { X } from 'lucide-react';
import { ContenidoLegal } from './ContenidoLegal';
import { useEffect, useState } from 'react';

import politicaEs from '../assets/politica_privacidad.md?raw';
import politicaEn from '../assets/politica_privacidad_en.md?raw';
import terminosEs from '../assets/terminos_servicio.md?raw';
import terminosEn from '../assets/terminos_servicio_en.md?raw';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  type: 'privacidad' | 'terminos' | null;
}

export const LegalModal = ({ isOpen, onClose, type }: Props) => {
  const [lang, setLang] = useState<'es' | 'en'>('es');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !type) return null;

  const content = type === 'privacidad' 
    ? (lang === 'es' ? politicaEs : politicaEn)
    : (lang === 'es' ? terminosEs : terminosEn);

  const titleEs = type === 'privacidad' ? 'Política de Privacidad' : 'Términos de Servicio';
  const titleEn = type === 'privacidad' ? 'Privacy Policy' : 'Terms of Service';
  const title = lang === 'es' ? titleEs : titleEn;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[calc(100dvh-2rem)] md:max-h-[85dvh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 bg-white z-10 gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">{title}</h2>
            <div className="flex items-center bg-slate-100 p-1 rounded-lg shrink-0">
              <button
                onClick={() => setLang('es')}
                className={`cursor-pointer px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  lang === 'es' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                ES
              </button>
              <button
                onClick={() => setLang('en')}
                className={`cursor-pointer px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  lang === 'en' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                EN
              </button>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 bg-white relative">
          <ContenidoLegal content={content} />
        </div>
        
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end z-10">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium text-sm cursor-pointer shadow-sm"
          >
            {lang === 'es' ? 'Cerrar' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
