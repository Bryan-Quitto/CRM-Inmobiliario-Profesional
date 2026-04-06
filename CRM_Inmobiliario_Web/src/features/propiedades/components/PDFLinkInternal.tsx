import { useState, useEffect } from 'react';
import { FileDown, Loader2, RefreshCw } from 'lucide-react';
import { api } from '@/lib/axios'; 
import type { Propiedad } from '../types';
import { toast } from 'sonner';

interface PDFLinkInternalProps {
  propiedad: Propiedad;
}

const PDFLinkInternal = ({ propiedad }: PDFLinkInternalProps) => {
  // 4 Estados posibles
  const [status, setStatus] = useState<'checking' | 'exists' | 'missing' | 'generating'>('checking');
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const pdfUrl = `${supabaseUrl}/storage/v1/object/public/propiedades/ficha_${propiedad.id}.pdf`;

  // 1. Al abrir la propiedad o al cambiar a generating, verificamos existencia
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const check = async () => {
      try {
        const response = await fetch(`${pdfUrl}?t=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
        
        if (isMounted) {
          if (response.ok) {
            setStatus('exists');
            if (status === 'generating') {
              toast.success('¡PDF actualizado con éxito!');
            }
          } else {
            if (status === 'generating') {
              // Si estamos generando, reintentamos el check en 2 segundos
              timeoutId = setTimeout(check, 2000);
            } else {
              setStatus('missing');
            }
          }
        }
      } catch {
        if (isMounted) {
          if (status === 'generating') {
            timeoutId = setTimeout(check, 2000);
          } else {
            setStatus('missing');
          }
        }
      }
    };

    if (status !== 'exists') {
      check();
    }

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [pdfUrl, status]);

  // 2. Función para avisarle a la API que inicie el worker
  const handleGenerate = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setStatus('generating');
      await api.post(`/propiedades/${propiedad.id}/generar-pdf`);
      toast.info('Generando ficha actualizada en el servidor...');
    } catch {
      toast.error('Error al solicitar la generación del PDF');
      setStatus('missing');
    }
  };

  const handleDownload = async () => {
    try {
      const freshUrl = `${pdfUrl}?t=${Date.now()}`;
      const response = await fetch(freshUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const safeTitle = propiedad.titulo.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
      link.setAttribute('download', `Ficha_${safeTitle}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      console.error('Error en la descarga');
      window.open(pdfUrl, '_blank');
    }
  };

  // --- RENDERIZADO SEGÚN EL ESTADO ---

  if (status === 'checking') {
    return (
      <div className="px-4 py-1.5 bg-slate-50 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-slate-100">
        <Loader2 className="h-3 w-3 animate-spin" /> Verificando...
      </div>
    );
  }

  if (status === 'generating') {
    return (
      <div className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-indigo-100 animate-pulse cursor-wait">
        <Loader2 className="h-3 w-3 animate-spin" /> Actualizando...
      </div>
    );
  }

  if (status === 'missing') {
    return (
      <button 
        onClick={() => handleGenerate()}
        className="px-4 py-1.5 bg-white border-2 border-indigo-100 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
      >
        <RefreshCw className="h-3 w-3" /> Generar Ficha
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button 
        onClick={handleDownload}
        className="px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 cursor-pointer animate-in fade-in zoom-in duration-300"
        title="Descargar Ficha Técnica PDF"
      >
        <FileDown className="h-3 w-3" /> Descargar PDF
      </button>
      
      <button
        onClick={handleGenerate}
        className="p-1.5 bg-white border border-slate-200 text-slate-400 rounded-full hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer"
        title="Regenerar PDF (Forzar actualización)"
      >
        <RefreshCw className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default PDFLinkInternal;