export interface CalendarEvent {
  id: string;
  titulo: string;
  descripcion?: string;
  tipoTarea: string;
  fechaInicio: string;
  duracionMinutos: number;
  colorHex?: string;
  estado: string;
  clienteId?: string;
  clienteNombre?: string;
  propiedadId?: string;
  propiedadTitulo?: string;
}

export interface ReprogramarEventoCommand {
  fechaInicio: string;
  duracionMinutos?: number;
}
