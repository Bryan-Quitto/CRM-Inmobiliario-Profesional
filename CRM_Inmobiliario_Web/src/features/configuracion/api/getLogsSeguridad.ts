import { api } from '@/lib/axios';

export interface SecurityAuditLog {
  id: string;
  agenteId: string;
  agenteNombre: string;
  tipoIncidente: string;
  descripcion: string;
  timestamp: string;
}

export const getLogsSeguridad = async (): Promise<SecurityAuditLog[]> => {
  const { data } = await api.get<SecurityAuditLog[]>('/configuracion/seguridad/logs');
  return data;
};
