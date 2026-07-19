import { Loader2, Archive, ArchiveRestore } from 'lucide-react';
import React from 'react';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { toast } from 'sonner';

interface ArchiveToggleButtonProps {
  isArchived: boolean;
  isToggling: boolean;
  onToggle: (e?: React.MouseEvent) => void | Promise<void>;
  className?: string;
  testId?: string;
}

export const ArchiveToggleButton = ({
  isArchived,
  isToggling,
  onToggle,
  className = '',
  testId = 'btn-toggle-archive',
}: ArchiveToggleButtonProps) => {
  const { canWrite } = useSubscriptionGuard();

  return (
    <button
      data-testid={testId}
      onClick={(e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (!canWrite) {
          toast.warning('Tu suscripción ha vencido. Contacta al administrador para renovar.');
          return;
        }
        onToggle(e);
      }}
      disabled={isToggling}
      className={`h-7 w-7 rounded-full transition-all shadow-sm border flex items-center justify-center ${!canWrite ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${
        isArchived
          ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
          : 'bg-white text-slate-400 hover:text-slate-700 border-slate-200 hover:bg-slate-50'
      } ${className}`}
      title={isArchived ? 'Desarchivar' : 'Archivar'}
    >
      {isToggling ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : isArchived ? (
        <ArchiveRestore className="h-3.5 w-3.5" />
      ) : (
        <Archive className="h-3.5 w-3.5" />
      )}
    </button>
  );
};
