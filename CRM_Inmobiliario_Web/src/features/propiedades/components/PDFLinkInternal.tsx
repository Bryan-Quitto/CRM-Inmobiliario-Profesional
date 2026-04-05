import { PDFDownloadLink } from '@react-pdf/renderer';
import { PropiedadFichaPDF } from './PropiedadFichaPDF';
import { Loader2, FileDown } from 'lucide-react';
import type { Propiedad } from '../types';
import type { PerfilAgente } from '../../auth/api/perfil';

interface PDFLinkInternalProps {
  propiedad: Propiedad;
  perfil: PerfilAgente | undefined;
  principalBase64: string | null;
  mediaBase64Map: Record<string, string>;
}

const PDFLinkInternal = ({ propiedad, perfil, principalBase64, mediaBase64Map }: PDFLinkInternalProps) => {
  return (
    <PDFDownloadLink 
      document={<PropiedadFichaPDF 
        propiedad={propiedad} 
        perfil={perfil} 
        principalBase64={principalBase64} 
        mediaBase64Map={mediaBase64Map}
      />} 
      fileName={`Ficha_${propiedad.titulo.replace(/\s+/g, '_')}.pdf`}
    >
      {({ loading }) => (
        <button 
          disabled={loading}
          className="px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileDown className="h-3 w-3" />}
          {loading ? 'Preparando...' : 'Descargar PDF'}
        </button>
      )}
    </PDFDownloadLink>
  );
};

export default PDFLinkInternal;
