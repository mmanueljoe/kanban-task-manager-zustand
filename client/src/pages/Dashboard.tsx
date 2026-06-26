import { Link } from 'react-router';
import { memo } from 'react';
import { Button } from '@components/ui/Button';
import { useBoards } from '@/hooks/useBoards';

export const BoardCard = memo(function BoardCard({
  boardName,
  columnCount,
  index,
}: {
  boardName: string;
  columnCount: number;
  index: number;
}) {
  return (
    <Link to={`/board/${index}`} className="app-board-card">
      <span className="heading-m">{boardName}</span>
      <span className="body-l app-board-card-meta">{columnCount} columns</span>
    </Link>
  );
});

export function Dashboard() {
  const { boards } = useBoards();
  if (boards.length === 0) {
    return (
      <div className="app-main">
        <div className="app-empty-state">
          <h2 className="heading-m">No boards yet</h2>
          <p className="body-l">Create a board to get started.</p>
          <Button variant="primary" size="large" className="app-section-title">
            Create board (placeholder)
          </Button>
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
        {boards.map((board, index) => (
          <BoardCard
            key={board.name}
            boardName={board.name}
            columnCount={board.columns.length}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
