import { memo } from 'react';
import { useTheme } from '@hooks/useTheme';
import iconLight from '@assets/icon-light-theme.svg';
import iconDark from '@assets/icon-dark-theme.svg';

type ThemeToggleProps = {
  className?: string;
};

export const ThemeToggle = memo(function ThemeToggle({
  className,
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const nextTheme = theme === 'light' ? 'dark' : 'light';

  return (
    <div className={className}>
      <img src={iconLight} alt="" width={18} height={18} aria-hidden />
      <button
        type="button"
        className="app-board-dropdown-toggle"
        onClick={() => setTheme(nextTheme)}
        aria-label={`Switch to ${nextTheme} theme`}
      />
      <img src={iconDark} alt="" width={18} height={18} aria-hidden />
    </div>
  );
});
