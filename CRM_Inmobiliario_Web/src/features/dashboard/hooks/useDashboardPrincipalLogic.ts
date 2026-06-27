import { usePerfil } from '../../auth/api/perfil';
import { useDashboardKpis } from './useDashboardKpis';
import { usePushNotifications } from '../../../hooks/usePushNotifications';

export const useDashboardPrincipalLogic = () => {
  const { perfil } = usePerfil();
  const { data, syncing } = useDashboardKpis();
  const { isSupported, isSubscribed } = usePushNotifications();

  const greeting = perfil?.nombre
    ? [perfil.nombre, perfil.apellido].filter(Boolean).join(' ')
    : 'Agente';

  return {
    perfil,
    data,
    syncing,
    isSupported,
    isSubscribed,
    greeting
  };
};

export type DashboardPrincipalLogicType = ReturnType<typeof useDashboardPrincipalLogic>;
