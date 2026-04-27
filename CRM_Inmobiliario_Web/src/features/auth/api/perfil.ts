import useSWR from 'swr';
import { api } from '@/lib/axios';

export interface PerfilAgente {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  agenciaNombre?: string;
  agenciaId?: string | null;
  fotoUrl?: string;
  logoUrl?: string;
  rol: string;
  fechaCreacion: string;
}

export const usePerfil = () => {
  const { data, error, isLoading, mutate } = useSWR<PerfilAgente>('/configuracion/perfil');

  const actualizarPerfil = async (datos: Partial<PerfilAgente>) => {
    await api.put('/configuracion/perfil', datos);
    await mutate(); // Revalidar cache
  };

  return {
    perfil: data,
    error,
    isLoading,
    actualizarPerfil,
    mutate,
  };
};
