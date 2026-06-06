import useSWR from 'swr';
import { useState, useMemo } from 'react';
import { api } from '@/lib/axios';
import Fuse from 'fuse.js';

export interface AgentConversation {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
}

const fetcher = (url: string) => api.get<AgentConversation[]>(url).then(res => res.data);

export const usePersonalLogs = () => {
  const { data: conversations = [], error, isLoading, mutate } = useSWR('/conversations', fetcher, {
    revalidateOnFocus: false,
  });

  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt'>('updatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Configuramos Fuse para búsqueda en cliente
  const fuse = useMemo(() => {
    return new Fuse(conversations, {
      keys: ['title', 'id', 'updatedAt'],
      threshold: 0.3,
      ignoreLocation: true,
    });
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    let result = [...conversations];
    
    if (search.trim()) {
      const fuseResults = fuse.search(search);
      result = fuseResults.map(r => r.item);
    }
    
    return result.sort((a, b) => {
      const dateA = new Date(a[sortBy]).getTime();
      const dateB = new Date(b[sortBy]).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [search, fuse, conversations, sortBy, sortDirection]);

  return {
    conversations: filteredConversations,
    isLoading,
    error,
    search,
    setSearch,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    confirmDeleteId,
    setConfirmDeleteId,
    mutate,
  };
};
