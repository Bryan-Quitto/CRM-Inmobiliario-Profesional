export type FilterFieldType = 'text' | 'select' | 'range' | 'boolean';
export type PropiedadFilterKey = string; // Claves de la interfaz Propiedad o derivadas

import { ESTADOS, OPERACIONES } from '../constants/propiedades';
import { TIPOS_PROPIEDAD } from '../constants/propertyForm';

export interface FilterDefinition {
  key: PropiedadFilterKey;
  label: string;
  type: FilterFieldType;
  options?: string[]; // Solo para tipo 'select'
  minLabel?: string; // Para tipo 'range'
  maxLabel?: string; // Para tipo 'range'
  booleanLabels?: { true: string, false: string };
}

export const AVAILABLE_PROPERTY_FILTERS: FilterDefinition[] = [
  // Texto
  { key: 'titulo', label: 'Título', type: 'text' },
  { key: 'ciudad', label: 'Ciudad', type: 'text' },
  { key: 'sector', label: 'Sector / Barrio', type: 'text' },
  { key: 'direccion', label: 'Dirección', type: 'text' },
  { key: 'agenteNombre', label: 'Captador', type: 'text' },
  { key: 'gestorNombre', label: 'Gestor', type: 'text' },
  { key: 'propietarioNombre', label: 'Propietario', type: 'text' },

  // Select
  { 
    key: 'operacion', 
    label: 'Operación', 
    type: 'select', 
    options: ['Todas', ...OPERACIONES.map(o => o.value)] 
  },
  { 
    key: 'tipoPropiedad', 
    label: 'Tipo de Propiedad', 
    type: 'select', 
    options: ['Todas', ...TIPOS_PROPIEDAD.map(o => o.value)] 
  },
  { 
    key: 'estadoComercial', 
    label: 'Estado Comercial', 
    type: 'select', 
    options: ['Todos', ...ESTADOS.map(o => o.value)] 
  },

  // Range
  { key: 'precio', label: 'Precio ($)', type: 'range', minLabel: 'Mínimo', maxLabel: 'Máximo' },
  { key: 'areaTotal', label: 'Área Total (m²)', type: 'range', minLabel: 'Mínima', maxLabel: 'Máxima' },
  { key: 'areaConstruccion', label: 'Área de Construcción (m²)', type: 'range', minLabel: 'Mínima', maxLabel: 'Máxima' },
  { key: 'areaTerreno', label: 'Área de Terreno (m²)', type: 'range', minLabel: 'Mínima', maxLabel: 'Máxima' },
  { key: 'habitaciones', label: 'Habitaciones', type: 'range', minLabel: 'Mínimo', maxLabel: 'Máximo' },
  { key: 'banos', label: 'Baños', type: 'range', minLabel: 'Mínimo', maxLabel: 'Máximo' },
  { key: 'mediosBanos', label: 'Medios Baños', type: 'range', minLabel: 'Mínimo', maxLabel: 'Máximo' },
  { key: 'estacionamientos', label: 'Estacionamientos', type: 'range', minLabel: 'Mínimo', maxLabel: 'Máximo' },
  { key: 'aniosAntiguedad', label: 'Antigüedad (Años)', type: 'range', minLabel: 'Mínimo', maxLabel: 'Máximo' },
  { key: 'porcentajeComision', label: 'Comisión (%)', type: 'range', minLabel: 'Mínimo', maxLabel: 'Máximo' },

  // Boolean
  { 
    key: 'esCaptacionPropia', 
    label: 'Captación Propia', 
    type: 'boolean',
    booleanLabels: { true: 'Sí', false: 'No' }
  },
  { 
    key: 'esCaptadorActivo', 
    label: 'Captador es Gestor', 
    type: 'boolean',
    booleanLabels: { true: 'Sí', false: 'No' }
  },
];

// Filtros básicos que se renderizan por defecto si el usuario limpia todo
export const DEFAULT_ACTIVE_FILTER_KEYS = [
  'operacion',
  'tipoPropiedad',
  'estadoComercial',
  'precio',
  'areaTotal',
  'habitaciones',
  'banos',
  'estacionamientos'
];
