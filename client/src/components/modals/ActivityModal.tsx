import { useMemo } from "react";
import type { ActivityDTO } from "@kanban/shared";
import { Modal } from "@components/ui/Modal";
import { useActivity } from "@hooks/useActivityQueries";
import { useMembers } from "@hooks/useCollaboratorQueries";

type ActivityModalProps = {
  open: boolean;
  onClose: () => void;
  boardId: string;
};

function timeAgo(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function describe(
  activity: ActivityDTO,
  actor: string,
  nameById: Map<string, string>
): string {
  const d = activity.details;
  switch (activity.type) {
    case "TASK_CREATED":
      return `${actor} added "${d.taskTitle}" to ${d.column}`;
    case "TASK_MOVED":
      return `${actor} moved "${d.taskTitle}" to ${d.toColumn}`;
    case "TASK_UPDATED":
      return `${actor} edited "${d.taskTitle}"`;
    case "TASK_DELETED":
      return `${actor} deleted "${d.taskTitle}"`;
    case "TASK_ASSIGNED":
      return `${actor} assigned "${d.taskTitle}" to ${nameById.get(String(d.assigneeId)) ?? "a member"}`;
    case "COLUMN_CREATED":
      return `${actor} added the column "${d.columnName}"`;
    case "COLUMN_RENAMED":
      return `${actor} renamed "${d.previousName}" to "${d.columnName}"`;
    case "COLUMN_DELETED":
      return `${actor} deleted the column "${d.columnName}"`;
    case "BOARD_RENAMED":
      return `${actor} renamed the board to "${d.boardName}"`;
    case "MEMBER_INVITED":
      return `${actor} invited ${d.email} as ${String(d.role).toLowerCase()}`;
    case "MEMBER_ROLE_CHANGED":
      return `${actor} changed a member's role to ${String(d.role).toLowerCase()}`;
    case "MEMBER_REMOVED":
      return `${actor} removed a member`;
    default:
      return `${actor} updated the board`;
  }
}

export function ActivityModal({ open, onClose, boardId }: ActivityModalProps) {
  const { data: activities = [], isPending } = useActivity(boardId, open);
  const { data: members = [] } = useMembers(boardId);

  const nameById = useMemo(
    () => new Map(members.map((m) => [m.userId, m.name])),
    [members]
  );

  return (
    <Modal open={open} onClose={onClose} aria-label="Board activity">
      <h2 className="app-modal-title">Activity</h2>
      <div className="app-modal-section">
        {isPending ? (
          <p className="body-m">Loading activity…</p>
        ) : activities.length === 0 ? (
          <p className="body-m">No activity yet.</p>
        ) : (
          <ul
            className="app-modal-subtasks-list"
            style={{ maxHeight: 400, overflowY: "auto" }}
          >
            {activities.map((activity) => (
              <li
                key={activity.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "baseline",
                }}
              >
                <span className="body-m">
                  {describe(
                    activity,
                    nameById.get(activity.actorId) ?? "Someone",
                    nameById
                  )}
                </span>
                <span
                  className="body-s"
                  style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}
                >
                  {timeAgo(activity.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
