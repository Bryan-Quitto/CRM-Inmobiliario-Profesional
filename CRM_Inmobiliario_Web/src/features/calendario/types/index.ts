export interface CalendarEvent {
  id: string;
  titulo: string;
  descripcion?: string;
  tipoTarea: string;
  fechaInicio: string;
  duracionMinutos: number;
  colorHex?: string;
  estado: string;
  contactoId?: string;
  contactoNombre?: string;
  propiedadId?: string;
  propiedadTitulo?: string;
  lugar?: string;
}

export interface ReprogramarEventoCommand {
  fechaInicio: string;
  duracionMinutos?: number;
}
