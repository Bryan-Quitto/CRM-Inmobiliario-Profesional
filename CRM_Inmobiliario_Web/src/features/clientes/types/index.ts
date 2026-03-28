export interface Interaccion {
  id: string;
  tipoInteraccion: string;
  notas: string;
  fechaInteraccion: string;
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
}

export interface RegistrarInteraccionDTO {
  clienteId: string;
  tipoInteraccion: string;
  notas: string;
}
