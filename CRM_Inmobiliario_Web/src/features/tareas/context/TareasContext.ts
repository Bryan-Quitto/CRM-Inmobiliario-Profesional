import { createContext } from 'react';
import type { Tarea } from '../types';

export interface TareasContextType {
  tareas: Tarea[];
  loading: boolean;
  refreshTareas: () => Promise<void>;
  updateTareaEstado: (id: string, nuevoEstado: 'Pendiente' | 'Completada' | 'Cancelada') => Promise<void>;
  updateTarea: (id: string, data: Partial<Tarea>, savePromise: Promise<unknown>) => Promise<void>;
  addTarea: (nuevaTarea: Tarea, savePromise: Promise<unknown>) => Promise<void>;
  urgentesCount: number;
}

export const TareasContext = createContext<TareasContextType | undefined>(undefined);
