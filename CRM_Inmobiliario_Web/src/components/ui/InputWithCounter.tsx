import React, { forwardRef } from 'react';

export interface InputWithCounterProps extends React.InputHTMLAttributes<HTMLInputElement> {
  maxLength: number;
  label?: string;
  error?: string;
  containerClassName?: string;
  icon?: React.ReactNode;
}

export const InputWithCounter = forwardRef<HTMLInputElement, InputWithCounterProps>(
  ({ className = '', containerClassName = '', label, error, maxLength, value, onChange, icon, ...props }, ref) => {
    const [internalLength, setInternalLength] = React.useState(
      value !== undefined && value !== null ? String(value).length : 
      props.defaultValue !== undefined && props.defaultValue !== null ? String(props.defaultValue).length : 0
    );

    const internalRef = React.useRef<HTMLInputElement>(null);

    const handleRef = (element: HTMLInputElement | null) => {
      internalRef.current = element;
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLInputElement | null>).current = element;
      }
    };

    React.useEffect(() => {
      if (value !== undefined && value !== null) {
        setInternalLength(String(value).length);
      }
    }, [value]);

    React.useEffect(() => {
      const el = internalRef.current;
      if (!el) return;

      // Sync initial value directly from DOM
      setInternalLength(el.value.length);

      // Intercept programmatic value changes (like react-hook-form reset)
      const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
      if (descriptor && descriptor.set) {
        const nativeSet = descriptor.set;
        Object.defineProperty(el, 'value', {
          set: function(val) {
            nativeSet.call(el, val);
            setInternalLength(String(val).length);
          },
          get: descriptor.get
        });

        return () => {
          Object.defineProperty(el, 'value', descriptor);
        };
      }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalLength(e.target.value.length);
      if (onChange) {
        onChange(e);
      }
    };

    const isNearLimit = internalLength >= maxLength * 0.9;
    const isAtLimit = internalLength >= maxLength;

    return (
      <div className={`w-full flex flex-col space-y-1.5 ${containerClassName}`}>
        {label && (
          <label className="text-sm font-semibold text-slate-700">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon}
          <input
            ref={handleRef}
            value={value}
            onChange={handleChange}
            maxLength={maxLength}
            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-medium outline-none transition-all shadow-sm disabled:opacity-50 disabled:bg-slate-50
              ${error ? 'border-red-500 focus:ring-2 focus:ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500'}
              ${className}
            `}
            {...props}
          />
          <div className="absolute right-3 bottom-[-20px] flex items-center justify-end pointer-events-none">
            <span className={`text-[10px] font-medium transition-colors ${isAtLimit ? 'text-red-500' : isNearLimit ? 'text-amber-500' : 'text-slate-400'}`}>
              {internalLength} / {maxLength}
            </span>
          </div>
        </div>
        {error && (
          <span className="text-xs font-medium text-red-500 mt-2">{error}</span>
        )}
      </div>
    );
  }
);

InputWithCounter.displayName = 'InputWithCounter';
