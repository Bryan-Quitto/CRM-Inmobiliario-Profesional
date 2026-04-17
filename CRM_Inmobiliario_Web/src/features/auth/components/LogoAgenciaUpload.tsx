import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import imageCompression from 'browser-image-compression';
import { Image, Trash2, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmModal from '@/components/ConfirmModal';

interface LogoAgenciaUploadProps {
  userId: string;
  currentLogoUrl?: string;
  onUploadSuccess: (url: string) => void;
  onDeleteSuccess: () => void;
}

const LogoAgenciaUpload: React.FC<LogoAgenciaUploadProps> = ({ 
  userId, 
  currentLogoUrl, 
  onUploadSuccess, 
  onDeleteSuccess 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const compressLogo = async (file: File) => {
    const options = {
      maxSizeMB: 0.3, // Logos deben ser ligeros
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      fileType: 'image/webp'
    };
    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.error('Error comprimiendo logo:', error);
      return file;
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato no soportado', { description: 'Usa JPG, PNG, WebP o SVG.' });
      return;
    }

    setIsUploading(true);
    try {
      const compressedFile = await compressLogo(file);
      const fileExt = 'webp';
      const fileName = `${userId}/logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('perfiles') // Reutilizamos el bucket perfiles para simplicidad
        .upload(fileName, compressedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('perfiles')
        .getPublicUrl(fileName);

      if (currentLogoUrl) {
        const oldPath = currentLogoUrl.split('/perfiles/')[1];
        if (oldPath) {
          await supabase.storage.from('perfiles').remove([oldPath]);
        }
      }

      onUploadSuccess(publicUrl);
      toast.success('Logo de la agencia actualizado');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error al subir logo', { description: message });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async () => {
    if (!currentLogoUrl) return;

    setIsUploading(true);
    try {
      const path = currentLogoUrl.split('/perfiles/')[1];
      if (path) {
        const { error } = await supabase.storage.from('perfiles').remove([path]);
        if (error) throw error;
      }
      onDeleteSuccess();
      toast.success('Logo eliminado correctamente');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error al eliminar logo', { description: message });
    } finally {
      setIsUploading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group w-full max-w-[280px]">
        {/* Contenedor del logo (Rectangular) */}
        <div className="aspect-[3/1] w-full rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center relative overflow-hidden transition-all group-hover:border-indigo-300">
          {currentLogoUrl ? (
            <img 
              src={currentLogoUrl} 
              alt="Logo Agencia" 
              className="max-w-[85%] max-h-[85%] object-contain"
            />
          ) : (
            <div className="flex flex-col items-center text-gray-400">
              <Image size={32} className="mb-2" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Logo Agencia</span>
            </div>
          )}

          {/* Overlay de carga */}
          {isUploading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center backdrop-blur-sm">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          )}

          {/* Botón de cambio overlay */}
          {!isUploading && (
            <label className="absolute inset-0 flex items-center justify-center bg-indigo-600/0 hover:bg-indigo-600/10 transition-all">
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handleUpload}
                disabled={isUploading}
              />
            </label>
          )}
        </div>

        {/* Botón flotante de subida rápida */}
        <label className="absolute -top-3 -right-3 p-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all hover:scale-110">
          <Upload size={16} />
          <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
        </label>
      </div>

      {currentLogoUrl && !isUploading && (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="text-[10px] font-bold text-gray-400 hover:text-rose-500 flex items-center gap-1 transition-colors uppercase tracking-widest cursor-pointer"
        >
          <Trash2 size={12} /> Quitar Logo
        </button>
      )}

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="¿Quitar logo de la agencia?"
        description="Esta acción eliminará el logo corporativo de tus fichas técnicas."
        confirmText="Sí, quitar"
        isDeleting={isUploading}
      />
    </div>
  );
};

export default LogoAgenciaUpload;
