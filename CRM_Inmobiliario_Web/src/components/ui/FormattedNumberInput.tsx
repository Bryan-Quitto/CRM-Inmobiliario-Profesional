import React, { forwardRef } from 'react';
import { NumericFormat, type NumericFormatProps } from 'react-number-format';

export interface FormattedNumberInputProps extends Omit<NumericFormatProps, 'onChange'> {
  label?: string;
  error?: string;
  containerClassName?: string;
  icon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  // This onChange overrides the default to return a number or string, instead of a synthetic event.
  onChange?: (value: number | string) => void;
  // We specify some default styling properties
  required?: boolean;
}

export const FormattedNumberInput = forwardRef<HTMLInputElement, FormattedNumberInputProps>(
  ({ 
    className = '', 
    containerClassName = '', 
    label, 
    error, 
    icon, 
    suffixIcon,
    onChange, 
    ...props 
  }, ref) => {
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
          <NumericFormat
            getInputRef={ref}
            thousandSeparator="."
            decimalSeparator=","
            onValueChange={(values) => {
              if (onChange) {
                // values.floatValue is undefined if input is empty
                onChange(values.floatValue === undefined ? '' : values.floatValue);
              }
            }}
            className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm font-medium outline-none transition-all shadow-sm disabled:opacity-50 disabled:bg-slate-50
              ${error ? 'border-red-500 focus:ring-2 focus:ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-500'}
              ${icon ? 'pl-10' : ''}
              ${suffixIcon ? 'pr-10' : ''}
              ${className}
            `}
            {...props}
          />
          {suffixIcon && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              {suffixIcon}
            </div>
          )}
        </div>
        {error && (
          <span className="text-xs font-medium text-red-500 mt-2">{error}</span>
        )}
      </div>
    );
  }
);

FormattedNumberInput.displayName = 'FormattedNumberInput';
