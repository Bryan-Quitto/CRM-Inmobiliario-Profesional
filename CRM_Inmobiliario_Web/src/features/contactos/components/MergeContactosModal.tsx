import type { Contacto } from '../types';
import { useMergeContactosLogic } from '../hooks/useMergeContactosLogic';
import { MergeContactosModalDesktop } from './MergeContactosModalDesktop';
import { MergeContactosModalMobile } from './MergeContactosModalMobile';

interface MergeContactosModalProps {
  contactoOriginal: Contacto;
  onClose: () => void;
  onSuccess: (nuevoPrincipalId: string) => void;
}

export const MergeContactosModal = (props: MergeContactosModalProps) => {
  const logic = useMergeContactosLogic(props);

  return (
    <>
      <div className="hidden lg:block">
        <MergeContactosModalDesktop logic={logic} />
      </div>
      <div className="block lg:hidden">
        <MergeContactosModalMobile logic={logic} />
      </div>
    </>
  );
};
