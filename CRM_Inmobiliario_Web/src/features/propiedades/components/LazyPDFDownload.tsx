import { useState, Suspense, lazy } from 'react';
import { Loader2, FileDown } from 'lucide-react';
import type { Propiedad } from '../types';
import type { PerfilAgente } from '../../auth/api/perfil';

// Cargamos el componente de PDF dinámicamente
const PDFLinkInternal = lazy(() => import('./PDFLinkInternal'));

interface LazyPDFDownloadProps {
  propiedad: Propiedad;
  perfil: PerfilAgente | undefined;
  principalBase64: string | null;
  mediaBase64Map: Record<string, string>;
}

export const LazyPDFDownload = (props: LazyPDFDownloadProps) => {
  const [show, setShow] = useState(false);

  // Solo cargamos el motor de PDF cuando el usuario pasa el mouse o hace click
  // para evitar penalizar la carga inicial de la ficha técnica
  return (
    <div 
      onMouseEnter={() => setShow(true)} 
      onClick={() => setShow(true)}
      className="inline-block"
    >
      {!show ? (
        <button 
          className="px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 cursor-pointer"
        >
          <FileDown className="h-3 w-3" />
          Ficha PDF
        </button>
      ) : (
        <Suspense fallback={
          <button disabled className="px-4 py-1.5 bg-indigo-600/50 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Cargando motor...
          </button>
        }>
          <PDFLinkInternal {...props} />
        </Suspense>
      )}
    </div>
  );
};
