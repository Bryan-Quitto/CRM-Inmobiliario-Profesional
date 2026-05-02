import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import type { KeyedMutator, ScopedMutator } from 'swr';
import { registrarInteraccion } from '../api/registrarInteraccion';
import { actualizarInteraccion } from '../api/actualizarInteraccion';
import { eliminarInteraccion } from '../api/eliminarInteraccion';
import type { Contacto, Interaccion } from '../types';

interface Params {
  contacto: Contacto | undefined;
  id: string | undefined;
  mutate: KeyedMutator<Contacto>;
  globalMutate: ScopedMutator;
}

export const useContactoTimeline = ({ contacto, id, mutate, globalMutate }: Params) => {
  const [nuevaNota, setNuevaNota] = useState('');
  const [tipoNota, setTipoNota] = useState('Nota');
  const [notaEnEdicion, setNotaEnEdicion] = useState<string | null>(null);
  const [isSavingNota, setIsSavingNota] = useState(false);
  const [searchHistorial, setSearchHistorial] = useState('');
  const [filterTipoTimeline, setFilterTipoTimeline] = useState('Todos');
  const [idInteraccionABorrar, setIdInteraccionABorrar] = useState<string | null>(null);

  const handleSaveNota = async () => {
    if (!nuevaNota.trim() || !id) return;
    setIsSavingNota(true);

    const isEdit = !!notaEnEdicion;
    const idNota = notaEnEdicion;
    const notaParaActualizar = nuevaNota;
    const tipoParaActualizar = tipoNota;

    const previousInteracciones = [...(contacto?.interacciones || [])];

    try {
      if (isEdit) {
        const nuevasInteracciones = previousInteracciones.map(i => i.id === idNota ? { ...i, notas: notaParaActualizar, tipoInteraccion: tipoParaActualizar } : i);
        const optimisticData = { ...contacto!, interacciones: nuevasInteracciones };
        
        mutate(optimisticData, false);
        setNotaEnEdicion(null);
        setNuevaNota('');
        setTipoNota('Nota');

        await actualizarInteraccion(idNota!, notaParaActualizar, tipoParaActualizar);
        toast.success('Nota actualizada');
      } else {
        const tipoAGuardar = tipoNota;
        const textoAGuardar = nuevaNota;

        const nuevaInteraccion: Interaccion = {
          id: `temp-${Date.now()}`,
          tipoInteraccion: tipoAGuardar,
          notas: textoAGuardar,
          fechaInteraccion: new Date().toISOString()
        };

        const optimisticData = { ...contacto!, interacciones: [nuevaInteraccion, ...previousInteracciones] };
        mutate(optimisticData, false);
        setNuevaNota('');
        setTipoNota('Nota');

        await registrarInteraccion({
          contactoId: id,
          tipoInteraccion: tipoAGuardar,
          notas: textoAGuardar
        });
        toast.success('Interacción registrada');
      }
      
      await mutate();
      globalMutate('/dashboard/kpis');
      globalMutate(key => typeof key === 'string' && key.startsWith('/analitica/'));

    } catch (err) {
      console.error('Error al guardar nota:', err);
      toast.error('No se pudo guardar la nota');
      mutate();
    } finally {
      setIsSavingNota(false);
    }
  };

  const handleEditarNota = (interaccion: Interaccion) => {
    setNotaEnEdicion(interaccion.id);
    setTipoNota(interaccion.tipoInteraccion);
    setNuevaNota(interaccion.notas);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEliminarNota = async (interaccionId: string) => {
    if (!contacto) return;
    const previousInteracciones = [...(contacto.interacciones || [])];

    try {
      const optimisticData = { 
        ...contacto, 
        interacciones: previousInteracciones.filter(i => i.id !== interaccionId) 
      };
      mutate(optimisticData, false);

      await eliminarInteraccion(interaccionId);
      toast.success('Nota eliminada');
      await mutate();
      globalMutate('/dashboard/kpis');
      globalMutate(key => typeof key === 'string' && key.startsWith('/analitica/'));
    } catch (err) {
      console.error('Error al eliminar nota:', err);
      toast.error('No se pudo eliminar la nota');
      mutate();
    }
  };

  const historialFiltrado = useMemo(() => {
    if (!contacto?.interacciones) return [];
    return contacto.interacciones.filter(i => {
      const matchesSearch = i.notas.toLowerCase().includes(searchHistorial.toLowerCase()) || 
                           i.tipoInteraccion.toLowerCase().includes(searchHistorial.toLowerCase());
      const matchesTipo = filterTipoTimeline === 'Todos' || i.tipoInteraccion === filterTipoTimeline;
      return matchesSearch && matchesTipo;
    });
  }, [contacto, searchHistorial, filterTipoTimeline]);

  return {
    nuevaNota,
    setNuevaNota,
    tipoNota,
    setTipoNota,
    notaEnEdicion,
    setNotaEnEdicion,
    isSavingNota,
    searchHistorial,
    setSearchHistorial,
    filterTipoTimeline,
    setFilterTipoTimeline,
    idInteraccionABorrar,
    setIdInteraccionABorrar,
    handleSaveNota,
    handleEditarNota,
    handleEliminarNota,
    historialFiltrado
  };
};
