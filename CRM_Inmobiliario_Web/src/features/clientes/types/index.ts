export interface Cliente {
  id: string;
  nombre: string;
  apellido?: string;
  email?: string;
  telefono: string;
  etapaEmbudo: string;
  fechaCreacion: string;
}
