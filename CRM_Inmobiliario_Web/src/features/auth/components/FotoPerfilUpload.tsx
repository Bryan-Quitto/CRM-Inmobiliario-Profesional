import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import imageCompression from 'browser-image-compression';
import { Camera, Trash2, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import ConfirmModal from '@/components/ConfirmModal';

interface FotoPerfilUploadProps {
  userId: string;
  currentFotoUrl?: string;
  onUploadSuccess: (url: string) => void;
  onDeleteSuccess: () => void;
}

const FotoPerfilUpload: React.FC<FotoPerfilUploadProps> = ({ 
  userId, 
  currentFotoUrl, 
  onUploadSuccess, 
  onDeleteSuccess 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const compressImage = async (file: File) => {
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 800,
      useWebWorker: true,
      fileType: 'image/webp'
    };
    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.error('Error comprimiendo imagen:', error);
      return file;
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato no soportado', { description: 'Usa JPG, PNG o WebP.' });
      return;
    }

    setIsUploading(true);
    try {
      const compressedFile = await compressImage(file);
      const fileExt = 'webp';
      const fileName = `${userId}/profile-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('perfiles')
        .upload(fileName, compressedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('perfiles')
        .getPublicUrl(fileName);

      if (currentFotoUrl) {
        const oldPath = currentFotoUrl.split('/perfiles/')[1];
        if (oldPath) {
          await supabase.storage.from('perfiles').remove([oldPath]);
        }
      }

      onUploadSuccess(publicUrl);
      toast.success('Foto de perfil actualizada');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error al subir foto', { description: message });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async () => {
    if (!currentFotoUrl) return;

    setIsUploading(true);
    try {
      const path = currentFotoUrl.split('/perfiles/')[1];
      if (path) {
        const { error } = await supabase.storage.from('perfiles').remove([path]);
        if (error) throw error;
      }
      onDeleteSuccess();
      toast.success('Foto eliminada correctamente');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast.error('Error al eliminar foto', { description: message });
    } finally {
      setIsUploading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-100 flex items-center justify-center relative">
          {currentFotoUrl ? (
            <img 
              src={currentFotoUrl} 
              alt="Perfil" 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-16 h-16 text-slate-300" />
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center backdrop-blur-[2px]">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>

        <label 
          className={`absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full shadow-lg cursor-pointer hover:bg-indigo-700 transition-all transform hover:scale-110 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
          title="Cambiar foto"
        >
          <Camera size={20} />
          <input 
            type="file" 
            className="hidden" 
            accept="image/*" 
            onChange={handleUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      {currentFotoUrl && !isUploading && (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="text-xs font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 transition-colors uppercase tracking-widest cursor-pointer"
        >
          <Trash2 size={14} /> Eliminar Foto
        </button>
      )}

      {/* Modal de Confirmación Estilizado */}
      <ConfirmModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="¿Eliminar foto de perfil?"
        description="Esta acción eliminará permanentemente tu foto del servidor."
        confirmText="Sí, eliminar"
        isDeleting={isUploading}
      />
    </div>
  );
};

export default FotoPerfilUpload;
