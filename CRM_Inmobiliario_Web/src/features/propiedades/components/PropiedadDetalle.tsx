import { SWRConfig } from 'swr';
import { localStorageProvider } from '@/lib/swr';
import { usePropiedadDetalleLogic } from '../hooks/usePropiedadDetalleLogic';
import { PropiedadDetalleDesktop } from './PropiedadDetalleDesktop';
import { PropiedadDetalleMobile } from './PropiedadDetalleMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

interface PropiedadDetalleProps {
  id: string;
  onClose: () => void;
  onCoverUpdated?: (newUrl: string) => void;
}

const PropiedadDetalleOrchestrator = (props: PropiedadDetalleProps) => {
  const logic = usePropiedadDetalleLogic(props);
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <PropiedadDetalleMobile id={props.id} onClose={props.onClose} logic={logic} />
      ) : (
        <PropiedadDetalleDesktop id={props.id} onClose={props.onClose} logic={logic} />
      )}
    </>
  );
};

export const PropiedadDetalle = (props: PropiedadDetalleProps) => {
  return (
    <SWRConfig value={{ provider: localStorageProvider }}>
      <PropiedadDetalleOrchestrator {...props} />
    </SWRConfig>
  );
};
