import React from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react';
import FotoPerfilUpload from '../FotoPerfilUpload';
import LogoAgenciaUpload from '../LogoAgenciaUpload';
import type { FormDataPerfil } from '../../hooks/useConfiguracionPerfil';
import type { PerfilAgente } from '../../api/perfil';

interface BrandingSectionProps {
  userId: string;
  fotoUrl: string;
  logoUrl: string;
  onUpdate: (data: Partial<PerfilAgente>) => Promise<void>;
  setFormData: React.Dispatch<React.SetStateAction<FormDataPerfil>>;
  formData: FormDataPerfil;
}

const BrandingSection: React.FC<BrandingSectionProps> = ({ 
  userId, 
  fotoUrl, 
  logoUrl, 
  onUpdate, 
  setFormData,
  formData 
}) => {
  return (
    <div className="lg:col-span-1 space-y-8">
      {/* Card: Foto de Perfil */}
      <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center justify-center gap-2">
          <Camera size={16} /> Foto de Perfil
        </h3>
        <FotoPerfilUpload 
          userId={userId} 
          currentFotoUrl={fotoUrl}
          onUploadSuccess={async (url) => {
            const nuevosDatos = { ...formData, fotoUrl: url };
            setFormData(nuevosDatos);
            await onUpdate(nuevosDatos);
          }}
          onDeleteSuccess={async () => {
            const nuevosDatos = { ...formData, fotoUrl: '' };
            setFormData(nuevosDatos);
            await onUpdate(nuevosDatos);
          }}
        />
        <p className="text-xs text-slate-400 mt-6 contactoing-relaxed">
          Esta foto se usará en tus fichas técnicas y en la barra lateral.
        </p>
      </div>

      {/* Card: Logo de Agencia */}
      <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center justify-center gap-2">
          <ImageIcon size={16} /> Logo Corporativo
        </h3>
        <LogoAgenciaUpload 
          userId={userId} 
          currentLogoUrl={logoUrl}
          onUploadSuccess={async (url) => {
            const nuevosDatos = { ...formData, logoUrl: url };
            setFormData(nuevosDatos);
            await onUpdate(nuevosDatos);
          }}
          onDeleteSuccess={async () => {
            const nuevosDatos = { ...formData, logoUrl: '' };
            setFormData(nuevosDatos);
            await onUpdate(nuevosDatos);
          }}
        />
        <p className="text-xs text-slate-400 mt-6 contactoing-relaxed">
          El logo aparecerá en la cabecera de tus PDFs profesionales.
        </p>
      </div>
    </div>
  );
};

export default BrandingSection;
