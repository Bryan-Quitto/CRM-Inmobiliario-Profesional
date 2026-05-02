import { useContactoBase } from './useContactoBase';
import { useContactoTimeline } from './useContactoTimeline';
import { useContactoInterests } from './useContactoInterests';
import { useContactoStage } from './useContactoStage';

export const useContactoDetalle = () => {
  const base = useContactoBase();
  const { contacto, id, mutate, globalMutate } = base;

  const timeline = useContactoTimeline({ contacto, id, mutate, globalMutate });
  const interests = useContactoInterests({ contacto, id, mutate, globalMutate });
  const stage = useContactoStage({ contacto, id, mutate, globalMutate });

  return {
    ...base,
    ...timeline,
    ...interests,
    ...stage
  };
};
