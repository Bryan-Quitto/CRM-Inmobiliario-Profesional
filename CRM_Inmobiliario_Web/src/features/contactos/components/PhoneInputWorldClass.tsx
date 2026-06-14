import { forwardRef, useImperativeHandle } from 'react';
import { usePhoneInput, defaultCountries } from 'react-international-phone';
import { Phone } from 'lucide-react';
import { CustomCountryDropdown } from './CustomCountryDropdown';

interface PhoneInputWorldClassProps {
  value: string | null;
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
  const {
    inputValue,
    handlePhoneValueChange,
    inputRef,
    country,
    setCountry,
  } = usePhoneInput({
    defaultCountry: 'ec',
    value: value || '',
    countries: defaultCountries,
    disableDialCodeAndPrefix: true,
    onChange: (data) => {
      // data.phone incluye el dialCode + inputValue. 
      // data.inputValue es lo que el usuario tipeó (ej. '0995216060')
      let finalPhone = data.phone;
      
      // Sanitización para asegurar el formato E.164 correcto:
      // En muchos países (como Ecuador), la gente escribe el 0 inicial (099...), 
      // pero el estándar internacional no lo lleva (+59399...).
      // Si el input original empieza por 0 y la librería lo concatenó, lo corregimos.
      const rawInput = (data.inputValue || '').replace(/\D/g, '');
      if (rawInput.startsWith('0')) {
        // Formamos el número sin el primer cero
        finalPhone = `+${country.dialCode}${rawInput.substring(1)}`;
      }

      onChange(finalPhone);
    }
  });

  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

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

      <CustomCountryDropdown 
        country={country.iso2} 
        setCountry={setCountry} 
        disabled={disabled}
      />

      <input
        ref={inputRef}
        value={inputValue}
        onChange={handlePhoneValueChange}
        onBlur={onBlur}
        disabled={disabled}
        className="w-full bg-transparent border-none text-sm font-medium py-3 pr-4 outline-none disabled:opacity-50 shadow-none h-auto focus:outline-none focus:ring-0"
      />
    </div>
  );
});

PhoneInputWorldClass.displayName = 'PhoneInputWorldClass';
