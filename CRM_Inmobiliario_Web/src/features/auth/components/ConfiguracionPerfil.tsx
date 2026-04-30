import React from 'react';
import { Loader2 } from 'lucide-react';
import { useConfiguracionPerfil } from '../hooks/useConfiguracionPerfil';
import BrandingSection from './configuracion-sections/BrandingSection';
import DatosPersonalesForm from './configuracion-sections/DatosPersonalesForm';
import SeguridadSection from './configuracion-sections/SeguridadSection';
import PdfBrandingPreview from './configuracion-sections/PdfBrandingPreview';

const ConfiguracionPerfil: React.FC = () => {
  const {
    perfil,
    isLoading,
    formData,
    setFormData,
    showSuccess,
    handleSubmit,
    pwdData,
    setPwdData,
    isUpdatingPwd,
    validations,
    allValid,
    handleUpdatePassword,
    actualizarPerfil
  } = useConfiguracionPerfil();

  if (isLoading || !perfil) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] animate-in fade-in duration-500">
        <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Sincronizando perfil corporativo...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Configuración del Perfil</h1>
        <p className="text-slate-500 font-medium mt-2">Gestiona tu identidad personal y branding corporativo para el CRM y PDFs.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <BrandingSection 
          userId={perfil.id}
          fotoUrl={formData.fotoUrl}
          logoUrl={formData.logoUrl}
          onUpdate={actualizarPerfil}
          setFormData={setFormData}
          formData={formData}
        />

        <div className="lg:col-span-2 space-y-8">
          <DatosPersonalesForm 
            formData={formData}
            setFormData={setFormData}
            perfil={perfil}
            showSuccess={showSuccess}
            handleSubmit={handleSubmit}
          />

          <SeguridadSection 
            pwdData={pwdData}
            setPwdData={setPwdData}
            isUpdatingPwd={isUpdatingPwd}
            validations={validations}
            allValid={allValid}
            handleUpdatePassword={handleUpdatePassword}
          />

          <PdfBrandingPreview 
            formData={formData}
            perfil={perfil}
          />
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionPerfil;
