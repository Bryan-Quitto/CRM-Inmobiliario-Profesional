import useSWR from 'swr';
import { useState, useMemo } from 'react';
import { api } from '@/lib/axios';
import Fuse from 'fuse.js';

export interface AgentConversation {
  id: string;
  title: string;
  updatedAt: string;
}

const fetcher = (url: string) => api.get<AgentConversation[]>(url).then(res => res.data);

export const usePersonalLogs = () => {
  const { data: conversations = [], error, isLoading, mutate } = useSWR('/conversations', fetcher, {
    revalidateOnFocus: false,
  });

  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Configuramos Fuse para búsqueda en cliente
  const fuse = useMemo(() => {
    return new Fuse(conversations, {
      keys: ['title', 'id', 'updatedAt'],
      threshold: 0.3,
      ignoreLocation: true,
    });
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const results = fuse.search(search);
    return results.map(result => result.item);
  }, [search, fuse, conversations]);

  return {
    conversations: filteredConversations,
    isLoading,
    error,
    search,
    setSearch,
    confirmDeleteId,
    setConfirmDeleteId,
    mutate,
  };
};
