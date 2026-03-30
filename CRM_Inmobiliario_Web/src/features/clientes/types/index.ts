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

export interface Cliente {
  id: string;
  nombre: string;
  apellido?: string;
  email?: string;
  telefono: string;
  origen: string;
  etapaEmbudo: string;
  notas?: string;
  fechaCreacion: string;
  interacciones?: Interaccion[];
  intereses?: Interes[];
}

export interface RegistrarInteraccionDTO {
  clienteId: string;
  tipoInteraccion: string;
  notas: string;
}
