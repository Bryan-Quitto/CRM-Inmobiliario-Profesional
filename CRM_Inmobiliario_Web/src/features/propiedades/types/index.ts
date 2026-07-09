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

export interface PropertyPermissions {
  canEditMasterData: boolean;
  canManageGallery: boolean;
  canChangeStatus: boolean;
}

export interface ActiveTransactionInfo {
  agenteId: string;
  agenteNombre: string;
}

export interface Propiedad {
  id: string;
  codigoCorto?: string;
  titulo: string;
  descripcion: string;
  tipoPropiedad: string;
  operacion: string;
  precio: number;
  direccion: string;
  sector: string;
  ciudad: string;
  googleMapsUrl?: string;
  urlRemax?: string;
  habitaciones: number;
  banos: number;
  areaTotal: number;
  areaTerreno?: number;
  areaConstruccion?: number;
  estacionamientos?: number;
  mediosBanos?: number;
  aniosAntiguedad?: number;
  alreadyHasContact?: boolean;
  estadoComercial: string;
  esCaptacionPropia: boolean;
  esCaptadorActivo: boolean;
  porcentajeComision: number;
  fechaIngreso: string;
  agenteId: string;
  agenteNombre?: string;
  gestorId?: string;
  gestorNombre?: string;
  propietarioId?: string;
  propietarioNombre?: string;
  propietarioEstado?: string;
  precioCierre?: number;
  precioReserva?: number;
  fechaCierre?: string;
  cerradoConId?: string;
  cerradoConNombre?: string;
  media?: MultimediaPropiedad[]; // Mantenido por compatibilidad si es necesario
  secciones?: SeccionGaleria[];
  mediaSinSeccion?: MultimediaPropiedad[];
  imagenPortadaUrl?: string;
  permissions?: PropertyPermissions;
  activeTransaction?: ActiveTransactionInfo;
  version?: string;
  isArchivedForCurrentUser?: boolean;
}
