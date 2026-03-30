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
  tipoMultimedia: string;
  urlPublica: string;
  esPrincipal: boolean;
  orden: number;
}

export interface UploadContextType {
  uploads: UploadStatus[];
  activeUploads: Record<string, UploadProcess>;
  uploadFiles: (propiedadId: string, nombrePropiedad: string, files: File[], onImageUploaded?: (result: UploadResult) => void) => Promise<void>;
  isUploading: (propiedadId: string) => boolean;
}

export const UploadContext = createContext<UploadContextType | undefined>(undefined);
