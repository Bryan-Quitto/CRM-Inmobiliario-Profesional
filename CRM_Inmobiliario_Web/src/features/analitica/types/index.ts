export interface TrendPoint {
  fecha: string;
  visitas: number;
  cierres: number;
  captaciones: number;
}

export interface KpiVisita {
  id: string;
  titulo: string;
  fecha: string;
  cliente?: string;
  propiedad?: string;
}

export interface KpiCierre {
  id: string;
  cliente: string;
  propiedad: string;
  fechaCierre: string;
}

export interface KpiOferta {
  id: string;
  cliente: string;
  propiedad: string;
  fecha: string;
}

export interface KpiCaptacion {
  id: string;
  titulo: string;
  fecha: string;
  precio: number;
}

export interface ActividadAnalitica {
  visitasCompletadas: number;
  cierresRealizados: number;
  ofertasGeneradas: number;
  captacionesPropias: number;
  trend: TrendPoint[];
  detalles: {
    visitas: KpiVisita[];
    cierres: KpiCierre[];
    ofertas: KpiOferta[];
    captaciones: KpiCaptacion[];
  };
}

export interface SeguimientoAnalitica {
  seguimientoRequerido: number;
}

export interface ItemCalculoProyeccion {
  propiedad: string;
  precio: number;
  porcentajeComision: number;
  comisionCalculada: number;
}

export interface ProyeccionAnalitica {
  proyeccionIngresos: number;
  desglose: ItemCalculoProyeccion[];
}

export interface DetalleCierreEficiencia {
  id: string;
  cliente: string;
  propiedad: string;
  fechaCreacion: string;
  fechaCierre: string;
  dias: number;
}

export interface EficienciaAnalitica {
  tasaConversion: number;
  tiempoPromedioCierreDias: number;
  calculos: {
    totalLeads: number;
    totalCerrados: number;
    leadsConFechaCierre: number;
    detallesCierres: DetalleCierreEficiencia[];
  };
}
