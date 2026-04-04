export interface TrendPoint {
  fecha: string;
  visitas: number;
  cierres: number;
  captaciones: number;
}

export interface ActividadAnalitica {
  visitasCompletadas: number;
  cierresRealizados: number;
  ofertasGeneradas: number;
  captacionesPropias: number;
  trend: TrendPoint[];
}

export interface SeguimientoAnalitica {
  seguimientoRequerido: number;
}

export interface ProyeccionAnalitica {
  proyeccionIngresos: number;
}

export interface EficienciaAnalitica {
  tasaConversion: number;
  tiempoPromedioCierreDias: number;
}
