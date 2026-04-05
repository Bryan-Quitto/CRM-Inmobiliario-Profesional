import { createContext } from 'react';

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

export interface UploadContextType {
  uploads: UploadStatus[];
  activeUploads: Record<string, UploadProcess>;
  uploadFiles: (
    propiedadId: string, 
    nombrePropiedad: string, 
    files: File[], 
    onImageUploaded?: (result: UploadResult) => void,
    sectionId?: string | null
  ) => Promise<void>;
  isUploading: (propiedadId: string) => boolean;
}

export const UploadContext = createContext<UploadContextType | undefined>(undefined);
