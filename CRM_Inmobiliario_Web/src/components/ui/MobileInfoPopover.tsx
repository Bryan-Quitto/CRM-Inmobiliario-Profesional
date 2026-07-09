import React, { useState, useEffect } from 'react';

interface MobileInfoPopoverProps {
  children: React.ReactNode;
  content: React.ReactNode;
}

export function MobileInfoPopover({ children, content }: MobileInfoPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Prevent scrolling when popover is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      <div 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }} 
        className="inline-flex cursor-pointer"
      >
        {children}
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-[320px] p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-medium text-slate-100 break-words leading-relaxed text-center">
              {content}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-2.5 px-4 bg-white text-slate-900 hover:bg-slate-100 rounded-lg font-bold transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
