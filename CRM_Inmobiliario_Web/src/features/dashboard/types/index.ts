export interface EstadoEmbudoItem {
  etapa: string;
  cantidad: number;
}

export interface ContactoDashboardItem {
  id: string;
  nombre: string;
  apellido: string;
  estadoEmbudo: string;
}

export interface DashboardKpis {
  totalPropiedadesDisponibles: number;
  totalContactosActivos: number;
  tareasPendientesHoy: number;
  seguimientoRequerido: number;
  contactosSeguimiento: ContactoDashboardItem[];
  embudoVentas: EstadoEmbudoItem[];
}
