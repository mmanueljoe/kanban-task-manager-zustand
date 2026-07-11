import { useParams } from "react-router";
import type { BoardDTO } from "@kanban/shared";
import { useBoardContents } from "@/hooks/useBoardQueries";

type UseCurrentBoardResult = {
  boardId: string | null;
  board: BoardDTO | null;
  isPending: boolean;
};

// Reads the board id from the URL (/board/:boardId) and pulls the board from the
// shared board-contents query. Because Layout, Header, and BoardView all use
// that same query, React Query dedupes them into a single /full request.
export function useCurrentBoard(): UseCurrentBoardResult {
  const { boardId } = useParams<{ boardId?: string }>();
  const query = useBoardContents(boardId ?? "");

  return {
    boardId: boardId ?? null,
    board: boardId ? (query.data?.board ?? null) : null,
    isPending: Boolean(boardId) && query.isPending,
  };
}
