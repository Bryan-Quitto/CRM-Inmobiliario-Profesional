import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { isAxiosError } from 'axios';
import { uploadImagenPropiedad } from '../api/uploadImagenPropiedad';
import { UploadContext } from './UploadContext';
import type { UploadContextType } from './UploadContext';

interface UploadProcess {
  propiedadId: string;
  nombrePropiedad: string;
  progreso: number;
  estado: 'loading' | 'completed' | 'error';
  totalFiles: number;
  completedFiles: number;
}

interface UploadStatus {
  id: string;
  propiedadId: string;
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

  const isUploading = useCallback((propiedadId: string) => {
    return !!activeUploads[propiedadId] && activeUploads[propiedadId].estado === 'loading';
  }, [activeUploads]);

  const uploadFiles = useCallback(async (
    propiedadId: string, 
    nombrePropiedad: string, 
    files: File[], 
    onImageUploaded?: (result: UploadResult) => void,
    sectionId?: string | null
  ) => {
    const filesArray = Array.from(files);
    
    // Inicializar el proceso para esta propiedad
    setActiveUploads(prev => ({
      ...prev,
      [propiedadId]: {
        propiedadId,
        nombrePropiedad,
        progreso: 0,
        estado: 'loading',
        totalFiles: filesArray.length,
        completedFiles: 0
      }
    }));

    const newUploads: UploadStatus[] = filesArray.map(file => ({
      id: crypto.randomUUID(),
      propiedadId,
      fileName: file.name,
      progress: 0,
      status: 'pending'
    }));

    setUploads(prev => [...prev, ...newUploads]);

    const processUploads = async () => {
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        const currentUploadId = newUploads[i].id;

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
          
          successCount++;
        } catch (err: unknown) {
          console.error(`Error subiendo ${file.name}:`, err);
          errorCount++;
          let errorMsg = 'Error en la subida';
          if (isAxiosError(err)) {
            errorMsg = err.response?.data?.detail || err.message;
          }
          setUploads(prev => prev.map(u => u.id === currentUploadId ? { 
            ...u, 
            status: 'error', 
            error: errorMsg
          } : u));
        } finally {
          // Actualizar progreso de la propiedad
          setActiveUploads(prev => {
            const current = prev[propiedadId];
            if (!current) return prev;
            const newCompleted = current.completedFiles + 1;
            return {
              ...prev,
              [propiedadId]: {
                ...current,
                completedFiles: newCompleted,
                progreso: Math.round((newCompleted / current.totalFiles) * 100)
              }
            };
          });
        }
      }

      // Finalizar proceso para esta propiedad
      setActiveUploads(prev => {
        const current = prev[propiedadId];
        if (!current) return prev;
        return {
          ...prev,
          [propiedadId]: {
            ...current,
            estado: errorCount === current.totalFiles ? 'error' : 'completed'
          }
        };
      });

      if (successCount > 0) {
        toast.success(`Carga completa: ${successCount} imágenes en "${nombrePropiedad}".`, {
          description: errorCount > 0 ? `${errorCount} fallaron.` : undefined
        });
      } else if (errorCount > 0) {
        toast.error(`Error en "${nombrePropiedad}": No se pudo subir ninguna imagen.`);
      }

      // Limpiar después de un tiempo
      setTimeout(() => {
        setActiveUploads(prev => {
          const newState = { ...prev };
          delete newState[propiedadId];
          return newState;
        });
        setUploads(prev => prev.filter(u => !newUploads.some(nu => nu.id === u.id)));
      }, 10000);
    };

    processUploads();
  }, []);

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
        {Object.values(activeUploads).map((upload) => (
          <div 
            key={upload.propiedadId}
            className="w-80 bg-white/95 backdrop-blur-md border border-slate-100 shadow-2xl rounded-2xl p-4 animate-in slide-in-from-right-8 duration-500 pointer-events-auto"
          >
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
                  <p className="text-sm font-black text-slate-900 truncate tracking-tight">{upload.nombrePropiedad}</p>
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
