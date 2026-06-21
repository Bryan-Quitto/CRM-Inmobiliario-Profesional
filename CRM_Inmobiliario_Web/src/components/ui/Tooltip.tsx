import React, { type ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: ReactNode | string;
  className?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  variant?: 'default' | 'premium';
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  children, 
  content, 
  className = '', 
  position = 'top',
  variant = 'default'
}) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full mt-2 left-1/2 -translate-x-1/2 group-hover:translate-y-0 -translate-y-1';
      case 'left':
        return 'right-full mr-2 top-1/2 -translate-y-1/2 group-hover:translate-x-0 translate-x-1';
      case 'right':
        return 'left-full ml-2 top-1/2 -translate-y-1/2 group-hover:translate-x-0 -translate-x-1';
      case 'top':
      default:
        return 'bottom-full mb-2 left-1/2 -translate-x-1/2 group-hover:translate-y-0 translate-y-1';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'bottom':
        return '-top-1 left-1/2 -translate-x-1/2 border-t-0 border-l border-t border-indigo-100/50 rotate-45';
      case 'left':
        return '-right-1 top-1/2 -translate-y-1/2 border-l-0 border-t border-r border-indigo-100/50 rotate-45';
      case 'right':
        return '-left-1 top-1/2 -translate-y-1/2 border-r-0 border-b border-l border-indigo-100/50 rotate-45';
      case 'top':
      default:
        return '-bottom-1 left-1/2 -translate-x-1/2 border-t-0 border-b border-r border-indigo-100/50 rotate-45';
    }
  };

  const isString = typeof content === 'string';

  return (
    <div className={`group relative inline-flex items-center justify-center ${className}`}>
      {children}
      <div 
        className={`absolute opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform z-[9999] pointer-events-none w-max ${variant === 'default' ? 'max-w-[250px]' : ''} ${getPositionClasses()}`}
      >
        <div className={`bg-white/90 backdrop-blur-xl border border-indigo-100/50 shadow-2xl overflow-hidden relative ${variant === 'default' ? 'p-2.5 rounded-xl' : 'p-4 rounded-2xl'}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 -z-10" />
          {isString ? (
            <p className="text-xs font-semibold text-slate-700 leading-relaxed text-center whitespace-normal">
              {content}
            </p>
          ) : (
            content
          )}
        </div>
        <div className={`absolute w-3 h-3 bg-white/90 backdrop-blur-xl transform ${getArrowClasses()}`} />
      </div>
    </div>
  );
};
