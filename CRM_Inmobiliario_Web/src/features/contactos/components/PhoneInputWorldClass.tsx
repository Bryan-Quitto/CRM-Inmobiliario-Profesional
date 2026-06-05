import { forwardRef, useRef, useImperativeHandle } from 'react';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { Phone } from 'lucide-react';

interface PhoneInputWorldClassProps {
  value: string;
  onChange: (phone: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  hasError?: boolean;
}

export const PhoneInputWorldClass = forwardRef<HTMLInputElement, PhoneInputWorldClassProps>(({
  value,
  onChange,
  onBlur,
  disabled,
  hasError
}, ref) => {
  const localRef = useRef<HTMLInputElement | null>(null);
  useImperativeHandle(ref, () => localRef.current as HTMLInputElement);

  return (
    <div className={`relative transition-all w-full rounded-2xl border bg-slate-50 flex items-center ${
      hasError 
        ? 'border-rose-300 ring-rose-50 ring-4' 
        : 'border-slate-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100'
    }`}>
      {/* Icono a la izquierda */}
      <div className="pl-3.5 pr-1 py-3 flex items-center justify-center text-slate-400">
        <Phone className="h-4 w-4" />
      </div>

      <PhoneInput
        defaultCountry="ec"
        value={value}
        onChange={onChange}
        disabled={disabled}
        inputRef={localRef}
        inputProps={{
          onBlur: onBlur
        }}
        className="w-full flex"
        inputClassName="!w-full !bg-transparent !border-none !text-sm !font-medium !py-3 !pr-4 !outline-none disabled:!opacity-50 !shadow-none !h-auto focus:!outline-none focus:!ring-0"
        countrySelectorStyleProps={{
          buttonClassName: "!bg-transparent !border-none !pl-2 !pr-2 hover:!bg-slate-100 disabled:!opacity-50 !rounded-l-lg !outline-none !shadow-none"
        }}
      />
    </div>
  );
});

PhoneInputWorldClass.displayName = 'PhoneInputWorldClass';
