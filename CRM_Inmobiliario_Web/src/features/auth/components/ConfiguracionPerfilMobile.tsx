import React from 'react';
import type { UseConfiguracionPerfilLogicReturn } from '../hooks/useConfiguracionPerfilLogic';
import BrandingSection from './configuracion-sections/BrandingSection';
import DatosPersonalesForm from './configuracion-sections/DatosPersonalesForm';
import SeguridadSection from './configuracion-sections/SeguridadSection';
import PdfBrandingPreview from './configuracion-sections/PdfBrandingPreview';

interface Props {
  logic: UseConfiguracionPerfilLogicReturn;
}

const ConfiguracionPerfilMobile: React.FC<Props> = ({ logic }) => {
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
    <div className="w-full px-4 py-4 bg-slate-50 min-h-screen">
      <header className="mb-4 text-center">
        <h1 className="text-lg md:text-xl md:text-2xl font-black text-slate-900 tracking-tight">Mi Perfil</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Identidad y branding</p>
      </header>

      <div className="flex flex-col space-y-4">
        
        <div className="w-full">
          <BrandingSection 
            userId={perfil.id}
            fotoUrl={formData.fotoUrl}
            logoUrl={formData.logoUrl}
            onUpdate={actualizarPerfil}
            setFormData={setFormData}
            formData={formData}
          />
        </div>

        <div className="w-full">
          <DatosPersonalesForm 
            formData={formData}
            setFormData={setFormData}
            perfil={perfil}
            showSuccess={showSuccess}
            handleSubmit={handleSubmit}
          />
        </div>

        <div className="w-full">
          <SeguridadSection 
            pwdData={pwdData}
            setPwdData={setPwdData}
            isUpdatingPwd={isUpdatingPwd}
            validations={validations}
            allValid={allValid}
            handleUpdatePassword={handleUpdatePassword}
          />
        </div>

        <div className="w-full">
          <PdfBrandingPreview 
            formData={formData}
            perfil={perfil}
          />
        </div>
        
      </div>
    </div>
  );
};

export default ConfiguracionPerfilMobile;
