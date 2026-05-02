export interface EtapaEmbudoItem {
  etapa: string;
  cantidad: number;
}

export interface ContactoDashboardItem {
  id: string;
  nombre: string;
  apellido: string;
  etapaEmbudo: string;
}

export interface DashboardKpis {
  totalPropiedadesDisponibles: number;
  totalContactosActivos: number;
  tareasPendientesHoy: number;
  seguimientoRequerido: number;
  contactosSeguimiento: ContactoDashboardItem[];
  embudoVentas: EtapaEmbudoItem[];
}
