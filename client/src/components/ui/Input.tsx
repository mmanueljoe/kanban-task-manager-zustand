import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, className = '', ...rest }: InputProps) {
  return (
    <div className={`input-wrap ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <input className={`input ${error ? 'input-error' : ''}`} {...rest} />
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
}
