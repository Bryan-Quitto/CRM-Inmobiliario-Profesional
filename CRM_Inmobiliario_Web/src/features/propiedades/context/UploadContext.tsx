import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';
import { uploadImagenPropiedad } from '../api/uploadImagenPropiedad';

interface UploadStatus {
  id: string;
  propiedadId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'compressing' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface UploadContextType {
  uploads: UploadStatus[];
  uploadFiles: (propiedadId: string, files: File[], onImageUploaded?: (result: any) => void) => Promise<void>;
  isAnyUploading: boolean;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
};

export const UploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uploads, setUploads] = useState<UploadStatus[]>([]);

  const isAnyUploading = uploads.some(u => u.status === 'uploading' || u.status === 'compressing');

  const uploadFiles = useCallback(async (propiedadId: string, files: File[], onImageUploaded?: (result: any) => void) => {
    const filesArray = Array.from(files);
    const newUploads: UploadStatus[] = filesArray.map(file => ({
      id: crypto.randomUUID(),
      propiedadId,
      fileName: file.name,
      progress: 0,
      status: 'pending'
    }));

    setUploads(prev => [...prev, ...newUploads]);

    // Iniciamos el proceso en "segundo plano" (sin esperar con await en el componente que lo llama)
    const processUploads = async () => {
      const toastId = toast.loading(`Procesando ${filesArray.length} imágenes...`, {
        description: 'La subida continuará aunque cierres esta ventana.'
      });

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        const currentUploadId = newUploads[i].id;

        try {
          // 1. Compresión
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

          // 2. Subida
          setUploads(prev => prev.map(u => u.id === currentUploadId ? { ...u, status: 'uploading' } : u));
          
          const result = await uploadImagenPropiedad(propiedadId, finalFile);
          
          setUploads(prev => prev.map(u => u.id === currentUploadId ? { ...u, status: 'completed', progress: 100 } : u));
          
          // Notificar al componente si sigue montado (opcional)
          if (onImageUploaded) {
            onImageUploaded({
              id: result.id,
              propiedadId,
              tipoMultimedia: 'Imagen',
              urlPublica: result.urlPublica,
              esPrincipal: result.esPrincipal,
              orden: result.orden
            });
          }
          
          successCount++;
        } catch (err: any) {
          console.error(`Error subiendo ${file.name}:`, err);
          errorCount++;
          setUploads(prev => prev.map(u => u.id === currentUploadId ? { 
            ...u, 
            status: 'error', 
            error: err.response?.data?.detail || 'Error en la subida' 
          } : u));
        }
      }

      toast.dismiss(toastId);
      if (successCount > 0) {
        toast.success(`Carga completa: ${successCount} imágenes subidas.`, {
          description: errorCount > 0 ? `${errorCount} fallaron.` : undefined
        });
      } else if (errorCount > 0) {
        toast.error('No se pudo subir ninguna imagen.');
      }

      // Limpiar el historial de subidas después de un tiempo (opcional)
      setTimeout(() => {
        setUploads(prev => prev.filter(u => !newUploads.some(nu => nu.id === u.id)));
      }, 10000);
    };

    // Lanzamos el proceso sin await para que el componente recupere el control
    processUploads();
  }, []);

  return (
    <UploadContext.Provider value={{ uploads, uploadFiles, isAnyUploading }}>
      {children}
    </UploadContext.Provider>
  );
};
