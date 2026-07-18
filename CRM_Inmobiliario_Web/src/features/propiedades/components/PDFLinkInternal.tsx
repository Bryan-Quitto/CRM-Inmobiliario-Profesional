import { useState, useEffect, useRef } from 'react';
import { FileDown, Loader2, RefreshCw, ChevronDown, Trash2 } from 'lucide-react';
import { api } from '@/lib/axios'; 
import type { Propiedad } from '../types';
import { toast } from 'sonner';
import { mutate as globalMutate } from 'swr';
import { usePendingOperationsStore } from '@/store/usePendingOperationsStore';

interface PDFLinkInternalProps {
  propiedad: Propiedad;
}

const PDFLinkInternal = ({ propiedad }: PDFLinkInternalProps) => {
  const isResponsable = true;

  const isCleaned = propiedad.bloqueoAdministrativo === true;

  const [status, setStatus] = useState<'checking' | 'exists' | 'missing' | 'generating' | 'deleting'>('checking');
  const [actualPdfUrl, setActualPdfUrl] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const actionLock = useRef(false);

  const addPendingOperation = usePendingOperationsStore(state => state.addPendingOperation);
  const removePendingOperation = usePendingOperationsStore(state => state.removePendingOperation);
  const isProcessing = status === 'generating' || status === 'deleting' || isDownloading;

  useEffect(() => {
    if (isProcessing) {
      addPendingOperation();
      return () => removePendingOperation();
    }
  }, [isProcessing, addPendingOperation, removePendingOperation]);

  // Sincronización con el estado REAL del servidor
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const checkServerStatus = async () => {
      if (actionLock.current) {
        timeoutId = setTimeout(checkServerStatus, 500);
        return;
      }

      try {
        const { data } = await api.get(`/propiedades/${propiedad.id}/pdf-status`);
        
        if (!isMounted) return;

        if (data.isGenerating) {
          setStatus('generating');
          timeoutId = setTimeout(checkServerStatus, 2000);
          return;
        }

        if (data.pdfUrl) {
          setActualPdfUrl(data.pdfUrl);
          
          if (data.exists) {
            if (status === 'generating') {
              toast.success('¡PDF generado con éxito!');
            }
            setStatus('exists');
            return;
          }
        }
        
        setStatus('missing');
      } catch {
        if (isMounted) {
          setStatus('missing');
        }
      }
    };

    // Darle tiempo al backend para registrar la tarea en la cola antes de hacer el primer chequeo
    if (status === 'generating' || status === 'deleting') {
      timeoutId = setTimeout(checkServerStatus, 1500);
    } else {
      checkServerStatus();
    }

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [status, propiedad]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGenerate = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (actionLock.current) return;
    
    if (isCleaned) {
      toast.error('Esta propiedad ha sido limpiada y ya no se puede generar el PDF. Contacte con administración.');
      return;
    }
    
    actionLock.current = true;
    setIsDropdownOpen(false);
    
    try {
      setStatus('generating');
      await api.post(`/propiedades/${propiedad.id}/generar-pdf`);
      toast.info('Iniciando generación de ficha técnica...');
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Error al solicitar la generación del PDF');
      setStatus('missing');
    } finally {
      actionLock.current = false;
    }
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (actionLock.current) return;
    
    actionLock.current = true;
    setIsDropdownOpen(false);
    
    try {
      setStatus('deleting');
      await api.delete(`/propiedades/${propiedad.id}/pdf`);
      globalMutate('/configuracion/perfil');
      toast.success('Ficha eliminada permanentemente.');
      setStatus('missing');
    } catch {
      toast.error('Error al eliminar la ficha PDF.');
      setStatus('exists');
    } finally {
      actionLock.current = false;
    }
  };

  const handleRegenerate = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (actionLock.current) return;
    
    if (isCleaned) {
      toast.error('Esta propiedad ha sido limpiada y ya no se puede regenerar el PDF. Contacte con administración.');
      return;
    }
    
    actionLock.current = true;
    setIsDropdownOpen(false);
    
    try {
      setStatus('generating');
      await api.delete(`/propiedades/${propiedad.id}/pdf`);
      await api.post(`/propiedades/${propiedad.id}/generar-pdf`);
      toast.info('Iniciando regeneración de ficha técnica...');
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Error al solicitar la regeneración del PDF');
      setStatus('missing');
    } finally {
      actionLock.current = false;
    }
  };

  const handleDownload = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (actionLock.current || isDownloading) return;
    
    actionLock.current = true;
    setIsDownloading(true);
    setDownloadProgress(0);
    
    try {
      if (!actualPdfUrl) throw new Error();

      const freshUrl = `${actualPdfUrl}?t=${Date.now()}`;
      const response = await fetch(freshUrl);
      if (!response.ok) throw new Error();

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      
      let blob: Blob;
      
      if (total > 0 && response.body) {
        const reader = response.body.getReader();
        const chunks = [];
        let received = 0;
        let lastPercent = 0;
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          
          const percent = Math.round((received / total) * 100);
          if (percent > lastPercent) {
            setDownloadProgress(percent);
            lastPercent = percent;
          }
        }
        blob = new Blob(chunks, { type: 'application/pdf' });
      } else {
        blob = await response.blob();
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const safeTitle = propiedad.titulo.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
      link.setAttribute('download', `Ficha_${safeTitle}.pdf`);
      
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Descarga exitosa.', {
        duration: 5000
      });

    } catch {
      toast.error('El PDF ya no está disponible. Por favor, genéralo de nuevo.');
      setStatus('missing');
    } finally {
      actionLock.current = false;
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  if (status === 'checking' || status === 'generating' || status === 'deleting') {
    return (
      <button 
        onClick={(e) => e.preventDefault()}
        className="px-4 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-500 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2 cursor-wait opacity-80"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> 
        {status === 'generating' ? 'Generando...' : status === 'deleting' ? 'Eliminando...' : 'Verificando...'}
      </button>
    );
  }

  if (status === 'missing') {
    if (!isResponsable || isCleaned) return null;
    
    return (
      <button 
        onClick={handleGenerate}
        className="px-3 py-1.5 bg-white border border-indigo-100 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
      >
        <RefreshCw className="h-3.5 w-3.5" /> Generar Ficha
      </button>
    );
  }

  return (
    <div className="relative flex items-center gap-1 animate-in fade-in zoom-in duration-500" ref={dropdownRef}>
      <div className={`flex bg-indigo-600 rounded-full shadow-sm shadow-indigo-200 overflow-hidden ${isResponsable ? 'divide-x divide-indigo-500/50' : ''}`}>
        <button 
          title="Descargar Ficha Técnica PDF"
          onClick={handleDownload}
          className={`px-3 py-1.5 text-white text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5 ${isDownloading ? 'opacity-80 cursor-wait bg-indigo-500' : 'cursor-pointer hover:bg-indigo-700 active:bg-indigo-800'}`}
        >
          {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
          {isDownloading ? (downloadProgress !== null && downloadProgress > 0 ? `Descargando ${downloadProgress}%` : 'Descargando...') : 'Descargar PDF'}
        </button>
        
        {isResponsable && (
          <button
            onClick={(e) => {
               if (e) e.stopPropagation();
               if (!isDownloading) setIsDropdownOpen(!isDropdownOpen);
            }}
            className={`px-1.5 text-white transition-colors flex items-center ${isDownloading ? 'opacity-80 cursor-wait bg-indigo-500' : 'cursor-pointer hover:bg-indigo-700 active:bg-indigo-800'}`}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isResponsable && isDropdownOpen && !isDownloading && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {!isCleaned && (
            <button
              onClick={handleRegenerate}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Volver a generar
            </button>
          )}
          <button
            onClick={handleDelete}
            className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
};

export default PDFLinkInternal;