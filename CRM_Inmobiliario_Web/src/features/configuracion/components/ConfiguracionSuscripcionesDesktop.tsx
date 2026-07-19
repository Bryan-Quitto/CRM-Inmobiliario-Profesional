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

export const ConfiguracionSuscripcionesDesktop = () => {
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
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-600 h-8 w-8" /></div>;
  }

  if (isError) {
    return <div className="p-8 text-center text-red-500 font-medium">Error al cargar la lista de suscripciones.</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Administración de Suscripciones</h2>
          <p className="text-sm text-slate-500 mt-1">Gestiona los planes, renovaciones y el estado de los agentes.</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-bold">Agente</th>
              <th className="px-6 py-4 font-bold">Plan</th>
              <th className="px-6 py-4 font-bold">Estado</th>
              <th className="px-6 py-4 font-bold">Vencimiento</th>
              <th className="px-6 py-4 font-bold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suscripciones.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No hay suscripciones registradas.
                </td>
              </tr>
            ) : (
              suscripciones.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {sub.agentName}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                      sub.planTier === 'Pro' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {sub.planTier === 'Pro' ? <Zap className="h-3.5 w-3.5" /> : null}
                      {sub.planTier}
                    </span>
                  </td>
                  <td className="px-6 py-4">
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
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex flex-col">
                      <span>{new Date(sub.currentPeriodEnd).toLocaleDateString()}</span>
                      <span className={`text-xs ${sub.remainingDays < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                        {sub.remainingDays < 0 ? `${Math.abs(sub.remainingDays)} días vencido` : `${sub.remainingDays} días restantes`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleActivateClick(sub.agentId, sub.agentName, 'Normal', sub.status, sub.planTier)}
                        className="cursor-pointer text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors"
                      >
                        {sub.status === 'Active' && sub.planTier === 'Normal' ? 'Renovar Normal' : 'Activar Normal'}
                      </button>
                      <button
                        onClick={() => handleActivateClick(sub.agentId, sub.agentName, 'Pro', sub.status, sub.planTier)}
                        className="cursor-pointer text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                      >
                        {sub.status === 'Active' && sub.planTier === 'Pro' ? 'Renovar Pro' : 'Activar Pro'}
                      </button>
                      <button
                        onClick={() => expireSubscription(sub.id)}
                        disabled={sub.status === 'Expired'}
                        className="cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                      >
                        Expirar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
