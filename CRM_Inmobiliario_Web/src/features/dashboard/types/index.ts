export interface EtapaEmbudoItem {
  etapa: string;
  cantidad: number;
}

export interface DashboardKpis {
  totalPropiedadesDisponibles: number;
  totalProspectosActivos: number;
  tareasPendientesHoy: number;
  embudoVentas: EtapaEmbudoItem[];
}
