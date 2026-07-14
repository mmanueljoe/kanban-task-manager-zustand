import { useState, useRef, useEffect } from "react";
import type { NotificationDTO } from "@kanban/shared";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@hooks/useNotificationQueries";
import { useBoards } from "@hooks/useBoardQueries";
import { timeAgo } from "@/lib/time";

function describe(n: NotificationDTO, boardName: string): string {
  const d = n.details;
  switch (n.type) {
    case "TASK_ASSIGNED":
      return `You were assigned "${d.taskTitle}"`;
    case "COMMENT_ADDED":
      return `New comment on "${d.taskTitle}"`;
    case "MEMBER_INVITED":
      return `You were invited to ${boardName} as ${String(d.role).toLowerCase()}`;
    case "MEMBER_ROLE_CHANGED":
      return `Your role on ${boardName} changed to ${String(d.role).toLowerCase()}`;
    case "MEMBER_REMOVED":
      return `You were removed from ${boardName}`;
    default:
      return `Update on ${boardName}`;
  }
}

export function NotificationBell() {
  const { data: notifications = [] } = useNotifications();
  const { data: boards = [] } = useBoards();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const unread = notifications.filter((n) => !n.read).length;
  const boardName = (id: string) =>
    boards.find((b) => b.id === id)?.name ?? "a board";

  return (
    <div ref={ref} className="app-menu-anchor">
      <button
        type="button"
        aria-label={
          unread ? `Notifications, ${unread} unread` : "Notifications"
        }
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className="app-account-button"
        style={{ position: "relative" }}
      >
        <span aria-hidden="true">🔔</span>
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              minWidth: 16,
              height: 16,
              padding: "0 4px",
              borderRadius: 999,
              background: "var(--danger, #ea5555)",
              color: "#fff",
              fontSize: 10,
              lineHeight: "16px",
              fontWeight: 700,
            }}
          >
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div
          role="menu"
          className="app-menu-panel app-menu-panel--wide"
          style={{ width: 300, maxHeight: 420, overflowY: "auto" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "4px 8px",
            }}
          >
            <span className="input-label" style={{ margin: 0 }}>
              Notifications
            </span>
            {unread > 0 && (
              <button
                type="button"
                className="app-link-button"
                onClick={() => markAll.mutate()}
              >
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p
              className="body-s"
              style={{ padding: "4px 8px", color: "var(--text-muted)" }}
            >
              Nothing yet.
            </p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                role="menuitem"
                className="dropdown-option app-menu-item"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 2,
                  opacity: n.read ? 0.55 : 1,
                }}
                onClick={() => {
                  if (!n.read) markRead.mutate(n.id);
                }}
              >
                <span className="body-m">
                  {describe(n, boardName(n.boardId))}
                </span>
                <span className="body-s" style={{ color: "var(--text-muted)" }}>
                  {timeAgo(n.createdAt)}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
