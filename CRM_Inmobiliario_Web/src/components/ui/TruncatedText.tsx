import React, { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

interface TruncatedTextProps {
  children: ReactNode;
  className?: string;
  as?: React.ElementType;
}

export const TruncatedText = ({ children, className = '', as: Component = 'span' }: TruncatedTextProps) => {
  const textRef = useRef<HTMLElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const checkTruncation = () => {
    if (textRef.current) {
      const { scrollWidth, clientWidth, scrollHeight, clientHeight } = textRef.current;
      // Añadimos un pequeño margen (1px) para evitar falsos positivos por redondeo de sub-píxeles
      setIsTruncated(scrollWidth > clientWidth + 1 || scrollHeight > clientHeight + 1);
    }
  };

  return (
    <TooltipPrimitive.Provider delayDuration={300}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <Component 
            ref={textRef} 
            className={`truncate block ${className}`}
            onMouseEnter={checkTruncation}
          >
            {children}
          </Component>
        </TooltipPrimitive.Trigger>
        {isTruncated && (
          <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content 
              side="top" 
              sideOffset={6}
              className="z-[100000] bg-slate-900 border border-slate-800 shadow-2xl p-2.5 rounded-xl max-w-[300px] animate-in fade-in duration-200"
            >
              <div className="text-xs font-medium text-slate-100 leading-relaxed text-center whitespace-normal">
                {children}
              </div>
              <TooltipPrimitive.Arrow className="fill-slate-900" width={12} height={6} />
            </TooltipPrimitive.Content>
          </TooltipPrimitive.Portal>
        )}
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
};
