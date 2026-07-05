import { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useAgentes } from './useAgentes';
import { toast } from 'sonner';
import { activarAgenteInvitado } from '../api/activarAgenteInvitado';

export const useConfiguracionAgentesLogic = () => {
  const { user, isAdmin } = useAuth();
  const { agentes, isLoading, mutate } = useAgentes();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<{ id: string, nombre: string } | null>(null);

  const [reactivarModalOpen, setReactivarModalOpen] = useState(false);
  const [selectedReactivarAgent, setSelectedReactivarAgent] = useState<{ id: string, nombre: string } | null>(null);

  const [activarInvitadoModalOpen, setActivarInvitadoModalOpen] = useState(false);
  const [selectedInvitadoAgent, setSelectedInvitadoAgent] = useState<{ id: string, nombre: string } | null>(null);

  const [eliminarModalOpen, setEliminarModalOpen] = useState(false);
  const [selectedEliminarAgent, setSelectedEliminarAgent] = useState<{ id: string, nombre: string } | null>(null);

  const handleDesactivarClick = (agenteId: string, nombre: string, apellido: string) => {
    setSelectedAgent({ id: agenteId, nombre: `${nombre} ${apellido}` });
    setModalOpen(true);
  };

  const handleEliminarClick = (agenteId: string, nombre: string, apellido: string) => {
    setSelectedEliminarAgent({ id: agenteId, nombre: `${nombre} ${apellido}` });
    setEliminarModalOpen(true);
  };

  const handleReactivarClick = (agenteId: string, nombre: string, apellido: string) => {
    setSelectedReactivarAgent({ id: agenteId, nombre: `${nombre} ${apellido}` });
    setReactivarModalOpen(true);
  };

  const handleActivarInvitadoClick = (agenteId: string, nombre: string, apellido: string) => {
    setSelectedInvitadoAgent({ id: agenteId, nombre: `${nombre} ${apellido}` });
    setActivarInvitadoModalOpen(true);
  };

  const handleActivarInvitadoSubmit = async (newEmail: string, agenciaId: string | null) => {
    if (!selectedInvitadoAgent) return;
    const previousAgentes = agentes;
    
    // Optimistic update local cache
    mutate(
      agentes?.map(a => a.id === selectedInvitadoAgent.id ? { ...a, email: newEmail } : a),
      false
    );

    try {
      await activarAgenteInvitado({
        id: selectedInvitadoAgent.id,
        realEmail: newEmail,
        agenciaId: agenciaId
      });
      toast.success('Invitación enviada', {
        description: `Se ha enviado la invitación a ${newEmail} exitosamente.`
      });
      mutate();
    } catch (error) {
      // Rollback on error
      mutate(previousAgentes, false);
      throw error;
    }
  };

  return {
    user,
    isAdmin,
    agentes,
    isLoading,
    mutate,
    modalOpen,
    setModalOpen,
    selectedAgent,
    eliminarModalOpen,
    setEliminarModalOpen,
    selectedEliminarAgent,
    reactivarModalOpen,
    setReactivarModalOpen,
    selectedReactivarAgent,
    activarInvitadoModalOpen,
    setActivarInvitadoModalOpen,
    selectedInvitadoAgent,
    handleDesactivarClick,
    handleEliminarClick,
    handleReactivarClick,
    handleActivarInvitadoClick,
    handleActivarInvitadoSubmit,
  };
};

export type ConfiguracionAgentesLogic = ReturnType<typeof useConfiguracionAgentesLogic>;
