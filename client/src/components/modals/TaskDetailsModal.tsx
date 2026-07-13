import { useState, useRef, useEffect } from "react";
import type { ColumnDTO } from "@kanban/shared";
import { Modal } from "../ui/Modal";
import { Checkbox } from "../ui/Checkbox";
import { Dropdown } from "../ui/Dropdown";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { EditTaskModal } from "./EditTaskModal";
import {
  useTasks,
  useToggleSubtask,
  useDeleteTask,
  useAssignTask,
} from "@/hooks/useTaskQueries";
import {
  useComments,
  useAddComment,
  useRemoveComment,
} from "@/hooks/useCommentQueries";
import { useMembers } from "@/hooks/useCollaboratorQueries";
import { useMe } from "@hooks/useAuthQueries";
import { useUi } from "@/hooks/useUi";
import { timeAgo } from "@/lib/time";
import iconEllipsis from "@assets/icon-vertical-ellipsis.svg";

type TaskDetailsModalProps = {
  open: boolean;
  onClose: () => void;
  taskId: string | null;
  columnId: string | null;
  columnName: string | null;
  columns: ColumnDTO[];
};

export function TaskDetailsModal({
  open,
  onClose,
  taskId,
  columnId,
  columnName,
  columns,
}: TaskDetailsModalProps) {
  // Read the task live from the column's cache so a subtask toggle (which
  // refetches that column) is reflected here immediately.
  const { data: tasks = [] } = useTasks(columnId ?? "");
  const toggleSubtask = useToggleSubtask(columnId ?? "");
  const deleteTask = useDeleteTask(columnId ?? "");
  const assignTask = useAssignTask(columnId ?? "");
  const boardId = columns[0]?.boardId ?? "";
  const { data: members = [] } = useMembers(boardId);
  const { data: me } = useMe();
  const { data: comments = [] } = useComments(taskId ?? "", open);
  const addComment = useAddComment(taskId ?? "");
  const removeComment = useRemoveComment(taskId ?? "");
  const { showToast } = useUi();

  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
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

  const nameById = new Map(members.map((m) => [m.userId, m.name]));
  const ownerId = members.find((m) => m.role === "OWNER")?.userId;
  const canDeleteComment = (authorId: string) =>
    me?.id === authorId || me?.id === ownerId;

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    const body = commentText.trim();
    if (!body) return;
    addComment.mutate(body, {
      onSuccess: () => setCommentText(""),
      onError: () =>
        showToast({ type: "error", message: "Couldn't post the comment." }),
    });
  };

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

  if (editOpen) {
    return (
      <EditTaskModal
        open
        onClose={() => {
          setEditOpen(false);
          onClose();
        }}
        task={task}
        columns={columns}
      />
    );
  }

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
                  setEditOpen(true);
                }}
              >
                Edit Task
              </button>
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
        <label className="input-label">Assignee</label>
        <Dropdown
          options={[
            { value: "", label: "Unassigned" },
            ...members.map((m) => ({ value: m.userId, label: m.name })),
          ]}
          value={task.assignedTo ?? ""}
          onChange={(next) =>
            assignTask.mutate(
              { taskId: task.id, assigneeId: next === "" ? null : next },
              {
                onError: () =>
                  showToast({
                    type: "error",
                    message: "Couldn't update the assignee.",
                  }),
              }
            )
          }
        />
      </div>

      <div className="app-modal-section">
        <label className="input-label app-modal-subtasks-label">
          Comments ({comments.length})
        </label>
        <div className="app-modal-subtasks-list">
          {comments.length === 0 ? (
            <p className="body-s" style={{ color: "var(--text-muted)" }}>
              No comments yet.
            </p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <div>
                  <span
                    className="body-s"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {me?.id === comment.authorId
                      ? "You"
                      : (nameById.get(comment.authorId) ?? "Someone")}{" "}
                    · {timeAgo(comment.createdAt)}
                  </span>
                  <p className="body-m" style={{ margin: 0 }}>
                    {comment.body}
                  </p>
                </div>
                {canDeleteComment(comment.authorId) && (
                  <button
                    type="button"
                    className="app-link-button"
                    aria-label="Delete comment"
                    onClick={() => removeComment.mutate(comment.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            ))
          )}
        </div>
        <form
          onSubmit={submitComment}
          style={{ display: "flex", gap: 8, marginTop: 12 }}
        >
          <Input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment…"
          />
          <Button
            type="submit"
            variant="primary"
            size="large"
            disabled={addComment.isPending}
          >
            Comment
          </Button>
        </form>
      </div>

      <div className="input-wrap">
        <label className="input-label">Current Status</label>
        <div className="input app-modal-status-display">{columnName ?? ""}</div>
      </div>
    </Modal>
  );
}
