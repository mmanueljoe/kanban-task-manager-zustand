import { useStore } from '@/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import { useUi } from '@/hooks/useUi';
import type { TaskDetailsModalProps } from '@/types/types';
import { Modal } from '../ui/Modal';
import { Checkbox } from '../ui/Checkbox';
import { useState, useRef, useEffect, useMemo } from 'react';
import iconEllipsis from '@assets/icon-vertical-ellipsis.svg';

export function TaskDetailsModal({
  open,
  onClose,
  boardIndex,
  columnName,
  taskTitle,
}: TaskDetailsModalProps) {
  const board = useStore(
    useShallow((state) => {
      if (
        boardIndex === null ||
        boardIndex < 0 ||
        boardIndex >= state.boards.length
      ) {
        return null;
      }
      return state.boards[boardIndex];
    })
  );

  const dispatch = useStore((state) => state.dispatch);
  const { startLoading, stopLoading, showToast } = useUi();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { task } = useMemo(() => {
    const col = board?.columns.find((c) => c.name === columnName);
    const t = col?.tasks.find((t) => t.title === taskTitle);
    return { column: col, task: t };
  }, [board, columnName, taskTitle]);

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
      <div className="app-modal-header-row">
        <h2 className="app-modal-title app-modal-header-title">{task.title}</h2>
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
          {menuOpen && (
            <div role="menu" className="app-menu-panel app-menu-panel--wide">
              <button
                type="button"
                role="menuitem"
                className="dropdown-option app-menu-item"
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
                className="dropdown-option app-menu-item app-menu-item--danger"
                onClick={handleDeleteTask}
              >
                Delete Task
              </button>
            </div>
          )}
        </div>
      </div>

      {task.description && (
        <p className="body-l app-modal-description">{task.description}</p>
      )}

      {task.subtasks && task.subtasks.length > 0 && (
        <div className="app-modal-section">
          <label className="input-label app-modal-subtasks-label">
            Subtasks ({completedSubtasks} of {totalSubtasks})
          </label>
          <div className="app-modal-subtasks-list">
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
        <div className="input app-modal-status-display">
          {task.status || columnName}
        </div>
      </div>
    </Modal>
  );
}
