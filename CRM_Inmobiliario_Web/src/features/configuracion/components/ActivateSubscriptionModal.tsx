import { useState } from 'react';
import ConfirmModal from '@/components/ConfirmModal';
import { Zap } from 'lucide-react';

interface ActivateSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (months: number, notes: string) => Promise<void>;
  agentName: string;
  planTier: string;
  isRenewal: boolean;
}

export function ActivateSubscriptionModal({
  isOpen,
  onClose,
  onConfirm,
  agentName,
  planTier,
  isRenewal
}: ActivateSubscriptionModalProps) {
  const [months, setMonths] = useState(1);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle form reset on close
  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setMonths(1);
      setNotes('');
      setIsLoading(false);
    }, 200);
  };

  const handleSubmit = async () => {
    if (!notes.trim()) return;
    setIsLoading(true);
    try {
      await onConfirm(months, notes);
      onClose();
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleSubmit}
      type="info"
      icon={<Zap className="h-10 w-10 text-blue-500" />}
      title={isRenewal ? `Renovar Plan ${planTier}` : `Activar Plan ${planTier}`}
      description={isRenewal 
        ? `Estás a punto de renovar el plan de ${agentName}. Los días se sumarán a su saldo actual.`
        : `Estás a punto de activar el plan para ${agentName}.`}
      confirmText={isRenewal ? "Confirmar Renovación" : "Confirmar Activación"}
      cancelText="Cancelar"
      isDeleting={isLoading}
    >
      <div className="space-y-4 text-left">
        <div>
          <label htmlFor="months" className="block text-sm font-bold text-slate-700 mb-1">
            Meses a {isRenewal ? 'renovar' : 'activar'}
          </label>
          <input
            id="months"
            type="number"
            min="1"
            max="12"
            value={months}
            onChange={(e) => setMonths(Number(e.target.value) || 1)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
            required
          />
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-bold text-slate-700 mb-1">
            Notas de pago / Referencia
          </label>
          <textarea
            id="notes"
            placeholder="Ej: Transferencia Banco Produbanco #123456"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700 resize-none custom-scrollbar"
            rows={3}
            required
          />
        </div>
      </div>
    </ConfirmModal>
  );
}
