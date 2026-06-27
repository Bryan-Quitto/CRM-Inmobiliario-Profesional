import { useAuth } from '../../auth/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

export const useConfiguracionLayoutLogic = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  let currentPath = location.pathname.split('/').filter(Boolean).pop() || 'perfil';
  if (currentPath === 'configuracion') {
    currentPath = 'perfil';
  }

  const handleMobileNavigation = (path: string) => {
    navigate(path);
  };

  return {
    isAdmin,
    currentPath,
    handleMobileNavigation,
  };
};

export type ConfiguracionLayoutLogicReturn = ReturnType<typeof useConfiguracionLayoutLogic>;
