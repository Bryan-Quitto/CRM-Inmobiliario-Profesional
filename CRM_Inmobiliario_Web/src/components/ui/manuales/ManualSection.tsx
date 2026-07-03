import React from 'react';

interface ManualSectionProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const ManualSection: React.FC<ManualSectionProps> = ({ title, children, icon }) => {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        {icon && <span className="text-indigo-500">{icon}</span>}
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
      </div>
      <div className="space-y-4 text-slate-600 leading-relaxed">
        {children}
      </div>
    </section>
  );
};
