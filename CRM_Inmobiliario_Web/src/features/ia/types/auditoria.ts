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
  contactoId: string | null;
  ultimaActividad: string;
  registradoPorIA: boolean;
  logs: LogResponse[];
  intereses: InteresResumen[];
}

export interface MensajeChat {
  id: string;
  rol: 'contacto' | 'ia' | 'cliente';
  origenMensaje?: string;
  tipo?: 'texto' | 'audio' | 'imagen';
  contenido: string;
  audioUrl?: string;
  fecha: string;
}

export interface AuditoriaEventRow {
  eventId: string;
  contactoId: string | null;
  telefono: string | null;
  fecha: string;
  accion: string;
  detalleJson: string | null;
  triggerMessage: string | null;
  source: string;
  canal: string;
  senderType: string | null;
  sessionId: number;
}

export interface AuditoriaSessionResponse {
  sessionKey: string;
  sessionId: number;
  contactoId: string | null;
  telefono: string | null;
  contactoNombre: string | null;
  contactoApellido: string | null;
  inicioSesion: string;
  finSesion: string;
  canalPrincipal: string;
  eventos: AuditoriaEventRow[];
}
