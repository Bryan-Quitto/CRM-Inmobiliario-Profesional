import type { ReactNode } from 'react';
import { usePerfil } from '@/features/auth/api/perfil';
import { TermsOfServiceModal } from '@/features/legal/components/TermsOfServiceModal';
import { useLocation } from 'react-router-dom';

interface TermsOfServiceWrapperProps {
  children: ReactNode;
}

export const TermsOfServiceWrapper = ({ children }: TermsOfServiceWrapperProps) => {
  const { perfil, isLoading } = usePerfil();
  const location = useLocation();

  // If loading or profile doesn't exist yet, we just render children 
  // (app might show loaders, or wait for auth)
  if (isLoading || !perfil) {
    return <>{children}</>;
  }

  const currentVersion = import.meta.env.VITE_CURRENT_TOS_VERSION || '';
  
  // If the backend has no version, or it's different from the current version
  // and currentVersion is actually defined in the .env, we block.
  // We bypass the block if the user is already trying to read the terms or privacy policy.
  const isLegalPage = location.pathname === '/terminos' || location.pathname === '/privacidad';
  const needsAcceptance = !isLegalPage && currentVersion && perfil.terminosAceptadosVersion !== currentVersion;

  return (
    <>
      {needsAcceptance && <TermsOfServiceModal />}
      {children}
    </>
  );
};
