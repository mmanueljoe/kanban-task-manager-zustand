import { useParams } from "react-router";
import type { BoardDTO } from "@kanban/shared";
import { useBoard } from "@/hooks/useBoardQueries";

type UseCurrentBoardResult = {
  boardId: string | null;
  board: BoardDTO | null;
  isPending: boolean;
};

// Reads the board id from the URL (/board/:boardId) and fetches that board.
// When there's no id in the route (e.g. the dashboard) the query stays disabled.
export function useCurrentBoard(): UseCurrentBoardResult {
  const { boardId } = useParams<{ boardId?: string }>();
  const query = useBoard(boardId ?? "");

  return {
    boardId: boardId ?? null,
    board: boardId ? (query.data ?? null) : null,
    isPending: Boolean(boardId) && query.isPending,
  };
}
