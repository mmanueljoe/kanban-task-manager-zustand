import { useState, useRef, useEffect, memo } from 'react';
import iconChevronDown from '@assets/icon-chevron-down.svg';

type DropdownOption = { value: string; label: string };

type DropdownProps = {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

// OPTIMIZATION: Memoized to prevent unnecessary re-renders
export const Dropdown = memo(function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select',
  className = '',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? placeholder;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={`dropdown ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`dropdown-trigger ${isOpen ? 'open' : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span>{selectedLabel}</span>
        <img
          src={iconChevronDown}
          alt=""
          className={`dropdown-chevron ${isOpen ? 'open' : ''}`}
          aria-hidden
        />
      </button>

      {isOpen && (
        <ul role="listbox" className="dropdown-list">
          {options.map((option) => (
            <li
              key={option.value}
              role="option"
              aria-selected={value === option.value}
            >
              <button
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`dropdown-option ${value === option.value ? 'selected' : ''}`}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
