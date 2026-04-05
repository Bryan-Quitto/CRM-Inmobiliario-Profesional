import { api } from '@/lib/axios';

export interface UploadResponse {
  id: string;
  urlPublica: string;
  esPrincipal: boolean;
  orden: number;
  sectionId?: string | null;
  descripcion?: string | null;
}

export const uploadImagenPropiedad = async (
  id: string, 
  file: File, 
  sectionId?: string | null, 
  descripcion?: string | null
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const params = new URLSearchParams();
  if (sectionId) params.append('sectionId', sectionId);
  if (descripcion) params.append('descripcion', descripcion);

  const { data } = await api.post<UploadResponse>(`/propiedades/${id}/imagenes?${params.toString()}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data;
};
