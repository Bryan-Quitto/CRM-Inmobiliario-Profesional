import { MiSuscripcionDesktop } from './MiSuscripcionDesktop';
import { MiSuscripcionMobile } from './MiSuscripcionMobile';
import { useMySubscription } from '../hooks/useMySubscription';

export const MiSuscripcion = () => {
  const { suscripcion, isLoading, isError } = useMySubscription();

  return (
    <>
      <div className="hidden lg:block">
        <MiSuscripcionDesktop 
          suscripcion={suscripcion} 
          isLoading={isLoading}
          isError={isError}
        />
      </div>
      <div className="block lg:hidden">
        <MiSuscripcionMobile 
          suscripcion={suscripcion} 
          isLoading={isLoading} 
          isError={isError}
        />
      </div>
    </>
  );
};
