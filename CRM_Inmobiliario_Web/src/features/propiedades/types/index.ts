export interface MultimediaPropiedad {
  id: string;
  propiedadId: string;
  sectionId?: string | null;
  tipoMultimedia: string;
  urlPublica: string;
  descripcion?: string | null;
  esPrincipal: boolean;
  orden: number;
}

export interface SeccionGaleria {
  id: string;
  nombre: string;
  descripcion?: string | null;
  orden: number;
  media: MultimediaPropiedad[];
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
  media?: MultimediaPropiedad[]; // Mantenido por compatibilidad si es necesario
  secciones?: SeccionGaleria[];
  mediaSinSeccion?: MultimediaPropiedad[];
  imagenPortadaUrl?: string;
}
