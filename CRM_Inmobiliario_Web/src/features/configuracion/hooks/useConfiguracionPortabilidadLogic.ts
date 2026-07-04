import { useState } from 'react';
import { api } from '@/lib/axios';
import { toast } from 'sonner';

export const useConfiguracionPortabilidadLogic = () => {
  const [isExportingContactos, setIsExportingContactos] = useState(false);
  const [isExportingPropiedades, setIsExportingPropiedades] = useState(false);

  const handleExport = async (entidad: 'contactos' | 'propiedades') => {
    try {
      if (entidad === 'contactos') setIsExportingContactos(true);
      if (entidad === 'propiedades') setIsExportingPropiedades(true);

      const response = await api.get(`/portabilidad/exportar?entidad=${entidad}`, {
        responseType: 'blob',
      });

      // Extraer el nombre del archivo del header o generar uno por defecto
      let fileName = `Exportacion_${entidad}.xlsx`;
      const disposition = response.headers['content-disposition'];
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          fileName = matches[1].replace(/['"]/g, '');
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Archivo descargado correctamente');
    } catch (error) {
      console.error('Error al exportar datos:', error);
      toast.error('Ocurrió un error al intentar exportar los datos', {
        description: 'Por favor, intenta nuevamente más tarde.',
      });
    } finally {
      if (entidad === 'contactos') setIsExportingContactos(false);
      if (entidad === 'propiedades') setIsExportingPropiedades(false);
    }
  };

  return {
    isExportingContactos,
    isExportingPropiedades,
    handleExport,
  };
};

export type UseConfiguracionPortabilidadLogicReturn = ReturnType<typeof useConfiguracionPortabilidadLogic>;
