import { createContext } from 'react';

export interface UploadProcess {
  id: string; // ID único para el proceso (propiedadId + sectionId)
  propiedadId: string;
  sectionId?: string | null;
  nombrePropiedad: string;
  progreso: number;
  estado: 'loading' | 'completed' | 'error';
  totalFiles: number;
  completedFiles: number;
  dismissed?: boolean;
}

export interface UploadStatus {
  id: string;
  propiedadId: string;
  sectionId?: string | null;
  fileName: string;
  progress: number;
  status: 'pending' | 'compressing' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface UploadResult {
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
  isUploading: (propiedadId: string, sectionId?: string | null) => boolean;
}

export const UploadContext = createContext<UploadContextType | undefined>(undefined);
