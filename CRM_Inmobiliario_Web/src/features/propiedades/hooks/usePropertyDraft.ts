import { useEffect } from 'react';
import type { UseFormReset } from 'react-hook-form';
import type { CrearPropiedadDTO } from '../api/crearPropiedad';
import { DRAFT_STORAGE_KEY } from '../constants/propertyForm';

export const usePropertyDraft = (
  isEditing: boolean,
  watchedValues: CrearPropiedadDTO | undefined,
  reset: UseFormReset<CrearPropiedadDTO>
) => {
  // Guardar borrador automáticamente
  useEffect(() => {
    if (isEditing || !watchedValues) return;
    
    // Solo guardar si hay algo real que guardar para no ensuciar
    const hasContent = Object.values(watchedValues).some(v => v && v !== '' && v !== 0);
    if (hasContent) {
      console.log('[DEBUG] usePropertyDraft - Saving to localStorage');
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(watchedValues));
    }
  }, [watchedValues, isEditing]);

  const handleClearDraft = () => {
    console.log('[DEBUG] usePropertyDraft - Clearing localStorage');
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    const today = new Date();
    // Ecuador UTC-5
    const ecuadorDate = new Date(today.getTime() - (5 * 60 * 60 * 1000)).toISOString().split('T')[0];
    
    reset({
      titulo: '',
      descripcion: '',
      tipoPropiedad: '',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      operacion: '' as any,
      precio: 0,
      direccion: '',
      sector: '',
      ciudad: '',
      googleMapsUrl: '',
      urlRemax: '',
      habitaciones: 0,
      banos: 0,
      areaTotal: 0,
      fechaIngreso: ecuadorDate,
      esCaptacionPropia: true,
      porcentajeComision: 5
    });
  };

  return { handleClearDraft };
};
