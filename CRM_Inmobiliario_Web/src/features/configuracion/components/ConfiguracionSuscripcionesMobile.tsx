import { useState } from 'react';
import { useSubscriptionManagement } from '../hooks/useSubscriptionManagement';
import { Loader2, Zap, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { ActivateSubscriptionModal } from './ActivateSubscriptionModal';

const getEstadoUI = (status: string) => {
  if (status === 'Active') return 'Activo';
  if (status === 'PastDue') return 'Vencido';
  if (status === 'Expired') return 'Expirado';
  return status;
};

export const ConfiguracionSuscripcionesMobile = () => {
  const { suscripciones, isLoading, isError, expireSubscription, activatePlan } = useSubscriptionManagement();

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    agentId: string;
    agentName: string;
    planTier: string;
    isRenewal: boolean;
  }>({
    isOpen: false,
    agentId: '',
    agentName: '',
    planTier: 'Normal',
    isRenewal: false,
  });

  const handleActivateClick = (agentId: string, agentName: string, planTier: string, currentStatus: string, currentTier: string) => {
    const isRenewal = (currentStatus === 'Active' || currentStatus === 'PastDue') && currentTier === planTier;
    setModalState({
      isOpen: true,
      agentId,
      agentName,
      planTier,
      isRenewal
    });
  };

  const handleConfirmActivate = async (months: number, notes: string) => {
    await activatePlan(modalState.agentId, modalState.planTier, notes, months);
  };

  if (isLoading) {
    return <div className="p-6 flex justify-center"><Loader2 className="animate-spin text-blue-600 h-8 w-8" /></div>;
  }

  if (isError) {
    return <div className="p-6 text-center text-red-500 font-medium">Error al cargar la lista de suscripciones.</div>;
  }

  return (
    <div className="bg-white p-4">
      <h2 className="text-xl font-bold text-slate-800 mb-2">Suscripciones</h2>
      <p className="text-sm text-slate-500 mb-6">Gestiona los planes y agentes.</p>

      <div className="space-y-4">
        {suscripciones.length === 0 ? (
          <div className="text-center text-slate-500 py-6 bg-slate-50 rounded-xl">
            No hay suscripciones registradas.
          </div>
        ) : (
          suscripciones.map((sub) => (
            <div key={sub.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-slate-800">{sub.agentName}</h3>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                  sub.planTier === 'Pro' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {sub.planTier === 'Pro' ? <Zap className="h-3 w-3" /> : null}
                  {sub.planTier}
                </span>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                  sub.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  sub.status === 'PastDue' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {sub.status === 'Active' ? <CheckCircle className="h-3.5 w-3.5" /> :
                   sub.status === 'PastDue' ? <Clock className="h-3.5 w-3.5" /> :
                   <AlertCircle className="h-3.5 w-3.5" />}
                  {getEstadoUI(sub.status)}
                </span>
                
                <div className="text-right">
                  <p className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">Vence</p>
                  <p className="text-sm font-medium text-slate-800">
                    {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                  </p>
                  <p className={`text-[10px] ${sub.remainingDays < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                    {sub.remainingDays < 0 ? `${Math.abs(sub.remainingDays)}d vencido` : `${sub.remainingDays}d restantes`}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between gap-2">
                <button
                  onClick={() => handleActivateClick(sub.agentId, sub.agentName, 'Normal', sub.status, sub.planTier)}
                  className="cursor-pointer flex-1 text-[10px] font-bold px-2 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors"
                >
                  {sub.status === 'Active' && sub.planTier === 'Normal' ? 'Renovar N.' : 'Activar Normal'}
                </button>
                <button
                  onClick={() => handleActivateClick(sub.agentId, sub.agentName, 'Pro', sub.status, sub.planTier)}
                  className="cursor-pointer flex-1 text-[10px] font-bold px-2 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                >
                  {sub.status === 'Active' && sub.planTier === 'Pro' ? 'Renovar Pro' : 'Activar Pro'}
                </button>
                <button
                  onClick={() => expireSubscription(sub.id)}
                  disabled={sub.status === 'Expired'}
                  className="cursor-pointer flex-1 disabled:opacity-50 disabled:cursor-not-allowed text-[10px] font-bold px-2 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                >
                  Expirar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ActivateSubscriptionModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState(s => ({ ...s, isOpen: false }))}
        onConfirm={handleConfirmActivate}
        agentName={modalState.agentName}
        planTier={modalState.planTier}
        isRenewal={modalState.isRenewal}
      />
    </div>
  );
};
