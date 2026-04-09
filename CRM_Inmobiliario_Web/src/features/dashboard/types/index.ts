export interface EtapaEmbudoItem {
  etapa: string;
  cantidad: number;
}

export interface LeadDashboardItem {
  id: string;
  nombre: string;
  apellido: string;
  etapaEmbudo: string;
}

export interface DashboardKpis {
  totalPropiedadesDisponibles: number;
  totalProspectosActivos: number;
  tareasPendientesHoy: number;
  seguimientoRequerido: number;
  leadsSeguimiento: LeadDashboardItem[];
  embudoVentas: EtapaEmbudoItem[];
}
