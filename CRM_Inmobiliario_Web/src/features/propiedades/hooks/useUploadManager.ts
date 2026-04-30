import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';
import { isAxiosError } from 'axios';
import { uploadImagenPropiedad } from '../api/uploadImagenPropiedad';
import type { UploadStatus, UploadProcess, UploadResult, UploadContextType } from '../context/UploadContext';

/**
 * Hook orquestador para la gestión de subidas de archivos en segundo plano.
 * Centraliza la lógica de colas, compresión de imágenes y estado global de carga.
 */
export const useUploadManager = (): UploadContextType & { dismissUpload: (id: string) => void } => {
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const [activeUploads, setActiveUploads] = useState<Record<string, UploadProcess>>({});
  
  // Colas internas para manejar subidas secuenciales por sección
  const queuesRef = useRef<Record<string, File[]>>({});
  const processingRef = useRef<Record<string, boolean>>({});

  // Ref para mantener callbacks de eventos frescos sin disparar re-renders de la cola
  const callbacksRef = useRef<Record<string, (result: UploadResult) => void>>({});

  const isUploading = useCallback((propiedadId: string, sectionId?: string | null) => {
    if (sectionId !== undefined) {
      const processId = `${propiedadId}_${sectionId || 'general'}`;
      return !!activeUploads[processId] && activeUploads[processId].estado === 'loading';
    }
    return Object.values(activeUploads).some(u => u.propiedadId === propiedadId && u.estado === 'loading');
  }, [activeUploads]);

  // Prevención de cierre de pestaña/recarga si hay subidas activas
  useEffect(() => {
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
        // Actualizar progreso global del proceso
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

    // 2. Inicializar o actualizar el proceso activo
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

  const dismissUpload = useCallback((id: string) => {
    setActiveUploads(prev => ({
      ...prev,
      [id]: { ...prev[id], dismissed: true }
    }));
  }, []);

  return {
    uploads,
    activeUploads,
    uploadFiles,
    isUploading,
    dismissUpload
  };
};
