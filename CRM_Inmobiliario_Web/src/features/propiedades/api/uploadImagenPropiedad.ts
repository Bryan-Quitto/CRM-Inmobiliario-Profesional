import { api } from '@/lib/axios';

export interface UploadResponse {
  id: string;
  urlPublica: string;
  esPrincipal: boolean;
}

export const uploadImagenPropiedad = async (id: string, file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post<UploadResponse>(`/propiedades/${id}/imagenes`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data;
};
