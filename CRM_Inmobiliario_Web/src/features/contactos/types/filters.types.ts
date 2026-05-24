export type FilterFieldType = 'text' | 'select' | 'range' | 'boolean' | 'date';
export type ContactoFilterKey = string; // Claves de la interfaz Contacto

export interface FilterDefinition {
  key: ContactoFilterKey;
  label: string;
  type: FilterFieldType;
  options?: string[]; // Solo para tipo 'select'
  minLabel?: string; // Para tipo 'range' o 'date'
  maxLabel?: string; // Para tipo 'range' o 'date'
}

export const AVAILABLE_CONTACT_FILTERS: FilterDefinition[] = [
  // Texto
  { key: 'nombre', label: 'Nombre', type: 'text' },
  { key: 'apellido', label: 'Apellido', type: 'text' },
  { key: 'email', label: 'Correo Electrónico', type: 'text' },
  { key: 'telefono', label: 'Teléfono', type: 'text' },
  { key: 'nombreAgenteDueno', label: 'Agente Propietario', type: 'text' },
  
  // Select
  { 
    key: 'origen', 
    label: 'Origen / Fuente', 
    type: 'select', 
    options: ['Todos', 'Facebook Ads', 'Google Search', 'Referido', 'Portal Inmobiliario', 'WhatsApp Directo'] 
  },
  { 
    key: 'etapaEmbudo', 
    label: 'Estado de Cliente', 
    type: 'select', 
    options: ['Todos', 'Nuevo', 'Contactado', 'En Negociación', 'Cerrado', 'Perdido', 'Escalado'] 
  },
  { 
    key: 'estadoPropietario', 
    label: 'Estado de Propietario', 
    type: 'select', 
    options: ['Todos', 'Activo', 'Cerrado', 'Inactivo'] 
  },

  // Boolean
  { key: 'esContacto', label: 'Es Cliente', type: 'boolean' },
  { key: 'esPropietario', label: 'Es Propietario', type: 'boolean' },
  { key: 'esCompartido', label: 'Es Compartido', type: 'boolean' },

  // Date
  { key: 'fechaCreacion', label: 'Fecha de Creación', type: 'date', minLabel: 'Desde', maxLabel: 'Hasta' },
  { key: 'fechaCierre', label: 'Fecha de Cierre', type: 'date', minLabel: 'Desde', maxLabel: 'Hasta' },
];

export const DEFAULT_ACTIVE_CONTACT_FILTER_KEYS = [
  'origen',
  'esContacto',
  'esPropietario'
];
