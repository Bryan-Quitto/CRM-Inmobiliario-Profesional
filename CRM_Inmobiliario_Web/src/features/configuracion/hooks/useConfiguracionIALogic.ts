import { useState } from 'react';
import { api } from '../../../lib/axios';
import { toast } from 'sonner';

export const useConfiguracionIALogic = () => {
  const [isVectorizing, setIsVectorizing] = useState(false);
  const [showForceModal, setShowForceModal] = useState(false);

  const [isVectorizingDocs, setIsVectorizingDocs] = useState(false);
  const [showForceDocsModal, setShowForceDocsModal] = useState(false);

  const handleVectorize = async (force: boolean) => {
    setIsVectorizing(true);
    if (force) setShowForceModal(false);
    
    try {
      const response = await api.post('/admin/re-vectorize', { force });
      const count = response.data?.count || 0;
      toast.success('Proceso en segundo plano iniciado', { 
        description: force 
          ? `La re-vectorización de todas las propiedades (${count}) ha comenzado.` 
          : `La vectorización de ${count} propiedades faltantes ha comenzado.` 
      });
    } catch {
      toast.error('Error al iniciar la vectorización');
    } finally {
      setIsVectorizing(false);
    }
  };

  const handleVectorizeDocs = async (force: boolean) => {
    setIsVectorizingDocs(true);
    if (force) setShowForceDocsModal(false);
    
    try {
      const response = await api.post('/admin/re-vectorize-docs', { force });
      const count = response.data?.count || 0;
      toast.success('Proceso en segundo plano iniciado', { 
        description: force 
          ? `La re-vectorización de todos los documentos (${count}) ha comenzado.` 
          : `La vectorización de ${count} documentos faltantes ha comenzado.` 
      });
    } catch {
      toast.error('Error al iniciar la vectorización de documentos');
    } finally {
      setIsVectorizingDocs(false);
    }
  };

  return {
    isVectorizing,
    showForceModal,
    setShowForceModal,
    isVectorizingDocs,
    showForceDocsModal,
    setShowForceDocsModal,
    handleVectorize,
    handleVectorizeDocs
  };
};

export type UseConfiguracionIALogicReturn = ReturnType<typeof useConfiguracionIALogic>;
