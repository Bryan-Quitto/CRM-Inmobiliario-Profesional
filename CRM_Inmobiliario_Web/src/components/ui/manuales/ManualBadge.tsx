import React from 'react';

type BadgeColor = 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'slate';

interface ManualBadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  className?: string;
}

const colorStyles: Record<BadgeColor, string> = {
  indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-100 text-amber-700 border-amber-200',
  rose: 'bg-rose-100 text-rose-700 border-rose-200',
  sky: 'bg-sky-100 text-sky-700 border-sky-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const ManualBadge: React.FC<ManualBadgeProps> = ({ children, color = 'indigo', className = '' }) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${colorStyles[color]} ${className}`}>
      {children}
    </span>
  );
};
