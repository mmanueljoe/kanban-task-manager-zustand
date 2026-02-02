import { useBoards } from '@/hooks/useBoards';
import { useUi } from '@/hooks/useUi';
import type { TaskDetailsModalProps } from '@/types/types';
import { Modal } from '../ui/Modal';
import { Checkbox } from '../ui/Checkbox';
import { useState, useRef, useEffect } from 'react';
import iconEllipsis from '@assets/icon-vertical-ellipsis.svg';

export function TaskDetailsModal({
  open,
  onClose,
  boardIndex,
  columnName,
  taskTitle,
}: TaskDetailsModalProps) {
  const { boards, dispatch } = useBoards();
  const { startLoading, stopLoading, showToast } = useUi();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const board = boardIndex !== null ? boards[boardIndex] : null;
  const column = board?.columns.find((c) => c.name === columnName);
  const task = column?.tasks.find((t) => t.title === taskTitle);

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

  if (!task || boardIndex === null || !columnName || !taskTitle) return null;

  const completedSubtasks =
    task.subtasks?.filter((s) => s.isCompleted).length ?? 0;
  const totalSubtasks = task.subtasks?.length ?? 0;

  const handleSubtaskToggle = (subtaskTitle: string) => {
    dispatch({
      type: 'TOOGLE_SUBTASK',
      payload: {
        boardIndex,
        columnName,
        taskTitle,
        subtaskTitle,
      },
    });
  };

  const handleDeleteTask = () => {
    startLoading('deleteTask');
    try {
      dispatch({
        type: 'DELETE_TASK',
        payload: {
          boardIndex,
          columnName,
          taskTitle,
        },
      });
      showToast({ type: 'success', message: 'Task deleted' });
    } finally {
      stopLoading('deleteTask');
      setMenuOpen(false);
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} aria-label="Task details">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
        }}
      >
        <h2 className="app-modal-title" style={{ flex: 1, margin: 0 }}>
          {task.title}
        </h2>
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
          {menuOpen && (
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
                  setMenuOpen(false);
                  // TODO: Open EditTaskModal
                }}
              >
                Edit Task
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
                onClick={handleDeleteTask}
              >
                Delete Task
              </button>
            </div>
          )}
        </div>
      </div>

      {task.description && (
        <p
          className="body-l"
          style={{
            marginBottom: 24,
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}
        >
          {task.description}
        </p>
      )}

      {task.subtasks && task.subtasks.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <label
            className="input-label"
            style={{ display: 'block', marginBottom: 16 }}
          >
            Subtasks ({completedSubtasks} of {totalSubtasks})
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {task.subtasks.map((subtask) => (
              <Checkbox
                key={subtask.title}
                label={subtask.title}
                checked={subtask.isCompleted}
                onCheckedChange={() => handleSubtaskToggle(subtask.title)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="input-wrap">
        <label className="input-label">Current Status</label>
        <div
          className="input"
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--lines)',
            borderRadius: 4,
            color: 'var(--text-primary)',
            cursor: 'default',
          }}
        >
          {task.status || columnName}
        </div>
      </div>
    </Modal>
  );
}
