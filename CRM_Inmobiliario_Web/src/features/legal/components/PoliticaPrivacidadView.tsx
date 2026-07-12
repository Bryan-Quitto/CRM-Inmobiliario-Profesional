import { useState } from 'react';
import { ContenidoLegal } from './ContenidoLegal';
import politicaEs from '../assets/politica_privacidad.md?raw';
import politicaEn from '../assets/politica_privacidad_en.md?raw';
import { Shield } from 'lucide-react';

export const PoliticaPrivacidadView = () => {
  const [lang, setLang] = useState<'es' | 'en'>('es');
  
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Ziel Luxora CRM</h1>
        </div>
        
        <div className="flex items-center bg-white border border-slate-200 p-1 rounded-lg shadow-sm">
          <button
            onClick={() => setLang('es')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              lang === 'es' 
                ? 'bg-slate-900 text-white shadow' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            Español
          </button>
          <button
            onClick={() => setLang('en')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              lang === 'en' 
                ? 'bg-slate-900 text-white shadow' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            English
          </button>
        </div>
      </div>
      <div className="max-w-4xl mx-auto bg-white shadow-sm ring-1 ring-slate-900/5 rounded-2xl p-6 md:p-10 lg:p-12">
        <ContenidoLegal content={lang === 'es' ? politicaEs : politicaEn} />
      </div>
    </div>
  );
};

