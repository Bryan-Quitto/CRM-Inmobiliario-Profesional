import { useContext } from 'react';
import { TareasContext } from './TareasContext';

export const useTareas = () => {
  const context = useContext(TareasContext);
  if (context === undefined) {
    throw new Error('useTareas debe usarse dentro de un TareasProvider');
  }
  return context;
};
