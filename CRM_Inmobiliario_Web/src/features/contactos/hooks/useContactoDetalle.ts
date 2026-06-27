import { useState } from 'react';
import { useContactoBase } from './useContactoBase';
import { useContactoTimeline } from './useContactoTimeline';
import { useContactoInterests } from './useContactoInterests';
import { useContactoStage } from './useContactoStage';
import { useContactoArchive } from './useContactoArchive';

export const useContactoDetalle = () => {
  const base = useContactoBase();
  const { contacto, id, mutate, globalMutate } = base;

  const timeline = useContactoTimeline({ contacto, id, mutate, globalMutate });
  const interests = useContactoInterests({ contacto, id, mutate, globalMutate });
  const stage = useContactoStage({ contacto, id, mutate, globalMutate });
  const archive = useContactoArchive({ contacto, mutate, globalMutate });

  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);

  return {
    ...base,
    ...timeline,
    ...interests,
    ...stage,
    ...archive,
    isMergeModalOpen,
    setIsMergeModalOpen
  };
};
