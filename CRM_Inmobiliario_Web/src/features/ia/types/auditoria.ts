export interface LogResponse {
  id: string;
  accion: string;
  detalleJson: string | null;
  triggerMessage: string | null;
  fecha: string;
}

export interface InteresResumen {
  propiedadId: string;
  titulo: string;
  imagenUrl: string | null;
  precio: number;
  sector: string | null;
  nivelInteres: string;
  fecha: string;
}

export interface ClientGroup {
  telefono: string;
  nombre: string;
  clienteId: string | null;
  ultimaActividad: string;
  registradoPorIA: boolean;
  logs: LogResponse[];
  intereses: InteresResumen[];
}

export interface MensajeChat {
  rol: 'cliente' | 'ia';
  contenido: string;
  fecha: string;
}
