export const formatDateTime = (dateString: string) => {
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString)).replace('.', '');
};

export const isExpired = (dateString: string, duracionMinutos: number = 0) => {
  const ahora = new Date();
  const finTarea = new Date(dateString);
  finTarea.setMinutes(finTarea.getMinutes() + duracionMinutos);
  return finTarea < ahora;
};
