

interface InputProps {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  name?: string;
  id?: string;
}

export function Input({
  label,
  error,
  helperText,
  placeholder,
  type = 'text',
  value,
  onChange,
  disabled = false,
  required = false,
  className = '',
  name,
  id,
}: InputProps) {
  const inputId = id ?? name ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-slate-700"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        className={[
          'w-full px-3 py-2 text-sm rounded-md border',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
          'transition-colors duration-150 placeholder:text-slate-400',
          error
            ? 'border-red-400 bg-red-50 focus:ring-red-400 focus:border-red-400'
            : 'border-slate-300 bg-white',
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : '',
        ].join(' ')}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {!error && helperText && (
        <p className="text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
}
