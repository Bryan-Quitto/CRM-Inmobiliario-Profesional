import { useState, useMemo } from 'react';

export interface RangoFechas {
  inicio: Date;
  fin: Date;
  label: string;
}

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const useAnaliticaState = () => {
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
  const [semanaIndice, setSemanaIndice] = useState<number | 'total'>('total');
  const [anioSeleccionado] = useState(new Date().getFullYear());
  const [showMesDropdown, setShowMesDropdown] = useState(false);

  const semanasDelMes = useMemo(() => {
    const rawSemanas: { inicio: Date; fin: Date }[] = [];
    const primerDia = new Date(anioSeleccionado, mesSeleccionado, 1);
    const ultimoDia = new Date(anioSeleccionado, mesSeleccionado + 1, 0, 23, 59, 59);

    let current = new Date(primerDia);
    while (current <= ultimoDia) {
      const inicio = new Date(current);
      const diaSemana = inicio.getDay();
      const diasHastaDomingo = diaSemana === 0 ? 0 : 7 - diaSemana;
      let fin = new Date(inicio);
      fin.setDate(inicio.getDate() + diasHastaDomingo);
      fin.setHours(23, 59, 59);

      if (fin > ultimoDia) fin = new Date(ultimoDia);
      rawSemanas.push({ inicio, fin });
      
      current = new Date(fin);
      current.setDate(fin.getDate() + 1);
      current.setHours(0, 0, 0, 0);
    }

    const clustered: RangoFechas[] = [];
    for (let i = 0; i < rawSemanas.length; i++) {
      const item = rawSemanas[i];
      const diffMs = item.fin.getTime() - item.inicio.getTime();
      const durationDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (i === 0 && durationDays < 4 && rawSemanas.length > 1) {
        rawSemanas[i + 1].inicio = item.inicio;
        continue;
      }
      if (i === rawSemanas.length - 1 && durationDays < 4 && clustered.length > 0) {
        clustered[clustered.length - 1].fin = item.fin;
        continue;
      }

      clustered.push({
        inicio: item.inicio,
        fin: item.fin,
        label: `S${clustered.length + 1}`
      });
    }

    return clustered;
  }, [anioSeleccionado, mesSeleccionado]);

  const rangoActual = useMemo(() => {
    if (semanaIndice === 'total') {
      return {
        inicio: new Date(anioSeleccionado, mesSeleccionado, 1),
        fin: new Date(anioSeleccionado, mesSeleccionado + 1, 0, 23, 59, 59)
      };
    }
    const s = semanasDelMes[semanaIndice] || semanasDelMes[0];
    return { inicio: s.inicio, fin: s.fin };
  }, [semanaIndice, semanasDelMes, anioSeleccionado, mesSeleccionado]);

  return {
    mesSeleccionado,
    setMesSeleccionado,
    semanaIndice,
    setSemanaIndice,
    anioSeleccionado,
    showMesDropdown,
    setShowMesDropdown,
    semanasDelMes,
    rangoActual
  };
};
