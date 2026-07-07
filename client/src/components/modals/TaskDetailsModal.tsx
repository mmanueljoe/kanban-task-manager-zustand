import { useState, useRef, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Checkbox } from "../ui/Checkbox";
import {
  useTasks,
  useToggleSubtask,
  useDeleteTask,
} from "@/hooks/useTaskQueries";
import { useUi } from "@/hooks/useUi";
import iconEllipsis from "@assets/icon-vertical-ellipsis.svg";

type TaskDetailsModalProps = {
  open: boolean;
  onClose: () => void;
  taskId: string | null;
  columnId: string | null;
  columnName: string | null;
};

export function TaskDetailsModal({
  open,
  onClose,
  taskId,
  columnId,
  columnName,
}: TaskDetailsModalProps) {
  // Read the task live from the column's cache so a subtask toggle (which
  // refetches that column) is reflected here immediately.
  const { data: tasks = [] } = useTasks(columnId ?? "");
  const toggleSubtask = useToggleSubtask(columnId ?? "");
  const deleteTask = useDeleteTask(columnId ?? "");
  const { showToast } = useUi();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;

  const completed = task.subtasks.filter((s) => s.isCompleted).length;
  const total = task.subtasks.length;

  const handleDelete = () => {
    deleteTask.mutate(task.id, {
      onSuccess: () => {
        showToast({ type: "success", message: "Task deleted" });
        setMenuOpen(false);
        onClose();
      },
      onError: () =>
        showToast({ type: "error", message: "Couldn't delete the task." }),
    });
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
                className="dropdown-option app-menu-item app-menu-item--danger"
                onClick={handleDelete}
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

      {total > 0 && (
        <div className="app-modal-section">
          <label className="input-label app-modal-subtasks-label">
            Subtasks ({completed} of {total})
          </label>
          <div className="app-modal-subtasks-list">
            {task.subtasks.map((subtask) => (
              <Checkbox
                key={subtask.id}
                label={subtask.title}
                checked={subtask.isCompleted}
                onCheckedChange={() =>
                  toggleSubtask.mutate({
                    taskId: task.id,
                    subtaskId: subtask.id,
                  })
                }
              />
            ))}
          </div>
        </div>
      )}

      <div className="input-wrap">
        <label className="input-label">Current Status</label>
        <div className="input app-modal-status-display">{columnName ?? ""}</div>
      </div>
    </Modal>
  );
}
