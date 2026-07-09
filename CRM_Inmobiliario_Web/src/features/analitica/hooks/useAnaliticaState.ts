import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';

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
  const { mes } = useParams<{ mes?: string }>();
  
  const mesSeleccionado = useMemo(() => {
    if (mes) {
      const idx = MESES.findIndex(m => m.toLowerCase() === mes.toLowerCase());
      if (idx !== -1) return idx;
    }
    return new Date().getMonth();
  }, [mes]);

  const [semanaIndice, setSemanaIndice] = useState<number | 'total'>('total');

  // Reset semanaIndice when month changes via URL
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSemanaIndice('total');
  }, [mesSeleccionado]);
  const [anioSeleccionado] = useState(new Date().getFullYear());
  const [showMesDropdown, setShowMesDropdown] = useState(false);

  const semanasDelMes = useMemo(() => {
    const primerDia = new Date(anioSeleccionado, mesSeleccionado, 1);
    const ultimoDia = new Date(anioSeleccionado, mesSeleccionado + 1, 0, 23, 59, 59);

    const firstDayOfWeek = primerDia.getDay(); // 0 is Sunday, 1 is Monday...
    const daysToSubtract = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    const currentMonday = new Date(primerDia);
    currentMonday.setDate(currentMonday.getDate() - daysToSubtract);
    currentMonday.setHours(0, 0, 0, 0);

    const semanas: RangoFechas[] = [];
    
    while (currentMonday <= ultimoDia) {
      const inicio = new Date(currentMonday);
      
      const fin = new Date(currentMonday);
      fin.setDate(fin.getDate() + 6);
      fin.setHours(23, 59, 59, 999);
      
      semanas.push({
        inicio,
        fin,
        label: `S${semanas.length + 1}`
      });
      
      // Move to next Monday
      currentMonday.setDate(currentMonday.getDate() + 7);
    }
    
    return semanas;
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
    semanaIndice,
    setSemanaIndice,
    anioSeleccionado,
    showMesDropdown,
    setShowMesDropdown,
    semanasDelMes,
    rangoActual
  };
};
