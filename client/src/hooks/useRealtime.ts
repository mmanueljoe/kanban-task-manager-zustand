import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { keys } from "@/lib/keys";

// Follow a board over the socket: on any event, refetch that board's live data.
// We invalidate rather than hand-patch — the same "server event → cache
// invalidation" bridge the optimistic mutations already rely on.
export function useBoardRealtime(boardId: string) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!boardId) return;
    const socket = getSocket();
    socket.emit("subscribe", boardId);

    const onEvent = () => {
      qc.invalidateQueries({ queryKey: ["columns"] }); // every column's tasks
      qc.invalidateQueries({ queryKey: [...keys.board(boardId), "full"] });
      qc.invalidateQueries({ queryKey: keys.activity(boardId) });
    };
    socket.on("board:event", onEvent);

    return () => {
      socket.emit("unsubscribe", boardId);
      socket.off("board:event", onEvent);
    };
  }, [boardId, qc]);
}

// Refresh the notification list the instant one arrives (replaces polling).
export function useNotificationRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const socket = getSocket();
    const refetch = () =>
      qc.invalidateQueries({ queryKey: keys.notifications() });
    socket.on("notification", refetch);
    // Anything broadcast while we were disconnected never reached us, so pull
    // the current state whenever the socket (re)connects.
    socket.on("connect", refetch);
    return () => {
      socket.off("notification", refetch);
      socket.off("connect", refetch);
    };
  }, [qc]);
}
