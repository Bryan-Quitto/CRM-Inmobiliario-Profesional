export interface MultimediaPropiedad {
  id: string;
  propiedadId: string;
  tipoMultimedia: string;
  urlPublica: string;
  esPrincipal: boolean;
  orden: number;
}

export interface Propiedad {
  id: string;
  titulo: string;
  descripcion: string;
  tipoPropiedad: string;
  operacion: string;
  precio: number;
  direccion: string;
  sector: string;
  ciudad: string;
  habitaciones: number;
  banos: number;
  areaTotal: number;
  estadoComercial: string;
  esCaptacionPropia: boolean;
  porcentajeComision: number;
  fechaIngreso: string;
  media?: MultimediaPropiedad[];
  imagenPortadaUrl?: string;
}
