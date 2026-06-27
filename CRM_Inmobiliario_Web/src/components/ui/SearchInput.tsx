import React, { forwardRef } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value'> {
  value?: string;
  onClear?: () => void;
  containerClassName?: string;
  iconClassName?: string;
  icon?: LucideIcon;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className = '', containerClassName = '', iconClassName = '', onClear, value, onChange, disabled, icon, ...props }, ref) => {
    const IconComponent = icon || SearchIcon;

    const handleClear = () => {
      if (disabled) return;
      
      if (onClear) {
        onClear();
      } else if (onChange) {
        // Create a synthetic event for standard onChange handlers
        const event = {
          target: { value: '' },
          currentTarget: { value: '' },
          preventDefault: () => {},
          stopPropagation: () => {}
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        onChange(event);
      }
    };

    return (
      <div className={`relative w-full ${containerClassName}`}>
        <IconComponent className={`h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 ${iconClassName}`} />
        <input
          ref={ref}
          type="text"
          value={value || ''}
          onChange={onChange}
          disabled={disabled}
          className={`w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {value && value.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
