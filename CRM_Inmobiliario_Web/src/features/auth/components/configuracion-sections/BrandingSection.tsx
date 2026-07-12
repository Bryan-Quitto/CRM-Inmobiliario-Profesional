import React from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react';
import FotoPerfilUpload from '../FotoPerfilUpload';
import LogoAgenciaUpload from '../LogoAgenciaUpload';
import CuotaSection from './CuotaSection';
import type { FormDataPerfil } from '../../hooks/useConfiguracionPerfil';
import type { PerfilAgente } from '../../api/perfil';
import type { UseFormReturn } from 'react-hook-form';

interface BrandingSectionProps {
  userId: string;
  onUpdate: (data: Partial<PerfilAgente>) => Promise<void>;
  methods: UseFormReturn<FormDataPerfil>;
  perfil: PerfilAgente;
}

const BrandingSection: React.FC<BrandingSectionProps> = ({ 
  userId, 
  onUpdate, 
  methods,
  perfil 
}) => {
  const formData = methods.watch();
  return (
    <div className="lg:col-span-1 space-y-8">
      {/* Card: Foto de Perfil */}
      <div className="bg-white p-6 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center justify-center gap-2">
          <Camera size={16} className="shrink-0" /> Foto de Perfil
        </h3>
        <FotoPerfilUpload 
          userId={userId} 
          currentFotoUrl={formData.fotoUrl || ''}
          onUploadSuccess={async (url) => {
            methods.setValue('fotoUrl', url, { shouldDirty: true });
            await onUpdate(methods.getValues() as Partial<PerfilAgente>);
          }}
          onDeleteSuccess={async () => {
            methods.setValue('fotoUrl', '', { shouldDirty: true });
            await onUpdate(methods.getValues() as Partial<PerfilAgente>);
          }}
        />
        <p className="text-xs text-slate-400 mt-6 contactoing-relaxed">
          Esta foto se usará en tus fichas técnicas y en la barra lateral.
        </p>
      </div>

      {/* Card: Logo de Agencia */}
      <div className="bg-white p-6 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center justify-center gap-2">
          <ImageIcon size={16} className="shrink-0" /> Logo Corporativo
        </h3>
        <LogoAgenciaUpload 
          userId={userId} 
          currentLogoUrl={formData.logoUrl || ''}
          onUploadSuccess={async (url) => {
            methods.setValue('logoUrl', url, { shouldDirty: true });
            await onUpdate(methods.getValues() as Partial<PerfilAgente>);
          }}
          onDeleteSuccess={async () => {
            methods.setValue('logoUrl', '', { shouldDirty: true });
            await onUpdate(methods.getValues() as Partial<PerfilAgente>);
          }}
        />
        <p className="text-xs text-slate-400 mt-6 contactoing-relaxed">
          El logo aparecerá en la cabecera de tus PDFs profesionales.
        </p>
      </div>

      {/* Uso de Plataforma */}
      <CuotaSection perfil={perfil} />
    </div>
  );
};

export default BrandingSection;
