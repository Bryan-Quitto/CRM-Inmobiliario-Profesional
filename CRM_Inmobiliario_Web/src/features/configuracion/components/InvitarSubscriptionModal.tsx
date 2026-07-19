import { useState } from 'react';
import ConfirmModal from '@/components/ConfirmModal';
import { MailPlus } from 'lucide-react';

interface InvitarSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (months: number, notes: string) => Promise<void>;
  email: string;
  planTier: string;
}

export function InvitarSubscriptionModal({
  isOpen,
  onClose,
  onConfirm,
  email,
  planTier,
}: InvitarSubscriptionModalProps) {
  const [months, setMonths] = useState(1);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      icon={<MailPlus className="h-10 w-10 text-indigo-500" />}
      title={`Asignar Plan ${planTier}`}
      description={`Estás a punto de enviar una invitación a ${email}. Selecciona la duración del plan que se activará cuando el usuario complete su registro.`}
      confirmText="Enviar Invitación"
      cancelText="Cancelar"
      isDeleting={isLoading}
    >
      <div className="space-y-4 text-left mt-4">
        <div>
          <label htmlFor="months" className="block text-sm font-bold text-slate-700 mb-1">
            Meses de validez (desde la activación)
          </label>
          <input
            id="months"
            type="number"
            min="1"
            max="60"
            value={months}
            onChange={(e) => setMonths(Number(e.target.value) || 1)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
            required
          />
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-bold text-slate-700 mb-1">
            Notas de pago / Referencia interna
          </label>
          <textarea
            id="notes"
            placeholder="Ej: Transferencia Banco Pichincha, cortesía, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700 resize-none custom-scrollbar"
            rows={3}
            required
          />
        </div>
      </div>
    </ConfirmModal>
  );
}
