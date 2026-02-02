import { Link, useLocation } from 'react-router';
import { useTheme } from '@hooks/useTheme';
import { useBoards } from '@/hooks/useBoards';

import iconBoard from '@assets/icon-board.svg';
import iconLight from '@assets/icon-light-theme.svg';
import iconDark from '@assets/icon-dark-theme.svg';
import iconHideSidebar from '@assets/icon-hide-sidebar.svg';
import logoMobile from '@assets/logo-mobile.svg';

type AsideProps = {
  onHideSidebar: () => void;
};

export function Aside({ onHideSidebar }: AsideProps) {
  const location = useLocation();
  const { boards } = useBoards();
  const { theme, setTheme } = useTheme();

  return (
    <aside className="app-aside">
      <Link to="/" className="app-aside-brand cursor-pointer">
        <img
          src={logoMobile}
          alt=""
          className="app-aside-brand-icon"
          aria-hidden
        />
        <span className="app-aside-brand-text">kanban</span>
      </Link>
      <p className="heading-s app-aside-title">ALL BOARDS ({boards.length})</p>
      <nav className="app-aside-nav">
        {boards.map((board, index) => (
          <Link
            key={board.name}
            to={`/board/${index}`}
            className={`app-aside-link ${location.pathname === `/board/${index}` ? 'active' : ''}`}
          >
            <img src={iconBoard} alt="" width={16} height={16} aria-hidden />
            {board.name}
          </Link>
        ))}
        <Link to="/" className="app-aside-link create">
          <img src={iconBoard} alt="" width={16} height={16} aria-hidden />+
          Create New Board
        </Link>
      </nav>
      <div className="app-aside-footer">
        <div className="app-aside-theme">
          <img src={iconLight} alt="" width={18} height={18} aria-hidden />
          <button
            type="button"
            className="app-board-dropdown-toggle"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          />
          <img src={iconDark} alt="" width={18} height={18} aria-hidden />
        </div>
        <button
          type="button"
          className="app-aside-hide"
          onClick={onHideSidebar}
          aria-label="Hide sidebar"
        >
          <img
            src={iconHideSidebar}
            alt=""
            width={18}
            height={16}
            aria-hidden
          />
          Hide Sidebar
        </button>
      </div>
    </aside>
  );
}
