import type { InputHTMLAttributes } from 'react';
import iconCheck from '@assets/icon-check.svg';

// Controlled: parent owns checked. Styles in index.css (.checkbox, .checkbox-box, .checkbox-label, etc.).
type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export function Checkbox({
  label,
  checked,
  onCheckedChange,
  className = '',
  ...rest
}: CheckboxProps) {
  return (
    <label className={`checkbox ${className}`}>
      <span className={`checkbox-box ${checked ? 'checked' : ''}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="checkbox-input"
          {...rest}
        />
        {checked && (
          <img
            src={iconCheck}
            alt=""
            className="pointer-events-none"
            aria-hidden
          />
        )}
      </span>
      <span className={`checkbox-label ${checked ? 'checked' : ''}`}>
        {label}
      </span>
    </label>
  );
}
