import React from 'react';
import type { UseConfiguracionPerfilLogicReturn } from '../hooks/useConfiguracionPerfilLogic';
import BrandingSection from './configuracion-sections/BrandingSection';
import DatosPersonalesForm from './configuracion-sections/DatosPersonalesForm';
import SeguridadSection from './configuracion-sections/SeguridadSection';
import PdfBrandingPreview from './configuracion-sections/PdfBrandingPreview';

interface Props {
  logic: UseConfiguracionPerfilLogicReturn;
}

const ConfiguracionPerfilDesktop: React.FC<Props> = ({ logic }) => {
  const {
    perfil,
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
  } = logic;

  if (!perfil) return null;

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

export default ConfiguracionPerfilDesktop;
