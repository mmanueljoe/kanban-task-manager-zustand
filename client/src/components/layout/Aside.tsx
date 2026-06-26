import { Link, useLocation } from 'react-router';
import { useBoards } from '@/hooks/useBoards';
import { ThemeToggle } from '@components/ui/ThemeToggle';
import { memo } from 'react';

import iconBoard from '@assets/icon-board.svg';
import iconHideSidebar from '@assets/icon-hide-sidebar.svg';
import logoMobile from '@assets/logo-mobile.svg';

type AsideProps = {
  onHideSidebar: () => void;
  onCreateBoard: () => void;
};

const BoardLink = memo(function BoardLink({
  boardName,
  index,
  isActive,
}: {
  boardName: string;
  index: number;
  isActive: boolean;
}) {
  return (
    <Link
      to={`/board/${index}`}
      className={`app-aside-link ${isActive ? 'active' : ''}`}
    >
      <img src={iconBoard} alt="" width={16} height={16} aria-hidden />
      {boardName}
    </Link>
  );
});

export function Aside({ onHideSidebar, onCreateBoard }: AsideProps) {
  const location = useLocation();
  const { boards } = useBoards();

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
          <BoardLink
            key={board.name}
            boardName={board.name}
            index={index}
            isActive={location.pathname === `/board/${index}`}
          />
        ))}
        <button
          type="button"
          className="app-aside-link create"
          onClick={onCreateBoard}
        >
          <img src={iconBoard} alt="" width={16} height={16} aria-hidden />+
          Create New Board
        </button>
      </nav>
      <div className="app-aside-footer">
        <ThemeToggle className="app-aside-theme" />
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
