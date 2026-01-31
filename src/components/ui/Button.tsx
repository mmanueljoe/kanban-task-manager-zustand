import type { ButtonHTMLAttributes } from 'react';

// Props: variant/size map to CSS classes in index.css (.btn-primary, .btn-large, etc.).
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'destructive';
  size?: 'large' | 'small';
};

export function Button({
  children,
  variant = 'primary',
  size = 'large',
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
