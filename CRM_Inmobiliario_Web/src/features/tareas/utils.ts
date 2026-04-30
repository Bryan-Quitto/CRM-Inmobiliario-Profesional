export const formatDateTime = (dateString: string) => {
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString)).replace('.', '');
};

export const isExpired = (dateString: string) => {
  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999);
  return new Date(dateString) <= hoy;
};
