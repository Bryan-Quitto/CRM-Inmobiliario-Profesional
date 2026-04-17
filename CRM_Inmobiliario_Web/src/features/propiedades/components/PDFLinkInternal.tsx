import { useState, useEffect } from 'react';
import { FileDown, Loader2, RefreshCw } from 'lucide-react';
import { api } from '@/lib/axios'; 
import type { Propiedad } from '../types';
import { toast } from 'sonner';

interface PDFLinkInternalProps {
  propiedad: Propiedad;
}

const PDFLinkInternal = ({ propiedad }: PDFLinkInternalProps) => {
  const [status, setStatus] = useState<'checking' | 'exists' | 'missing' | 'generating'>('checking');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const pdfUrl = `${supabaseUrl}/storage/v1/object/public/propiedades/ficha_${propiedad.id}.pdf`;

  // 1. Sincronización con el estado REAL del servidor
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const checkServerStatus = async () => {
      try {
        // Primero preguntamos a nuestra API si está en cola de generación
        const { data } = await api.get(`/propiedades/${propiedad.id}/pdf-status`);
        
        if (!isMounted) return;

        if (data.isGenerating) {
          setStatus('generating');
          timeoutId = setTimeout(checkServerStatus, 2000);
          return;
        }

        // Si la API dice que NO está generando, verificamos si el archivo existe en Supabase
        const response = await fetch(`${pdfUrl}?t=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
        
        if (!isMounted) return;

        if (response.ok) {
          if (status === 'generating') {
            toast.success('¡PDF generado con éxito!');
          }
          setStatus('exists');
          setIsDeleting(false); // Si existe, reseteamos el estado de borrado
        } else {
          setStatus('missing');
        }
      } catch {
        if (isMounted) {
          setStatus('missing');
        }
      }
    };

    checkServerStatus();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [pdfUrl, status, propiedad.id]);

  const handleGenerate = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setStatus('generating');
      await api.post(`/propiedades/${propiedad.id}/generar-pdf`);
      toast.info('Iniciando generación de ficha técnica...');
    } catch {
      toast.error('Error al solicitar la generación del PDF');
      setStatus('missing');
    }
  };

  const handleDownload = async () => {
    if (isDeleting) {
      toast.error('El archivo está siendo procesado para eliminación. Genera uno nuevo.');
      return;
    }

    try {
      const freshUrl = `${pdfUrl}?t=${Date.now()}`;
      const response = await fetch(freshUrl);
      if (!response.ok) throw new Error();

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

      // --- Lógica de borrado programado (30 segundos) ---
      setIsDeleting(true);
      await api.post(`/propiedades/${propiedad.id}/confirmar-descarga`);
      toast.warning('Descarga exitosa. El archivo se eliminará del servidor en 30 segundos por seguridad.', {
        duration: 5000
      });
      
      // Cambiamos estado localmente para evitar descargas dobles de un archivo que va a morir
      setTimeout(() => setStatus('missing'), 31000);

    } catch {
      toast.error('El PDF ya no está disponible. Por favor, genéralo de nuevo.');
      setStatus('missing');
    }
  };

  if (status === 'checking') {
    return (
      <div className="px-4 py-1.5 bg-slate-50 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-slate-100 shadow-sm">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verificando...
      </div>
    );
  }

  if (status === 'generating') {
    return (
      <div className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-indigo-100 animate-pulse shadow-sm cursor-wait">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generando...
      </div>
    );
  }

  if (status === 'missing') {
    return (
      <button 
        onClick={handleGenerate}
        className="px-4 py-1.5 bg-white border-2 border-indigo-100 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm flex items-center gap-2 active:scale-95 cursor-pointer"
      >
        <RefreshCw className="h-3.5 w-3.5" /> Generar Ficha
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 animate-in fade-in zoom-in duration-500">
      <button 
        onClick={handleDownload}
        disabled={isDeleting}
        className={`cursor-pointer ${`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 active:scale-95 ${isDeleting ? 'bg-slate-100 text-slate-400 shadow-none' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'}`}`}
        title={isDeleting ? "Archivo en proceso de eliminación" : "Descargar Ficha Técnica PDF"}
      >
        {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
        {isDeleting ? "Borrando..." : "Descargar PDF"}
      </button>
      
      <button
        onClick={handleGenerate}
        disabled={isDeleting}
        className="p-1.5 bg-white border border-slate-200 text-slate-400 rounded-full hover:text-indigo-600 hover:border-indigo-200 transition-all disabled:opacity-30 cursor-pointer"
        title="Regenerar PDF (Forzar actualización)"
      >
        <RefreshCw className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default PDFLinkInternal;