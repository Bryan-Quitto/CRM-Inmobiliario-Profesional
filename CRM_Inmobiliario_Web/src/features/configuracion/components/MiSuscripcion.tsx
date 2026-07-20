import { MiSuscripcionDesktop } from './MiSuscripcionDesktop';
import { MiSuscripcionMobile } from './MiSuscripcionMobile';
import { useMySubscription } from '../hooks/useMySubscription';
import { useIsMobile } from '@/hooks/useIsMobile';

export const MiSuscripcion = () => {
  const { suscripcion, isLoading, isError } = useMySubscription();

  const isMobile = useIsMobile();
  return (
    <>
      {isMobile ? (
        <MiSuscripcionMobile 
          suscripcion={suscripcion} 
          isLoading={isLoading} 
          isError={isError}
        />
      ) : (
        <MiSuscripcionDesktop 
          suscripcion={suscripcion} 
          isLoading={isLoading}
          isError={isError}
        />
      )}
    </>
  );
};
