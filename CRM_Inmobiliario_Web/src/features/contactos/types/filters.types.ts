export type FilterFieldType = 'text' | 'select' | 'range' | 'boolean' | 'date';
export type ContactoFilterKey = string; // Claves de la interfaz Contacto

import { ESTADOS, ESTADOS_PROPIETARIO, ORIGENES, ESTADOS_IA } from '../constants/contactos';

export interface FilterDefinition {
  key: ContactoFilterKey;
  label: string;
  type: FilterFieldType;
  options?: string[]; // Solo para tipo 'select'
  minLabel?: string; // Para tipo 'range' o 'date'
  maxLabel?: string; // Para tipo 'range' o 'date'
  booleanLabels?: { true: string, false: string };
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
    label: 'Origen', 
    type: 'select', 
    options: ['Todos', ...ORIGENES.map(o => o.value)] 
  },
  { 
    key: 'estado', 
    label: 'Estado de Cliente', 
    type: 'select', 
    options: ['Todos', ...ESTADOS.map(o => o.value), 'Escalado'] 
  },
  { 
    key: 'estadoPropietario', 
    label: 'Estado Propietario', 
    type: 'select', 
    options: ['Todos', ...ESTADOS_PROPIETARIO.map(o => o.value)] 
  },

  // Boolean
  { 
    key: 'esCliente', 
    label: 'Es Cliente', 
    type: 'boolean',
    booleanLabels: { true: 'Sí', false: 'No' } 
  },
  { 
    key: 'esPropietario', 
    label: 'Es Propietario', 
    type: 'boolean',
    booleanLabels: { true: 'Sí', false: 'No' } 
  },
  { 
    key: 'visibilidad', 
    label: 'Visibilidad', 
    type: 'select',
    options: ['Todos', 'Propios', 'Compartidos']
  },
  {
    key: 'estadoIA_WA',
    label: 'IA WhatsApp',
    type: 'select',
    options: ['Todos', ...ESTADOS_IA.map(o => o.value)]
  },
  {
    key: 'estadoIA_FB',
    label: 'IA Facebook',
    type: 'select',
    options: ['Todos', ...ESTADOS_IA.map(o => o.value)]
  },

  // Date
  { key: 'fechaCreacion', label: 'Fecha de Creación', type: 'date', minLabel: 'Desde', maxLabel: 'Hasta' },
  { key: 'fechaCierre', label: 'Fecha de Cierre', type: 'date', minLabel: 'Desde', maxLabel: 'Hasta' },
];

export const DEFAULT_ACTIVE_CONTACT_FILTER_KEYS = [
  'visibilidad',
  'origen',
  'estado',
  'estadoPropietario',
  'esCliente',
  'esPropietario'
];
