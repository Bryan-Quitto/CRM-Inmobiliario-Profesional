import React from 'react';
import { Database, AlertTriangle, Loader2, X } from 'lucide-react';
import { BaseConocimientoSection } from './BaseConocimientoSection';
import type { UseConfiguracionIALogicReturn } from '../hooks/useConfiguracionIALogic';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { toast } from 'sonner';

interface ConfiguracionIAMobileProps {
  logic: UseConfiguracionIALogicReturn;
}

export const ConfiguracionIAMobile: React.FC<ConfiguracionIAMobileProps> = ({ logic }) => {
  const { canWrite } = useSubscriptionGuard();

  return (
    <div className="space-y-4">
      {/* Propiedades */}
      <section className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Database size={24} />
          </div>
          <h2 className="text-lg md:text-xl font-bold text-slate-800 leading-tight flex-1 min-w-0 break-words">Vectorización de Propiedades</h2>
        </div>
        
        <p className="text-slate-600 text-sm mb-5 leading-relaxed break-words">
          Sincroniza los embeddings vectoriales de las propiedades para las búsquedas semánticas y recomendaciones.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              if (!canWrite) {
                toast.warning('Tu suscripción ha vencido. Contacta al administrador para renovar.');
                return;
              }
              logic.handleVectorize(false);
            }}
            disabled={logic.isVectorizing}
            className={`w-full flex justify-center items-center gap-2 py-3.5 bg-blue-600 text-white rounded-xl font-bold active:scale-95 transition-transform disabled:opacity-50 ${!canWrite ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {logic.isVectorizing ? <Loader2 size={18} className="animate-spin shrink-0" /> : <Database size={18} className="shrink-0" />}
            Vectorizar Faltantes
          </button>
          
          <button
            onClick={() => {
              if (!canWrite) {
                toast.warning('Tu suscripción ha vencido. Contacta al administrador para renovar.');
                return;
              }
              logic.setShowForceModal(true);
            }}
            disabled={logic.isVectorizing}
            className={`w-full flex justify-center items-center gap-2 py-3.5 bg-slate-50 text-rose-600 border border-slate-200 rounded-xl font-bold active:scale-95 transition-transform disabled:opacity-50 ${!canWrite ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <AlertTriangle size={18} className="shrink-0" />
            Forzar Todas
          </button>
        </div>
      </section>

      {/* Documentos */}
      <section className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 delay-75">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <Database size={24} />
          </div>
          <h2 className="text-lg md:text-xl font-bold text-slate-800 leading-tight flex-1 min-w-0 break-words">Vectorización de Documentos</h2>
        </div>
        
        <p className="text-slate-600 text-sm mb-5 leading-relaxed break-words">
          Sincroniza los embeddings vectoriales de la Base de Conocimiento Corporativa.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              if (!canWrite) {
                toast.warning('Tu suscripción ha vencido. Contacta al administrador para renovar.');
                return;
              }
              logic.handleVectorizeDocs(false);
            }}
            disabled={logic.isVectorizingDocs}
            className={`w-full flex justify-center items-center gap-2 py-3.5 bg-indigo-600 text-white rounded-xl font-bold active:scale-95 transition-transform disabled:opacity-50 ${!canWrite ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {logic.isVectorizingDocs ? <Loader2 size={18} className="animate-spin shrink-0" /> : <Database size={18} className="shrink-0" />}
            Vectorizar Faltantes
          </button>
          
          <button
            onClick={() => {
              if (!canWrite) {
                toast.warning('Tu suscripción ha vencido. Contacta al administrador para renovar.');
                return;
              }
              logic.setShowForceDocsModal(true);
            }}
            disabled={logic.isVectorizingDocs}
            className={`w-full flex justify-center items-center gap-2 py-3.5 bg-slate-50 text-rose-600 border border-slate-200 rounded-xl font-bold active:scale-95 transition-transform disabled:opacity-50 ${!canWrite ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <AlertTriangle size={18} className="shrink-0" />
            Forzar Todas
          </button>
        </div>
      </section>

      <BaseConocimientoSection />

      {/* Modal Force Vectorización Propiedades (Mobile Style) */}
      {logic.showForceModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl sm:max-w-sm p-4 animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-5">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <button 
                onClick={() => logic.setShowForceModal(false)}
                className="p-2 bg-slate-100 text-slate-500 rounded-full active:bg-slate-200 shrink-0 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <h3 className="text-lg md:text-xl font-black text-slate-800 mb-2 break-words">¿Forzar Re-Vectorización?</h3>
            <p className="text-slate-600 text-sm mb-4 leading-relaxed break-words">
              Se sobrescribirán los vectores existentes. Esto consumirá tokens del proveedor IA por cada propiedad. ¿Continuar?
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => logic.handleVectorize(true)}
                className="w-full py-3.5 font-bold text-white bg-rose-600 rounded-xl active:bg-rose-700 shadow-sm shadow-rose-600/20 cursor-pointer"
              >
                Sí, Forzar Todas
              </button>
              <button
                onClick={() => logic.setShowForceModal(false)}
                className="w-full py-3.5 font-bold text-slate-700 bg-slate-100 rounded-xl active:bg-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Force Vectorización Docs (Mobile Style) */}
      {logic.showForceDocsModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl sm:max-w-sm p-4 animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-5">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <button 
                onClick={() => logic.setShowForceDocsModal(false)}
                className="p-2 bg-slate-100 text-slate-500 rounded-full active:bg-slate-200 shrink-0 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <h3 className="text-lg md:text-xl font-black text-slate-800 mb-2 break-words">¿Re-Vectorizar Documentos?</h3>
            <p className="text-slate-600 text-sm mb-4 leading-relaxed break-words">
              Se sobrescribirán los vectores de todos los documentos. Esto consumirá tokens del proveedor IA. ¿Continuar?
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => logic.handleVectorizeDocs(true)}
                className="w-full py-3.5 font-bold text-white bg-rose-600 rounded-xl active:bg-rose-700 shadow-sm shadow-rose-600/20 cursor-pointer"
              >
                Sí, Forzar Todos
              </button>
              <button
                onClick={() => logic.setShowForceDocsModal(false)}
                className="w-full py-3.5 font-bold text-slate-700 bg-slate-100 rounded-xl active:bg-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
