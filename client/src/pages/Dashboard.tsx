import { Link } from "react-router";
import { memo } from "react";
import { useBoards } from "@/hooks/useBoardQueries";

export const BoardCard = memo(function BoardCard({
  boardName,
  boardId,
}: {
  boardName: string;
  boardId: string;
}) {
  return (
    <Link to={`/board/${boardId}`} className="app-board-card">
      <span className="heading-m">{boardName}</span>
    </Link>
  );
});

export function Dashboard() {
  const { data: boards, isPending, isError } = useBoards();

  if (isPending) {
    return <div className="app-main">Loading boards…</div>;
  }

  if (isError) {
    return (
      <div className="app-main">
        <p className="body-l">Couldn't load your boards. Please try again.</p>
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <div className="app-main">
        <div className="app-empty-state">
          <h2 className="heading-m">No boards yet</h2>
          <p className="body-l">
            Create a board from the sidebar to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-main">
      <h1 className="heading-xl app-section-title">Dashboard</h1>
      <p className="body-l text-primary">
        Select a board from the sidebar or below.
      </p>
      <div className="app-stack-4 app-stack-4-margin-top">
        {boards.map((board) => (
          <BoardCard key={board.id} boardName={board.name} boardId={board.id} />
        ))}
      </div>
    </div>
  );
}
