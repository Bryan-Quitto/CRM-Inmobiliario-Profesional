import React from 'react';
import { Info, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

type AlertVariant = 'info' | 'warning' | 'success' | 'danger';

interface ManualAlertProps {
  title?: string;
  children?: React.ReactNode;
  description?: React.ReactNode;
  variant?: AlertVariant;
  className?: string;
}

const variantStyles: Record<AlertVariant, { bg: string; text: string; border: string; icon: React.ElementType }> = {
  info: { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200', icon: Info },
  warning: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', icon: AlertTriangle },
  success: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', icon: CheckCircle },
  danger: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', icon: ShieldAlert },
};

export const ManualAlert: React.FC<ManualAlertProps> = ({ title, children, description, variant = 'info', className = '' }) => {
  const styles = variantStyles[variant];
  const Icon = styles.icon;

  return (
    <div className={`p-4 rounded-xl border ${styles.bg} ${styles.border} ${styles.text} flex gap-3 shadow-sm ${className}`}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div>
        {title && <h4 className="font-semibold mb-1">{title}</h4>}
        <div className="text-sm opacity-90 leading-relaxed">
          {description || children}
        </div>
      </div>
    </div>
  );
};
