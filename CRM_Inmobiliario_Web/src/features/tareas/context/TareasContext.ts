import { createContext } from 'react';
import type { Tarea } from '../types';
import type { Cliente } from '../../clientes/types';
import type { Propiedad } from '../../propiedades/types';

export interface TareasContextType {
  tareas: Tarea[];
  loading: boolean;
  clientes: Cliente[];
  loadingClientes: boolean;
  propiedades: Propiedad[];
  loadingPropiedades: boolean;
  refreshTareas: () => Promise<void>;
  updateTareaEstado: (id: string, nuevoEstado: 'Pendiente' | 'Completada' | 'Cancelada') => Promise<void>;
  updateTarea: (id: string, data: Partial<Tarea>, savePromise: Promise<unknown>) => Promise<void>;
  addTarea: (nuevaTarea: Tarea, savePromise: Promise<unknown>) => Promise<void>;
  urgentesCount: number;
}

export const TareasContext = createContext<TareasContextType | undefined>(undefined);
