import React from 'react';
import { Trash2, Loader2, AlertCircle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDeleting?: boolean;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Sí, eliminar',
  cancelText = 'Cancelar',
  isDeleting = false,
  type = 'danger'
}) => {
  if (!isOpen) return null;

  const colors = {
    danger: {
      bg: 'bg-rose-50',
      icon: 'text-rose-500',
      button: 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
    },
    warning: {
      bg: 'bg-amber-50',
      icon: 'text-amber-500',
      button: 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
    },
    info: {
      bg: 'bg-blue-50',
      icon: 'text-blue-500',
      button: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
    }
  };

  const activeColor = colors[type];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Overlay con blur */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300 cursor-pointer"
        onClick={!isDeleting ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300">
        <button 
          onClick={onClose}
          disabled={isDeleting}
          className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className={`h-20 w-20 ${activeColor.bg} rounded-3xl flex items-center justify-center mb-6 mx-auto`}>
          {type === 'danger' ? (
            <Trash2 className={`h-10 w-10 ${activeColor.icon}`} />
          ) : (
            <AlertCircle className={`h-10 w-10 ${activeColor.icon}`} />
          )}
        </div>

        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">
          {title}
        </h3>
        <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
          {description}
        </p>

        <div className="flex flex-col gap-3">
          <button
            disabled={isDeleting}
            onClick={onConfirm}
            className={`w-full py-4 ${activeColor.button} text-white font-black rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Procesando...
              </>
            ) : (
              confirmText
            )}
          </button>
          
          <button
            disabled={isDeleting}
            onClick={onClose}
            className="w-full py-3 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
