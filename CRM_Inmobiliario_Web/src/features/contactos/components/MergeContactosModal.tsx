import type { Contacto } from '../types';
import { useMergeContactosLogic } from '../hooks/useMergeContactosLogic';
import { MergeContactosModalDesktop } from './MergeContactosModalDesktop';
import { MergeContactosModalMobile } from './MergeContactosModalMobile';
import { useIsMobile } from '@/hooks/useIsMobile';

interface MergeContactosModalProps {
  contactoOriginal: Contacto;
  onClose: () => void;
  onSuccess: (nuevoPrincipalId: string) => void;
}

export const MergeContactosModal = (props: MergeContactosModalProps) => {
  const logic = useMergeContactosLogic(props);
  const isMobile = useIsMobile();

  return (
    <>
      {isMobile ? (
        <MergeContactosModalMobile logic={logic} />
      ) : (
        <MergeContactosModalDesktop logic={logic} />
      )}
    </>
  );
};
