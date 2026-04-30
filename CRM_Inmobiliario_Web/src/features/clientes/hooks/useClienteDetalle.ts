import { useClienteBase } from './useClienteBase';
import { useClienteTimeline } from './useClienteTimeline';
import { useClienteInterests } from './useClienteInterests';
import { useClienteStage } from './useClienteStage';

export const useClienteDetalle = () => {
  const base = useClienteBase();
  const { cliente, id, mutate, globalMutate } = base;

  const timeline = useClienteTimeline({ cliente, id, mutate, globalMutate });
  const interests = useClienteInterests({ cliente, id, mutate, globalMutate });
  const stage = useClienteStage({ cliente, id, mutate, globalMutate });

  return {
    ...base,
    ...timeline,
    ...interests,
    ...stage
  };
};
