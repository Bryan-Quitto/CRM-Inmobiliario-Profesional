import { api as axios } from '../../../lib/axios';
import type { ReprogramarEventoCommand } from '../types';

export const reprogramarEvento = async (id: string, command: ReprogramarEventoCommand): Promise<void> => {
  await axios.patch(`/calendario/${id}/reprogramar`, command);
};
