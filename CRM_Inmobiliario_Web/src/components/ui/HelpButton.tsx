import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useHelpDrawerStore } from '../../store/useHelpDrawerStore';

interface HelpButtonProps {
  title: string;
  path?: string;
  content?: string;
  className?: string;
  iconSize?: number;
}

export const HelpButton: React.FC<HelpButtonProps> = ({ title, path, content, className = '', iconSize = 18 }) => {
  const openHelp = useHelpDrawerStore((state) => state.openHelp);
  
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openHelp(title, { path, content });
      }}
      className={`text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer flex items-center justify-center p-1 rounded-full hover:bg-indigo-50 shrink-0 ${className}`}
      title="Ver Ayuda"
    >
      <HelpCircle size={iconSize} />
    </button>
  );
};
