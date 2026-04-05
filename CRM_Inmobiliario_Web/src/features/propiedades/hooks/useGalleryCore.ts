import { useState } from 'react';
import { toast } from 'sonner';
import JSZip from 'jszip';
import type { MultimediaPropiedad } from '../types';

export const useGalleryCore = () => {
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);

  const handleToggleSelection = (id: string) => {
    const newSelected = new Set(selectedMediaIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedMediaIds(newSelected);
  };

  const clearSelection = () => setSelectedMediaIds(new Set());

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadSingle = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      downloadBlob(blob, filename);
      toast.success('Descarga iniciada');
    } catch (err) {
      console.error('Error al descargar:', err);
      toast.error('No se pudo descargar la imagen');
    }
  };

  const handleBulkDownload = async (mediaList: MultimediaPropiedad[], zipName: string) => {
    if (mediaList.length === 0) return;
    try {
      setIsDownloading(true);
      const toastId = toast.loading(`Preparando descarga de ${mediaList.length} imágenes...`);
      const zip = new JSZip();
      
      const downloadPromises = mediaList.map(async (item, index) => {
        const response = await fetch(item.urlPublica);
        const blob = await response.blob();
        const extension = item.urlPublica.split('.').pop()?.split('?')[0] || 'webp';
        const filename = `imagen_${index + 1}.${extension}`;
        zip.file(filename, blob);
      });

      await Promise.all(downloadPromises);
      const content = await zip.generateAsync({ type: 'blob' });
      downloadBlob(content, `${zipName}.zip`);
      toast.dismiss(toastId);
      toast.success('Galería descargada con éxito');
    } catch (err) {
      console.error('Error al crear ZIP:', err);
      toast.error('Error al generar el archivo de descarga');
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    selectedMediaIds,
    handleToggleSelection,
    clearSelection,
    isDownloading,
    handleDownloadSingle,
    handleBulkDownload,
  };
};
