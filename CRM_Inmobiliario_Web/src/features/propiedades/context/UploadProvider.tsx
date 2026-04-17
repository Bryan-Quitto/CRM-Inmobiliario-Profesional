import React, { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { isAxiosError } from 'axios';
import { uploadImagenPropiedad } from '../api/uploadImagenPropiedad';
import { UploadContext } from './UploadContext';
import type { UploadContextType } from './UploadContext';

interface UploadProcess {
  id: string; 
  propiedadId: string;
  sectionId?: string | null;
  nombrePropiedad: string;
  progreso: number;
  estado: 'loading' | 'completed' | 'error';
  totalFiles: number;
  completedFiles: number;
  dismissed?: boolean;
}

interface UploadStatus {
  id: string;
  propiedadId: string;
  sectionId?: string | null;
  fileName: string;
  progress: number;
  status: 'pending' | 'compressing' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface UploadResult {
  id: string;
  propiedadId: string;
  sectionId?: string | null;
  tipoMultimedia: string;
  urlPublica: string;
  descripcion?: string | null;
  esPrincipal: boolean;
  orden: number;
}

export const UploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const [activeUploads, setActiveUploads] = useState<Record<string, UploadProcess>>({});
  
  // Colas internas para manejar subidas secuenciales por sección
  const queuesRef = useRef<Record<string, File[]>>({});
  const processingRef = useRef<Record<string, boolean>>({});

  const isUploading = useCallback((propiedadId: string, sectionId?: string | null) => {
    if (sectionId !== undefined) {
      const processId = `${propiedadId}_${sectionId || 'general'}`;
      return !!activeUploads[processId] && activeUploads[processId].estado === 'loading';
    }
    return Object.values(activeUploads).some(u => u.propiedadId === propiedadId && u.estado === 'loading');
  }, [activeUploads]);

  // Ref para mantener callbacks de eventos frescos sin disparar re-renders de la cola
  const callbacksRef = useRef<Record<string, (result: UploadResult) => void>>({});

  // Prevención de cierre de pestaña/recarga si hay subidas activas (sin importar si el toast fue cerrado)
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasActiveUploads = Object.values(activeUploads).some(u => u.estado === 'loading');
      if (hasActiveUploads) {
        e.preventDefault();
        e.returnValue = ''; 
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeUploads]);

  const processQueue = useCallback(async (processId: string, propiedadId: string, nombrePropiedad: string, sectionId?: string | null) => {
    if (processingRef.current[processId]) return;
    processingRef.current[processId] = true;

    while (queuesRef.current[processId] && queuesRef.current[processId].length > 0) {
      const file = queuesRef.current[processId].shift()!;
      const currentUploadId = crypto.randomUUID();

      // Añadir a la lista de estados individuales
      const newUploadStatus: UploadStatus = {
        id: currentUploadId,
        propiedadId,
        sectionId,
        fileName: file.name,
        progress: 0,
        status: 'pending'
      };
      setUploads(prev => [...prev, newUploadStatus]);

      let errorMsg: string | undefined;
      try {
        setUploads(prev => prev.map(u => u.id === currentUploadId ? { ...u, status: 'compressing' } : u));
        
        const options = {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          fileType: 'image/webp'
        };

        const compressedBlob = await imageCompression(file, options);
        const fileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
        const finalFile = new File([compressedBlob], fileName, {
          type: 'image/webp',
          lastModified: Date.now(),
        });

        setUploads(prev => prev.map(u => u.id === currentUploadId ? { ...u, status: 'uploading' } : u));
        
        const result = await uploadImagenPropiedad(propiedadId, finalFile, sectionId);
        
        setUploads(prev => prev.map(u => u.id === currentUploadId ? { ...u, status: 'completed', progress: 100 } : u));
        
        const onImageUploaded = callbacksRef.current[processId];
        if (onImageUploaded) {
          onImageUploaded({
            id: result.id,
            propiedadId,
            sectionId: result.sectionId,
            tipoMultimedia: 'Imagen',
            urlPublica: result.urlPublica,
            descripcion: result.descripcion,
            esPrincipal: result.esPrincipal,
            orden: result.orden
          });
        }
      } catch (err: unknown) {
        console.error(`Error subiendo ${file.name}:`, err);
        errorMsg = 'Error en la subida';
        if (isAxiosError(err)) {
          errorMsg = err.response?.data?.detail || err.message;
        }
        setUploads(prev => prev.map(u => u.id === currentUploadId ? { 
          ...u, 
          status: 'error', 
          error: errorMsg
        } : u));
      } finally {
        // Actualizar progreso global del proceso preservando el flag 'dismissed'
        setActiveUploads(prev => {
          const current = prev[processId];
          if (!current) return prev;
          const newCompleted = current.completedFiles + 1;
          const isFinished = newCompleted >= current.totalFiles;
          
          return {
            ...prev,
            [processId]: {
              ...current,
              completedFiles: newCompleted,
              progreso: Math.round((newCompleted / current.totalFiles) * 100),
              estado: isFinished ? (errorMsg && newCompleted === 1 ? 'error' : 'completed') : 'loading'
            }
          };
        });

        // Limpiar de la lista individual después de un momento
        setTimeout(() => {
          setUploads(prev => prev.filter(u => u.id !== currentUploadId));
        }, 5000);
      }
    }

    processingRef.current[processId] = false;

    // Prevenimos notificaciones duplicadas en React StrictMode con un ID único
    const toastId = `upload-toast-${processId}-${crypto.randomUUID()}`;

    // Notificación final si todo el lote terminó
    setActiveUploads(prev => {
      const finalProcess = prev[processId];
      if (finalProcess && finalProcess.estado !== 'loading') {
        if (finalProcess.estado === 'completed') {
          toast.success(`Carga completa en "${nombrePropiedad}"`, { id: toastId });
        } else {
          toast.error(`Error al subir imágenes en "${nombrePropiedad}"`, { id: toastId });
        }

        // Limpiar el proceso activo después de un tiempo si no hay una nueva subida iniciada
        setTimeout(() => {
          setActiveUploads(last => {
            const newState = { ...last };
            if (newState[processId] && newState[processId].estado !== 'loading') {
              delete newState[processId];
            }
            return newState;
          });
        }, 8000);
      }
      return prev;
    });
  }, []);

  const uploadFiles = useCallback(async (
    propiedadId: string, 
    nombrePropiedad: string, 
    files: File[], 
    onImageUploaded?: (result: UploadResult) => void,
    sectionId?: string | null
  ) => {
    const filesArray = Array.from(files);
    if (filesArray.length === 0) return;

    const processId = `${propiedadId}_${sectionId || 'general'}`;
    
    // Guardar callback en ref para que processQueue sea estable
    if (onImageUploaded) {
      callbacksRef.current[processId] = onImageUploaded;
    }

    // 1. Añadir archivos a la cola persistente
    if (!queuesRef.current[processId]) queuesRef.current[processId] = [];
    queuesRef.current[processId].push(...filesArray);

    // 2. Inicializar o actualizar el proceso activo (reseteamos dismissed si se añaden más)
    setActiveUploads(prev => {
      const existing = prev[processId];
      const isCurrentlyLoading = existing && existing.estado === 'loading';
      
      return {
        ...prev,
        [processId]: {
          id: processId,
          propiedadId,
          sectionId,
          nombrePropiedad,
          progreso: isCurrentlyLoading ? existing.progreso : 0,
          estado: 'loading',
          totalFiles: (isCurrentlyLoading ? existing.totalFiles : 0) + filesArray.length,
          completedFiles: isCurrentlyLoading ? existing.completedFiles : 0,
          dismissed: false
        }
      };
    });

    // 3. Disparar el procesamiento de la cola
    processQueue(processId, propiedadId, nombrePropiedad, sectionId);
  }, [processQueue]);

  const value: UploadContextType = {
    uploads,
    activeUploads,
    uploadFiles,
    isUploading
  };

  return (
    <UploadContext.Provider value={value}>
      {children}
      
      {/* Stack de Notificaciones Visuales */}
      <div className="fixed top-4 right-4 z-[300] flex flex-col gap-3 pointer-events-none">
        {Object.values(activeUploads)
          .filter(u => !u.dismissed) // Solo mostrar si no ha sido descartado
          .map((upload) => (
          <div 
            key={upload.id}
            className="w-80 bg-white/95 backdrop-blur-md border border-slate-100 shadow-2xl rounded-2xl p-4 animate-in slide-in-from-right-8 duration-500 pointer-events-auto relative group"
          >
            {/* Botón de cierre manual (X) - Solo oculta, no detiene el proceso */}
            <button 
              onClick={() => {
                setActiveUploads(prev => ({
                  ...prev,
                  [upload.id]: { ...prev[upload.id], dismissed: true }
                }));
              }}
              className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  upload.estado === 'loading' ? 'bg-blue-50 text-blue-600' : 
                  upload.estado === 'completed' ? 'bg-emerald-50 text-emerald-600' : 
                  'bg-rose-50 text-rose-600'
                }`}>
                  {upload.estado === 'loading' ? (
                    <div className="relative">
                      <div className="h-5 w-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                    </div>
                  ) : upload.estado === 'completed' ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <X className="h-5 w-5" />
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Subiendo Imágenes</p>
                  <p className="text-sm font-black text-slate-900 truncate tracking-tight pr-4">{upload.nombrePropiedad}</p>
                </div>
              </div>
              <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-md uppercase tracking-widest">
                {upload.completedFiles}/{upload.totalFiles}
              </span>
            </div>

            <div className="space-y-2">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ease-out ${
                    upload.estado === 'loading' ? 'bg-blue-600' : 
                    upload.estado === 'completed' ? 'bg-emerald-500' : 
                    'bg-rose-500'
                  }`}
                  style={{ width: `${upload.progreso}%` }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  {upload.estado === 'loading' ? 'En progreso...' : 
                   upload.estado === 'completed' ? 'Finalizado' : 'Error en carga'}
                </span>
                <span className="text-[11px] font-black text-slate-900">{upload.progreso}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </UploadContext.Provider>
  );
};
