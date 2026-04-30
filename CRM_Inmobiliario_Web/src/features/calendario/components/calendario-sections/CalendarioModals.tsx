import React from 'react';
import { TareaDetalle } from '../../../tareas/components/TareaDetalle';
import ConfirmModal from '../../../../components/ConfirmModal';
import type { Tarea } from '../../../tareas/types';

// Carga perezosa de los formularios de tareas para no penalizar el calendario
const CrearTareaForm = React.lazy(() => import('../../../tareas/components/CrearTareaForm').then(m => ({ default: m.CrearTareaForm })));
const EditarTareaForm = React.lazy(() => import('../../../tareas/components/EditarTareaForm').then(m => ({ default: m.EditarTareaForm })));

interface CalendarioModalsProps {
  isCrearOpen: boolean;
  viewingTareaId: string | null;
  editingTareaId: string | null;
  isConfirmingCancel: boolean;
  selectedDate: string | null;
  formKey: number;
  selectedTarea: Tarea | null;
  onCloseAll: () => void;
  onSuccessCrear: () => void;
  onSuccessEdit: () => void;
  onCancelConfirm: () => void;
  onEditRequest: () => void;
  onCancelTaskRequest: () => void;
  onBackFromDetail: () => void;
  onCloseConfirm: () => void;
}

export const CalendarioModals: React.FC<CalendarioModalsProps> = ({
  isCrearOpen,
  viewingTareaId,
  editingTareaId,
  isConfirmingCancel,
  selectedDate,
  formKey,
  selectedTarea,
  onCloseAll,
  onSuccessCrear,
  onSuccessEdit,
  onCancelConfirm,
  onEditRequest,
  onCancelTaskRequest,
  onBackFromDetail,
  onCloseConfirm
}) => {
  return (
    <React.Suspense fallback={null}>
      {(isCrearOpen || viewingTareaId || editingTareaId) && (
        <div className="fixed inset-0 z-[300] flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="absolute inset-0 cursor-pointer" onClick={onCloseAll}></div>

          <div className="relative w-full max-w-lg h-full bg-white shadow-2xl animate-in slide-in-from-right duration-500 border-l border-slate-100">
            {isCrearOpen && (
              <CrearTareaForm
                key={`crear-${formKey}`}
                fechaInicial={selectedDate || undefined}
                onSuccess={onSuccessCrear}
                onCancel={onCloseAll}
              />
            )}
            {viewingTareaId && selectedTarea && (
              <TareaDetalle
                tarea={selectedTarea}
                onEdit={onEditRequest}
                onCancelTask={onCancelTaskRequest}
                onBack={onBackFromDetail}
              />
            )}
            {editingTareaId && selectedTarea && (
              <EditarTareaForm
                tareaId={editingTareaId}
                initialData={selectedTarea}
                onSuccess={onSuccessEdit}
                onCancel={onCloseAll}
                onCancelTask={onCancelTaskRequest}
              />
            )}
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={isConfirmingCancel}
        title="¿Cancelar Tarea?"
        description="Esta acción no se puede deshacer. La tarea quedará marcada como cancelada en el historial."
        confirmText="Sí, cancelar"
        type="danger"
        onConfirm={onCancelConfirm}
        onClose={onCloseConfirm}
      />
    </React.Suspense>
  );
};
