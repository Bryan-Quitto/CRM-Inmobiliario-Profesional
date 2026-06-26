import React, { type ReactNode } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

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
  const isString = typeof content === 'string';

  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <div className={`inline-flex items-center justify-center cursor-help ${className}`}>
            {children}
          </div>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content 
            side={position} 
            sideOffset={6}
            className={`z-[100000] bg-white/95 backdrop-blur-xl border border-indigo-100/50 shadow-2xl overflow-hidden relative ${variant === 'default' ? 'p-2.5 rounded-xl max-w-[250px]' : 'p-4 rounded-2xl'} animate-in fade-in duration-200`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 -z-10" />
            {isString ? (
              <p className="text-xs font-semibold text-slate-700 leading-relaxed text-center whitespace-normal">
                {content}
              </p>
            ) : (
              content
            )}
            <TooltipPrimitive.Arrow className="fill-indigo-50" width={12} height={6} />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};
