import useSWR from 'swr';
import { api } from '@/lib/axios';
import { swrDefaultConfig } from '@/lib/swr';
import type { PropertyFaq, CreateFaqDto, EditarFaqDto, RechazarFaqDto } from '../types/faq.types';

const fetcher = (url: string) => api.get<PropertyFaq[]>(url).then(r => r.data);

export const useFaqLogic = (propiedadId: string, canManage: boolean) => {
  const key = `/propiedades/${propiedadId}/faqs`;

  const { data: faqs = [], isLoading, error, mutate } = useSWR<PropertyFaq[]>(
    propiedadId ? key : null,
    fetcher,
    { ...swrDefaultConfig, keepPreviousData: true }
  );

  const crear = async (dto: CreateFaqDto): Promise<void> => {
    const optimistic: PropertyFaq = {
      id: `temp-${Date.now()}`,
      propiedadId,
      pregunta: dto.pregunta,
      respuesta: dto.respuesta,
      estado: canManage ? 'Aprobada' : 'Borrador',
      creadoPorAgenteId: '',
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
    };
    await mutate(
      async (current = []) => {
        const { data } = await api.post<PropertyFaq>(key, dto);
        return [...current, data];
      },
      { optimisticData: (current = []) => [...current, optimistic], rollbackOnError: true }
    );
  };

  const editar = async (faqId: string, dto: EditarFaqDto): Promise<void> => {
    await mutate(
      async (current = []) => {
        const { data } = await api.put<PropertyFaq>(`/faqs/${faqId}`, dto);
        return current.map(f => (f.id === faqId ? data : f));
      },
      {
        optimisticData: (current = []) =>
          current.map(f =>
            f.id === faqId ? { ...f, ...dto, fechaActualizacion: new Date().toISOString() } : f
          ),
        rollbackOnError: true,
      }
    );
  };

  const enviarARevision = async (faqId: string): Promise<void> => {
    await mutate(
      async (current = []) => {
        await api.post(`/faqs/${faqId}/enviar-revision`);
        return current.map(f => (f.id === faqId ? { ...f, estado: 'EnRevision' as const } : f));
      },
      {
        optimisticData: (current = []) =>
          current.map(f => (f.id === faqId ? { ...f, estado: 'EnRevision' as const } : f)),
        rollbackOnError: true,
      }
    );
  };

  const aprobar = async (faqId: string): Promise<void> => {
    await mutate(
      async (current = []) => {
        await api.post(`/faqs/${faqId}/aprobar`);
        return current.map(f => (f.id === faqId ? { ...f, estado: 'Aprobada' as const } : f));
      },
      {
        optimisticData: (current = []) =>
          current.map(f => (f.id === faqId ? { ...f, estado: 'Aprobada' as const } : f)),
        rollbackOnError: true,
      }
    );
  };

  const rechazar = async (faqId: string, dto: RechazarFaqDto): Promise<void> => {
    await mutate(
      async (current = []) => {
        await api.post(`/faqs/${faqId}/rechazar`, dto);
        return current.map(f =>
          f.id === faqId ? { ...f, estado: 'Rechazada' as const, notaRechazo: dto.notaRechazo } : f
        );
      },
      {
        optimisticData: (current = []) =>
          current.map(f =>
            f.id === faqId
              ? { ...f, estado: 'Rechazada' as const, notaRechazo: dto.notaRechazo }
              : f
          ),
        rollbackOnError: true,
      }
    );
  };

  const desactivar = async (faqId: string): Promise<void> => {
    await mutate(
      async (current = []) => {
        await api.post(`/faqs/${faqId}/desactivar`);
        return current.map(f => (f.id === faqId ? { ...f, estado: 'Desactivada' as const } : f));
      },
      {
        optimisticData: (current = []) =>
          current.map(f => (f.id === faqId ? { ...f, estado: 'Desactivada' as const } : f)),
        rollbackOnError: true,
      }
    );
  };

  const reactivar = async (faqId: string): Promise<void> => {
    await mutate(
      async (current = []) => {
        await api.post(`/faqs/${faqId}/reactivar`);
        return current.map(f => (f.id === faqId ? { ...f, estado: 'Aprobada' as const } : f));
      },
      {
        optimisticData: (current = []) =>
          current.map(f => (f.id === faqId ? { ...f, estado: 'Aprobada' as const } : f)),
        rollbackOnError: true,
      }
    );
  };

  const eliminarBorrador = async (faqId: string): Promise<void> => {
    await mutate(
      async (current = []) => {
        await api.delete(`/faqs/${faqId}`);
        return current.filter(f => f.id !== faqId);
      },
      {
        optimisticData: (current = []) => current.filter(f => f.id !== faqId),
        rollbackOnError: true,
      }
    );
  };

  return {
    faqs,
    isLoading,
    error,
    crear,
    editar,
    enviarARevision,
    aprobar,
    rechazar,
    desactivar,
    reactivar,
    eliminarBorrador,
  };
};
