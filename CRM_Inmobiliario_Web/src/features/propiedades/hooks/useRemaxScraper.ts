import { useState } from 'react';
import { toast } from 'sonner';
import type { UseFormSetValue, UseFormGetValues } from 'react-hook-form';
import type { CrearPropiedadDTO } from '../api/crearPropiedad';
import { importarPropiedadRemax } from '../api/importarPropiedadRemax';

export const useRemaxScraper = (
  setValue: UseFormSetValue<CrearPropiedadDTO>,
  getValues: UseFormGetValues<CrearPropiedadDTO>
) => {
  const [isScraping, setIsScraping] = useState(false);
  const [missedFields, setMissedFields] = useState<string[]>([]);

  const handleImportar = async () => {
    const url = getValues('urlRemax');
    if (!url || !url.includes('remax.com.ec')) {
      toast.error('Por favor ingresa una URL válida de remax.com.ec');
      return;
    }
    
    setIsScraping(true);
    setMissedFields([]);
    
    try {
      const data = await importarPropiedadRemax(url);
      const newMissed: string[] = [];
      
      if (data.titulo) setValue('titulo', data.titulo, { shouldValidate: true, shouldDirty: true }); else newMissed.push('titulo');
      if (data.descripcion) setValue('descripcion', data.descripcion, { shouldValidate: true, shouldDirty: true }); else newMissed.push('descripcion');
      if (data.precio > 0) setValue('precio', data.precio, { shouldValidate: true, shouldDirty: true }); else newMissed.push('precio');
      
      if (data.tipoPropiedad) setValue('tipoPropiedad', data.tipoPropiedad, { shouldValidate: true, shouldDirty: true });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (data.operacion) setValue('operacion', data.operacion as any, { shouldValidate: true, shouldDirty: true });
      if (data.ciudad) setValue('ciudad', data.ciudad, { shouldDirty: true }); else newMissed.push('ciudad');
      if (data.sector) setValue('sector', data.sector, { shouldDirty: true }); else newMissed.push('sector');
      if (data.direccionCompleta) setValue('direccion', data.direccionCompleta, { shouldValidate: true, shouldDirty: true }); else newMissed.push('direccion');

      if (['Casa', 'Departamento', 'Suite', 'Hotel'].includes(data.tipoPropiedad)) {
        if (data.habitaciones > 0) setValue('habitaciones', data.habitaciones, { shouldValidate: true, shouldDirty: true }); else newMissed.push('habitaciones');
        if (data.banos > 0) setValue('banos', data.banos, { shouldValidate: true, shouldDirty: true }); else newMissed.push('banos');
      }

      if (data.areaTotal > 0) setValue('areaTotal', data.areaTotal, { shouldValidate: true, shouldDirty: true }); else newMissed.push('areaTotal');
      
      if (data.areaTerreno) setValue('areaTerreno', data.areaTerreno, { shouldValidate: true, shouldDirty: true }); else newMissed.push('areaTerreno');
      if (data.areaConstruccion) setValue('areaConstruccion', data.areaConstruccion, { shouldValidate: true, shouldDirty: true }); else newMissed.push('areaConstruccion');
      if (data.estacionamientos !== null && data.estacionamientos !== undefined) setValue('estacionamientos', data.estacionamientos, { shouldValidate: true, shouldDirty: true }); else newMissed.push('estacionamientos');
      if (data.mediosBanos !== null && data.mediosBanos !== undefined) setValue('mediosBanos', data.mediosBanos, { shouldValidate: true, shouldDirty: true }); else newMissed.push('mediosBanos');
      if (data.aniosAntiguedad !== null && data.aniosAntiguedad !== undefined) setValue('aniosAntiguedad', data.aniosAntiguedad, { shouldValidate: true, shouldDirty: true }); else newMissed.push('aniosAntiguedad');

      setMissedFields(newMissed);
      toast.success('¡Datos importados con éxito!', { description: 'Revisa las casillas resaltadas en amarillo por autocompletar.' });
    } catch (err) {
      console.error('Error al importar:', err);
      toast.error('Error al importar', { description: 'Verifica la URL o intenta manualmente.' });
    } finally {
      setIsScraping(false);
    }
  };

  return { isScraping, missedFields, handleImportar };
};
