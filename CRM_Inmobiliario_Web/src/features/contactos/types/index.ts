export interface Interaccion {
  id: string;
  tipoInteraccion: string;
  notas: string;
  fechaInteraccion: string;
}

export interface Interes {
  propiedadId: string;
  titulo: string;
  precio: number;
  estadoComercial: string;
  nivelInteres: string;
  fechaRegistro: string;
}

export interface PropiedadCaptada {
  id: string;
  titulo: string;
  tipoPropiedad: string;
  precio: number;
  estadoComercial: string;
  fechaIngreso: string;
}

export interface Contacto {
  id: string;
  nombre: string;
  apellido?: string;
  email?: string;
  telefono: string;
  origen: string;
  etapaEmbudo: string;
  esContacto: boolean;
  estadoPropietario: string;
  esPropietario: boolean;

  botActivoWA?: boolean;
  botActivoFB?: boolean;
  estadoIA_WA?: string | null;
  estadoIA_FB?: string | null;
  facebookSenderId?: string | null;
  notas?: string;
  fechaCreacion: string;
  fechaCierre?: string;
  interacciones?: Interaccion[];
  intereses?: Interes[];
  propiedadesCaptadas?: PropiedadCaptada[];
  esCompartido?: boolean;
  nombreAgenteDueno?: string | null;
  numeroInteracciones?: number;
  numeroIntereses?: number;
  numeroPropiedadesCaptadas?: number;
  numeroReservas?: number;
  numeroCierres?: number;
  numeroVisitas?: number;
  numeroOfertas?: number;
  isArchivedForCurrentUser?: boolean;
}

export interface AgenteCompartido {
  id: string;
  nombreCompleto: string;
  fotoUrl: string | null;
}

export interface RegistrarInteraccionDTO {
  contactoId: string;
  tipoInteraccion: string;
  notas: string;
}
