import React from 'react';
import { User } from 'lucide-react';
import type { FormDataPerfil } from '../../hooks/useConfiguracionPerfil';
import type { PerfilAgente } from '../../api/perfil';

interface PdfBrandingPreviewProps {
  formData: FormDataPerfil;
  perfil: PerfilAgente;
}

const PdfBrandingPreview: React.FC<PdfBrandingPreviewProps> = ({ formData, perfil }) => {
  return (
    <div className="bg-slate-900 rounded-[40px] p-6 text-white relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full -mr-32 -mt-32 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/10 rounded-full -ml-24 -mb-24 blur-3xl" />

      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-white/10">
          <h3 className="text-lg font-black tracking-tighter uppercase text-indigo-400">Previsualización de Branding</h3>
          <div className="h-8 px-3 bg-white/10 rounded-full flex items-center text-[10px] font-black tracking-widest uppercase border border-white/10">
            Formato PDF A4
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-6 mb-12">
          <div className="h-16 w-48 shrink-0 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden">
            {formData.logoUrl ? (
              <img src={formData.logoUrl} alt="Logo Preview" className="max-w-[80%] max-h-[80%] object-contain" />
            ) : (
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Logo Agencia</span>
            )}
          </div>
          <div className="text-center sm:text-right">
            <div className="h-2 w-32 bg-white/20 rounded-full mb-2 mx-auto sm:ml-auto sm:mr-0" />
            <div className="h-2 w-20 bg-white/10 rounded-full mx-auto sm:ml-auto sm:mr-0" />
          </div>
        </div>

        <div className="mt-16 pt-6 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-6">
            <div className="w-16 h-16 shrink-0 bg-white/10 rounded-2xl flex items-center justify-center overflow-hidden border border-white/20 ring-4 ring-white/5">
              {formData.fotoUrl ? (
                <img src={formData.fotoUrl} alt="Foto Preview" className="w-full h-full object-cover" />
              ) : (
                <User size={32} className="text-white/20 shrink-0" />
              )}
            </div>
            <div>
              <p className="text-xl font-black tracking-tight">{[formData.nombre, formData.apellido].filter(Boolean).join(' ')}</p>
              <p className="text-indigo-400 font-bold text-sm tracking-wide">{perfil?.agenciaNombre || 'Agente Independiente'}</p>
              <p className="text-white/40 text-xs font-bold mt-1 tracking-widest uppercase">{formData.telefono || 'Sin teléfono'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfBrandingPreview;
