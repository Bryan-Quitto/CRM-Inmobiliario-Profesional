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
    <div className="bg-slate-900 rounded-[40px] p-6 sm:p-10 text-white relative overflow-hidden group shadow-2xl border border-white/5 w-full max-w-3xl mx-auto">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full -mr-32 -mt-32 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/10 rounded-full -ml-24 -mb-24 blur-3xl" />

      <div className="absolute top-6 left-8 text-[10px] font-black text-white/20 tracking-widest uppercase">
        Previsualización de PDF (Propiedades)
      </div>

      <div className="mt-8 flex-1 flex flex-col bg-slate-900/50 p-8 shadow-inner border border-white/10 rounded-3xl min-h-[500px] relative z-10 backdrop-blur-sm">
        {/* Header */}
        <div className="flex flex-row items-center justify-between gap-6 mb-4">
          {/* Agent Info (Left) */}
          <div className="flex flex-row items-center gap-5 text-left">
            <div className="w-14 h-14 shrink-0 bg-white/10 rounded-full flex items-center justify-center overflow-hidden border border-white/20 ring-4 ring-white/5">
              {formData.fotoUrl ? (
                <img src={formData.fotoUrl} alt="Foto del Agente" className="w-full h-full object-cover" />
              ) : (
                <User size={24} className="text-white/30 shrink-0" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-0.5">Contacto</span>
              <span className="text-base font-black text-white leading-tight">
                {[formData.nombre, formData.apellido].filter(Boolean).join(' ') || 'Nombre Agente'}
              </span>
              <span className="text-xs font-medium text-indigo-400 mt-0.5">
                {formData.telefono || 'Sin teléfono'}
              </span>
              <span className="text-[10px] font-bold text-white/50 uppercase mt-0.5">
                {perfil?.agenciaNombre || 'Nombre de la Agencia'}
              </span>
            </div>
          </div>

          {/* Agency Logo (Right) */}
          <div className="h-12 w-auto min-w-[6rem] max-w-[10rem] flex justify-end">
            {formData.logoUrl ? (
              <img src={formData.logoUrl} alt="Logo de la Agencia" className="h-full object-contain" />
            ) : (
              <div className="flex flex-col items-end">
                <span className="text-lg font-black text-indigo-400 uppercase">
                  {perfil?.agenciaNombre || 'Agencia'}
                </span>
                <span className="text-[8px] font-bold text-white/40 tracking-[0.2em] uppercase">
                  Ficha Técnica
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Divider Line */}
        <div className="h-[2px] w-full bg-slate-700 mb-6" />

        {/* Body placeholder */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="h-5 w-40 bg-white/10 rounded-full mb-2" />
              <div className="h-2 w-56 bg-white/5 rounded-full" />
            </div>
            <div className="text-right">
              <div className="h-5 w-24 bg-indigo-500/20 rounded-full mb-2 ml-auto" />
              <div className="h-2 w-16 bg-indigo-500/10 rounded-full ml-auto" />
            </div>
          </div>
          
          <div className="w-full h-48 bg-white/5 rounded-2xl mb-4 flex items-center justify-center border border-white/5">
             <span className="text-white/20 font-bold tracking-widest uppercase text-sm">Foto Principal</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t-2 border-slate-700 flex justify-between items-start">
          <div className="text-left flex flex-col gap-0.5">
            <div className="text-[10px]">
              <span className="text-white/40">Ficha técnica generada por </span>
              <span className="text-indigo-400 font-bold">Ziel Luxora CRM</span>
            </div>
            <div className="text-[8px] text-white/30">
              Documento de carácter informativo. Sujeto a cambios sin previo aviso.
            </div>
          </div>
          <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest text-right">
            Página <span className="font-black text-indigo-400">1</span> de <span className="font-black text-indigo-400">1</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfBrandingPreview;

