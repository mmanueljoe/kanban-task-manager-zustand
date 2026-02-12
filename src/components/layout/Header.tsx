import { Link, useNavigate } from 'react-router';
import { useRef, useState, useEffect, memo, useMemo } from 'react';
import { useBoards } from '@/hooks/useBoards';
import { useCurrentBoard } from '@/hooks/useCurrentBoard';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@components/ui/ThemeToggle';
import logoMobile from '@assets/logo-mobile.svg';
import iconChevronDown from '@assets/icon-chevron-down.svg';
import iconAddTask from '@assets/icon-add-task-mobile.svg';
import iconEllipsis from '@assets/icon-vertical-ellipsis.svg';
import iconBoard from '@assets/icon-board.svg';

type HeaderProps = {
  onAddTask?: () => void;
  onCreateBoard?: () => void;
  onEditBoard?: () => void;
  onDeleteBoard?: () => void;
  canEditBoard?: boolean;
};

const BoardDropdownItem = memo(function BoardDropdownItem({
  boardName,
  index,
  isActive,
  onSelect,
}: {
  boardName: string;
  index: number;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <Link
        to={`/board/${index}`}
        className={`app-board-dropdown-item ${isActive ? 'active' : ''}`}
        onClick={onSelect}
      >
        <img
          src={iconBoard}
          alt=""
          width={16}
          height={16}
          className={`app-board-dropdown-icon ${isActive ? '' : 'app-board-dropdown-icon--inactive'}`}
        />
        {boardName}
      </Link>
    </li>
  );
});

export function Header({
  onAddTask,
  onCreateBoard,
  onEditBoard,
  onDeleteBoard,
  canEditBoard = false,
}: HeaderProps) {
  const { boards } = useBoards();
  const { board, boardIndex } = useCurrentBoard();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen && !accountMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (menuRef.current && menuRef.current.contains(target)) return;
      if (accountMenuRef.current && accountMenuRef.current.contains(target)) {
        return;
      }
      setMenuOpen(false);
      setAccountMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen, accountMenuOpen]);

  const currentBoardName = useMemo(
    () => (board != null && boardIndex != null ? board.name : 'Boards'),
    [board?.name, boardIndex]
  );

  const handleLogout = () => {
    logout();
    void navigate('/login', { replace: true });
  };

  const userInitial =
    user?.name?.trim()?.charAt(0).toUpperCase() ??
    user?.email?.trim()?.charAt(0).toUpperCase() ??
    'A';

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <header className="app-header">
      <div className="app-header-left" ref={dropdownRef}>
        <img
          src={logoMobile}
          alt=""
          className="app-header-logo"
          width={24}
          height={25}
        />
        <button
          type="button"
          className="app-header-board-trigger"
          onClick={() => setDropdownOpen((o) => !o)}
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
        >
          <span className="app-header-board-current">{currentBoardName}</span>
          <img
            src={iconChevronDown}
            alt=""
            width={10}
            height={7}
            className={`app-header-board-chevron ${dropdownOpen ? 'app-header-board-chevron--open' : ''}`}
          />
        </button>
        <span className="app-header-board-name" title={currentBoardName}>
          {currentBoardName}
        </span>
        {dropdownOpen && (
          <div
            className="app-board-dropdown"
            role="dialog"
            aria-label="Board selector"
            onClick={() => setDropdownOpen(false)}
          >
            <div
              className="app-board-dropdown-panel"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="app-board-dropdown-title">
                ALL BOARDS ({boards.length})
              </p>
              <ul className="app-board-dropdown-list">
                {boards.map((board, index) => (
                  <BoardDropdownItem
                    key={board.name}
                    boardName={board.name}
                    index={index}
                    isActive={boardIndex === index}
                    onSelect={() => setDropdownOpen(false)}
                  />
                ))}
                <li>
                  <button
                    type="button"
                    className="app-board-dropdown-item create"
                    onClick={() => {
                      onCreateBoard?.();
                      setDropdownOpen(false);
                    }}
                  >
                    <img
                      src={iconBoard}
                      alt=""
                      width={16}
                      height={16}
                      style={{
                        display: 'inline-block',
                        marginRight: 12,
                        verticalAlign: 'middle',
                        opacity: 0.5,
                      }}
                    />
                    + Create New Board
                  </button>
                </li>
              </ul>
              <ThemeToggle className="app-board-dropdown-theme" />
            </div>
          </div>
        )}
      </div>
      <div className="app-header-actions">
        <button
          type="button"
          className="btn btn-primary btn-small app-header-add-task"
          aria-label="Add task"
          onClick={onAddTask}
        >
          <img
            src={iconAddTask}
            alt=""
            width={12}
            height={12}
            aria-hidden
            className="app-header-add-task-icon"
          />
          <span className="app-header-add-label">+ Add New Task</span>
        </button>
        <div ref={accountMenuRef} className="app-menu-anchor">
          <button
            type="button"
            aria-label="Account menu"
            aria-expanded={accountMenuOpen}
            aria-haspopup="true"
            onClick={() => setAccountMenuOpen((open) => !open)}
            className="app-account-button"
          >
            {userInitial}
          </button>
          {accountMenuOpen && (
            <div role="menu" className="app-menu-panel">
              <button
                type="button"
                role="menuitem"
                className="dropdown-option app-menu-item"
                onClick={() => {
                  setAccountMenuOpen(false);
                  void navigate('/admin');
                }}
              >
                Admin
              </button>
              <button
                type="button"
                role="menuitem"
                className="dropdown-option app-menu-item app-menu-item--danger"
                onClick={() => {
                  setAccountMenuOpen(false);
                  handleLogout();
                }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
        <div ref={menuRef} className="app-menu-anchor">
          <button
            type="button"
            aria-label="More options"
            aria-expanded={menuOpen}
            aria-haspopup="true"
            onClick={() => setMenuOpen((o) => !o)}
            className="app-menu-trigger"
          >
            <img src={iconEllipsis} alt="" width={5} height={20} />
          </button>
          {menuOpen && canEditBoard && (
            <div role="menu" className="app-menu-panel app-menu-panel--wide">
              <button
                type="button"
                role="menuitem"
                className="dropdown-option app-menu-item"
                onClick={() => {
                  onEditBoard?.();
                  setMenuOpen(false);
                }}
              >
                Edit Board
              </button>
              <button
                type="button"
                role="menuitem"
                className="dropdown-option app-menu-item app-menu-item--danger"
                onClick={() => {
                  onDeleteBoard?.();
                  setMenuOpen(false);
                }}
              >
                Delete Board
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
