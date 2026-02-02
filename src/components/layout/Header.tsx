import { Link, useParams } from 'react-router';
import { useRef, useState, useEffect } from 'react';
import { useTheme } from '@hooks/useTheme';
import { useBoards } from '@/hooks/useBoards';
import logoMobile from '@assets/logo-mobile.svg';
import iconChevronDown from '@assets/icon-chevron-down.svg';
import iconAddTask from '@assets/icon-add-task-mobile.svg';
import iconEllipsis from '@assets/icon-vertical-ellipsis.svg';
import iconBoard from '@assets/icon-board.svg';
import iconLight from '@assets/icon-light-theme.svg';
import iconDark from '@assets/icon-dark-theme.svg';

type HeaderProps = {
  onAddTask?: () => void;
  onEditBoard?: () => void;
  onDeleteBoard?: () => void;
  canEditBoard?: boolean;
};

export function Header({
  onAddTask,
  onEditBoard,
  onDeleteBoard,
  canEditBoard = false,
}: HeaderProps) {
  const { boards } = useBoards();
  const { boardId } = useParams<{ boardId?: string }>();
  const { theme, setTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const currentIndex =
    boardId != null && /^\d+$/.test(boardId) ? parseInt(boardId, 10) : null;
  const currentBoardName =
    currentIndex != null &&
    Number.isFinite(currentIndex) &&
    currentIndex >= 0 &&
    currentIndex < boards.length
      ? boards[currentIndex].name
      : 'Boards';

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
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {currentBoardName}
          </span>
          <img
            src={iconChevronDown}
            alt=""
            width={10}
            height={7}
            style={{
              transform: dropdownOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
              flexShrink: 0,
            }}
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
                  <li key={board.name}>
                    <Link
                      to={`/board/${index}`}
                      className={`app-board-dropdown-item ${currentIndex === index ? 'active' : ''}`}
                      onClick={() => setDropdownOpen(false)}
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
                          opacity: currentIndex === index ? 1 : 0.5,
                        }}
                      />
                      {board.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    className="app-board-dropdown-item create"
                    onClick={() => setDropdownOpen(false)}
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
              <div className="app-board-dropdown-theme">
                <img src={iconLight} alt="" width={18} height={18} />
                <button
                  type="button"
                  className="app-board-dropdown-toggle"
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
                />
                <img src={iconDark} alt="" width={18} height={18} />
              </div>
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
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            aria-label="More options"
            aria-expanded={menuOpen}
            aria-haspopup="true"
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              padding: 10,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            <img src={iconEllipsis} alt="" width={5} height={20} />
          </button>
          {menuOpen && canEditBoard && (
            <div
              role="menu"
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 8,
                minWidth: 192,
                padding: 8,
                borderRadius: 8,
                background: 'var(--bg-main)',
                border: '1px solid var(--lines)',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                zIndex: 20,
              }}
            >
              <button
                type="button"
                role="menuitem"
                className="dropdown-option"
                style={{ display: 'block', width: '100%', textAlign: 'left' }}
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
                className="dropdown-option"
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  color: 'var(--destructive)',
                }}
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
